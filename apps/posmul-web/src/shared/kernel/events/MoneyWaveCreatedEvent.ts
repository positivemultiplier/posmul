import { DomainEvent } from "./DomainEvent";

/**
 * Money Wave Created Event
 *
 * Fired when a new Money Wave is created, affecting the economic
 * context across all domains in the platform.
 *
 * @author PosMul Development Team
 * @since 2025-07-06
 */

export interface MoneyWaveCreatedEventPayload {
  moneyWaveId: string;
  creatorId: string;
  title: string;
  description: string;
  targetAmount: number;
  category: MoneyWaveCategory;
  duration: number; // in hours
  context?: Record<string, any>;
}

export type MoneyWaveCategory =
  | "local_economy"
  | "social_cause"
  | "technology_innovation"
  | "environmental"
  | "education"
  | "healthcare"
  | "cultural_arts"
  | "sports_events";

export class MoneyWaveCreatedEvent extends DomainEvent {
  constructor(
    public readonly moneyWaveId: string,
    public readonly creatorId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly targetAmount: number,
    public readonly category: MoneyWaveCategory,
    public readonly duration: number,
    public readonly context?: Record<string, any>
  ) {
    super(moneyWaveId);
  }

  get eventType(): string {
    return "MoneyWaveCreatedEvent";
  }

  protected getPayload(): MoneyWaveCreatedEventPayload {
    return {
      moneyWaveId: this.moneyWaveId,
      creatorId: this.creatorId,
      title: this.title,
      description: this.description,
      targetAmount: this.targetAmount,
      category: this.category,
      duration: this.duration,
      context: this.context,
    };
  }
}
