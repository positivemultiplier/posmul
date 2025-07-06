// Authentication Service
// High-level service that coordinates use cases

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Result,
  DomainError,
  UserAggregate,
  SignUpCommand,
  SignInCommand,
  UpdateProfileCommand,
  UserProfileDto,
  AuthStateDto,
} from '@posmul/shared-types';

import { SupabaseUserRepository } from '../repository/supabase-user.repository';
import {
  SignUpUseCase,
  SignInUseCase,
  UpdateProfileUseCase,
  GetCurrentUserUseCase,
  SignOutUseCase,
} from '../use-cases/auth.use-cases';

export class AuthenticationService {
  private userRepository: SupabaseUserRepository;
  private signUpUseCase: SignUpUseCase;
  private signInUseCase: SignInUseCase;
  private updateProfileUseCase: UpdateProfileUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;
  private signOutUseCase: SignOutUseCase;

  constructor(private supabase: SupabaseClient) {
    this.userRepository = new SupabaseUserRepository(supabase);
    this.signUpUseCase = new SignUpUseCase(supabase, this.userRepository);
    this.signInUseCase = new SignInUseCase(supabase, this.userRepository);
    this.updateProfileUseCase = new UpdateProfileUseCase(this.userRepository);
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(supabase, this.userRepository);
    this.signOutUseCase = new SignOutUseCase(supabase);
  }

  /**
   * Register a new user
   */
  async signUp(command: SignUpCommand): Promise<Result<string, DomainError>> {
    return this.signUpUseCase.execute(command);
  }

  /**
   * Authenticate user with email/password
   */
  async signIn(command: SignInCommand): Promise<Result<UserAggregate, DomainError>> {
    return this.signInUseCase.execute(command);
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<Result<void, DomainError>> {
    return this.signOutUseCase.execute();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<Result<UserAggregate | null, DomainError>> {
    return this.getCurrentUserUseCase.execute();
  }

  /**
   * Update user profile
   */
  async updateProfile(command: UpdateProfileCommand): Promise<Result<UserAggregate, DomainError>> {
    return this.updateProfileUseCase.execute(command);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Result<UserAggregate | null, DomainError>> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<UserAggregate | null, DomainError>> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Get current authentication state for UI
   */
  async getAuthState(): Promise<AuthStateDto> {
    try {
      const userResult = await this.getCurrentUser();
      
      if (!userResult.success) {
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
        };
      }

      if (!userResult.data) {
        return {
          isAuthenticated: false,
          user: null,
          isLoading: false,
        };
      }

      return {
        isAuthenticated: true,
        user: this.mapToUserProfileDto(userResult.data),
        isLoading: false,
      };
    } catch {
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
      };
    }
  }

  /**
   * Map UserAggregate to UserProfileDto for UI consumption
   */
  private mapToUserProfileDto(user: UserAggregate): UserProfileDto {
    return {
      id: user.id,
      username: user.profile.username,
      displayName: user.profile.displayName,
      email: user.profile.email,
      avatarUrl: user.profile.avatarUrl,
      bio: user.profile.bio,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      economicBalance: {
        pmp: user.economicBalance.pmpTotal,
        pmc: user.economicBalance.pmcTotal,
      },
      reputation: {
        score: user.reputation.overallReputationScore,
        tier: user.reputation.reputationTier,
        accuracyRate: user.reputation.predictionAccuracyRate,
      },
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check if user exists by email
   */
  async userExistsByEmail(email: string): Promise<Result<boolean, DomainError>> {
    const userResult = await this.userRepository.findByEmail(email);
    if (!userResult.success) {
      return { success: false, error: (userResult as any).error };
    }
    return { success: true, data: userResult.data !== null };
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<Result<boolean, DomainError>> {
    const userResult = await this.userRepository.findByUsername(username);
    if (!userResult.success) {
      return { success: false, error: (userResult as any).error };
    }
    return { success: true, data: userResult.data === null };
  }
}
