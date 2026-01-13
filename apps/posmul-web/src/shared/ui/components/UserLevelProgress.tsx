/**
 * UserLevelProgress 컴포넌트
 *
 * 사용자 레벨 및 경험치 진행 상황을 표시합니다.
 * 레벨업 애니메이션과 다음 레벨까지의 진행률을 시각화합니다.
 */
"use client";

import React, { useEffect, useState } from "react";

import { Sparkles, TrendingUp, Star, Zap } from "lucide-react";

/** 레벨 데이터 */
export interface LevelData {
    currentLevel: number;
    currentXP: number;
    nextLevelXP: number;
    totalXP: number;
    levelName: string;
    /** 레벨 아이콘/이모지 */
    icon?: string;
}

/** Props */
interface UserLevelProgressProps {
    /** 레벨 데이터 */
    level: LevelData;
    /** 최근 획득 XP (애니메이션용) */
    recentXPGain?: number;
    /** 컴팩트 모드 */
    compact?: boolean;
    /** 추가 클래스명 */
    className?: string;
}

/** 레벨별 색상 */
const getLevelColor = (level: number): { from: string; to: string; text: string } => {
    if (level >= 50) {
        return { from: "from-yellow-400", to: "to-orange-500", text: "text-yellow-400" };
    }
    if (level >= 30) {
        return { from: "from-purple-400", to: "to-pink-500", text: "text-purple-400" };
    }
    if (level >= 20) {
        return { from: "from-blue-400", to: "to-cyan-500", text: "text-blue-400" };
    }
    if (level >= 10) {
        return { from: "from-green-400", to: "to-emerald-500", text: "text-green-400" };
    }
    return { from: "from-slate-400", to: "to-slate-500", text: "text-slate-400" };
};

/** 숫자 포맷 */
const formatXP = (xp: number): string => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toLocaleString("ko-KR");
};

/**
 * 사용자 레벨 진행 컴포넌트
 *
 * @example
 * ```tsx
 * <UserLevelProgress
 *   level={{
 *     currentLevel: 15,
 *     currentXP: 2500,
 *     nextLevelXP: 3000,
 *     totalXP: 15000,
 *     levelName: "예측가",
 *   }}
 * />
 * ```
 */
export const UserLevelProgress: React.FC<UserLevelProgressProps> = ({
    level,
    recentXPGain,
    compact = false,
    className = "",
}) => {
    const [showXPGain, setShowXPGain] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    const progress = (level.currentXP / level.nextLevelXP) * 100;
    const colors = getLevelColor(level.currentLevel);

    // 진행률 애니메이션
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [progress]);

    // XP 획득 애니메이션
    useEffect(() => {
        if (recentXPGain && recentXPGain > 0) {
            setShowXPGain(true);
            const timer = setTimeout(() => setShowXPGain(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [recentXPGain]);

    if (compact) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {/* 레벨 뱃지 */}
                <div
                    className={`
            w-10 h-10 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to}
            flex items-center justify-center shadow-lg
          `}
                >
                    <span className="text-white font-bold text-sm">{level.currentLevel}</span>
                </div>

                {/* 진행 바 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${colors.text}`}>
                            {level.levelName}
                        </span>
                        <span className="text-xs text-slate-400">
                            {formatXP(level.currentXP)}/{formatXP(level.nextLevelXP)}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-700 ease-out`}
                            style={{ width: `${animatedProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
        rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border border-white/10 backdrop-blur-sm p-6 relative overflow-hidden
        ${className}
      `}
        >
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

            {/* XP 획득 애니메이션 */}
            {showXPGain && recentXPGain && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-green-400 animate-bounce">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-bold">+{formatXP(recentXPGain)} XP</span>
                </div>
            )}

            {/* 상단: 레벨 정보 */}
            <div className="flex items-center gap-4 mb-6">
                {/* 레벨 뱃지 */}
                <div
                    className={`
            w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to}
            flex items-center justify-center shadow-xl relative
          `}
                >
                    <span className="text-white font-bold text-2xl">{level.currentLevel}</span>
                    {level.currentLevel >= 50 && (
                        <div className="absolute -top-1 -right-1">
                            <Star className="w-5 h-5 text-yellow-300 animate-pulse" />
                        </div>
                    )}
                </div>

                <div>
                    <div className={`font-bold text-lg ${colors.text}`}>
                        {level.levelName}
                    </div>
                    <div className="text-sm text-slate-400">
                        Lv.{level.currentLevel}
                    </div>
                </div>
            </div>

            {/* 중앙: 진행 바 */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">경험치</span>
                    <span className="text-sm font-medium text-white">
                        {formatXP(level.currentXP)} / {formatXP(level.nextLevelXP)} XP
                    </span>
                </div>
                <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden relative">
                    <div
                        className={`
              h-full bg-gradient-to-r ${colors.from} ${colors.to}
              rounded-full transition-all duration-1000 ease-out
              relative
            `}
                        style={{ width: `${animatedProgress}%` }}
                    >
                        {/* 빛나는 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                    {/* 진행률 퍼센티지 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* 하단: 다음 레벨까지 */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-slate-400">
                    <Zap className="w-4 h-4" />
                    <span>다음 레벨까지</span>
                </div>
                <span className="font-medium text-white">
                    {formatXP(level.nextLevelXP - level.currentXP)} XP
                </span>
            </div>

            {/* 총 경험치 */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    총 경험치
                </span>
                <span>{formatXP(level.totalXP)} XP</span>
            </div>
        </div>
    );
};

export default UserLevelProgress;
