/**
 * 레거시 호환성 래퍼 (Enhanced for Type Compatibility)
 *
 * Phase 1 마이그레이션 중 타입 호환성 문제 해결을 위한 확장된 호환성 계층
 * 모든 마이그레이션 완료 후 이 파일은 제거됩니다.
 */

// Auth-Economy SDK에서 타입들 import - 마이그레이션 완료
import type {
  Result as SdkResult,
  PaginationParams as SdkPaginationParams,
  PaginatedResult as SdkPaginatedResult,
} from "@posmul/auth-economy-sdk";

// Auth-Economy SDK에서 타입들 import
import type {
  UserId,
  User,
  EconomicBalance,
  PmpAmount,
  PmcAmount,
  TransactionId,
  Email,
  Username,
} from "@posmul/auth-economy-sdk";

// SDK의 MCP 유틸리티 import (shared-auth 대신 SDK 사용)
import {
  createMCPAdapter,
  MCPError,
  handleMCPError,
  retryMCPOperation,
  formatMCPQuery,
  validateMCPQuery,
  buildParameterizedQuery,
} from "@posmul/auth-economy-sdk/utils";

// === 타입 호환성 계층 ===

/**
 * 통합 Result 타입 - 모든 에러 타입과 호환 가능
 */
export type CompatibleResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 확장된 PaginationParams - 기존 사용법과 호환
 */
export interface ExtendedPaginationParams extends SdkPaginationParams {
  limit?: number; // pageSize의 별칭
  sortBy?: string; // 정렬 필드
  sortOrder?: "asc" | "desc"; // 정렬 순서
}

/**
 * 호환 가능한 에러 기본 클래스
 */
export class CompatibleBaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = "CompatibleBaseError";
  }
}

/**
 * MCPError를 CompatibleBaseError로 변환
 */
export const adaptMCPError = (
  error: MCPError,
  operation: string
): CompatibleBaseError => {
  return new CompatibleBaseError(
    "MCP_ERROR",
    `MCP operation '${operation}' failed: ${error.message}`,
    500,
    true
  );
};

/**
 * MCP 함수들 래핑 (SDK 기반)
 */
export {
  // SDK 기반 MCP 유틸리티 (권장)
  createMCPAdapter,
  MCPError,
  handleMCPError,
  retryMCPOperation,
  formatMCPQuery,
  validateMCPQuery,
  buildParameterizedQuery,
};

/**
 * 레거시 MCP 함수들 (호환성용)
 */
export const mcp_supabase_execute_sql = async (
  query: string,
  projectId?: string
) => {
  const actualProjectId =
    projectId || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "default";
  const adapter = createMCPAdapter(actualProjectId);
  return adapter.executeSQL(query);
};

export const LegacyMCPError = MCPError;
export const legacyHandleMCPError = handleMCPError;

/**
 * 프로젝트 기본 MCP 어댑터 생성
 */
export const createDefaultMCPAdapter = () => {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "default";
  return createMCPAdapter(projectId);
};

// === 타입 호환성 Re-exports ===

// SDK 타입들 (우선 사용)
export type {
  UserId,
  User,
  EconomicBalance,
  PmpAmount,
  PmcAmount,
  TransactionId,
  Email,
  Username,
} from "@posmul/auth-economy-sdk";

// SDK 타입 호환성 (기존 이름 유지)
export type {
  SdkResult as SharedResult,
  SdkPaginationParams as SharedPaginationParams,
  SdkPaginatedResult as SharedPaginatedResult,
};

// 호환성 타입 별칭들
export type Result<T, E = CompatibleBaseError> = CompatibleResult<T, E>;
export type LegacyResult<T, E = Error> = CompatibleResult<T, E>;
export type LegacyUserId = UserId;
export type LegacyPmpAmount = PmpAmount;
export type LegacyPmcAmount = PmcAmount;

// 페이지네이션 호환성 유틸리티
export const normalizePaginationParams = (
  params: SdkPaginationParams | ExtendedPaginationParams
): ExtendedPaginationParams => {
  const normalized = params as ExtendedPaginationParams;

  // limit이 없으면 pageSize 사용
  if (!normalized.limit && normalized.pageSize) {
    normalized.limit = normalized.pageSize;
  }

  // 기본값 설정
  return {
    page: normalized.page || 1,
    pageSize: normalized.pageSize || normalized.limit || 10,
    limit: normalized.limit || normalized.pageSize || 10,
    sortBy: normalized.sortBy || "created_at",
    sortOrder: normalized.sortOrder || "desc",
  };
};

// 유틸리티 함수들
export const createUserId = (id: string): UserId => id as UserId;
export const createPmpAmount = (amount: number) => amount;
export const createPmcAmount = (amount: number): PmcAmount =>
  amount as PmcAmount;

// 성공/실패 유틸리티 (호환성)
export const success = <T>(data: T): CompatibleResult<T, never> => ({
  success: true,
  data,
});
export const failure = <E>(error: E): CompatibleResult<never, E> => ({
  success: false,
  error,
});
export const isSuccess = <T, E>(
  result: CompatibleResult<T, E>
): result is { success: true; data: T } => result.success;
export const isFailure = <T, E>(
  result: CompatibleResult<T, E>
): result is { success: false; error: E } => !result.success;

// 호환성 헬퍼들
export const adaptErrorToBaseError = (
  error: unknown,
  operation: string = "Unknown operation"
): CompatibleBaseError => {
  if (error instanceof CompatibleBaseError) {
    return error;
  }

  if (error instanceof Error) {
    return new CompatibleBaseError(
      "ADAPTED_ERROR",
      `Operation '${operation}' failed: ${error.message}`,
      500,
      true
    );
  }

  return new CompatibleBaseError(
    "UNKNOWN_ERROR",
    `Operation '${operation}' failed with unknown error`,
    500,
    true
  );
};

export { CompatibleBaseError as BaseError };

// Legacy error classes for compatibility
export class DomainError extends CompatibleBaseError {
  constructor(message: string, code: string = "DOMAIN_ERROR") {
    super(code, message, 400);
    this.name = "DomainError";
  }
}

export class RepositoryError extends CompatibleBaseError {
  constructor(message: string, code: string = "REPOSITORY_ERROR") {
    super(code, message, 500);
    this.name = "RepositoryError";
  }
}

export class ValidationError extends CompatibleBaseError {
  constructor(message: string, code: string = "VALIDATION_ERROR") {
    super(code, message, 400);
    this.name = "ValidationError";
  }
}

// 확장된 페이지네이션 파라미터 정규화
export const normalizeExtendedPaginationParams = (
  pagination?: ExtendedPaginationParams
): Required<ExtendedPaginationParams> => {
  const defaults: Required<ExtendedPaginationParams> = {
    page: 1,
    pageSize: 10,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc",
  };

  if (!pagination) {
    return defaults;
  }

  return {
    page: pagination.page || defaults.page,
    pageSize: pagination.pageSize || pagination.limit || defaults.pageSize,
    limit: pagination.limit || pagination.pageSize || defaults.limit,
    sortBy: pagination.sortBy || defaults.sortBy,
    sortOrder: pagination.sortOrder || defaults.sortOrder,
  };
};
