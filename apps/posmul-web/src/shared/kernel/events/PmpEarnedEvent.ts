import { DomainEvent } from './DomainEvent';

/**
 * PmpAmount Earned Event
 * 
 * Fired when a user earns PmpAmount (PosMul Points) from any activity
 * across the platform (predictions, donations, investments, etc.)
 * 
 * @author PosMul Development Team
 * @since 2025-07-06
 */

export interface PmpEarnedEventPayload {
  userId: string;
  amount: number;
  source: RewardSource;
  context?: Record<string, any>;
}

export type RewardSource = 
  | 'prediction_success'
  | 'prediction_participation'
  | 'donation_milestone'
  | 'investment_return'
  | 'forum_contribution'
  | 'money_wave_creation'
  | 'referral_bonus'
  | 'daily_bonus';

export class PmpEarnedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly source: RewardSource,
    public readonly context?: Record<string, any>
  ) {
    super(userId);
  }

  get eventType(): string {
    return 'PmpEarnedEvent';
  }

  protected getPayload(): PmpEarnedEventPayload {
    return {
      userId: this.userId,
      amount: this.amount,
      source: this.source,
      context: this.context,
    };
  }
}
