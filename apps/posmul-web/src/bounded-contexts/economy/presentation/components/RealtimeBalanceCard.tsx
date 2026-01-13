/**
 * RealtimeBalanceCard 컴포넌트
 *
 * 실시간으로 사용자 잔액을 표시하고 변화를 시각화합니다.
 * Supabase Realtime을 통해 자동 업데이트됩니다.
 */
"use client";

import React, { useEffect, useState } from "react";

import { Wallet, TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff } from "lucide-react";

import { useRealtimeBalance, type BalanceChange } from "../hooks/use-realtime-balance";

/** Props */
interface RealtimeBalanceCardProps {
    /** 사용자 ID */
    userId: string;
    /** 초기 잔액 (SSR) */
    initialBalance?: {
        pmpAvailable?: number;
        pmpLocked?: number;
        pmcAvailable?: number;
        pmcLocked?: number;
    };
    /** 컴팩트 모드 */
    compact?: boolean;
    /** 추가 클래스명 */
    className?: string;
}

/** 숫자 포맷팅 */
const formatBalance = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString("ko-KR");
};

/** 변화 표시 컴포넌트 */
const ChangeIndicator: React.FC<{ change: BalanceChange }> = ({ change }) => {
    const isPositive = change.diff > 0;

    return (
        <div
            className={`
        flex items-center gap-1 text-xs font-medium
        ${isPositive ? "text-green-400" : "text-red-400"}
        animate-pulse
      `}
        >
            {isPositive ? (
                <TrendingUp className="w-3 h-3" />
            ) : (
                <TrendingDown className="w-3 h-3" />
            )}
            <span>
                {isPositive ? "+" : ""}
                {formatBalance(change.diff)}
            </span>
        </div>
    );
};

/**
 * 실시간 잔액 카드
 *
 * @example
 * ```tsx
 * <RealtimeBalanceCard userId={user.id} />
 * ```
 */
export const RealtimeBalanceCard: React.FC<RealtimeBalanceCardProps> = ({
    userId,
    initialBalance,
    compact = false,
    className = "",
}) => {
    const { balance, isConnected, lastChange, refresh, isLoading } = useRealtimeBalance({
        userId,
        initialBalance,
    });

    const [showChange, setShowChange] = useState(false);

    // 변화 시 잠시 표시
    useEffect(() => {
        if (lastChange) {
            setShowChange(true);
            const timer = setTimeout(() => setShowChange(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [lastChange]);

    if (compact) {
        return (
            <div className={`flex items-center gap-4 p-3 bg-white/5 rounded-lg ${className}`}>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">PMP</span>
                    <span className="font-bold text-blue-400">
                        {formatBalance(balance?.pmpAvailable ?? 0)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">PMC</span>
                    <span className="font-bold text-green-400">
                        {formatBalance(balance?.pmcAvailable ?? 0)}
                    </span>
                </div>
                {isConnected ? (
                    <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                    <WifiOff className="w-3 h-3 text-slate-400" />
                )}
            </div>
        );
    }

    return (
        <div
            className={`
        rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border border-white/10 backdrop-blur-sm p-6
        ${className}
      `}
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">내 자산</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            실시간
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                            <WifiOff className="w-3 h-3" />
                            오프라인
                        </span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        aria-label="새로고침"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 잔액 그리드 */}
            <div className="grid grid-cols-2 gap-4">
                {/* PMP Available */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-xs text-slate-400 mb-1">PMP 가용</div>
                    <div className="text-2xl font-bold text-blue-400">
                        {formatBalance(balance?.pmpAvailable ?? 0)}
                    </div>
                    {showChange && lastChange?.field === "pmpAvailable" && (
                        <ChangeIndicator change={lastChange} />
                    )}
                </div>

                {/* PMP Locked */}
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/20">
                    <div className="text-xs text-slate-400 mb-1">PMP 잠김</div>
                    <div className="text-2xl font-bold text-slate-300">
                        {formatBalance(balance?.pmpLocked ?? 0)}
                    </div>
                    {showChange && lastChange?.field === "pmpLocked" && (
                        <ChangeIndicator change={lastChange} />
                    )}
                </div>

                {/* PMC Available */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="text-xs text-slate-400 mb-1">PMC 가용</div>
                    <div className="text-2xl font-bold text-green-400">
                        {formatBalance(balance?.pmcAvailable ?? 0)}
                    </div>
                    {showChange && lastChange?.field === "pmcAvailable" && (
                        <ChangeIndicator change={lastChange} />
                    )}
                </div>

                {/* PMC Locked */}
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/20">
                    <div className="text-xs text-slate-400 mb-1">PMC 잠김</div>
                    <div className="text-2xl font-bold text-slate-300">
                        {formatBalance(balance?.pmcLocked ?? 0)}
                    </div>
                    {showChange && lastChange?.field === "pmcLocked" && (
                        <ChangeIndicator change={lastChange} />
                    )}
                </div>
            </div>

            {/* 마지막 업데이트 시간 */}
            {balance?.lastUpdated && (
                <div className="mt-4 text-xs text-slate-500 text-right">
                    마지막 업데이트: {balance.lastUpdated.toLocaleTimeString("ko-KR")}
                </div>
            )}
        </div>
    );
};

export default RealtimeBalanceCard;
