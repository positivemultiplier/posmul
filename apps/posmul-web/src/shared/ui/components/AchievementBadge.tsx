/**
 * AchievementBadge 컴포넌트
 *
 * 사용자 성과 배지를 표시합니다.
 * 획득/미획득 상태, 희귀도, 진행률을 시각화합니다.
 */
"use client";

import React from "react";

import { Trophy, Lock, Star, Zap, Target, Heart, TrendingUp, Award } from "lucide-react";

/** 배지 희귀도 */
export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** 배지 카테고리 */
export type BadgeCategory = "prediction" | "donation" | "streak" | "social" | "special";

/** 배지 데이터 */
export interface AchievementBadgeData {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeRarity;
    category: BadgeCategory;
    /** 획득 여부 */
    unlocked: boolean;
    /** 획득일시 */
    unlockedAt?: Date;
    /** 진행률 (0-100) */
    progress?: number;
    /** 요구 조건 */
    requirement?: string;
}

/** Props */
interface AchievementBadgeProps {
    /** 배지 데이터 */
    badge: AchievementBadgeData;
    /** 크기 */
    size?: "sm" | "md" | "lg";
    /** 클릭 핸들러 */
    onClick?: (badge: AchievementBadgeData) => void;
    /** 추가 클래스명 */
    className?: string;
}

/** 희귀도별 색상 */
const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string; glow: string }> = {
    common: {
        bg: "from-gray-500/20 to-gray-600/20",
        border: "border-gray-500/30",
        text: "text-gray-400",
        glow: "",
    },
    uncommon: {
        bg: "from-green-500/20 to-emerald-600/20",
        border: "border-green-500/30",
        text: "text-green-400",
        glow: "",
    },
    rare: {
        bg: "from-blue-500/20 to-cyan-600/20",
        border: "border-blue-500/40",
        text: "text-blue-400",
        glow: "shadow-blue-500/20",
    },
    epic: {
        bg: "from-purple-500/20 to-pink-600/20",
        border: "border-purple-500/50",
        text: "text-purple-400",
        glow: "shadow-purple-500/30",
    },
    legendary: {
        bg: "from-yellow-500/20 to-orange-600/20",
        border: "border-yellow-500/60",
        text: "text-yellow-400",
        glow: "shadow-yellow-500/40",
    },
};

/** 희귀도 라벨 */
const RARITY_LABELS: Record<BadgeRarity, string> = {
    common: "일반",
    uncommon: "고급",
    rare: "희귀",
    epic: "영웅",
    legendary: "전설",
};

/** 카테고리별 아이콘 */
const getCategoryIcon = (category: BadgeCategory, className: string) => {
    switch (category) {
        case "prediction":
            return <Target className={className} />;
        case "donation":
            return <Heart className={className} />;
        case "streak":
            return <Zap className={className} />;
        case "social":
            return <Star className={className} />;
        case "special":
            return <Award className={className} />;
        default:
            return <Trophy className={className} />;
    }
};

/**
 * 성과 배지 컴포넌트
 *
 * @example
 * ```tsx
 * <AchievementBadge
 *   badge={{
 *     id: "first-win",
 *     name: "첫 승리",
 *     description: "첫 예측 성공",
 *     icon: "trophy",
 *     rarity: "common",
 *     category: "prediction",
 *     unlocked: true,
 *   }}
 * />
 * ```
 */
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    badge,
    size = "md",
    onClick,
    className = "",
}) => {
    const colors = RARITY_COLORS[badge.rarity];

    // 크기별 스타일
    const sizeStyles = {
        sm: { container: "w-16 h-16", icon: "w-6 h-6", text: "text-xs" },
        md: { container: "w-24 h-24", icon: "w-8 h-8", text: "text-sm" },
        lg: { container: "w-32 h-32", icon: "w-12 h-12", text: "text-base" },
    };

    const styles = sizeStyles[size];

    return (
        <div
            className={`
        relative group cursor-pointer
        ${className}
      `}
            onClick={() => onClick?.(badge)}
        >
            {/* 배지 본체 */}
            <div
                className={`
          ${styles.container} rounded-2xl
          bg-gradient-to-br ${colors.bg}
          border ${colors.border}
          flex flex-col items-center justify-center
          transition-all duration-300
          ${badge.unlocked ? `shadow-lg ${colors.glow}` : "opacity-50 grayscale"}
          ${badge.unlocked ? "hover:scale-110 hover:shadow-xl" : ""}
        `}
            >
                {/* 잠금 오버레이 */}
                {!badge.unlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center z-10">
                        <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                )}

                {/* 아이콘 */}
                <div className={`${colors.text} ${badge.unlocked ? "" : "blur-sm"}`}>
                    {getCategoryIcon(badge.category, styles.icon)}
                </div>

                {/* 희귀도 표시 (전설급만) */}
                {badge.rarity === "legendary" && badge.unlocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                        <Star className="w-3 h-3 text-yellow-900" />
                    </div>
                )}
            </div>

            {/* 진행률 바 (미획득 시) */}
            {!badge.unlocked && badge.progress !== undefined && badge.progress > 0 && (
                <div className="absolute bottom-1 left-1 right-1">
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${badge.progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 툴팁 (호버 시) */}
            <div
                className={`
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity duration-200 z-20
        `}
            >
                <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                    <div className={`font-bold ${styles.text} ${colors.text}`}>{badge.name}</div>
                    <div className="text-xs text-slate-400">{badge.description}</div>
                    <div className={`text-xs ${colors.text} mt-1`}>
                        {RARITY_LABELS[badge.rarity]}
                    </div>
                    {badge.unlockedAt && (
                        <div className="text-xs text-slate-500 mt-1">
                            획득: {badge.unlockedAt.toLocaleDateString("ko-KR")}
                        </div>
                    )}
                    {!badge.unlocked && badge.requirement && (
                        <div className="text-xs text-slate-500 mt-1">
                            조건: {badge.requirement}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AchievementBadge;
