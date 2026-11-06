"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FadeIn } from "../../HomeClientComponents";
import { PredictionGameCard } from "../../../bounded-contexts/prediction/presentation/components/PredictionGameCard";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { Sparkles, Filter, ArrowUpDown } from "lucide-react";

export interface PredictionGame {
    id: string;
    slug: string;
    href?: string;
    title: string;
    description: string;
    predictionType: PredictionType;
    category?: string;
    options: Array<{
        id: string;
        text: string;
        currentOdds: number;
    }>;
    startTime: string | Date;
    endTime: string | Date;
    settlementTime: string | Date;
    minimumStake: number;
    maximumStake: number;
    maxParticipants?: number;
    currentParticipants: number;
    status: GameStatus;
    totalStake: number;
    gameImportanceScore: number;
    allocatedPrizePool: number;
    createdAt: string | Date;
}

export interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
}

export interface ClientPredictionGamesGridProps {
    games: PredictionGame[];
    userId?: string;
    userPredictions?: UserPrediction[];
    basePath?: string;
    /** 대분류 카테고리 칩(전체, 경제, 스포츠 등) 표시 여부 (하위 도메인에서는 false 권장) */
    showCategoryFilter?: boolean;
    /** 정렬 툴바(최신순, 상금 높은순, 마감 임박) 표시 여부 */
    showSortToolbar?: boolean;
    /** 서브마켓 필터(나스닥, 코스피 등) 주입 슬롯 */
    extraFilters?: React.ReactNode;
}

interface CategoryChipItem {
    id: string;
    label: string;
    emoji: string;
    aliases: string[];
}

const CATEGORY_CHIPS: CategoryChipItem[] = [
    { id: "ALL", label: "전체", emoji: "✨", aliases: ["ALL"] },
    { id: "ECONOMY", label: "경제/투자", emoji: "📈", aliases: ["ECONOMY", "INVEST"] },
    { id: "ENTERTAINMENT", label: "엔터테인먼트", emoji: "🎬", aliases: ["ENTERTAINMENT", "CULTURE"] },
    { id: "POLITICS", label: "정치/선거", emoji: "🗳️", aliases: ["POLITICS"] },
    { id: "SPORTS", label: "스포츠", emoji: "⚽", aliases: ["SPORTS"] },
];

const matchesCategory = (gameCategory: string | undefined, chipId: string): boolean => {
    if (chipId === "ALL") return true;
    const cat = gameCategory?.toUpperCase() || "";
    const chip = CATEGORY_CHIPS.find(c => c.id === chipId);
    if (!chip) return false;
    return chip.aliases.includes(cat);
};

export type SortOption = "latest" | "prize_pool" | "closing_soon";

