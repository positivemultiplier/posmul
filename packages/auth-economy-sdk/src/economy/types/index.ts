/**
 * 경제 시스템 타입 정의
 * 모든 핵심 타입은 ../../types에서 통일되게 관리됩니다.
 */

import {
  Result,
  UserId,
  TransactionId,
  PmpAmount,
  PmcAmount,
  createUserId,
  unwrapPmpAmount,
  unwrapPmcAmount,
} from "../../types";
import { EconomyError } from "../../errors";

// === 공통 타입 재수출 ===
export type {
  UserId,
  TransactionId,
  Result,
  PmpAmount,
  PmcAmount,
} from "../../types";

export {
  createPmpAmount,
  createPmcAmount,
  createUserId,
  createTransactionId,
  unwrapPmpAmount,
  unwrapPmcAmount,
  isFailure,
  isSuccess,
  success,
  failure,
} from "../../types";

export { EconomyError } from "../../errors";

// === 거래 타입 ===
export type TransactionType =
  | "pmp_earned"
  | "pmc_spent"
  | "pmp_to_pmc_conversion"
  | "pmc_to_pmp_conversion"
  | "donation_received"
  | "investment_return"
  | "prediction_reward";

// === 경제 상태 ===
export interface EconomicBalance {
  pmp: PmpAmount;
  pmc: PmcAmount;
  lastUpdated: Date;
}

// === 거래 기록 ===
export interface Transaction {
  id: TransactionId;
  userId: UserId;
  type: TransactionType;
  amount: PmpAmount | PmcAmount;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// === 거래 결과 ===
export interface TransactionResult {
  id: TransactionId;
  fromUserId: UserId;
  toUserId: UserId;
  amount: PmpAmount | PmcAmount;
  type: "PmpAmount" | "PmcAmount";
  status: "completed" | "pending" | "failed";
  createdAt: Date;
}

// === 경제 서비스 인터페이스 ===
export interface EconomyService {
  getPmpAmountBalance(userId: UserId): Promise<Result<PmpAmount, EconomyError>>;
  getPmcAmountBalance(userId: UserId): Promise<Result<PmcAmount, EconomyError>>;
  getCombinedBalance(
    userId: UserId
  ): Promise<Result<EconomicBalance, EconomyError>>;
  transferPmpAmount(
    fromUserId: UserId,
    toUserId: UserId,
    amount: PmpAmount
  ): Promise<Result<TransactionResult, EconomyError>>;
  transferPmcAmount(
    fromUserId: UserId,
    toUserId: UserId,
    amount: PmcAmount
  ): Promise<Result<TransactionResult, EconomyError>>;
}

// === 유틸리티 함수 재수출 ===
// 모든 유틸리티 함수는 ../../types에서 통일되게 관리됩니다.
