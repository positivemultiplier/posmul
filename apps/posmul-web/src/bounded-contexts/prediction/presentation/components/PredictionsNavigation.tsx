/**
 * 3-Tier Predictions Navigation Component
 *
 * Implements hierarchical navigation:
 * Tier 1: Expect (예측) - Fixed
 * Tier 2: consume, sports, entertainment, politics, user-suggestions
 * Tier 3: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

"use client";

// Using inline SVG instead of heroicons for compatibility
import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 3-Tier Predictions Navigation Component
 *
 * Implements hierarchical navigation:
 * Tier 1: Expect (예측) - Fixed
 * Tier 2: consume, sports, entertainment, politics, user-suggestions
 * Tier 3: Category-specific subcategories
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// Navigation Data Structure based on Project_Features.md
const navigationData = {
  all: {
    title: "📋 전체",
    description: "모든 예측 게임 보기",
    subcategories: [],
  },
  economy: {
    title: "📈 경제",
    description: "경제 지표 및 기업 실적 예측",
    subcategories: [
      {
        slug: "stocks",
        title: "주식",
        description: "주가 등락 예측",
      },
      {
        slug: "earnings",
        title: "기업 실적",
        description: "분기 실적 발표 예측",
      },
      {
        slug: "indicators",
        title: "경제 지표",
        description: "GDP, 물가, 금리 예측",
      },
      {
        slug: "crypto",
        title: "암호화폐",
        description: "비트코인, 이더리움 예측",
      },
    ],
  },
  consume: {
    title: "💳 소비 예측",
    description: "Time/Money/Cloud 소비 영역 예측",
    subcategories: [
      {
        slug: "time",
        title: "TimeConsume",
        description: "광고/설문 등 시간 소비",
      },
      {
        slug: "money",
        title: "MoneyConsume",
        description: "지역 소비",
      },
      {
        slug: "cloud",
        title: "CloudConsume",
        description: "펀딩/후원",
      },
    ],
  },
  sports: {
    title: "⚽ 스포츠 예측",
    description: "경기 결과 및 선수 성과 예측",
    subcategories: [
      { slug: "soccer", title: "축구", description: "국내외 축구 경기" },
      { slug: "baseball", title: "야구", description: "KBO, MLB 경기" },
      { slug: "basketball", title: "농구", description: "KBL, NBA 경기" },
      { slug: "esports", title: "e스포츠", description: "LOL, 오버워치 등" },
    ],
  },
  entertainment: {
    title: "🎬 엔터테인먼트",
    description: "흥행 성적 및 수상 예측",
    subcategories: [
      { slug: "movies", title: "영화", description: "박스오피스 예측" },
      { slug: "dramas", title: "드라마", description: "시청률 예측" },
      { slug: "music", title: "음악", description: "차트 순위 예측" },
      { slug: "tv", title: "TV", description: "예능 프로그램" },
      { slug: "awards", title: "시상식", description: "각종 시상식 수상" },
    ],
  },
  politics: {
    title: "🗳️ 정치/선거",
    description: "선거 결과 및 정책 예측",
    subcategories: [
      {
        slug: "national-elections",
        title: "국가 선거",
        description: "대통령, 국회의원 선거",
      },
      {
        slug: "local-elections",
        title: "지역 선거",
        description: "지방자치단체장 선거",
      },
      {
        slug: "international-elections",
        title: "국제 선거",
        description: "해외 주요 선거",
      },
      {
        slug: "policy-changes",
        title: "정책 변화",
        description: "정부 정책 시행 예측",
      },
    ],
  },
  "user-suggestions": {
    title: "💡 사용자 제안",
    description: "커뮤니티 제안 예측 시장",
    subcategories: [
      {
        slug: "user-proposals",
        title: "사용자 제안",
        description: "개인 제안 주제",
      },
      {
        slug: "ai-recommendations",
        title: "AI 추천",
        description: "AI 기반 예측 주제",
      },
      {
        slug: "opinion-leader-suggestions",
        title: "오피니언 리더",
        description: "전문가 초청 예측",
      },
    ],
  },
};

export function PredictionsNavigation() {
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Extract current navigation state from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const currentCategory = pathParts[1]; // prediction/[category]/...
  const currentSubcategory = pathParts[2]; // prediction/category/[subcategory]/...

  const handleCategoryHover = (category: string) => {
    setActiveCategory(category);
  };

  const handleMouseLeave = () => {
    setActiveCategory(null);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-16 md:top-[152px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tier 2 Navigation - Main Categories */}
        <div className="flex space-x-8 overflow-x-auto">
          {Object.entries(navigationData).map(([key, category]) => (
            <div
              key={key}
              className="relative"
              onMouseEnter={() => handleCategoryHover(key)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/prediction/${key}`}
                className={`
                  flex items-center space-x-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors duration-200
                  ${currentCategory === key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="whitespace-nowrap">{category.title}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>

              {/* Tier 3 Navigation - Subcategories Dropdown */}
              {(activeCategory === key || currentCategory === key) && (
                <div className="absolute top-full left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {category.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.slug}
                          href={`/prediction/${key}/${subcategory.slug}`}
                          className={`
                            block p-3 rounded-md transition-colors duration-200
                            ${currentSubcategory === subcategory.slug
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : "hover:bg-gray-50"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {subcategory.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {subcategory.description}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">→</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current Path Breadcrumb */}
        {currentCategory && (
          <div className="py-2 text-xs text-gray-500 border-t border-gray-100">
            <span>예측</span>
            <span className="mx-2">›</span>
            <span className="text-gray-700">
              {
                navigationData[currentCategory as keyof typeof navigationData]
                  ?.title
              }
            </span>
            {currentSubcategory && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-900 font-medium">
                  {
                    navigationData[
                      currentCategory as keyof typeof navigationData
                    ]?.subcategories.find(
                      (sub) => sub.slug === currentSubcategory
                    )?.title
                  }
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
