/**
 * Legacy Economy Client Adapter (Simplified)
 * 
 * 기존 MCP 경제 시스템을 새로운 Auth-Economy SDK로 점진적 마이그레이션하기 위한 어댑터
 */

import { createAuthEconomyClient } from '@posmul/auth-economy-sdk';

// 간소화된 어댑터 - 기본적인 경제 기능만 지원
export class SimpleEconomyAdapter {
  private client: ReturnType<typeof createAuthEconomyClient>;

  constructor() {
    this.client = createAuthEconomyClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      enableEconomy: true,
    });
  }

  /**
   * 레거시 호환 - 경제 잔액 조회
   */
  async getEconomicBalance(userId: string): Promise<{
    pmpBalance: number;
    pmcBalance: number;
    lastActivity: string | null;
  }> {
    try {
      // SDK에서 통합 잔액 조회 시도
      const combinedResult = await this.client.economy.getCombinedBalance(userId as any);
      
      if (combinedResult.success) {
        return {
          pmpBalance: Number(combinedResult.data.pmp) || 0,
          pmcBalance: Number(combinedResult.data.pmc) || 0,
          lastActivity: combinedResult.data.lastUpdated?.toISOString() || new Date().toISOString(),
        };
      }

      // 통합 조회 실패 시 개별 잔액 조회 시도
      const pmpResult = await this.client.economy.getPmpAmountBalance(userId as any);
      const pmcResult = await this.client.economy.getPmcAmountBalance(userId as any);

      return {
        pmpBalance: pmpResult.success ? Number(pmpResult.data) : 0,
        pmcBalance: pmcResult.success ? Number(pmcResult.data) : 0,
        lastActivity: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get economic balance:', error);
      // 오류 시 기본값 반환 (사용자에게 0으로 표시)
      return {
        pmpBalance: 0,
        pmcBalance: 0,
        lastActivity: null,
      };
    }
  }
}

// 싱글톤 및 래퍼 함수들
let adapterInstance: SimpleEconomyAdapter | null = null;

export function getEconomyAdapter(): SimpleEconomyAdapter {
  if (!adapterInstance) {
    adapterInstance = new SimpleEconomyAdapter();
  }
  return adapterInstance;
}

// 레거시 호환 함수들
export const getEconomicBalance = (userId: string) => 
  getEconomyAdapter().getEconomicBalance(userId);

export const recordEconomicTransaction = async (transaction: any) => {
  console.warn('recordEconomicTransaction not implemented in SDK yet');
  return { success: false, error: 'Not implemented' };
};

export const getSystemStats = async () => {
  console.warn('getSystemStats not implemented in SDK yet');
  return {
    totalPmpAmount: 0,
    totalPmcAmount: 0,
    activeUsers: 0,
    totalTransactions: 0,
    lastUpdate: new Date().toISOString(),
  };
};
