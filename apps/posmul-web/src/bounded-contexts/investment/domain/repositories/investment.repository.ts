import { UserId } from "@posmul/shared-types";
import { Result } from "@posmul/shared-types";
import { Investment } from "../entities/investment.entity";
import {
  InvestmentId,
  InvestmentType,
} from "../value-objects/investment-value-objects";

/**
 * Investment Repository Interface
 * 사용자 투자/참여 기록 관리를 위한 리포지토리 인터페이스
 */
export interface IInvestmentRepository {
  /**
   * 투자 기록 저장
   */
  save(investment: Investment): Promise<Result<void>>;

  /**
   * ID로 투자 기록 조회
   */
  findById(id: InvestmentId): Promise<Result<Investment | null>>;

  /**
   * 사용자 ID로 투자 기록 조회
   */
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      investments: Investment[];
      total: number;
    }>
  >;

  /**
   * 투자 타입별 기록 조회
   */
  findByType(
    type: InvestmentType,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      investments: Investment[];
      total: number;
    }>
  >;

  /**
   * 사용자의 특정 타입 투자 기록 조회
   */
  findByUserIdAndType(
    userId: UserId,
    type: InvestmentType,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      investments: Investment[];
      total: number;
    }>
  >;

  /**
   * 타겟 ID별 투자 기록 조회 (특정 상점, 광고, 크라우드 펀딩에 대한 투자)
   */
  findByTargetId(
    targetId: string,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      investments: Investment[];
      total: number;
    }>
  >;

  /**
   * 사용자의 특정 타겟에 대한 투자 기록 조회
   */
  findByUserIdAndTargetId(
    userId: UserId,
    targetId: string
  ): Promise<Result<Investment | null>>;

  /**
   * 활성 투자 기록 조회
   */
  findActive(
    userId?: UserId,
    limit?: number,
    offset?: number
  ): Promise<
    Result<{
      investments: Investment[];
      total: number;
    }>
  >;

  /**
   * 투자 기록 삭제
   */
  delete(id: InvestmentId): Promise<Result<void>>;

  /**
   * 사용자 투자 통계 조회
   */
  getUserInvestmentStats(userId: UserId): Promise<
    Result<{
      totalInvestments: number;
      totalAmount: number;
      totalRewards: number;
      typeStats: Array<{
        type: InvestmentType;
        count: number;
        amount: number;
        rewards: number;
      }>;
    }>
  >;
}
