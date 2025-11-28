import { DomainEvent } from "@posmul/auth-economy-sdk";

import { publishEvent } from "../events/domain-events";
import { Entity } from "./entity";

export abstract class AggregateRoot<T> extends Entity<T> {
  private readonly _domainEvents: DomainEvent[] = [];

  protected constructor(id: T) {
    super(id);
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents.length = 0;
  }

  public async dispatchEvents(): Promise<void> {
    for (const event of this._domainEvents) {
      await publishEvent(event);
    }
    this.clearEvents();
  }
}
