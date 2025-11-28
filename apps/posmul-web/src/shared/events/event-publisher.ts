/**
 * Domain Event Publisher Implementation
 *
 * Event-driven Architecture의 중심 컴포넌트로, 모든 도메인 이벤트의 발행을 담당합니다.
 * Clean Architecture 원칙에 따라 Domain Layer에서 Infrastructure Layer로의 의존성 역전을 구현합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { isFailure } from "@posmul/auth-economy-sdk";

import { DomainEvent, Result } from "../types/common";

/**
 * 도메인 이벤트 발행자 인터페이스
 */
export interface IDomainEventPublisher {
  /**
   * 단일 이벤트 발행
   */
  publish(event: DomainEvent): Promise<Result<void, PublishError>>;

  /**
   * 다중 이벤트 발행 (배치 처리)
   */
  publishBatch(events: DomainEvent[]): Promise<Result<void, PublishError>>;

  /**
   * 이벤트 발행 상태 확인
   */
  isHealthy(): Promise<boolean>;
}

/**
 * 도메인 이벤트 구독자 인터페이스
 */
export interface IDomainEventSubscriber<T extends DomainEvent> {
  /**
   * 구독할 이벤트 타입
   */
  readonly eventType: string;

  /**
   * 이벤트 처리 메서드
   */
  handle(event: T): Promise<Result<void, HandlerError>>;

  /**
   * 구독자 식별자
   */
  readonly subscriberId: string;
}

/**
 * 이벤트 발행 오류
 */
export class PublishError extends Error {
  public readonly code: string;

  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly eventType?: string,
    code: string = "PUBLISH_ERROR"
  ) {
    super(message);
    this.name = "PublishError";
    this.code = code;
  }
}

/**
 * 이벤트 핸들러 오류
 */
export class HandlerError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly subscriberId?: string
  ) {
    super(message);
    this.name = "HandlerError";
  }
}

/**
 * 이벤트 스토어 인터페이스
 */
export interface IEventStore {
  /**
   * 이벤트 저장
   */
  store(event: DomainEvent): Promise<Result<void, Error>>;

  /**
   * 이벤트 스트림 조회
   */
  getEventStream(
    aggregateId: string,
    fromVersion?: number
  ): Promise<Result<DomainEvent[], Error>>;

  /**
   * 이벤트 타입별 조회
   */
  getEventsByType(
    eventType: string,
    limit?: number
  ): Promise<Result<DomainEvent[], Error>>;
}

/**
 * 메모리 기반 이벤트 발행자 (개발 및 테스트용)
 */
export class InMemoryEventPublisher implements IDomainEventPublisher {
  private subscribers: Map<string, IDomainEventSubscriber<DomainEvent>[]> =
    new Map();
  private eventStore: DomainEvent[] = [];
  private isShutdown = false;

  /**
   * 구독자 등록
   */
  subscribe<T extends DomainEvent>(
    subscriber: IDomainEventSubscriber<T>
  ): void {
    if (!this.subscribers.has(subscriber.eventType)) {
      this.subscribers.set(subscriber.eventType, []);
    }

    this.subscribers
      .get(subscriber.eventType)!
      .push(subscriber as IDomainEventSubscriber<DomainEvent>);
  }

  /**
   * 구독자 해제
   */
  unsubscribe(eventType: string, subscriberId: string): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      const filtered = subscribers.filter(
        (s) => s.subscriberId !== subscriberId
      );
      this.subscribers.set(eventType, filtered);
    }
  }

  /**
   * 단일 이벤트 발행
   */
  async publish(event: DomainEvent): Promise<Result<void, PublishError>> {
    try {
      if (this.isShutdown) {
        return {
          success: false,
          error: new PublishError("Event publisher is shutdown"),
        };
      }

      // 이벤트 저장
      this.eventStore.push(event);

      // 구독자들에게 이벤트 전달
      const subscribers = this.subscribers.get(event.type) || [];

      // 모든 구독자에게 병렬로 이벤트 전달
      const results = await Promise.allSettled(
        subscribers.map(async (subscriber) => {
          try {
            const result = await subscriber.handle(event);
            if (!result.success) {
              console.error(
                `Handler error for ${subscriber.subscriberId}:`,
                isFailure(result) ? result.error : undefined
              );
            }
            return result;
          } catch (error) {
            console.error(
              `Unexpected error in handler ${subscriber.subscriberId}:`,
              error
            );
            throw error;
          }
        })
      );

      // 실패한 핸들러들 체크
      const failedResults = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      if (failedResults.length > 0) {
        console.warn(
          `${failedResults.length} handlers failed for event ${event.type}`
        );
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new PublishError(
          "Invalid state",
          error instanceof Error ? error : undefined,
          event.type
        ),
      };
    }
  }

  /**
   * 다중 이벤트 발행
   */
  async publishBatch(
    events: DomainEvent[]
  ): Promise<Result<void, PublishError>> {
    try {
      const results = await Promise.allSettled(
        events.map((event) => this.publish(event))
      );

      const failedResults = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && !result.value.success)
      );

      if (failedResults.length > 0) {
        return {
          success: false,
          error: new PublishError(
            `Batch publish failed: ${failedResults.length}/${events.length} events failed`
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new PublishError(
          "Invalid state",
          error instanceof Error ? error : undefined
        ),
      };
    }
  }

  /**
   * 발행자 상태 확인
   */
  async isHealthy(): Promise<boolean> {
    return !this.isShutdown;
  }

  /**
   * 발행자 정리
   */
  shutdown(): void {
    this.isShutdown = true;
    this.subscribers.clear();
  }

  /**
   * 저장된 이벤트 조회 (테스트용)
   */
  getStoredEvents(): DomainEvent[] {
    return [...this.eventStore];
  }

  /**
   * 구독자 현황 조회 (디버깅용)
   */
  getSubscriberStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.subscribers.forEach((subscribers, eventType) => {
      stats[eventType] = subscribers.length;
    });
    return stats;
  }
}

