/**
 * SDK 타입 브리지 (단계적 마이그레이션용)
 * 
 * 현재는 기존 타입들을 사용하되, 점진적으로 개별 파일에서 
 * SDK import로 전환하는 과정에서 이 파일이 참조점 역할을 합니다.
 */

// === 현재는 기존 타입들을 그대로 재수출 ===
// 향후 개별 파일에서 직접 SDK import로 전환할 예정

export type { UserId, PredictionGameId, PredictionId } from "./branded-types";
export type { Result } from "./errors";
export type { PaginationParams, PaginatedResult } from "./common";
export type { DomainEvent, BaseDomainEvent } from "./domain-events";
export type { BaseEntity } from "./base-entity";

// === 마이그레이션 노트 ===
// 다음 타입들은 SDK로 이관 예정:
// - UserId, PredictionGameId, PredictionId -> @posmul/auth-economy-sdk
// - Result, isFailure, isSuccess -> @posmul/auth-economy-sdk  
// - PaginationQuery -> @posmul/auth-economy-sdk

// === 마이그레이션 전략 ===
// 1. 개별 파일에서 @posmul/shared-types 대신 @posmul/auth-economy-sdk import 사용
// 2. 타입 호환성 문제 발생 시 type-bridge.ts 유틸리티 활용
// 3. 모든 파일 마이그레이션 완료 후 shared-types 패키지 제거

// === 유틸리티 함수 ===
import type { Result } from "./errors";

export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

// === 레거시 호환성을 위해 기존 타입들도 병행 수출 ===
export * from "./auth-domain";
export * from "./base-entity";
export * from "./branded-types";
export * from "./common";
export * from "./domain-events";
export * from "./economic-system";
export * from "./economy-kernel";
export * from "./errors";
export * from "./event-publisher";
export * from "./navigation";
export * from "./prediction";
export * from "./supabase-generated";
