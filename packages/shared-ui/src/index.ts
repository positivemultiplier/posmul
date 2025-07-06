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

// TODO: MCP Services - move to shared-auth or separate package
// export { SupabaseProjectService } from "../../../apps/posmul-web/src/shared/mcp/supabase-project.service";

export { BaseSkeleton } from "./components/loading/BaseSkeleton";
export { default as Navbar } from "./components/navigation/Navbar";

export { Button as Button } from "./components/ui/button";

// Event Publisher (임시 export - 추후 @posmul/shared-types로 이동 예정)
export type { IDomainEventPublisher } from "@posmul/shared-types";
// TODO: Move to shared-types or separate event package
// export { InMemoryEventPublisher } from "../../../apps/posmul-web/src/shared/events/event-publisher";

// TODO: Economic Services - move to economy package
// export { MoneyWaveCalculatorService } from "../../../apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service";

// Forms

export { default as PredictionGameForm } from "./components/forms/PredictionGameForm";
export { default as LoginForm, type LoginFormData } from "./components/forms/LoginForm";
export { default as SignUpForm } from "./components/forms/SignUpForm";
