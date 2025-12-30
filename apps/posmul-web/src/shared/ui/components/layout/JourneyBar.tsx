"use client";

import React from "react";
import Link from "next/link";
import { Coins, ArrowRight, Target, Gift, Tv, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface JourneyBarProps {
    pmpBalance?: number;
    pmcBalance?: number;
    hasActivePredictions?: boolean;
    className?: string;
}

// 다음 액션 결정 로직
function getSuggestedAction(
    pmpBalance: number,
    pmcBalance: number,
    hasActivePredictions: boolean
): { label: string; href: string; icon: React.ReactNode; color: string } {
    // 1. PMP가 있고 진행 중 예측이 없으면 → 예측 제안
    if (pmpBalance > 0 && !hasActivePredictions) {
        return {
            label: "예측하기",
            href: "/prediction",
            icon: <Target className="w-4 h-4" />,
            color: "from-blue-500 to-cyan-500",
        };
    }

    // 2. PMC가 100 이상 있으면 → 기부 제안
    if (pmcBalance >= 100) {
        return {
            label: "기부하기",
            href: "/donation",
            icon: <Gift className="w-4 h-4" />,
            color: "from-purple-500 to-pink-500",
        };
    }

    // 3. 둘 다 부족하면 → Earn 제안
    return {
        label: "포인트 획득",
        href: "/consume",
        icon: <Tv className="w-4 h-4" />,
        color: "from-indigo-500 to-purple-500",
    };
}

/**
 * Journey Bar
 *
 * 사용자의 PMP/PMC 잔액과 다음 추천 액션을 표시하는 상단 위젯.
 * User Flow UX 개선을 위해 모든 페이지 상단에 표시됩니다.
 */
export function JourneyBar({
    pmpBalance = 0,
    pmcBalance = 0,
    hasActivePredictions = false,
    className = "",
}: JourneyBarProps) {
    const nextAction = getSuggestedAction(pmpBalance, pmcBalance, hasActivePredictions);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 ${className}`}
        >
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex items-center justify-between gap-4">
                    {/* 잔액 섹션 */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* PMP 잔액 */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <Coins className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">PMP</span>
                                <span className="text-sm font-bold text-white">
                                    {pmpBalance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div className="h-8 w-px bg-slate-700" />

                        {/* PMC 잔액 */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">PMC</span>
                                <span className="text-sm font-bold text-white">
                                    {pmcBalance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 다음 액션 버튼 */}
                    <Link href={nextAction.href}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${nextAction.color} text-white text-sm font-medium shadow-lg transition-all group`}
                        >
                            {nextAction.icon}
                            <span className="hidden sm:inline">{nextAction.label}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default JourneyBar;
