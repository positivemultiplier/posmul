import { UserId } from "@/bounded-contexts/auth/domain/value-objects/user-value-objects";
import { Result } from "@/shared/types/common";
import { InvestmentOpportunity } from "../entities/investment-opportunity.entity";
import {
  InvestmentCategory,
  InvestmentOpportunityId,
  InvestmentType,
  OpportunityStatus,
} from "../value-objects/investment-value-objects";

/**
 * Investment Opportunity Repository Interface
 * 투자 기회 관리를 위한 리포지토리 인터페이스
 */
export interface IInvestmentOpportunityRepository {
  /**
   * 투자 기회 저장
   */
  save(opportunity: InvestmentOpportunity): Promise<Result<void>>;

  /**
   * ID로 투자 기회 조회
   */
  findById(
    id: InvestmentOpportunityId
  ): Promise<Result<InvestmentOpportunity | null>>;

  /**
   * 활성 투자 기회 목록 조회
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
   * 투자 타입별 기회 조회
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
   * 카테고리별 투자 기회 조회
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
   * 창작자별 투자 기회 조회
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
   * 상태별 투자 기회 조회
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
   * 펀딩 기간별 투자 기회 조회
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
   * 투자 금액 범위별 기회 조회
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
   * 위험도별 투자 기회 조회
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
   * 검색 기능 (제목, 설명, 태그)
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
   * 투자 기회 삭제 (소프트 삭제)
   */
  delete(id: InvestmentOpportunityId): Promise<Result<void>>;

  /**
   * 투자 기회 통계 조회
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
   * 마감 임박 투자 기회 조회
   */
  findEndingSoon(
    daysRemaining: number,
    limit?: number
  ): Promise<Result<InvestmentOpportunity[]>>;

  /**
   * 목표 달성률별 투자 기회 조회
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
