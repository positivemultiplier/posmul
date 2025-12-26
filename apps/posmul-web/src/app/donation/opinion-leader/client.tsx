"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MotionDiv, staggerContainerVariants, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { OpinionLeaderCard, OpinionLeader } from "../../../bounded-contexts/donation/presentation/components/OpinionLeaderCard";

interface OpinionLeaderClientProps {
  leaders: OpinionLeader[];
  userPmcBalance: number;
  isLoggedIn: boolean;
  userId: string | null;
}

type SortOption = "followers" | "donations" | "name";

export function OpinionLeaderClient({
  leaders,
  userPmcBalance,
  isLoggedIn,
}: OpinionLeaderClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("followers");
  const [searchQuery, setSearchQuery] = useState("");

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    return [...new Set(leaders.map((l) => l.category))];
  }, [leaders]);

  // 필터링 및 정렬된 리더 목록
  const filteredAndSortedLeaders = useMemo(() => {
    let result = [...leaders];

    // 카테고리 필터
    if (selectedCategory) {
      result = result.filter((l) => l.category === selectedCategory);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.displayName.toLowerCase().includes(query) ||
          l.bio.toLowerCase().includes(query) ||
          l.categoryLabel.toLowerCase().includes(query)
      );
    }

    // 정렬
    switch (sortBy) {
      case "followers":
        result.sort((a, b) => b.followerCount - a.followerCount);
        break;
      case "donations":
        result.sort(
          (a, b) => b.totalDonationsInfluenced - a.totalDonationsInfluenced
        );
        break;
      case "name":
        result.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
    }

    return result;
  }, [leaders, selectedCategory, sortBy, searchQuery]);

  // Helper stats
  const totalFollowers = leaders.reduce((sum, l) => sum + l.followerCount, 0);
  const totalImpact = leaders.reduce((sum, l) => sum + l.totalDonationsInfluenced, 0);

  const formatCount = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
    return num.toLocaleString();
  };

  const formatAmount = (num: number) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${(num / 10000).toFixed(0)}만`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-16 pb-20">

      {/* Hero Section */}
      <div className="relative py-12 px-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-block mb-3 text-purple-400 font-medium tracking-wide">LEADERS OF CHANGE</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            오피니언 리더
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            사회적 영향력을 가진 리더들과 함께 의미 있는 기부에 참여하세요.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div>
              <div className="text-2xl font-bold text-white">{leaders.length}</div>
              <div className="text-xs text-gray-400">활동 리더</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatCount(totalFollowers)}</div>
              <div className="text-xs text-gray-400">총 팔로워</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{formatAmount(totalImpact)}</div>
              <div className="text-xs text-gray-400">영향력 기부금</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">

          {/* Search */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="리더 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-gray-500 whitespace-nowrap">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full md:w-auto px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="followers">팔로워순</option>
              <option value="donations">기부 영향력순</option>
              <option value="name">이름순</option>
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const catLeader = leaders.find((l) => l.category === cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
              >
                {catLeader?.categoryIcon} {catLeader?.categoryLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <MotionDiv
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredAndSortedLeaders.map((leader) => (
          <MotionDiv key={leader.id} variants={fadeInVariants}>
            <OpinionLeaderCard leader={leader} />
          </MotionDiv>
        ))}
      </MotionDiv>

      {/* Empty State */}
      {filteredAndSortedLeaders.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <span className="text-4xl block mb-4">🔍</span>
          <p className="text-gray-500">조건에 맞는 오피니언 리더가 없습니다.</p>
        </div>
      )}

    </div>
  );
}
