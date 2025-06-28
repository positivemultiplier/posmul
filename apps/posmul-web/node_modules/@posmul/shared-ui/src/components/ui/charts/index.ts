// Chart 컴포넌트 통합 내보내기
export * from "./area-chart";
export * from "./bar-chart";
export * from "./line-chart";
export * from "./pie-chart";

// 재사용 가능한 차트 타입 정의
export interface ChartColors {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  pmp: string;
  pmc: string;
}

export const chartColors: ChartColors = {
  primary: "#3B82F6", // blue-500
  secondary: "#10B981", // emerald-500
  accent: "#F59E0B", // amber-500
  danger: "#EF4444", // red-500
  pmp: "#8B5CF6", // violet-500
  pmc: "#EC4899", // pink-500
};

// 공통 차트 설정
export const defaultChartConfig = {
  height: 300,
  animate: true,
  showTooltip: true,
  showGrid: true,
  isDarkMode: false,
};

// 경제 시스템 특화 차트 설정
export const economicChartConfig = {
  ...defaultChartConfig,
  height: 350,
  pmpColor: chartColors.pmp,
  pmcColor: chartColors.pmc,
  gradientFill: true,
  showLegend: true,
};

// 예측 시스템 특화 차트 설정
export const predictionChartConfig = {
  ...defaultChartConfig,
  height: 280,
  color: chartColors.secondary,
  showLabels: true,
};

// 투자 시스템 특화 차트 설정
export const investmentChartConfig = {
  ...defaultChartConfig,
  height: 320,
  color: chartColors.primary,
  layout: "horizontal" as const,
  showLegend: true,
};
