/**
 * YourFlowWidget 컴포넌트
 *
 * 사용자의 자산 흐름(PMP 획득 → 베팅 → PMC 기부)을 시각화합니다.
 * user 도메인과 economy 도메인이 혼합되므로 shared에 배치합니다.
 */
"use client";

import React from "react";

import Link from "next/link";
import { ArrowRight, TrendingUp, Target, Heart } from "lucide-react";

/** 사용자 자산 정보 */
interface UserFlowData {
    /** PMP 가용 잔액 */
    pmpBalance: number;
    /** 진행중인 베팅 수 */
    activeBets: number;
    /** 총 베팅 PMP */
    lockedPmp: number;
    /** 누적 기부 PMC */
    totalDonated: number;
}

/** YourFlowWidget Props */
interface YourFlowWidgetProps {
    /** 사용자 자산 데이터 */
    data: UserFlowData;
    /** 추가 클래스명 */
    className?: string;
}

/** 숫자 포맷팅 */
const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString("ko-KR");
};

/**
 * 사용자 자산 흐름 시각화 위젯
 *
 * @example
 * ```tsx
 * <YourFlowWidget
 *   data={{
 *     pmpBalance: 4600,
 *     activeBets: 3,
 *     lockedPmp: 1200,
 *     totalDonated: 12000,
 *   }}
 * />
 * ```
 */
export const YourFlowWidget: React.FC<YourFlowWidgetProps> = ({
    data,
    className = "",
}) => {
    return (
        <div
            className={`rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm border border-white/10 p-6 ${className}`}
        >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                나의 자산 흐름
            </h3>

            <div className="flex items-center justify-between gap-4">
                {/* PMP 잔액 */}
                <Link
                    href="/dashboard"
                    className="flex-1 text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                    <div className="text-2xl font-bold text-blue-400 tabular-nums">
                        {formatNumber(data.pmpBalance)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">PMP 잔액</div>
                </Link>

                <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0" />

                {/* 진행중 베팅 */}
                <Link
                    href="/dashboard?tab=predictions"
                    className="flex-1 text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                    <div className="flex items-center justify-center gap-1">
                        <Target className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-purple-400">
                            {data.activeBets}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        게임 참여중
                        <span className="block text-purple-400/70">
                            ({formatNumber(data.lockedPmp)} PMP)
                        </span>
                    </div>
                </Link>

                <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0" />

                {/* 기부 */}
                <Link
                    href="/donation"
                    className="flex-1 text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                    <div className="flex items-center justify-center gap-1">
                        <Heart className="w-5 h-5 text-green-400" />
                        <span className="text-2xl font-bold text-green-400 tabular-nums">
                            {formatNumber(data.totalDonated)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">누적 기부 PMC</div>
                </Link>
            </div>
        </div>
    );
};

export default YourFlowWidget;
