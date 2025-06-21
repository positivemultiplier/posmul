/**
 * 공유 모듈 통합 인덱스
 */

// 타입 exports (DomainEvent 제외)
export type {
  ApiResponse,
  AsyncState,
  Auditable,
  BaseGame,
  BaseId,
  DomainError,
  LoadingState,
  PaginatedResult,
  PaginationParams,
  PointTransaction,
  Result,
  SoftDeletable,
  Timestamps,
} from "./types/common";

// 상수 exports
export * from "./constants/app.constants";

// 유틸리티 exports
export * from "./utils/common";
export * from "./utils/errors";

// 컴포넌트 exports
export * from "./components";

// 이벤트 exports (중복 제거)
export {
  getDomainEventSystemStatus,
  initializeDomainEventSystem,
} from "./events";

// Economy Kernel exports (Shared Kernel Pattern) - 선택적 export
export { EconomyKernel } from "./economy-kernel/services/economy-kernel.service";
export { MoneyWaveCalculatorService } from "./economy-kernel/services/money-wave-calculator.service";
