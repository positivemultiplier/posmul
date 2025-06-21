/**
 * Sports Predictions Overview Page
 *
 * Shows all sports subcategories with quick access to different sports
 * Based on the 3-tier navigation: predictions/sports
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import Link from "next/link";

const sportsCategories = [
  {
    slug: "soccer",
    title: "축구",
    icon: "⚽",
    description: "국내외 축구 리그 및 월드컵 예측",
    activeGames: 12,
    totalParticipants: 8547,
    averageReturn: 2.1,
    subcategories: [
      "K리그",
      "프리미어리그",
      "라리가",
      "분데스리가",
      "월드컵",
      "챔피언스리그",
    ],
  },
  {
    slug: "baseball",
    title: "야구",
    icon: "⚾",
    description: "KBO, MLB 시즌 및 포스트시즌 예측",
    activeGames: 8,
    totalParticipants: 5234,
    averageReturn: 1.8,
    subcategories: ["KBO리그", "MLB", "월드베이스볼클래식", "아시안게임"],
  },
  {
    slug: "basketball",
    title: "농구",
    icon: "🏀",
    description: "KBL, NBA 정규시즌 및 플레이오프 예측",
    activeGames: 6,
    totalParticipants: 3891,
    averageReturn: 2.0,
    subcategories: ["KBL", "NBA", "WNBA", "올림픽"],
  },
  {
    slug: "esports",
    title: "e스포츠",
    icon: "🎮",
    description: "LOL, 오버워치, 스타크래프트 대회 예측",
    activeGames: 15,
    totalParticipants: 12456,
    averageReturn: 2.5,
    subcategories: ["리그오브레전드", "오버워치", "스타크래프트", "발로란트"],
  },
  {
    slug: "tennis",
    title: "테니스",
    icon: "🎾",
    description: "그랜드슬램 및 ATP/WTA 투어 예측",
    activeGames: 4,
    totalParticipants: 2134,
    averageReturn: 1.9,
    subcategories: ["윔블던", "US오픈", "프랑스오픈", "호주오픈"],
  },
  {
    slug: "golf",
    title: "골프",
    icon: "⛳",
    description: "PGA 투어 및 메이저 대회 예측",
    activeGames: 3,
    totalParticipants: 1567,
    averageReturn: 2.2,
    subcategories: ["PGA투어", "마스터스", "US오픈", "영국오픈"],
  },
];

function SportsCategoryCard({
  category,
}: {
  category: (typeof sportsCategories)[0];
}) {
  return (
    <Link href={`/prediction/sports/${category.slug}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {category.description}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {category.activeGames}개 진행중
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {category.activeGames}
              </div>
              <div className="text-xs text-gray-500">활성 게임</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {category.totalParticipants.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">총 참여자</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {category.averageReturn}x
              </div>
              <div className="text-xs text-gray-500">평균 수익률</div>
            </div>
          </div>

          {/* Subcategories */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              주요 카테고리
            </div>
            <div className="flex flex-wrap gap-2">
              {category.subcategories.slice(0, 4).map((sub, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-md"
                >
                  {sub}
                </span>
              ))}
              {category.subcategories.length > 4 && (
                <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-md">
                  +{category.subcategories.length - 4}개 더
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SportsOverviewPage() {
  const totalGames = sportsCategories.reduce(
    (sum, cat) => sum + cat.activeGames,
    0
  );
  const totalParticipants = sportsCategories.reduce(
    (sum, cat) => sum + cat.totalParticipants,
    0
  );
  const averageReturn =
    sportsCategories.reduce((sum, cat) => sum + cat.averageReturn, 0) /
    sportsCategories.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-4xl">🏆</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">스포츠 예측</h1>
            <p className="text-gray-600">
              다양한 스포츠 경기 결과를 예측하고 PMP를 획득하세요
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">
              총 활성 게임
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {totalGames}개
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">총 참여자</div>
            <div className="text-2xl font-bold text-green-900">
              {totalParticipants.toLocaleString()}명
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">
              평균 수익률
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {averageReturn.toFixed(1)}x
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">
              스포츠 종목
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {sportsCategories.length}개
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 인기 스포츠</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sportsCategories
            .sort((a, b) => b.totalParticipants - a.totalParticipants)
            .slice(0, 3)
            .map((category, index) => (
              <div
                key={category.slug}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl">{category.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {category.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.totalParticipants.toLocaleString()}명 참여
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          스포츠 카테고리
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sportsCategories.map((category) => (
            <SportsCategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>

      {/* Agency Theory Explanation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">🎯</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Agency Theory를 통한 스포츠 예측
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>정보 비대칭 해결:</strong> 전문가와 일반 팬들의 예측을
                비교하여 더 정확한 결과를 도출합니다.
              </p>
              <p>
                <strong>집단 지성 활용:</strong> 다수의 참여자가 제공하는 정보를
                종합하여 개별 예측의 한계를 극복합니다.
              </p>
              <p>
                <strong>투명한 보상:</strong> PMP 기반 보상 시스템으로 정확한
                예측에 대한 적절한 인센티브를 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
