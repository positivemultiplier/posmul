/**
 * Prediction Domain Value Objects - Types
 *
 * 예측 도메인의 타입 정의
 */

import { UserId } from "@/shared/types/branded-types";

/**
 * 예측 타입
 */
export type PredictionType =
  | "BINARY"
  | "MULTIPLE_CHOICE"
  | "NUMERICAL"
  | "CATEGORICAL";

/**
 * 예측 옵션
 */
export interface PredictionOption {
  id: string;
  label: string;
  description?: string;
  odds?: number;
}

/**
 * 예측 결과
 */
export interface PredictionResult {
  predictionId: string;
  userId: UserId;
  selectedOptionId: string;
  confidence: number;
  stakeAmount: number;
  isCorrect?: boolean;
  accuracyScore?: number;
  rewardAmount?: number;
}

/**
 * 게임 상태
 */
export type GameStatus =
  | "CREATED"
  | "ACTIVE"
  | "ENDED"
  | "COMPLETED"
  | "CANCELLED";

/**
 * 예측 상태
 */
export type PredictionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "EVALUATED"
  | "SETTLED";
