
"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

// Mock data for initial implementation
const mockData = [
    { time: '09:30', price: 180.50 },
    { time: '10:00', price: 181.20 },
    { time: '10:30', price: 182.10 },
    { time: '11:00', price: 181.80 },
    { time: '11:30', price: 182.50 },
    { time: '12:00', price: 183.00 },
    { time: '12:30', price: 182.70 },
    { time: '13:00', price: 183.50 },
    { time: '13:30', price: 184.20 },
    { time: '14:00', price: 184.80 },
    { time: '14:30', price: 185.10 },
    { time: '15:00', price: 184.50 },
    { time: '15:30', price: 184.90 },
    { time: '16:00', price: 185.00 },
];

interface LivePriceChartProps {
    symbol: string;
    data?: { time: string; price: number }[];
    color?: string; // Hex color
}

export const LivePriceChart: React.FC<LivePriceChartProps> = ({
    symbol,
    data = mockData,
    color = "#22c55e" // Default green
}) => {
    const latestPrice = data[data.length - 1].price;
    const startPrice = data[0].price;
    const isUp = latestPrice >= startPrice;
    const chartColor = isUp ? "#22c55e" : "#ef4444"; // Green or Red

    return (
        <Card className="w-full bg-slate-900 border-slate-800 text-white shadow-xl">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
                    <div className={`text-2xl font-mono font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                        ${latestPrice.toFixed(2)}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 0,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="time"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: chartColor }}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={chartColor}
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
