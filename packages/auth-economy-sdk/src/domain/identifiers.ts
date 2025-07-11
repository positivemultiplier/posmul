/**
 * 도메인 식별자 타입 정의
 * 강타입 시스템으로 타입 안전성 보장
 */

declare const __brand: unique symbol;

/**
 * 브랜드 타입 생성 유틸리티
 */
export type Brand<T, TBrand> = T & { [__brand]: TBrand };

/**
 * 사용자 식별자
 */
export type UserId = Brand<string, "UserId">;

/**
 * 예측 게임 식별자
 */
export type PredictionGameId = string & { readonly brand: "PredictionGameId" };

/**
 * 예측 식별자
 */
export type PredictionId = string & { readonly brand: "PredictionId" };

/**
 * 거래 식별자
 */
export type TransactionId = string & { readonly brand: "TransactionId" };

/**
 * 예측 정확도 (0-1 범위)
 */
export type AccuracyScore = Brand<number, "AccuracyScore">;

// 팩토리 함수들
export const createUserId = (id: string): UserId => id as UserId;
export const createPredictionId = (id: string): PredictionId =>
  id as PredictionId;
export const createPredictionGameId = (id: string): PredictionGameId =>
  id as PredictionGameId;
export const createTransactionId = (id: string): TransactionId =>
  id as TransactionId;
export const createAccuracyScore = (score: number): AccuracyScore => {
  if (score < 0 || score > 1) {
    throw new Error("AccuracyScore must be between 0 and 1");
  }
  return score as AccuracyScore;
};

// 타입 가드 함수들
export const isValidUserId = (value: string): value is UserId => {
  return typeof value === "string" && value.length > 0;
};

export const isValidPredictionId = (value: string): value is PredictionId => {
  return typeof value === "string" && value.length > 0;
};

export const isValidPredictionGameId = (
  value: string
): value is PredictionGameId => {
  return typeof value === "string" && value.length > 0;
};

export const isValidTransactionId = (value: string): value is TransactionId => {
  return typeof value === "string" && value.length > 0;
};
