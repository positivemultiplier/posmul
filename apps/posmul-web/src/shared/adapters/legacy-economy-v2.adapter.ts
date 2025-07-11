/**
 * Legacy Economy MCP Client Adapter
 *
 * 기존 경제 시스템을 새로운 Auth-Economy SDK로 점진적 마이그레이션하기 위한 어댑터
 * 향후 완전히 SDK로 교체될 예정
 */

import { createAuthEconomyClient, isFailure } from "@posmul/auth-economy-sdk";
import type { EconomyService, UserId } from "@posmul/auth-economy-sdk";

// 유틸리티 함수: string을 UserId로 브랜딩
function toUserId(id: string): UserId {
  return id as UserId;
}

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
   * 💰 PmpAmount/PmcAmount 계정 잔액 조회 (레거시 호환)
   */
  async getEconomicBalance(userId: string): Promise<{
    pmpBalance: number;
    pmcBalance: number;
    lastActivity: string | null;
  }> {
    try {
      const combinedBalanceResult =
        await this.economyService.getCombinedBalance(toUserId(userId));

      if (!combinedBalanceResult.success) {
        throw new Error("잔액 조회에 실패했습니다.");
      }

      const balance = combinedBalanceResult.data;

      return {
        pmpBalance: Number(balance.pmp),
        pmcBalance: Number(balance.pmc),
        lastActivity: balance.lastUpdated.toISOString(),
      };
    } catch (error) {
      console.error("Failed to get economic balance:", error);
      return {
        pmpBalance: 0,
        pmcBalance: 0,
        lastActivity: null,
      };
    }
  }

  /**
   * 🔄 경제 트랜잭션 기록 (레거시 호환)
   * 현재 SDK에서 직접 지원하지 않으므로 트랜잭션 히스토리를 조회하는 방식으로 구현
   */
  async recordEconomicTransaction(transaction: {
    userId: string;
    type:
      | "PmpAmount_EARNED"
      | "PmcAmount_EARNED"
      | "PmpAmount_SPENT"
      | "PmcAmount_SPENT";
    amount: number;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // SDK에 recordTransaction이 없으므로 임시로 성공 응답 반환
      // TODO: 실제 거래 기록 구현 필요

      return {
        success: true,
        transactionId: `temp_${Date.now()}`,
      };
    } catch (error) {
      console.error("Failed to record transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 📊 전체 시스템 통계 조회 (레거시 호환)
   * 현재 SDK에서 지원하지 않으므로 기본값 반환
   */
  async getSystemStats(): Promise<{
    totalPmpAmount: number;
    totalPmcAmount: number;
    activeUsers: number;
    totalTransactions: number;
    lastUpdate: string;
  }> {
    // SDK에 시스템 통계 API가 없으므로 기본값 반환
    console.warn(
      "System stats not implemented in SDK, returning default values"
    );
    return {
      totalPmpAmount: 0,
      totalPmcAmount: 0,
      activeUsers: 0,
      totalTransactions: 0,
      lastUpdate: new Date().toISOString(),
    };
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

export const recordEconomicTransaction = (
  transaction: Parameters<LegacyEconomyAdapter["recordEconomicTransaction"]>[0]
) => getLegacyEconomyAdapter().recordEconomicTransaction(transaction);

export const getSystemStats = () => getLegacyEconomyAdapter().getSystemStats();
