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
import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 게임 관련 에러
var GameNotFoundError = /** @class */ (function (_super) {
    __extends(GameNotFoundError, _super);
    function GameNotFoundError(message) {
        if (message === void 0) { message = "게임을 찾을 수 없습니다."; }
        return _super.call(this, message, ERROR_CODES.GAME_NOT_FOUND, 404) || this;
    }
    return GameNotFoundError;
}(BaseError));
export { GameNotFoundError };
var GameAlreadyEndedError = /** @class */ (function (_super) {
    __extends(GameAlreadyEndedError, _super);
    function GameAlreadyEndedError(message) {
        if (message === void 0) { message = "이미 종료된 게임입니다."; }
        return _super.call(this, message, ERROR_CODES.GAME_ALREADY_ENDED, 400) || this;
    }
    return GameAlreadyEndedError;
}(BaseError));
export { GameAlreadyEndedError };
var PredictionDeadlinePassedError = /** @class */ (function (_super) {
    __extends(PredictionDeadlinePassedError, _super);
    function PredictionDeadlinePassedError(message) {
        if (message === void 0) { message = "예측 마감 시간이 지났습니다."; }
        return _super.call(this, message, ERROR_CODES.PREDICTION_DEADLINE_PASSED, 400) || this;
    }
    return PredictionDeadlinePassedError;
}(BaseError));
export { PredictionDeadlinePassedError };
