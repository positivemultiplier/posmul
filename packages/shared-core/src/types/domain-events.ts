/**
 * 도메인 이벤트 타입 정의
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

// 기본 도메인 이벤트 인터페이스
export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly data: Record<string, unknown>;
  readonly version: number;
  readonly timestamp: Date;
}

// 기본 도메인 이벤트 추상 클래스
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    type: string,
    aggregateId: string,
    data: Record<string, unknown>,
    version: number = 1
  ) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.aggregateId = aggregateId;
    this.data = data;
    this.version = version;
    this.timestamp = new Date();
  }
}

// 이벤트 핸들러 인터페이스
export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// 이벤트 버스 인터페이스
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
}

// 일반적인 도메인 이벤트 타입들
export const EventTypes = {
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",

  PREDICTION_GAME_CREATED: "PREDICTION_GAME_CREATED",
  PREDICTION_GAME_STARTED: "PREDICTION_GAME_STARTED",
  PREDICTION_GAME_ENDED: "PREDICTION_GAME_ENDED",

  PREDICTION_CREATED: "PREDICTION_CREATED",
  PREDICTION_UPDATED: "PREDICTION_UPDATED",

  POINTS_EARNED: "POINTS_EARNED",
  POINTS_SPENT: "POINTS_SPENT",
  POINTS_TRANSFERRED: "POINTS_TRANSFERRED",

  LOCAL_LEAGUE_TRANSACTION: "LOCAL_LEAGUE_TRANSACTION",
  MAJOR_LEAGUE_VIEW: "MAJOR_LEAGUE_VIEW",

  STORE_REGISTERED: "STORE_REGISTERED",
  STORE_UPDATED: "STORE_UPDATED",
} as const;

// 구체적인 도메인 이벤트 예시들
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(userId: string, userData: Record<string, unknown>) {
    super(EventTypes.USER_CREATED, userId, userData);
  }
}

export class PointsEarnedEvent extends BaseDomainEvent {
  constructor(
    userId: string,
    pointData: {
      amount: number;
      type: "PMC" | "PMP";
      source: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(EventTypes.POINTS_EARNED, userId, pointData);
  }
}

export class PredictionGameCreatedEvent extends BaseDomainEvent {
  constructor(gameId: string, gameData: Record<string, unknown>) {
    super(EventTypes.PREDICTION_GAME_CREATED, gameId, gameData);
  }
}

// Economic Domain Events
export class PmpEarnedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly source: "major-league" | "brainstorming" | "debate",
    public readonly sourceId: string
  ) {
    super(EventTypes.POINTS_EARNED, userId, {
      amount,
      type: "PMP",
      source,
      sourceId,
    });
  }
}

export class PmcEarnedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly source:
      | "local-league"
      | "cloud-funding"
      | "prediction-success"
      | "gift-aid",
    public readonly sourceId: string
  ) {
    super(EventTypes.POINTS_EARNED, userId, {
      amount,
      type: "PMC",
      source,
      sourceId,
    });
  }
}

export class PmpSpentEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly purpose:
      | "prediction-participation"
      | "investment-participation",
    public readonly targetId: string
  ) {
    super(EventTypes.POINTS_SPENT, userId, {
      amount,
      type: "PMP",
      purpose,
      targetId,
    });
  }
}

export class PmcSpentEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly amount: number,
    public readonly purpose:
      | "donation"
      | "local-investment"
      | "investment-participation",
    public readonly targetId: string
  ) {
    super(EventTypes.POINTS_SPENT, userId, {
      amount,
      type: "PMC",
      purpose,
      targetId,
    });
  }
}
