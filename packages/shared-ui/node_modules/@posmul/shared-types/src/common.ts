/**
 * 공통 도메인 타입 정의
 */

// 기본 ID 타입들
export type BaseId = string;

// 도메인 에러 클래스
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// 결과 패턴 타입
export type Result<T, E = DomainError> =
  | { success: true; data: T }
  | { success: false; error: E };

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 포인트 시스템 기본 타입
export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "PMC" | "PMP";
  transactionType: "EARN" | "SPEND" | "TRANSFER";
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// 게임 관련 기본 타입
export interface BaseGame {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API 응답 기본 형태
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 이벤트 기본 타입
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}

// 메타데이터 타입
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// 소프트 삭제 지원
export interface SoftDeletable {
  deletedAt?: Date | null;
}

// 감사 가능한 엔티티
export interface Auditable extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
}

// 상태 관리 타입
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Result 패턴 헬퍼 함수들
export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E extends DomainError>(error: E): Result<never, E> => ({
  success: false,
  error,
});
