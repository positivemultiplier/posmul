/**
 * Legacy Economy MCP Client Adapter
 * 
 * 기존 경제 시스템을 새로운 Auth-Economy SDK로 점진적 마이그레이션하기 위한 어댑터
 * 향후 완전히 SDK로 교체될 예정
 */

import { createAuthEconomyClient } from '@posmul/auth-economy-sdk';
import type { EconomyService } from '@posmul/auth-economy-sdk';

// 기존 인터페이스와의 호환성을 위한 어댑터
export class LegacyEconomyAdapter {
  private economyService: EconomyService;

  constructor() {
    const client = createAuthEconomyClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      enableEconomy: true,
    });
    this.economyService = client.economy;
  }

  /**
   * 💰 PMP/PMC 계정 잔액 조회 (레거시 호환)
   */
  async getEconomicBalance(userId: string): Promise<{
    pmpBalance: number;
    pmcBalance: number;
    lastActivity: string | null;
  }> {
    try {
      const combinedBalanceResult = await this.economyService.getCombinedBalance(userId);
      
      if (!combinedBalanceResult.success) {
        throw combinedBalanceResult.error;
      }

      return {
        pmpBalance: combinedBalanceResult.data.pmpBalance,
        pmcBalance: combinedBalanceResult.data.pmcBalance,
        lastActivity: combinedBalanceResult.data.lastActivity || null,
      };
    } catch (error) {
      console.error('Failed to get economic balance:', error);
      return {
        pmpBalance: 0,
        pmcBalance: 0,
        lastActivity: null,
      };
    }
  }

  /**
   * 🔄 경제 트랜잭션 기록 (레거시 호환)
   */
  async recordEconomicTransaction(transaction: {
    userId: string;
    type: 'PMP_EARNED' | 'PMC_EARNED' | 'PMP_SPENT' | 'PMC_SPENT';
    amount: number;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const result = await this.economyService.recordTransaction({
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        source: transaction.source,
        metadata: transaction.metadata,
      });

      return {
        success: true,
        transactionId: result.transactionId,
      };
    } catch (error) {
      console.error('Failed to record transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 📊 전체 시스템 통계 조회 (레거시 호환)
   */
  async getSystemStats(): Promise<{
    totalPMP: number;
    totalPMC: number;
    activeUsers: number;
    totalTransactions: number;
    lastUpdate: string;
  }> {
    try {
      const stats = await this.economyService.getSystemStats();
      return {
        totalPMP: stats.totalPMP,
        totalPMC: stats.totalPMC,
        activeUsers: stats.activeUsers,
        totalTransactions: stats.totalTransactions,
        lastUpdate: stats.lastUpdate,
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      return {
        totalPMP: 0,
        totalPMC: 0,
        activeUsers: 0,
        totalTransactions: 0,
        lastUpdate: new Date().toISOString(),
      };
    }
  }
}

// 싱글톤 인스턴스로 레거시 호환성 제공
let legacyEconomyAdapter: LegacyEconomyAdapter | null = null;

export function getLegacyEconomyAdapter(): LegacyEconomyAdapter {
  if (!legacyEconomyAdapter) {
    legacyEconomyAdapter = new LegacyEconomyAdapter();
  }
  return legacyEconomyAdapter;
}

// 기존 코드와의 호환성을 위한 래퍼 함수들
export const getEconomicBalance = (userId: string) => 
  getLegacyEconomyAdapter().getEconomicBalance(userId);

export const recordEconomicTransaction = (transaction: Parameters<LegacyEconomyAdapter['recordEconomicTransaction']>[0]) =>
  getLegacyEconomyAdapter().recordEconomicTransaction(transaction);

export const getSystemStats = () => 
  getLegacyEconomyAdapter().getSystemStats();
