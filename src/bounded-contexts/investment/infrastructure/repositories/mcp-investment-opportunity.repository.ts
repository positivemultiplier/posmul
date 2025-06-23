import { UserId } from "@/bounded-contexts/auth/domain/value-objects/user-value-objects";
import { MCPError, handleMCPError } from "@/shared/mcp/mcp-errors";
import { mcp_supabase_execute_sql } from "@/shared/mcp/supabase-client";
import { Result, failure, success } from "@/shared/types/common";
import { InvestmentOpportunity } from "../../domain/entities/investment-opportunity.entity";
import { IInvestmentOpportunityRepository } from "../../domain/repositories/investment-opportunity.repository";
import {
  InvestmentCategory,
  InvestmentOpportunityId,
  InvestmentType,
  OpportunityStatus,
} from "../../domain/value-objects/investment-value-objects";

/**
 * MCP-based Investment Opportunity Repository Implementation
 * Supabase MCP를 사용한 투자 기회 리포지토리 구현체
 */
export class MCPInvestmentOpportunityRepository
  implements IInvestmentOpportunityRepository
{
  constructor(private readonly projectId: string) {}

  async save(
    opportunity: InvestmentOpportunity
  ): Promise<Result<void, MCPError>> {
    const props = (opportunity as any).props;
    const query = `
      INSERT INTO investment_opportunities (
        id, creator_id, title, description, investment_type, category, subcategory, 
        target_amount, minimum_investment, maximum_investment, current_amount, 
        funding_start_date, funding_end_date, expected_return_date, expected_return_rate, 
        risk_level, status, pmp_required, pmc_reward_pool, money_wave_eligible, 
        performance_metrics, tags, external_links, documents, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        current_amount = EXCLUDED.current_amount,
        updated_at = NOW(),
        version = investment_opportunities.version + 1;
    `;
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });
      return success(undefined);
    } catch (error) {
      return failure(handleMCPError(error, "save_investment_opportunity"));
    }
  }

  async findById(
    id: InvestmentOpportunityId
  ): Promise<Result<InvestmentOpportunity | null, MCPError>> {
    const query = `SELECT * FROM investment_opportunities WHERE id = '${id.toString()}'`;
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });

      if (!result || !result.data || result.data.length === 0) {
        return success(null);
      }

      return success(this.mapDatabaseToDomain(result.data[0]));
    } catch (error) {
      return failure(handleMCPError(error, "find_opportunity_by_id"));
    }
  }

  private async findAndCount(
    whereClause: string,
    limit: number,
    offset: number
  ): Promise<
    Result<{ opportunities: InvestmentOpportunity[]; total: number }, MCPError>
  > {
    const dataQuery = `
      SELECT * FROM investment_opportunities 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const countQuery = `SELECT COUNT(*) as total FROM investment_opportunities ${whereClause}`;
    try {
      const [dataResult, countResult] = await Promise.all([
        mcp_supabase_execute_sql({
          project_id: this.projectId,
          query: dataQuery,
        }),
        mcp_supabase_execute_sql({
          project_id: this.projectId,
          query: countQuery,
        }),
      ]);

      const opportunities =
        dataResult.data?.map((row: any) => this.mapDatabaseToDomain(row)) || [];
      const total = countResult.data?.[0]?.total || 0;

      return success({ opportunities, total });
    } catch (error) {
      return failure(handleMCPError(error, "findAndCount"));
    }
  }

  async findActive(limit = 20, offset = 0) {
    return this.findAndCount(`WHERE status = 'ACTIVE'`, limit, offset);
  }

  async findByType(type: InvestmentType, limit = 20, offset = 0) {
    return this.findAndCount(
      `WHERE investment_type = '${type}'`,
      limit,
      offset
    );
  }

  async findByCategory(category: InvestmentCategory, limit = 20, offset = 0) {
    return this.findAndCount(`WHERE category = '${category}'`, limit, offset);
  }

  async findByCreator(creatorId: UserId, limit = 20, offset = 0) {
    return this.findAndCount(
      `WHERE creator_id = '${creatorId.toString()}'`,
      limit,
      offset
    );
  }

  async findByStatus(status: OpportunityStatus, limit = 20, offset = 0) {
    return this.findAndCount(`WHERE status = '${status}'`, limit, offset);
  }

  async findByFundingPeriod(
    startDate: Date,
    endDate: Date,
    limit = 20,
    offset = 0
  ) {
    const where = `WHERE funding_start_date >= '${startDate.toISOString()}' AND funding_end_date <= '${endDate.toISOString()}'`;
    return this.findAndCount(where, limit, offset);
  }

  async findByAmountRange(
    minAmount: number,
    maxAmount: number,
    limit = 20,
    offset = 0
  ) {
    const where = `WHERE target_amount BETWEEN ${minAmount} AND ${maxAmount}`;
    return this.findAndCount(where, limit, offset);
  }

  async findByRiskLevel(riskLevel: number, limit = 20, offset = 0) {
    return this.findAndCount(`WHERE risk_level = ${riskLevel}`, limit, offset);
  }

  async search(query: string, filters: any = {}, limit = 20, offset = 0) {
    // Basic search implementation
    const where = `WHERE title ILIKE '%${query}%' OR description ILIKE '%${query}%'`;
    return this.findAndCount(where, limit, offset);
  }

  async delete(id: InvestmentOpportunityId): Promise<Result<void, MCPError>> {
    const query = `UPDATE investment_opportunities SET status = 'CANCELLED', updated_at = NOW() WHERE id = '${id.toString()}'`;
    try {
      await mcp_supabase_execute_sql({ project_id: this.projectId, query });
      return success(undefined);
    } catch (error) {
      return failure(handleMCPError(error, "delete_opportunity"));
    }
  }

  async getStatistics(filters: any = {}) {
    // TODO: Implement statistics logic
    return success({
      totalOpportunities: 0,
      totalTargetAmount: 0,
      totalCurrentAmount: 0,
      averageReturnRate: 0,
      categoryStats: [],
      typeStats: [],
    });
  }

  async findEndingSoon(
    daysRemaining: number,
    limit = 10
  ): Promise<Result<InvestmentOpportunity[], MCPError>> {
    const query = `
      SELECT * FROM investment_opportunities 
      WHERE status = 'ACTIVE' 
      AND funding_end_date > NOW()
      AND funding_end_date <= NOW() + INTERVAL '${daysRemaining} days'
      ORDER BY funding_end_date ASC
      LIMIT ${limit}
    `;
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });
      const opportunities =
        result.data?.map((row: any) => this.mapDatabaseToDomain(row)) || [];
      return success(opportunities);
    } catch (error) {
      return failure(handleMCPError(error, "findEndingSoon"));
    }
  }

  async findByFundingProgress(
    minProgress: number,
    maxProgress: number,
    limit = 20,
    offset = 0
  ) {
    const where = `WHERE (current_amount / target_amount) * 100 BETWEEN ${minProgress} AND ${maxProgress}`;
    return this.findAndCount(where, limit, offset);
  }

  private mapDatabaseToDomain(row: any): InvestmentOpportunity {
    // This needs a proper implementation with a fromPersistence method in the entity
    return row as InvestmentOpportunity;
  }
}

export default MCPInvestmentOpportunityRepository;
