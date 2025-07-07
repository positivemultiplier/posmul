/**
 * Auth Domain Repository Interfaces
 */

import { UserId, Result } from "@posmul/auth-economy-sdk";
import { AuthSession, Permission, Role, UserCredentials } from "../entities";

/**
 * Auth Repository Interface
 */
export interface IAuthRepository {
  getSession(sessionId: string): Promise<Result<AuthSession | null, Error>>;
  getUserCredentials(
    userId: UserId
  ): Promise<Result<UserCredentials | null, Error>>;
  getActiveSessions(userId: UserId): Promise<Result<AuthSession[], Error>>;
  getUserPermissions(userId: UserId): Promise<Result<Permission[], Error>>;
  getUserRoles(userId: UserId): Promise<Result<Role[], Error>>;
  invalidateSession(sessionId: string): Promise<Result<void, Error>>;
  invalidateAllUserSessions(userId: UserId): Promise<Result<void, Error>>;
  logAuthActivity(
    userId: UserId,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<Result<void, Error>>;
}
