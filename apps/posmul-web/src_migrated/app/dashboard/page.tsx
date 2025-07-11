import { DonationActivityPanel } from "../../../src/bounded-contexts/donation/presentation/components/DonationActivityPanel";
import { PredictionHistoryPanel } from "../../../src/bounded-contexts/prediction/presentation/components/PredictionHistoryPanel";
import { UserRankingPanel } from "../../../src/bounded-contexts/user/presentation/components/UserRankingPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../src/shared/ui/components/base";
import { Suspense } from "react";

// Mock 사용자 ID (실제로는 인증에서 가져옴)
const MOCK_USER_ID = "2808af51-a9f7-432b-90a1-8580f7a964c1"; // 실제 데이터가 있는 사용자 ID

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            실시간 대시보드 📊
          </h1>
          <p className="text-lg text-gray-600">
            PosMul 플랫폼에서의 경제 활동과 예측 성과를 실시간으로 확인하세요
          </p>
        </div>

        {/* Agency Theory 설명 카드 */}
        <Card className="mb-8 border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              🧠 Agency Theory 기반 개인화 대시보드
            </CardTitle>
            <CardDescription className="text-blue-600">
              Jensen & Meckling의 Agency Theory를 적용하여 정보 비대칭을
              해소하고, 개인의 예측 능력과 사회적 기여도를 객관적으로
              측정합니다.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 🔥 NEW: 실시간 경제 현황 대시보드 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>💰 경제 현황</CardTitle>
              <CardDescription>
                실시간 PmpAmount/PmcAmount 잔액 및 거래 현황
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    1,245 PmpAmount
                  </div>
                  <div className="text-sm text-blue-500">현재 잔액</div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">
                    892 PmcAmount
                  </div>
                  <div className="text-sm text-pink-500">현재 잔액</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+5.2%</div>
                  <div className="text-sm text-green-500">지난주 대비</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MoneyWave 시스템 현황 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>🌊 Money Wave 현황</CardTitle>
              <CardDescription>PmcAmount 분배 및 Money Wave 정보</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-700 mb-2">
                  현재 Money Wave 단계: Phase 3
                </div>
                <div className="text-sm text-purple-600">
                  다음 분배까지: 2일 14시간 30분
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🔥 NEW: 실시간 예측 게임 대시보드 */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>🎯 예측 게임 현황</CardTitle>
              <CardDescription>참여 중인 예측 게임과 성과</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="border-l-4 border-l-blue-500 pl-4">
                  <div className="font-medium">2024 대선 결과 예측</div>
                  <div className="text-sm text-gray-600">
                    진행률: 75% • 예상 보상: 50 PmpAmount
                  </div>
                </div>
                <div className="border-l-4 border-l-green-500 pl-4">
                  <div className="font-medium">경제 성장률 예측</div>
                  <div className="text-sm text-gray-600">
                    진행률: 60% • 예상 보상: 30 PmpAmount
                  </div>
                </div>
                <div className="border-l-4 border-l-purple-500 pl-4">
                  <div className="font-medium">지역 투자 성과 예측</div>
                  <div className="text-sm text-gray-600">
                    진행률: 90% • 예상 보상: 75 PmcAmount
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 대시보드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 예측 히스토리 패널 */}
          <div>
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <PredictionHistoryPanel userId={MOCK_USER_ID} />
            </Suspense>
          </div>

          {/* 기부 활동 패널 */}
          <div>
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <DonationActivityPanel userId={MOCK_USER_ID} />
            </Suspense>
          </div>
        </div>

        {/* 랭킹 및 성과 패널 */}
        <div className="mt-8">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <UserRankingPanel userId={MOCK_USER_ID} />
          </Suspense>
        </div>

        {/* 행동경제학 인사이트 */}
        <Card className="mt-8 border-l-4 border-l-purple-500 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              🧮 CAPM & Behavioral Economics 인사이트
            </CardTitle>
            <CardDescription className="text-purple-600">
              Kahneman-Tversky의 Prospect Theory와 CAPM 모델을 기반으로 개인화된
              투자 전략과 위험 관리 방안을 제시합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">
                  💡 Loss Aversion 분석
                </h4>
                <p className="text-sm text-purple-600">
                  현재 PmcAmount 보유량과 기부 패턴을 분석하여 최적의 기부 타이밍을
                  제안합니다.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">
                  ⚖️ 위험-수익 최적화
                </h4>
                <p className="text-sm text-purple-600">
                  개인의 위험 성향에 맞는 PmpAmount/PmcAmount 포트폴리오 배분을 권장합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 직접민주주의 참여 현황 */}
        <Card className="mt-8 border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              🏛️ 직접민주주의 참여 현황
            </CardTitle>
            <CardDescription className="text-green-600">
              Agency Theory를 통한 정보 비대칭 해소와 집단 지성 활용
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  87%
                </div>
                <div className="text-sm text-green-600">
                  예측 정확도
                  <br />
                  <span className="text-xs text-gray-500">
                    (전체 참여자 평균)
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  2.4M
                </div>
                <div className="text-sm text-green-600">
                  총 PmpAmount 거래량
                  <br />
                  <span className="text-xs text-gray-500">(지난 30일)</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  1,250
                </div>
                <div className="text-sm text-green-600">
                  활성 참여자
                  <br />
                  <span className="text-xs text-gray-500">
                    (Agency Score &gt; 0.7)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 상태 표시 */}
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>실시간 데이터 연동 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>MCP 연결 정상</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Agency Theory 엔진 활성</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
