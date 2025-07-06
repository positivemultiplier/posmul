// Domain Services for Authentication
// This module contains domain-specific business logic

import {
  UserAggregate,
  UserProfileData,
  EconomicBalance,
  ReputationMetrics,
  Result,
  DomainError,
  EmailInvalidError,
  UsernameInvalidError,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  createUserId,
  createUsername,
  createEmail,
} from '@posmul/shared-types';

export class UserDomainService {
  /**
   * Creates a new user aggregate with proper validation and initial values
   */
  static createNewUser(
    id: string,
    email: string,
    username: string,
    displayName: string
  ): Result<UserAggregate, DomainError> {
    // Validate inputs
    if (!isValidEmail(email)) {
      return { success: false, error: new EmailInvalidError(email) };
    }

    if (!isValidUsername(username)) {
      return { success: false, error: new UsernameInvalidError(username) };
    }

    // Create value objects
    const userId = createUserId(id);
    const userEmail = createEmail(email);
    const userUsername = createUsername(username);

    // Create initial profile
    const profile: UserProfileData = {
      username: userUsername,
      displayName,
      email: userEmail,
      bio: undefined,
      avatarUrl: undefined,
    };

    // Initial economic balance with welcome bonus
    const economicBalance: EconomicBalance = {
      pmpAvailable: 1000, // Welcome bonus
      pmpLocked: 0,
      pmpTotal: 1000,
      pmcAvailable: 100, // Welcome bonus
      pmcLocked: 0,
      pmcTotal: 100,
    };

    // Initial reputation metrics
    const reputation: ReputationMetrics = {
      predictionAccuracyRate: 0,
      totalPredictionsMade: 0,
      successfulPredictions: 0,
      investmentSuccessRate: 0,
      overallReputationScore: 0,
      reputationTier: 'bronze',
    };

    const now = new Date();

    const userAggregate: UserAggregate = {
      id: userId,
      profile,
      economicBalance,
      reputation,
      isEmailVerified: false,
      accountStatus: 'pending_verification',
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    return { success: true, data: userAggregate };
  }

  /**
   * Updates user profile with business rules validation
   */
  static updateUserProfile(
    user: UserAggregate,
    updates: Partial<UserProfileData>
  ): Result<UserAggregate, DomainError> {
    // Validate username if provided
    if (updates.username && !isValidUsername(updates.username)) {
      return { 
        success: false, 
        error: new UsernameInvalidError(updates.username) 
      };
    }

    // Validate email if provided
    if (updates.email && !isValidEmail(updates.email)) {
      return { 
        success: false, 
        error: new EmailInvalidError(updates.email) 
      };
    }

    // Create updated profile
    const updatedProfile: UserProfileData = {
      ...user.profile,
      ...updates,
    };

    const updatedUser: UserAggregate = {
      ...user,
      profile: updatedProfile,
      updatedAt: new Date(),
    };

    return { success: true, data: updatedUser };
  }

  /**
   * Updates economic balance with business rules
   */
  static updateEconomicBalance(
    user: UserAggregate,
    pmpChange: number,
    pmcChange: number,
    _transactionType: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'transfer'
  ): Result<UserAggregate, DomainError> {
    const currentBalance = user.economicBalance;
    
    // Calculate new balances
    const newPmpAvailable = currentBalance.pmpAvailable + pmpChange;
    const newPmcAvailable = currentBalance.pmcAvailable + pmcChange;

    // Validate minimum balance requirements
    if (newPmpAvailable < 0) {
      return {
        success: false,
        error: new DomainError(`Insufficient PMP balance. Current: ${currentBalance.pmpAvailable}, Requested change: ${pmpChange}`)
      };
    }

    if (newPmcAvailable < 0) {
      return {
        success: false,
        error: new DomainError(`Insufficient PMC balance. Current: ${currentBalance.pmcAvailable}, Requested change: ${pmcChange}`)
      };
    }

    const newEconomicBalance: EconomicBalance = {
      pmpAvailable: newPmpAvailable,
      pmpLocked: currentBalance.pmpLocked,
      pmpTotal: newPmpAvailable + currentBalance.pmpLocked,
      pmcAvailable: newPmcAvailable,
      pmcLocked: currentBalance.pmcLocked,
      pmcTotal: newPmcAvailable + currentBalance.pmcLocked,
    };

    const updatedUser: UserAggregate = {
      ...user,
      economicBalance: newEconomicBalance,
      updatedAt: new Date(),
    };

    return { success: true, data: updatedUser };
  }

  /**
   * Validates password strength according to business rules
   */
  static validatePassword(password: string): Result<void, DomainError> {
    if (!isValidPassword(password)) {
      return {
        success: false,
        error: new DomainError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters'
        )
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Updates user's last active timestamp
   */
  static updateLastActive(user: UserAggregate): UserAggregate {
    return {
      ...user,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Marks user email as verified
   */
  static verifyEmail(user: UserAggregate): UserAggregate {
    return {
      ...user,
      isEmailVerified: true,
      accountStatus: user.accountStatus === 'pending_verification' ? 'active' : user.accountStatus,
      updatedAt: new Date(),
    };
  }
}
