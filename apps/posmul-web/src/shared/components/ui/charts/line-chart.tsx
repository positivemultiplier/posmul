"use client";

import { cn } from "@/shared/utils/cn";
import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LineChartData {
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartData[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  className?: string;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  gradientFill?: boolean;
  isDarkMode?: boolean;
}

const defaultColors = {
  primary: "#3B82F6", // blue-500
  secondary: "#10B981", // emerald-500
  accent: "#F59E0B", // amber-500
  danger: "#EF4444", // red-500
  pmp: "#8B5CF6", // violet-500
  pmc: "#EC4899", // pink-500
};

export function LineChart({
  data,
  dataKey,
  xAxisKey,
  title,
  className,
  height = 300,
  color = defaultColors.primary,
  strokeWidth = 2,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  animate = true,
  gradientFill = false,
  isDarkMode = false,
}: LineChartProps) {
  const chartId = React.useId();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            {gradientFill && (
              <linearGradient
                id={`gradient-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            )}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#374151" : "#E5E7EB"}
              opacity={0.5}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
            tickFormatter={(value) => value.toLocaleString()}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: isDarkMode ? "#F3F4F6" : "#374151",
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={gradientFill ? `url(#gradient-${chartId})` : "none"}
            dot={{
              fill: color,
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              stroke: color,
              strokeWidth: 2,
              fill: isDarkMode ? "#1F2937" : "#FFFFFF",
            }}
            animationDuration={animate ? 1000 : 0}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 특화된 LineChart 컴포넌트들
export function PmpTrendChart({
  data,
  className,
  ...props
}: Omit<LineChartProps, "color" | "dataKey"> & {
  dataKey?: string;
}) {
  return (
    <LineChart
      data={data}
      dataKey={props.dataKey || "pmp"}
      color={defaultColors.pmp}
      title="PMP 트렌드"
      gradientFill
      className={className}
      {...props}
    />
  );
}

export function PmcTrendChart({
  data,
  className,
  ...props
}: Omit<LineChartProps, "color" | "dataKey"> & {
  dataKey?: string;
}) {
  return (
    <LineChart
      data={data}
      dataKey={props.dataKey || "pmc"}
      color={defaultColors.pmc}
      title="PMC 트렌드"
      gradientFill
      className={className}
      {...props}
    />
  );
}

export function PredictionAccuracyChart({
  data,
  className,
  ...props
}: Omit<LineChartProps, "color" | "dataKey"> & {
  dataKey?: string;
}) {
  return (
    <LineChart
      data={data}
      dataKey={props.dataKey || "accuracy"}
      color={defaultColors.secondary}
      title="예측 정확도"
      className={className}
      {...props}
    />
  );
}
