/**
 * Prediction Use Case DTOs
 *
 * 예측 도메인의 모든 Use Case에서 사용되는 DTO들을 정의합니다.
 * Clean Architecture의 Application Layer에서 사용되는 데이터 전송 객체들입니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PredictionGameId,
  PredictionId,
  UserId,
} from "../../../../shared/types/branded-types";

/**
 * 예측 게임 생성 요청 DTO
 */
export interface CreatePredictionGameRequest {
  readonly title: string;
  readonly description: string;
  readonly predictionType: "binary" | "wdl" | "ranking";
  readonly options: Array<{ id: string; label: string; description?: string }>;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly createdBy: UserId;
  readonly importance: "low" | "medium" | "high" | "critical";
  readonly difficulty: "easy" | "medium" | "hard" | "expert";
  readonly minimumStake: number;
  readonly maximumStake: number;
  readonly maxParticipants?: number;
}

/**
 * 예측 게임 생성 응답 DTO
 */
export interface CreatePredictionGameResponse {
  readonly gameId: string;
  readonly allocatedPrizePool: number;
  readonly estimatedParticipants: number;
  readonly gameImportanceScore: number;
}

/**
 * 예측 참여 요청 DTO
 */
export interface ParticipatePredictionRequest {
  readonly userId: UserId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stakeAmount: number; // PMP 스테이크 금액
  readonly confidence: number; // 0-1 사이 신뢰도
  readonly reasoning?: string; // 선택 이유 (선택사항)
}

/**
 * 예측 참여 응답 DTO
 */
export interface ParticipatePredictionResponse {
  readonly predictionId: PredictionId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stakeAmount: number;
  readonly confidence: number;
  readonly remainingPmpBalance: number;
  readonly currentParticipants: number;
  readonly totalStakePool: number;
}

/**
 * 예측 게임 정산 요청 DTO
 */
export interface SettlePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly correctOptionId: string;
  readonly adminUserId: UserId; // 정산을 실행하는 관리자
  readonly finalResults?: Record<string, any>; // 추가 결과 데이터
}

/**
 * 예측 게임 정산 응답 DTO
 */
export interface SettlePredictionGameResponse {
  readonly gameId: PredictionGameId;
  readonly correctOptionId: string;
  readonly totalParticipants: number;
  readonly winnersCount: number;
  readonly totalStakePool: number;
  readonly totalRewardDistributed: number;
  readonly averageAccuracyScore: number;
  readonly settlementResults: Array<{
    userId: UserId;
    predictionId: PredictionId;
    selectedOptionId: string;
    isWinner: boolean;
    stakeAmount: number;
    accuracyScore: number;
    rewardAmount: number;
  }>;
}

/**
 * Money Wave 분배 타입
 */
export enum MoneyWaveDistributionType {
  DAILY_PRIZE_POOL = "DAILY_PRIZE_POOL", // Wave 1: 일일 상금 풀
  UNUSED_PMC_REDISTRIBUTION = "UNUSED_PMC_REDISTRIBUTION", // Wave 2: 미소비 PMC 재분배
  ENTREPRENEUR_REQUEST = "ENTREPRENEUR_REQUEST", // Wave 3: 기업가 요청
}

/**
 * Money Wave 분배 요청 DTO
 */
export interface DistributeMoneyWaveRequest {
  readonly waveType: MoneyWaveDistributionType;
  readonly triggerUserId: UserId; // 분배를 트리거한 사용자 (시스템일 경우 admin)
  readonly targetGameIds?: PredictionGameId[]; // 대상 게임들 (Wave 1용)
  readonly targetUserIds?: UserId[]; // 대상 사용자들 (Wave 2용)
  readonly customCriteria?: Record<string, any>; // 맞춤형 기준 (Wave 3용)
  readonly metadata?: Record<string, any>; // 추가 메타데이터
}

/**
 * Money Wave 분배 응답 DTO
 */
export interface DistributeMoneyWaveResponse {
  readonly waveId: string;
  readonly waveType: MoneyWaveDistributionType;
  readonly totalAmountDistributed: number;
  readonly recipientCount: number;
  readonly distributionResults: Array<{
    userId: UserId;
    amount: number;
    reason: string;
    success: boolean;
    error?: string;
  }>;
  readonly efficiency: number; // 분배 효율성 (0-1)
  readonly agencyCostReduction: number; // Agency Cost 감소량
}

/**
 * 공통 응답 래퍼
 */
export interface UseCaseResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, any>;
  };
  readonly metadata?: {
    readonly timestamp: Date;
    readonly executionTime: number;
    readonly version: string;
  };
}
