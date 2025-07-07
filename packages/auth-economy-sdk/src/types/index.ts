/**
 * Auth-Economy SDK 공통 타입 정의
 * 
 * 이 파일은 인증과 경제 시스템 간 공유되는 타입만 포함합니다.
 * 도메인별 타입은 각각 auth/types, economy/types에 정의됩니다.
 */

// === 브랜드 타입 시스템 ===
declare const __brand: unique symbol;
export type Brand<T, TBrand> = T & { [__brand]: TBrand };

// === 핵심 식별자 타입 ===
export type UserId = Brand<string, "UserId">;
export type PredictionGameId = string & { readonly brand: "PredictionGameId" };
export type PredictionId = string & { readonly brand: "PredictionId" };
export type TransactionId = string & { readonly brand: "TransactionId" };

// === 경제 시스템 타입 ===
export type PMP = Brand<number, "PMP">;
export type PMC = Brand<number, "PMC">;
export type AccuracyScore = Brand<number, "AccuracyScore">;

// === 공통 결과 타입 ===
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// === 결과 타입 유틸리티 ===
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
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
  sortOrder?: 'asc' | 'desc';
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
export * from './domain-events';

// === 환경 설정 타입 ===
export interface SdkConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableEconomy?: boolean;
  debug?: boolean;
}

// === 도메인별 타입은 각 모듈에서 re-export ===
// 사용법:
// import { UserId, Email, User } from '@posmul/auth-economy-sdk/auth';
// import { PmpAmount, PmcAmount, EconomicBalance } from '@posmul/auth-economy-sdk/economy';
