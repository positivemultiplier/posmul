/**
 * MCP User Repository Implementation
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현체
 * IUserRepository 인터페이스를 MCP Supabase로 구현
 */

import { mcp_supabase_execute_sql } from "@posmul/shared-auth";
import { UserId } from "@posmul/shared-types";
import { Result } from "@posmul/shared-types";
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
  constructor(private readonly projectId: string) {}

  /**
   * 사용자 조회
   */
  async findById(userId: UserId): Promise<Result<User | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT u.*, p.pmp_balance, p.pmc_balance 
          FROM users u
          LEFT JOIN pmp_pmc_accounts p ON u.id = p.user_id
          WHERE u.id = $1
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      const user = this.mapDatabaseToUser(userData);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 이메일로 조회
   */
  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT u.*, p.pmp_balance, p.pmc_balance 
          FROM users u
          LEFT JOIN pmp_pmc_accounts p ON u.id = p.user_id
          WHERE u.email = $1
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      const user = this.mapDatabaseToUser(userData);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 저장
   */
  async save(user: User): Promise<Result<void, Error>> {
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          INSERT INTO users (id, email, username, full_name, avatar_url, is_active, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            username = EXCLUDED.username,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        `,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(
    userId: UserId
  ): Promise<Result<UserProfile | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT u.*, 
                 COUNT(p.prediction_id) as total_predictions,
                 COUNT(CASE WHEN ps.accuracy_score > 80 THEN 1 END) as successful_predictions,
                 AVG(ps.accuracy_score) as average_accuracy,
                 COUNT(ip.id) as total_investments,
                 SUM(ip.investment_amount) as total_invested,
                 SUM(ip.actual_return) as total_returns
          FROM users u
          LEFT JOIN predictions p ON u.id = p.user_id
          LEFT JOIN prediction_settlements ps ON p.prediction_id = ps.prediction_id
          LEFT JOIN investment_participations ip ON u.id = ip.investor_id
          WHERE u.id = $1
          GROUP BY u.id
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const profileData = result.data[0];
      const profile = this.mapDatabaseToUserProfile(profileData);
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 활동 기록
   */
  async recordActivity(activity: UserActivity): Promise<Result<void, Error>> {
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          INSERT INTO user_activities (user_id, activity_type, description, metadata, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 통계 조회
   */
  async getUserStatistics(
    userId: UserId
  ): Promise<Result<UserStatistics | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT 
            u.id as user_id,
            COUNT(DISTINCT p.prediction_id) as total_predictions,
            COUNT(DISTINCT CASE WHEN ps.accuracy_score > 80 THEN p.prediction_id END) as successful_predictions,
            AVG(ps.accuracy_score) as average_accuracy,
            COUNT(DISTINCT ip.id) as total_investments,
            SUM(ip.investment_amount) as total_invested,
            SUM(ip.actual_return) as total_returns,
            pmp.pmp_balance,
            pmp.pmc_balance,
            COUNT(DISTINCT t.transaction_id) as total_transactions
          FROM users u
          LEFT JOIN predictions p ON u.id = p.user_id
          LEFT JOIN prediction_settlements ps ON p.prediction_id = ps.prediction_id
          LEFT JOIN investment_participations ip ON u.id = ip.investor_id
          LEFT JOIN pmp_pmc_accounts pmp ON u.id = pmp.user_id
          LEFT JOIN pmp_pmc_transactions t ON u.id = t.user_id
          WHERE u.id = $1
          GROUP BY u.id, pmp.pmp_balance, pmp.pmc_balance
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const statsData = result.data[0];
      const statistics = this.mapDatabaseToUserStatistics(statsData);
      return { success: true, data: statistics };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 활성 사용자 목록 조회
   */
  async getActiveUsers(limit: number = 50): Promise<Result<User[], Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT u.*, p.pmp_balance, p.pmc_balance 
          FROM users u
          LEFT JOIN pmp_pmc_accounts p ON u.id = p.user_id
          WHERE u.is_active = true
          ORDER BY u.created_at DESC
          LIMIT $1
        `,
      });

      const users =
        result.data?.map((userData) => this.mapDatabaseToUser(userData)) || [];
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 데이터베이스 결과를 User 엔티티로 매핑
   */
  private mapDatabaseToUser(data: any): User {
    return {
      id: data.id as UserId,
      email: data.email,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      isActive: data.is_active,
      pmpBalance: data.pmp_balance || 0,
      pmcBalance: data.pmc_balance || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * 데이터베이스 결과를 UserProfile로 매핑
   */
  private mapDatabaseToUserProfile(data: any): UserProfile {
    return {
      userId: data.id as UserId,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      totalPredictions: parseInt(data.total_predictions) || 0,
      successfulPredictions: parseInt(data.successful_predictions) || 0,
      averageAccuracy: parseFloat(data.average_accuracy) || 0,
      totalInvestments: parseInt(data.total_investments) || 0,
      totalInvested: parseFloat(data.total_invested) || 0,
      totalReturns: parseFloat(data.total_returns) || 0,
      reputationScore: this.calculateReputationScore(data),
      userLevel: this.calculateUserLevel(data),
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * 데이터베이스 결과를 UserStatistics로 매핑
   */
  private mapDatabaseToUserStatistics(data: any): UserStatistics {
    return {
      userId: data.user_id as UserId,
      totalPredictions: parseInt(data.total_predictions) || 0,
      successfulPredictions: parseInt(data.successful_predictions) || 0,
      averageAccuracy: parseFloat(data.average_accuracy) || 0,
      totalInvestments: parseInt(data.total_investments) || 0,
      totalInvested: parseFloat(data.total_invested) || 0,
      totalReturns: parseFloat(data.total_returns) || 0,
      pmpBalance: data.pmp_balance || 0,
      pmcBalance: data.pmc_balance || 0,
      totalTransactions: parseInt(data.total_transactions) || 0,
      lastActivityAt: new Date(),
    };
  }

  /**
   * 평판 점수 계산
   */
  private calculateReputationScore(data: any): number {
    const accuracy = parseFloat(data.average_accuracy) || 0;
    const predictions = parseInt(data.total_predictions) || 0;
    const investments = parseInt(data.total_investments) || 0;

    // 기본 평판 점수 계산 로직
    return Math.min(
      100,
      accuracy * 0.5 + predictions * 0.3 + investments * 0.2
    );
  }

  /**
   * 사용자 레벨 계산
   */
  private calculateUserLevel(data: any): number {
    const totalActivity =
      (parseInt(data.total_predictions) || 0) +
      (parseInt(data.total_investments) || 0);

    if (totalActivity >= 100) return 5;
    if (totalActivity >= 50) return 4;
    if (totalActivity >= 20) return 3;
    if (totalActivity >= 10) return 2;
    return 1;
  }
}
