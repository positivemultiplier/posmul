/**
 * 경제 시스템 유틸리티 함수
 */

import { PmpAmount, PmcAmount } from '../types';

/**
 * PMP 금액 포맷팅
 */
export function formatPMP(amount: number | PmpAmount): string {
  return `${Number(amount).toLocaleString()} PMP`;
}

/**
 * PMC 금액 포맷팅
 */
export function formatPMC(amount: number | PmcAmount): string {
  return `${Number(amount).toLocaleString()} PMC`;
}

/**
 * 금액 계산 유틸리티
 */
export function calculateConversionRate(pmpAmount: PmpAmount): PmcAmount {
  // 1 PMP = 10 PMC 변환 비율 (예시)
  return (Number(pmpAmount) * 10) as PmcAmount;
}

export function calculatePmpFromPmc(pmcAmount: PmcAmount): PmpAmount {
  // 10 PMC = 1 PMP 변환 비율 (예시)
  return (Number(pmcAmount) / 10) as PmpAmount;
}

/**
 * 잔액 유효성 검증
 */
export function validateTransaction(
  currentBalance: PmpAmount | PmcAmount,
  transactionAmount: PmpAmount | PmcAmount
): { isValid: boolean; error?: string } {
  if (Number(transactionAmount) <= 0) {
    return { isValid: false, error: '거래 금액은 0보다 커야 합니다.' };
  }
  
  if (Number(currentBalance) < Number(transactionAmount)) {
    return { isValid: false, error: '잔액이 부족합니다.' };
  }
  
  return { isValid: true };
}

/**
 * 거래 타입별 설명 생성
 */
export function getTransactionDescription(
  type: string, 
  amount: PmpAmount | PmcAmount,
  _metadata?: Record<string, unknown>
): string {
  const formattedAmount = typeof amount === 'number' && amount % 1 === 0 && amount >= 10 
    ? formatPMC(amount as PmcAmount)
    : formatPMP(amount as PmpAmount);
    
  switch (type) {
    case 'pmp_earned':
      return `${formattedAmount} 획득`;
    case 'pmc_spent':
      return `${formattedAmount} 사용`;
    case 'pmp_to_pmc_conversion':
      return `${formattedAmount} PMP를 PMC로 변환`;
    case 'pmc_to_pmp_conversion':
      return `${formattedAmount} PMC를 PMP로 변환`;
    case 'donation_received':
      return `기부 수령: ${formattedAmount}`;
    case 'investment_return':
      return `투자 수익: ${formattedAmount}`;
    case 'prediction_reward':
      return `예측 보상: ${formattedAmount}`;
    default:
      return `거래: ${formattedAmount}`;
  }
}

/**
 * 경제 통계 계산
 */
export function calculateEconomicMetrics(transactions: Array<{
  type: string;
  amount: PmpAmount | PmcAmount;
  createdAt: Date;
}>) {
  const totalEarned = transactions
    .filter(t => t.type.includes('earned') || t.type.includes('received') || t.type.includes('reward'))
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalSpent = transactions
    .filter(t => t.type.includes('spent'))
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const monthlyTransactions = transactions.filter(t => t.createdAt >= thisMonth);
  
  return {
    totalEarned: totalEarned as PmpAmount,
    totalSpent: totalSpent as PmcAmount,
    monthlyTransactionCount: monthlyTransactions.length,
    netGain: (totalEarned - totalSpent) as PmpAmount
  };
}
