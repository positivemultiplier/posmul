/**
 * PMP/PMC Account Repository Interface
 *
 * PMP와 PMC 잔액 관리를 위한 리포지토리 인터페이스
 * Clean Architecture 원칙에 따라 도메인 계층에서 인터페이스만 정의
 */

import { UserId } from "@/shared/types/branded-types";
import { Result } from "@/shared/types/common";
import { PMC, PMP } from "../value-objects";

/**
 * 계정 잔액 정보
 */
export interface AccountBalance {
  readonly userId: UserId;
  readonly pmpBalance: PMP;
  readonly pmcBalance: PMC;
  readonly totalPMPEarned: PMP;
  readonly totalPMCEarned: PMC;
  readonly totalPMPSpent: PMP;
  readonly totalPMCSpent: PMC;
  readonly accountStatus: "active" | "frozen" | "suspended" | "dormant";
  readonly lastActivityAt: Date;
  readonly agencyScore: number;
  readonly informationAsymmetryReduction: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 거래 내역
 */
export interface Transaction {
  readonly transactionId: string;
  readonly userId: UserId;
  readonly type:
    | "PMP_EARN"
    | "PMC_EARN"
    | "PMP_SPEND"
    | "PMC_SPEND"
    | "PMP_TO_PMC_CONVERT"
    | "PMC_TO_PMP_CONVERT"
    | "DONATION"
    | "PREDICTION_STAKE"
    | "PREDICTION_REWARD"
    | "SOCIAL_REWARD"
    | "MONEYWAVE1_EMISSION"
    | "MONEYWAVE2_REDISTRIBUTION"
    | "MONEYWAVE3_INVESTMENT"
    | "PENALTY"
    | "ADMIN_ADJUSTMENT"
    | "SYSTEM_REWARD";
  readonly amount: number;
  readonly currencyType: "PMP" | "PMC";
  readonly description: string;
  readonly timestamp: Date;
  readonly referenceType?: string;
  readonly referenceId?: string;
  readonly behavioralEconomicsBonus?: number;
  readonly agencyTheoryMultiplier?: number;
  readonly networkEffectBonus?: number;
  readonly pmpBalanceAfter?: number;
  readonly pmcBalanceAfter?: number;
}

/**
 * 계정 활동 상태
 */
export interface AccountActivity {
  readonly userId: UserId;
  readonly lastLoginDate: Date;
  readonly lastTransactionDate: Date;
  readonly transactionCount: number;
  readonly totalPMPEarned: PMP;
  readonly totalPMCEarned: PMC;
  readonly averageActivityScore: number;
}

/**
 * 검색 필터 조건
 */
export interface AccountSearchFilter {
  readonly minPMPBalance?: PMP;
  readonly maxPMPBalance?: PMP;
  readonly minPMCBalance?: PMC;
  readonly maxPMCBalance?: PMC;
  readonly accountStatus?: "active" | "frozen" | "suspended" | "dormant";
  readonly lastActivityBefore?: Date;
  readonly lastActivityAfter?: Date;
  readonly inactiveDays?: number;
  readonly accountTypes?: string[];
}

/**
 * PMP/PMC 계정 리포지토리 인터페이스
 */
export interface IPMPPMCAccountRepository {
  /**
   * 사용자 계정 잔액 조회
   */
  getAccountBalance(userId: UserId): Promise<Result<AccountBalance>>;

  /**
   * 여러 사용자 계정 잔액 조회
   */
  getAccountBalances(userIds: UserId[]): Promise<Result<AccountBalance[]>>;

  /**
   * 계정 잔액 업데이트
   */
  updateAccountBalance(
    userId: UserId,
    pmpBalance: PMP,
    pmcBalance: PMC
  ): Promise<Result<AccountBalance>>;

  /**
   * 거래 기록 저장
   */
  saveTransaction(
    transaction: Omit<Transaction, "transactionId">
  ): Promise<Result<Transaction>>;

  /**
   * 사용자 거래 내역 조회
   */
  getUserTransactions(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<Result<Transaction[]>>;

  /**
   * 거래 ID로 거래 조회
   */
  getTransactionById(transactionId: string): Promise<Result<Transaction>>;

  /**
   * 계정 활동 상태 조회
   */
  getAccountActivity(userId: UserId): Promise<Result<AccountActivity>>;

  /**
   * 휴면 계정 검색
   */
  findDormantAccounts(
    dormancyPeriodMonths: number,
    minBalance?: PMC
  ): Promise<Result<AccountBalance[]>>;

  /**
   * 조건별 계정 검색
   */
  searchAccounts(
    filter: AccountSearchFilter,
    limit?: number,
    offset?: number
  ): Promise<Result<AccountBalance[]>>;

  /**
   * 전체 PMP/PMC 통계
   */
  getSystemTotals(): Promise<
    Result<{
      totalPMPSupply: PMP;
      totalPMCSupply: PMC;
      activeAccountCount: number;
      totalTransactionCount: number;
    }>
  >;

  /**
   * 지니계수 계산을 위한 자산 분포 조회
   */
  getWealthDistribution(): Promise<
    Result<{
      pmcDistribution: number[];
      pmpDistribution: number[];
      giniCoefficient: number;
    }>
  >;
}
