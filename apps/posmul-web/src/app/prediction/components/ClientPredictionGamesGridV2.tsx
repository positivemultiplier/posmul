/**
 * ClientPredictionGamesGridV2 컴포넌트
 *
 * PredictionCardV2를 사용하는 개선된 예측 게임 그리드입니다.
 * 미니 차트와 Quick Bet 기능을 지원합니다.
 */
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FadeIn } from "../../HomeClientComponents";
import { PredictionCardV2 } from "../../../bounded-contexts/prediction/presentation/components/PredictionCardV2";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";

/** 예측 게임 데이터 */
interface PredictionGame {
    id: string;
    slug: string;
    href?: string;
    title: string;
    description: string;
    category?: string;
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
    /** 트렌드 데이터 (미니 차트용) */
    trendData?: Array<{ value: number; timestamp?: string }>;
}

/** 사용자 예측 정보 */
interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
}

/** Props */
interface ClientPredictionGamesGridV2Props {
    games: PredictionGame[];
    userId?: string;
    userPredictions?: UserPrediction[];
    basePath?: string;
    /** 카드 변형 */
    cardVariant?: "compact" | "detailed" | "minimal";
    /** Quick Bet 표시 여부 */
    showQuickBet?: boolean;
    /** 차트 표시 여부 */
    showChart?: boolean;
    /** 그리드 컬럼 수 (기본: 2) */
    columns?: 1 | 2 | 3;
    /** Quick Bet 핸들러 */
    onQuickBet?: (gameId: string, optionId: string, amount: number) => void;
}

/**
 * 개선된 예측 게임 그리드 (PredictionCardV2 사용)
 */
export function ClientPredictionGamesGridV2({
    games,
    userId,
    userPredictions = [],
    basePath = "/prediction",
    cardVariant = "compact",
    showQuickBet = false,
    showChart = true,
    columns = 2,
    onQuickBet,
}: ClientPredictionGamesGridV2Props) {
    const router = useRouter();

    if (games.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                현재 진행 중인 게임이 없습니다.
            </div>
        );
    }

    // 컬럼 수에 따른 그리드 클래스
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    };

    // 게임 클릭 핸들러
    const handleGameClick = (game: PredictionGame) => {
        const href = game.href ?? `${basePath}/${game.slug}`;
        router.push(href);
    };

    // Quick Bet 핸들러
    const handleQuickBet = (gameId: string, optionId: string, amount: number) => {
        if (onQuickBet) {
            onQuickBet(gameId, optionId, amount);
        }
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-4`}>
            {games.map((game, index) => {
                // 날짜 변환
                const gameData = {
                    id: game.id,
                    title: game.title,
                    description: game.description,
                    category: game.category,
                    predictionType: game.predictionType,
                    options: game.options,
                    startTime: new Date(game.startTime),
                    endTime: new Date(game.endTime),
                    status: game.status,
                    currentParticipants: game.currentParticipants,
                    totalStake: game.totalStake,
                    gameImportanceScore: game.gameImportanceScore,
                    allocatedPrizePool: game.allocatedPrizePool,
                    trendData: game.trendData,
                };

                return (
                    <FadeIn key={game.slug} delay={index * 0.05}>
                        <PredictionCardV2
                            game={gameData}
                            variant={cardVariant}
                            showQuickBet={showQuickBet && game.status === GameStatus.ACTIVE}
                            showChart={showChart}
                            onClick={() => handleGameClick(game)}
                            onQuickBet={(optionId, amount) =>
                                handleQuickBet(game.id, optionId, amount)
                            }
                        />
                    </FadeIn>
                );
            })}
        </div>
    );
}

export default ClientPredictionGamesGridV2;
