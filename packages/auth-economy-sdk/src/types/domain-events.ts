/**
 * Domain Events for Auth-Economy SDK
 */

import { randomUUID } from 'crypto';

// Type-only import to avoid runtime circular deps; Result is re-exported from index.ts
import type { Result } from './index';

// Error types used in Result wrapping
import { PublishError, HandlerError } from '../errors';

// === 기본 도메인 이벤트 인터페이스 ===
export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly data: Record<string, unknown>;
  readonly version: number;
  readonly timestamp: Date;
}

// === 기본 도메인 이벤트 추상 클래스 ===
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    type: string,
    aggregateId: string,
    data: Record<string, unknown>,
    version: number = 1
  ) {
    this.id = randomUUID();
    this.type = type;
    this.aggregateId = aggregateId;
    this.data = data;
    this.version = version;
    this.timestamp = new Date();
  }
}

// === 이벤트 핸들러 인터페이스 ===
export interface EventHandler<T extends DomainEvent> {
  /**
   * Handle a single domain event.
   *
   * Returns a Result pattern object to standardise error handling across the
   * application codebase. Using the Result type ensures that consumers can
   * discriminate success/failure without relying on exceptions.
   */
  handle(event: T): Promise<Result<void, HandlerError>>;
}

// === 이벤트 버스 인터페이스 ===
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
}

// === 이벤트 타입 열거형 ===
export enum EventTypes {
  // 사용자 관련
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  
  // 경제 시스템 관련
  PMP_EARNED = 'economy.pmp.earned',
  PMP_SPENT = 'economy.pmp.spent',
  PMC_EARNED = 'economy.pmc.earned',
  PMC_SPENT = 'economy.pmc.spent',
  POINTS_EARNED = 'economy.points.earned',
  
  // 예측 게임 관련
  PREDICTION_GAME_CREATED = 'prediction.game.created',
  PREDICTION_GAME_STARTED = 'prediction.game.started',
  PREDICTION_GAME_ENDED = 'prediction.game.ended',
}

// === 도메인 이벤트 발행자 인터페이스 ===
export interface IDomainEventPublisher {
  /**
   * Publish a single domain event.
   *
   * The Result wrapper makes it explicit whether the publish operation
   * succeeded (`success: true`) or failed (`success: false`).
   */
  publish<T extends DomainEvent>(event: T): Promise<Result<void, PublishError>>;

  /**
   * Publish multiple domain events atomically / in batch.
   */
  publishMany?<T extends DomainEvent>(events: T[]): Promise<Result<void, PublishError>>;

  /**
   * Legacy alias kept for backward compatibility. Will be removed in Phase 4.
   */
  publishBatch?<T extends DomainEvent>(events: T[]): Promise<Result<void, PublishError>>;
}

// === 도메인 이벤트 구독자 인터페이스 ===
export interface IDomainEventSubscriber<T extends DomainEvent = DomainEvent> {
  eventType: string;
  /**
   * Handle an incoming domain event.
   */
  handle(event: T): Promise<Result<void, HandlerError>>;
}

// === Base Entity with Domain Events ===
export abstract class BaseEntity<T extends { updatedAt?: Date }> {
  public readonly props: T;
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: T) {
    this.props = props;
  }

  protected touch(): void {
    if (this.props.updatedAt instanceof Date) {
      this.props.updatedAt = new Date();
    }
  }

  public get propsAsJson(): T {
    return this.props;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  public getUncommittedEvents(): readonly DomainEvent[] {
    return this._domainEvents;
  }
}

// === 경제 시스템 이벤트들 ===
export class PmpEarnedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      EventTypes.PMP_EARNED,
      userId,
      { userId, amount, reason, ...metadata }
    );
  }
}

export class PmpSpentEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      EventTypes.PMP_SPENT,
      userId,
      { userId, amount, reason, ...metadata }
    );
  }
}

export class PmcEarnedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      EventTypes.PMC_EARNED,
      userId,
      { userId, amount, reason, ...metadata }
    );
  }
}

export class PmcSpentEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ) {
    super(
      EventTypes.PMC_SPENT,
      userId,
      { userId, amount, reason, ...metadata }
    );
  }
}
