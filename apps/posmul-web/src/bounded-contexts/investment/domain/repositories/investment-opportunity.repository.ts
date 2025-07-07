import { UserId } from "@posmul/auth-economy-sdk";

import { Result, CompatibleBaseError } from "../../../../shared/legacy-compatibility";
import { InvestmentOpportunity } from "../entities/investment-opportunity.entity";
import {
  InvestmentCategory,
  InvestmentOpportunityId,
  InvestmentType,
  OpportunityStatus,
} from "../value-objects/investment-value-objects";

/**
 * Investment Opportunity Repository Interface
 * ?�자 기회 관리�? ?�한 리포지?�리 ?�터?�이??
 */
export interface IInvestmentOpportunityRepository {
  /**
   * ?�자 기회 ?�??
   */
  save(opportunity: InvestmentOpportunity): Promise<Result<void, CompatibleBaseError, CompatibleBaseError>>;

  /**
   * ID�??�자 기회 조회
   */
  findById(
    id: InvestmentOpportunityId
  ): Promise<Result<InvestmentOpportunity | null, CompatibleBaseError, CompatibleBaseError>>;

  /**
   * ?�성 ?�자 기회 목록 조회
   */
  findActive(
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�자 ?�?�별 기회 조회
   */
  findByType(
    type: InvestmentType,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * 카테고리�??�자 기회 조회
   */
  findByCategory(
    category: InvestmentCategory,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * 창작?�별 ?�자 기회 조회
   */
  findByCreator(
    creatorId: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�태�??�자 기회 조회
   */
  findByStatus(
    status: OpportunityStatus,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�??기간�??�자 기회 조회
   */
  findByFundingPeriod(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�자 금액 범위�?기회 조회
   */
  findByAmountRange(
    minAmount: number,
    maxAmount: number,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�험?�별 ?�자 기회 조회
   */
  findByRiskLevel(
    riskLevel: number,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * 검??기능 (?�목, ?�명, ?�그)
   */
  search(
    query: string,
    filters?: {
      type?: InvestmentType;
      category?: InvestmentCategory;
      status?: OpportunityStatus;
      riskLevel?: number;
      minAmount?: number;
      maxAmount?: number;
    },
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;

  /**
   * ?�자 기회 ??�� (?�프????��)
   */
  delete(id: InvestmentOpportunityId): Promise<Result<void, CompatibleBaseError>>;

  /**
   * ?�자 기회 ?�계 조회
   */
  getStatistics(filters?: {
    type?: InvestmentType;
    category?: InvestmentCategory;
    dateRange?: { start: Date; end: Date };
  }): Promise<
    Result<{
      totalOpportunities: number;
      totalTargetAmount: number;
      totalCurrentAmount: number;
      averageReturnRate: number;
      categoryStats: Array<{
        category: InvestmentCategory;
        count: number;
        totalAmount: number;
        averageRisk: number;
      }>;
      typeStats: Array<{
        type: InvestmentType;
        count: number;
        totalAmount: number;
        successRate: number;
      }>;
    }>
  >;

  /**
   * 마감 ?�박 ?�자 기회 조회
   */
  findEndingSoon(
    daysRemaining: number,
    limit?: number
  ): Promise<Result<InvestmentOpportunity[], CompatibleBaseError>>;

  /**
   * 목표 ?�성률별 ?�자 기회 조회
   */
  findByFundingProgress(
    minProgress: number,
    maxProgress: number,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      opportunities: InvestmentOpportunity[];
      total: number;
    }>
  >;
}

export default IInvestmentOpportunityRepository;
