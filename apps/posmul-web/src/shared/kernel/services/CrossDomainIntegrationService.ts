/**
 * Cross-Domain Integration Service
 *
 * Example of how bounded contexts can integrate through
 * the Shared Kernel and domain events.
 *
 * @author PosMul Development Team
 * @since 2025-07-06
 */
import {
  EventBus,
  MoneyWave,
  MoneyWaveCreatedEvent,
  PmcSpentEvent,
  PmpEarnedEvent,
  User,
} from "../index";

export class CrossDomainIntegrationService {
  private eventBus = EventBus.getInstance();

  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Handle PmpAmount earned events to update user statistics
    this.eventBus.subscribe<PmpEarnedEvent>(
      "PmpEarnedEvent",
      this.handlePmpEarned.bind(this),
      10 // High priority
    );

    // Handle PmcAmount spent events for analytics
    this.eventBus.subscribe<PmcSpentEvent>(
      "PmcSpentEvent",
      this.handlePmcSpent.bind(this),
      20
    );

    // Handle money wave creation for platform-wide notifications
    this.eventBus.subscribe<MoneyWaveCreatedEvent>(
      "MoneyWaveCreatedEvent",
      this.handleMoneyWaveCreated.bind(this),
      15
    );
  }

  /**
   * Handle PmpAmount earned events
   */
  private async handlePmpEarned(event: PmpEarnedEvent): Promise<void> {
    void event;
  }

  /**
   * Handle PmcAmount spent events
   */
  private async handlePmcSpent(event: PmcSpentEvent): Promise<void> {
    void event;
  }

  /**
   * Handle money wave creation events
   */
  private async handleMoneyWaveCreated(
    event: MoneyWaveCreatedEvent
  ): Promise<void> {
    void event;
  }

  /**
   * Example: Process a user prediction participation
   */
  async processUserPrediction(
    user: User,
    predictionId: string,
    stake: number,
    activeMoneyWave?: MoneyWave
  ): Promise<void> {
    // 1. Spend PmcAmount for prediction entry
    const spendResult = user.spendPmc(stake, "prediction_entry", predictionId, {
      predictionId,
    });

    if (!spendResult.success) {
      throw new Error(spendResult.error || "Failed to spend PmcAmount");
    }

    // 2. Publish PmcAmount spent event
    await this.eventBus.publishMany(spendResult.events);

    // 3. Award participation PmpAmount
    const economicContext = {
      currentMoneyWave: activeMoneyWave
        ? {
            id: activeMoneyWave.id,
            category: activeMoneyWave.category,
            multiplier: activeMoneyWave.getEconomicMultiplier(),
          }
        : undefined,
      userLevel: user.level,
      userReputation: user.reputation,
      platformActivity: 0.7, // Example activity level
    };

    const earnEvents = user.earnPmp(
      "prediction_participation",
      economicContext,
      { predictionId, stake }
    );

    // 4. Publish PmpAmount earned event
    await this.eventBus.publishMany(earnEvents);
  }

  /**
   * Example: Process a successful prediction
   */
  async processSuccessfulPrediction(
    user: User,
    predictionId: string,
    accuracy: number,
    activeMoneyWave?: MoneyWave
  ): Promise<void> {
    const economicContext = {
      currentMoneyWave: activeMoneyWave
        ? {
            id: activeMoneyWave.id,
            category: activeMoneyWave.category,
            multiplier: activeMoneyWave.getEconomicMultiplier(),
          }
        : undefined,
      userLevel: user.level,
      userReputation: user.reputation,
      platformActivity: 0.7,
    };

    // Award success PmpAmount based on accuracy
    const earnEvents = user.earnPmp("prediction_success", economicContext, {
      predictionId,
      accuracy,
      difficulty: 7,
    });

    await this.eventBus.publishMany(earnEvents);
  }
}
