"use client";

import Link from "next/link";
import { FadeIn } from "../../HomeClientComponents";
import { PredictionGameCard } from "../../../bounded-contexts/prediction/presentation/components/PredictionGameCard";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";

interface PredictionGame {
    id: string;
    slug: string;  // NEW: SEO-friendly identifier
    href?: string;
    title: string;
    description: string;
    predictionType: PredictionType;
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
    basePath?: string; // 예: '/prediction/sports/soccer'
}

export function ClientPredictionGamesGrid({
    games,
    userId,
    userPredictions = [],
    basePath = "/prediction",
}: ClientPredictionGamesGridProps) {
    if (games.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                현재 진행 중인 게임이 없습니다.
            </div>
        );
    }

    // 게임 ID로 사용자 예측 찾기
    const getPredictionForGame = (gameId: string): UserPrediction | undefined => {
        return userPredictions.find(p => p.game_id === gameId && p.is_active);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => {
                const myPrediction = getPredictionForGame(game.id);

                // Ensure dates are Date objects for PredictionGameCard
                const safeGame = {
                    ...game,
                    id: game.id, // Explicitly spread to satisfy TS if needed, though ...game should work
                    startTime: new Date(game.startTime),
                    endTime: new Date(game.endTime),
                    settlementTime: new Date(game.settlementTime),
                    createdAt: new Date(game.createdAt),
                };

                return (
                    <FadeIn key={game.slug} delay={index * 0.1}>
                        <Link href={game.href ?? `${basePath}/${game.slug}`} className="block">
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
    );
}
