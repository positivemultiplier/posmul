/**
 * Auth-Economy SDK 공통 타입 정의
 *
 * 이 파일은 인증과 경제 시스템 간 공유되는 타입만 포함합니다.
 * 도메인별 타입은 각각 auth/types, economy/types에 정의됩니다.
 */

// === 브랜드 타입 시스템 ===
declare const __economicBrand: unique symbol;
export type EconomicBrand<T, TBrand extends string> = T & {
  [__economicBrand]: TBrand;
};

// === 핵심 식별자 타입 ===
export type UserId = EconomicBrand<string, "UserId">;
export type PredictionGameId = EconomicBrand<string, "PredictionGameId">;
export type PredictionId = EconomicBrand<string, "PredictionId">;
export type TransactionId = EconomicBrand<string, "TransactionId">;

// === 경제 시스템 타입 (통일된 브랜딩) ===
export type PmpAmount = EconomicBrand<number, "PmpAmount">;
export type PmcAmount = EconomicBrand<number, "PmcAmount">;
export type AccuracyScore = EconomicBrand<number, "AccuracyScore">;

// === 공통 결과 타입 ===
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// === 결과 타입 유틸리티 ===
export function isFailure<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return !result.success;
}

export function isSuccess<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}

// === Result 생성 유틸리티 ===
export function success<T, E = Error>(data: T): Result<T, E> {
  return { success: true, data };
}

export function failure<T, E = Error>(error: E): Result<T, E> {
  return { success: false, error };
}

// === 공통 메타데이터 타입 ===
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: Date;
}

// === 페이징 타입 ===
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// === 도메인 이벤트 ===
export * from "./domain-events";

// === 환경 설정 타입 ===
export interface SdkConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableEconomy?: boolean;
  debug?: boolean;
}

// === 생성자 함수 ===
/**
 * PmpAmount 생성자 (위험프리 자산)
 * @param value - PmpAmount 값 (0 이상)
 */
export function createPmpAmount(value: number): PmpAmount {
  if (value < 0) {
    throw new Error("PmpAmount cannot be negative");
  }
  if (!Number.isInteger(value)) {
    throw new Error("PmpAmount must be an integer");
  }
  return value as PmpAmount;
}

/**
 * PmcAmount 생성자 (위험자산)
 * @param value - PmcAmount 값 (0 이상)
 */
export function createPmcAmount(value: number): PmcAmount {
  if (value < 0) {
    throw new Error("PmcAmount cannot be negative");
  }
  if (!Number.isFinite(value)) {
    throw new Error("PmcAmount must be a finite number");
  }
  return value as PmcAmount;
}

/**
 * UserId 생성자
 * @param value - 사용자 ID 문자열
 */
export function createUserId(value: string): UserId {
  if (!value || value.trim().length === 0) {
    throw new Error("UserId cannot be empty");
  }
  return value.trim() as UserId;
}

/**
 * PredictionGameId 생성자
 * @param value - 예측 게임 ID 문자열
 */
export function createPredictionGameId(value: string): PredictionGameId {
  if (!value || value.trim().length === 0) {
    throw new Error("PredictionGameId cannot be empty");
  }
  return value.trim() as PredictionGameId;
}

/**
 * PredictionId 생성자
 * @param value - 예측 ID 문자열
 */
export function createPredictionId(value: string): PredictionId {
  if (!value || value.trim().length === 0) {
    throw new Error("PredictionId cannot be empty");
  }
  return value.trim() as PredictionId;
}

/**
 * TransactionId 생성자
 * @param value - 트랜잭션 ID 문자열
 */
export function createTransactionId(value: string): TransactionId {
  if (!value || value.trim().length === 0) {
    throw new Error("TransactionId cannot be empty");
  }
  return value.trim() as TransactionId;
}

// === 값 추출 유틸리티 ===
/**
 * PmpAmount에서 number 값 추출
 */
export function unwrapPmpAmount(pmp: PmpAmount): number {
  return pmp as number;
}

/**
 * PmcAmount에서 number 값 추출
 */
export function unwrapPmcAmount(pmc: PmcAmount): number {
  return pmc as number;
}

/**
 * UserId에서 string 값 추출
 */
export function unwrapUserId(userId: UserId): string {
  return userId as string;
}

/**
 * PredictionGameId에서 string 값 추출
 */
export function unwrapPredictionGameId(gameId: PredictionGameId): string {
  return gameId as string;
}

/**
 * PredictionId에서 string 값 추출
 */
export function unwrapPredictionId(predictionId: PredictionId): string {
  return predictionId as string;
}

// === 도메인 이벤트 타입 ===
export type {
  DomainEvent,
  IDomainEventPublisher,
  IDomainEventSubscriber,
} from "./domain-events";

export {
  BaseDomainEvent,
  PmpEarnedEvent,
  PmpSpentEvent,
  PmcEarnedEvent,
  PmcSpentEvent,
} from "./domain-events";

/**
 * TransactionId에서 string 값 추출
 */
export function unwrapTransactionId(transactionId: TransactionId): string {
  return transactionId as string;
}

// === 도메인별 타입은 각 모듈에서 re-export ===
// 사용법:
// import { UserId, Email, User } from '@posmul/auth-economy-sdk/auth';
// import { PmpAmount, PmcAmount, EconomicBalance } from '@posmul/auth-economy-sdk/economy';
