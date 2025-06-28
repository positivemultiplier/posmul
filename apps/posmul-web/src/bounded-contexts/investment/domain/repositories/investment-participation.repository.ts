import { UserId } from "@/bounded-contexts/auth/domain/value-objects/user-value-objects";
import { Result } from "@/shared/types/common";
import { InvestmentParticipation } from "../entities/investment-participation.entity";
import {
  CurrencyType,
  InvestmentOpportunityId,
  InvestmentParticipationId,
  ParticipationStatus,
} from "../value-objects/investment-value-objects";

/**
 * Investment Participation Repository Interface
 * 투자 참여 기록 관리를 위한 리포지토리 인터페이스
 */
export interface IInvestmentParticipationRepository {
  /**
   * 투자 참여 기록 저장
   */
  save(participation: InvestmentParticipation): Promise<Result<void>>;

  /**
   * ID로 투자 참여 기록 조회
   */
  findById(
    id: InvestmentParticipationId
  ): Promise<Result<InvestmentParticipation | null>>;

  /**
   * 투자 기회별 참여 기록 조회
   */
  findByOpportunity(
    opportunityId: InvestmentOpportunityId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 사용자별 투자 참여 기록 조회
   */
  findByInvestor(
    investorId: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 사용자의 특정 투자 기회 참여 기록 조회
   */
  findByInvestorAndOpportunity(
    investorId: UserId,
    opportunityId: InvestmentOpportunityId
  ): Promise<Result<InvestmentParticipation | null>>;

  /**
   * 상태별 투자 참여 기록 조회
   */
  findByStatus(
    status: ParticipationStatus,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 통화 타입별 투자 참여 기록 조회
   */
  findByCurrencyType(
    currencyType: CurrencyType,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 투자 금액 범위별 참여 기록 조회
   */
  findByAmountRange(
    minAmount: number,
    maxAmount: number,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 기간별 투자 참여 기록 조회
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 수익률별 투자 참여 기록 조회
   */
  findByROIRange(
    minROI: number,
    maxROI: number,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 완료된 투자 참여 기록 조회 (수익 실현)
   */
  findCompleted(
    investorId?: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 활성 투자 참여 기록 조회
   */
  findActive(
    investorId?: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      participations: InvestmentParticipation[];
      total: number;
    }>
  >;

  /**
   * 투자 참여 기록 삭제
   */
  delete(id: InvestmentParticipationId): Promise<Result<void>>;

  /**
   * 사용자 투자 성과 통계 조회
   */
  getUserInvestmentPerformance(investorId: UserId): Promise<
    Result<{
      totalInvestments: number;
      totalInvestmentAmount: number;
      totalReturns: number;
      averageROI: number;
      bestPerformingInvestment: {
        opportunityId: InvestmentOpportunityId;
        roi: number;
        returnAmount: number;
      } | null;
      worstPerformingInvestment: {
        opportunityId: InvestmentOpportunityId;
        roi: number;
        returnAmount: number;
      } | null;
      currencyBreakdown: {
        pmp: { amount: number; returns: number };
        pmc: { amount: number; returns: number };
        mixed: { amount: number; returns: number };
      };
      statusBreakdown: {
        active: number;
        completed: number;
        cancelled: number;
        defaulted: number;
      };
    }>
  >;

  /**
   * 투자 기회별 참여 통계 조회
   */
  getOpportunityParticipationStats(
    opportunityId: InvestmentOpportunityId
  ): Promise<
    Result<{
      totalParticipants: number;
      totalInvestmentAmount: number;
      averageInvestmentAmount: number;
      currencyBreakdown: {
        pmp: { participants: number; amount: number };
        pmc: { participants: number; amount: number };
        mixed: { participants: number; amount: number };
      };
      participationTrend: Array<{
        date: Date;
        cumulativeParticipants: number;
        cumulativeAmount: number;
      }>;
    }>
  >;

  /**
   * 투자 참여 랭킹 조회 (투자 금액 기준)
   */
  getInvestmentRanking(
    opportunityId: InvestmentOpportunityId,
    limit?: number
  ): Promise<
    Result<
      Array<{
        investorId: UserId;
        investmentAmount: number;
        rank: number;
        returnAmount: number;
      }>
    >
  >;

  /**
   * 포트폴리오 다양성 분석
   */
  getPortfolioDiversification(investorId: UserId): Promise<
    Result<{
      totalOpportunities: number;
      categoryDistribution: Array<{
        category: string;
        count: number;
        amount: number;
        percentage: number;
      }>;
      riskDistribution: Array<{
        riskLevel: number;
        count: number;
        amount: number;
        percentage: number;
      }>;
      diversificationScore: number; // 0-100 점수
    }>
  >;
}

export default IInvestmentParticipationRepository;
