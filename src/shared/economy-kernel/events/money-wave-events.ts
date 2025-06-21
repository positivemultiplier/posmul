/**
 * Money Wave Domain Events
 *
 * MoneyWave 시스템의 도메인 이벤트들을 정의합니다.
 * 3단계 MoneyWave 분배 시스템의 각 단계별 이벤트를 포함합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { BaseDomainEvent } from "@/shared/events/domain-events";
import { PredictionGameId, UserId } from "@/shared/types/branded-types";

/**
 * MoneyWave 분배 타입
 */
export type MoneyWaveDistributionType =
  | "wave1-daily-ebit-pool"
  | "wave2-unused-pmc-redistribution"
  | "wave3-entrepreneur-incentive";

/**
 * MoneyWave 분배 기준
 */
export interface DistributionCriteria {
  readonly gameImportance: number;
  readonly difficultyMultiplier: number;
  readonly timeDecayFactor: number;
  readonly participantCount: number;
  readonly accuracyThreshold: number;
}

/**
 * MoneyWave 수혜자 정보
 */
export interface WaveRecipient {
  readonly userId: UserId;
  readonly amount: number;
  readonly reason: string;
  readonly accuracyScore?: number;
  readonly contributionWeight?: number;
}

/**
 * MoneyWave1 - EBIT 기반 일일 상금 풀 생성 이벤트
 */
export class MoneyWave1PrizePoolCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly date: string, // YYYY-MM-DD
    public readonly totalEbitAmount: number,
    public readonly allocatedPrizePool: number,
    public readonly allocationPercentage: number,
    public readonly activeGamesCount: number,
    public readonly distributionCriteria: DistributionCriteria
  ) {
    super("MoneyWave1PrizePoolCreated", `prize-pool-${date}`, {
      date,
      totalEbitAmount,
      allocatedPrizePool,
      allocationPercentage,
      activeGamesCount,
      distributionCriteria,
    });
  }
}

/**
 * MoneyWave1 - 게임별 상금 배정 이벤트
 */
export class MoneyWave1GamePrizeAllocatedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly prizeAmount: number,
    public readonly gameImportance: number,
    public readonly difficultyLevel: number,
    public readonly estimatedParticipants: number,
    public readonly allocationTimestamp: Date = new Date()
  ) {
    super("MoneyWave1GamePrizeAllocated", gameId, {
      gameId,
      prizeAmount,
      gameImportance,
      difficultyLevel,
      estimatedParticipants,
      allocationTimestamp: allocationTimestamp.toISOString(),
    });
  }
}

/**
 * MoneyWave1 - 상금 분배 완료 이벤트
 */
export class MoneyWave1DistributionCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly totalPrizeAmount: number,
    public readonly winnerCount: number,
    public readonly averageAccuracy: number,
    public readonly recipients: WaveRecipient[],
    public readonly distributionTimestamp: Date = new Date()
  ) {
    super("MoneyWave1DistributionCompleted", gameId, {
      gameId,
      totalPrizeAmount,
      winnerCount,
      averageAccuracy,
      recipients,
      distributionTimestamp: distributionTimestamp.toISOString(),
    });
  }
}

/**
 * MoneyWave2 - 미소비 PMC 감지 이벤트
 */
export class MoneyWave2UnusedPmcDetectedEvent extends BaseDomainEvent {
  constructor(
    public readonly detectionDate: string, // YYYY-MM-DD
    public readonly totalUnusedPmc: number,
    public readonly eligibleUsers: Array<{
      userId: UserId;
      unusedAmount: number;
      lastActivityDate: Date;
      inactivityDays: number;
    }>,
    public readonly redistributionThreshold: number
  ) {
    super("MoneyWave2UnusedPmcDetected", `unused-pmc-${detectionDate}`, {
      detectionDate,
      totalUnusedPmc,
      eligibleUsers,
      redistributionThreshold,
    });
  }
}

/**
 * MoneyWave2 - PMC 재분배 실행 이벤트
 */
export class MoneyWave2RedistributionExecutedEvent extends BaseDomainEvent {
  constructor(
    public readonly redistributionId: string,
    public readonly sourceUsers: Array<{
      userId: UserId;
      collectedAmount: number;
    }>,
    public readonly targetUsers: Array<{
      userId: UserId;
      distributedAmount: number;
      activityScore: number;
    }>,
    public readonly totalRedistributed: number,
    public readonly redistributionDate: Date = new Date()
  ) {
    super("MoneyWave2RedistributionExecuted", redistributionId, {
      redistributionId,
      sourceUsers,
      targetUsers,
      totalRedistributed,
      redistributionDate: redistributionDate.toISOString(),
    });
  }
}

