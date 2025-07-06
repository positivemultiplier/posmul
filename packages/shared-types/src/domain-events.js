/**
 * 도메인 이벤트 타입 정의
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
// 기본 도메인 이벤트 추상 클래스
export class BaseDomainEvent {
    constructor(type, aggregateId, data, version = 1) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.aggregateId = aggregateId;
        this.data = data;
        this.version = version;
        this.timestamp = new Date();
    }
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
};
// 구체적인 도메인 이벤트 예시들
export class UserCreatedEvent extends BaseDomainEvent {
    constructor(userId, userData) {
        super(EventTypes.USER_CREATED, userId, userData);
    }
}
export class PointsEarnedEvent extends BaseDomainEvent {
    constructor(userId, pointData) {
        super(EventTypes.POINTS_EARNED, userId, pointData);
    }
}
export class PredictionGameCreatedEvent extends BaseDomainEvent {
    constructor(gameId, gameData) {
        super(EventTypes.PREDICTION_GAME_CREATED, gameId, gameData);
    }
}
// Economic Domain Events
export class PmpEarnedEvent extends BaseDomainEvent {
    constructor(userId, amount, source, sourceId) {
        super(EventTypes.POINTS_EARNED, userId, {
            amount,
            type: "PMP",
            source,
            sourceId,
        });
        this.userId = userId;
        this.amount = amount;
        this.source = source;
        this.sourceId = sourceId;
    }
}
export class PmcEarnedEvent extends BaseDomainEvent {
    constructor(userId, amount, source, sourceId) {
        super(EventTypes.POINTS_EARNED, userId, {
            amount,
            type: "PMC",
            source,
            sourceId,
        });
        this.userId = userId;
        this.amount = amount;
        this.source = source;
        this.sourceId = sourceId;
    }
}
export class PmpSpentEvent extends BaseDomainEvent {
    constructor(userId, amount, purpose, targetId) {
        super(EventTypes.POINTS_SPENT, userId, {
            amount,
            type: "PMP",
            purpose,
            targetId,
        });
        this.userId = userId;
        this.amount = amount;
        this.purpose = purpose;
        this.targetId = targetId;
    }
}
export class PmcSpentEvent extends BaseDomainEvent {
    constructor(userId, amount, purpose, targetId) {
        super(EventTypes.POINTS_SPENT, userId, {
            amount,
            type: "PMC",
            purpose,
            targetId,
        });
        this.userId = userId;
        this.amount = amount;
        this.purpose = purpose;
        this.targetId = targetId;
    }
}
