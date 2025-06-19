/**
 * 도메인 이벤트 기본 인터페이스 및 구현
 */

import { DomainEvent } from '../types/common';

// 기본 도메인 이벤트 추상 클래스
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
    this.id = crypto.randomUUID();
    this.type = type;
    this.aggregateId = aggregateId;
    this.data = data;
    this.version = version;
    this.timestamp = new Date();
  }
}

// 이벤트 핸들러 인터페이스
export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// 이벤트 버스 인터페이스
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
}

// 메모리 기반 이벤트 버스 구현 (개발용)
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.type) || [];
    
    // 모든 핸들러를 병렬로 실행
    await Promise.all(
      eventHandlers.map(handler => handler.handle(event))
    );
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler as EventHandler<DomainEvent>);
  }
}

// 글로벌 이벤트 버스 인스턴스 (싱글톤)
export const globalEventBus = new InMemoryEventBus();

// 이벤트 발행 헬퍼 함수
export const publishEvent = async (event: DomainEvent): Promise<void> => {
  await globalEventBus.publish(event);
};

// 이벤트 구독 헬퍼 함수
export const subscribeToEvent = <T extends DomainEvent>(
  eventType: string,
  handler: EventHandler<T>
): void => {
  globalEventBus.subscribe(eventType, handler);
};

// 일반적인 도메인 이벤트 타입들
export const EventTypes = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  
  PREDICTION_GAME_CREATED: 'PREDICTION_GAME_CREATED',
  PREDICTION_GAME_STARTED: 'PREDICTION_GAME_STARTED',
  PREDICTION_GAME_ENDED: 'PREDICTION_GAME_ENDED',
  
  PREDICTION_CREATED: 'PREDICTION_CREATED',
  PREDICTION_UPDATED: 'PREDICTION_UPDATED',
  
  POINTS_EARNED: 'POINTS_EARNED',
  POINTS_SPENT: 'POINTS_SPENT',
  POINTS_TRANSFERRED: 'POINTS_TRANSFERRED',
  
  LOCAL_LEAGUE_TRANSACTION: 'LOCAL_LEAGUE_TRANSACTION',
  MAJOR_LEAGUE_VIEW: 'MAJOR_LEAGUE_VIEW',
  
  STORE_REGISTERED: 'STORE_REGISTERED',
  STORE_UPDATED: 'STORE_UPDATED',
} as const;

// 구체적인 도메인 이벤트 예시들
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(userId: string, userData: Record<string, unknown>) {
    super(EventTypes.USER_CREATED, userId, userData);
  }
}

export class PointsEarnedEvent extends BaseDomainEvent {
  constructor(
    userId: string, 
    pointData: { 
      amount: number; 
      type: 'PMC' | 'PMP'; 
      source: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(EventTypes.POINTS_EARNED, userId, pointData);
  }
}

export class PredictionGameCreatedEvent extends BaseDomainEvent {
  constructor(gameId: string, gameData: Record<string, unknown>) {
    super(EventTypes.PREDICTION_GAME_CREATED, gameId, gameData);
  }
}
