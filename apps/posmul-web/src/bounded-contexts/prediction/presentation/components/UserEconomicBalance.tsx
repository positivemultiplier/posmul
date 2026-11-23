import React from "react";

import { Badge, Card } from "../../../../shared/ui/components/base";

interface UserEconomicBalanceProps {
  userId: string;
}

interface EconomicStats {
  pmpBalance: number;
  pmcBalance: number;
  totalEarnings: number;
  predictionAccuracy: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  participatedGames: number;
  wonGames: number;
}

// Mock data - will be replaced with actual economic service
const mockEconomicStats: EconomicStats = {
  pmpBalance: 2450,
  pmcBalance: 1850,
  totalEarnings: 8750,
  predictionAccuracy: 0.73,
  riskLevel: "MEDIUM",
  participatedGames: 23,
  wonGames: 17,
};

const UserEconomicBalance: React.FC<UserEconomicBalanceProps> = async ({
  userId: _userId,
}) => {
  // TODO: Replace with actual data fetching
  // const economicStats = await getEconomicStats(userId);
  const economicStats = mockEconomicStats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const getRiskBadge = (riskLevel: EconomicStats["riskLevel"]) => {
    const config = {
      LOW: { label: "보수적", variant: "success" as const },
      MEDIUM: { label: "중도적", variant: "default" as const },
      HIGH: { label: "공격적", variant: "destructive" as const },
    };

    return (
      <Badge variant={config[riskLevel].variant}>
        {config[riskLevel].label}
      </Badge>
    );
  };

  const winRate =
    economicStats.participatedGames > 0
      ? (
          (economicStats.wonGames / economicStats.participatedGames) *
          100
        ).toFixed(1)
      : "0";

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 p-6 mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            U
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">경제 현황</h3>
            <p className="text-gray-600 text-sm">
              Agency Theory 기반 포트폴리오 관리
            </p>
          </div>
        </div>

        {/* Economic Balance Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          {/* PmpAmount Balance */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(economicStats.pmpBalance)}
            </div>
            <div className="text-xs text-gray-500">
              PmpAmount (위험프리자산)
            </div>
            <div className="text-xs text-blue-600 mt-1">예측 참여 가능</div>
          </div>

          {/* PmcAmount Balance */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(economicStats.pmcBalance)}
            </div>
            <div className="text-xs text-gray-500">PmcAmount (위험자산)</div>
            <div className="text-xs text-purple-600 mt-1">기부 전용</div>
          </div>

          {/* Performance Stats */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(economicStats.predictionAccuracy * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">예측 정확도</div>
            <div className="text-xs text-green-600 mt-1">평균 73%</div>
          </div>

          {/* Win Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{winRate}%</div>
            <div className="text-xs text-gray-500">승률</div>
            <div className="text-xs text-orange-600 mt-1">
              {economicStats.wonGames}/{economicStats.participatedGames}
            </div>
          </div>
        </div>

        {/* Risk Profile & Actions */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">위험성향</div>
            {getRiskBadge(economicStats.riskLevel)}
          </div>

          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              포트폴리오
            </button>
            <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors">
              기부하기
            </button>
          </div>
        </div>
      </div>

      {/* Economic Insights */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">추천:</span>
            <span className="text-blue-700 font-medium">
              {economicStats.riskLevel === "LOW"
                ? "PmpAmount 비중 증가 권장 (안정성 우선)"
                : economicStats.riskLevel === "HIGH"
                  ? "PmcAmount 전환 적극 권장 (고수익 추구)"
                  : "PmpAmount/PmcAmount 균형 유지 권장 (최적 배분)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">다음 목표:</span>
            <span className="text-purple-700 font-medium">
              PmcAmount {formatCurrency(2000 - economicStats.pmcBalance)} 추가
              획득
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">MoneyWave:</span>
            <span className="text-green-700 font-medium">
              다음 분배까지 {Math.floor(Math.random() * 24)}시간
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { UserEconomicBalance };
