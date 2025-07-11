/**
 * 공통 타입 정의 (마이그레이션 호환성)
 * Auto-generated: 2025-07-07T22:09:20.059Z
 */

// Re-export SDK types first
export * from "@posmul/auth-economy-sdk";
import type {
  PredictionId,
  PredictionGameId,
  PmpAmount,
  PmcAmount,
} from "@posmul/auth-economy-sdk";

// SDK에 없는 타입들
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// 유틸리티 함수들
export const createPredictionId = (value: string): PredictionId =>
  value as PredictionId;
export const createPredictionGameId = (value: string): PredictionGameId =>
  value as PredictionGameId;

// 타입 가드들
export const isPredictionId = (value: unknown): value is PredictionId =>
  typeof value === "string" && value.length > 0;

export const isPmpAmount = (value: unknown): value is PmpAmount =>
  typeof value === "number" && value >= 0;

export const isPmcAmount = (value: unknown): value is PmcAmount =>
  typeof value === "number" && value >= 0;

// Re-export SDK types
export * from "@posmul/auth-economy-sdk";
