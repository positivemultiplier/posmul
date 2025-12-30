"use client";

import React, { useState } from "react";
import { Newspaper, Clock, Eye, Award, Search, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// Mock 뉴스 데이터 타입
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

// Mock 뉴스 데이터
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
        summary: "대형 플랫폼 기업의 시장 지배력 남용을 방지하기 위한 법안이 상정되었습니다.",
        category: "policy",
        source: "법률신문",
        publishedAt: "2024-12-27",
        readTime: 6,
        viewCount: 3200,
        pmpReward: 15,
        hasQuiz: true,
    },
];

// 카테고리 필터
const CATEGORIES = [
    { key: "all", label: "전체" },
    { key: "policy", label: "정책·법률" },
    { key: "economy", label: "경제·재정" },
    { key: "society", label: "사회·복지" },
];

export default function ForumNewsPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmpEarned] = useState(450);

    const filteredNews = MOCK_NEWS.filter((article) => {
        const matchCategory = selectedCategory === "all" || article.category === selectedCategory;
        const matchSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-950 text-slate-200">
            {/* Header - Consume 스타일 */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-blue-950/80 border-b border-blue-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                📰 News
                            </h1>
                            <p className="text-sm text-blue-400/70">공공 뉴스 · 지식 획득</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 획득</p>
                            <p className="text-xl font-bold text-blue-400">
                                <span className="text-2xl">{totalPmpEarned}</span>
                                <span className="text-sm ml-1">PMP</span>
                            </p>
                        </div>
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="뉴스 제목 또는 키워드 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500
                         focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.key
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* News Grid - Consume 카드 스타일 */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredNews.map((article) => (
                            <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* 라우팅 수정: /forum/news/[category]/[articleId] */}
                                <Link href={`/forum/news/${article.category}/${article.id}`}>
                                    <Card className="bg-slate-900/70 border-slate-800 hover:border-blue-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                                        {/* 썸네일 영역 */}
                                        <div className="relative aspect-video bg-gradient-to-br from-blue-900/50 to-slate-900 flex items-center justify-center">
                                            <Newspaper className="w-12 h-12 text-blue-400/30" />
                                            {article.isNew && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-500 text-white text-xs font-bold">
                                                    NEW
                                                </span>
                                            )}
                                            {article.hasQuiz && (
                                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-yellow-500 text-black text-xs font-bold">
                                                    퀴즈
                                                </span>
                                            )}
                                            {/* 읽기 시간 표시 */}
                                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {article.readTime}분
                                            </div>
                                        </div>

                                        <CardContent className="p-4 space-y-2">
                                            {/* 카테고리 & 출처 */}
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                                                    {CATEGORIES.find(c => c.key === article.category)?.label}
                                                </span>
                                                <span>{article.source}</span>
                                            </div>

                                            {/* 제목 */}
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                                                {article.title}
                                            </h3>

                                            {/* 요약 */}
                                            <p className="text-sm text-slate-400 line-clamp-2">{article.summary}</p>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        {article.viewCount.toLocaleString()}
                                                    </span>
                                                    <span>{article.publishedAt}</span>
                                                </div>
                                                <span className="flex items-center gap-1 text-blue-400 font-medium">
                                                    <Award className="w-3 h-3" />
                                                    +{article.pmpReward} PMP
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
                        <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
