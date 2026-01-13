/**
 * OddsChart 컴포넌트
 *
 * 예측 옵션별 배당률/확률을 시각화합니다.
 * Bar, Pie, Donut 등 다양한 variant 지원.
 */
"use client";

import React from "react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Cell,
    PieChart,
    Pie,
    Tooltip,
} from "recharts";

/** 차트 옵션 데이터 */
interface OddsOption {
    id: string;
    label: string;
    /** 확률 (0-1) 또는 배당률 */
    odds: number;
    /** 옵션 색상 (선택) */
    color?: string;
}

/** OddsChart 컴포넌트 Props */
interface OddsChartProps {
    /** 옵션 데이터 배열 */
    options: OddsOption[];
    /** 차트 유형 */
    variant?: "bar" | "pie" | "donut" | "horizontal-bar";
    /** 차트 높이 (기본값: 200) */
    height?: number;
    /** 애니메이션 사용 여부 (기본값: true) */
    animate?: boolean;
    /** 퍼센트 표시 여부 (기본값: true) */
    showPercentage?: boolean;
    /** 라벨 표시 여부 (기본값: true) */
    showLabels?: boolean;
    /** 툴팁 표시 여부 (기본값: true) */
    showTooltip?: boolean;
    /** 추가 클래스명 */
    className?: string;
    /** 옵션 클릭 핸들러 */
    onOptionClick?: (optionId: string) => void;
    /** 선택된 옵션 ID */
    selectedOptionId?: string | null;
}

/** 기본 차트 색상 팔레트 */
const DEFAULT_COLORS = [
    "var(--chart-option-1)",
    "var(--chart-option-2)",
    "var(--chart-option-3)",
    "var(--chart-option-4)",
    "var(--chart-option-5)",
];

/** 커스텀 툴팁 */
const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ payload: OddsOption & { percentage: number } }>;
}> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
        <div className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 shadow-lg">
            <p className="text-text-primary font-medium">{data.label}</p>
            <p className="text-text-secondary text-sm">
                확률: <span className="text-accent-blue">{data.percentage.toFixed(1)}%</span>
            </p>
            <p className="text-text-muted text-xs">
                배당률: {(1 / data.odds).toFixed(2)}x
            </p>
        </div>
    );
};

/**
 * 예측 옵션의 배당률/확률 시각화 차트
 *
 * @example
 * ```tsx
 * <OddsChart
 *   options={[
 *     { id: "yes", label: "예", odds: 0.52 },
 *     { id: "no", label: "아니오", odds: 0.48 },
 *   ]}
 *   variant="horizontal-bar"
 *   onOptionClick={(id) => setSelected(id)}
 * />
 * ```
 */
export const OddsChart: React.FC<OddsChartProps> = ({
    options,
    variant = "horizontal-bar",
    height = 200,
    animate = true,
    showPercentage = true,
    showLabels = true,
    showTooltip = true,
    className = "",
    onOptionClick,
    selectedOptionId,
}) => {
    // 데이터가 없으면 빈 상태 표시
    if (!options || options.length === 0) {
        return (
            <div
                className={`flex items-center justify-center text-gray-400 text-sm ${className}`}
                style={{ height }}
            >
                옵션 데이터 없음
            </div>
        );
    }

    // 확률을 퍼센트로 변환
    const chartData = options.map((opt, idx) => ({
        ...opt,
        percentage: opt.odds * 100,
        fill: opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }));

    // 클릭 핸들러
    const handleClick = (optionId: string) => {
        if (onOptionClick) {
            onOptionClick(optionId);
        }
    };

    // Horizontal Bar 차트 (기본)
    if (variant === "horizontal-bar") {
        return (
            <div className={`space-y-3 ${className}`}>
                {chartData.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    return (
                        <div
                            key={option.id}
                            className={`cursor-pointer transition-all duration-200 ${isSelected ? "ring-2 ring-accent-blue rounded-lg" : ""
                                }`}
                            onClick={() => handleClick(option.id)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-text-primary">
                                    {option.label}
                                </span>
                                {showPercentage && (
                                    <span className="text-sm text-text-secondary">
                                        {option.percentage.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                            <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${option.percentage}%`,
                                        backgroundColor: option.fill,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Bar 차트 (세로)
    if (variant === "bar") {
        return (
            <div className={className} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                        {showLabels && <XAxis dataKey="label" tick={{ fontSize: 12 }} />}
                        <YAxis hide domain={[0, 100]} />
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                        <Bar
                            dataKey="percentage"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={animate}
                            animationDuration={800}
                            onClick={(data) => handleClick(data.id)}
                            cursor="pointer"
                        >
                            {chartData.map((entry, idx) => (
                                <Cell
                                    key={entry.id}
                                    fill={entry.fill}
                                    stroke={selectedOptionId === entry.id ? "var(--accent-blue)" : "transparent"}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // Pie/Donut 차트
    if (variant === "pie" || variant === "donut") {
        const innerRadius = variant === "donut" ? "50%" : 0;
        return (
            <div className={className} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="percentage"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius="80%"
                            paddingAngle={2}
                            isAnimationActive={animate}
                            animationDuration={800}
                            onClick={(data) => handleClick(data.id)}
                            cursor="pointer"
                        >
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.id}
                                    fill={entry.fill}
                                    stroke={selectedOptionId === entry.id ? "var(--accent-blue)" : "transparent"}
                                    strokeWidth={3}
                                />
                            ))}
                        </Pie>
                        {showTooltip && <Tooltip content={<CustomTooltip />} />}
                    </PieChart>
                </ResponsiveContainer>
                {/* 중앙 라벨 (도넛 차트) */}
                {variant === "donut" && showLabels && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-text-primary">
                                {options.length}
                            </p>
                            <p className="text-xs text-text-muted">옵션</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default OddsChart;
