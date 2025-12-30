"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star, Users, Heart, Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

export interface OpinionLeader {
  id: string;
  displayName: string;
  bio: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  avatarUrl: string | null;
  followerCount: number;
  totalDonationsInfluenced: number;
  isVerified: boolean;
}

interface OpinionLeaderClientProps {
  leaders: OpinionLeader[];
  userPmcBalance: number;
  isLoggedIn: boolean;
  userId: string | null;
}

// 카테고리 목록
const CATEGORIES = [
  { key: "all", label: "전체", icon: "🌟" },
  { key: "environment", label: "환경", icon: "🌿" },
  { key: "education", label: "교육", icon: "📚" },
  { key: "animal", label: "동물", icon: "🐾" },
  { key: "welfare", label: "복지", icon: "🤝" },
  { key: "culture", label: "문화", icon: "🎭" },
];

export function OpinionLeaderClient({ leaders }: OpinionLeaderClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeaders = useMemo(() => {
    return leaders.filter((leader) => {
      const matchCategory = selectedCategory === "all" || leader.category === selectedCategory;
      const matchSearch = leader.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leader.bio.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [leaders, selectedCategory, searchQuery]);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-950 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-purple-950/80 border-b border-purple-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                🌟 Leader
              </h1>
              <p className="text-sm text-purple-400/70">오피니언 리더 · 선한 영향력</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">활동 리더</p>
              <p className="text-xl font-bold text-purple-400">
                <span className="text-2xl">{leaders.length}</span>
                <span className="text-sm ml-1">명</span>
              </p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="리더 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500
                         focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500">총 팔로워</p>
            <p className="text-lg font-bold text-white">{formatCount(totalFollowers)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500">영향력 기부금</p>
            <p className="text-lg font-bold text-purple-400">{formatAmount(totalImpact)} PMC</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.key
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leader Grid */}
      <main className="max-w-4xl mx-auto px-4 py-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredLeaders.map((leader) => (
              <motion.div
                key={leader.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/donation/opinion-leader/${leader.category}/${leader.id}`}>
                  <Card className="bg-slate-900/70 border-slate-800 hover:border-purple-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                    {/* 아바타 영역 */}
                    <div className="relative aspect-video bg-gradient-to-br from-purple-900/50 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-4xl border-4 border-purple-500/30">
                          {leader.avatarUrl ? (
                            <img src={leader.avatarUrl} alt={leader.displayName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            leader.categoryIcon
                          )}
                        </div>
                        {leader.isVerified && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-purple-500/80 text-white text-xs">
                            ✓ 인증됨
                          </span>
                        )}
                      </div>
                      {/* 팔로워 수 */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatCount(leader.followerCount)}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2">
                      {/* 카테고리 */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400">
                          {leader.categoryIcon} {leader.categoryLabel}
                        </span>
                      </div>

                      {/* 이름 */}
                      <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                        {leader.displayName}
                      </h3>

                      {/* 소개 */}
                      <p className="text-sm text-slate-400 line-clamp-2">{leader.bio}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          영향력 {formatAmount(leader.totalDonationsInfluenced)} PMC
                        </span>
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          함께하기 →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredLeaders.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>조건에 맞는 리더가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
