/**
 * Event Bus (Shared Kernel)
 *
 * Simple in-memory event bus for handling domain events
 * across bounded contexts. In production, this could be
 * replaced with a more sophisticated event infrastructure.
 *
 * @author PosMul Development Team
 * @since 2025-07-06
 */
import { DomainEvent } from "./DomainEvent";

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => Promise<void> | void;

export interface EventHandlerRegistration {
  eventType: string;
  handler: EventHandler;
  priority?: number; // Lower numbers = higher priority
}

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<string, EventHandlerRegistration[]>();
  private isProcessing = false;
  private eventQueue: DomainEvent[] = [];

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Register an event handler for a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    priority: number = 100
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const registration: EventHandlerRegistration = {
      eventType,
      handler: handler as EventHandler,
      priority,
    };

    const existingHandlers = this.handlers.get(eventType)!;
    existingHandlers.push(registration);

    // Sort by priority (lower numbers first)
    existingHandlers.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  /**
   * Unregister an event handler
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex((h) => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Publish a single event
   */
  async publish(event: DomainEvent): Promise<void> {
    this.eventQueue.push(event);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Publish multiple events
   */
  async publishMany(events: DomainEvent[]): Promise<void> {
    this.eventQueue.push(...events);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process the event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.handleEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Handle a single event
   */
  private async handleEvent(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    // Execute handlers in priority order
    for (const registration of handlers) {
      try {
        await registration.handler(event);
      } catch (error) {
        // Log error but don't stop processing other handlers
        void error;
      }
    }
  }

  /**
   * Get statistics about registered handlers
   */
  getStats(): { eventType: string; handlerCount: number }[] {
    return Array.from(this.handlers.entries()).map(([eventType, handlers]) => ({
      eventType,
      handlerCount: handlers.length,
    }));
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

/**
 * Decorator for marking methods as event handlers
 */
export function EventHandler(eventType: string, priority?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // This could be used with a DI container to auto-register handlers
    // For now, it's just a marker
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args);
    };

    // Store metadata about the event handler
    if (!target.constructor._eventHandlers) {
      target.constructor._eventHandlers = [];
    }

    target.constructor._eventHandlers.push({
      method: propertyKey,
      eventType,
      priority,
    });
  };
}
