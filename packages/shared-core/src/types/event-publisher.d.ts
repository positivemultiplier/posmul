/**
 * Domain Event Publisher Implementation
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import type { DomainEvent } from "./domain-events";
import type { Result } from "./errors";
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
