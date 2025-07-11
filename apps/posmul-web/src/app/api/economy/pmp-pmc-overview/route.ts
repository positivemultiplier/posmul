import { NextRequest, NextResponse } from "next/server";
import { getEconomicBalance } from "../../../../shared/adapters/simple-economy.adapter";

/**
 * GET /api/economy/pmp-pmc-overview
 * PmpAmount/PmcAmount 경제 시스템 개요 조회 (Auth-Economy SDK 기반)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_USER_ID",
            message: "User ID is required",
          },
        },
        { status: 400 }
      );
    }

    // 새로운 SDK 어댑터를 통한 잔액 조회
    const balanceData = await getEconomicBalance(userId);

    // 시스템 통계 조회 (현재 SDK에서 지원하지 않으므로 기본값)
    const systemStats = {
      totalPmpAmount: 1000000,
      totalPmcAmount: 500000,
      activeUsers: 100,
      totalTransactions: 10000,
    };

    // 사용자 경제 통계 (기본값으로 초기화)
    const userStats = await calculateUserEconomicStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        userEconomy: {
          pmpBalance: balanceData.pmpBalance,
          pmcBalance: balanceData.pmcBalance,
          totalValue: balanceData.pmpBalance + balanceData.pmcBalance,
          lastActivity: balanceData.lastActivity,
          stats: userStats,
        },
        systemEconomy: {
          totalPmpInCirculation: systemStats.totalPmpAmount,
          totalPmcInCirculation: systemStats.totalPmcAmount,
          activeUsers: systemStats.activeUsers,
          dailyTransactionVolume: systemStats.totalTransactions,
        },
        moneyWave: {
          currentWave: 1,
          dailyPrizePool: 5000, // 기본값
          nextDistribution: new Date(Date.now() + 24 * 60 * 60 * 1000),
          waveEfficiency: 0.85,
        },
        marketIndicators: {
          pmpDemand: calculatePmpDemand(systemStats),
          pmcVolatility: calculatePmcVolatility(systemStats),
          economicHealth: calculateEconomicHealth(systemStats),
        },
      },
      metadata: {
        timestamp: new Date(),
        version: "2.0.0-sdk", // SDK 기반 버전
        refreshInterval: 300,
        migrationStatus: "auth-economy-sdk-integrated",
      },
    });
  } catch (error) {
    console.error("GET /api/economy/pmp-pmc-overview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자 경제 통계 계산 (SDK 기반)
 */
async function calculateUserEconomicStats(userId: string): Promise<{
  weeklyPmpEarned: number;
  weeklyPmcEarned: number;
  totalTransactions: number;
  averageTransactionSize: number;
  riskScore: number;
}> {
  try {
    // SDK를 통한 트랜잭션 히스토리 조회 (현재 미구현이므로 기본값)
    return {
      weeklyPmpEarned: 0,
      weeklyPmcEarned: 0,
      totalTransactions: 0,
      averageTransactionSize: 0,
      riskScore: 0.5,
    };
  } catch (error) {
    console.error("Error calculating user economic stats:", error);
    return {
      weeklyPmpEarned: 0,
      weeklyPmcEarned: 0,
      totalTransactions: 0,
      averageTransactionSize: 0,
      riskScore: 0.5,
    };
  }
}

/**
 * PmpAmount 수요 계산
 */
function calculatePmpDemand(systemStats: any): number {
  if (!systemStats.totalPmpAmount) return 0;
  const demandRatio = systemStats.totalTransactions / systemStats.totalPmpAmount;
  return Math.min(demandRatio * 100, 100);
}

/**
 * PmcAmount 변동성 계산
 */
function calculatePmcVolatility(systemStats: any): number {
  if (!systemStats.totalPmcAmount) return 0;
  return 25; // 기본 변동성
}

/**
 * 경제 건강도 계산
 */
function calculateEconomicHealth(systemStats: any): number {
  const factors = [
    systemStats.activeUsers > 0 ? 25 : 0,
    systemStats.totalPmpAmount > 0 ? 25 : 0,
    systemStats.totalPmcAmount > 0 ? 25 : 0,
    systemStats.totalTransactions > 0 ? 25 : 0,
  ];
  return factors.reduce((sum, factor) => sum + factor, 0);
}
