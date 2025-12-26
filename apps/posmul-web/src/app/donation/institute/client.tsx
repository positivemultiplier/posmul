"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionDiv, staggerContainerVariants, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { InstituteCard, Institute } from "../../../bounded-contexts/donation/presentation/components/InstituteCard";
import { DonationLeaderboard } from "../../../bounded-contexts/donation/presentation/components/DonationLeaderboard";

interface InstituteClientProps {
  institutes: Institute[];
  isLoggedIn: boolean;
}

export function InstituteClient({
  institutes,
}: InstituteClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 카테고리 필터링
  const categories = [...new Set(institutes.map((i) => i.category))];
  const filteredInstitutes = selectedCategory
    ? institutes.filter((i) => i.category === selectedCategory)
    : institutes;

  return (
    <div className="space-y-16 pb-20">

      {/* Domain Hero Section */}
      <div className="relative py-12 px-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 to-emerald-900/50" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <span className="inline-block mb-3 text-emerald-400 font-medium tracking-wide">TRUSTED PARTNERS</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            검증된 기부 기관
          </h1>
          <p className="text-gray-300 text-lg">
            PosMul의 엄격한 기준으로 검증된 기관들을 만나보세요. <br />
            모든 기부 내역은 투명하게 공개됩니다.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === null
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
        >
          All Categories ({institutes.length})
        </button>
        {categories.map((cat) => {
          const catInstitute = institutes.find((i) => i.category === cat);
          const count = institutes.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === cat
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                }`}
            >
              {catInstitute?.categoryIcon} {catInstitute?.categoryLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters & Options Row */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          총 <strong className="text-gray-900 dark:text-white">{filteredInstitutes.length}</strong>개의 기관
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>정렬:</span>
          <select className="bg-transparent border-none font-medium text-gray-900 dark:text-white focus:ring-0 cursor-pointer">
            <option>신뢰도순</option>
            <option>최신순</option>
            <option>인기순</option>
          </select>
        </div>
      </div>

      {/* Institute Grid with Staggered Animation */}
      <MotionDiv
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredInstitutes.map((institute) => (
          <MotionDiv key={institute.id} variants={fadeInVariants}>
            <InstituteCard institute={institute} />
          </MotionDiv>
        ))}
      </MotionDiv>

      {/* Empty State */}
      {filteredInstitutes.length === 0 && (
        <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <span className="text-6xl block mb-6 opacity-30">🔍</span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">조건에 맞는 기관이 없습니다</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            다른 카테고리를 선택하거나 필터를 초기화해보세요.
          </p>
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* Ranking Board Section */}
      <div className="mt-20">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🏆</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">이달의 우수 기관</h2>
        </div>
        <DonationLeaderboard />
      </div>
    </div>
  );
}
