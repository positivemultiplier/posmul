/**
 * Base Domain Event
 * 
 * All domain events must extend this base class to ensure
 * consistent event structure across all bounded contexts.
 * 
 * @author PosMul Development Team
 * @since 2025-07-06
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventVersion: number;

  constructor(aggregateId: string, eventVersion: number = 1) {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
    this.aggregateId = aggregateId;
    this.eventVersion = eventVersion;
  }

  /**
   * Event type identifier for routing and handling
   */
  abstract get eventType(): string;

  /**
   * Serialize event for storage or transmission
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
      payload: this.getPayload(),
    };
  }

  /**
   * Get event-specific payload data
   */
  protected abstract getPayload(): Record<string, any>;
}
