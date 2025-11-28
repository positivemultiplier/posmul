/**
 * User Domain Entity (Shared Kernel)
 *
 * Core user entity with economic state management.
 * This is shared across all bounded contexts as part of the Shared Kernel.
 *
 * @author PosMul Development Team
 * @since 2025-07-06
 */
import { DomainEvent } from "../events/DomainEvent";
import { PmcSpentEvent, SpendPurpose } from "../events/PmcSpentEvent";
import { PmpEarnedEvent, RewardSource } from "../events/PmpEarnedEvent";
import { EconomicContext, EconomicRules } from "../rules/EconomicRules";

export interface UserProps {
  id: string;
  email: string;
  username: string;
  pmpBalance: number;
  pmcBalance: number;
  level: number;
  reputation: number;
  createdAt: Date;
  lastActiveAt: Date;
}

export class User {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: UserProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get username(): string {
    return this.props.username;
  }
  get pmpBalance(): number {
    return this.props.pmpBalance;
  }
  get pmcBalance(): number {
    return this.props.pmcBalance;
  }
  get level(): number {
    return this.props.level;
  }
  get reputation(): number {
    return this.props.reputation;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get lastActiveAt(): Date {
    return this.props.lastActiveAt;
  }

  /**
   * Earn PmpAmount from platform activities
   */
  earnPmp(
    source: RewardSource,
    economicContext: EconomicContext,
    actionContext?: Record<string, any>
  ): DomainEvent[] {
    const amount = EconomicRules.calculatePmpReward(
      { type: source, context: actionContext || {} },
      economicContext
    );

    this.props.pmpBalance += amount;
    this.updateActivityTimestamp();

    const event = new PmpEarnedEvent(this.id, amount, source, actionContext);

    this.domainEvents.push(event);
    return [event];
  }

  /**
   * Spend PmcAmount on platform activities
   */
  spendPmc(
    amount: number,
    purpose: SpendPurpose,
    targetId?: string,
    context?: Record<string, any>
  ): { success: boolean; events: DomainEvent[]; error?: string } {
    // Validate spending
    const validation = EconomicRules.validatePmcSpending(
      this.id,
      amount,
      purpose,
      this.pmcBalance,
      { userLevel: this.level, ...context }
    );

    if (!validation.valid) {
      return {
        success: false,
        events: [],
        error: validation.reason,
      };
    }

    // Execute spending
    this.props.pmcBalance -= amount;
    this.updateActivityTimestamp();

    const event = new PmcSpentEvent(
      this.id,
      amount,
      purpose,
      targetId,
      context
    );

    this.domainEvents.push(event);
    return {
      success: true,
      events: [event],
    };
  }

  /**
   * Convert PmpAmount to PmcAmount
   */
  convertPmpToPmc(
    pmpAmount: number,
    economicContext: EconomicContext
  ): { success: boolean; pmcReceived: number; events: DomainEvent[] } {
    if (this.pmpBalance < pmpAmount) {
      return {
        success: false,
        pmcReceived: 0,
        events: [],
      };
    }

    const conversionRate = EconomicRules.getPmpToPmcRate(economicContext);
    const pmcReceived = Math.floor(pmpAmount * conversionRate);

    this.props.pmpBalance -= pmpAmount;
    this.props.pmcBalance += pmcReceived;
    this.updateActivityTimestamp();

    // This could generate conversion events if needed
    return {
      success: true,
      pmcReceived,
      events: [],
    };
  }

  /**
   * Level up user based on accumulated PmpAmount
   */
  checkLevelUp(): DomainEvent[] {
    const newLevel = this.calculateLevel();
    if (newLevel > this.level) {
      this.props.level = newLevel;
      // Could generate LevelUpEvent here
    }
    return [];
  }

  /**
   * Get all pending domain events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  /**
   * Clear domain events (called after persistence)
   */
  markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  // Private methods

  private updateActivityTimestamp(): void {
    this.props.lastActiveAt = new Date();
  }

  private calculateLevel(): number {
    // Simple level calculation based on total PmpAmount earned
    // This could be more sophisticated
    const totalPmpEarned = this.pmpBalance + this.pmcBalance; // Simplified
    return Math.floor(totalPmpEarned / 1000) + 1;
  }

  /**
   * Create a new user instance
   */
  static create(id: string, email: string, username: string): User {
    const props: UserProps = {
      id,
      email,
      username,
      pmpBalance: 0,
      pmcBalance: 100, // Starting PmcAmount
      level: 1,
      reputation: 100, // Starting reputation
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    return new User(props);
  }
}
