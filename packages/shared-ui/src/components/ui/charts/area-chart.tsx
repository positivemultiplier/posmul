"use client";

import React from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../../../utils/cn";

export interface AreaChartData {
  [key: string]: string | number;
}

export interface AreaChartProps {
  data: AreaChartData[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  className?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  isDarkMode?: boolean;
  stackId?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

const defaultColors = {
  primary: "#3B82F6", // blue-500
  secondary: "#10B981", // emerald-500
  accent: "#F59E0B", // amber-500
  danger: "#EF4444", // red-500
  pmp: "#8B5CF6", // violet-500
  pmc: "#EC4899", // pink-500
};

export function AreaChart({
  data,
  dataKey,
  xAxisKey,
  title,
  className,
  height = 300,
  color = defaultColors.primary,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  animate = true,
  isDarkMode = false,
  stackId,
  fillOpacity = 0.6,
  strokeWidth = 2,
}: AreaChartProps) {
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
        <RechartsAreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
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

          <Area
            type="monotone"
            dataKey={dataKey}
            stackId={stackId}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#gradient-${chartId})`}
            fillOpacity={fillOpacity}
            animationDuration={animate ? 1000 : 0}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 스택 영역 차트
export interface StackedAreaChartProps
  extends Omit<AreaChartProps, "dataKey" | "color" | "stackId"> {
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

export function StackedAreaChart({
  data,
  dataKeys,
  xAxisKey,
  title,
  className,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  animate = true,
  isDarkMode = false,
  fillOpacity = 0.6,
  strokeWidth = 2,
}: StackedAreaChartProps) {
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
        <RechartsAreaChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            {dataKeys.map((item, index) => (
              <linearGradient
                key={item.key}
                id={`gradient-${item.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={item.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={item.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
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

          {dataKeys.map((item) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stackId="1"
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill={`url(#gradient-${item.key})`}
              fillOpacity={fillOpacity}
              animationDuration={animate ? 1000 : 0}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 특화된 AreaChart 컴포넌트들
export function MoneyWaveProgressChart({
  data,
  className,
  ...props
}: Omit<AreaChartProps, "dataKey" | "xAxisKey" | "title" | "color"> & {
  data: Array<{ time: string; poolAmount: number }>;
}) {
  return (
    <AreaChart
      data={data}
      dataKey="poolAmount"
      xAxisKey="time"
      title="Money Wave 진행률"
      color={defaultColors.pmc}
      fillOpacity={0.8}
      className={className}
      {...props}
    />
  );
}

export function CumulativeEarningsChart({
  data,
  className,
  ...props
}: Omit<StackedAreaChartProps, "dataKeys" | "xAxisKey" | "title"> & {
  data: Array<{ date: string; pmp: number; pmc: number }>;
}) {
  const dataKeys = [
    { key: "pmp", name: "PMP", color: defaultColors.pmp },
    { key: "pmc", name: "PMC", color: defaultColors.pmc },
  ];

  return (
    <StackedAreaChart
      data={data}
      dataKeys={dataKeys}
      xAxisKey="date"
      title="누적 포인트 획득"
      showLegend
      className={className}
      {...props}
    />
  );
}

export function PredictionVolumeChart({
  data,
  className,
  ...props
}: Omit<AreaChartProps, "dataKey" | "xAxisKey" | "title" | "color"> & {
  data: Array<{ date: string; volume: number }>;
}) {
  return (
    <AreaChart
      data={data}
      dataKey="volume"
      xAxisKey="date"
      title="예측 참여량"
      color={defaultColors.secondary}
      fillOpacity={0.4}
      className={className}
      {...props}
    />
  );
}

export function InvestmentGrowthChart({
  data,
  className,
  ...props
}: Omit<StackedAreaChartProps, "dataKeys" | "xAxisKey" | "title"> & {
  data: Array<{
    month: string;
    localLeague: number;
    majorLeague: number;
    cloudFunding: number;
  }>;
}) {
  const dataKeys = [
    {
      key: "localLeague",
      name: "Local League",
      color: defaultColors.secondary,
    },
    { key: "majorLeague", name: "Major League", color: defaultColors.primary },
    { key: "cloudFunding", name: "Cloud Funding", color: defaultColors.accent },
  ];

  return (
    <StackedAreaChart
      data={data}
      dataKeys={dataKeys}
      xAxisKey="month"
      title="투자 성장 추이"
      showLegend
      className={className}
      {...props}
    />
  );
}