/**
 * MoneyWave3 - 기업가 맞춤 예측 요청 이벤트
 */
export class MoneyWave3CustomPredictionRequestedEvent extends BaseDomainEvent {
  constructor(
    public readonly requestId: string,
    public readonly entrepreneurId: UserId,
    public readonly businessQuestion: string,
    public readonly targetAudience: string[],
    public readonly incentiveAmount: number,
    public readonly expectedParticipants: number,
    public readonly deadlineDate: Date,
    public readonly requestDate: Date = new Date()
  ) {
    super("MoneyWave3CustomPredictionRequested", requestId, {
      requestId,
      entrepreneurId,
      businessQuestion,
      targetAudience,
      incentiveAmount,
      expectedParticipants,
      deadlineDate: deadlineDate.toISOString(),
      requestDate: requestDate.toISOString(),
    });
  }
}

/**
 * MoneyWave3 - 맞춤 예측 게임 생성 이벤트
 */
export class MoneyWave3CustomPredictionCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly requestId: string,
    public readonly entrepreneurId: UserId,
    public readonly gameTitle: string,
    public readonly targetIncentivePool: number,
    public readonly minimumParticipants: number,
    public readonly createdDate: Date = new Date()
  ) {
    super("MoneyWave3CustomPredictionCreated", gameId, {
      gameId,
      requestId,
      entrepreneurId,
      gameTitle,
      targetIncentivePool,
      minimumParticipants,
      createdDate: createdDate.toISOString(),
    });
  }
}

/**
 * MoneyWave3 - 기업가 인센티브 분배 이벤트
 */
export class MoneyWave3IncentiveDistributedEvent extends BaseDomainEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly entrepreneurId: UserId,
    public readonly totalIncentive: number,
    public readonly participantCount: number,
    public readonly businessInsights: string[],
    public readonly recipients: WaveRecipient[],
    public readonly distributionDate: Date = new Date()
  ) {
    super("MoneyWave3IncentiveDistributed", gameId, {
      gameId,
      entrepreneurId,
      totalIncentive,
      participantCount,
      businessInsights,
      recipients,
      distributionDate: distributionDate.toISOString(),
    });
  }
}

/**
 * Agency Theory 기반 인센티브 조정 이벤트
 */
export class AgencyTheoryIncentiveAdjustedEvent extends BaseDomainEvent {
  constructor(
    public readonly adjustmentId: string,
    public readonly gameId: PredictionGameId,
    public readonly originalIncentive: number,
    public readonly adjustedIncentive: number,
    public readonly adjustmentReason:
      | "moral-hazard-mitigation"
      | "adverse-selection-prevention"
      | "information-asymmetry-correction"
      | "principal-agent-alignment",
    public readonly agencyMetrics: {
      informationAsymmetryScore: number;
      moralHazardRisk: number;
      incentiveAlignment: number;
    },
    public readonly adjustmentDate: Date = new Date()
  ) {
    super("AgencyTheoryIncentiveAdjusted", adjustmentId, {
      adjustmentId,
      gameId,
      originalIncentive,
      adjustedIncentive,
      adjustmentReason,
      agencyMetrics,
      adjustmentDate: adjustmentDate.toISOString(),
    });
  }
}

/**
 * MoneyWave 이벤트 유틸리티
 */
export class MoneyWaveEventUtils {
  /**
   * Wave 타입별 이벤트 필터링
   */
  static filterByWaveType(
    events: BaseDomainEvent[],
    waveType: MoneyWaveDistributionType
  ): BaseDomainEvent[] {
    const typeMap: Record<MoneyWaveDistributionType, string[]> = {
      "wave1-daily-ebit-pool": [
        "MoneyWave1PrizePoolCreated",
        "MoneyWave1GamePrizeAllocated",
        "MoneyWave1DistributionCompleted",
      ],
      "wave2-unused-pmc-redistribution": [
        "MoneyWave2UnusedPmcDetected",
        "MoneyWave2RedistributionExecuted",
      ],
      "wave3-entrepreneur-incentive": [
        "MoneyWave3CustomPredictionRequested",
        "MoneyWave3CustomPredictionCreated",
        "MoneyWave3IncentiveDistributed",
      ],
    };

    return events.filter((event) => typeMap[waveType].includes(event.type));
  }

