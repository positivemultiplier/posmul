/**
 * 도메인 이벤트 타입 정의
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// 기본 도메인 이벤트 추상 클래스
var BaseDomainEvent = /** @class */ (function () {
    function BaseDomainEvent(type, aggregateId, data, version) {
        if (version === void 0) { version = 1; }
        this.id = crypto.randomUUID();
        this.type = type;
        this.aggregateId = aggregateId;
        this.data = data;
        this.version = version;
        this.timestamp = new Date();
    }
    return BaseDomainEvent;
}());
export { BaseDomainEvent };
// 일반적인 도메인 이벤트 타입들
export var EventTypes = {
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
var UserCreatedEvent = /** @class */ (function (_super) {
    __extends(UserCreatedEvent, _super);
    function UserCreatedEvent(userId, userData) {
        return _super.call(this, EventTypes.USER_CREATED, userId, userData) || this;
    }
    return UserCreatedEvent;
}(BaseDomainEvent));
export { UserCreatedEvent };
var PointsEarnedEvent = /** @class */ (function (_super) {
    __extends(PointsEarnedEvent, _super);
    function PointsEarnedEvent(userId, pointData) {
        return _super.call(this, EventTypes.POINTS_EARNED, userId, pointData) || this;
    }
    return PointsEarnedEvent;
}(BaseDomainEvent));
export { PointsEarnedEvent };
var PredictionGameCreatedEvent = /** @class */ (function (_super) {
    __extends(PredictionGameCreatedEvent, _super);
    function PredictionGameCreatedEvent(gameId, gameData) {
        return _super.call(this, EventTypes.PREDICTION_GAME_CREATED, gameId, gameData) || this;
    }
    return PredictionGameCreatedEvent;
}(BaseDomainEvent));
export { PredictionGameCreatedEvent };
// Economic Domain Events
var PmpEarnedEvent = /** @class */ (function (_super) {
    __extends(PmpEarnedEvent, _super);
    function PmpEarnedEvent(userId, amount, source, sourceId) {
        var _this = _super.call(this, EventTypes.POINTS_EARNED, userId, {
            amount: amount,
            type: "PMP",
            source: source,
            sourceId: sourceId,
        }) || this;
        _this.userId = userId;
        _this.amount = amount;
        _this.source = source;
        _this.sourceId = sourceId;
        return _this;
    }
    return PmpEarnedEvent;
}(BaseDomainEvent));
export { PmpEarnedEvent };
var PmcEarnedEvent = /** @class */ (function (_super) {
    __extends(PmcEarnedEvent, _super);
    function PmcEarnedEvent(userId, amount, source, sourceId) {
        var _this = _super.call(this, EventTypes.POINTS_EARNED, userId, {
            amount: amount,
            type: "PMC",
            source: source,
            sourceId: sourceId,
        }) || this;
        _this.userId = userId;
        _this.amount = amount;
        _this.source = source;
        _this.sourceId = sourceId;
        return _this;
    }
    return PmcEarnedEvent;
}(BaseDomainEvent));
export { PmcEarnedEvent };
var PmpSpentEvent = /** @class */ (function (_super) {
    __extends(PmpSpentEvent, _super);
    function PmpSpentEvent(userId, amount, purpose, targetId) {
        var _this = _super.call(this, EventTypes.POINTS_SPENT, userId, {
            amount: amount,
            type: "PMP",
            purpose: purpose,
            targetId: targetId,
        }) || this;
        _this.userId = userId;
        _this.amount = amount;
        _this.purpose = purpose;
        _this.targetId = targetId;
        return _this;
    }
    return PmpSpentEvent;
}(BaseDomainEvent));
export { PmpSpentEvent };
var PmcSpentEvent = /** @class */ (function (_super) {
    __extends(PmcSpentEvent, _super);
    function PmcSpentEvent(userId, amount, purpose, targetId) {
        var _this = _super.call(this, EventTypes.POINTS_SPENT, userId, {
            amount: amount,
            type: "PMC",
            purpose: purpose,
            targetId: targetId,
        }) || this;
        _this.userId = userId;
        _this.amount = amount;
        _this.purpose = purpose;
        _this.targetId = targetId;
        return _this;
    }
    return PmcSpentEvent;
}(BaseDomainEvent));
export { PmcSpentEvent };
//# sourceMappingURL=domain-events.js.map