/**
 * Economic Rules Engine
 * 
 * Core business rules for PMP/PMC economic system.
 * These rules are shared across all bounded contexts.
 * 
 * Based on Agency Theory and CAPM principles.
 * 
 * @author PosMul Development Team
 * @since 2025-07-06
 */

import { RewardSource } from '../events/PmpEarnedEvent';
import { SpendPurpose } from '../events/PmcSpentEvent';

export interface UserAction {
  type: RewardSource;
  context: Record<string, any>;
  difficulty?: number; // 1-10 scale
  accuracy?: number;   // 0-1 scale (for predictions)
  impact?: number;     // 1-10 scale (for social actions)
}

export interface EconomicContext {
  currentMoneyWave?: {
    id: string;
    category: string;
    multiplier: number;
  };
  userLevel: number;
  userReputation: number;
  platformActivity: number; // 0-1 scale
}

export class EconomicRules {
  
  /**
   * Calculate PMP reward based on action type and context
   */
  static calculatePmpReward(
    action: UserAction, 
    context: EconomicContext
  ): number {
    const baseReward = this.getBaseReward(action.type);
    const difficultyMultiplier = this.getDifficultyMultiplier(action.difficulty);
    const accuracyMultiplier = this.getAccuracyMultiplier(action.accuracy);
    const levelMultiplier = this.getLevelMultiplier(context.userLevel);
    const moneyWaveMultiplier = this.getMoneyWaveMultiplier(context.currentMoneyWave);

    return Math.floor(
      baseReward * 
      difficultyMultiplier * 
      accuracyMultiplier * 
      levelMultiplier * 
      moneyWaveMultiplier
    );
  }

  /**
   * Validate PMC spending request
   */
  static validatePmcSpending(
    userId: string,
    amount: number,
    purpose: SpendPurpose,
    userBalance: number,
    context: Record<string, any>
  ): { valid: boolean; reason?: string } {
    // Basic balance check
    if (userBalance < amount) {
      return { valid: false, reason: 'Insufficient PMC balance' };
    }

    // Minimum spending limits
    const minSpend = this.getMinimumSpend(purpose);
    if (amount < minSpend) {
      return { valid: false, reason: `Minimum spend for ${purpose} is ${minSpend} PMC` };
    }

    // Maximum spending limits (anti-whale protection)
    const maxSpend = this.getMaximumSpend(purpose, context.userLevel || 1);
    if (amount > maxSpend) {
      return { valid: false, reason: `Maximum spend for ${purpose} is ${maxSpend} PMC` };
    }

    return { valid: true };
  }

  /**
   * Calculate PMP to PMC conversion rate
   */
  static getPmpToPmcRate(economicContext: EconomicContext): number {
    const baseRate = 1.0; // 1 PMP = 1 PMC base rate
    const activityMultiplier = 1 - (economicContext.platformActivity * 0.2); // Higher activity = better rate
    
    return Math.max(0.5, baseRate * activityMultiplier);
  }

  // Private helper methods

  private static getBaseReward(source: RewardSource): number {
    const rewards: Record<RewardSource, number> = {
      'prediction_success': 50,
      'prediction_participation': 10,
      'donation_milestone': 25,
      'investment_return': 30,
      'forum_contribution': 15,
      'money_wave_creation': 100,
      'referral_bonus': 75,
      'daily_bonus': 5,
    };

    return rewards[source] || 10;
  }

  private static getDifficultyMultiplier(difficulty?: number): number {
    if (!difficulty) return 1.0;
    return Math.max(0.5, Math.min(3.0, 1 + (difficulty - 5) * 0.1));
  }

  private static getAccuracyMultiplier(accuracy?: number): number {
    if (!accuracy) return 1.0;
    return Math.max(0.1, Math.min(2.0, accuracy * 2));
  }

  private static getLevelMultiplier(level: number): number {
    return Math.max(1.0, 1 + (level - 1) * 0.05); // 5% per level
  }

  private static getMoneyWaveMultiplier(moneyWave?: { multiplier: number }): number {
    return moneyWave?.multiplier || 1.0;
  }

  private static getMinimumSpend(purpose: SpendPurpose): number {
    const minimums: Record<SpendPurpose, number> = {
      'prediction_entry': 1,
      'prediction_stake_increase': 5,
      'donation_contribution': 1,
      'investment_purchase': 10,
      'money_wave_boost': 20,
      'premium_feature': 50,
      'vote_weight_increase': 25,
    };

    return minimums[purpose] || 1;
  }

  private static getMaximumSpend(purpose: SpendPurpose, userLevel: number): number {
    const baseLimits: Record<SpendPurpose, number> = {
      'prediction_entry': 100,
      'prediction_stake_increase': 500,
      'donation_contribution': 1000,
      'investment_purchase': 2000,
      'money_wave_boost': 1000,
      'premium_feature': 200,
      'vote_weight_increase': 300,
    };

    const baseLimit = baseLimits[purpose] || 100;
    return baseLimit * Math.max(1, userLevel * 0.5); // Level-based scaling
  }
}
