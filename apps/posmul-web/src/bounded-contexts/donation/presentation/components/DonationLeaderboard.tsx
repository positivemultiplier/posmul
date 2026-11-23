"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalAmount: number;
  donationCount: number;
  isAnonymous: boolean;
  badge: string | null;
}

interface LeaderboardPeriod {
  id: "all" | "monthly" | "weekly";
  label: string;
  icon: string;
}

const periods: LeaderboardPeriod[] = [
  { id: "all", label: "전체", icon: "" },
  { id: "monthly", label: "이번 달", icon: "" },
  { id: "weekly", label: "이번 주", icon: "" },
];

// 랭크에 따른 배지
function getRankBadge(rank: number): { emoji: string; color: string; bg: string } {
  switch (rank) {
    case 1:
      return { emoji: "", color: "text-yellow-500", bg: "from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30" };
    case 2:
      return { emoji: "", color: "text-gray-400", bg: "from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50" };
    case 3:
      return { emoji: "", color: "text-orange-400", bg: "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30" };
    default:
      return { emoji: "", color: "text-gray-600", bg: "bg-white dark:bg-gray-800" };
  }
}

// 기부 레벨 배지
function getDonorBadge(totalAmount: number): { title: string; emoji: string } {
  if (totalAmount >= 1000000) return { title: "다이아몬드 기부자", emoji: "" };
  if (totalAmount >= 500000) return { title: "플래티넘 기부자", emoji: "" };
  if (totalAmount >= 100000) return { title: "골드 기부자", emoji: "" };
  if (totalAmount >= 50000) return { title: "실버 기부자", emoji: "" };
  if (totalAmount >= 10000) return { title: "브론즈 기부자", emoji: "" };
  return { title: "신규 기부자", emoji: "" };
}

export function DonationLeaderboard() {
  const [activePeriod, setActivePeriod] = useState<"all" | "monthly" | "weekly">("monthly");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/donation/leaderboard?period=${activePeriod}`);
        const data = await response.json();
        
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
          setUserRank(data.data.userRank);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [activePeriod]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span></span>
          기부 리더보드
        </h2>
        <p className="text-white/80 text-sm mt-1">
          따뜻한 나눔으로 세상을 바꾸는 분들
        </p>
      </div>

      {/* Period Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setActivePeriod(period.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activePeriod === period.id
                ? "text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-green-50 dark:bg-green-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <span className="mr-1">{period.icon}</span>
            {period.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-2" />
                </div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <span className="text-4xl block mb-3"></span>
            <p>아직 기부 내역이 없습니다.</p>
            <p className="text-sm">첫 번째 기부자가 되어보세요!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 Highlight */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {leaderboard.slice(0, 3).map((entry) => {
                const rankBadge = getRankBadge(entry.rank);
                const donorBadge = getDonorBadge(entry.totalAmount);
                
                return (
                  <div
                    key={entry.userId}
                    className={`bg-gradient-to-br ${rankBadge.bg} rounded-xl p-4 text-center ${
                      entry.rank === 1 ? "scale-105 shadow-lg" : ""
                    }`}
                  >
                    <div className="text-3xl mb-2">{rankBadge.emoji}</div>
                    <div className="font-bold text-gray-900 dark:text-white truncate">
                      {entry.isAnonymous ? "익명의 기부자" : entry.displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {donorBadge.emoji} {donorBadge.title}
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                      {entry.totalAmount.toLocaleString()} PMC
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.donationCount}회 기부
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of the list */}
            {leaderboard.slice(3).map((entry) => {
              const donorBadge = getDonorBadge(entry.totalAmount);
              
              return (
                <div
                  key={entry.userId}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Rank */}
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 font-bold text-gray-700 dark:text-gray-300">
                    {entry.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {entry.isAnonymous ? "익명의 기부자" : entry.displayName}
                      </span>
                      <span className="text-sm" title={donorBadge.title}>
                        {donorBadge.emoji}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.donationCount}회 기부
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      {entry.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">PMC</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User's Own Rank */}
        {userRank && !leaderboard.find((e) => e.userId === userRank.userId) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">나의 순위</div>
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white font-bold">
                {userRank.rank}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {userRank.displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {userRank.donationCount}회 기부
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600 dark:text-green-400">
                  {userRank.totalAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">PMC</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            기부하면 리더보드에 오를 수 있어요!
          </p>
        </div>
      </div>
    </div>
  );
}