export function ClientPredictionGamesGrid({
    games,
    userId,
    userPredictions = [],
    basePath = "/prediction",
    showCategoryFilter = true,
    showSortToolbar = true,
    extraFilters,
}: ClientPredictionGamesGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<SortOption>("latest");

    // 게임 ID로 사용자 예측 찾기
    const getPredictionForGame = (gameId: string): UserPrediction | undefined => {
        return userPredictions.find(p => p.game_id === gameId && p.is_active);
    };

    // 1단계: 카테고리 필터링
    const filteredGames = useMemo(() => {
        if (!showCategoryFilter) return games;
        return games.filter(game => matchesCategory(game.category, selectedCategory));
    }, [games, showCategoryFilter, selectedCategory]);

    // 2단계: 정렬 적용
    const sortedGames = useMemo(() => {
        const list = [...filteredGames];
        if (sortBy === "prize_pool") {
            return list.sort((a, b) => (b.allocatedPrizePool || 0) - (a.allocatedPrizePool || 0));
        }
        if (sortBy === "closing_soon") {
            const now = Date.now();
            return list.sort((a, b) => {
                const timeA = new Date(a.endTime).getTime();
                const timeB = new Date(b.endTime).getTime();
                // 이미 종료된 게임은 뒤로
                if (timeA < now && timeB >= now) return 1;
                if (timeB < now && timeA >= now) return -1;
                return timeA - timeB;
            });
        }
        // 기본값: 최신순
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [filteredGames, sortBy]);

    return (
        <div className="space-y-5">
            {/* 상단 컨트롤 툴바: 카테고리 칩 + 추가 서브필터 + 정렬 탭 + AI 수집/생성 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                {/* 좌측 영역: 카테고리 칩 또는 커스텀 서브마켓 필터 */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {showCategoryFilter && (
                        <>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold shrink-0">
                                <Filter className="w-3.5 h-3.5 text-blue-400" />
                                <span>카테고리</span>
                            </div>
                            {CATEGORY_CHIPS.map((chip) => {
                                const count = chip.id === "ALL" ? games.length : games.filter(g => matchesCategory(g.category, chip.id)).length;
                                const isSelected = selectedCategory === chip.id;

                                return (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(chip.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                                            isSelected
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/40"
                                                : "bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80"
                                        }`}
                                    >
                                        <span>{chip.emoji}</span>
                                        <span>{chip.label}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                            isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </>
                    )}

                    {extraFilters}
                </div>

                {/* 우측 영역: 정렬 옵션 및 AI 생성 버튼 */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                    {showSortToolbar && (
                        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => setSortBy("latest")}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                    sortBy === "latest"
                                        ? "bg-slate-800 text-white font-bold shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                최신순
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortBy("prize_pool")}
                                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                    sortBy === "prize_pool"
                                        ? "bg-slate-800 text-white font-bold shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <span>상금순</span>
                                <span className="text-[10px]">💰</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortBy("closing_soon")}
                                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                    sortBy === "closing_soon"
                                        ? "bg-slate-800 text-white font-bold shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <span>마감임박</span>
                                <span className="text-[10px]">⏰</span>
                            </button>
                        </div>
                    )}

                    {/* 1-Click AI 뉴스 수집 & 예측 생성 버튼 */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const btn = document.getElementById("ai-ingest-btn");
                                if (btn) btn.innerText = "⏳ 생성 중...";
                                const res = await fetch("/api/cron/feed-ingest");
                                const data = await res.json();
                                if (data.success) {
                                    window.location.reload();
                                } else {
                                    alert("생성 중 오류 발생: " + (data.error || "알 수 없음"));
                                }
                            } catch (err: any) {
                                alert("요청 실패: " + err.message);
                            } finally {
                                const btn = document.getElementById("ai-ingest-btn");
                                if (btn) btn.innerText = "✨ AI 수집 & 생성";
                            }
                        }}
                        id="ai-ingest-btn"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>✨ AI 수집 & 생성</span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {sortedGames.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                    <p className="text-sm font-semibold">진행 중인 예측 게임이 없습니다.</p>
                    <p className="text-xs text-slate-500 mt-1">새로운 예측 게임이 등록되거나 생성될 때까지 잠시 기다려주세요!</p>
                </div>
            ) : (
                /* Pure Card Grid Feed */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sortedGames.map((game, index) => {
                        const myPrediction = getPredictionForGame(game.id);

                        const safeGame = {
                            ...game,
                            id: game.id,
                            startTime: new Date(game.startTime),
                            endTime: new Date(game.endTime),
                            settlementTime: new Date(game.settlementTime),
                            createdAt: new Date(game.createdAt),
                        };

                        return (
                            <FadeIn key={game.slug || game.id} delay={Math.min(index * 0.05, 0.3)}>
                                <Link href={game.href ?? `${basePath}/${game.slug}`} prefetch={true} className="block">
                                    <PredictionGameCard
                                        game={safeGame}
                                        userId={userId}
                                        myPrediction={myPrediction}
                                    />
                                </Link>
                            </FadeIn>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
