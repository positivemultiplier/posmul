/**
 * Main Prediction Overview Page
 *
 * Shows all prediction categories with navigation to different types
 * Based on the 3-tier navigation: prediction (1st tier)
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@posmul/shared-ui";
import Link from "next/link";

const predictionCategories = [
  {
    slug: "invest",
    title: "Invest 예측",
    icon: "💼",
    description: "PosMul 투자 서비스 예측 게임",
    activeGames: 18,
    totalParticipants: 15632,
    averageReturn: 2.8,
    categories: ["Local League", "Minor League", "Major League"],
    highlight: "Agency Theory 핵심",
    color: "blue",
  },
  {
    slug: "sports",
    title: "스포츠 예측",
    icon: "🏆",
    description: "국내외 스포츠 경기 결과 예측",
    activeGames: 48,
    totalParticipants: 32451,
    averageReturn: 2.1,
    categories: ["축구", "야구", "농구", "e스포츠"],
    highlight: "가장 인기",
    color: "green",
  },
  {
    slug: "entertainment",
    title: "엔터테인먼트 예측",
    icon: "🎬",
    description: "영화, 드라마, 음악 관련 예측",
    activeGames: 25,
    totalParticipants: 18923,
    averageReturn: 1.9,
    categories: ["영화", "드라마", "음악", "시상식"],
    highlight: "문화 트렌드",
    color: "purple",
  },
  {
    slug: "politics",
    title: "정치/선거 예측",
    icon: "🗳️",
    description: "선거 결과 및 정책 변화 예측",
    activeGames: 12,
    totalParticipants: 8734,
    averageReturn: 2.5,
    categories: ["국가선거", "지역선거", "정책변화"],
    highlight: "민주주의",
    color: "red",
  },
  {
    slug: "user-suggestions",
    title: "사용자 제안 예측",
    icon: "💡",
    description: "사용자가 제안한 다양한 주제의 예측",
    activeGames: 35,
    totalParticipants: 12456,
    averageReturn: 2.3,
    categories: ["사용자제안", "AI추천", "오피니언리더"],
    highlight: "창의적",
    color: "orange",
  },
];

function CategoryCard({
  category,
}: {
  category: (typeof predictionCategories)[0];
}) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 border-blue-200",
    green: "from-green-50 to-green-100 border-green-200",
    purple: "from-purple-50 to-purple-100 border-purple-200",
    red: "from-red-50 to-red-100 border-red-200",
    orange: "from-orange-50 to-orange-100 border-orange-200",
  };

  const badgeColors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    red: "bg-red-100 text-red-800",
    orange: "bg-orange-100 text-orange-800",
  };

  return (
    <Link href={`/prediction/${category.slug}`}>
      <Card
        className={`hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gradient-to-br ${
          colorClasses[category.color as keyof typeof colorClasses]
        } border-2`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {category.description}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={
                badgeColors[category.color as keyof typeof badgeColors]
              }
            >
              {category.highlight}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-white/50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">
                {category.activeGames}
              </div>
              <div className="text-xs text-gray-600">활성 게임</div>
            </div>
            <div className="text-center bg-white/50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">
                {(category.totalParticipants / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-600">참여자</div>
            </div>
            <div className="text-center bg-white/50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">
                {category.averageReturn}x
              </div>
              <div className="text-xs text-gray-600">평균수익</div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              주요 카테고리
            </div>
            <div className="flex flex-wrap gap-2">
              {category.categories.map((cat, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-white/70 text-gray-700 rounded-md font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              예측 게임 참여하기 →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PredictionOverviewPage() {
  const totalGames = predictionCategories.reduce(
    (sum, cat) => sum + cat.activeGames,
    0
  );
  const totalParticipants = predictionCategories.reduce(
    (sum, cat) => sum + cat.totalParticipants,
    0
  );
  const averageReturn =
    predictionCategories.reduce((sum, cat) => sum + cat.averageReturn, 0) /
    predictionCategories.length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">🎯 PosMul 예측 게임</h1>
          <p className="text-xl mb-6 text-blue-100">
            Agency Theory와 CAPM을 기반으로 한 혁신적인 예측 플랫폼
          </p>
          <p className="text-lg text-blue-100 mb-8">
            정보 비대칭을 해결하고 집단 지성을 활용하여 더 정확한 예측을
            만들어보세요. PMP를 투자하고 성공적인 예측으로 PMC를 획득하세요.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">{totalGames}</div>
              <div className="text-blue-100">활성 게임</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">
                {(totalParticipants / 1000).toFixed(0)}K+
              </div>
              <div className="text-blue-100">총 참여자</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">
                {averageReturn.toFixed(1)}x
              </div>
              <div className="text-blue-100">평균 수익률</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold">
                {predictionCategories.length}
              </div>
              <div className="text-blue-100">예측 분야</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">예측 카테고리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictionCategories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🧠 어떻게 작동하나요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">PMP 투자</h3>
            <p className="text-gray-600">
              관심 있는 예측 게임에 PMP(위험무료자산)를 투자하여 참여하세요
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">예측 참여</h3>
            <p className="text-gray-600">
              AI 분석과 전문가 의견을 참고하여 가장 가능성 높은 결과를
              선택하세요
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">PMC 획득</h3>
            <p className="text-gray-600">
              정확한 예측으로 PMC(위험자산)를 획득하고 MoneyWave 시스템에
              참여하세요
            </p>
          </div>
        </div>
      </div>

      {/* Agency Theory Explanation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Agency Theory 기반 예측 시스템
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                정보 비대칭 해결
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>전문가와 일반 사용자의 예측 데이터 통합</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>AI 분석을 통한 객관적 정보 제공</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>투명한 데이터 공개로 정보 격차 최소화</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                집단 지성 활용
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>다수의 참여자 의견을 종합한 예측</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>개별 편향을 상쇄하는 시스템</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>실시간 업데이트되는 집단 예측</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
