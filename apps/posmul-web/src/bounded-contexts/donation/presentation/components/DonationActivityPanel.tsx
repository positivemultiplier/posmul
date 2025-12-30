"use client";

import React from "react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../shared/ui/components/base";

import { useDonationData } from "../hooks/useDonationData";
import { AlertCircle } from "lucide-react";

interface DonationActivityPanelProps {
  userId: string;
}


export const DonationActivityPanel: React.FC<DonationActivityPanelProps> = ({
  userId,
}) => {
  // Data Fetching
  const { data: donationData, loading, error } = useDonationData(userId);

  if (loading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center bg-white/80 backdrop-blur border-emerald-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">기부 활동을 불러오고 있어요...</p>
        </div>
      </Card>
    );
  }

  if (error || !donationData) {
    return (
      <Card className="w-full h-96 flex items-center justify-center bg-white/80 backdrop-blur border-red-100">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-gray-600 font-medium">데이터를 불러올 수 없습니다</p>
          <p className="text-xs text-gray-400">{error?.message}</p>
        </div>
      </Card>
    );
  }

  const data = donationData;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      환경보호: "bg-green-100 text-green-800 border-green-200",
      교육지원: "bg-blue-100 text-blue-800 border-blue-200",
      지역발전: "bg-purple-100 text-purple-800 border-purple-200",
      경제활성화: "bg-orange-100 text-orange-800 border-orange-200",
      사회복지: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRankingPercentile = () => {
    if (data.totalUsers === 0) return "0.0";
    return (
      ((data.totalUsers - data.currentRanking) / data.totalUsers) *
      100
    ).toFixed(1);
  };

  return (
    <Card className="w-full">
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: "url('/images/donation-warmth.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-6 text-white z-10">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            ❤️ 기부 활동
          </h3>
          <p className="text-white/90 text-sm mt-1">
            PmcAmount를 통한 사회적 기여와 영향력 분석
          </p>
        </div>
      </div>
      <CardHeader className="sr-only">
        <CardTitle>기부 활동</CardTitle>
        <CardDescription>PmcAmount를 통한 사회적 기여</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 기부 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <div className="text-sm text-red-600 mb-1">총 기부 PmcAmount</div>
            <div className="text-xl font-bold text-red-700">
              {data.totalDonated.toLocaleString()}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div className="text-sm text-blue-600 mb-1">기부 횟수</div>
            <div className="text-xl font-bold text-blue-700">
              {data.donationCount}회
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="text-sm text-green-600 mb-1">사회적 영향력</div>
            <div className="text-xl font-bold text-green-700">
              {data.socialImpactScore}점
            </div>
          </div>
        </div>

        {/* 기부 랭킹 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-orange-700">🏆 기부 랭킹</h4>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              상위 {getRankingPercentile()}%
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-orange-600 mb-1">현재 순위</div>
              <div className="text-2xl font-bold text-orange-700">
                #{data.currentRanking} / {data.totalUsers.toLocaleString()}명
              </div>
            </div>
            <div>
              <div className="text-sm text-orange-600 mb-1">선호 카테고리</div>
              <div className="flex flex-wrap gap-1">
                {data.favoriteCategories.map((category) => (
                  <Badge key={category} className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 최근 기부 내역 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 mb-3">최근 기부 내역</h4>
          {data.recentDonations.map((donation) => (
            <div
              key={donation.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800 mb-1">
                    {donation.recipient}
                  </h5>
                  <div className="text-sm text-gray-600">{donation.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(donation.category)}>
                    {donation.category}
                  </Badge>
                  {donation.verified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ✓ 검증됨
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">기부 금액</div>
                  <div className="text-lg font-bold text-red-600">
                    {donation.amount} PmcAmount
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">사회적 영향</div>
                  <div className="text-sm text-green-600 font-medium">
                    {donation.impact}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 기부 효과 분석 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-200">
          <h4 className="font-semibold text-pink-700 mb-3">
            💖 기부 효과 분석
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-pink-600 mb-1">🌍 환경 영향</div>
              <div className="text-pink-600">
                총 200 PmcAmount 환경보호 기부로 CO₂ 약 1.2톤 감축 효과를
                달성했습니다.
              </div>
            </div>
            <div>
              <div className="font-medium text-pink-600 mb-1">👥 사회 영향</div>
              <div className="text-pink-600">
                교육/복지 분야 450 PmcAmount 기부로 약 185명의 삶의 질 개선에
                기여했습니다.
              </div>
            </div>
          </div>

          {/* MoneyWave 시스템 설명 */}
          <div className="mt-4 pt-4 border-t border-pink-200">
            <div className="font-medium text-pink-600 mb-2">
              🌊 MoneyWave 순환 효과
            </div>
            <div className="text-sm text-pink-600">
              <div className="mb-1">
                • <strong>MoneyWave2</strong>: 미사용 PmcAmount 자동 재분배로
                플랫폼 활성화 기여
              </div>
              <div className="mb-1">
                • <strong>Loss Aversion</strong>: 적절한 기부 타이밍으로 개인
                효용 극대화
              </div>
              <div>
                • <strong>사회적 인정</strong>: 기부 랭킹을 통한 사회적 지위
                향상
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
