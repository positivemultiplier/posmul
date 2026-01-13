/**
 * LeaderboardCard 컴포넌트
 *
 * 예측 성공률, 기부액 등 분야별 리더보드를 표시합니다.
 * 슬라이딩 순위 변화 애니메이션을 지원합니다.
 */
"use client";

import React from "react";

import { Crown, TrendingUp, TrendingDown, Minus, Medal, Trophy, Users } from "lucide-react";

/** 리더보드 타입 */
export type LeaderboardType = "prediction" | "donation" | "contribution" | "streak";

/** 리더 데이터 */
export interface LeaderEntry {
    rank: number;
    userId: string;
    username: string;
    avatar?: string;
    score: number;
    previousRank?: number;
    /** 추가 정보 (예: 성공률, 연속 일수) */
    metadata?: Record<string, string | number>;
}

/** Props */
interface LeaderboardCardProps {
    /** 리더보드 타입 */
    type: LeaderboardType;
    /** 제목 */
    title: string;
    /** 리더 목록 (상위 10명) */
    leaders: LeaderEntry[];
    /** 현재 사용자 ID (하이라이트용) */
    currentUserId?: string;
    /** 현재 사용자 순위 (상위 10위 밖인 경우) */
    currentUserRank?: LeaderEntry;
    /** 로딩 상태 */
    isLoading?: boolean;
    /** 추가 클래스명 */
    className?: string;
}

/** 타입별 점수 단위 */
const SCORE_UNITS: Record<LeaderboardType, string> = {
    prediction: "%",
    donation: "PMC",
    contribution: "점",
    streak: "일",
};

/** 타입별 아이콘 */
const TYPE_ICONS: Record<LeaderboardType, React.ReactNode> = {
    prediction: <Trophy className="w-5 h-5" />,
    donation: <Medal className="w-5 h-5" />,
    contribution: <Users className="w-5 h-5" />,
    streak: <TrendingUp className="w-5 h-5" />,
};

/** 순위 변화 표시 */
const RankChange: React.FC<{ current: number; previous?: number }> = ({ current, previous }) => {
    if (previous === undefined) return null;

    const diff = previous - current;

    if (diff > 0) {
        return (
            <span className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                {diff}
            </span>
        );
    }

    if (diff < 0) {
        return (
            <span className="flex items-center text-xs text-red-400">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {Math.abs(diff)}
            </span>
        );
    }

    return (
        <span className="flex items-center text-xs text-slate-500">
            <Minus className="w-3 h-3" />
        </span>
    );
};

/** 순위 표시 (1-3위 특별 스타일) */
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Crown className="w-4 h-4 text-white" />
            </div>
        );
    }

    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/20">
                <span className="text-sm font-bold text-slate-700">2</span>
            </div>
        );
    }

    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20">
                <span className="text-sm font-bold text-white">3</span>
            </div>
        );
    }

    return (
        <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-400">{rank}</span>
        </div>
    );
};

/** 점수 포맷 */
const formatScore = (score: number, type: LeaderboardType): string => {
    if (type === "donation" && score >= 1000) {
        return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toLocaleString("ko-KR");
};

/**
 * 리더보드 카드
 *
 * @example
 * ```tsx
 * <LeaderboardCard
 *   type="prediction"
 *   title="예측 성공률 TOP 10"
 *   leaders={leaders}
 *   currentUserId={user.id}
 * />
 * ```
 */
export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
    type,
    title,
    leaders,
    currentUserId,
    currentUserRank,
    isLoading = false,
    className = "",
}) => {
    return (
        <div
            className={`
        rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border border-white/10 backdrop-blur-sm overflow-hidden
        ${className}
      `}
        >
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                    {TYPE_ICONS[type]}
                </div>
                <h3 className="font-bold text-white">{title}</h3>
            </div>

            {/* 리더 목록 */}
            <div className="p-4 space-y-2">
                {isLoading ? (
                    // 스켈레톤
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-slate-700" />
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-slate-700 rounded" />
                            </div>
                            <div className="h-4 w-12 bg-slate-700 rounded" />
                        </div>
                    ))
                ) : (
                    leaders.map((leader, index) => {
                        const isCurrentUser = leader.userId === currentUserId;

                        return (
                            <div
                                key={leader.userId}
                                className={`
                  flex items-center gap-3 p-2 rounded-xl transition-all duration-200
                  ${isCurrentUser
                                        ? "bg-blue-500/10 border border-blue-500/30"
                                        : "hover:bg-white/5"
                                    }
                `}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                {/* 순위 */}
                                <RankBadge rank={leader.rank} />

                                {/* 아바타 + 이름 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {leader.avatar ? (
                                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs">
                                                {leader.avatar}
                                            </div>
                                        ) : null}
                                        <span
                                            className={`font-medium truncate ${isCurrentUser ? "text-blue-400" : "text-white"
                                                }`}
                                        >
                                            {leader.username}
                                            {isCurrentUser && (
                                                <span className="ml-1 text-xs text-blue-400">(나)</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* 순위 변화 */}
                                <RankChange current={leader.rank} previous={leader.previousRank} />

                                {/* 점수 */}
                                <div className="text-right">
                                    <span className="font-bold text-white">
                                        {formatScore(leader.score, type)}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-0.5">
                                        {SCORE_UNITS[type]}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 현재 사용자 순위 (10위 밖) */}
            {currentUserRank && currentUserRank.rank > 10 && (
                <div className="border-t border-white/10 px-4 py-3">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <RankBadge rank={currentUserRank.rank} />
                        <div className="flex-1">
                            <span className="font-medium text-blue-400">
                                {currentUserRank.username} (나)
                            </span>
                        </div>
                        <span className="font-bold text-white">
                            {formatScore(currentUserRank.score, type)}
                            <span className="text-xs text-slate-400 ml-0.5">
                                {SCORE_UNITS[type]}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardCard;
