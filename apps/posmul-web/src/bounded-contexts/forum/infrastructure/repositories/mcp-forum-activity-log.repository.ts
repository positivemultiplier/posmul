/**
 * Forum Activity Log Repository - Supabase/MCP Implementation
 *
 * Forum 활동 로그를 Supabase에 저장하고 조회하는 Repository
 */
import { Result } from "@posmul/auth-economy-sdk";
import { createMCPClient, type MCPClientType } from "@/lib/supabase/mcp-client";

import { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import {
  ForumActivityLog,
  ForumActivityType,
  IForumActivityLogRepository,
} from "../../application/use-cases/reward-forum-activity.use-case";

/**
 * MCP Forum Activity Log Repository
 *
 * forum.forum_activity_logs 테이블과 연동
 */
export class MCPForumActivityLogRepository implements IForumActivityLogRepository {
  private mcpClient: MCPClientType | null = null;

  private async getClient(): Promise<MCPClientType> {
    if (!this.mcpClient) {
      this.mcpClient = await createMCPClient();
    }
    return this.mcpClient;
  }

  /**
   * 활동 로그 저장
   */
  async saveActivityLog(
    log: ForumActivityLog
  ): Promise<Result<{ id: string }>> {
    try {
      const client = await this.getClient();

      // activity_type 매핑 (forum schema의 activity_type 값에 맞춤)
      const activityTypeMap: Record<ForumActivityType, string> = {
        debate_post: "post_created",
        debate_comment: "comment_created",
        brainstorm_idea: "post_created",
        news_read: "post_created", // 읽기는 별도 처리 필요할 수 있음
        budget_vote: "vote_cast",
        quality_content: "quality_reviewed",
      };

      const query = `
        INSERT INTO forum.forum_activity_logs (
          user_id,
          activity_type,
          post_id,
          description,
          pmp_earned,
          metadata,
          created_at
        ) VALUES (
          '${log.userId}',
          '${activityTypeMap[log.activityType] || "post_created"}',
          ${log.contentId ? `'${log.contentId}'` : "NULL"},
          '${log.description.replace(/'/g, "''")}',
          ${log.pmpEarned},
          '${JSON.stringify(log.metadata || {})}'::jsonb,
          '${log.createdAt.toISOString()}'
        )
        RETURNING id;
      `;

      const result = await client.executeSql(query);

      if (result && result.length > 0) {
        return {
          success: true,
          data: { id: result[0].id },
        };
      }

      return {
        success: false,
        error: new Error("Failed to insert activity log"),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to save activity log: ${errorMessage}`),
      };
    }
  }

  /**
   * 사용자의 오늘 활동 횟수 조회
   */
  async getTodayActivityCount(
    userId: UserId,
    activityType: ForumActivityType
  ): Promise<Result<number>> {
    try {
      const client = await this.getClient();

      // activity_type 매핑
      const activityTypeMap: Record<ForumActivityType, string[]> = {
        debate_post: ["post_created"],
        debate_comment: ["comment_created"],
        brainstorm_idea: ["post_created"], // 별도 구분 필요 시 metadata로 구분
        news_read: ["post_created"],
        budget_vote: ["vote_cast"],
        quality_content: ["quality_reviewed"],
      };

      const dbActivityTypes = activityTypeMap[activityType] || ["post_created"];
      const typeCondition = dbActivityTypes.map(t => `'${t}'`).join(", ");

      const query = `
        SELECT COUNT(*) as count
        FROM forum.forum_activity_logs
        WHERE user_id = '${userId}'
          AND activity_type IN (${typeCondition})
          AND created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day';
      `;

      const result = await client.executeSql(query);

      if (result && result.length > 0) {
        return {
          success: true,
          data: parseInt(result[0].count, 10) || 0,
        };
      }

      return {
        success: true,
        data: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to get today activity count: ${errorMessage}`),
      };
    }
  }

  /**
   * 사용자의 오늘 총 PMP 획득량 조회
   */
  async getTodayTotalPmpEarned(userId: UserId): Promise<Result<number>> {
    try {
      const client = await this.getClient();

      const query = `
        SELECT COALESCE(SUM(pmp_earned), 0) as total
        FROM forum.forum_activity_logs
        WHERE user_id = '${userId}'
          AND created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day';
      `;

      const result = await client.executeSql(query);

      if (result && result.length > 0) {
        return {
          success: true,
          data: parseFloat(result[0].total) || 0,
        };
      }

      return {
        success: true,
        data: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to get today total PMP: ${errorMessage}`),
      };
    }
  }

  /**
   * 사용자의 최근 활동 로그 조회
   */
  async getRecentActivityLogs(
    userId: UserId,
    limit: number = 10
  ): Promise<Result<Array<{
    id: string;
    activityType: string;
    contentId: string | null;
    pmpEarned: number;
    description: string;
    createdAt: Date;
  }>>> {
    try {
      const client = await this.getClient();

      const query = `
        SELECT 
          id,
          activity_type,
          post_id,
          pmp_earned,
          description,
          created_at
        FROM forum.forum_activity_logs
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;

      const result = await client.executeSql(query);

      if (result) {
        const logs = result.map((row: {
          id: string;
          activity_type: string;
          post_id: string | null;
          pmp_earned: number | string;
          description: string;
          created_at: string;
        }) => ({
          id: row.id,
          activityType: row.activity_type,
          contentId: row.post_id,
          pmpEarned: typeof row.pmp_earned === 'string' ? parseFloat(row.pmp_earned) : row.pmp_earned,
          description: row.description,
          createdAt: new Date(row.created_at),
        }));

        return {
          success: true,
          data: logs,
        };
      }

      return {
        success: true,
        data: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to get recent activity logs: ${errorMessage}`),
      };
    }
  }

  /**
   * 특정 기간의 활동 통계 조회
   */
  async getActivityStats(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Result<{
    totalActivities: number;
    totalPmpEarned: number;
    byActivityType: Record<string, { count: number; pmpEarned: number }>;
  }>> {
    try {
      const client = await this.getClient();

      const query = `
        SELECT 
          activity_type,
          COUNT(*) as count,
          COALESCE(SUM(pmp_earned), 0) as pmp_earned
        FROM forum.forum_activity_logs
        WHERE user_id = '${userId}'
          AND created_at >= '${startDate.toISOString()}'
          AND created_at < '${endDate.toISOString()}'
        GROUP BY activity_type;
      `;

      const result = await client.executeSql(query);

      if (result) {
        let totalActivities = 0;
        let totalPmpEarned = 0;
        const byActivityType: Record<string, { count: number; pmpEarned: number }> = {};

        result.forEach((row: {
          activity_type: string;
          count: string;
          pmp_earned: string;
        }) => {
          const count = parseInt(row.count, 10);
          const pmpEarned = parseFloat(row.pmp_earned);

          totalActivities += count;
          totalPmpEarned += pmpEarned;
          byActivityType[row.activity_type] = { count, pmpEarned };
        });

        return {
          success: true,
          data: {
            totalActivities,
            totalPmpEarned,
            byActivityType,
          },
        };
      }

      return {
        success: true,
        data: {
          totalActivities: 0,
          totalPmpEarned: 0,
          byActivityType: {},
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: new Error(`Failed to get activity stats: ${errorMessage}`),
      };
    }
  }
}
