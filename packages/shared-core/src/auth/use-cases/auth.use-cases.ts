// Authentication Use Cases
// Application layer that orchestrates domain logic

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Result,
  DomainError,
  AuthUserAlreadyExistsError,
  AuthInvalidCredentialsError,
  EmailNotVerifiedError,
  SignUpCommand,
  SignInCommand,
  UpdateProfileCommand,
  UserAggregate,
} from '@posmul/shared-types';

import { UserDomainService } from '../domain/user-domain.service';
import { SupabaseUserRepository } from '../repository/supabase-user.repository';

export class SignUpUseCase {
  constructor(
    private supabase: SupabaseClient,
    private userRepository: SupabaseUserRepository
  ) {}

  async execute(command: SignUpCommand): Promise<Result<string, DomainError>> {
    try {
      // Validate password strength
      const passwordValidation = UserDomainService.validatePassword(command.password);
      if (!passwordValidation.success) {
        return { success: false, error: (passwordValidation as { success: false; error: DomainError }).error };
      }

      // Check if user already exists by email
      const existingUserByEmail = await this.userRepository.findByEmail(command.email);
      if (!existingUserByEmail.success) {
        return { success: false, error: (existingUserByEmail as { success: false; error: DomainError }).error };
      }
      if (existingUserByEmail.data) {
        return { 
          success: false, 
          error: new AuthUserAlreadyExistsError(command.email) 
        };
      }

      // Check if username is taken
      const existingUserByUsername = await this.userRepository.findByUsername(command.username);
      if (!existingUserByUsername.success) {
        return { success: false, error: (existingUserByUsername as { success: false; error: DomainError }).error };
      }
      if (existingUserByUsername.success && existingUserByUsername.data) {
        return { 
          success: false, 
          error: new AuthUserAlreadyExistsError(command.username) 
        };
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: command.email,
        password: command.password,
        options: {
          data: {
            username: command.username,
            display_name: command.displayName,
          }
        }
      });

      if (authError) {
        return { 
          success: false, 
          error: new DomainError(authError.message) 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: new DomainError('Failed to create user') 
        };
      }

      // Create domain user aggregate
      const userResult = UserDomainService.createNewUser(
        authData.user.id,
        command.email,
        command.username,
        command.displayName
      );

      if (!userResult.success) {
        return { success: false, error: (userResult as { success: false; error: DomainError }).error };
      }

      // Save user to database
      const saveResult = await this.userRepository.save(userResult.data);
      if (!saveResult.success) {
        return { success: false, error: (saveResult as { success: false; error: DomainError }).error };
      }

      return { success: true, data: authData.user.id };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }
}

export class SignInUseCase {
  constructor(
    private supabase: SupabaseClient,
    private userRepository: SupabaseUserRepository
  ) {}

  async execute(command: SignInCommand): Promise<Result<UserAggregate, DomainError>> {
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (authError) {
        return { 
          success: false, 
          error: new AuthInvalidCredentialsError() 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: new AuthInvalidCredentialsError() 
        };
      }

      // Get user aggregate from repository
      const userResult = await this.userRepository.findById(authData.user.id);
      if (!userResult.success) {
        return userResult;
      }

      if (!userResult.data) {
        return { 
          success: false, 
          error: new DomainError('User profile not found') 
        };
      }

      // Check if email is verified for accounts that require it
      if (!userResult.data.isEmailVerified && userResult.data.accountStatus === 'pending_verification') {
        return { 
          success: false, 
          error: new EmailNotVerifiedError() 
        };
      }

      // Update last active timestamp
      const updatedUser = UserDomainService.updateLastActive(userResult.data);
      await this.userRepository.save(updatedUser);

      return { success: true, data: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }
}

export class UpdateProfileUseCase {
  constructor(
    private userRepository: SupabaseUserRepository
  ) {}

  async execute(command: UpdateProfileCommand): Promise<Result<UserAggregate, DomainError>> {
    try {
      // Get current user
      const userResult = await this.userRepository.findById(command.userId);
      if (!userResult.success) {
        return userResult;
      }

      if (!userResult.data) {
        return { 
          success: false, 
          error: new DomainError('User not found') 
        };
      }

      // Update profile using domain service
      const updatedUserResult = UserDomainService.updateUserProfile(
        userResult.data,
        {
          displayName: command.displayName,
          bio: command.bio,
          avatarUrl: command.avatarUrl,
        }
      );

      if (!updatedUserResult.success) {
        return { success: false, error: (updatedUserResult as { success: false; error: DomainError }).error };
      }

      // Save updated user
      const saveResult = await this.userRepository.save(updatedUserResult.data);
      if (!saveResult.success) {
        return { success: false, error: (saveResult as { success: false; error: DomainError }).error };
      }

      return { success: true, data: updatedUserResult.data };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }
}

export class GetCurrentUserUseCase {
  constructor(
    private supabase: SupabaseClient,
    private userRepository: SupabaseUserRepository
  ) {}

  async execute(): Promise<Result<UserAggregate | null, DomainError>> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        return { 
          success: false, 
          error: new DomainError(sessionError.message) 
        };
      }

      if (!session?.user) {
        return { success: true, data: null };
      }

      // Get user aggregate
      const userResult = await this.userRepository.findById(session.user.id);
      if (!userResult.success) {
        return userResult;
      }

      return { success: true, data: userResult.data };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Get current user failed: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }
}

export class SignOutUseCase {
  constructor(private supabase: SupabaseClient) {}

  async execute(): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { 
          success: false, 
          error: new DomainError(error.message) 
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: new DomainError(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`) 
      };
    }
  }
}
