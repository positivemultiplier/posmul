
"use client";

import React from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { PredictionType } from "../../domain/value-objects/prediction-types";

// Trend data structure matched with DB
export interface TrendPoint {
    timestamp: string;
    snapshot_data: Record<string, any>; // e.g. { "bull": 60, "bear": 40 }
}

interface PredictionTrendChartProps {
    data: TrendPoint[];
    type: PredictionType;
    height?: number;
    className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-slate-400 mb-2">
                    {format(new Date(label), "M월 d일 HH:mm", { locale: ko })}
                </p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-200">{entry.name}:</span>
                            <span className="font-semibold text-white">
                                {Number(entry.value).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const PredictionTrendChart: React.FC<PredictionTrendChartProps> = ({
    data,
    type,
    height = 200,
    className,
}) => {
    // Transform DB data to Recharts format
    // Input: [{ timestamp: "...", snapshot_data: { "A": 10, "B": 20 } }]
    // Output: [{ time: "...", "A": 10, "B": 20 }]
    const chartData = data.map((point) => ({
        time: point.timestamp,
        ...point.snapshot_data,
    }));

    const isRanking = type === PredictionType.RANKING;
    const isBinary = type === PredictionType.BINARY;

    // 색상 팔레트
    const colors = [
        "#8b5cf6", // Violet (Main)
        "#3b82f6", // Blue
        "#10b981", // Emerald
        "#f59e0b", // Amber
        "#ef4444", // Red
    ];

    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-slate-50/50 rounded-lg h-[${height}px] text-gray-400 text-sm`}>
                데이터가 충분하지 않습니다
            </div>
        );
    }

    // 1. Ranking Type uses Multi-Line Chart
    if (isRanking) {
        const keys = Object.keys(data[0].snapshot_data || {});
        return (
            <div className={className} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="time"
                            tickFormatter={(t) => format(new Date(t), "MM/dd")}
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        {keys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // 2. Binary / WDL uses Stacked Area Chart
    // Assuming keys for Binary are option IDs, we need mapping logic in parent, 
    // but here we just render available keys.
    const keys = Object.keys(data[0].snapshot_data || {});

    return (
        <div className={className} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        {keys.map((key, index) => (
                            <linearGradient key={`grad-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="time"
                        tickFormatter={(t) => format(new Date(t), "MM/dd")}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Reference line for 50% if Binary */}
                    {isBinary && <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" />}

                    {keys.map((key, index) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            fillOpacity={1}
                            fill={`url(#color-${key})`}
                            stackId="1"
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
