/**
 * PredictionCardV2 컴포넌트
 *
 * 예측 게임 카드의 개선된 버전입니다.
 * - compact variant: 목록에서 사용, 미니 차트 포함
 * - detailed variant: 상세 정보 표시
 * - minimal variant: 가장 간결한 버전
 *
 * UI 개발 원칙(Local First)에 따라 prediction 도메인에 위치합니다.
 */
"use client";

import React, { useState } from "react";

import { Badge, Button, Card } from "../../../../shared/ui/components/base";
import { SparkLine, OddsChart } from "../../../../shared/ui/charts";
import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";

/** 예측 게임 데이터 */
interface PredictionGameData {
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
    /** 트렌드 데이터 (SparkLine용) */
    trendData?: Array<{ value: number; timestamp?: string }>;
}

/** PredictionCardV2 Props */
interface PredictionCardV2Props {
    /** 예측 게임 데이터 */
    game: PredictionGameData;
    /** 카드 변형 */
    variant?: "compact" | "detailed" | "minimal";
    /** Quick Bet 표시 여부 */
    showQuickBet?: boolean;
    /** 미니 차트 표시 여부 */
    showChart?: boolean;
    /** 클릭 핸들러 */
    onClick?: () => void;
    /** Quick Bet 핸들러 */
    onQuickBet?: (optionId: string, amount: number) => void;
    /** 추가 클래스명 */
    className?: string;
}

/** 상태별 배지 설정 */
const STATUS_CONFIG: Record<GameStatus, { label: string; className: string }> = {
    [GameStatus.PENDING]: { label: "준비중", className: "bg-gray-500/20 text-gray-400" },
    [GameStatus.CREATED]: { label: "생성됨", className: "bg-gray-500/20 text-gray-400" },
    [GameStatus.ACTIVE]: { label: "참여 가능", className: "bg-green-500/20 text-green-400" },
    [GameStatus.ENDED]: { label: "마감", className: "bg-yellow-500/20 text-yellow-400" },
    [GameStatus.SETTLING]: { label: "정산중", className: "bg-amber-500/20 text-amber-400" },
    [GameStatus.COMPLETED]: { label: "정산 완료", className: "bg-blue-500/20 text-blue-400" },
    [GameStatus.CANCELLED]: { label: "취소됨", className: "bg-red-500/20 text-red-400" },
};

/** 숫자 포맷팅 */
const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString("ko-KR");
};

/** 남은 시간 계산 */
const getTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return "종료됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
};

/**
 * PredictionCardV2 - 개선된 예측 게임 카드
 */
export const PredictionCardV2: React.FC<PredictionCardV2Props> = ({
    game,
    variant = "compact",
    showQuickBet = true,
    showChart = true,
    onClick,
    onQuickBet,
    className = "",
}) => {
    const [isQuickBetOpen, setIsQuickBetOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [betAmount, setBetAmount] = useState<number>(100);

    const statusConfig = STATUS_CONFIG[game.status];
    const isActive = game.status === GameStatus.ACTIVE;

    // 차트 데이터 준비
    const chartOptions = game.options.map((opt) => ({
        id: opt.id,
        label: opt.text,
        odds: opt.currentOdds,
    }));

    // Quick Bet 제출
    const handleQuickBet = () => {
        if (selectedOption && onQuickBet) {
            onQuickBet(selectedOption, betAmount);
            setIsQuickBetOpen(false);
            setSelectedOption(null);
        }
    };

    // Minimal 변형
    if (variant === "minimal") {
        return (
            <div
                className={`flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-default hover:border-border-light transition-colors cursor-pointer ${className}`}
                onClick={onClick}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                            {game.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${statusConfig.className}`}>
                                {statusConfig.label}
                            </Badge>
                            <span className="text-xs text-text-muted">
                                👥 {formatNumber(game.currentParticipants)}
                            </span>
                        </div>
                    </div>
                </div>
                {showChart && game.trendData && game.trendData.length > 0 && (
                    <div className="w-16 h-8 ml-2">
                        <SparkLine data={game.trendData} height={32} autoColor />
                    </div>
                )}
            </div>
        );
    }

    // Compact 변형 (기본)
    return (
        <Card
            className={`p-4 bg-bg-secondary border-border-default hover:border-border-light transition-all duration-200 cursor-pointer group ${className}`}
            onClick={onClick}
        >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-primary truncate group-hover:text-accent-blue transition-colors">
                        {game.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${statusConfig.className}`}>
                            {statusConfig.label}
                        </Badge>
                        {isActive && (
                            <span className="text-xs text-text-muted">
                                ⏰ {getTimeRemaining(game.endTime)}
                            </span>
                        )}
                    </div>
                </div>
                {showChart && game.trendData && game.trendData.length > 0 && (
                    <div className="w-20 h-10">
                        <SparkLine data={game.trendData} height={40} autoColor />
                    </div>
                )}
            </div>

            {/* 오즈 차트 */}
            {variant === "compact" && (
                <div className="mb-3">
                    <OddsChart
                        options={chartOptions}
                        variant="horizontal-bar"
                        showPercentage
                        selectedOptionId={selectedOption}
                        onOptionClick={isActive && showQuickBet ? setSelectedOption : undefined}
                    />
                </div>
            )}

            {/* 통계 */}
            <div className="flex items-center justify-between text-xs text-text-muted border-t border-border-default pt-3">
                <div className="flex items-center gap-3">
                    <span>👥 {formatNumber(game.currentParticipants)}명</span>
                    <span>💰 {formatNumber(game.totalStake)} PMP</span>
                </div>
                <span>🏆 {formatNumber(game.allocatedPrizePool)} PMC</span>
            </div>

            {/* Quick Bet 패널 */}
            {isActive && showQuickBet && selectedOption && (
                <div className="mt-3 pt-3 border-t border-border-default animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            min={100}
                            max={10000}
                            step={100}
                            className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-blue"
                            placeholder="베팅액 (PMP)"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                            size="sm"
                            className="bg-pmp-primary hover:bg-pmp-dark text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleQuickBet();
                            }}
                        >
                            베팅하기
                        </Button>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                        예상 수익: {formatNumber(Math.floor(betAmount / (chartOptions.find(o => o.id === selectedOption)?.odds || 1)))} PMC
                    </p>
                </div>
            )}
        </Card>
    );
};

export default PredictionCardV2;
