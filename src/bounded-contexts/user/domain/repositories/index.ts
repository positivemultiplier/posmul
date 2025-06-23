/**
 * User Domain Repository Interfaces
 */

import { UserId } from "@/shared/types/branded-types";
import { Result } from "@/shared/types/common";
import { User, UserActivity, UserProfile, UserStatistics } from "../entities";

/**
 * User Repository Interface
 */
export interface IUserRepository {
  findById(userId: UserId): Promise<Result<User | null, Error>>;
  findByEmail(email: string): Promise<Result<User | null, Error>>;
  save(user: User): Promise<Result<void, Error>>;
  getUserProfile(userId: UserId): Promise<Result<UserProfile | null, Error>>;
  recordActivity(activity: UserActivity): Promise<Result<void, Error>>;
  getUserStatistics(
    userId: UserId
  ): Promise<Result<UserStatistics | null, Error>>;
  getActiveUsers(limit?: number): Promise<Result<User[], Error>>;
}
