"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Eye, Award, Share2, Bell, BellOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 예산 상세 데이터
const MOCK_BUDGET = {
    id: "budget-n001",
    title: "교육부 2025년 예산",
    ministry: "교육부",
    level: "national",
    levelLabel: "국가 예산",
    totalAmount: 89500, // 억 원
    changePercent: 5.2,
    watcherCount: 3420,
    pmpReward: 25,
    description: "초·중·고 교육과정 개편, 디지털 교육 인프라 확충, 대학 지원 확대를 위한 2025년도 교육부 예산안입니다.",
    breakdown: [
        { category: "초중등 교육", amount: 45200, percent: 50.5, change: 3.2 },
        { category: "고등교육", amount: 18900, percent: 21.1, change: 8.5 },
        { category: "디지털 교육", amount: 12300, percent: 13.7, change: 25.0 },
        { category: "교육복지", amount: 8100, percent: 9.0, change: 2.1 },
        { category: "기타", amount: 5000, percent: 5.6, change: -1.5 },
    ],
    yearlyTrend: [
        { year: 2022, amount: 76800 },
        { year: 2023, amount: 81200 },
        { year: 2024, amount: 85100 },
        { year: 2025, amount: 89500 },
    ],
    issues: [
        { id: 1, title: "디지털 교육 예산 집행률 저조", severity: "warning", reported: 45 },
        { id: 2, title: "지방 교육청 배분 불균형", severity: "critical", reported: 89 },
        { id: 3, title: "학교 급식비 인상분 미반영", severity: "warning", reported: 156 },
    ],
    relatedBudgets: [
        { id: "budget-r002", title: "경기도 교육청 예산" },
        { id: "budget-n003", title: "보건복지부 아동돌봄 예산" },
    ],
};

function formatAmount(amount: number): string {
    if (amount >= 10000) return `${(amount / 10000).toFixed(1)}조`;
    return `${amount.toLocaleString()}억`;
}

export default function BudgetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const level = params?.level as string;
    const budgetId = params?.budgetId as string;

    const [isWatching, setIsWatching] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-950 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-amber-950/80 border-b border-amber-800/50">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="text-sm text-slate-500">
                                <Link href="/forum/budget" className="hover:text-slate-300">Budget</Link>
                                <span className="mx-2">/</span>
                                <Link href={`/forum/budget/${level}`} className="hover:text-slate-300">{MOCK_BUDGET.levelLabel}</Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsWatching(!isWatching)}
                                className={`p-2 rounded-full transition-colors ${isWatching ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10"}`}
                            >
                                {isWatching ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Hero */}
                <div className="aspect-[21/9] bg-gradient-to-br from-amber-900/50 to-slate-900 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-amber-400 text-sm mb-2">{MOCK_BUDGET.ministry}</p>
                        <p className="text-5xl font-bold text-white">{formatAmount(MOCK_BUDGET.totalAmount)}원</p>
                        <p className={`flex items-center justify-center gap-1 mt-2 ${MOCK_BUDGET.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {MOCK_BUDGET.changePercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            전년 대비 {MOCK_BUDGET.changePercent >= 0 ? "+" : ""}{MOCK_BUDGET.changePercent}%
                        </p>
                    </div>
                </div>

                {/* Title & Stats */}
                <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-amber-900/30 text-amber-400 text-sm">{MOCK_BUDGET.levelLabel}</span>
                    <h1 className="text-3xl font-bold text-white">{MOCK_BUDGET.title}</h1>
                    <p className="text-slate-400">{MOCK_BUDGET.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {MOCK_BUDGET.watcherCount.toLocaleString()}명 감시 중
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                            <Award className="w-4 h-4" />
                            분석 시 +{MOCK_BUDGET.pmpReward} PMP
                        </span>
                    </div>
                </div>

                {/* Budget Breakdown */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">예산 항목별 배분</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {MOCK_BUDGET.breakdown.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{item.category}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-medium">{formatAmount(item.amount)}원</span>
                                        <span className={`text-xs ${item.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {item.change >= 0 ? "+" : ""}{item.change}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percent}%` }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Yearly Trend */}
                <Card className="bg-slate-900/70 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">연도별 추이</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-40 gap-4">
                            {MOCK_BUDGET.yearlyTrend.map((year, idx) => {
                                const maxAmount = Math.max(...MOCK_BUDGET.yearlyTrend.map(y => y.amount));
                                const heightPercent = (year.amount / maxAmount) * 100;
                                return (
                                    <div key={year.year} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPercent}%` }}
                                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        />
                                        <span className="text-xs text-slate-400">{year.year}</span>
                                        <span className="text-xs text-white">{formatAmount(year.amount)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Issues */}
                {MOCK_BUDGET.issues.length > 0 && (
                    <Card className="bg-red-900/20 border-red-800/50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                감시 이슈 ({MOCK_BUDGET.issues.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {MOCK_BUDGET.issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${issue.severity === "critical" ? "bg-red-900/30" : "bg-yellow-900/30"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${issue.severity === "critical" ? "bg-red-400" : "bg-yellow-400"}`} />
                                        <span className="text-white">{issue.title}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{issue.reported}명 제보</span>
                                </div>
                            ))}
                            <Button className="w-full mt-4 bg-red-900/50 hover:bg-red-900/70 border border-red-700">
                                이슈 제보하기 (+50 PMP)
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Related Budgets */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">관련 예산</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {MOCK_BUDGET.relatedBudgets.map((related) => (
                            <Link key={related.id} href={`/forum/budget/${level}/${related.id}`}>
                                <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-700/50 transition-all cursor-pointer">
                                    <CardContent className="p-4">
                                        <p className="text-white font-medium">{related.title}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center pt-4">
                    <Link href={`/forum/budget/${level}`} className="text-sm text-slate-500 hover:text-slate-300">
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
