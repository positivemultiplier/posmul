"use client";

import { useState } from "react";
import Link from "next/link";
import { FadeIn } from "../../HomeClientComponents";
import { PredictionGameCard } from "../../../bounded-contexts/prediction/presentation/components/PredictionGameCard";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { Activity, Vote, Film, TrendingUp, Sparkles, Filter } from "lucide-react";

interface PredictionGame {
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

interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
}

interface ClientPredictionGamesGridProps {
    games: PredictionGame[];
    userId?: string;
    userPredictions?: UserPrediction[];
    basePath?: string;
}

const CATEGORY_CHIPS = [
    { id: "ALL", label: "전체", emoji: "✨", icon: Sparkles },
    { id: "SPORTS", label: "스포츠", emoji: "⚽", icon: Activity },
    { id: "POLITICS", label: "정치/선거", emoji: "🗳️", icon: Vote },
    { id: "INVEST", label: "투자/경제", emoji: "📈", icon: TrendingUp },
    { id: "ENTERTAINMENT", label: "엔터테인먼트", emoji: "🎬", icon: Film },
];

export function ClientPredictionGamesGrid({
    games,
    userId,
    userPredictions = [],
    basePath = "/prediction",
}: ClientPredictionGamesGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // 게임 ID로 사용자 예측 찾기
    const getPredictionForGame = (gameId: string): UserPrediction | undefined => {
        return userPredictions.find(p => p.game_id === gameId && p.is_active);
    };

    // 카테고리 필터링
    const filteredGames = games.filter(game => {
        if (selectedCategory === "ALL") return true;
        return game.category?.toUpperCase() === selectedCategory;
    });

    return (
        <div className="space-y-6">
            {/* Sleek Horizontal Category Chips & AI Auto Generator Button */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold shrink-0">
                        <Filter className="w-3.5 h-3.5 text-blue-400" />
                        <span>카테고리</span>
                    </div>
                    {CATEGORY_CHIPS.map((chip) => {
                        const count = chip.id === "ALL" 
                            ? games.length 
                            : games.filter(g => g.category?.toUpperCase() === chip.id).length;

                        const isSelected = selectedCategory === chip.id;

                        return (
                            <button
                                key={chip.id}
                                onClick={() => setSelectedCategory(chip.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                                    isSelected
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40"
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
                </div>

                {/* 1-Click AI 뉴스 수집 & 예측 생성 버튼 */}
                <button
                    onClick={async () => {
                        try {
                            const btn = document.getElementById("ai-ingest-btn");
                            if (btn) btn.innerText = "⏳ AI 뉴스로 생성 중...";
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
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>✨ AI 수집 & 생성</span>
                </button>
            </div>

            {/* Empty State */}
            {filteredGames.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                    <p className="text-sm font-semibold">선택하신 카테고리에 진행 중인 예측 게임이 없습니다.</p>
                    <p className="text-xs text-slate-500 mt-1">다른 카테고리를 선택하거나 새로운 예측을 제안해보세요!</p>
                </div>
            ) : (
                /* Pure Card Grid Feed */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredGames.map((game, index) => {
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
