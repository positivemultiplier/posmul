"use client";

import React from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../shared/ui/components/base";

interface DonationActivityPanelProps {
  userId: string;
}

// Mock 데이터
const mockDonationData = {
  totalDonated: 1250,
  donationCount: 8,
  favoriteCategories: ["환경보호", "교육지원", "지역발전"],
  currentRanking: 42,
  totalUsers: 1847,
  socialImpactScore: 78,
  recentDonations: [
    {
      id: "don-1",
      recipient: "서울시 미세먼지 저감 프로젝트",
      amount: 200,
      category: "환경보호",
      date: "2024-01-20",
      impact: "대기질 개선에 기여",
      verified: true,
    },
    {
      id: "don-2",
      recipient: "부산 지역 소상공인 지원",
      amount: 150,
      category: "지역발전",
      date: "2024-01-18",
      impact: "15개 소상공인 매출 증대",
      verified: true,
    },
    {
      id: "don-3",
      recipient: "디지털 격차 해소 교육",
      amount: 180,
      category: "교육지원",
      date: "2024-01-15",
      impact: "120명 어르신 디지털 교육",
      verified: true,
    },
    {
      id: "don-4",
      recipient: "청년 창업 지원 펀드",
      amount: 100,
      category: "경제활성화",
      date: "2024-01-12",
      impact: "3개 스타트업 시드 투자",
      verified: false,
    },
    {
      id: "don-5",
      recipient: "독거노인 돌봄 서비스",
      amount: 120,
      category: "사회복지",
      date: "2024-01-10",
      impact: "50명 어르신 생활 지원",
      verified: true,
    },
  ],
};

export const DonationActivityPanel: React.FC<DonationActivityPanelProps> = ({
  userId,
}) => {
  const data = mockDonationData;

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
    return (
      ((data.totalUsers - data.currentRanking) / data.totalUsers) *
      100
    ).toFixed(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">❤️ 기부 활동</CardTitle>
        <CardDescription>PMC를 통한 사회적 기여와 영향력 분석</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 기부 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <div className="text-sm text-red-600 mb-1">총 기부 PMC</div>
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
                    {donation.amount} PMC
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
                총 200 PMC 환경보호 기부로 CO₂ 약 1.2톤 감축 효과를
                달성했습니다.
              </div>
            </div>
            <div>
              <div className="font-medium text-pink-600 mb-1">👥 사회 영향</div>
              <div className="text-pink-600">
                교육/복지 분야 450 PMC 기부로 약 185명의 삶의 질 개선에
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
                • <strong>MoneyWave2</strong>: 미사용 PMC 자동 재분배로 플랫폼
                활성화 기여
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
