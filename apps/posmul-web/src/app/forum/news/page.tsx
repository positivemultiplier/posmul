"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Newspaper, Clock, Eye, Award, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  readTime: number;
  viewCount: number;
  pmpReward: number;
  hasQuiz: boolean;
  isNew?: boolean;
}

const MOCK_NEWS: NewsArticle[] = [
  {
    id: "news-001",
    title: "2025년 국가 예산안 국회 본회의 통과",
    summary: "총 656조 원 규모의 2025년도 예산안이 국회 본회의를 통과했습니다.",
    category: "policy",
    source: "정책브리핑",
    publishedAt: "2024-12-30",
    readTime: 5,
    viewCount: 12500,
    pmpReward: 15,
    hasQuiz: true,
    isNew: true,
  },
  {
    id: "news-002",
    title: "기초연금 인상안, 내년 1월부터 시행",
    summary: "노인 기초연금이 월 33만원에서 40만원으로 인상됩니다.",
    category: "society",
    source: "복지뉴스",
    publishedAt: "2024-12-29",
    readTime: 3,
    viewCount: 8900,
    pmpReward: 10,
    hasQuiz: true,
    isNew: true,
  },
  {
    id: "news-003",
    title: "탄소세 도입 논의, 2026년 시행 목표",
    summary: "환경부가 탄소세 도입을 위한 로드맵을 발표했습니다.",
    category: "economy",
    source: "환경부",
    publishedAt: "2024-12-28",
    readTime: 7,
    viewCount: 5600,
    pmpReward: 20,
    hasQuiz: false,
  },
  {
    id: "news-004",
    title: "디지털 플랫폼 규제법 국회 상정",
    summary:
      "대형 플랫폼 기업의 시장 지배력 남용을 방지하기 위한 법안이 상정되었습니다.",
    category: "policy",
    source: "법률신문",
    publishedAt: "2024-12-27",
    readTime: 6,
    viewCount: 3200,
    pmpReward: 15,
    hasQuiz: true,
  },
];

const CATEGORIES = [
  { key: "all", label: "전체 뉴스" },
  { key: "policy", label: "정책·법률" },
  { key: "economy", label: "경제·재정" },
  { key: "society", label: "사회·복지" },
];

function ForumNewsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCategory = searchParams?.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPmpEarned] = useState(450);

  // Row 3 네비게이션 쿼리 변경 시 즉시 반영
  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/forum/news");
    } else {
      router.push(`/forum/news?category=${key}`);
    }
  };

  const filteredNews = MOCK_NEWS.filter((article) => {
    const matchCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const matchSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="forum"
          title="📰 News · 공공 뉴스 & 지식 퀴즈"
          subtitle="공공 정책과 경제·사회 뉴스를 읽고 퀴즈를 풀어 무위험 시민 자본(PMP)을 획득하세요"
          metrics={[{ label: "내 뉴스 학습 보상", value: totalPmpEarned, unit: "PMP" }]}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.key
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                      : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="뉴스 제목 또는 키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        </DomainContextHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredNews.map((article) => (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/forum/news/${article.category}/${article.id}`}>
                  <Card className="bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/40 transition-all cursor-pointer group overflow-hidden h-full">
                    <div className="relative aspect-video bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 flex items-center justify-center border-b border-white/[0.04]">
                      <Newspaper className="w-11 h-11 text-emerald-400/35 group-hover:scale-110 transition-transform" />
                      {article.isNew && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                          NEW
                        </span>
                      )}
                      {article.hasQuiz && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/40 text-teal-200 text-[10px] font-bold">
                          지식 퀴즈
                        </span>
                      )}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 text-slate-300 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}분
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-medium">
                          {CATEGORIES.find((c) => c.key === article.category)?.label}
                        </span>
                        <span>{article.source}</span>
                      </div>

                      <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-sm text-slate-400 line-clamp-2">
                        {article.summary}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {article.viewCount.toLocaleString()}
                          </span>
                          <span>{article.publishedAt}</span>
                        </div>
                        <span className="flex items-center gap-1 text-emerald-300 font-bold">
                          <Award className="w-3.5 h-3.5" />+{article.pmpReward} PMP
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-40 text-emerald-400" />
            <p>조건에 맞는 공공 뉴스가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForumNewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <ForumNewsContent />
    </Suspense>
  );
}
