"use client";

import React from "react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../shared/ui";

interface UserRankingPanelProps {
  userId: string;
}

// Mock 데이터
const mockRankingData = {
  overallRank: 23,
  totalUsers: 1847,
  categoryRanks: {
    prediction: { rank: 15, category: "예측 정확도" },
    donation: { rank: 42, category: "기부 활동" },
    social: { rank: 28, category: "사회적 영향" },
    economic: { rank: 19, category: "경제 기여" },
  },
  achievements: [
    {
      id: "pred-master",
      title: "예측 마스터",
      description: "연속 10회 이상 80% 정확도 달성",
      icon: "🎯",
      earned: true,
      earnedDate: "2024-01-15",
    },
    {
      id: "social-hero",
      title: "사회적 영웅",
      description: "1000 PmcAmount 이상 기부",
      icon: "🦸",
      earned: true,
      earnedDate: "2024-01-10",
    },
    {
      id: "agency-solver",
      title: "Agency 해결사",
      description: "Agency Score 85% 이상 달성",
      icon: "🧠",
      earned: true,
      earnedDate: "2024-01-20",
    },
    {
      id: "capm-expert",
      title: "CAPM 전문가",
      description: "샤프 비율 1.0 이상 달성",
      icon: "📈",
      earned: false,
      earnedDate: null,
    },
    {
      id: "democracy-champion",
      title: "민주주의 챔피언",
      description: "50회 이상 예측 게임 참여",
      icon: "🏛️",
      earned: false,
      earnedDate: null,
    },
  ],
  weeklyProgress: {
    pmpEarned: 420,
    pmcEarned: 180,
    predictionsCount: 5,
    donationsCount: 2,
    accuracyRate: 0.92,
  },
  competitiveStats: {
    winRate: 0.78,
    avgAccuracy: 0.85,
    riskAdjustedReturn: 0.15,
    socialImpactIndex: 0.82,
  },
};

export const UserRankingPanel: React.FC<UserRankingPanelProps> = ({
  userId,
}) => {
  void userId;
  const data = mockRankingData;

  const getPercentile = (rank: number, total: number) => {
    return (((total - rank) / total) * 100).toFixed(1);
  };

  const getRankColor = (rank: number, total: number) => {
    const percentile = (total - rank) / total;
    if (percentile >= 0.9) return "text-yellow-600"; // Top 10%
    if (percentile >= 0.7) return "text-green-600"; // Top 30%
    if (percentile >= 0.5) return "text-blue-600"; // Top 50%
    return "text-gray-600";
  };

  const getRankBadgeColor = (rank: number, total: number) => {
    const percentile = (total - rank) / total;
    if (percentile >= 0.9)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (percentile >= 0.7)
      return "bg-green-100 text-green-800 border-green-200";
    if (percentile >= 0.5) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 랭킹 & 성과
        </CardTitle>
        <CardDescription>플랫폼 내 순위와 개인 성취 현황</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 전체 랭킹 */}
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-orange-700 mb-2">
              🥇 전체 랭킹
            </h3>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              #{data.overallRank}
            </div>
            <div className="text-sm text-orange-600">
              전체 {data.totalUsers.toLocaleString()}명 중 상위{" "}
              {getPercentile(data.overallRank, data.totalUsers)}%
            </div>
            <Badge
              className={getRankBadgeColor(data.overallRank, data.totalUsers)}
            >
              {getPercentile(data.overallRank, data.totalUsers)}% 상위권
            </Badge>
          </div>
        </div>

        {/* 카테고리별 랭킹 */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-4">
            📊 카테고리별 순위
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.categoryRanks).map(([key, rankData]) => (
              <div key={key} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-700">
                      {rankData.category}
                    </div>
                    <div
                      className={`text-2xl font-bold ${getRankColor(
                        rankData.rank,
                        data.totalUsers
                      )}`}
                    >
                      #{rankData.rank}
                    </div>
                  </div>
                  <Badge
                    className={getRankBadgeColor(
                      rankData.rank,
                      data.totalUsers
                    )}
                  >
                    상위 {getPercentile(rankData.rank, data.totalUsers)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 성취 배지 */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-4">🏅 성취 배지</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg transition-all ${
                  achievement.earned
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5
                        className={`font-medium ${
                          achievement.earned
                            ? "text-green-700"
                            : "text-gray-500"
                        }`}
                      >
                        {achievement.title}
                      </h5>
                      {achievement.earned && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          ✓ 달성
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        achievement.earned ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {achievement.description}
                    </p>
                    {achievement.earned && achievement.earnedDate && (
                      <p className="text-xs text-green-500 mt-1">
                        달성일: {achievement.earnedDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주간 성과 */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-4">📅 이번 주 성과</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">
                {data.weeklyProgress.pmpEarned}
              </div>
              <div className="text-xs text-blue-600">PmpAmount 획득</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-600">
                {data.weeklyProgress.pmcEarned}
              </div>
              <div className="text-xs text-purple-600">PmcAmount 획득</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">
                {data.weeklyProgress.predictionsCount}
              </div>
              <div className="text-xs text-green-600">예측 참여</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">
                {data.weeklyProgress.donationsCount}
              </div>
              <div className="text-xs text-red-600">기부 횟수</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-orange-600">
                {(data.weeklyProgress.accuracyRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-orange-600">정확도</div>
            </div>
          </div>
        </div>

        {/* 경쟁력 지표 */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-700 mb-3">⚡ 경쟁력 지표</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-600">승률</span>
                <span className="font-bold text-indigo-700">
                  {(data.competitiveStats.winRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.competitiveStats.winRate * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-600">평균 정확도</span>
                <span className="font-bold text-indigo-700">
                  {(data.competitiveStats.avgAccuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${data.competitiveStats.avgAccuracy * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-600">위험조정수익률</span>
                <span className="font-bold text-indigo-700">
                  {(data.competitiveStats.riskAdjustedReturn * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${data.competitiveStats.riskAdjustedReturn * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-600">사회적 영향력</span>
                <span className="font-bold text-indigo-700">
                  {(data.competitiveStats.socialImpactIndex * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${data.competitiveStats.socialImpactIndex * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
