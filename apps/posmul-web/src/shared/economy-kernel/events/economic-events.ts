/**
 * Economic Domain Events
 *
 * 경제 시스템의 도메인 이벤트들을 정의합니다.
 * 모든 경제 데이터 변경은 이러한 이벤트를 통해서만 수행됩니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PredictionGameId,
  PredictionId,
  UserId,
} from "@/shared/types/branded-types";
import { DomainEvent } from "@/shared/types/common";

/**
 * 경제 도메인 이벤트 인터페이스
 */
export interface EconomicDomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly version: number;
}

/**
 * 경제 이벤트 기본 클래스
 */
export abstract class BaseEconomicEvent implements DomainEvent {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly version: number = 1;

  constructor(
    public readonly type: string,
    public readonly aggregateId: string,
    public readonly data: Record<string, unknown>,
    timestamp?: Date
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = timestamp ?? new Date();
  }
}

/**
 * PMP 획득 이벤트
 */
export class PmpEarnedEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly amount: number,
    public readonly source:
      | "major-league"
      | "brainstorming"
      | "debate"
      | "forum-participation"
      | "investment-completion"
      | "system-reward",
    public readonly sourceId: string,
    public readonly details?: string,
    timestamp?: Date
  ) {
    super(
      "PmpEarnedEvent",
      userId,
      {
        userId,
        amount,
        source,
        sourceId,
        details,
      },
      timestamp
    );
  }
}

/**
 * PMP 소비 이벤트
 */
export class PmpSpentEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly amount: number,
    public readonly purpose:
      | "prediction-participation"
      | "system-fee"
      | "premium-feature"
      | "investment-participation",
    public readonly targetId: string,
    public readonly details?: string,
    timestamp?: Date
  ) {
    super(
      "PmpSpentEvent",
      userId,
      {
        userId,
        amount,
        purpose,
        targetId,
        details,
      },
      timestamp
    );
  }
}

/**
 * PMC 획득 이벤트
 */
export class PmcEarnedEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly amount: number,
    public readonly source:
      | "local-league"
      | "cloud-funding"
      | "prediction-success"
      | "gift-aid"
      | "money-wave-distribution"
      | "donation-redistribution",
    public readonly sourceId: string,
    public readonly details?: string,
    timestamp?: Date
  ) {
    super(
      "PmcEarnedEvent",
      userId,
      {
        userId,
        amount,
        source,
        sourceId,
        details,
      },
      timestamp
    );
  }
}

/**
 * PMC 소비 이벤트
 */
export class PmcSpentEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly amount: number,
    public readonly purpose:
      | "donation"
      | "investment"
      | "system-fee"
      | "premium-feature"
      | "investment-participation",
    public readonly targetId: string,
    public readonly details?: string,
    timestamp?: Date
  ) {
    super(
      "PmcSpentEvent",
      userId,
      {
        userId,
        amount,
        purpose,
        targetId,
        details,
      },
      timestamp
    );
  }
}

/**
 * 예측 게임 참여 관련 복합 이벤트
 */
export class PredictionParticipationEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly gameId: PredictionGameId,
    public readonly predictionId: PredictionId,
    public readonly stakeAmount: number,
    public readonly confidence: number,
    public readonly selectedOptionId: string,
    timestamp?: Date
  ) {
    super(
      "PredictionParticipationEvent",
      gameId,
      {
        userId,
        gameId,
        predictionId,
        stakeAmount,
        confidence,
        selectedOptionId,
      },
      timestamp
    );
  }
}

/**
 * 예측 결과 정산 이벤트
 */
export class PredictionSettlementEvent extends BaseEconomicEvent {
  constructor(
    public readonly gameId: PredictionGameId,
    public readonly correctOptionId: string,
    public readonly totalStakePool: number,
    public readonly winnerCount: number,
    public readonly settlementResults: Array<{
      userId: UserId;
      predictionId: PredictionId;
      isWinner: boolean;
      stakeAmount: number;
      rewardAmount: number;
      accuracyScore: number;
    }>,
    timestamp?: Date
  ) {
    super(
      "PredictionSettlementEvent",
      gameId,
      {
        gameId,
        correctOptionId,
        totalStakePool,
        winnerCount,
        settlementResults,
      },
      timestamp
    );
  }
}

