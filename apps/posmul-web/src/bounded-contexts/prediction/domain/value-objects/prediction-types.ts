/**
 * Prediction Domain Value Objects - Types
 *
 * 예측 도메인의 타입 정의
 */

import { UserId } from "@posmul/auth-economy-sdk";


/**
 * 예측 타입
 */
export enum PredictionType {
  BINARY = "binary",
  WIN_DRAW_LOSE = "wdl",
  RANKING = "ranking",
}

/**
 * 예측 옵션
 */
export interface GameOption {
  id: string;
  label: string;
  description?: string;
}

export type GameOptions = GameOption[];

/**
 * 예측 결과
 */
export interface PredictionResultValue {
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
