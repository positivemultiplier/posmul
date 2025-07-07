import { UserId, Email, createUserId, createEmail } from './branded-types';
import { DomainError, Result } from './errors';
export type Username = string & {
    readonly brand: unique symbol;
};
export type HashedPassword = string & {
    readonly brand: unique symbol;
};
export type { UserId, Email };
export { createUserId, createEmail };
export interface UserProfileData {
    readonly username: Username;
    readonly displayName: string;
    readonly email: Email;
    readonly avatarUrl?: string;
    readonly bio?: string;
}
export interface EconomicBalance {
    readonly pmpAvailable: number;
    readonly pmpLocked: number;
    readonly pmpTotal: number;
    readonly pmcAvailable: number;
    readonly pmcLocked: number;
    readonly pmcTotal: number;
}
export interface ReputationMetrics {
    readonly predictionAccuracyRate: number;
    readonly totalPredictionsMade: number;
    readonly successfulPredictions: number;
    readonly investmentSuccessRate: number;
    readonly overallReputationScore: number;
    readonly reputationTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}
export interface UserAggregate {
    readonly id: UserId;
    readonly profile: UserProfileData;
    readonly economicBalance: EconomicBalance;
    readonly reputation: ReputationMetrics;
    readonly isEmailVerified: boolean;
    readonly accountStatus: 'active' | 'suspended' | 'pending_verification';
    readonly onboardingCompleted: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly lastActiveAt: Date;
}
export interface UserRegisteredEvent {
    readonly type: 'UserRegistered';
    readonly aggregateId: UserId;
    readonly data: {
        readonly email: Email;
        readonly username: Username;
        readonly welcomeBonusPmp: number;
    };
    readonly occurredAt: Date;
}
export interface UserProfileUpdatedEvent {
    readonly type: 'UserProfileUpdated';
    readonly aggregateId: UserId;
    readonly data: {
        readonly previousProfile: UserProfileData;
        readonly newProfile: UserProfileData;
    };
    readonly occurredAt: Date;
}
export interface EconomicBalanceChangedEvent {
    readonly type: 'EconomicBalanceChanged';
    readonly aggregateId: UserId;
    readonly data: {
        readonly previousBalance: EconomicBalance;
        readonly newBalance: EconomicBalance;
        readonly transactionType: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'transfer';
        readonly amount: number;
        readonly currency: 'PMP' | 'PMC';
    };
    readonly occurredAt: Date;
}
export interface IUserRepository {
    findById(id: UserId): Promise<Result<UserAggregate | null, DomainError>>;
    findByEmail(email: Email): Promise<Result<UserAggregate | null, DomainError>>;
    findByUsername(username: Username): Promise<Result<UserAggregate | null, DomainError>>;
    save(user: UserAggregate): Promise<Result<void, DomainError>>;
    delete(id: UserId): Promise<Result<void, DomainError>>;
}
export interface IAuthenticationService {
    signUp(email: Email, password: string, userData: Partial<UserProfileData>): Promise<Result<UserId, DomainError>>;
    signIn(email: Email, password: string): Promise<Result<UserId, DomainError>>;
    signOut(): Promise<Result<void, DomainError>>;
    getCurrentUser(): Promise<Result<UserAggregate | null, DomainError>>;
    updateProfile(userId: UserId, updates: Partial<UserProfileData>): Promise<Result<void, DomainError>>;
}
export declare class AuthUserNotFoundError extends DomainError {
    constructor(identifier: string);
}
export declare class AuthUserAlreadyExistsError extends DomainError {
    constructor(identifier: string);
}
export declare class AuthInvalidCredentialsError extends DomainError {
    constructor();
}
export declare class EmailNotVerifiedError extends DomainError {
    constructor();
}
export declare class InsufficientBalanceError extends DomainError {
    constructor(requested: number, available: number, currency: 'PMP' | 'PMC');
}
export declare class UsernameInvalidError extends DomainError {
    constructor(username: string);
}
export declare class EmailInvalidError extends DomainError {
    constructor(email: string);
}
export interface SignUpCommand {
    readonly email: string;
    readonly password: string;
    readonly username: string;
    readonly displayName: string;
    readonly acceptedTerms: boolean;
}
export interface SignInCommand {
    readonly email: string;
    readonly password: string;
    readonly rememberMe?: boolean;
}
export interface UpdateProfileCommand {
    readonly userId: UserId;
    readonly displayName?: string;
    readonly bio?: string;
    readonly avatarUrl?: string;
    readonly notificationPreferences?: Record<string, boolean>;
    readonly privacySettings?: Record<string, boolean>;
}
export interface GetUserQuery {
    readonly userId: UserId;
}
export interface GetUserByEmailQuery {
    readonly email: Email;
}
export interface UserProfileDto {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly email: string;
    readonly avatarUrl?: string;
    readonly bio?: string;
    readonly isEmailVerified: boolean;
    readonly accountStatus: string;
    readonly economicBalance: {
        readonly pmp: number;
        readonly pmc: number;
    };
    readonly reputation: {
        readonly score: number;
        readonly tier: string;
        readonly accuracyRate: number;
    };
    readonly createdAt: string;
}
export interface AuthStateDto {
    readonly isAuthenticated: boolean;
    readonly user: UserProfileDto | null;
    readonly isLoading: boolean;
}
export declare const createUsername: (username: string) => Username;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidUsername: (username: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
//# sourceMappingURL=auth-domain.d.ts.map