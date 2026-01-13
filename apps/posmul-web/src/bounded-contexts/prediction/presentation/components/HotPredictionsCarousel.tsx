/**
 * HotPredictionsCarousel 컴포넌트
 *
 * 인기 예측 게임을 가로 스크롤 캐러셀로 표시합니다.
 * prediction 도메인 UI이므로 domain/presentation에 배치합니다.
 */
"use client";

import React, { useRef } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../../../../shared/ui/components/base";
import { PredictionCardV2 } from "./PredictionCardV2";
import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";

/** 예측 게임 요약 데이터 */
interface HotPredictionGame {
    id: string;
    title: string;
    description: string;
    category?: string;
    predictionType: PredictionType;
    options: Array<{
        id: string;
        text: string;
        currentOdds: number;
    }>;
    startTime: Date;
    endTime: Date;
    status: GameStatus;
    currentParticipants: number;
    totalStake: number;
    gameImportanceScore: number;
    allocatedPrizePool: number;
    trendData?: Array<{ value: number; timestamp?: string }>;
}

/** HotPredictionsCarousel Props */
interface HotPredictionsCarouselProps {
    /** 예측 게임 목록 */
    games: HotPredictionGame[];
    /** 제목 */
    title?: string;
    /** 카드 클릭 핸들러 */
    onCardClick?: (gameId: string) => void;
    /** 추가 클래스명 */
    className?: string;
}

/**
 * 인기 예측 게임 가로 스크롤 캐러셀
 *
 * @example
 * ```tsx
 * <HotPredictionsCarousel
 *   games={hotGames}
 *   title="🔥 인기 예측"
 *   onCardClick={(id) => router.push(`/prediction/${id}`)}
 * />
 * ```
 */
export const HotPredictionsCarousel: React.FC<HotPredictionsCarouselProps> = ({
    games,
    title = "🔥 인기 예측",
    onCardClick,
    className = "",
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // 스크롤 핸들러
    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 320; // 카드 너비 + 간격
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (!games || games.length === 0) {
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
                        onClick={() => scroll("left")}
                        aria-label="이전"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2"
                        onClick={() => scroll("right")}
                        aria-label="다음"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* 캐러셀 */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="flex-shrink-0 w-[300px] snap-start"
                    >
                        <PredictionCardV2
                            game={game}
                            variant="compact"
                            showChart
                            showQuickBet={false}
                            onClick={() => onCardClick?.(game.id)}
                        />
                    </div>
                ))}
            </div>

            {/* 그라데이션 오버레이 */}
            <div className="absolute right-0 top-12 bottom-4 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none" />
        </div>
    );
};

export default HotPredictionsCarousel;
