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
  User, 
  MoneyWave, 
  EventBus, 
  PmpEarnedEvent, 
  PmcSpentEvent,
  MoneyWaveCreatedEvent,
  EconomicRules,
  EventHandler 
} from '../index';

export class CrossDomainIntegrationService {
  private eventBus = EventBus.getInstance();

  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // Handle PMP earned events to update user statistics
    this.eventBus.subscribe<PmpEarnedEvent>(
      'PmpEarnedEvent',
      this.handlePmpEarned.bind(this),
      10 // High priority
    );

    // Handle PMC spent events for analytics
    this.eventBus.subscribe<PmcSpentEvent>(
      'PmcSpentEvent', 
      this.handlePmcSpent.bind(this),
      20
    );

    // Handle money wave creation for platform-wide notifications
    this.eventBus.subscribe<MoneyWaveCreatedEvent>(
      'MoneyWaveCreatedEvent',
      this.handleMoneyWaveCreated.bind(this),
      15
    );
  }

  /**
   * Handle PMP earned events
   */
  private async handlePmpEarned(event: PmpEarnedEvent): Promise<void> {
    console.log(`💰 User ${event.userId} earned ${event.amount} PMP from ${event.source}`);
    
    // Here you could:
    // - Update user statistics
    // - Send notifications
    // - Update leaderboards
    // - Trigger achievements
    
    // Example: Check for level up
    if (event.amount >= 100) {
      console.log(`🎉 Large reward detected! User might level up.`);
    }
  }

  /**
   * Handle PMC spent events
   */
  private async handlePmcSpent(event: PmcSpentEvent): Promise<void> {
    console.log(`💸 User ${event.userId} spent ${event.amount} PMC on ${event.purpose}`);
    
    // Here you could:
    // - Update spending analytics
    // - Track user behavior patterns
    // - Update economic models
    // - Trigger warnings for excessive spending
    
    if (event.amount >= 500) {
      console.log(`⚠️ Large spending detected: ${event.amount} PMC`);
    }
  }

  /**
   * Handle money wave creation events
   */
  private async handleMoneyWaveCreated(event: MoneyWaveCreatedEvent): Promise<void> {
    console.log(`🌊 New Money Wave created: ${event.title} by user ${event.creatorId}`);
    
    // Here you could:
    // - Send platform-wide notifications
    // - Update economic multipliers
    // - Create cross-promotional content
    // - Update trending topics
    
    // Automatically activate high-impact money waves
    if (event.targetAmount >= 10000) {
      console.log(`🔥 High-impact Money Wave created! Auto-featuring.`);
    }
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
    // 1. Spend PMC for prediction entry
    const spendResult = user.spendPmc(
      stake, 
      'prediction_entry', 
      predictionId,
      { predictionId }
    );

    if (!spendResult.success) {
      throw new Error(spendResult.error || 'Failed to spend PMC');
    }

    // 2. Publish PMC spent event
    await this.eventBus.publishMany(spendResult.events);

    // 3. Award participation PMP
    const economicContext = {
      currentMoneyWave: activeMoneyWave ? {
        id: activeMoneyWave.id,
        category: activeMoneyWave.category,
        multiplier: activeMoneyWave.getEconomicMultiplier()
      } : undefined,
      userLevel: user.level,
      userReputation: user.reputation,
      platformActivity: 0.7 // Example activity level
    };

    const earnEvents = user.earnPmp(
      'prediction_participation',
      economicContext,
      { predictionId, stake }
    );

    // 4. Publish PMP earned event
    await this.eventBus.publishMany(earnEvents);

    console.log(`✅ User ${user.id} participated in prediction ${predictionId} with ${stake} PMC`);
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
      currentMoneyWave: activeMoneyWave ? {
        id: activeMoneyWave.id,
        category: activeMoneyWave.category,
        multiplier: activeMoneyWave.getEconomicMultiplier()
      } : undefined,
      userLevel: user.level,
      userReputation: user.reputation,
      platformActivity: 0.7
    };

    // Award success PMP based on accuracy
    const earnEvents = user.earnPmp(
      'prediction_success',
      economicContext,
      { predictionId, accuracy, difficulty: 7 }
    );

    await this.eventBus.publishMany(earnEvents);

    console.log(`🎯 User ${user.id} successful prediction ${predictionId} with ${accuracy * 100}% accuracy`);
  }
}