/**
 * 계정 생성 이벤트
 */
export class AccountCreatedEvent extends BaseEconomicEvent {
  constructor(
    public readonly userId: UserId,
    public readonly initialPmpBalance: number = 0,
    public readonly initialPmcBalance: number = 0,
    timestamp?: Date
  ) {
    super(
      "AccountCreatedEvent",
      userId,
      {
        userId,
        initialPmpBalance,
        initialPmcBalance,
      },
      timestamp
    );
  }
}

/**
 * Money Wave 분배 이벤트
 */
export class MoneyWaveDistributionEvent extends BaseEconomicEvent {
  constructor(
    public readonly waveId: string,
    public readonly waveType: "type1" | "type2" | "type3",
    public readonly totalAmount: number,
    public readonly recipientCount: number,
    public readonly distributionCriteria: string,
    public readonly distributions: Array<{
      userId: UserId;
      amount: number;
      reason: string;
    }>,
    timestamp?: Date
  ) {
    super(
      "MoneyWaveDistributionEvent",
      waveId,
      {
        waveId,
        waveType,
        totalAmount,
        recipientCount,
        distributionCriteria,
        distributions,
      },
      timestamp
    );
  }
}

/**
 * 도메인 이벤트 발행자 인터페이스
 */
export interface IDomainEventPublisher {
  /**
   * 단일 이벤트 발행
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * 다중 이벤트 발행
   */
  publishBatch(events: DomainEvent[]): Promise<void>;
}

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  /**
   * 이벤트 타입
   */
  readonly eventType: string;

  /**
   * 이벤트 처리
   */
  handle(event: T): Promise<void>;
}

/**
 * 이벤트 스토어 인터페이스
 */
export interface IEventStore {
  /**
   * 이벤트 저장
   */
  saveEvent(event: DomainEvent): Promise<void>;

  /**
   * 특정 집합체의 이벤트 스트림 조회
   */
  getEventStream(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * 이벤트 타입별 조회
   */
  getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]>;

  /**
   * 특정 기간의 이벤트 조회
   */
  getEventsByTimeRange(startTime: Date, endTime: Date): Promise<DomainEvent[]>;
}

/**
 * 경제 이벤트 유틸리티 함수들
 */
export class EconomicEventUtils {
  /**
   * 이벤트가 PMP 관련인지 확인
   */
  static isPmpEvent(event: DomainEvent): boolean {
    return event.type === "PmpEarnedEvent" || event.type === "PmpSpentEvent";
  }

  /**
   * 이벤트가 PMC 관련인지 확인
   */
  static isPmcEvent(event: DomainEvent): boolean {
    return event.type === "PmcEarnedEvent" || event.type === "PmcSpentEvent";
  }

  /**
   * 이벤트가 예측 게임 관련인지 확인
   */
  static isPredictionEvent(event: DomainEvent): boolean {
    return (
      event.type === "PredictionParticipationEvent" ||
      event.type === "PredictionSettlementEvent"
    );
  }

  /**
   * 사용자별 이벤트 필터링
   */
  static filterEventsByUser(
    events: DomainEvent[],
    userId: UserId
  ): DomainEvent[] {
    return events.filter((event) => {
      // 타입 가드를 통해 안전하게 접근
      if ("userId" in event) {
        return (event as DomainEvent & { userId: UserId }).userId === userId;
      }
      return false;
    });
  }

  /**
   * 시간 범위별 이벤트 필터링
   */
  static filterEventsByTimeRange(
    events: DomainEvent[],
    startTime: Date,
    endTime: Date
  ): DomainEvent[] {
    return events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }
}
