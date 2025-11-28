/**
 * 오피니언 리더 목록 클라이언트 컴포넌트
 *
 * 카테고리 필터링, 정렬, 리더 카드 표시 기능
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface OpinionLeader {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  isVerified: boolean;
  followerCount: number;
  totalDonationsInfluenced: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  isFollowing: boolean;
}

interface OpinionLeaderClientProps {
  leaders: OpinionLeader[];
  userPmcBalance: number;
  isLoggedIn: boolean;
  userId: string | null;
}

type SortOption = "followers" | "donations" | "name";

// 카테고리별 색상 클래스 매핑
const categoryColorClasses: Record<
  string,
  { gradient: string; badge: string }
> = {
  environment: {
    gradient: "from-green-400 to-emerald-500",
    badge: "bg-green-100 text-green-700",
  },
  welfare: {
    gradient: "from-blue-400 to-cyan-500",
    badge: "bg-blue-100 text-blue-700",
  },
  science: {
    gradient: "from-purple-400 to-violet-500",
    badge: "bg-purple-100 text-purple-700",
  },
  human_rights: {
    gradient: "from-red-400 to-rose-500",
    badge: "bg-red-100 text-red-700",
  },
  education: {
    gradient: "from-yellow-400 to-amber-500",
    badge: "bg-yellow-100 text-yellow-700",
  },
  health: {
    gradient: "from-pink-400 to-rose-500",
    badge: "bg-pink-100 text-pink-700",
  },
  culture: {
    gradient: "from-indigo-400 to-blue-500",
    badge: "bg-indigo-100 text-indigo-700",
  },
  economy: {
    gradient: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
  general: {
    gradient: "from-gray-400 to-slate-500",
    badge: "bg-gray-100 text-gray-700",
  },
};

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

  // 팔로워 수 포맷
  const formatFollowerCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천`;
    }
    return count.toLocaleString();
  };

  // 금액 포맷
  const formatAmount = (amount: number): string => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">👑 오피니언 리더</h1>
          <p className="text-lg text-white/90 mb-6">
            사회적 영향력을 가진 리더들과 함께 의미 있는 기부에 참여하세요
          </p>
          {isLoggedIn && (
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <span className="text-white/80">내 PMC 잔액:</span>
              <span className="ml-2 text-2xl font-bold">
                {userPmcBalance.toLocaleString()} PMC
              </span>
            </div>
          )}

          {/* 통계 */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{leaders.length}</div>
              <div className="text-sm text-white/70">활동 리더</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">
                {formatFollowerCount(
                  leaders.reduce((sum, l) => sum + l.followerCount, 0)
                )}
              </div>
              <div className="text-sm text-white/70">총 팔로워</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">
                ₩
                {formatAmount(
                  leaders.reduce((sum, l) => sum + l.totalDonationsInfluenced, 0)
                )}
              </div>
              <div className="text-sm text-white/70">영향력 기부금</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="리더 이름 또는 키워드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              카테고리
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                전체 ({leaders.length})
              </button>
              {categories.map((cat) => {
                const catLeader = leaders.find((l) => l.category === cat);
                const count = leaders.filter((l) => l.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {catLeader?.categoryIcon} {catLeader?.categoryLabel} (
                    {count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                정렬:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="followers">팔로워순</option>
                <option value="donations">기부 영향력순</option>
                <option value="name">이름순</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAndSortedLeaders.length}명의 리더
            </div>
          </div>
        </div>

        {/* Leader Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAndSortedLeaders.map((leader, index) => {
            const colorClasses =
              categoryColorClasses[leader.category] ||
              categoryColorClasses.general;
            const isTop3 = index < 3 && !selectedCategory && !searchQuery;

            return (
              <Link
                key={leader.id}
                href={`/donation/opinion-leader/${leader.id}`}
                className={`block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                  isTop3 ? "ring-2 ring-purple-400" : ""
                }`}
              >
                {/* Header with gradient */}
                <div
                  className={`bg-gradient-to-r ${colorClasses.gradient} p-6 relative`}
                >
                  {/* Rank badge for top 3 */}
                  {isTop3 && (
                    <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl border-2 border-white/50">
                      {leader.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={leader.avatarUrl}
                          alt={leader.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{leader.categoryIcon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white truncate">
                          {leader.displayName}
                        </h3>
                        {leader.isVerified && (
                          <span className="text-white/90" title="인증됨">
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.badge}`}
                      >
                        {leader.categoryIcon} {leader.categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Bio */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {leader.bio}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatFollowerCount(leader.followerCount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        팔로워
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ₩{formatAmount(leader.totalDonationsInfluenced)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        기부 영향력
                      </div>
                    </div>
                  </div>

                  {/* Social Links Preview */}
                  {Object.keys(leader.socialLinks).length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      {Object.entries(leader.socialLinks)
                        .slice(0, 3)
                        .map(([platform]) => (
                          <span
                            key={platform}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                          >
                            {platform === "instagram"
                              ? "📸"
                              : platform === "youtube"
                                ? "📺"
                                : platform === "twitter"
                                  ? "🐦"
                                  : platform === "blog"
                                    ? "📝"
                                    : "🔗"}{" "}
                            {platform}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Follow status & CTA */}
                  <div className="flex items-center justify-between">
                    {leader.isFollowing ? (
                      <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        ✓ 팔로잉
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        팔로우하고 함께하기
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      프로필 보기
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAndSortedLeaders.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <span className="text-6xl block mb-4">👑</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              다른 키워드로 검색하거나 필터를 조정해보세요.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            오피니언 리더와 함께하는 기부
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📣</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                영향력 확산
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                리더의 목소리를 통해 기부 문화가 더 널리 퍼집니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                전문성 기반
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                각 분야 전문가가 선별한 의미 있는 기부처
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                함께하는 기부
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                같은 가치를 추구하는 사람들과 함께 참여
              </p>
            </div>
          </div>
        </div>

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
