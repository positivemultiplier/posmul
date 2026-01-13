/**
 * FlowDiagram 컴포넌트
 *
 * 사용자의 PMP/PMC 자산 흐름을 시각적으로 표시합니다.
 * 소비 → 예측 → 기부의 흐름을 보여줍니다.
 *
 * user 도메인과 economy 도메인에 걸친 컴포넌트이므로
 * shared/ui/components에 배치합니다.
 */
"use client";

import React from "react";

import { ArrowRight, TrendingUp, Target, Heart, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";

/** 자산 흐름 데이터 */
interface FlowData {
    /** PMP 수입 (소비) */
    pmpEarned: number;
    /** PMP 사용 (베팅) */
    pmpUsed: number;
    /** PMC 획득 (예측 성공) */
    pmcEarned: number;
    /** PMC 사용 (기부) */
    pmcDonated: number;
    /** 현재 PMP 잔액 */
    pmpBalance: number;
    /** 현재 PMC 잔액 */
    pmcBalance: number;
    /** 진행중 베팅 */
    activeBets: number;
    /** 잠긴 PMP */
    lockedPmp: number;
}

/** FlowDiagram Props */
interface FlowDiagramProps {
    /** 자산 흐름 데이터 */
    data: FlowData;
    /** compact 모드 (간략 표시) */
    compact?: boolean;
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
 * 자산 흐름 다이어그램
 *
 * @example
 * ```tsx
 * <FlowDiagram
 *   data={{
 *     pmpEarned: 5000,
 *     pmpUsed: 2000,
 *     pmcEarned: 3000,
 *     pmcDonated: 1500,
 *     pmpBalance: 4600,
 *     pmcBalance: 8000,
 *     activeBets: 3,
 *     lockedPmp: 1200,
 *   }}
 * />
 * ```
 */
export const FlowDiagram: React.FC<FlowDiagramProps> = ({
    data,
    compact = false,
    className = "",
}) => {
    // PMP 순 흐름 (양수: 증가, 음수: 감소)
    const pmpNetFlow = data.pmpEarned - data.pmpUsed;
    // PMC 순 흐름
    const pmcNetFlow = data.pmcEarned - data.pmcDonated;

    if (compact) {
        return (
            <div className={`flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ${className}`}>
                {/* PMP */}
                <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400">PMP</div>
                    <div className="text-lg font-bold text-blue-400">{formatNumber(data.pmpBalance)}</div>
                    <div className={`text-xs flex items-center justify-center gap-1 ${pmpNetFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pmpNetFlow >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatNumber(Math.abs(pmpNetFlow))}
                    </div>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-500" />

                {/* 진행중 베팅 */}
                <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400">진행중</div>
                    <div className="text-lg font-bold text-purple-400">{data.activeBets}</div>
                    <div className="text-xs text-gray-500">{formatNumber(data.lockedPmp)} PMP</div>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-500" />

                {/* PMC */}
                <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400">PMC</div>
                    <div className="text-lg font-bold text-green-400">{formatNumber(data.pmcBalance)}</div>
                    <div className={`text-xs flex items-center justify-center gap-1 ${pmcNetFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pmcNetFlow >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {formatNumber(Math.abs(pmcNetFlow))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm border border-white/10 p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                자산 흐름 (이번 달)
            </h3>

            <div className="grid grid-cols-4 gap-4 items-center">
                {/* 1. 소비 (PMP 획득) */}
                <div className="text-center p-4 rounded-xl bg-white/5 border border-blue-500/20">
                    <ShoppingBag className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400 mb-1">소비</div>
                    <div className="text-xl font-bold text-blue-400">{formatNumber(data.pmpEarned)}</div>
                    <div className="text-xs text-gray-500">+PMP</div>
                </div>

                {/* 화살표 */}
                <div className="text-center">
                    <ArrowRight className="w-8 h-8 text-gray-500 mx-auto" />
                    <div className="text-xs text-gray-500 mt-1">베팅</div>
                </div>

                {/* 2. 예측 (PMP → PMC 전환) */}
                <div className="text-center p-4 rounded-xl bg-white/5 border border-purple-500/20">
                    <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400 mb-1">예측 성공</div>
                    <div className="text-xl font-bold text-purple-400">{formatNumber(data.pmcEarned)}</div>
                    <div className="text-xs text-gray-500">+PMC</div>
                </div>

                {/* 화살표 + 기부 */}
                <div className="text-center p-4 rounded-xl bg-white/5 border border-green-500/20">
                    <Heart className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400 mb-1">기부</div>
                    <div className="text-xl font-bold text-green-400">{formatNumber(data.pmcDonated)}</div>
                    <div className="text-xs text-gray-500">-PMC</div>
                </div>
            </div>

            {/* 잔액 요약 */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-xs text-gray-400">PMP 잔액</div>
                    <div className="text-lg font-bold text-blue-400">{formatNumber(data.pmpBalance)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400">진행중 베팅</div>
                    <div className="text-lg font-bold text-purple-400">{data.activeBets}건</div>
                    <div className="text-xs text-gray-500">({formatNumber(data.lockedPmp)} PMP 잠김)</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400">PMC 잔액</div>
                    <div className="text-lg font-bold text-green-400">{formatNumber(data.pmcBalance)}</div>
                </div>
            </div>
        </div>
    );
};

export default FlowDiagram;
