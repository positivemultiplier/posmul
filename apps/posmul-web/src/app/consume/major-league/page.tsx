"use client";

import React, { useState, useEffect } from "react";
import { Play, Clock, Gift, Eye, Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// 임시 Mock 데이터 타입
interface AdData {
    id: string;
    title: string;
    advertiserName: string;
    category: string;
    description: string;
    thumbnailUrl?: string;
    durationSeconds: number;
    rewardPmpAmount: number;
    viewCount: number;
    isNew?: boolean;
}

// Mock 광고 데이터
const MOCK_ADS: AdData[] = [
    {
        id: "ad-001",
        title: "친환경 라이프스타일 브랜드 'GreenLife'",
        advertiserName: "GreenLife Korea",
        category: "라이프스타일",
        description: "지속 가능한 미래를 위한 친환경 텀블러. 당신의 작은 선택이 지구를 바꿉니다.",
        durationSeconds: 30,
        rewardPmpAmount: 50,
        viewCount: 12500,
        isNew: true,
    },
    {
        id: "ad-002",
        title: "AI 기반 영어 학습 앱 'SpeakEasy'",
        advertiserName: "EdTech Labs",
        category: "교육",
        description: "1:1 AI 튜터와 함께하는 맞춤형 영어 회화. 하루 10분으로 네이티브처럼!",
        durationSeconds: 45,
        rewardPmpAmount: 75,
        viewCount: 8900,
        isNew: true,
    },
    {
        id: "ad-003",
        title: "프리미엄 구독 서비스 'BookBox'",
        advertiserName: "BookBox Inc.",
        category: "문화",
        description: "매달 큐레이터가 선정한 도서 2권과 독서 굿즈를 집으로 배송해드립니다.",
        durationSeconds: 30,
        rewardPmpAmount: 40,
        viewCount: 5600,
    },
    {
        id: "ad-004",
        title: "건강한 하루, 비타민 정기배송",
        advertiserName: "HealthPill",
        category: "건강",
        description: "개인 맞춤 영양제를 매달 자동 배송. 건강 관리의 새로운 시작.",
        durationSeconds: 25,
        rewardPmpAmount: 35,
        viewCount: 15200,
    },
];

// 카테고리 필터
const CATEGORIES = ["전체", "라이프스타일", "교육", "문화", "건강", "기타"];

export default function MajorLeaguePage() {
    const [ads, setAds] = useState<AdData[]>(MOCK_ADS);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmpEarned] = useState(350); // Mock 누적 획득 PMP

    // 필터링 로직
    const filteredAds = ads.filter((ad) => {
        const matchCategory = selectedCategory === "전체" || ad.category === selectedCategory;
        const matchSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ad.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-indigo-950/80 border-b border-indigo-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                Major League
                            </h1>
                            <p className="text-sm text-indigo-400/70">브랜드 비전 · PMP 획득</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 획득</p>
                            <p className="text-xl font-bold text-indigo-400">
                                <span className="text-2xl">{totalPmpEarned.toLocaleString()}</span>
                                <span className="text-sm ml-1">PMP</span>
                            </p>
                        </div>
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="광고 제목 또는 키워드 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500
                         focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Category Tabs */}
            <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ad List */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {filteredAds.map((ad) => (
                            <motion.div
                                key={ad.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Link href={`/consume/major-league/${ad.id}`}>
                                    <Card className="bg-slate-900/70 border-slate-800 hover:border-indigo-700/50 transition-all group overflow-hidden cursor-pointer">
                                        {/* Thumbnail */}
                                        <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                                            <Play className="w-12 h-12 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                            {ad.isNew && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-bold">
                                                    NEW
                                                </span>
                                            )}
                                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                                                {ad.durationSeconds}초
                                            </span>
                                        </div>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs text-slate-500">{ad.advertiserName}</span>
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-900/40 text-indigo-400 text-xs font-medium">
                                                    <Gift className="w-3 h-3" />
                                                    +{ad.rewardPmpAmount} PMP
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                {ad.title}
                                            </CardTitle>
                                            <p className="text-sm text-slate-400 line-clamp-2">{ad.description}</p>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {ad.viewCount.toLocaleString()}회
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {ad.durationSeconds}초
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
