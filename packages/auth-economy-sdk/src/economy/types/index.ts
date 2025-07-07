/**
 * 경제 시스템 타입 정의
 */

import { Result, UserId, TransactionId } from '../../types';
import { EconomyError } from '../../errors';

// === 공통 타입 재수출 ===
export type { UserId, TransactionId, Result } from '../../types';
export { EconomyError } from '../../errors';

// === 경제 브랜드 타입 ===
export type PmpAmount = number & { readonly brand: unique symbol };
export type PmcAmount = number & { readonly brand: unique symbol };

// === 거래 타입 ===
export type TransactionType = 
  | 'pmp_earned'
  | 'pmc_spent'
  | 'pmp_to_pmc_conversion'
  | 'pmc_to_pmp_conversion'
  | 'donation_received'
  | 'investment_return'
  | 'prediction_reward';

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
  type: 'PMP' | 'PMC';
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

// === 경제 서비스 인터페이스 ===
export interface EconomyService {
  getPMPBalance(userId: UserId): Promise<Result<PmpAmount, EconomyError>>;
  getPMCBalance(userId: UserId): Promise<Result<PmcAmount, EconomyError>>;
  getCombinedBalance(userId: UserId): Promise<Result<EconomicBalance, EconomyError>>;
  transferPMP(fromUserId: UserId, toUserId: UserId, amount: PmpAmount): Promise<Result<TransactionResult, EconomyError>>;
  transferPMC(fromUserId: UserId, toUserId: UserId, amount: PmcAmount): Promise<Result<TransactionResult, EconomyError>>;
}

// === 유틸리티 함수 ===
export function createPmpAmount(amount: number): PmpAmount {
  if (amount < 0) {
    throw new Error('PMP amount cannot be negative');
  }
  return amount as PmpAmount;
}

export function createPmcAmount(amount: number): PmcAmount {
  if (amount < 0) {
    throw new Error('PMC amount cannot be negative');
  }
  return amount as PmcAmount;
}

export function createTransactionId(id: string): TransactionId {
  return id as TransactionId;
}

export function formatPmpAmount(amount: PmpAmount): string {
  return `${amount.toLocaleString()} PMP`;
}

export function formatPmcAmount(amount: PmcAmount): string {
  return `${amount.toLocaleString()} PMC`;
}
