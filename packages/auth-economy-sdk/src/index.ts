/**
 * PosMul Auth-Economy SDK
 *
 * 순수 인증 및 경제 시스템 비즈니스 로직 SDK
 * UI 컴포넌트는 각 앱에서 자체 구현됩니다.
 */

// === 인증 시스템 ===
export * from "./auth";

// === 경제 시스템 ===
export * from "./economy";

// === 공통 타입 (중복 방지를 위해 선택적 re-export) ===
export type {
  // 기본 타입
  Result,
  EconomicBrand,
  ApiResponse,
  PaginationQuery,
  PaginationParams,
  PaginatedResult,
  SdkConfig,

  // 식별자 타입
  UserId,
  PredictionGameId,
  PredictionId,
  TransactionId,

  // 경제 시스템 타입
  PmpAmount,
  PmcAmount,
  AccuracyScore,

  // 도메인 이벤트 타입
  DomainEvent,
  IDomainEventPublisher,
  IDomainEventSubscriber,
} from "./types";

export {
  // Result 패턴 함수
  isFailure,
  isSuccess,
  success,
  failure,

  // Branded Types 생성 함수
  createUserId,
  createPredictionGameId,
  createPredictionId,
  createTransactionId,
  createPmpAmount,
  createPmcAmount,

  // 언래핑 함수
  unwrapUserId,
  unwrapPredictionGameId,
  unwrapPredictionId,
  unwrapTransactionId,
  unwrapPmpAmount,
  unwrapPmcAmount,

  // 도메인 이벤트 클래스
  BaseDomainEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
  PmcEarnedEvent,
  PmcSpentEvent,
} from "./types";

// === 에러 처리 ===
export * from "./errors";

// === 유틸리티 ===
export * from "./utils";

// === MCP 어댑터 ===
export * from "./utils/mcp-adapter";

// === 통합 클라이언트 ===
export { createAuthEconomyClient } from "./client";
