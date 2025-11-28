/**
 * MCP AdView Repository Implementation
 * Supabase MCP를 사용한 광고 시청 기록 리포지토리 구현
 */

import type { Result, IAdViewRepository, DailyViewStats } from '../../domain/repositories/ad-view.repository';
import { AdView } from '../../domain/entities/ad-view.entity';

// MCP 실행 함수 타입
type McpExecuteSql = (projectId: string, query: string) => Promise<{ data?: unknown[]; error?: Error }>;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID ?? 'fabyagohqqnusmnwekuc';

export class MCPAdViewRepository implements IAdViewRepository {
  constructor(private readonly mcpExecuteSql: McpExecuteSql) {}

  async save(adView: AdView): Promise<Result<AdView>> {
    try {
      const data = adView.toDatabase();
      const query = `
        INSERT INTO consume.ad_views (
          id, user_id, campaign_id, view_date, started_at, ended_at,
          watch_duration_seconds, completion_rate, is_completed,
          survey_completed, pmp_earned, device_info
        ) VALUES (
          '${data.id}',
          '${data.user_id}',
          '${data.campaign_id}',
          '${data.view_date}',
          '${data.started_at}',
          ${data.ended_at ? `'${data.ended_at}'` : 'NULL'},
          ${data.watch_duration_seconds},
          ${data.completion_rate},
          ${data.is_completed},
          ${data.survey_completed},
          ${data.pmp_earned},
          ${data.device_info ? `'${JSON.stringify(data.device_info)}'::jsonb` : 'NULL'}
        )
        RETURNING *
      `;

      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      return { success: true, data: AdView.fromDatabase(rows[0]) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async update(adView: AdView): Promise<Result<AdView>> {
    try {
      const data = adView.toDatabase();
      const query = `
        UPDATE consume.ad_views SET
          ended_at = ${data.ended_at ? `'${data.ended_at}'` : 'NULL'},
          watch_duration_seconds = ${data.watch_duration_seconds},
          completion_rate = ${data.completion_rate},
          is_completed = ${data.is_completed},
          survey_completed = ${data.survey_completed},
          pmp_earned = ${data.pmp_earned}
        WHERE id = '${data.id}'
        RETURNING *
      `;

      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      return { success: true, data: AdView.fromDatabase(rows[0]) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async findById(id: string): Promise<Result<AdView | null>> {
    try {
      const query = `SELECT * FROM consume.ad_views WHERE id = '${id}'`;
      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      if (rows.length === 0) {
        return { success: true, data: null };
      }

      return { success: true, data: AdView.fromDatabase(rows[0]) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async countUserDailyViews(userId: string, campaignId: string, date: Date): Promise<Result<number>> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        SELECT COUNT(*) as count 
        FROM consume.ad_views 
        WHERE user_id = '${userId}' 
          AND campaign_id = '${campaignId}'
          AND view_date = '${dateStr}'
      `;

      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      return { success: true, data: Number(rows[0]?.count ?? 0) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getDailyStats(userId: string, date: Date): Promise<Result<DailyViewStats>> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        SELECT 
          COALESCE(total_views, 0) as total_views,
          COALESCE(completed_views, 0) as completed_views,
          COALESCE(total_watch_time, 0) as total_watch_time,
          COALESCE(total_pmp_earned, 0) as total_pmp_earned,
          COALESCE(survey_count, 0) as survey_count
        FROM consume.daily_view_stats 
        WHERE user_id = '${userId}' AND view_date = '${dateStr}'
      `;

      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      if (rows.length === 0) {
        return {
          success: true,
          data: {
            totalViews: 0,
            completedViews: 0,
            totalWatchTime: 0,
            totalPmpEarned: 0,
            surveyCount: 0,
          },
        };
      }

      const row = rows[0];
      return {
        success: true,
        data: {
          totalViews: Number(row.total_views),
          completedViews: Number(row.completed_views),
          totalWatchTime: Number(row.total_watch_time),
          totalPmpEarned: Number(row.total_pmp_earned),
          surveyCount: Number(row.survey_count),
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async upsertDailyStats(
    userId: string,
    date: Date,
    pmpEarned: number,
    watchTime: number,
    isCompleted: boolean,
    hasSurvey: boolean
  ): Promise<Result<void>> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        INSERT INTO consume.daily_view_stats (
          user_id, view_date, total_views, completed_views, 
          total_watch_time, total_pmp_earned, survey_count
        ) VALUES (
          '${userId}', '${dateStr}', 1, ${isCompleted ? 1 : 0},
          ${watchTime}, ${pmpEarned}, ${hasSurvey ? 1 : 0}
        )
        ON CONFLICT (user_id, view_date) DO UPDATE SET
          total_views = consume.daily_view_stats.total_views + 1,
          completed_views = consume.daily_view_stats.completed_views + ${isCompleted ? 1 : 0},
          total_watch_time = consume.daily_view_stats.total_watch_time + ${watchTime},
          total_pmp_earned = consume.daily_view_stats.total_pmp_earned + ${pmpEarned},
          survey_count = consume.daily_view_stats.survey_count + ${hasSurvey ? 1 : 0},
          updated_at = now()
      `;

      const result = await this.mcpExecuteSql(PROJECT_ID, query);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
