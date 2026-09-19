"use client";

import React, { useMemo } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { LineConfig } from '../../../../../shared/ui/components/charts/line-chart';

// Polymarket 스타일 컬러 팔레트
const POLY_COLORS = [
    '#87BFFF', // 연한 파랑
    '#2797FF', // 진한 파랑
    '#FDC503', // 노랑
    '#FF7F0E', // 주황
    '#10B981', // 초록
    '#EF4444', // 빨강
    '#8B5CF6', // 보라
    '#EC4899', // 핑크
];

interface ProbabilityLineChartProps {
    data: Array<{
        time: string;
        [key: string]: number | string;
    }>;
    lines?: LineConfig[];
    isDarkMode?: boolean;
}

// Polymarket 스타일 커스텀 툴팁
const PolyTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="backdrop-blur-md bg-gray-900/90 border border-gray-700/50 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-300">{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-white tabular-nums">
                            {typeof entry.value === 'number' ? `${entry.value}%` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Polymarket 스타일 범례
const PolyLegend = ({ lines, data }: { lines: LineConfig[]; data: Array<Record<string, string | number>> }) => {
    // 마지막 데이터 포인트에서 현재 확률 가져오기
    const lastPoint = data.length > 0 ? data[data.length - 1] : null;

    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
            {lines.map((line) => {
                const currentValue = lastPoint ? lastPoint[line.dataKey] : 0;
                return (
                    <div key={line.dataKey} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: line.color }}
                        />
                        <span className="text-sm text-gray-400">
                            {line.name}
                        </span>
                        <span className="text-sm font-bold text-white tabular-nums">
                            {typeof currentValue === 'number' ? `${currentValue}%` : currentValue}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export const ProbabilityLineChart = ({ data, lines, isDarkMode = true }: ProbabilityLineChartProps) => {
    // 기본 라인 설정 (폴백)
    const chartLines: LineConfig[] = useMemo(() => {
        if (lines && lines.length > 0) {
            // Polymarket 스타일 컬러 적용
            return lines.map((line, index) => ({
                ...line,
                color: line.color || POLY_COLORS[index % POLY_COLORS.length],
                strokeWidth: line.strokeWidth || 2,
            }));
        }
        return [{
            dataKey: "probability",
            name: "예측 확률",
            color: POLY_COLORS[0],
            strokeWidth: 2
        }];
    }, [lines]);

    // 데이터 없을 때
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[280px] flex items-center justify-center rounded-xl bg-gray-900/50 border border-gray-800/50">
                <div className="text-center">
                    <div className="text-gray-500 text-sm">아직 베팅 데이터가 없습니다</div>
                    <div className="text-gray-600 text-xs mt-1">첫 번째 베팅을 해보세요!</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Polymarket 스타일 범례 (차트 상단) */}
            <PolyLegend lines={chartLines} data={data} />

            {/* 차트 본체 */}
            <div className="relative">
                <ResponsiveContainer width="100%" height={280}>
                    <RechartsLineChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            {/* 각 라인별 그라디언트 (glow 효과) */}
                            {chartLines.map((line, index) => (
                                <React.Fragment key={`defs-${index}`}>
                                    {/* 라인 아래 영역 채우기 */}
                                    <linearGradient
                                        id={`gradient-${index}`}
                                        x1="0" y1="0" x2="0" y2="1"
                                    >
                                        <stop offset="0%" stopColor={line.color} stopOpacity={0.15} />
                                        <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                                    </linearGradient>
                                    {/* Glow 필터 */}
                                    <filter id={`glow-${index}`}>
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </React.Fragment>
                            ))}
                        </defs>

                        {/* 격자 - Polymarket 스타일 (점선, 매우 연함) */}
                        <CartesianGrid
                            strokeDasharray="1 3"
                            stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                            opacity={0.3}
                            vertical={false}
                            horizontalPoints={[]}
                        />

                        {/* X축 */}
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: isDarkMode ? "#6B7280" : "#9CA3AF",
                                fontSize: 11,
                                fontFamily: "Arial, sans-serif",
                            }}
                            dy={8}
                            interval="preserveStartEnd"
                            minTickGap={60}
                        />

                        {/* Y축 (0~100%) */}
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tick={{
                                fill: isDarkMode ? "#6B7280" : "#9CA3AF",
                                fontSize: 11,
                                fontFamily: "Arial, sans-serif",
                            }}
                            tickFormatter={(value) => `${value}%`}
                            dx={-5}
                            width={45}
                        />

                        {/* 툴팁 */}
                        <Tooltip
                            content={<PolyTooltip />}
                            cursor={{
                                stroke: isDarkMode ? "#4B5563" : "#9CA3AF",
                                strokeWidth: 1,
                                strokeDasharray: "4 4"
                            }}
                        />

                        {/* 라인 렌더링 */}
                        {chartLines.map((line, index) => (
                            <Line
                                key={line.dataKey}
                                type="monotone"
                                dataKey={line.dataKey}
                                name={line.name || line.dataKey}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth || 2}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    stroke: line.color,
                                    strokeWidth: 2,
                                    fill: isDarkMode ? "#111827" : "#FFFFFF",
                                    filter: `url(#glow-${index})`,
                                }}
                                animationDuration={800}
                                animationEasing="ease-out"
                                connectNulls
                            />
                        ))}
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
