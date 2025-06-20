/**
 * 공통 도메인 타입 정의
 */

// 기본 ID 타입들
export type BaseId = string;

// 도메인 에러 클래스
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// 결과 패턴 타입
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 포인트 시스템 기본 타입
export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'PMC' | 'PMP';
  transactionType: 'EARN' | 'SPEND' | 'TRANSFER';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// 게임 관련 기본 타입
export interface BaseGame {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
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
  id: string;
  type: string;
  aggregateId: string;
  data: Record<string, unknown>;
  version: number;
  timestamp: Date;
}

// 메타데이터 타입
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
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
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}
