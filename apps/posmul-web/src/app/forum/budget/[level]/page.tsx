"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { PieChart, TrendingUp, AlertTriangle, Search, ArrowLeft, Eye, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";

// 수준 정보
const LEVEL_INFO: Record<string, { title: string; description: string; color: string }> = {
    national: {
        title: "국가 예산",
        description: "중앙정부 및 국가기관 예산",
        color: "from-blue-500 to-indigo-500"
    },
    regional: {
        title: "광역 예산",
        description: "광역시·도 자치단체 예산",
        color: "from-emerald-500 to-teal-500"
    },
    local: {
        title: "기초 예산",
        description: "시·군·구 자치단체 예산",
        color: "from-orange-500 to-amber-500"
    },
};

// Mock 예산 데이터
const MOCK_BUDGETS = [
    {
        id: "budget-n001",
        title: "교육부 2025년 예산",
        ministry: "교육부",
        level: "national",
        amount: 89500,
        changePercent: 5.2,
        watcherCount: 3420,
        issueCount: 12,
        pmpReward: 25,
    },
    {
        id: "budget-n002",
        title: "국토교통부 SOC 예산",
        ministry: "국토교통부",
        level: "national",
        amount: 156000,
        changePercent: -2.1,
        watcherCount: 2810,
        issueCount: 8,
        pmpReward: 30,
    },
    {
        id: "budget-r001",
        title: "서울시 복지예산",
        ministry: "서울특별시",
        level: "regional",
        amount: 12500,
        changePercent: 8.5,
        watcherCount: 1560,
        issueCount: 5,
        pmpReward: 20,
    },
    {
        id: "budget-r002",
        title: "경기도 교육청 예산",
        ministry: "경기도교육청",
        level: "regional",
        amount: 18700,
        changePercent: 3.2,
        watcherCount: 890,
        issueCount: 3,
        pmpReward: 20,
    },
];

function formatAmount(amount: number): string {
    if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
    return `${amount.toLocaleString()}억`;
}

export default function BudgetLevelPage() {
    const params = useParams();
    const level = params?.level as string;
    const levelInfo = LEVEL_INFO[level] || { title: level, description: "", color: "from-slate-500 to-slate-600" };

    const [searchQuery, setSearchQuery] = useState("");

    const filteredBudgets = MOCK_BUDGETS.filter((budget) => {
        const matchLevel = budget.level === level;
        const matchSearch = budget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            budget.ministry.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLevel && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="border-b border-amber-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Link href="/forum" className="hover:text-slate-300">Forum</Link>
                        <span>/</span>
                        <Link href="/forum/budget" className="hover:text-slate-300">Budget</Link>
                        <span>/</span>
                        <span className="text-slate-300">{levelInfo.title}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/forum/budget" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${levelInfo.color}`}>
                                {levelInfo.title}
                            </h1>
                            <p className="text-sm text-slate-400">{levelInfo.description}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="부처 또는 예산 항목 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 
                         text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                        />
                    </div>
                </div>
            </header>

            {/* Budget List */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {filteredBudgets.map((budget) => (
                            <motion.div
                                key={budget.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Link href={`/forum/budget/${level}/${budget.id}`}>
                                    <Card className="bg-slate-900/70 border-slate-800 hover:border-amber-700/50 transition-all cursor-pointer group h-full">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs text-slate-500">{budget.ministry}</span>
                                                {budget.issueCount > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-xs">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        이슈 {budget.issueCount}
                                                    </span>
                                                )}
                                            </div>
                                            <CardTitle className="text-lg text-white group-hover:text-amber-400 transition-colors">
                                                {budget.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-white">
                                                    {formatAmount(budget.amount)}원
                                                </span>
                                                <span className={`flex items-center gap-1 text-sm font-medium ${budget.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
                                                    }`}>
                                                    <TrendingUp className={`w-4 h-4 ${budget.changePercent < 0 ? "rotate-180" : ""}`} />
                                                    {budget.changePercent >= 0 ? "+" : ""}{budget.changePercent}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {budget.watcherCount.toLocaleString()}명
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400">
                                                    <Award className="w-4 h-4" />
                                                    +{budget.pmpReward} PMP
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
                        <p>해당 수준에 예산 항목이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
