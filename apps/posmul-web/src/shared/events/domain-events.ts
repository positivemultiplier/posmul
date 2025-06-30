/**
 * 도메인 이벤트 기본 인터페이스 및 구현
 */

import {
  BaseDomainEvent,
  DomainEvent,
  EventBus,
  EventHandler,
  EventTypes,
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
  PointsEarnedEvent,
  PredictionGameCreatedEvent,
  UserCreatedEvent,
} from "@posmul/shared-types";

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

export type { DomainEvent, EventBus, EventHandler };

export {
  BaseDomainEvent,
  EventTypes,
  PmcEarnedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
  PointsEarnedEvent,
  PredictionGameCreatedEvent,
  UserCreatedEvent,
};
