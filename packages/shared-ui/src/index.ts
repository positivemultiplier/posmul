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

// Economy Kernel Services - actual classes and functions
export {
  EconomyKernel,
  EconomyKernelError,
  getEconomyKernel,
} from "../../../apps/posmul-web/src/shared/economy-kernel/services/economy-kernel.service";

export { MoneyWaveCalculatorService } from "../../../apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service";

// Economy Kernel Types - interfaces only
export type {
  EconomySystemStats,
  IEconomyKernelRepository,
  PmcAccount,
  PmpAccount,
} from "../../../apps/posmul-web/src/shared/economy-kernel/services/economy-kernel.service";

// Events Services - actual classes and functions
export {
  InMemoryEventPublisher,
  SupabaseEventPublisher,
  globalEventPublisher,
} from "../../../apps/posmul-web/src/shared/events/event-publisher";

export {
  globalEventBus,
  publishEvent,
  subscribeToEvent,
} from "../../../apps/posmul-web/src/shared/events/domain-events";

// Events Types - interfaces only
export type {
  IDomainEventPublisher,
  IDomainEventSubscriber,
  IEventStore,
} from "../../../apps/posmul-web/src/shared/events/event-publisher";

export type { DomainEvent } from "@posmul/shared-types";

// MCP Services
export { SupabaseProjectService } from "../../../apps/posmul-web/src/shared/mcp/supabase-project.service";