/**
 * Supabase 기반 이벤트 발행자 (프로덕션용)
 */
export class SupabaseEventPublisher implements IDomainEventPublisher {
  private subscribers: Map<string, IDomainEventSubscriber<DomainEvent>[]> =
    new Map();

  constructor(private eventStore: IEventStore) {}

  /**
   * 구독자 등록
   */
  subscribe<T extends DomainEvent>(
    subscriber: IDomainEventSubscriber<T>
  ): void {
    if (!this.subscribers.has(subscriber.eventType)) {
      this.subscribers.set(subscriber.eventType, []);
    }

    this.subscribers
      .get(subscriber.eventType)!
      .push(subscriber as IDomainEventSubscriber<DomainEvent>);
  }

  /**
   * 단일 이벤트 발행
   */
  async publish(event: DomainEvent): Promise<Result<void, PublishError>> {
    try {
      // 1. 이벤트 저장
      const storeResult = await this.eventStore.store(event);
      if (!storeResult.success) {
        return {
          success: false,
          error: new PublishError(
            "Invalid state",
            isFailure(storeResult) ? storeResult.error : undefined,
            event.type
          ),
        };
      }

      // 2. 구독자들에게 이벤트 전달
      const subscribers = this.subscribers.get(event.type) || [];

      const results = await Promise.allSettled(
        subscribers.map((subscriber) => subscriber.handle(event))
      );

      // 실패한 핸들러들 로깅 (프로덕션에서는 실패해도 계속 진행)
      const failedCount = results.filter(
        (result) =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && !result.value.success)
      ).length;

      if (failedCount > 0) {
        console.warn(
          `${failedCount}/${subscribers.length} handlers failed for event ${event.type}`
        );
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new PublishError(
          "Invalid state",
          error instanceof Error ? error : undefined,
          event.type
        ),
      };
    }
  }

  /**
   * 다중 이벤트 발행
   */
  async publishBatch(
    events: DomainEvent[]
  ): Promise<Result<void, PublishError>> {
    // TODO: 트랜잭션 지원 구현
    const results = await Promise.allSettled(
      events.map((event) => this.publish(event))
    );

    const failedResults = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && !result.value.success)
    );

    if (failedResults.length > 0) {
      return {
        success: false,
        error: new PublishError(
          `Batch publish failed: ${failedResults.length}/${events.length} events failed`
        ),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * 발행자 상태 확인
   */
  async isHealthy(): Promise<boolean> {
    // TODO: 데이터베이스 연결 상태 확인
    return true;
  }
}

/**
 * 글로벌 이벤트 발행자 (싱글톤)
 */
export const globalEventPublisher = new InMemoryEventPublisher();

/**
 * 이벤트 발행 헬퍼 함수
 */
export const publishDomainEvent = async (
  event: DomainEvent
): Promise<Result<void, PublishError>> => {
  return await globalEventPublisher.publish(event);
};

/**
 * 배치 이벤트 발행 헬퍼 함수
 */
export const publishDomainEvents = async (
  events: DomainEvent[]
): Promise<Result<void, PublishError>> => {
  return await globalEventPublisher.publishBatch(events);
};

/**
 * 구독 헬퍼 함수
 */
export const subscribeToDomainEvent = <T extends DomainEvent>(
  subscriber: IDomainEventSubscriber<T>
): void => {
  globalEventPublisher.subscribe(subscriber);
};
