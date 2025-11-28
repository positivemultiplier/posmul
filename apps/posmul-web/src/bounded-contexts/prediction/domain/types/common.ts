/**
 * SDK에 없는 공통 타입들의 로컬 정의
 * 마이그레이션 과정에서 필요한 임시 타입들
 */
// SDK에서 가져온 브랜드 타입들
import type { PredictionGameId, PredictionId } from "@posmul/auth-economy-sdk";

/**
 * 타임스탬프 인터페이스
 * createdAt과 updatedAt을 포함하는 공통 인터페이스
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 예측 결과 열거형
 * SDK에 없으므로 로컬에 정의
 */
export enum PredictionResult {
  CORRECT = "CORRECT",
  INCORRECT = "INCORRECT",
  CANCELLED = "CANCELLED",
}

/**
 * Prediction ID 생성 유틸 함수
 * SDK의 브랜드 타입과 호환되도록 구현
 */
export const createPredictionId = (value: string): PredictionId =>
  value as PredictionId;

/**
 * Prediction Game ID 생성 유틸 함수
 * SDK의 브랜드 타입과 호환되도록 구현
 */
export const createPredictionGameId = (value: string): PredictionGameId =>
  value as PredictionGameId;
