/**
 * Prediction Game Domain Events
 *
 * 예측 게임 도메인의 모든 이벤트들을 정의합니다.
 * PD-004에서 구현된 Use Cases에서 발생하는 이벤트들을 포함합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { BaseDomainEvent } from "@posmul/auth-economy-sdk";
import { PredictionGameId, PredictionId, UserId } from "@posmul/auth-economy-sdk";

import { GameStatus } from "../value-objects/game-status";
import { PredictionType } from "../value-objects/prediction-types";

/**
 * 예측 게임 생성 이벤트
 */
export class PredictionGameCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly title: string,
    public readonly description: string,
    public readonly predictionType: PredictionType,
    public readonly createdBy: UserId,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly prizePool?: number
  ) {
    super("PredictionGameCreated", gameId, {
      gameId,
      title,
      description,
      predictionType,
      createdBy,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool,
    });
  }
}

/**
 * 예측 게임 시작 이벤트
 */
export class PredictionGameStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly startedAt: Date = new Date()
  ) {
    super("PredictionGameStarted", gameId, {
      gameId,
      startedAt: startedAt.toISOString(),
    });
  }
}

/**
 * 예측 게임 종료 이벤트
 */
export class PredictionGameEndedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly endedAt: Date = new Date(),
    public readonly totalParticipants: number,
    public readonly totalStakeAmount: number
  ) {
    super("PredictionGameEnded", gameId, {
      gameId,
      endedAt: endedAt.toISOString(),
      totalParticipants,
      totalStakeAmount,
    });
  }
}

/**
 * 예측 참여 이벤트 (PD-004에서 생성)
 */
export class PredictionParticipatedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly predictionId: PredictionId,
    public readonly userId: UserId,
    public readonly selectedOptionId: string,
    public readonly confidence: number,
    public readonly stakeAmount: number,
    public readonly participatedAt: Date = new Date()
  ) {
    super("PredictionParticipated", gameId, {
      gameId,
      predictionId,
      userId,
      selectedOptionId,
      confidence,
      stakeAmount,
      participatedAt: participatedAt.toISOString(),
    });
  }
}

/**
 * PMP 예측 참여 지불 이벤트 (PD-004에서 생성)
 */
export class PmpSpentForPredictionEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly gameId: PredictionGameId,
    public readonly amount: number,
    public readonly transactionId: string,
    public readonly spentAt: Date = new Date()
  ) {
    super("PmpSpentForPrediction", userId, {
      userId,
      gameId,
      amount,
      transactionId,
      spentAt: spentAt.toISOString(),
    });
  }
}

/**
 * 예측 게임 정산 이벤트 (PD-004에서 생성)
 */
export class PredictionGameSettledEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly correctAnswers: Record<string, unknown>,
    public readonly totalParticipants: number,
    public readonly winnerCount: number,
    public readonly totalPrizePool: number,
    public readonly averageAccuracy: number,
    public readonly settledAt: Date = new Date()
  ) {
    super("PredictionGameSettled", gameId, {
      gameId,
      correctAnswers,
      totalParticipants,
      winnerCount,
      totalPrizePool,
      averageAccuracy,
      settledAt: settledAt.toISOString(),
    });
  }
}

/**
 * PMC 예측 보상 지급 이벤트 (PD-004에서 생성)
 */
export class PmcEarnedFromPredictionEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly gameId: PredictionGameId,
    public readonly predictionId: PredictionId,
    public readonly amount: number,
    public readonly accuracyScore: number,
    public readonly transactionId: string,
    public readonly earnedAt: Date = new Date()
  ) {
    super("PmcEarnedFromPrediction", userId, {
      userId,
      gameId,
      predictionId,
      amount,
      accuracyScore,
      transactionId,
      earnedAt: earnedAt.toISOString(),
    });
  }
}

/**
 * MoneyWave 분배 시작 이벤트 (PD-004에서 생성)
 */
export class MoneyWaveDistributionStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly distributionId: string,
    public readonly distributionType: "wave1" | "wave2" | "wave3",
    public readonly totalAmount: number,
    public readonly eligibleGamesCount: number,
    public readonly startedAt: Date = new Date()
  ) {
    super("MoneyWaveDistributionStarted", distributionId, {
      distributionId,
      distributionType,
      totalAmount,
      eligibleGamesCount,
      startedAt: startedAt.toISOString(),
    });
  }
}

/**
 * MoneyWave 분배 완료 이벤트 (PD-004에서 생성)
 */
export class MoneyWaveDistributionCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly distributionId: string,
    public readonly distributionType: "wave1" | "wave2" | "wave3",
    public readonly totalDistributed: number,
    public readonly recipientCount: number,
    public readonly distributions: Array<{
      gameId: PredictionGameId;
      amount: number;
      participantCount: number;
    }>,
    public readonly completedAt: Date = new Date()
  ) {
    super("MoneyWaveDistributionCompleted", distributionId, {
      distributionId,
      distributionType,
      totalDistributed,
      recipientCount,
      distributions,
      completedAt: completedAt.toISOString(),
    });
  }
}

