"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Clock, Eye, Award, Search, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";

// 카테고리 정보
const CATEGORY_INFO: Record<string, { title: string; description: string; color: string }> = {
    policy: {
        title: "정책·법률",
        description: "법률 개정, 정책 변화, 입법 동향",
        color: "from-blue-500 to-indigo-500"
    },
    economy: {
        title: "경제·재정",
        description: "경제 정책, 세제 변화, 재정 동향",
        color: "from-emerald-500 to-teal-500"
    },
    society: {
        title: "사회·복지",
        description: "복지 정책, 사회 이슈, 공공 서비스",
        color: "from-orange-500 to-amber-500"
    },
    local: {
        title: "지역·생활",
        description: "지역 뉴스, 생활 밀접 정보",
        color: "from-purple-500 to-pink-500"
    },
};

// Mock 기사 데이터
const MOCK_ARTICLES = [
    {
        id: "news-p001",
        title: "2025년 주요 법률 개정안 10가지",
        summary: "올해 시행되는 주요 법률 개정안을 정리했습니다. 노동법, 세법, 환경법 등 다양한 분야의 변화를 확인하세요.",
        category: "policy",
        source: "법률저널",
        publishedAt: "2024-12-30",
        readTime: 8,
        viewCount: 15600,
        pmpReward: 25,
        hasQuiz: true,
        thumbnailUrl: "/images/news/law-2025.jpg",
    },
    {
        id: "news-p002",
        title: "디지털 플랫폼 공정거래법 해설",
        summary: "대형 플랫폼 규제를 위한 새 법안의 핵심 내용과 산업계 영향을 분석합니다.",
        category: "policy",
        source: "공정거래위원회",
        publishedAt: "2024-12-28",
        readTime: 6,
        viewCount: 8900,
        pmpReward: 20,
        hasQuiz: true,
        thumbnailUrl: "/images/news/platform-law.jpg",
    },
    {
        id: "news-e001",
        title: "2025년 세제 개편안 핵심 정리",
        summary: "소득세, 법인세, 부가가치세 등 주요 세목별 변화와 납세자 영향을 정리합니다.",
        category: "economy",
        source: "기획재정부",
        publishedAt: "2024-12-29",
        readTime: 10,
        viewCount: 22100,
        pmpReward: 30,
        hasQuiz: true,
        thumbnailUrl: "/images/news/tax-2025.jpg",
    },
    {
        id: "news-s001",
        title: "기초연금 인상, 어떻게 달라지나",
        summary: "2025년부터 적용되는 기초연금 인상안의 상세 내용과 신청 방법을 안내합니다.",
        category: "society",
        source: "보건복지부",
        publishedAt: "2024-12-27",
        readTime: 5,
        viewCount: 31200,
        pmpReward: 15,
        hasQuiz: true,
        thumbnailUrl: "/images/news/pension.jpg",
    },
];

export default function NewsCategoryPage() {
    const params = useParams();
    const category = params?.category as string;
    const categoryInfo = CATEGORY_INFO[category] || { title: category, description: "", color: "from-slate-500 to-slate-600" };

    const [searchQuery, setSearchQuery] = useState("");

    // 해당 카테고리 기사 필터링
    const filteredArticles = MOCK_ARTICLES.filter((article) => {
        const matchCategory = article.category === category;
        const matchSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="border-b border-slate-800">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Link href="/forum" className="hover:text-slate-300">Forum</Link>
                        <span>/</span>
                        <Link href="/forum/news" className="hover:text-slate-300">News</Link>
                        <span>/</span>
                        <span className="text-slate-300">{categoryInfo.title}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/forum/news" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${categoryInfo.color}`}>
                                {categoryInfo.title}
                            </h1>
                            <p className="text-sm text-slate-400">{categoryInfo.description}</p>
                        </div>
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="기사 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Article List */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredArticles.map((article) => (
                            <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Link href={`/forum/news/${category}/${article.id}`}>
                                    <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-700/50 transition-all cursor-pointer group overflow-hidden">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Thumbnail */}
                                            <div className="w-full md:w-48 h-32 bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500">
                                                📰
                                            </div>
                                            <div className="flex-1">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{article.source}</span>
                                                        <span>·</span>
                                                        <span>{article.publishedAt}</span>
                                                    </div>
                                                    <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                                                        {article.title}
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-400 line-clamp-2">{article.summary}</p>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {article.readTime}분
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            {article.viewCount.toLocaleString()}
                                                        </span>
                                                        {article.hasQuiz && (
                                                            <span className="flex items-center gap-1 text-yellow-400">
                                                                <Award className="w-4 h-4" />
                                                                +{article.pmpReward} PMP
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredArticles.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <p>해당 카테고리에 기사가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
