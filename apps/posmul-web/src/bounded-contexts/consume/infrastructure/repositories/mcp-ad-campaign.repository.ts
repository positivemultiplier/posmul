/**
 * MCP AdCampaign Repository Implementation
 * Supabase MCP를 사용한 광고 캠페인 리포지토리 구현
 */

import type { Result, IAdCampaignRepository } from '../../domain/repositories/ad-campaign.repository';
import { AdCampaign } from '../../domain/entities/ad-campaign.entity';

// MCP 실행 함수 타입
type McpExecuteSql = (projectId: string, query: string) => Promise<{ data?: unknown[]; error?: Error }>;

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID ?? 'fabyagohqqnusmnwekuc';

export class MCPAdCampaignRepository implements IAdCampaignRepository {
  constructor(private readonly mcpExecuteSql: McpExecuteSql) {}

  async findActiveCampaigns(): Promise<Result<AdCampaign[]>> {
    try {
      const query = `
        SELECT * FROM consume.ad_campaigns 
        WHERE status = 'ACTIVE' 
          AND (end_date IS NULL OR end_date > now())
          AND used_budget < total_budget
        ORDER BY created_at DESC
      `;
      
      const result = await this.mcpExecuteSql(PROJECT_ID, query);
      
      if (result.error) {
        return { success: false, error: result.error };
      }

      const campaigns = (result.data as Record<string, unknown>[]).map(
        row => AdCampaign.fromDatabase(row)
      );

      return { success: true, data: campaigns };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async findById(id: string): Promise<Result<AdCampaign | null>> {
    try {
      const query = `SELECT * FROM consume.ad_campaigns WHERE id = '${id}'`;
      const result = await this.mcpExecuteSql(PROJECT_ID, query);
      
      if (result.error) {
        return { success: false, error: result.error };
      }

      const rows = result.data as Record<string, unknown>[];
      if (rows.length === 0) {
        return { success: true, data: null };
      }

      return { success: true, data: AdCampaign.fromDatabase(rows[0]) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async updateBudgetUsage(campaignId: string, pmpAmount: number): Promise<Result<void>> {
    try {
      const query = `
        UPDATE consume.ad_campaigns 
        SET used_budget = used_budget + ${pmpAmount},
            updated_at = now()
        WHERE id = '${campaignId}'
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
