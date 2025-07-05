/**
 * Domain Event Publisher Implementation
 *
 * Event-driven Architecture의 중심 컴포넌트로, 모든 도메인 이벤트의 발행을 담당합니다.
 * Clean Architecture 원칙에 따라 Domain Layer에서 Infrastructure Layer로의 의존성 역전을 구현합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
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
export declare class PublishError extends Error {
    readonly cause?: Error | undefined;
    readonly eventType?: string | undefined;
    constructor(message: string, cause?: Error | undefined, eventType?: string | undefined);
}
/**
 * 이벤트 핸들러 오류
 */
export declare class HandlerError extends Error {
    readonly cause?: Error | undefined;
    readonly subscriberId?: string | undefined;
    constructor(message: string, cause?: Error | undefined, subscriberId?: string | undefined);
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
    getEventStream(aggregateId: string, fromVersion?: number): Promise<Result<DomainEvent[], Error>>;
    /**
     * 이벤트 타입별 조회
     */
    getEventsByType(eventType: string, limit?: number): Promise<Result<DomainEvent[], Error>>;
}
/**
 * 메모리 기반 이벤트 발행자 (개발 및 테스트용)
 */
export declare class InMemoryEventPublisher implements IDomainEventPublisher {
    private subscribers;
    private eventStore;
    private isShutdown;
    /**
     * 구독자 등록
     */
    subscribe<T extends DomainEvent>(subscriber: IDomainEventSubscriber<T>): void;
    /**
     * 구독자 해제
     */
    unsubscribe(eventType: string, subscriberId: string): void;
    /**
     * 단일 이벤트 발행
     */
    publish(event: DomainEvent): Promise<Result<void, PublishError>>;
    /**
     * 다중 이벤트 발행
     */
    publishBatch(events: DomainEvent[]): Promise<Result<void, PublishError>>;
    /**
     * 발행자 상태 확인
     */
    isHealthy(): Promise<boolean>;
    /**
     * 발행자 정리
     */
    shutdown(): void;
    /**
     * 저장된 이벤트 조회 (테스트용)
     */
    getStoredEvents(): DomainEvent[];
    /**
     * 구독자 현황 조회 (디버깅용)
     */
    getSubscriberStats(): Record<string, number>;
}
/**
 * Supabase 기반 이벤트 발행자 (프로덕션용)
 */
export declare class SupabaseEventPublisher implements IDomainEventPublisher {
    private eventStore;
    private subscribers;
    constructor(eventStore: IEventStore);
    /**
     * 구독자 등록
     */
    subscribe<T extends DomainEvent>(subscriber: IDomainEventSubscriber<T>): void;
    /**
     * 단일 이벤트 발행
     */
    publish(event: DomainEvent): Promise<Result<void, PublishError>>;
    /**
     * 다중 이벤트 발행
     */
    publishBatch(events: DomainEvent[]): Promise<Result<void, PublishError>>;
    /**
     * 발행자 상태 확인
     */
    isHealthy(): Promise<boolean>;
}
/**
 * 글로벌 이벤트 발행자 (싱글톤)
 */
export declare const globalEventPublisher: InMemoryEventPublisher;
/**
 * 이벤트 발행 헬퍼 함수
 */
export declare const publishDomainEvent: (event: DomainEvent) => Promise<Result<void, PublishError>>;
/**
 * 배치 이벤트 발행 헬퍼 함수
 */
export declare const publishDomainEvents: (events: DomainEvent[]) => Promise<Result<void, PublishError>>;
/**
 * 구독 헬퍼 함수
 */
export declare const subscribeToDomainEvent: <T extends DomainEvent>(subscriber: IDomainEventSubscriber<T>) => void;
