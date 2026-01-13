/**
 * MoneyWaveStatusWidget 컴포넌트
 *
 * MoneyWave 1-2-3 단계의 현재 상태와 다음 분배까지의 시간을 표시합니다.
 * 사용자의 참여 자격 및 예상 수령액을 시각화합니다.
 */
"use client";

import React, { useEffect, useState } from "react";

import { Waves, Clock, Users, TrendingUp, CheckCircle, Circle, Sparkles } from "lucide-react";

/** Wave 상태 */
export type WaveStatus = "pending" | "active" | "completed" | "locked";

/** Wave 데이터 */
export interface WaveData {
    wave: 1 | 2 | 3;
    status: WaveStatus;
    /** 사용자 자격 여부 */
    eligible: boolean;
    /** 예상 수령액 */
    estimatedAmount?: number;
    /** 참여자 수 */
    participantCount: number;
    /** 총 분배액 */
    totalDistribution: number;
}

/** Props */
interface MoneyWaveStatusWidgetProps {
    /** Wave 1-2-3 데이터 */
    waves: WaveData[];
    /** 다음 분배까지 남은 시간 (초) */
    nextDistributionIn: number;
    /** 컴팩트 모드 */
    compact?: boolean;
    /** 추가 클래스명 */
    className?: string;
}

/** Wave 색상 */
const WAVE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
    1: {
        bg: "from-blue-500/20 to-cyan-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
    },
    2: {
        bg: "from-purple-500/20 to-pink-500/20",
        text: "text-purple-400",
        border: "border-purple-500/30",
    },
    3: {
        bg: "from-yellow-500/20 to-orange-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
    },
};

/** Wave 설명 */
const WAVE_DESCRIPTIONS: Record<number, string> = {
    1: "전체 활성 사용자",
    2: "활동 점수 비례",
    3: "핵심 기여자 보상",
};

/** 숫자 포맷 */
const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString("ko-KR");
};

/** 시간 포맷 */
const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
};

/** 상태 아이콘 */
const StatusIcon: React.FC<{ status: WaveStatus; eligible: boolean }> = ({ status, eligible }) => {
    if (status === "completed") {
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    if (status === "active") {
        return <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />;
    }
    if (!eligible) {
        return <Circle className="w-4 h-4 text-slate-500" />;
    }
    return <Circle className="w-4 h-4 text-slate-400" />;
};

/**
 * MoneyWave 상태 위젯
 *
 * @example
 * ```tsx
 * <MoneyWaveStatusWidget
 *   waves={[
 *     { wave: 1, status: "completed", eligible: true, ... },
 *     { wave: 2, status: "active", eligible: true, ... },
 *     { wave: 3, status: "pending", eligible: false, ... },
 *   ]}
 *   nextDistributionIn={3600}
 * />
 * ```
 */
export const MoneyWaveStatusWidget: React.FC<MoneyWaveStatusWidgetProps> = ({
    waves,
    nextDistributionIn,
    compact = false,
    className = "",
}) => {
    const [countdown, setCountdown] = useState(nextDistributionIn);

    // 카운트다운
    useEffect(() => {
        setCountdown(nextDistributionIn);
        const timer = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [nextDistributionIn]);

    // 총 예상 수령액
    const totalEstimated = waves
        .filter((w) => w.eligible)
        .reduce((sum, w) => sum + (w.estimatedAmount || 0), 0);

    if (compact) {
        return (
            <div className={`flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 ${className}`}>
                <Waves className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                    <div className="text-sm text-white font-medium">MoneyWave</div>
                    <div className="text-xs text-slate-400">
                        다음 분배까지 {formatTime(countdown)}
                    </div>
                </div>
                {totalEstimated > 0 && (
                    <div className="text-right">
                        <div className="text-sm font-bold text-green-400">
                            +{formatNumber(totalEstimated)} PMC
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`
        rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border border-white/10 backdrop-blur-sm overflow-hidden
        ${className}
      `}
        >
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <Waves className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">MoneyWave 현황</h3>
                        <p className="text-xs text-slate-400">PMC 분배 시스템</p>
                    </div>
                </div>

                {/* 카운트다운 */}
                <div className="text-right">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3 h-3" />
                        다음 분배
                    </div>
                    <div className="font-bold text-white">{formatTime(countdown)}</div>
                </div>
            </div>

            {/* Wave 목록 */}
            <div className="p-4 space-y-3">
                {waves.map((wave) => {
                    const colors = WAVE_COLORS[wave.wave];

                    return (
                        <div
                            key={wave.wave}
                            className={`
                p-4 rounded-xl bg-gradient-to-r ${colors.bg}
                border ${colors.border}
                ${!wave.eligible ? "opacity-50" : ""}
              `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <StatusIcon status={wave.status} eligible={wave.eligible} />
                                    <span className={`font-bold ${colors.text}`}>
                                        Wave {wave.wave}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {WAVE_DESCRIPTIONS[wave.wave]}
                                    </span>
                                </div>
                                {wave.eligible && wave.estimatedAmount !== undefined && (
                                    <span className="font-bold text-green-400">
                                        +{formatNumber(wave.estimatedAmount)} PMC
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {formatNumber(wave.participantCount)}명 참여
                                </span>
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    총 {formatNumber(wave.totalDistribution)} PMC
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 총 예상 수령액 */}
            {totalEstimated > 0 && (
                <div className="px-5 py-4 border-t border-white/10 bg-green-500/5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">예상 총 수령액</span>
                        <span className="text-xl font-bold text-green-400">
                            +{formatNumber(totalEstimated)} PMC
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyWaveStatusWidget;
