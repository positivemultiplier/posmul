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
      // 현재 SDK에는 getCombinedBalance가 제대로 구현되지 않았으므로
      // 개별 잔액 조회 후 결합
      const pmpResult = await this.client.economy.getPmpAmountBalance(userId as any);
      const pmcResult = await this.client.economy.getPmcAmountBalance(userId as any);

      return {
        pmpBalance: pmpResult.success ? Number(pmpResult.data) : 0,
        pmcBalance: pmcResult.success ? Number(pmcResult.data) : 0,
        lastActivity: new Date().toISOString(),
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
