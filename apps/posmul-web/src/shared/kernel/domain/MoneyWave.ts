/**
 * Money Wave Domain Entity (Shared Kernel)
 *
 * Core money wave entity that affects economic context across all domains.
 * Part of the Shared Kernel for cross-domain economic integration.
 *
 * @author PosMul Development Team
 * @since 2025-07-06
 */
import { DomainEvent } from "../events/DomainEvent";
import {
  MoneyWaveCategory,
  MoneyWaveCreatedEvent,
} from "../events/MoneyWaveCreatedEvent";

export interface MoneyWaveProps {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: MoneyWaveCategory;
  multiplier: number;
  startTime: Date;
  endTime: Date;
  status: MoneyWaveStatus;
  participantCount: number;
  createdAt: Date;
}

export type MoneyWaveStatus =
  | "pending" // Created but not yet active
  | "active" // Currently running
  | "completed" // Target reached
  | "expired" // Time limit reached
  | "cancelled"; // Manually cancelled

export class MoneyWave {
  private domainEvents: DomainEvent[] = [];

  constructor(private props: MoneyWaveProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get creatorId(): string {
    return this.props.creatorId;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string {
    return this.props.description;
  }
  get targetAmount(): number {
    return this.props.targetAmount;
  }
  get currentAmount(): number {
    return this.props.currentAmount;
  }
  get category(): MoneyWaveCategory {
    return this.props.category;
  }
  get multiplier(): number {
    return this.props.multiplier;
  }
  get startTime(): Date {
    return this.props.startTime;
  }
  get endTime(): Date {
    return this.props.endTime;
  }
  get status(): MoneyWaveStatus {
    return this.props.status;
  }
  get participantCount(): number {
    return this.props.participantCount;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Activate the money wave (start the economic effect)
   */
  activate(): DomainEvent[] {
    if (this.props.status !== "pending") {
      throw new Error("Money wave can only be activated from pending status");
    }

    this.props.status = "active";
    this.props.startTime = new Date();

    // Money wave activation could generate additional events
    return [];
  }

  /**
   * Add contribution to the money wave
   */
  addContribution(amount: number, contributorId: string): DomainEvent[] {
    if (this.props.status !== "active") {
      throw new Error("Cannot contribute to inactive money wave");
    }

    this.props.currentAmount += amount;
    this.props.participantCount += 1;

    // Check if target is reached
    if (this.props.currentAmount >= this.props.targetAmount) {
      this.props.status = "completed";
    }

    return [];
  }

  /**
   * Check if money wave has expired
   */
  checkExpiration(): DomainEvent[] {
    if (this.props.status === "active" && new Date() > this.props.endTime) {
      this.props.status = "expired";
      return [];
    }
    return [];
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    return Math.min(
      100,
      (this.props.currentAmount / this.props.targetAmount) * 100
    );
  }

  /**
   * Check if money wave is currently affecting economic context
   */
  isActive(): boolean {
    return this.props.status === "active" && new Date() <= this.props.endTime;
  }

  /**
   * Get economic multiplier effect for this money wave
   */
  getEconomicMultiplier(): number {
    if (!this.isActive()) return 1.0;

    // Multiplier can vary based on completion, time remaining, etc.
    const baseMultiplier = this.props.multiplier;
    const completionBonus = (this.getCompletionPercentage() / 100) * 0.2; // Up to 20% bonus

    return baseMultiplier + completionBonus;
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

  /**
   * Create a new money wave instance
   */
  static create(
    id: string,
    creatorId: string,
    title: string,
    description: string,
    targetAmount: number,
    category: MoneyWaveCategory,
    durationHours: number,
    multiplier: number = 1.2
  ): { moneyWave: MoneyWave; events: DomainEvent[] } {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const props: MoneyWaveProps = {
      id,
      creatorId,
      title,
      description,
      targetAmount,
      currentAmount: 0,
      category,
      multiplier,
      startTime: now,
      endTime,
      status: "pending",
      participantCount: 0,
      createdAt: now,
    };

    const moneyWave = new MoneyWave(props);

    const createdEvent = new MoneyWaveCreatedEvent(
      id,
      creatorId,
      title,
      description,
      targetAmount,
      category,
      durationHours
    );

    moneyWave.domainEvents.push(createdEvent);

    return {
      moneyWave,
      events: [createdEvent],
    };
  }
}