/**
 * 예측 게임 상태 변경 이벤트
 */
export class PredictionGameStatusChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly previousStatus: GameStatus,
    public readonly newStatus: GameStatus,
    public readonly changedBy: UserId,
    public readonly reason?: string,
    public readonly changedAt: Date = new Date()
  ) {
    super("PredictionGameStatusChanged", gameId, {
      gameId,
      previousStatus,
      newStatus,
      changedBy,
      reason,
      changedAt: changedAt.toISOString(),
    });
  }
}

/**
 * 예측 정확도 계산 완료 이벤트
 */
export class PredictionAccuracyCalculatedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly predictions: Array<{
      predictionId: PredictionId;
      userId: UserId;
      accuracyScore: number;
      isWinner: boolean;
    }>,
    public readonly averageAccuracy: number,
    public readonly calculatedAt: Date = new Date()
  ) {
    super("PredictionAccuracyCalculated", gameId, {
      gameId,
      predictions,
      averageAccuracy,
      calculatedAt: calculatedAt.toISOString(),
    });
  }
}

/**
 * 예측 게임 이벤트 유틸리티
 */
export class PredictionGameEventUtils {
  /**
   * 게임 생명주기 이벤트 필터링
   */
  static filterLifecycleEvents(events: BaseDomainEvent[]): BaseDomainEvent[] {
    const lifecycleEventTypes = [
      "PredictionGameCreated",
      "PredictionGameStarted",
      "PredictionGameEnded",
      "PredictionGameSettled",
      "PredictionGameStatusChanged",
    ];

    return events.filter((event) => lifecycleEventTypes.includes(event.type));
  }

  /**
   * 경제 관련 이벤트 필터링
   */
  static filterEconomicEvents(events: BaseDomainEvent[]): BaseDomainEvent[] {
    const economicEventTypes = [
      "PmpSpentForPrediction",
      "PmcEarnedFromPrediction",
      "MoneyWaveDistributionStarted",
      "MoneyWaveDistributionCompleted",
    ];

    return events.filter((event) => economicEventTypes.includes(event.type));
  }

  /**
   * 사용자별 이벤트 필터링
   */
  static filterByUser(
    events: BaseDomainEvent[],
    userId: UserId
  ): BaseDomainEvent[] {
    return events.filter((event) => {
      const data = event.data;
      return (
        data.userId === userId ||
        data.createdBy === userId ||
        data.changedBy === userId
      );
    });
  }

  /**
   * 게임별 이벤트 필터링
   */
  static filterByGame(
    events: BaseDomainEvent[],
    gameId: PredictionGameId
  ): BaseDomainEvent[] {
    return events.filter((event) => {
      return event.aggregateId === gameId || event.data.gameId === gameId;
    });
  }

  /**
   * 이벤트 통계 계산
   */
  static calculateEventStats(events: BaseDomainEvent[]): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsTimeline: Array<{ date: string; count: number }>;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByDate: Record<string, number> = {};

    events.forEach((event) => {
      // 타입별 집계
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // 일자별 집계
      const dateKey = event.timestamp.toISOString().split("T")[0];
      eventsByDate[dateKey] = (eventsByDate[dateKey] || 0) + 1;
    });

    const eventsTimeline = Object.entries(eventsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEvents: events.length,
      eventsByType,
      eventsTimeline,
    };
  }
}

/**
 * 예측 게임 이벤트 타입 상수
 */
export const PredictionGameEventTypes = {
  // 게임 생명주기
  PREDICTION_GAME_CREATED: "PredictionGameCreated",
  PREDICTION_GAME_STARTED: "PredictionGameStarted",
  PREDICTION_GAME_ENDED: "PredictionGameEnded",
  PREDICTION_GAME_SETTLED: "PredictionGameSettled",
  PREDICTION_GAME_STATUS_CHANGED: "PredictionGameStatusChanged",

  // 예측 참여
  PREDICTION_PARTICIPATED: "PredictionParticipated",
  PREDICTION_ACCURACY_CALCULATED: "PredictionAccuracyCalculated",

  // 경제 시스템 연동
  PMP_SPENT_FOR_PREDICTION: "PmpSpentForPrediction",
  PMC_EARNED_FROM_PREDICTION: "PmcEarnedFromPrediction",

  // MoneyWave 시스템
  MONEY_WAVE_DISTRIBUTION_STARTED: "MoneyWaveDistributionStarted",
  MONEY_WAVE_DISTRIBUTION_COMPLETED: "MoneyWaveDistributionCompleted",
} as const;
