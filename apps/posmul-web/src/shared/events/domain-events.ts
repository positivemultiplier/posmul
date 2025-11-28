/**
 * 도메인 이벤트 기본 인터페이스 및 구현
 */
import {
  BaseDomainEvent,
  DomainEvent,
  EventBus,
  EventHandler,
  EventTypes,
} from "@posmul/auth-economy-sdk/types";

// 특정 이벤트 타입들 (아직 SDK에 없는 것들)
// TODO: 이후 SDK로 이관 예정
export interface PmcEarnedEvent extends DomainEvent {
  type: typeof EventTypes.PmcAmount_EARNED;
}

export interface PmcSpentEvent extends DomainEvent {
  type: typeof EventTypes.PmcAmount_SPENT;
}

export interface PmpEarnedEvent extends DomainEvent {
  type: typeof EventTypes.PmpAmount_EARNED;
}

export interface PmpSpentEvent extends DomainEvent {
  type: typeof EventTypes.PmpAmount_SPENT;
}

export interface PointsEarnedEvent extends DomainEvent {
  type: typeof EventTypes.POINTS_EARNED;
}

export interface PredictionGameCreatedEvent extends DomainEvent {
  type: typeof EventTypes.PREDICTION_GAME_CREATED;
}

export interface UserCreatedEvent extends DomainEvent {
  type: typeof EventTypes.USER_CREATED;
}

// 메모리 기반 이벤트 버스 구현 (앱 전용)
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.type) || [];
    await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers
      .get(eventType)!
      .push(handler as unknown as EventHandler<DomainEvent>);
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(
        handler as unknown as EventHandler<DomainEvent>
      );
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// 글로벌 이벤트 버스 인스턴스 (앱 전용 편의 API)
export const globalEventBus = new InMemoryEventBus();
export const publishEvent = async (event: DomainEvent): Promise<void> => {
  await globalEventBus.publish(event);
};
export const subscribeToEvent = <T extends DomainEvent>(
  eventType: string,
  handler: EventHandler<T>
): void => {
  globalEventBus.subscribe(eventType, handler);
};

// 공통 타입 재수출
export type {
  DomainEvent,
  EventBus,
  EventHandler,
} from "@posmul/auth-economy-sdk/types";

export { BaseDomainEvent, EventTypes } from "@posmul/auth-economy-sdk/types";
