"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { mcp_supabase_execute_sql } from "@/shared/mcp/supabase-client";
import React, { useEffect, useState } from "react";

interface RealTimeEconomicBalanceProps {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface EconomicBalance {
  pmpBalance: number;
  pmcBalance: number;
  totalPmpEarned: number;
  totalPmcEarned: number;
  totalPmpSpent: number;
  totalPmcSpent: number;
  lastUpdated: string;
  accountStatus: "active" | "inactive" | "suspended";
  agencyScore: number;
}

interface PredictionStats {
  activeGames: number;
  totalBetAmount: number;
  successRate: number;
  totalParticipations: number;
}

interface InvestmentStats {
  activeInvestments: number;
  totalInvestedAmount: number;
  portfolioValue: number;
  expectedReturns: number;
}

const PROJECT_ID = "fabyagohqqnusmnwekuc";

export const RealTimeEconomicBalance: React.FC<
  RealTimeEconomicBalanceProps
> = ({
  userId,
  autoRefresh = true,
  refreshInterval = 30000, // 30초
}) => {
  const [economicBalance, setEconomicBalance] =
    useState<EconomicBalance | null>(null);
  const [predictionStats, setPredictionStats] =
    useState<PredictionStats | null>(null);
  const [investmentStats, setInvestmentStats] =
    useState<InvestmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEconomicBalance = async () => {
    try {
      setError(null);
      const balanceResult = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: `
          SELECT 
            pmp_balance,
            pmc_balance,
            is_active,
            last_updated,
            created_at,
            updated_at
          FROM pmp_pmc_accounts 
          WHERE user_id = '${userId}' 
          LIMIT 1
        `,
      });

      if (balanceResult?.data?.[0]) {
        const data = balanceResult.data[0];
        setEconomicBalance({
          pmpBalance: data.pmp_balance || 0,
          pmcBalance: parseFloat(data.pmc_balance) || 0,
          totalPmpEarned: data.pmp_balance || 0, // Simplified for MVP
          totalPmcEarned: parseFloat(data.pmc_balance) || 0,
          totalPmpSpent: 0, // Will calculate from transactions
          totalPmcSpent: 0,
          lastUpdated: data.last_updated || data.updated_at,
          accountStatus: data.is_active ? "active" : "inactive",
          agencyScore: 0.85, // Mock for now
        });
      } else {
        // No account found, set default values
        setEconomicBalance({
          pmpBalance: 0,
          pmcBalance: 0,
          totalPmpEarned: 0,
          totalPmcEarned: 0,
          totalPmpSpent: 0,
          totalPmcSpent: 0,
          lastUpdated: new Date().toISOString(),
          accountStatus: "inactive",
          agencyScore: 0,
        });
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch economic balance:", err);
      setError("잔액 정보를 가져오는데 실패했습니다.");
    }
  };

  const fetchPredictionStats = async () => {
    try {
      const statsResult = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: `
          SELECT 
            COUNT(*) as total_predictions,
            SUM(bet_amount) as total_bet_amount,
            COUNT(DISTINCT game_id) as active_games
          FROM predictions 
          WHERE user_id = '${userId}' AND is_active = true
        `,
      });

      if (statsResult?.data?.[0]) {
        const data = statsResult.data[0];
        setPredictionStats({
          activeGames: data.active_games || 0,
          totalBetAmount: data.total_bet_amount || 0,
          successRate: 0.75, // Mock success rate
          totalParticipations: data.total_predictions || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch prediction stats:", err);
    }
  };

  const fetchInvestmentStats = async () => {
    try {
      const statsResult = await mcp_supabase_execute_sql({
        project_id: PROJECT_ID,
        query: `
          SELECT 
            COUNT(*) as active_investments,
            SUM(investment_amount) as total_invested
          FROM investment_participations 
          WHERE user_id = '${userId}' AND status = 'ACTIVE'
        `,
      });

      if (statsResult?.data?.[0]) {
        const data = statsResult.data[0];
        setInvestmentStats({
          activeInvestments: data.active_investments || 0,
          totalInvestedAmount: data.total_invested || 0,
          portfolioValue: (data.total_invested || 0) * 1.12, // Mock 12% growth
          expectedReturns: (data.total_invested || 0) * 0.15, // Mock 15% expected return
        });
      }
    } catch (err) {
      console.error("Failed to fetch investment stats:", err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchEconomicBalance(),
      fetchPredictionStats(),
      fetchInvestmentStats(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>💰 실시간 경제 현황</CardTitle>
          <CardDescription>데이터를 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">❌ 오류 발생</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            💰 실시간 경제 현황
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                economicBalance?.accountStatus === "active"
                  ? "default"
                  : "secondary"
              }
            >
              {economicBalance?.accountStatus === "active" ? "활성" : "비활성"}
            </Badge>
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                {formatTime(lastRefresh.toISOString())} 업데이트
              </span>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Agency Theory 기반 실시간 포트폴리오 모니터링
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 메인 잔액 표시 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-700">
                PMP (위험프리자산)
              </h3>
              <span className="text-2xl">🔒</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(economicBalance?.pmpBalance || 0)} PMP
              </div>
              <div className="text-sm text-blue-600">
                예측 게임 참여 가능 자산
              </div>
              <div className="text-xs text-blue-500">
                총 획득: {formatNumber(economicBalance?.totalPmpEarned || 0)}{" "}
                PMP
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-700">
                PMC (위험자산)
              </h3>
              <span className="text-2xl">💎</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(economicBalance?.pmcBalance || 0)} PMC
              </div>
              <div className="text-sm text-purple-600">
                기부 및 사회적 투자 전용
              </div>
              <div className="text-xs text-purple-500">
                총 획득: {formatNumber(economicBalance?.totalPmcEarned || 0)}{" "}
                PMC
              </div>
            </div>
          </div>
        </div>

        {/* 활동 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {predictionStats?.activeGames || 0}
            </div>
            <div className="text-sm text-gray-600">활성 예측 게임</div>
            <div className="text-xs text-green-600 mt-1">
              총 베팅: {formatNumber(predictionStats?.totalBetAmount || 0)} PMP
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {investmentStats?.activeInvestments || 0}
            </div>
            <div className="text-sm text-gray-600">활성 투자</div>
            <div className="text-xs text-blue-600 mt-1">
              총 투자: {formatNumber(investmentStats?.totalInvestedAmount || 0)}
              원
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {((predictionStats?.successRate || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">예측 성공률</div>
            <div className="text-xs text-orange-600 mt-1">
              Agency Score:{" "}
              {((economicBalance?.agencyScore || 0) * 100).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Agency Theory 인사이트 */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-700 mb-3 flex items-center gap-2">
            🧮 Agency Theory 기반 권장사항
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                💡 최적 포트폴리오 배분
              </div>
              <div className="text-indigo-600">
                현재 PMP:PMC 비율 ={" "}
                {(
                  (economicBalance?.pmpBalance || 0) /
                  (economicBalance?.pmcBalance || 1)
                ).toFixed(1)}
                :1
                <br />
                권장 비율: 2.5:1 (안정성 우선)
              </div>
            </div>
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                ⚡ 다음 권장 행동
              </div>
              <div className="text-indigo-600">
                {(economicBalance?.pmpBalance || 0) > 100000
                  ? "고액 예측 게임 참여 고려"
                  : "PMP 축적 후 예측 게임 참여 권장"}
              </div>
            </div>
          </div>
        </div>

        {/* 자동 새로고침 상태 */}
        {autoRefresh && (
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{refreshInterval / 1000}초마다 자동 업데이트 중</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
