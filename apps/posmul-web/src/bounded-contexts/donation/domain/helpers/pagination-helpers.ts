// Pagination 관련 유틸리티 함수들
import type {
  PaginatedResult,
  PaginationParams,
} from "@posmul/auth-economy-sdk";

/**
 * Legacy pagination 구조를 SDK PaginatedResult로 변환
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * ExtendedPaginationParams를 표준 PaginationParams로 변환
 */
export function normalizeePaginationParams(params: {
  page: number;
  limit?: number;
  pageSize?: number;
}): PaginationParams {
  return {
    page: params.page,
    pageSize: params.pageSize || params.limit || 10,
  };
}

/**
 * Legacy response 구조 생성 (기존 API 호환성을 위해)
 */
export function createLegacyPaginationResponse<T>(data: PaginatedResult<T>) {
  return {
    data: data.items,
    pagination: {
      total: data.total,
      page: data.page,
      limit: data.pageSize,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
      hasPrev: data.hasPrev,
    },
  };
}
