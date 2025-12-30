"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Target, Users, Search, TrendingUp, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

interface FundingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  target_beneficiary: string;
  product_name: string;
  manufacturer: string;
  unit_price: number;
  target_quantity: number;
  current_quantity: number;
  achievementRate: number;
  images: string[];
}

interface DirectDonationClientProps {
  projects: FundingProject[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

// 카테고리 목록
const CATEGORIES = [
  { key: "all", label: "전체", icon: "🎁" },
  { key: "clothing", label: "의류/잡화", icon: "👕" },
  { key: "food", label: "식품/생필품", icon: "🍚" },
  { key: "education", label: "교육/도서", icon: "📚" },
  { key: "electronics", label: "가전/디지털", icon: "🔌" },
  { key: "medical", label: "의료/건강", icon: "💊" },
];

export function DirectDonationClient({ projects }: DirectDonationClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((project) => {
    const matchCategory = selectedCategory === "all" || project.category === selectedCategory;
    const matchSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalDelivered = 1240; // Mock
  const totalBeneficiaries = 382; // Mock

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-slate-950 text-slate-200">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-emerald-950/80 border-b border-emerald-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                🎁 Direct
              </h1>
              <p className="text-sm text-emerald-400/70">물품 직접 기부 · 펀딩 참여</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">진행 중</p>
              <p className="text-xl font-bold text-emerald-400">
                <span className="text-2xl">{projects.length}</span>
                <span className="text-sm ml-1">개</span>
              </p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="프로젝트명 또는 제품 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500
                         focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500">전달된 물품</p>
            <p className="text-lg font-bold text-white">{totalDelivered.toLocaleString()}개</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
            <p className="text-xs text-slate-500">수혜 이웃</p>
            <p className="text-lg font-bold text-emerald-400">{totalBeneficiaries}명</p>
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
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      <main className="max-w-4xl mx-auto px-4 py-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => {
              const isUrgent = project.achievementRate >= 80 && project.achievementRate < 100;
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/donation/direct/item/${project.id}`}>
                    <Card className="bg-slate-900/70 border-slate-800 hover:border-emerald-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                      {/* 이미지 영역 */}
                      <div className="relative aspect-video bg-gradient-to-br from-emerald-900/50 to-slate-900 flex items-center justify-center">
                        <span className="text-6xl opacity-50">{project.categoryIcon}</span>

                        {/* 카테고리 뱃지 */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-800/80 text-white text-xs flex items-center gap-1">
                          {project.categoryIcon} {project.categoryLabel}
                        </span>

                        {isUrgent && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold animate-pulse">
                            마감임박
                          </span>
                        )}

                        {/* 진행률 */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${project.achievementRate}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        {/* 제목 */}
                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {project.title}
                        </h3>

                        {/* 정보 */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="truncate">{project.target_beneficiary}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span className="truncate">{project.manufacturer}</span>
                          </div>
                        </div>

                        {/* 진행 상황 */}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <span className="text-emerald-400 font-bold">{project.achievementRate}%</span>
                            <span className="text-xs text-slate-500 ml-1">
                              ({project.current_quantity}/{project.target_quantity})
                            </span>
                          </div>
                          <span className="text-sm font-bold text-white">
                            {project.unit_price.toLocaleString()}원
                            <span className="text-xs font-normal text-slate-500">/개</span>
                          </span>
                        </div>

                        {/* CTA */}
                        <div className="pt-2">
                          <div className="w-full py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/50 text-center text-emerald-400 text-sm font-medium group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            선물하기 🎁
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>진행 중인 프로젝트가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
