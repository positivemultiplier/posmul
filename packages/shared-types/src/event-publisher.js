/**
 * Domain Event Publisher Implementation
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
/**
 * 이벤트 발행 오류
 */
var PublishError = /** @class */ (function (_super) {
    __extends(PublishError, _super);
    function PublishError(message, cause, eventType) {
        var _this = _super.call(this, message) || this;
        _this.cause = cause;
        _this.eventType = eventType;
        _this.name = "PublishError";
        return _this;
    }
    return PublishError;
}(Error));
export { PublishError };
/**
 * 이벤트 핸들러 오류
 */
var HandlerError = /** @class */ (function (_super) {
    __extends(HandlerError, _super);
    function HandlerError(message, cause, subscriberId) {
        var _this = _super.call(this, message) || this;
        _this.cause = cause;
        _this.subscriberId = subscriberId;
        _this.name = "HandlerError";
        return _this;
    }
    return HandlerError;
}(Error));
export { HandlerError };
//# sourceMappingURL=event-publisher.js.map