"use client";

import React, { useState, useEffect } from "react";
import { Play, Clock, Gift, Eye, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

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

const CATEGORIES = ["전체", "라이프스타일", "교육", "문화", "건강", "기타"];

export default function MajorLeaguePage() {
    const [ads, setAds] = useState<AdData[]>(MOCK_ADS);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmpEarned, setTotalPmpEarned] = useState(350);

    useEffect(() => {
        async function fetchCampaignsAndStats() {
            try {
                const [campaignsRes, statsRes] = await Promise.all([
                    fetch("/api/consume/time/campaigns"),
                    fetch("/api/consume/time/stats"),
                ]);

                if (campaignsRes.ok) {
                    const data = await campaignsRes.json();
                    const list = Array.isArray(data.campaigns) ? data.campaigns : [];
                    if (list.length > 0) {
                        const mapped: AdData[] = list.map((item: Record<string, unknown>) => ({
                            id: String(item.id ?? ""),
                            title: String(item.title ?? "캠페인"),
                            advertiserName: String(item.advertiser_name ?? "파트너 브랜드"),
                            category: String(item.category ?? "라이프스타일"),
                            description: String(item.description ?? ""),
                            thumbnailUrl: typeof item.thumbnail_url === "string" ? item.thumbnail_url : undefined,
                            durationSeconds: Number(item.duration_seconds ?? 30),
                            rewardPmpAmount: Number(item.pmp_reward_full ?? item.pmp_reward ?? 50),
                            viewCount: Number(item.view_count ?? 0),
                            isNew: Boolean(item.canWatch ?? true),
                        }));
                        setAds(mapped);
                    }
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    if (typeof statsData.totalPmpEarned === "number") {
                        setTotalPmpEarned(statsData.totalPmpEarned);
                    }
                }
            } catch {
                // Fallback to MOCK_ADS when offline or unauthenticated
            }
        }
        fetchCampaignsAndStats();
    }, []);

    const filteredAds = ads.filter((ad) => {
        const matchCategory = selectedCategory === "전체" || ad.category === selectedCategory;
        const matchSearch =
            ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ad.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-slate-200">
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

                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                    selectedCategory === cat
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                                        : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {filteredAds.map((ad, index) => (
                            <motion.div
                                key={ad.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="bg-slate-900/70 border-slate-800 hover:border-indigo-700/50 transition-all group overflow-hidden">
                                    <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                                        <div className="text-4xl text-slate-600">🎬</div>
                                        {ad.isNew && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded">
                                                NEW
                                            </span>
                                        )}
                                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {ad.durationSeconds}초
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                                <Play className="w-6 h-6 text-white ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-indigo-400 mb-1">{ad.advertiserName}</p>
                                            <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                                {ad.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                                                {ad.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {ad.viewCount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-indigo-400 font-bold text-sm">
                                                <Gift className="w-4 h-4" />
                                                +{ad.rewardPmpAmount} PMP
                                            </div>
                                        </div>
                                        <Link href={`/consume/major-league/${ad.id}`} className="block">
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                                                시청하고 PMP 받기
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>해당 조건의 광고가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
