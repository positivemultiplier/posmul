/**
 * SparkLine 컴포넌트
 *
 * 미니 라인 차트로 트렌드를 간결하게 시각화합니다.
 * Recharts 기반으로 구현되었으며, 프리미티브 UI 컴포넌트입니다.
 */
"use client";

import React from "react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    YAxis,
} from "recharts";

/** 차트 데이터 포인트 */
interface DataPoint {
    value: number;
    timestamp?: Date | string;
}

/** SparkLine 컴포넌트 Props */
interface SparkLineProps {
    /** 차트 데이터 배열 */
    data: DataPoint[];
    /** 차트 너비 (기본값: 100%) */
    width?: number | string;
    /** 차트 높이 (기본값: 40) */
    height?: number;
    /** 라인 색상 (기본값: var(--accent-blue)) */
    color?: string;
    /** 라인 굵기 (기본값: 2) */
    strokeWidth?: number;
    /** 값이 상승 시 사용할 색상 */
    positiveColor?: string;
    /** 값이 하락 시 사용할 색상 */
    negativeColor?: string;
    /** 자동 색상 결정 사용 여부 */
    autoColor?: boolean;
    /** 부드러운 곡선 사용 여부 (기본값: true) */
    smooth?: boolean;
    /** 애니메이션 사용 여부 (기본값: true) */
    animate?: boolean;
    /** 추가 클래스명 */
    className?: string;
}

/**
 * 트렌드를 표시하는 미니 라인 차트
 *
 * @example
 * ```tsx
 * <SparkLine
 *   data={[{ value: 45 }, { value: 52 }, { value: 48 }, { value: 55 }]}
 *   height={32}
 *   autoColor
 * />
 * ```
 */
export const SparkLine: React.FC<SparkLineProps> = ({
    data,
    width = "100%",
    height = 40,
    color,
    strokeWidth = 2,
    positiveColor = "var(--chart-win)",
    negativeColor = "var(--chart-lose)",
    autoColor = false,
    smooth = true,
    animate = true,
    className = "",
}) => {
    // 데이터가 없으면 빈 상태 표시
    if (!data || data.length === 0) {
        return (
            <div
                className={`flex items-center justify-center text-gray-400 text-xs ${className}`}
                style={{ width, height }}
            >
                데이터 없음
            </div>
        );
    }

    // 자동 색상 결정: 첫 값과 마지막 값 비교
    const determineColor = (): string => {
        if (color) return color;
        if (!autoColor) return "var(--accent-blue)";

        const firstValue = data[0]?.value ?? 0;
        const lastValue = data[data.length - 1]?.value ?? 0;

        if (lastValue > firstValue) return positiveColor;
        if (lastValue < firstValue) return negativeColor;
        return "var(--text-muted)";
    };

    const lineColor = determineColor();

    // Y축 범위 계산 (약간의 패딩 추가)
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = (maxValue - minValue) * 0.1 || 1;

    return (
        <div className={className} style={{ width, height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <YAxis
                        domain={[minValue - padding, maxValue + padding]}
                        hide
                    />
                    <Line
                        type={smooth ? "monotone" : "linear"}
                        dataKey="value"
                        stroke={lineColor}
                        strokeWidth={strokeWidth}
                        dot={false}
                        isAnimationActive={animate}
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SparkLine;
