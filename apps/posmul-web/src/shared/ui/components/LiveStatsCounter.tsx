/**
 * LiveStatsCounter 컴포넌트
 *
 * 실시간 플랫폼 통계를 애니메이션과 함께 표시합니다.
 * public 도메인 UI이지만 여러 곳에서 사용되므로 shared에 배치합니다.
 */
"use client";

import React, { useEffect, useState } from "react";

/** 통계 항목 */
interface StatItem {
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    /** 애니메이션 시작 지연 (ms) */
    delay?: number;
}

/** LiveStatsCounter Props */
interface LiveStatsCounterProps {
    stats: StatItem[];
    /** 추가 클래스명 */
    className?: string;
}

/**
 * 숫자 카운트업 애니메이션
 */
const useCountUp = (endValue: number, duration: number = 1500, delay: number = 0): number => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // easeOutQuart 이징
                const eased = 1 - Math.pow(1 - progress, 4);
                setCount(Math.floor(endValue * eased));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }, delay);

        return () => clearTimeout(timeout);
    }, [endValue, duration, delay]);

    return count;
};

/** 숫자 포맷팅 */
const formatValue = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString("ko-KR");
};

/** 단일 통계 카드 */
const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
    const animatedValue = useCountUp(stat.value, 1500, stat.delay || 0);

    return (
        <div className="text-center px-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.prefix}
                <span className="tabular-nums">{formatValue(animatedValue)}</span>
                {stat.suffix}
            </div>
            <div className="text-sm text-gray-400">{stat.label}</div>
        </div>
    );
};

/**
 * 실시간 플랫폼 통계 표시
 *
 * @example
 * ```tsx
 * <LiveStatsCounter
 *   stats={[
 *     { label: "참여자", value: 12345, suffix: "명" },
 *     { label: "누적 기부", value: 45600000, prefix: "₩" },
 *     { label: "오늘의 게임", value: 23 },
 *   ]}
 * />
 * ```
 */
export const LiveStatsCounter: React.FC<LiveStatsCounterProps> = ({
    stats,
    className = "",
}) => {
    return (
        <div
            className={`grid grid-cols-2 md:grid-cols-${Math.min(stats.length, 4)} gap-3 ${className}`}
        >
            {stats.map((stat, idx) => (
                <StatCard key={stat.label} stat={{ ...stat, delay: idx * 200 }} />
            ))}
        </div>
    );
};

export default LiveStatsCounter;
