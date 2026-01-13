/**
 * RealtimeOddsIndicator 컴포넌트
 *
 * 실시간 오즈 변화를 시각적으로 표시합니다.
 * 오즈가 변화할 때 ↑↓ 애니메이션과 색상 변화를 보여줍니다.
 */
"use client";

import React, { useEffect, useState, useRef } from "react";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/** Props */
interface RealtimeOddsIndicatorProps {
    /** 현재 오즈 (0-1 사이 확률 또는 배당률) */
    odds: number;
    /** 이전 오즈 (변화 계산용) */
    previousOdds?: number;
    /** 표시 형식 */
    format?: "percentage" | "decimal" | "fractional";
    /** 애니메이션 표시 여부 */
    showAnimation?: boolean;
    /** 변화 표시 지속 시간 (ms) */
    animationDuration?: number;
    /** 크기 */
    size?: "sm" | "md" | "lg";
    /** 추가 클래스명 */
    className?: string;
}

/** 오즈 포맷팅 */
const formatOdds = (odds: number, format: "percentage" | "decimal" | "fractional"): string => {
    switch (format) {
        case "percentage":
            return `${(odds * 100).toFixed(1)}%`;
        case "decimal":
            return odds > 0 ? (1 / odds).toFixed(2) : "-";
        case "fractional":
            if (odds <= 0 || odds >= 1) return "-";
            const decimal = 1 / odds - 1;
            return `${Math.round(decimal * 100) / 100}/1`;
        default:
            return `${(odds * 100).toFixed(1)}%`;
    }
};

/** 변화 방향 */
type ChangeDirection = "up" | "down" | "none";

/**
 * 실시간 오즈 변화 표시 컴포넌트
 *
 * @example
 * ```tsx
 * <RealtimeOddsIndicator odds={0.65} previousOdds={0.60} />
 * ```
 */
export const RealtimeOddsIndicator: React.FC<RealtimeOddsIndicatorProps> = ({
    odds,
    previousOdds,
    format = "percentage",
    showAnimation = true,
    animationDuration = 2000,
    size = "md",
    className = "",
}) => {
    const [direction, setDirection] = useState<ChangeDirection>("none");
    const [isAnimating, setIsAnimating] = useState(false);
    const prevOddsRef = useRef<number>(odds);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 오즈 변화 감지
    useEffect(() => {
        const prev = previousOdds ?? prevOddsRef.current;
        const diff = odds - prev;

        if (Math.abs(diff) > 0.001) {
            setDirection(diff > 0 ? "up" : "down");
            setIsAnimating(true);

            // 애니메이션 타이머
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                setIsAnimating(false);
                setDirection("none");
            }, animationDuration);
        }

        prevOddsRef.current = odds;

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [odds, previousOdds, animationDuration]);

    // 크기별 스타일
    const sizeStyles = {
        sm: "text-sm gap-1",
        md: "text-base gap-1.5",
        lg: "text-lg gap-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    // 변화 방향별 색상
    const getDirectionColor = () => {
        if (!isAnimating || !showAnimation) return "text-white";
        switch (direction) {
            case "up":
                return "text-green-400";
            case "down":
                return "text-red-400";
            default:
                return "text-white";
        }
    };

    // 변화 아이콘
    const getDirectionIcon = () => {
        if (!isAnimating || !showAnimation) return null;

        const iconClass = `${iconSizes[size]} ${getDirectionColor()} ${isAnimating ? 'animate-bounce' : ''}`;

        switch (direction) {
            case "up":
                return <TrendingUp className={iconClass} />;
            case "down":
                return <TrendingDown className={iconClass} />;
            default:
                return <Minus className={iconClass} />;
        }
    };

    // 배경 플래시 효과
    const getBackgroundClass = () => {
        if (!isAnimating || !showAnimation) return "";
        switch (direction) {
            case "up":
                return "bg-green-500/20 animate-pulse";
            case "down":
                return "bg-red-500/20 animate-pulse";
            default:
                return "";
        }
    };

    return (
        <div
            className={`
        inline-flex items-center ${sizeStyles[size]}
        px-2 py-1 rounded-lg transition-all duration-300
        ${getBackgroundClass()}
        ${className}
      `}
        >
            <span className={`font-bold ${getDirectionColor()} transition-colors duration-300`}>
                {formatOdds(odds, format)}
            </span>
            {getDirectionIcon()}
        </div>
    );
};

export default RealtimeOddsIndicator;
