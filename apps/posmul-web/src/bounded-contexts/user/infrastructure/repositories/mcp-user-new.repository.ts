/**
 * MCP User Repository
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현
 * IUserRepository 인터페이스를 MCP Supabase로 구현
 */

import { 
  Result,
  UserId,
  isFailure
} from "@posmul/auth-economy-sdk/types";
import { 
  createDefaultMCPAdapter,
  MCPError,
  handleMCPError
} from "@posmul/auth-economy-sdk/utils";
import {
  User,
  UserActivity,
  UserProfile,
  UserStatistics,
} from "../../domain/entities";
import { IUserRepository } from "../../domain/repositories";

/**
 * MCP 기반 User Repository 구현
 */
export class MCPUserRepository implements IUserRepository {
  private readonly mcpAdapter;

  constructor(projectId?: string) {
    // 환경변수에서 프로젝트 ID 가져오기
    const actualProjectId = projectId || 
      process.env.SUPABASE_PROJECT_ID || 
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    
    if (!actualProjectId) {
      throw new Error('Supabase project ID is required');
    }
    
    this.mcpAdapter = createDefaultMCPAdapter(actualProjectId);
  }

  async findById(userId: UserId): Promise<Result<User | null, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT u.*, p.pmp_balance, p.pmc_balance 
        FROM users u
        LEFT JOIN user_points p ON u.id = p.user_id
        WHERE u.id = '${userId}'
        LIMIT 1
      `);

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      const user = this.mapToUser(userData);
      return { success: true, data: user };
    } catch (error) {
      const handledError = handleMCPError(error, 'findById');
      return { success: false, error: handledError };
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT u.*, p.pmp_balance, p.pmc_balance 
        FROM users u
        LEFT JOIN user_points p ON u.id = p.user_id
        WHERE u.email = '${email}'
        LIMIT 1
      `);

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      const user = this.mapToUser(userData);
      return { success: true, data: user };
    } catch (error) {
      const handledError = handleMCPError(error, 'findByEmail');
      return { success: false, error: handledError };
    }
  }

  async save(user: User): Promise<Result<void, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        INSERT INTO users (id, email, username, display_name, avatar_url, created_at, last_active_at)
        VALUES ('${user.id}', '${user.email}', '${user.username || ''}', '${user.displayName || ''}', '${user.avatarUrl || ''}', '${user.createdAt.toISOString()}', '${user.lastActiveAt.toISOString()}')
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          last_active_at = EXCLUDED.last_active_at
      `);

      if (!result.success) {
        throw new MCPError(result.error || 'Failed to save user');
      }

      return { success: true, data: undefined };
    } catch (error) {
      const handledError = handleMCPError(error, 'save');
      return { success: false, error: handledError };
    }
  }

  async getUserProfile(userId: UserId): Promise<Result<UserProfile | null, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT 
          u.*,
          p.pmp_balance,
          p.pmc_balance,
          COUNT(DISTINCT pg.id) as games_created,
          COUNT(DISTINCT pp.id) as predictions_made,
          AVG(CASE WHEN pp.is_correct = true THEN 1.0 ELSE 0.0 END) as accuracy_rate
        FROM users u
        LEFT JOIN user_points p ON u.id = p.user_id
        LEFT JOIN prediction_games pg ON u.id = pg.creator_id
        LEFT JOIN prediction_participations pp ON u.id = pp.user_id
        WHERE u.id = '${userId}'
        GROUP BY u.id, p.pmp_balance, p.pmc_balance
        LIMIT 1
      `);

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const profileData = result.data[0];
      const profile = this.mapToUserProfile(profileData);
      return { success: true, data: profile };
    } catch (error) {
      const handledError = handleMCPError(error, 'getUserProfile');
      return { success: false, error: handledError };
    }
  }

  async recordActivity(activity: UserActivity): Promise<Result<void, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        INSERT INTO user_activities (user_id, activity_type, metadata, timestamp)
        VALUES ('${activity.userId}', '${activity.activityType}', '${JSON.stringify(activity.metadata)}', '${activity.timestamp.toISOString()}')
      `);

      if (!result.success) {
        throw new MCPError(result.error || 'Failed to record activity');
      }

      return { success: true, data: undefined };
    } catch (error) {
      const handledError = handleMCPError(error, 'recordActivity');
      return { success: false, error: handledError };
    }
  }

  async getUserStatistics(userId: UserId): Promise<Result<UserStatistics | null, Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT 
          COUNT(DISTINCT pg.id) as total_games_created,
          COUNT(DISTINCT pp.id) as total_predictions,
          COUNT(DISTINCT CASE WHEN pp.is_correct = true THEN pp.id END) as correct_predictions,
          COALESCE(SUM(CASE WHEN pt.transaction_type = 'EARN' AND pt.type = 'PMP' THEN pt.amount ELSE 0 END), 0) as total_pmp_earned,
          COALESCE(SUM(CASE WHEN pt.transaction_type = 'EARN' AND pt.type = 'PMC' THEN pt.amount ELSE 0 END), 0) as total_pmc_earned,
          COUNT(DISTINCT ua.id) as total_activities
        FROM users u
        LEFT JOIN prediction_games pg ON u.id = pg.creator_id
        LEFT JOIN prediction_participations pp ON u.id = pp.user_id
        LEFT JOIN point_transactions pt ON u.id = pt.user_id
        LEFT JOIN user_activities ua ON u.id = ua.user_id
        WHERE u.id = '${userId}'
        GROUP BY u.id
        LIMIT 1
      `);

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const statsData = result.data[0];
      const statistics = this.mapToUserStatistics(statsData);
      return { success: true, data: statistics };
    } catch (error) {
      const handledError = handleMCPError(error, 'getUserStatistics');
      return { success: false, error: handledError };
    }
  }

  async getActiveUsers(limit: number = 50): Promise<Result<User[], Error>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT u.*, p.pmp_balance, p.pmc_balance 
        FROM users u
        LEFT JOIN user_points p ON u.id = p.user_id
        WHERE u.last_active_at >= NOW() - INTERVAL '30 days'
        ORDER BY u.last_active_at DESC
        LIMIT ${limit}
      `);

      if (!result.success || !result.data) {
        return { success: true, data: [] };
      }

      const users = result.data.map(userData => this.mapToUser(userData));
      return { success: true, data: users };
    } catch (error) {
      const handledError = handleMCPError(error, 'getActiveUsers');
      return { success: false, error: handledError };
    }
  }

  private mapToUser(data: Record<string, unknown>): User {
    return {
      id: data.id as UserId,
      email: data.email as string,
      username: data.username as string | undefined,
      displayName: data.display_name as string | undefined,
      avatarUrl: data.avatar_url as string | undefined,
      createdAt: new Date(data.created_at as string),
      lastActiveAt: new Date(data.last_active_at as string),
    };
  }

  private mapToUserProfile(data: Record<string, unknown>): UserProfile {
    return {
      userId: data.id as UserId,
      email: data.email as string,
      username: data.username as string | undefined,
      displayName: data.display_name as string | undefined,
      avatarUrl: data.avatar_url as string | undefined,
      pmpBalance: Number(data.pmp_balance) || 0,
      pmcBalance: Number(data.pmc_balance) || 0,
      gamesCreated: Number(data.games_created) || 0,
      predictionsMade: Number(data.predictions_made) || 0,
      accuracyRate: Number(data.accuracy_rate) || 0,
      joinedAt: new Date(data.created_at as string),
      lastActiveAt: new Date(data.last_active_at as string),
    };
  }

  private mapToUserStatistics(data: Record<string, unknown>): UserStatistics {
    return {
      totalGamesCreated: Number(data.total_games_created) || 0,
      totalPredictions: Number(data.total_predictions) || 0,
      correctPredictions: Number(data.correct_predictions) || 0,
      accuracyRate: Number(data.total_predictions) > 0 
        ? Number(data.correct_predictions) / Number(data.total_predictions) 
        : 0,
      totalPmpEarned: Number(data.total_pmp_earned) || 0,
      totalPmcEarned: Number(data.total_pmc_earned) || 0,
      totalActivities: Number(data.total_activities) || 0,
    };
  }
}
