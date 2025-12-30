"use client";

import React, { useState } from "react";
import { PieChart, TrendingUp, TrendingDown, AlertTriangle, Search, Eye, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";

// Mock 예산 데이터 타입
interface BudgetItem {
    id: string;
    title: string;
    description: string;
    level: "national" | "regional" | "local";
    ministry: string;
    amount: number;
    changePercent: number;
    watcherCount: number;
    issueCount: number;
    pmpReward: number;
    isHot?: boolean;
}

// Mock 예산 데이터
const MOCK_BUDGETS: BudgetItem[] = [
    {
        id: "budget-001",
        title: "교육부 2025년 예산",
        description: "초중고 교육과정 개편 및 디지털 교육 인프라 확충 예산",
        level: "national",
        ministry: "교육부",
        amount: 89500,
        changePercent: 5.2,
        watcherCount: 3420,
        issueCount: 12,
        pmpReward: 25,
        isHot: true,
    },
    {
        id: "budget-002",
        title: "국토교통부 SOC 예산",
        description: "도로·철도·항만 등 사회간접자본 투자 예산",
        level: "national",
        ministry: "국토교통부",
        amount: 156000,
        changePercent: -2.1,
        watcherCount: 2810,
        issueCount: 8,
        pmpReward: 30,
    },
    {
        id: "budget-003",
        title: "서울시 복지예산",
        description: "기초생활보장, 노인복지, 아동보육 지원 예산",
        level: "regional",
        ministry: "서울특별시",
        amount: 12500,
        changePercent: 8.5,
        watcherCount: 1560,
        issueCount: 5,
        pmpReward: 20,
        isHot: true,
    },
    {
        id: "budget-004",
        title: "환경부 탄소중립 예산",
        description: "2050 탄소중립 달성을 위한 그린뉴딜 투자 예산",
        level: "national",
        ministry: "환경부",
        amount: 23400,
        changePercent: 15.7,
        watcherCount: 890,
        issueCount: 3,
        pmpReward: 35,
    },
];

// 카테고리 필터
const CATEGORIES = [
    { key: "all", label: "전체" },
    { key: "national", label: "국가" },
    { key: "regional", label: "광역" },
    { key: "local", label: "기초" },
];

function formatAmount(amount: number): string {
    if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
    return `${amount.toLocaleString()}억`;
}

export default function ForumBudgetPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPmpEarned] = useState(320);

    const filteredBudgets = MOCK_BUDGETS.filter((item) => {
        const matchCategory = selectedCategory === "all" || item.level === selectedCategory;
        const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-950 to-slate-950 text-slate-200">
            {/* Header - Consume 스타일 */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-amber-950/80 border-b border-amber-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                                💰 Budget
                            </h1>
                            <p className="text-sm text-amber-400/70">예산 감시 · 재정 투명성</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">내 누적 획득</p>
                            <p className="text-xl font-bold text-amber-400">
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
                            placeholder="예산 항목 또는 부처 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500
                         focus:ring-1 focus:ring-amber-500/50 transition-all"
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
                                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Budget Grid - Consume 카드 스타일 */}
            <main className="max-w-4xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredBudgets.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* 라우팅 수정: /forum/budget/[level]/[budgetId] */}
                                <Link href={`/forum/budget/${item.level}/${item.id}`}>
                                    <Card className="bg-slate-900/70 border-slate-800 hover:border-amber-700/50 transition-all cursor-pointer group overflow-hidden h-full">
                                        {/* 금액 히어로 영역 */}
                                        <div className="relative aspect-video bg-gradient-to-br from-amber-900/50 to-slate-900 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-white">{formatAmount(item.amount)}원</p>
                                                <p className={`flex items-center justify-center gap-1 mt-1 text-sm ${item.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
                                                    }`}>
                                                    {item.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    전년 대비 {item.changePercent >= 0 ? "+" : ""}{item.changePercent}%
                                                </p>
                                            </div>
                                            {item.isHot && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black text-xs font-bold">
                                                    HOT
                                                </span>
                                            )}
                                            {item.issueCount > 0 && (
                                                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500/80 text-white text-xs flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    이슈 {item.issueCount}
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-4 space-y-2">
                                            {/* 수준 & 부처 */}
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className={`px-2 py-0.5 rounded-full ${item.level === "national"
                                                        ? "bg-blue-900/30 text-blue-400"
                                                        : item.level === "regional"
                                                            ? "bg-green-900/30 text-green-400"
                                                            : "bg-purple-900/30 text-purple-400"
                                                    }`}>
                                                    {CATEGORIES.find(c => c.key === item.level)?.label}
                                                </span>
                                                <span>{item.ministry}</span>
                                            </div>

                                            {/* 제목 */}
                                            <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                                                {item.title}
                                            </h3>

                                            {/* 설명 */}
                                            <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        {item.watcherCount.toLocaleString()}명 감시
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1 text-amber-400 font-medium">
                                                    <Award className="w-3 h-3" />
                                                    +{item.pmpReward} PMP
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredBudgets.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
