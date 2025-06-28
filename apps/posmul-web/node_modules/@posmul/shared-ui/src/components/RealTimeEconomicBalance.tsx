"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
// import type { PmpPmcBalance } from "@posmul/shared-types"; // Type doesn't exist yet

interface RealTimeEconomicBalanceProps {
  userId: string;
  fetchBalance: (userId: string) => Promise<any | null>; // Using any temporarily
  autoRefresh?: boolean;
  refreshInterval?: number;
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

export function RealTimeEconomicBalance({
  userId,
  fetchBalance,
  autoRefresh = true,
  refreshInterval = 30000,
}: RealTimeEconomicBalanceProps) {
  const [balance, setBalance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedBalance = await fetchBalance(userId);
        setBalance(fetchedBalance);
      } catch (e: any) {
        setError(e.message || "Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    getBalance();

    if (autoRefresh) {
      const intervalId = setInterval(getBalance, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [userId, fetchBalance, autoRefresh, refreshInterval]);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  if (loading) {
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
            onClick={() => {
              // Implement the logic to fetch data again
            }}
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
              variant={balance?.is_active === true ? "default" : "secondary"}
            >
              {balance?.is_active === true ? "활성" : "비활성"}
            </Badge>
            {balance?.last_updated && (
              <span className="text-xs text-gray-500">
                {formatTime(balance.last_updated)} 업데이트
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
                {formatNumber(balance?.pmp_balance || 0)} PMP
              </div>
              <div className="text-sm text-blue-600">
                예측 게임 참여 가능 자산
              </div>
              <div className="text-xs text-blue-500">
                총 획득: {formatNumber(balance?.pmp_balance || 0)} PMP
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
                {formatNumber(balance?.pmc_balance || 0)} PMC
              </div>
              <div className="text-sm text-purple-600">
                기부 및 사회적 투자 전용
              </div>
              <div className="text-xs text-purple-500">
                총 획득: {formatNumber(balance?.pmc_balance || 0)} PMC
              </div>
            </div>
          </div>
        </div>

        {/* 활동 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {balance?.active_games || 0}
            </div>
            <div className="text-sm text-gray-600">활성 예측 게임</div>
            <div className="text-xs text-green-600 mt-1">
              총 베팅: {formatNumber(balance?.total_bet_amount || 0)} PMP
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {balance?.active_investments || 0}
            </div>
            <div className="text-sm text-gray-600">활성 투자</div>
            <div className="text-xs text-blue-600 mt-1">
              총 투자: {formatNumber(balance?.total_invested || 0)}원
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {((balance?.success_rate || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">예측 성공률</div>
            <div className="text-xs text-orange-600 mt-1">
              Agency Score: {((balance?.agency_score || 0) * 100).toFixed(0)}
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
                  (balance?.pmp_balance || 0) / (balance?.pmc_balance || 1)
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
                {(balance?.pmp_balance || 0) > 100000
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
}
