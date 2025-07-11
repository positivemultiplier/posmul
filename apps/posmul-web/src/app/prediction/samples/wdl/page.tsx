/**
 * Win-Draw-Lose Prediction Sample Page
 *
 * 승무패 예측 타입의 샘플 페이지
 * 스포츠 경기, 정치 선거 등에 최적화된 UI/UX
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import PredictionDetailView from "../../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";

export default function WDLPredictionSamplePage() {
  // Win-Draw-Lose prediction sample data
  const sampleGame = {
    id: "korea-vs-japan-final",
    title: "한국 vs 일본 아시안컵 결승전 결과 예측",
    description:
      "2024 AFC 아시안컵 결승전에서 한국과 일본의 경기 결과를 예측해보세요. 양팀의 최근 경기력, 선수 컨디션, 전술적 우위, 과거 전적을 종합적으로 분석하여 승부 또는 무승부를 예측하세요.",
    predictionType: "wdl" as const,
    options: [
      {
        id: "korea-win",
        label: "한국 승리",
        probability: 0.42,
        odds: 2.38,
        volume: 1680000,
        change24h: 2.3,
      },
      {
        id: "draw",
        label: "무승부",
        probability: 0.26,
        odds: 3.85,
        volume: 780000,
        change24h: 1.1,
      },
      {
        id: "japan-win",
        label: "일본 승리",
        probability: 0.32,
        odds: 3.13,
        volume: 1240000,
        change24h: -1.8,
      },
    ],
    totalVolume: 3700000,
    participantCount: 24567,
    endTime: new Date("2024-12-25T19:00:00Z"),
    settlementTime: new Date("2024-12-25T22:00:00Z"),
    status: "ACTIVE" as const,
    category: "스포츠",
    creator: {
      name: "아시아축구전문가",
      reputation: 4.7,
      avatar: "🏆",
    },
    prizePool: 185000,
    minimumStake: 2000,
    maximumStake: 75000,
  };

  const userBalance = {
    pmp: 35000,
    pmc: 22000,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>⚽</span>
            <span>Win-Draw-Lose Sample</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            승무패 예측 샘플 페이지
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            스포츠 경기의 승부 결과를 예측하는 가장 전통적인 방식입니다. 3가지
            명확한 결과로 다양한 전략적 접근이 가능합니다.
          </p>
        </div>

        {/* Sample Features */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">3-Way 베팅</h3>
            <p className="text-sm text-gray-600">
              승리, 무승부, 패배의 3가지 선택지로 더 정교한 예측 가능
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900 mb-2">균형잡힌 배당</h3>
            <p className="text-sm text-gray-600">
              무승부 옵션으로 인해 더욱 균형잡힌 배당률 구조 제공
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold text-gray-900 mb-2">스포츠 최적화</h3>
            <p className="text-sm text-gray-600">
              축구, 농구, 야구 등 다양한 스포츠 경기에 최적화된 형태
            </p>
          </div>
        </div>

        {/* Team Stats Comparison */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">팀 비교 분석</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🇰🇷</div>
              <h3 className="font-semibold text-gray-900 mb-2">한국</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>FIFA 랭킹:</span>
                  <span className="font-medium">23위</span>
                </div>
                <div className="flex justify-between">
                  <span>최근 5경기:</span>
                  <span className="font-medium">3승 1무 1패</span>
                </div>
                <div className="flex justify-between">
                  <span>득실차:</span>
                  <span className="font-medium text-green-600">+8</span>
                </div>
              </div>
            </div>

            <div className="text-center border-l border-r border-gray-200 px-4">
              <div className="text-4xl mb-2">⚖️</div>
              <h3 className="font-semibold text-gray-900 mb-2">VS</h3>
              <div className="space-y-1 text-sm">
                <div>과거 10경기 전적</div>
                <div className="font-medium">한국 4승 3무 3패</div>
                <div className="text-xs text-gray-500">최근 상승세</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">🇯🇵</div>
              <h3 className="font-semibold text-gray-900 mb-2">일본</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>FIFA 랭킹:</span>
                  <span className="font-medium">18위</span>
                </div>
                <div className="flex justify-between">
                  <span>최근 5경기:</span>
                  <span className="font-medium">4승 0무 1패</span>
                </div>
                <div className="flex justify-between">
                  <span>득실차:</span>
                  <span className="font-medium text-green-600">+12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Component */}
        // <PredictionDetailView
          game={sampleGame}
          userBalance={userBalance}
          // onParticipate 제거하여 Server Component 오류 해결
        />

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Win-Draw-Lose 예측 특징
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">전략적 장점</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 무승부 옵션으로 위험 분산 가능</li>
                <li>• 더 정교한 확률 분석 필요</li>
                <li>• 팀 전력 분석의 중요성 증대</li>
                <li>• 다양한 베팅 전략 구사 가능</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">적용 분야</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 축구, 농구, 야구 등 스포츠</li>
                <li>• 정치 선거 (과반, 무과반, 야당승)</li>
                <li>• 주식 시장 (상승, 보합, 하락)</li>
                <li>• 날씨 예측 (맑음, 흐림, 비)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
