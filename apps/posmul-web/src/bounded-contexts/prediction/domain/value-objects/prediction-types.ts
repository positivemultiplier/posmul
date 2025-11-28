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
export enum GameStatus {
  PENDING = "PENDING",
  CREATED = "CREATED",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * GameStatus 유틸리티 클래스
 */
export class GameStatusUtil {
  constructor(public readonly value: GameStatus) {}

  isActive(): boolean {
    return this.value === "ACTIVE";
  }

  isEnded(): boolean {
    return this.value === "ENDED";
  }

  isSettled(): boolean {
    return this.value === "COMPLETED" || this.value === "CANCELLED";
  }

  isCreated(): boolean {
    return this.value === "CREATED";
  }

  isCompleted(): boolean {
    return this.value === "COMPLETED";
  }

  isCancelled(): boolean {
    return this.value === "CANCELLED";
  }

  toString(): GameStatus {
    return this.value;
  }
}

/**
 * 예측 상태
 */
export type PredictionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "EVALUATED"
  | "SETTLED";