  /**
   * 사용자별 MoneyWave 수혜 내역 추출
   */
  static extractUserBenefits(
    events: BaseDomainEvent[],
    userId: UserId
  ): Array<{
    eventType: string;
    amount: number;
    timestamp: Date;
    source: string;
  }> {
    const benefits: Array<{
      eventType: string;
      amount: number;
      timestamp: Date;
      source: string;
    }> = [];

    events.forEach((event) => {
      if (event.type === "MoneyWave1DistributionCompleted") {
        const distributionEvent = event as MoneyWave1DistributionCompletedEvent;
        const userRecipient = distributionEvent.recipients.find(
          (r) => r.userId === userId
        );
        if (userRecipient) {
          benefits.push({
            eventType: event.type,
            amount: userRecipient.amount,
            timestamp: event.timestamp,
            source: `Game ${distributionEvent.gameId}`,
          });
        }
      }

      if (event.type === "MoneyWave2RedistributionExecuted") {
        const redistributionEvent =
          event as MoneyWave2RedistributionExecutedEvent;
        const userTarget = redistributionEvent.targetUsers.find(
          (t) => t.userId === userId
        );
        if (userTarget) {
          benefits.push({
            eventType: event.type,
            amount: userTarget.distributedAmount,
            timestamp: event.timestamp,
            source: "PMC Redistribution",
          });
        }
      }

      if (event.type === "MoneyWave3IncentiveDistributed") {
        const incentiveEvent = event as MoneyWave3IncentiveDistributedEvent;
        const userRecipient = incentiveEvent.recipients.find(
          (r) => r.userId === userId
        );
        if (userRecipient) {
          benefits.push({
            eventType: event.type,
            amount: userRecipient.amount,
            timestamp: event.timestamp,
            source: `Entrepreneur ${incentiveEvent.entrepreneurId}`,
          });
        }
      }
    });

    return benefits.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * MoneyWave 효율성 메트릭 계산
   */
  static calculateWaveEfficiency(events: BaseDomainEvent[]): {
    wave1Efficiency: number;
    wave2Efficiency: number;
    wave3Efficiency: number;
    overallEfficiency: number;
  } {
    const wave1Events = this.filterByWaveType(events, "wave1-daily-ebit-pool");
    const wave2Events = this.filterByWaveType(
      events,
      "wave2-unused-pmc-redistribution"
    );
    const wave3Events = this.filterByWaveType(
      events,
      "wave3-entrepreneur-incentive"
    );

    // 간단한 효율성 메트릭 (실제로는 더 복잡한 계산 필요)
    const wave1Efficiency = wave1Events.length > 0 ? 0.85 : 0;
    const wave2Efficiency = wave2Events.length > 0 ? 0.78 : 0;
    const wave3Efficiency = wave3Events.length > 0 ? 0.92 : 0;

    const overallEfficiency =
      (wave1Efficiency + wave2Efficiency + wave3Efficiency) / 3;

    return {
      wave1Efficiency,
      wave2Efficiency,
      wave3Efficiency,
      overallEfficiency,
    };
  }
}

/**
 * MoneyWave 이벤트 타입 상수
 */
export const MoneyWaveEventTypes = {
  // Wave 1
  MONEY_WAVE_1_PRIZE_POOL_CREATED: "MoneyWave1PrizePoolCreated",
  MONEY_WAVE_1_GAME_PRIZE_ALLOCATED: "MoneyWave1GamePrizeAllocated",
  MONEY_WAVE_1_DISTRIBUTION_COMPLETED: "MoneyWave1DistributionCompleted",

  // Wave 2
  MONEY_WAVE_2_UNUSED_PMC_DETECTED: "MoneyWave2UnusedPmcDetected",
  MONEY_WAVE_2_REDISTRIBUTION_EXECUTED: "MoneyWave2RedistributionExecuted",

  // Wave 3
  MONEY_WAVE_3_CUSTOM_PREDICTION_REQUESTED:
    "MoneyWave3CustomPredictionRequested",
  MONEY_WAVE_3_CUSTOM_PREDICTION_CREATED: "MoneyWave3CustomPredictionCreated",
  MONEY_WAVE_3_INCENTIVE_DISTRIBUTED: "MoneyWave3IncentiveDistributed",

  // Agency Theory
  AGENCY_THEORY_INCENTIVE_ADJUSTED: "AgencyTheoryIncentiveAdjusted",
} as const;
