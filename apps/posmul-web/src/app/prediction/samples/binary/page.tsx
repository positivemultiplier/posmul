/**
 * Binary Prediction Sample Page
 *
 * 이진 예측(예/아니오) 타입의 샘플 페이지
 * Polymarket 스타일의 고급 UI/UX 제공
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { PredictionDetailView } from "../../bounded-contexts/prediction/presentation/components/PredictionDetailView";

export default function BinaryPredictionSamplePage() {
  // Binary prediction sample data
  const sampleGame = {
    id: "bitcoin-100k-2024",
    title: "비트코인이 2024년 말까지 $100,000를 넘을까요?",
    description:
      "비트코인(BTC)이 2024년 12월 31일까지 $100,000 USD를 돌파할지 예측해보세요. 현재 시장 동향, 기관 투자자 유입, 규제 환경, 거시경제 요인들을 종합적으로 고려하여 판단하세요.",
    predictionType: "binary" as const,
    options: [
      {
        id: "yes",
        label: "예 - $100K 돌파",
        probability: 0.67,
        odds: 1.49,
        volume: 2850000,
        change24h: 5.8,
      },
      {
        id: "no",
        label: "아니오 - $100K 미달",
        probability: 0.33,
        odds: 3.03,
        volume: 1420000,
        change24h: -4.2,
      },
    ],
    totalVolume: 4270000,
    participantCount: 15847,
    endTime: new Date("2024-12-31T23:59:59Z"),
    settlementTime: new Date("2025-01-02T12:00:00Z"),
    status: "ACTIVE" as const,
    category: "암호화폐",
    creator: {
      name: "크립토분석가이",
      reputation: 4.9,
      avatar: "₿",
    },
    prizePool: 213500,
    minimumStake: 1000,
    maximumStake: 100000,
  };

  const userBalance = {
    pmp: 45000,
    pmc: 28000,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🎯</span>
            <span>Binary Prediction Sample</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            이진 예측 샘플 페이지
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            예/아니오 형태의 이진 예측 게임입니다. 단순하지만 명확한 선택지로
            높은 참여율을 자랑합니다.
          </p>
        </div>

        {/* Sample Features */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">실시간 확률</h3>
            <p className="text-sm text-gray-600">
              시장 참여자들의 베팅에 따라 실시간으로 업데이트되는 확률 표시
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900 mb-2">동적 배당률</h3>
            <p className="text-sm text-gray-600">
              확률 변화에 따라 자동으로 조정되는 배당률 시스템
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="font-semibold text-gray-900 mb-2">24시간 변동</h3>
            <p className="text-sm text-gray-600">
              지난 24시간 동안의 확률 변동률을 컬러 코딩으로 표시
            </p>
          </div>
        </div>

        {/* Main Component */}
        <PredictionDetailView
          game={sampleGame}
          userBalance={userBalance}
          // onParticipate 제거하여 Server Component 오류 해결
        />

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Binary Prediction 특징
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">장점</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 명확하고 단순한 선택지</li>
                <li>• 높은 사용자 참여율</li>
                <li>• 빠른 의사결정 가능</li>
                <li>• 직관적인 확률 해석</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">활용 분야</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 금융 시장 예측 (주가, 암호화폐)</li>
                <li>• 정치 선거 결과</li>
                <li>• 스포츠 경기 승부</li>
                <li>• 경제 지표 달성 여부</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
