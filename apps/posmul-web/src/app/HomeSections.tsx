/**
 * 홈페이지 전용 클라이언트 섹션 컴포넌트들
 *
 * 서버 컴포넌트인 page.tsx에서 사용할 클라이언트 래퍼들입니다.
 */
"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { LiveStatsCounter } from "../shared/ui/components/LiveStatsCounter";
import { YourFlowWidget } from "../shared/ui/components/YourFlowWidget";
import { HotPredictionsCarousel } from "../bounded-contexts/prediction/presentation/components/HotPredictionsCarousel";
import type { PredictionType } from "../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { GameStatus } from "../bounded-contexts/prediction/domain/value-objects/prediction-types";

/** 플랫폼 통계 섹션 */
export function PlatformStatsSection() {
    // TODO: 실제 API에서 데이터 가져오기
    const mockStats = [
        { label: "참여자", value: 12345, suffix: "명" },
        { label: "오늘의 게임", value: 23 },
        { label: "누적 기부", value: 45600000, prefix: "₩" },
        { label: "총 베팅액", value: 8900000, suffix: " PMP" },
    ];

    return (
        <LiveStatsCounter
            stats={mockStats}
            className="max-w-2xl mx-auto"
        />
    );
}

/** 인기 예측 섹션 */
export function HotPredictionsSection() {
    const router = useRouter();

    // TODO: 실제 API에서 hot games 가져오기
    const mockGames = [
        {
            id: "1",
            title: "2026 프로야구 최종 우승팀",
            description: "KBO 2026 정규시즌 최종 우승팀 예측",
            category: "스포츠",
            predictionType: "BINARY" as PredictionType,
            options: [
                { id: "opt-1", text: "삼성", currentOdds: 0.52 },
                { id: "opt-2", text: "LG", currentOdds: 0.48 },
            ],
            startTime: new Date(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            status: GameStatus.ACTIVE,
            currentParticipants: 234,
            totalStake: 12000,
            gameImportanceScore: 2.5,
            allocatedPrizePool: 8000,
            trendData: [
                { value: 48 },
                { value: 50 },
                { value: 49 },
                { value: 52 },
                { value: 51 },
                { value: 52 },
            ],
        },
        {
            id: "2",
            title: "비트코인 7만 달러 돌파",
            description: "2026년 상반기 BTC 7만 달러 돌파 여부",
            category: "경제",
            predictionType: "BINARY" as PredictionType,
            options: [
                { id: "opt-1", text: "돌파", currentOdds: 0.45 },
                { id: "opt-2", text: "미돌파", currentOdds: 0.55 },
            ],
            startTime: new Date(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
            status: GameStatus.ACTIVE,
            currentParticipants: 89,
            totalStake: 5600,
            gameImportanceScore: 1.8,
            allocatedPrizePool: 3500,
            trendData: [
                { value: 40 },
                { value: 42 },
                { value: 44 },
                { value: 45 },
                { value: 44 },
                { value: 45 },
            ],
        },
        {
            id: "3",
            title: "AI 반도체 시장 급성장",
            description: "2026년 AI 반도체 시장 30% 성장 여부",
            category: "기술",
            predictionType: "BINARY" as PredictionType,
            options: [
                { id: "opt-1", text: "달성", currentOdds: 0.68 },
                { id: "opt-2", text: "미달", currentOdds: 0.32 },
            ],
            startTime: new Date(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
            status: GameStatus.ACTIVE,
            currentParticipants: 156,
            totalStake: 9800,
            gameImportanceScore: 3.2,
            allocatedPrizePool: 6200,
            trendData: [
                { value: 60 },
                { value: 62 },
                { value: 65 },
                { value: 67 },
                { value: 68 },
                { value: 68 },
            ],
        },
        {
            id: "4",
            title: "한국 GDP 성장률",
            description: "2026년 한국 GDP 2.5% 이상 성장 가능성",
            category: "경제",
            predictionType: "BINARY" as PredictionType,
            options: [
                { id: "opt-1", text: "2.5% 이상", currentOdds: 0.35 },
                { id: "opt-2", text: "2.5% 미만", currentOdds: 0.65 },
            ],
            startTime: new Date(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
            status: GameStatus.ACTIVE,
            currentParticipants: 312,
            totalStake: 18500,
            gameImportanceScore: 4.0,
            allocatedPrizePool: 12000,
            trendData: [
                { value: 38 },
                { value: 36 },
                { value: 35 },
                { value: 34 },
                { value: 35 },
                { value: 35 },
            ],
        },
    ];

    return (
        <HotPredictionsCarousel
            games={mockGames}
            title="🔥 인기 예측"
            onCardClick={(id) => router.push(`/prediction/${id}`)}
        />
    );
}

/** 사용자 자산 흐름 섹션 (로그인 시에만 표시) */
export function UserFlowSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
    if (!isLoggedIn) {
        return null;
    }

    // TODO: 실제 사용자 데이터 가져오기
    const mockUserData = {
        pmpBalance: 4600,
        activeBets: 3,
        lockedPmp: 1200,
        totalDonated: 12000,
    };

    return (
        <YourFlowWidget data={mockUserData} />
    );
}

export default {
    PlatformStatsSection,
    HotPredictionsSection,
    UserFlowSection,
};
