"use client";

import { cn } from "../../../../../src/shared/utils/cn";
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface BarChartData {
  [key: string]: string | number;
}

export interface BarChartProps {
  data: BarChartData[];
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
  layout?: "horizontal" | "vertical";
  isDarkMode?: boolean;
  barSize?: number;
  radius?: number;
}

const defaultColors = {
  primary: "#3B82F6", // blue-500
  secondary: "#10B981", // emerald-500
  accent: "#F59E0B", // amber-500
  danger: "#EF4444", // red-500
  pmp: "#8B5CF6", // violet-500
  pmc: "#EC4899", // pink-500
};

export function BarChart({
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
  layout = "vertical",
  isDarkMode = false,
  barSize = 40,
  radius = 4,
}: BarChartProps) {
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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#374151" : "#E5E7EB"}
              opacity={0.5}
            />
          )}

          <XAxis
            dataKey={layout === "vertical" ? xAxisKey : undefined}
            type={layout === "vertical" ? "category" : "number"}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
            tickFormatter={
              layout === "horizontal"
                ? (value) => value.toLocaleString()
                : undefined
            }
          />

          <YAxis
            dataKey={layout === "horizontal" ? xAxisKey : undefined}
            type={layout === "vertical" ? "number" : "category"}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
            tickFormatter={
              layout === "vertical"
                ? (value) => value.toLocaleString()
                : undefined
            }
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: isDarkMode ? "#F3F4F6" : "#374151",
              }}
            />
          )}

          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[radius, radius, 0, 0]}
            maxBarSize={barSize}
            animationDuration={animate ? 1000 : 0}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 그룹화된 바 차트
export interface GroupedBarChartProps
  extends Omit<BarChartProps, "dataKey" | "color"> {
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

export function GroupedBarChart({
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
  layout = "vertical",
  isDarkMode = false,
  barSize = 20,
  radius = 4,
}: GroupedBarChartProps) {
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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#374151" : "#E5E7EB"}
              opacity={0.5}
            />
          )}

          <XAxis
            dataKey={layout === "vertical" ? xAxisKey : undefined}
            type={layout === "vertical" ? "category" : "number"}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
          />

          <YAxis
            dataKey={layout === "horizontal" ? xAxisKey : undefined}
            type={layout === "vertical" ? "number" : "category"}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontSize: 12,
            }}
            tickFormatter={
              layout === "vertical"
                ? (value) => value.toLocaleString()
                : undefined
            }
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
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.name}
              fill={item.color}
              radius={[radius, radius, 0, 0]}
              maxBarSize={barSize}
              animationDuration={animate ? 1000 : 0}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 특화된 BarChart 컴포넌트들
export function UserRankingChart({
  data,
  className,
  ...props
}: Omit<BarChartProps, "dataKey" | "xAxisKey" | "title" | "layout"> & {
  data: Array<{ name: string; score: number }>;
}) {
  return (
    <BarChart
      data={data}
      dataKey="score"
      xAxisKey="name"
      title="사용자 랭킹"
      layout="horizontal"
      color={defaultColors.secondary}
      className={className}
      {...props}
    />
  );
}

export function MonthlyEarningsChart({
  data,
  className,
  ...props
}: Omit<GroupedBarChartProps, "dataKeys" | "xAxisKey" | "title"> & {
  data: Array<{ month: string; pmp: number; pmc: number }>;
}) {
  const dataKeys = [
    { key: "pmp", name: "PmpAmount", color: defaultColors.pmp },
    { key: "pmc", name: "PMC", color: defaultColors.pmc },
  ];

  return (
    <GroupedBarChart
      data={data}
      dataKeys={dataKeys}
      xAxisKey="month"
      title="월별 포인트 획득"
      showLegend
      className={className}
      {...props}
    />
  );
}

export function PredictionCategoryChart({
  data,
  className,
  ...props
}: Omit<BarChartProps, "dataKey" | "xAxisKey" | "title" | "layout"> & {
  data: Array<{ category: string; count: number }>;
}) {
  return (
    <BarChart
      data={data}
      dataKey="count"
      xAxisKey="category"
      title="카테고리별 예측 수"
      layout="horizontal"
      color={defaultColors.accent}
      className={className}
      {...props}
    />
  );
}

export function InvestmentPerformanceChart({
  data,
  className,
  ...props
}: Omit<GroupedBarChartProps, "dataKeys" | "xAxisKey" | "title"> & {
  data: Array<{
    investment: string;
    invested: number;
    current: number;
    profit: number;
  }>;
}) {
  const dataKeys = [
    { key: "invested", name: "투자액", color: "#6B7280" },
    { key: "current", name: "현재가치", color: defaultColors.primary },
    { key: "profit", name: "수익", color: defaultColors.secondary },
  ];

  return (
    <GroupedBarChart
      data={data}
      dataKeys={dataKeys}
      xAxisKey="investment"
      title="투자 성과"
      showLegend
      className={className}
      {...props}
    />
  );
}
