"use client";

import { cn } from "../../../../../src/shared/utils/cn";
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

export interface LineConfig {
  dataKey: string;
  color: string;
  name?: string;
  strokeWidth?: number;
}

export interface LineChartProps {
  data: LineChartData[];
  dataKey?: string; // Legacy support for single line
  lines?: LineConfig[]; // New support for multiple lines
  xAxisKey: string;
  title?: string;
  className?: string;
  height?: number;
  color?: string; // Legacy support
  strokeWidth?: number; // Legacy support
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
  lines,
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

  // Normalize lines configuration
  const chartLines: LineConfig[] = lines || (dataKey ? [{
    dataKey,
    color,
    strokeWidth,
    name: dataKey
  }] : []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-300">
                {entry.name}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
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
            {gradientFill && chartLines.map((line, index) => (
              <linearGradient
                key={`gradient-${chartId}-${index}`}
                id={`gradient-${chartId}-${line.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#374151" : "#E5E7EB"}
              opacity={0.3}
              vertical={false}
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
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
            tickFormatter={(value) => value.toLocaleString()}
            dx={-10}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDarkMode ? "#4B5563" : "#9CA3AF", strokeWidth: 1, strokeDasharray: "4 4" }} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              iconType="circle"
            />
          )}

          {chartLines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              fill={gradientFill ? `url(#gradient-${chartId}-${line.dataKey})` : "none"}
              dot={false}
              activeDot={{
                r: 6,
                stroke: line.color,
                strokeWidth: 2,
                fill: isDarkMode ? "#1F2937" : "#FFFFFF",
              }}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-out"
            />
          ))}
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
      title="PmpAmount 트렌드"
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
      title="PmcAmount 트렌드"
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
