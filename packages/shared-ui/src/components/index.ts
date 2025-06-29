/**
 * 공유 컴포넌트 인덱스
 */

export { default as Button } from "./Button";
export { CategoryOverviewLayout, GameCard } from "./CategoryOverviewLayout";
export { EnhancedGameCard, GameCardAdapter } from "./EnhancedGameCard";
export { default as Input } from "./Input";
export { default as LoadingSpinner } from "./LoadingSpinner";
export { MoneyWaveStatus } from "./MoneyWaveStatus";
export { BaseErrorUI } from "./error";
export { default as Navbar } from "./navigation/Navbar";

// UI 컴포넌트들
export { Badge } from "./ui/badge";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

// Loading 컴포넌트들
export { BaseSkeleton } from "./loading/BaseSkeleton";

export type { ButtonProps } from "./Button";
export type { CardProps } from "./Card";
export type {
  CategoryStatistics,
  GameCardProps,
  PopularSubcategory,
} from "./CategoryOverviewLayout";
export type {
  EnhancedGameCardProps,
  GameOption,
  GameType,
  MiniChartData,
  MoneyWaveInfo,
} from "./EnhancedGameCard";
export type { InputProps } from "./Input";
export type { LoadingSpinnerProps } from "./LoadingSpinner";
