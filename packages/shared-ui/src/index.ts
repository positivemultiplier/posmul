// Components
export * from "./components/Button";
export * from "./components/Card";
export * from "./components/CategoryOverviewLayout";
export * from "./components/EnhancedGameCard";
export * from "./components/Input";
export * from "./components/LoadingSpinner";
export * from "./components/MoneyWaveStatus";
export * from "./components/RealTimeEconomicBalance";
export * from "./components/RealTimePredictionDashboard";

// UI Components (shadcn/ui style) - Button exports renamed to avoid conflict
export * from "./components/ui/badge";
export {
  Button as UIButton,
  type ButtonProps as UIButtonProps,
} from "./components/ui/button";
export * from "./components/ui/card";

// Loading Components
export * from "./components/loading";

// Error Components
export * from "./components/error";

// Realtime
export * from "./realtime/index";

// Utils
export * from "./utils/index";

// MCP Services
export { SupabaseProjectService } from "../../../apps/posmul-web/src/shared/mcp/supabase-project.service";

export { BaseSkeleton } from "./components/loading/BaseSkeleton";
export { default as Navbar } from "./components/navigation/Navbar";

export { Button as Button } from "./components/ui/button";

// Event Publisher (임시 export - 추후 @posmul/shared-types로 이동 예정)
export type { IDomainEventPublisher } from "@posmul/shared-types";
export { InMemoryEventPublisher } from "../../../apps/posmul-web/src/shared/events/event-publisher";

// Economic Services (임시 export - 추후 경제 패키지로 이동 예정)
export { MoneyWaveCalculatorService } from "../../../apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service";

// Default export
export { default } from "./components/forms/PredictionGameForm";
