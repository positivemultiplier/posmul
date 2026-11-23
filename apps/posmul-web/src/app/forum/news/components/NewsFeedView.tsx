"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Award,
  Clock,
  Eye,
  MapPin,
  MessageSquare,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";
import {
  getNewsCategoryMeta,
  GWANGJU_REGION_FILTERS,
  NEWS_CATEGORIES,
  NewsArticleListItem,
  NewsSectionCategory,
  normalizeNewsCategoryFilter,
} from "@/bounded-contexts/forum/domain/value-objects/news-article.types";

interface NewsApiResponse {
  success: boolean;
  data?: {
    articles: NewsArticleListItem[];
    viewer: {
      isAuthenticated: boolean;
      dailyEarnedPmp: number;
      dailyMaxPmp: number;
    };
  };
}

interface NewsFeedViewProps {
  initialCategory?: string;
}

const SECTION_TABS: ReadonlyArray<{ key: "all" | NewsSectionCategory; label: string }> = [
  { key: "all", label: "전체 뉴스" },
  ...NEWS_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
];

function formatKoreanDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function NewsFeedView({ initialCategory }: NewsFeedViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawCategory = initialCategory ?? searchParams?.get("category") ?? "all";
  const rawRegion = searchParams?.get("region") ?? "";

  const [selectedCategory, setSelectedCategory] = useState<"all" | NewsSectionCategory>(
    normalizeNewsCategoryFilter(rawCategory)
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(rawRegion);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<NewsArticleListItem[]>([]);
  const [dailyEarnedPmp, setDailyEarnedPmp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(normalizeNewsCategoryFilter(rawCategory));
  }, [rawCategory]);

  useEffect(() => {
    setSelectedRegion(rawRegion);
  }, [rawRegion]);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (selectedCategory !== "all") qs.set("category", selectedCategory);
      if (selectedRegion) qs.set("region", selectedRegion);
      const res = await fetch(`/api/forum/news?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as NewsApiResponse;
      if (json.success && json.data) {
        setArticles(json.data.articles);
        setDailyEarnedPmp(json.data.viewer.dailyEarnedPmp);
      }
    } catch (err) {
      console.error("[NewsFeedView] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedRegion]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const syncUrl = (cat: "all" | NewsSectionCategory, region: string) => {
    const qs = new URLSearchParams();
    if (cat !== "all") qs.set("category", cat);
    if (region) qs.set("region", region);
    const queryStr = qs.toString();
    router.push(queryStr ? `/forum/news?${queryStr}` : "/forum/news");
  };

  const handleCategoryChange = (key: "all" | NewsSectionCategory) => {
    setSelectedCategory(key);
    const nextRegion = key === "gwangju" && !selectedRegion ? "ALL_GWANGJU" : key !== "gwangju" && key !== "all" ? "" : selectedRegion;
    setSelectedRegion(nextRegion);
    syncUrl(key, nextRegion);
  };

  const handleRegionChange = (regionCode: string) => {
    const next = selectedRegion === regionCode ? "" : regionCode;
    setSelectedRegion(next);
    const nextCat = next && selectedCategory === "all" ? "gwangju" : selectedCategory;
    setSelectedCategory(nextCat);
    syncUrl(nextCat, next);
  };

  const filteredNews = articles.filter((article) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.regionName.toLowerCase().includes(q) ||
      article.sourceName.toLowerCase().includes(q)
    );
  });

  const showGwangjuBar = selectedCategory === "all" || selectedCategory === "gwangju";

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="forum"
          title="PosMul AI 뉴스룸 · 광주 5개구 실험실"
          subtitle="공식 보도자료와 검증된 1차 피드를 AI 데스크가 3줄로 정리하고, 이해도 퀴즈로 무위험 시민 자본(PMP)을 지급합니다"
          metrics={[{ label: "오늘 포럼 획득", value: dailyEarnedPmp, unit: "PMP" }]}
        >
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {SECTION_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleCategoryChange(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedCategory === tab.key
                        ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                        : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="제목, 지역(서구·광산구), 키워드 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>

            {showGwangjuBar && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/70">
                <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1 mr-1">
                  <MapPin className="w-3.5 h-3.5" />
                  광주·전남 구별 필터:
                </span>
                {GWANGJU_REGION_FILTERS.map((rf) => {
                  const isActive = selectedRegion === rf.code;
                  return (
                    <button
                      key={rf.code}
                      onClick={() => handleRegionChange(rf.code)}
                      title={rf.neighborhoodHint}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                        isActive
                          ? "bg-teal-500/25 text-teal-200 border-teal-400/50"
                          : "bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {rf.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DomainContextHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredNews.map((article) => {
                const catMeta = getNewsCategoryMeta(article.category);
                return (
                  <motion.div
                    key={article.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/forum/news/${article.category}/${article.id}`}>
                      <Card className="bg-slate-900/70 border-slate-800/90 hover:border-emerald-500/40 transition-all cursor-pointer group overflow-hidden h-full flex flex-col">
                        <div className="relative h-36 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 p-4 flex flex-col justify-between border-b border-white/[0.04]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {article.isNew && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                                  NEW
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                AI 데스크
                              </span>
                            </div>

                            {article.hasQuiz && (
                              <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/40 text-teal-200 text-[10px] font-bold">
                                퀴즈 {article.quizCount}문항
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-teal-300">
                              <MapPin className="w-3.5 h-3.5" />
                              {article.regionName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/50 text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readTimeMinutes}분
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className={`px-2 py-0.5 rounded-md border font-medium ${catMeta.badgeClass}`}>
                                {catMeta.label}
                              </span>
                              <span className="truncate max-w-[140px]">{article.sourceName}</span>
                            </div>

                            <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                              {article.title}
                            </h3>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {article.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {article.viewCount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {article.commentCount}
                              </span>
                              <span>{formatKoreanDate(article.publishedAt)}</span>
                            </div>
                            <span className="flex items-center gap-1 text-emerald-300 font-bold">
                              <Award className="w-3.5 h-3.5" />+{article.pmpReward} PMP
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredNews.length === 0 && (
          <div className="text-center py-16 text-slate-500 border border-slate-800/80 rounded-2xl bg-slate-900/30">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-40 text-emerald-400" />
            <p className="text-sm font-medium text-slate-300">
              선택한 섹션·지역 조건에 맞는 발행 뉴스가 아직 없습니다.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              다른 구를 선택하거나 전체 뉴스 보기로 전환해 보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
