"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../shared/ui";
import React from "react";

interface UserEconomicDashboardProps {
  userId: string;
}

// Mock 데이터 (실제로는 API에서 가져옴)
const mockEconomicData = {
  pmpBalance: 2850,
  pmcBalance: 1425,
  totalEarned: {
    pmp: 5200,
    pmc: 2800,
  },
  totalSpent: {
    pmp: 2350,
    pmc: 1375,
  },
  riskProfile: "moderate" as "conservative" | "moderate" | "aggressive",
  agencyScore: 0.85, // Agency Theory 기반 점수 (0-1)
  capMAnalysis: {
    expectedReturn: 0.12,
    beta: 1.2,
    sharpeRatio: 0.8,
    optimalAllocation: {
      pmp: 0.6,
      pmc: 0.4,
    },
  },
  socialImpactScore: 0.78,
  predictionAccuracy: 0.87,
};

export const UserEconomicDashboard: React.FC<UserEconomicDashboardProps> = ({
  userId,
}) => {
  const data = mockEconomicData;

  const getRiskProfileColor = (profile: string) => {
    switch (profile) {
      case "conservative":
        return "bg-green-100 text-green-800 border-green-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "aggressive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskProfileText = (profile: string) => {
    switch (profile) {
      case "conservative":
        return "보수적 투자자";
      case "moderate":
        return "중도적 투자자";
      case "aggressive":
        return "공격적 투자자";
      default:
        return "분석 중";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">💰 경제 현황 대시보드</span>
          <Badge className={getRiskProfileColor(data.riskProfile)}>
            {getRiskProfileText(data.riskProfile)}
          </Badge>
        </CardTitle>
        <CardDescription>
          CAPM 모델과 Agency Theory를 기반으로 한 개인화된 경제 분석
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 잔액 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-700">
                PmpAmount (Risk-Free Asset)
              </h3>
              <span className="text-2xl">🔒</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                {data.pmpBalance.toLocaleString()} PmpAmount
              </div>
              <div className="text-sm text-blue-600">
                총 획득: {data.totalEarned.pmp.toLocaleString()} PmpAmount
              </div>
              <div className="text-sm text-blue-600">
                총 사용: {data.totalSpent.pmp.toLocaleString()} PmpAmount
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-700">
                PmcAmount (Risky Asset)
              </h3>
              <span className="text-2xl">💎</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {data.pmcBalance.toLocaleString()} PmcAmount
              </div>
              <div className="text-sm text-purple-600">
                총 획득: {data.totalEarned.pmc.toLocaleString()} PmcAmount
              </div>
              <div className="text-sm text-purple-600">
                총 기부: {data.totalSpent.pmc.toLocaleString()} PmcAmount
              </div>
            </div>
          </div>
        </div>

        {/* CAPM 분석 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📈 CAPM 기반 포트폴리오 분석
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">기대수익률</div>
              <div className="text-xl font-bold text-green-600">
                {(data.capMAnalysis.expectedReturn * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">베타 (β)</div>
              <div className="text-xl font-bold text-blue-600">
                {data.capMAnalysis.beta.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">샤프 비율</div>
              <div className="text-xl font-bold text-orange-600">
                {data.capMAnalysis.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">예측 정확도</div>
              <div className="text-xl font-bold text-purple-600">
                {(data.predictionAccuracy * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 최적 배분 권장사항 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ⚖️ 최적 포트폴리오 배분 권장
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-700 font-medium">PmpAmount 배분</span>
                  <span className="text-blue-600 font-bold">
                    {(data.capMAnalysis.optimalAllocation.pmp * 100).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        data.capMAnalysis.optimalAllocation.pmp * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 font-medium">PmcAmount 배분</span>
                  <span className="text-purple-600 font-bold">
                    {(data.capMAnalysis.optimalAllocation.pmc * 100).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        data.capMAnalysis.optimalAllocation.pmc * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              💡 현재 위험 성향과 시장 상황을 고려한 최적 배분입니다.
            </div>
          </div>
        </div>

        {/* Agency Theory 성과 지표 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🧠 Agency Theory 성과 지표
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-700">
                  정보 비대칭 해소도
                </h4>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                {(data.agencyScore * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.agencyScore * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-green-600 mt-2">
                예측 정확도와 사회적 학습을 통한 정보 투명성 기여도
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-orange-700">사회적 영향력</h4>
                <span className="text-2xl">❤️</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {(data.socialImpactScore * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.socialImpactScore * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-orange-600 mt-2">
                기부 활동과 사회적 기여를 통한 공공선택 개선도
              </div>
            </div>
          </div>
        </div>

        {/* 행동경제학 인사이트 */}
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-700 mb-3 flex items-center gap-2">
            🧮 Behavioral Economics 인사이트
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                💡 Loss Aversion 분석
              </div>
              <div className="text-indigo-600">
                현재 PmcAmount 보유량({data.pmcBalance} PmcAmount)을 고려할 때, 향후 7일 내
                기부를 권장합니다. (MoneyWave2 재분배 방지)
              </div>
            </div>
            <div>
              <div className="font-medium text-indigo-600 mb-1">
                ⚖️ Prospect Theory 적용
              </div>
              <div className="text-indigo-600">
                현재 위험 성향(중도적)에 맞춘 PmpAmount:PmcAmount 비율 6:4가 최적의 효용을
                제공할 것으로 예상됩니다.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
