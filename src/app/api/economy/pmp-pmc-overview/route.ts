import { EconomyKernel } from "@/shared/economy-kernel/services/economy-kernel.service";
import { MoneyWaveCalculatorService } from "@/shared/economy-kernel/services/money-wave-calculator.service";
import { UserId } from "@/shared/types/branded-types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/economy/pmp-pmc-overview
 * PMP/PMC 경제 시스템 개요 조회
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

    // 서비스 초기화
    const economyKernel = EconomyKernel.getInstance();
    const moneyWaveCalculator = new MoneyWaveCalculatorService();

    // 사용자 경제 현황 조회
    const [pmpBalanceResult, pmcBalanceResult] = await Promise.all([
      economyKernel.getPmpBalance(userId as UserId),
      economyKernel.getPmcBalance(userId as UserId),
    ]);

    // 결과 확인
    if (!pmpBalanceResult.success || !pmcBalanceResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BALANCE_FETCH_FAILED",
            message: "Failed to fetch user balance",
          },
        },
        { status: 500 }
      );
    }

    const pmpBalance = pmpBalanceResult.data;
    const pmcBalance = pmcBalanceResult.data;

    // 시스템 전체 현황 조회 (임시로 기본값 사용)
    const systemOverview = {
      totalPmpInCirculation: 1000000,
      totalPmcInCirculation: 500000,
      activeUsers: 100,
      dailyTransactionVolume: 10000,
    };

    // MoneyWave 현황 조회
    const dailyPrizePoolResult =
      await moneyWaveCalculator.calculateDailyPrizePool();
    const dailyPrizePool = dailyPrizePoolResult.success
      ? dailyPrizePoolResult.data
      : null;

    // 사용자 경제 통계 계산
    const userEconomicStats = await calculateUserEconomicStats(
      userId as UserId,
      economyKernel
    );

    return NextResponse.json({
      success: true,
      data: {
        userEconomy: {
          pmpBalance,
          pmcBalance,
          totalValue: pmpBalance + pmcBalance, // 간단한 합계
          stats: userEconomicStats,
        },
        systemEconomy: {
          totalPmpInCirculation: systemOverview.totalPmpInCirculation,
          totalPmcInCirculation: systemOverview.totalPmcInCirculation,
          activeUsers: systemOverview.activeUsers,
          dailyTransactionVolume: systemOverview.dailyTransactionVolume,
        },
        moneyWave: {
          currentWave: 1, // 기본값
          dailyPrizePool: dailyPrizePool?.totalDailyPool || 0,
          nextDistribution: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
          waveEfficiency: 0.85, // 기본 효율성
        },
        marketIndicators: {
          pmpDemand: calculatePmpDemand(systemOverview),
          pmcVolatility: calculatePmcVolatility(systemOverview),
          economicHealth: calculateEconomicHealth(systemOverview),
        },
      },
      metadata: {
        timestamp: new Date(),
        version: "1.0.0",
        refreshInterval: 300, // 5분마다 갱신 권장
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
 * 사용자 경제 통계 계산
 */
async function calculateUserEconomicStats(
  userId: UserId,
  economyKernel: EconomyKernel
): Promise<{
  weeklyPmpEarned: number;
  weeklyPmcEarned: number;
  totalTransactions: number;
  averageTransactionSize: number;
  riskScore: number;
}> {
  try {
    // 실제로는 transaction history를 조회해야 함
    // 여기서는 기본값 반환
    return {
      weeklyPmpEarned: 0,
      weeklyPmcEarned: 0,
      totalTransactions: 0,
      averageTransactionSize: 0,
      riskScore: 0.5, // 중간 위험도
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
 * PMP 수요 계산
 */
function calculatePmpDemand(systemOverview: any): number {
  // 간단한 수요 지수 계산
  if (!systemOverview.totalPmpInCirculation) return 0;

  const demandRatio =
    systemOverview.dailyTransactionVolume /
    systemOverview.totalPmpInCirculation;
  return Math.min(demandRatio * 100, 100); // 0-100 스케일
}

/**
 * PMC 변동성 계산
 */
function calculatePmcVolatility(systemOverview: any): number {
  // 간단한 변동성 지수 계산
  if (!systemOverview.totalPmcInCirculation) return 0;

  // 실제로는 가격 변동 이력을 분석해야 함
  return 25; // 기본값 25% 변동성
}

/**
 * 경제 건강도 계산
 */
function calculateEconomicHealth(systemOverview: any): number {
  // 여러 지표를 종합한 건강도 점수 (0-100)
  const factors = [
    systemOverview.activeUsers > 0 ? 25 : 0,
    systemOverview.totalPmpInCirculation > 0 ? 25 : 0,
    systemOverview.totalPmcInCirculation > 0 ? 25 : 0,
    systemOverview.dailyTransactionVolume > 0 ? 25 : 0,
  ];

  return factors.reduce((sum, factor) => sum + factor, 0);
}
