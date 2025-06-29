/**
 * Ranking Prediction Sample Page
 *
 * 순위 예측 타입의 샘플 페이지
 * 다중 선택지 중 상위 N개를 선택하는 복합 예측 게임
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { PredictionDetailView } from "../../bounded-contexts/prediction/presentation/components/PredictionDetailView";

export default function RankingPredictionSamplePage() {
  // Ranking prediction sample data
  const sampleGame = {
    id: "crypto-top5-2025",
    title: "2025년 시가총액 TOP 5 암호화폐 예측",
    description:
      "2025년 말 기준으로 시가총액 상위 5위 안에 들 암호화폐들을 예측해보세요. 현재 시장 동향, 기술 발전, 규제 환경, 기관 채택률 등을 종합적으로 고려하여 순위를 예측하세요.",
    predictionType: "ranking" as const,
    options: [
      {
        id: "bitcoin",
        label: "비트코인 (BTC)",
        probability: 0.28,
        odds: 3.57,
        volume: 5420000,
        change24h: 1.2,
      },
      {
        id: "ethereum",
        label: "이더리움 (ETH)",
        probability: 0.25,
        odds: 4.0,
        volume: 4850000,
        change24h: 2.8,
      },
      {
        id: "solana",
        label: "솔라나 (SOL)",
        probability: 0.18,
        odds: 5.56,
        volume: 3240000,
        change24h: 8.5,
      },
      {
        id: "cardano",
        label: "카르다노 (ADA)",
        probability: 0.12,
        odds: 8.33,
        volume: 2180000,
        change24h: 3.2,
      },
      {
        id: "polygon",
        label: "폴리곤 (MATIC)",
        probability: 0.09,
        odds: 11.11,
        volume: 1650000,
        change24h: -1.5,
      },
      {
        id: "avalanche",
        label: "아발란체 (AVAX)",
        probability: 0.08,
        odds: 12.5,
        volume: 1420000,
        change24h: 4.1,
      },
    ],
    totalVolume: 18760000,
    participantCount: 38920,
    endTime: new Date("2025-12-31T23:59:59Z"),
    settlementTime: new Date("2026-01-05T12:00:00Z"),
    status: "ACTIVE" as const,
    category: "암호화폐",
    creator: {
      name: "블록체인분석연구소",
      reputation: 4.8,
      avatar: "🔗",
    },
    prizePool: 938000,
    minimumStake: 5000,
    maximumStake: 200000,
  };

  const userBalance = {
    pmp: 85000,
    pmc: 42000,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🏆</span>
            <span>Ranking Prediction Sample</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            순위 예측 샘플 페이지
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            다중 선택지 중에서 상위 N개를 선택하는 복합 예측 게임입니다. 더
            복잡하지만 높은 수익률을 기대할 수 있습니다.
          </p>
        </div>

        {/* Sample Features */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🎲</div>
            <h3 className="font-semibold text-gray-900 mb-2">다중 선택</h3>
            <p className="text-sm text-gray-600">
              여러 옵션 중 상위 N개를 선택하는 복합적인 예측 방식
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-semibold text-gray-900 mb-2">높은 수익률</h3>
            <p className="text-sm text-gray-600">
              복잡한 예측일수록 더 높은 배당률과 수익 기회 제공
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">전문성 요구</h3>
            <p className="text-sm text-gray-600">
              시장 분석과 전문 지식이 더욱 중요한 고급 예측 게임
            </p>
          </div>
        </div>

        {/* Market Analysis */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            암호화폐 시장 분석
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">현재 TOP 5</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>1. 비트코인</span>
                  <span className="font-medium">$850B</span>
                </div>
                <div className="flex justify-between">
                  <span>2. 이더리움</span>
                  <span className="font-medium">$420B</span>
                </div>
                <div className="flex justify-between">
                  <span>3. 테더</span>
                  <span className="font-medium">$95B</span>
                </div>
                <div className="flex justify-between">
                  <span>4. BNB</span>
                  <span className="font-medium">$85B</span>
                </div>
                <div className="flex justify-between">
                  <span>5. 솔라나</span>
                  <span className="font-medium">$75B</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">성장 동력</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• DeFi 생태계 확장</div>
                <div>• NFT 시장 성숙화</div>
                <div>• 기관 투자자 유입</div>
                <div>• 규제 명확화</div>
                <div>• 기술적 혁신 (Layer 2)</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">위험 요소</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• 규제 불확실성</div>
                <div>• 시장 변동성</div>
                <div>• 기술적 문제</div>
                <div>• 경쟁 심화</div>
                <div>• 거시경제 영향</div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Strategy Guide */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            예측 전략 가이드
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                🎯 포트폴리오 접근법
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                여러 암호화폐에 분산 투자하여 리스크를 관리하면서 수익 기회를
                극대화하세요.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 안정적인 코인 (BTC, ETH) 50%</li>
                <li>• 성장 가능성 높은 코인 30%</li>
                <li>• 고위험 고수익 코인 20%</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                📈 시장 분석 팁
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                기술적 분석과 펀더멘털 분석을 모두 활용하여 종합적인 판단을
                내리세요.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 개발 활동 및 업데이트</li>
                <li>• 파트너십 및 채택률</li>
                <li>• 커뮤니티 성장률</li>
                <li>• 기관 투자 동향</li>
              </ul>
            </div>
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
            Ranking Prediction 특징
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                복합 예측의 장점
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 높은 수익률 잠재력</li>
                <li>• 전문 지식 활용 기회</li>
                <li>• 포트폴리오 분산 효과</li>
                <li>• 시장 트렌드 분석 능력 향상</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">적용 분야</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 암호화폐 시가총액 순위</li>
                <li>• 주식 섹터별 성과 순위</li>
                <li>• 스포츠 리그 최종 순위</li>
                <li>• 영화 박스오피스 순위</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
