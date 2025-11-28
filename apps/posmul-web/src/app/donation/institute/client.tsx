"use client";

import { useState } from "react";
import Link from "next/link";

interface Institute {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  websiteUrl: string | null;
  trustScore: number;
  isVerified: boolean;
}

interface InstituteClientProps {
  institutes: Institute[];
  userPmcBalance: number;
  isLoggedIn: boolean;
}

export function InstituteClient({
  institutes,
  userPmcBalance,
  isLoggedIn,
}: InstituteClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 카테고리 필터링
  const categories = [...new Set(institutes.map((i) => i.category))];
  const filteredInstitutes = selectedCategory
    ? institutes.filter((i) => i.category === selectedCategory)
    : institutes;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">🏛️ 기관 기부</h1>
          <p className="text-lg text-white/90 mb-6">
            검증된 기관을 통해 안전하고 투명한 기부를 경험하세요
          </p>
          {isLoggedIn && (
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/80">내 PMC 잔액:</span>
              <span className="ml-2 text-2xl font-bold">
                {userPmcBalance.toLocaleString()} PMC
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            카테고리 필터
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              전체 ({institutes.length})
            </button>
            {categories.map((cat) => {
              const catInstitute = institutes.find((i) => i.category === cat);
              const count = institutes.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {catInstitute?.categoryIcon} {catInstitute?.categoryLabel} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Institute Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredInstitutes.map((institute) => (
            <Link
              key={institute.id}
              href={`/donation/institute/${institute.id}`}
              className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{institute.categoryIcon}</span>
                  {institute.isVerified && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      ✓ 인증됨
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {institute.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {institute.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                    {institute.categoryLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {institute.trustScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {institute.websiteUrl && (
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(institute.websiteUrl!, "_blank");
                      }}
                      className="text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      웹사이트 →
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredInstitutes.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">🏛️</span>
            <p className="text-gray-500 dark:text-gray-400">
              해당 카테고리에 등록된 기관이 없습니다.
            </p>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/donation"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← 기부 메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
