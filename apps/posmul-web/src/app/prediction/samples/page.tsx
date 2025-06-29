/**
 * Prediction Samples Index Page
 *
 * 모든 예측 타입의 샘플 페이지들을 소개하는 인덱스 페이지
 * 각 예측 타입의 특징과 링크를 제공
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { Button } from "@posmul/shared-ui";
import Link from "next/link";

export default function PredictionSamplesIndexPage() {
  const predictionTypes = [
    {
      id: "binary",
      title: "Binary Prediction",
      koreanTitle: "이진 예측",
      description: "예/아니오 형태의 단순하고 명확한 예측 게임",
      features: [
        "직관적인 선택지",
        "높은 참여율",
        "빠른 의사결정",
        "명확한 결과",
      ],
      examples: [
        "비트코인 $100K 돌파 여부",
        "정치 선거 결과",
        "스포츠 경기 승부",
        "경제 지표 달성",
      ],
      color: "blue",
      icon: "🎯",
      href: "/prediction/samples/binary",
      difficulty: "초급",
      expectedReturn: "1.5x - 3.0x",
    },
    {
      id: "wdl",
      title: "Win-Draw-Lose",
      koreanTitle: "승무패 예측",
      description: "승리, 무승부, 패배의 3가지 결과를 예측하는 게임",
      features: ["3-Way 베팅", "균형잡힌 배당", "위험 분산", "스포츠 최적화"],
      examples: [
        "축구 경기 결과",
        "농구 경기 승부",
        "정치 선거 (과반/무과반/야당승)",
        "주식 시장 (상승/보합/하락)",
      ],
      color: "green",
      icon: "⚽",
      href: "/prediction/samples/wdl",
      difficulty: "중급",
      expectedReturn: "2.0x - 4.0x",
    },
    {
      id: "ranking",
      title: "Ranking Prediction",
      koreanTitle: "순위 예측",
      description: "다중 선택지 중 상위 N개를 선택하는 복합 예측",
      features: ["다중 선택", "높은 수익률", "전문성 요구", "포트폴리오 효과"],
      examples: [
        "암호화폐 시가총액 TOP 5",
        "스포츠 리그 최종 순위",
        "주식 섹터별 성과",
        "영화 박스오피스 순위",
      ],
      color: "purple",
      icon: "🏆",
      href: "/prediction/samples/ranking",
      difficulty: "고급",
      expectedReturn: "3.0x - 12.0x",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-800",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-800",
          button: "bg-purple-600 hover:bg-purple-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-800",
          button: "bg-gray-600 hover:bg-gray-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
            <span>🎮</span>
            <span>Prediction Game Samples</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            예측 게임 샘플 페이지
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            PosMul 플랫폼에서 제공하는 3가지 예측 타입을 직접 체험해보세요.
            각각의 고유한 특징과 전략을 이해하고 최적의 게임을 선택하세요.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600 mb-1">3가지</div>
              <div className="text-sm text-gray-600">예측 타입</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600 mb-1">
                실시간
              </div>
              <div className="text-sm text-gray-600">확률 업데이트</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                고급
              </div>
              <div className="text-sm text-gray-600">UI/UX 디자인</div>
            </div>
          </div>
        </div>

        {/* Prediction Types Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {predictionTypes.map((type) => {
            const colors = getColorClasses(type.color);

            return (
              <div
                key={type.id}
                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {type.koreanTitle}
                  </h2>
                  <div className="text-sm text-gray-500 mb-2">{type.title}</div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>

                {/* Difficulty & Return */}
                <div className="flex justify-between items-center mb-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${colors.text} bg-white`}
                  >
                    난이도: {type.difficulty}
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    수익률: {type.expectedReturn}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    주요 특징
                  </h3>
                  <ul className="space-y-1">
                    {type.features.map((feature, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    활용 예시
                  </h3>
                  <ul className="space-y-1">
                    {type.examples.slice(0, 3).map((example, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Link href={type.href}>
                  <Button
                    className={`w-full ${colors.button} text-white`}
                    size="lg"
                  >
                    샘플 체험하기
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            예측 타입 비교표
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    구분
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">
                    Binary
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-green-600">
                    WDL
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-600">
                    Ranking
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    선택지 수
                  </td>
                  <td className="py-3 px-4 text-center">2개</td>
                  <td className="py-3 px-4 text-center">3개</td>
                  <td className="py-3 px-4 text-center">5개 이상</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    복잡도
                  </td>
                  <td className="py-3 px-4 text-center">낮음</td>
                  <td className="py-3 px-4 text-center">보통</td>
                  <td className="py-3 px-4 text-center">높음</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    예상 수익률
                  </td>
                  <td className="py-3 px-4 text-center">1.5x - 3.0x</td>
                  <td className="py-3 px-4 text-center">2.0x - 4.0x</td>
                  <td className="py-3 px-4 text-center">3.0x - 12.0x</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    분석 필요도
                  </td>
                  <td className="py-3 px-4 text-center">기본</td>
                  <td className="py-3 px-4 text-center">중급</td>
                  <td className="py-3 px-4 text-center">고급</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    추천 대상
                  </td>
                  <td className="py-3 px-4 text-center">초보자</td>
                  <td className="py-3 px-4 text-center">일반 사용자</td>
                  <td className="py-3 px-4 text-center">전문가</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            지금 바로 예측 게임을 시작해보세요!
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            각 샘플 페이지에서 실제 게임과 동일한 UI/UX를 체험하고, 나에게 맞는
            예측 타입을 찾아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/prediction">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                실제 게임 참여하기
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                대시보드 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
