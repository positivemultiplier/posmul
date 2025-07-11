/**
 * PosMul Web Shared Module - 모놀리식 아키텍처 전환
 *
 * 웹 애플리케이션의 공유 모듈들을 중앙 집중식으로 관리.
 * packages/shared-ui 해체 후 내부 UI 시스템으로 전환.
 */

// Auth & Economy - 통합 SDK 사용 (선택적 export로 중복 해결)
export type {
  // Types
  Result,
  PmpAmount,
  PmcAmount,
  UserId,
  IDomainEventPublisher as ISDKDomainEventPublisher,
  PmcEarnedEvent as SDKPmcEarnedEvent,
  PmcSpentEvent as SDKPmcSpentEvent,
  PmpEarnedEvent as SDKPmpEarnedEvent,
  PmpSpentEvent as SDKPmpSpentEvent,
} from "@posmul/auth-economy-sdk";

export {
  // Utility functions
  isFailure,
  isSuccess,
  success,
  failure,
  createPmpAmount,
  createPmcAmount,
  createUserId,

  // Errors (중복 방지를 위해 별칭 사용)
  BusinessLogicError as SDKBusinessLogicError,
  DomainError as SDKDomainError,
  NetworkError as SDKNetworkError,
  ValidationError as SDKValidationError,
} from "@posmul/auth-economy-sdk";

// UI Components - 내부 shared UI 시스템 사용
export * from "./ui";

// Economy Kernel - 도메인 공통 로직 (선택적 export)
export type {
  PmpAccount,
  PmcAccount,
  EconomySystemStats,
} from "./economy-kernel";

export { EconomyKernelError } from "./economy-kernel";

// Events - 도메인 이벤트 시스템 (명시적 export로 중복 해결)
export {
  InMemoryEventPublisher,
  PublishError,
  HandlerError,
} from "./events/event-publisher";

// TODO: Realtime 시스템 마이그레이션 (일부 완료)
// 기본 realtime 기능은 복구되었지만, chart/notification 시스템은 아직 마이그레이션 중입니다.
export * from "./realtime";
