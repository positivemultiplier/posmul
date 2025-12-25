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

type TooltipPayloadEntry = {
  name?: string;
  value?: string | number;
  color?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
};

function formatAxisValue(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  return String(value);
}

function getTickFill(isDarkMode: boolean): string {
  return isDarkMode ? "#9CA3AF" : "#6B7280";
}

function getGridStroke(isDarkMode: boolean): string {
  return isDarkMode ? "#374151" : "#E5E7EB";
}

function getLegendTextColor(isDarkMode: boolean): string {
  return isDarkMode ? "#F3F4F6" : "#374151";
}

function getAxisProps(layout: "horizontal" | "vertical", xAxisKey: string): {
  xAxis: {
    dataKey?: string;
    type: "category" | "number";
    tickFormatter?: (value: unknown) => string;
  };
  yAxis: {
    dataKey?: string;
    type: "category" | "number";
    tickFormatter?: (value: unknown) => string;
  };
} {
  if (layout === "vertical") {
    return {
      xAxis: { dataKey: xAxisKey, type: "category" },
      yAxis: { type: "number", tickFormatter: formatAxisValue },
    };
  }

  return {
    xAxis: { type: "number", tickFormatter: formatAxisValue },
    yAxis: { dataKey: xAxisKey, type: "category" },
  };
}

function getAnimationDuration(animate: boolean): number {
  return animate ? 1000 : 0;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {`${entry.name}: ${formatAxisValue(entry.value)}`}
        </p>
      ))}
    </div>
  );
}

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
  const axisProps = getAxisProps(layout, xAxisKey);
  const tickFill = getTickFill(isDarkMode);
  const gridStroke = getGridStroke(isDarkMode);
  const legendTextColor = getLegendTextColor(isDarkMode);
  const animationDuration = getAnimationDuration(animate);

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
              stroke={gridStroke}
              opacity={0.5}
            />
          )}

          <XAxis
            dataKey={axisProps.xAxis.dataKey}
            type={axisProps.xAxis.type}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: tickFill,
              fontSize: 12,
            }}
            tickFormatter={axisProps.xAxis.tickFormatter}
          />

          <YAxis
            dataKey={axisProps.yAxis.dataKey}
            type={axisProps.yAxis.type}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: tickFill,
              fontSize: 12,
            }}
            tickFormatter={axisProps.yAxis.tickFormatter}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: legendTextColor,
              }}
            />
          )}

          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[radius, radius, 0, 0]}
            maxBarSize={barSize}
            animationDuration={animationDuration}
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
  const axisProps = getAxisProps(layout, xAxisKey);
  const tickFill = getTickFill(isDarkMode);
  const gridStroke = getGridStroke(isDarkMode);
  const legendTextColor = getLegendTextColor(isDarkMode);
  const animationDuration = getAnimationDuration(animate);

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
              stroke={gridStroke}
              opacity={0.5}
            />
          )}

          <XAxis
            dataKey={axisProps.xAxis.dataKey}
            type={axisProps.xAxis.type}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: tickFill,
              fontSize: 12,
            }}
            tickFormatter={axisProps.xAxis.tickFormatter}
          />

          <YAxis
            dataKey={axisProps.yAxis.dataKey}
            type={axisProps.yAxis.type}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: tickFill,
              fontSize: 12,
            }}
            tickFormatter={axisProps.yAxis.tickFormatter}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: legendTextColor,
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
              animationDuration={animationDuration}
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
