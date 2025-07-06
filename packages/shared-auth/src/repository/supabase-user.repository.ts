// Repository Implementation using Supabase
// Infrastructure layer that implements domain repository interfaces

import { SupabaseClient } from '@supabase/supabase-js';
import {
  UserAggregate,
  IUserRepository,
  Result,
  DomainError,
  createUserId,
  createEmail,
  createUsername,
} from '@posmul/shared-types';

interface SupabaseUserRow {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

interface SupabaseUserProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  pmp_balance: number;
  pmc_balance: number;
  notification_preferences?: Record<string, any>;
  privacy_settings?: Record<string, any>;
  onboarding_completed: boolean;
  account_status: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

interface SupabaseEconomicBalanceRow {
  id: string;
  user_id: string;
  pmp_available: number;
  pmp_locked: number;
  pmp_total: number;
  pmc_available: number;
  pmc_locked: number;
  pmc_total: number;
  lifetime_pmp_earned: number;
  lifetime_pmc_earned: number;
  risk_tolerance_score: number;
  investment_behavior_type: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseReputationRow {
  id: string;
  user_id: string;
  prediction_accuracy_rate: number;
  total_predictions_made: number;
  successful_predictions: number;
  investment_success_rate: number;
  total_investments_made: number;
  roi_average: number;
  forum_contribution_score: number;
  helpful_posts_count: number;
  community_trust_level: number;
  overall_reputation_score: number;
  reputation_tier: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<UserAggregate | null, DomainError>> {
    try {
      // Get user data from auth.users
      const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(id);
      
      if (authError) {
        return { success: false, error: new DomainError(authError.message) };
      }

      if (!authUser.user) {
        return { success: true, data: null };
      }

      // Get profile data
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) {
        return { success: false, error: new DomainError(profileError.message) };
      }

      // Get economic balance
      const { data: balance, error: balanceError } = await this.supabase
        .from('user_economic_balances')
        .select('*')
        .eq('user_id', id)
        .single();

      if (balanceError) {
        return { success: false, error: new DomainError(balanceError.message) };
      }

      // Get reputation metrics
      const { data: reputation, error: reputationError } = await this.supabase
        .from('user_reputation_metrics')
        .select('*')
        .eq('user_id', id)
        .single();

      if (reputationError) {
        return { success: false, error: new DomainError(reputationError.message) };
      }

      const userAggregate = this.mapToUserAggregate(authUser.user, profile, balance, reputation);
      return { success: true, data: userAggregate };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }

  async findByEmail(email: string): Promise<Result<UserAggregate | null, DomainError>> {
    try {
      // Find user by email in auth.users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();
      
      if (authError) {
        return { success: false, error: new DomainError(authError.message) };
      }

      const authUser = authUsers.users.find((user: any) => user.email === email);
      if (!authUser) {
        return { success: true, data: null };
      }

      // Use findById to get complete user data
      return this.findById(authUser.id);
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }

  async findByUsername(username: string): Promise<Result<UserAggregate | null, DomainError>> {
    try {
      // Find user by username in user_profiles
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') { // No rows returned
          return { success: true, data: null };
        }
        return { success: false, error: new DomainError(profileError.message) };
      }

      // Use findById to get complete user data
      return this.findById(profile.id);
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Failed to find user by username: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }

  async save(user: UserAggregate): Promise<Result<void, DomainError>> {
    try {
      // Update user profile
      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          username: user.profile.username,
          display_name: user.profile.displayName,
          avatar_url: user.profile.avatarUrl,
          bio: user.profile.bio,
          email_verified: user.isEmailVerified,
          account_status: user.accountStatus,
          onboarding_completed: user.onboardingCompleted,
          updated_at: user.updatedAt.toISOString(),
          last_active_at: user.lastActiveAt.toISOString(),
        });

      if (profileError) {
        return { success: false, error: new DomainError(profileError.message) };
      }

      // Update economic balance
      const { error: balanceError } = await this.supabase
        .from('user_economic_balances')
        .upsert({
          user_id: user.id,
          pmp_available: user.economicBalance.pmpAvailable,
          pmp_locked: user.economicBalance.pmpLocked,
          pmc_available: user.economicBalance.pmcAvailable,
          pmc_locked: user.economicBalance.pmcLocked,
          updated_at: user.updatedAt.toISOString(),
        });

      if (balanceError) {
        return { success: false, error: new DomainError(balanceError.message) };
      }

      // Update reputation metrics
      const { error: reputationError } = await this.supabase
        .from('user_reputation_metrics')
        .upsert({
          user_id: user.id,
          prediction_accuracy_rate: user.reputation.predictionAccuracyRate,
          total_predictions_made: user.reputation.totalPredictionsMade,
          successful_predictions: user.reputation.successfulPredictions,
          investment_success_rate: user.reputation.investmentSuccessRate,
          overall_reputation_score: user.reputation.overallReputationScore,
          reputation_tier: user.reputation.reputationTier,
          updated_at: user.updatedAt.toISOString(),
        });

      if (reputationError) {
        return { success: false, error: new DomainError(reputationError.message) };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    try {
      // Delete user from auth.users (this will cascade to other tables via foreign keys)
      const { error } = await this.supabase.auth.admin.deleteUser(id);
      
      if (error) {
        return { success: false, error: new DomainError(error.message) };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }

  private mapToUserAggregate(
    authUser: any,
    profile: SupabaseUserProfileRow,
    balance: SupabaseEconomicBalanceRow,
    reputation: SupabaseReputationRow
  ): UserAggregate {
    return {
      id: createUserId(authUser.id),
      profile: {
        username: createUsername(profile.username),
        displayName: profile.display_name,
        email: createEmail(authUser.email),
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
      },
      economicBalance: {
        pmpAvailable: balance.pmp_available,
        pmpLocked: balance.pmp_locked,
        pmpTotal: balance.pmp_total,
        pmcAvailable: balance.pmc_available,
        pmcLocked: balance.pmc_locked,
        pmcTotal: balance.pmc_total,
      },
      reputation: {
        predictionAccuracyRate: reputation.prediction_accuracy_rate,
        totalPredictionsMade: reputation.total_predictions_made,
        successfulPredictions: reputation.successful_predictions,
        investmentSuccessRate: reputation.investment_success_rate,
        overallReputationScore: reputation.overall_reputation_score,
        reputationTier: reputation.reputation_tier as any,
      },
      isEmailVerified: profile.email_verified,
      accountStatus: profile.account_status as any,
      onboardingCompleted: profile.onboarding_completed,
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(profile.updated_at),
      lastActiveAt: new Date(profile.last_active_at),
    };
  }
}
