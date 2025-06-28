"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "../../../utils/cn";

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartData[];
  title?: string;
  className?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  animate?: boolean;
  isDarkMode?: boolean;
  centerText?: string;
  centerSubText?: string;
}

const defaultColors = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
  "#F97316", // orange-500
  "#6366F1", // indigo-500
];

export function PieChart({
  data,
  title,
  className,
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showTooltip = true,
  showLegend = true,
  showLabels = false,
  animate = true,
  isDarkMode = false,
  centerText,
  centerSubText,
}: PieChartProps) {
  const isDonut = innerRadius > 0;

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          <p className="text-sm" style={{ color: data.payload.color }}>
            {`값: ${data.value.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {`비율: ${((data.value / data.payload.total) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? "#F3F4F6" : "#374151"}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CenterLabel = () => {
    if (!isDonut || (!centerText && !centerSubText)) return null;

    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-900 dark:fill-gray-100"
      >
        {centerText && (
          <tspan x="50%" dy="-0.5em" fontSize={16} fontWeight={600}>
            {centerText}
          </tspan>
        )}
        {centerSubText && (
          <tspan
            x="50%"
            dy="1.2em"
            fontSize={12}
            className="fill-gray-500 dark:fill-gray-400"
          >
            {centerSubText}
          </tspan>
        )}
      </text>
    );
  };

  const total = dataWithColors.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = dataWithColors.map((item) => ({ ...item, total }));

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? CustomLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationDuration={animate ? 1000 : 0}
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: isDarkMode ? "#F3F4F6" : "#374151",
              }}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          )}

          <CenterLabel />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 도넛 차트 변형
export function DonutChart(props: PieChartProps) {
  return <PieChart {...props} innerRadius={60} outerRadius={90} />;
}

// 특화된 PieChart 컴포넌트들
export function EconomicDistributionChart({
  pmpAmount,
  pmcAmount,
  className,
  ...props
}: Omit<PieChartProps, "data"> & {
  pmpAmount: number;
  pmcAmount: number;
}) {
  const data = [
    { name: "PMP", value: pmpAmount, color: "#8B5CF6" },
    { name: "PMC", value: pmcAmount, color: "#EC4899" },
  ];

  const total = pmpAmount + pmcAmount;

  return (
    <DonutChart
      data={data}
      title="경제 포인트 분포"
      centerText={total.toLocaleString()}
      centerSubText="총 포인트"
      className={className}
      {...props}
    />
  );
}

export function PredictionResultChart({
  correct,
  incorrect,
  pending,
  className,
  ...props
}: Omit<PieChartProps, "data"> & {
  correct: number;
  incorrect: number;
  pending: number;
}) {
  const data = [
    { name: "정답", value: correct, color: "#10B981" },
    { name: "오답", value: incorrect, color: "#EF4444" },
    { name: "대기중", value: pending, color: "#6B7280" },
  ];

  return (
    <PieChart
      data={data}
      title="예측 결과 분포"
      showLabels
      className={className}
      {...props}
    />
  );
}

export function InvestmentPortfolioChart({
  data,
  className,
  ...props
}: Omit<PieChartProps, "title"> & {
  data: Array<{ name: string; value: number; color?: string }>;
}) {
  return (
    <DonutChart
      data={data}
      title="투자 포트폴리오"
      centerText={data
        .reduce((sum, item) => sum + item.value, 0)
        .toLocaleString()}
      centerSubText="총 투자액"
      className={className}
      {...props}
    />
  );
}

export function MoneyWaveDistributionChart({
  data,
  currentPhase,
  className,
  ...props
}: Omit<PieChartProps, "title" | "centerText" | "centerSubText"> & {
  data: Array<{ name: string; value: number; color?: string }>;
  currentPhase: string;
}) {
  return (
    <DonutChart
      data={data}
      title="Money Wave 분배 현황"
      centerText={currentPhase}
      centerSubText="현재 단계"
      className={className}
      {...props}
    />
  );
}
