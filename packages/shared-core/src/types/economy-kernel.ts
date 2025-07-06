/**
 * Economy Kernel Types
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { UserId } from "./branded-types";
import { Result } from "./errors";

// Economy Kernel Error
export class EconomyKernelError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "EconomyKernelError";
  }
}

// Economic Error
export class EconomicError extends Error {
  constructor(
    message: string,
    public readonly economicType:
      | "insufficient-pmp"
      | "insufficient-pmc"
      | "invalid-transaction"
  ) {
    super(message);
    this.name = "EconomicError";
  }
}

// Account Types
export interface PmpAccount {
  readonly userId: UserId;
  readonly balance: number;
  readonly transactions: PmpTransaction[];
}

export interface PmcAccount {
  readonly userId: UserId;
  readonly balance: number;
  readonly transactions: PmcTransaction[];
}

export interface PmpTransaction {
  readonly id: string;
  readonly userId: UserId;
  readonly amount: number;
  readonly type: "EARNED" | "SPENT";
  readonly source: string;
  readonly sourceId: string;
  readonly createdAt: Date;
}

export interface PmcTransaction {
  readonly id: string;
  readonly userId: UserId;
  readonly amount: number;
  readonly type: "EARNED" | "SPENT";
  readonly source: string;
  readonly sourceId: string;
  readonly createdAt: Date;
}

// System Stats
export interface EconomySystemStats {
  totalPmpInCirculation: number;
  totalPmcInCirculation: number;
  totalUsers: number;
  dailyActiveUsers: number;
  transactionVolume24h: number;
}

// Repository Interface
export interface IEconomyKernelRepository {
  /**
   * PMP 잔액 조회
   */
  getPmpBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;

  /**
   * PMC 잔액 조회
   */
  getPmcBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;

  /**
   * PMP 계정 정보 조회
   */
  getPmpAccount(
    userId: UserId
  ): Promise<Result<PmpAccount, EconomyKernelError>>;

  /**
   * PMC 계정 정보 조회
   */
  getPmcAccount(
    userId: UserId
  ): Promise<Result<PmcAccount, EconomyKernelError>>;

  /**
   * 시스템 통계 조회
   */
  getSystemStats(): Promise<Result<EconomySystemStats, EconomyKernelError>>;

  /**
   * PMP 지출 가능 여부 확인
   */
  canSpendPmp(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>>;

  /**
   * PMC 지출 가능 여부 확인
   */
  canSpendPmc(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>>;
}
