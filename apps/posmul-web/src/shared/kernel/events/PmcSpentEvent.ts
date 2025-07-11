import { DomainEvent } from './DomainEvent';

/**
 * PmcAmount Spent Event
 * 
 * Fired when a user spends PmcAmount (PosMul Currency) on platform activities
 * (predictions, donations, investments, etc.)
 * 
 * @author PosMul Development Team
 * @since 2025-07-06
 */

export interface PmcSpentEventPayload {
  userId: string;
  amount: number;
  purpose: SpendPurpose;
  targetId?: string;
  context?: Record<string, any>;
}

export type SpendPurpose = 
  | 'prediction_entry'
  | 'prediction_stake_increase'
  | 'donation_contribution'
  | 'investment_purchase'
  | 'money_wave_boost'
  | 'premium_feature'
  | 'vote_weight_increase';

export class PmcSpentEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly purpose: SpendPurpose,
    public readonly targetId?: string,
    public readonly context?: Record<string, any>
  ) {
    super(userId);
  }

  get eventType(): string {
    return 'PmcSpentEvent';
  }

  protected getPayload(): PmcSpentEventPayload {
    return {
      userId: this.userId,
      amount: this.amount,
      purpose: this.purpose,
      targetId: this.targetId,
      context: this.context,
    };
  }
}
