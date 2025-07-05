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
// 사용자 관련 에러
var UserNotFoundError = /** @class */ (function (_super) {
    __extends(UserNotFoundError, _super);
    function UserNotFoundError(message) {
        if (message === void 0) { message = "사용자를 찾을 수 없습니다."; }
        return _super.call(this, message, ERROR_CODES.USER_NOT_FOUND, 404) || this;
    }
    return UserNotFoundError;
}(BaseError));
export { UserNotFoundError };
var UserAlreadyExistsError = /** @class */ (function (_super) {
    __extends(UserAlreadyExistsError, _super);
    function UserAlreadyExistsError(message) {
        if (message === void 0) { message = "이미 존재하는 사용자입니다."; }
        return _super.call(this, message, ERROR_CODES.USER_ALREADY_EXISTS, 409) || this;
    }
    return UserAlreadyExistsError;
}(BaseError));
export { UserAlreadyExistsError };
var InsufficientPointsError = /** @class */ (function (_super) {
    __extends(InsufficientPointsError, _super);
    function InsufficientPointsError(currentPoints, requiredPoints, message) {
        if (message === void 0) { message = "포인트가 부족합니다."; }
        var _this = _super.call(this, message, ERROR_CODES.USER_INSUFFICIENT_POINTS, 400) || this;
        _this.currentPoints = currentPoints;
        _this.requiredPoints = requiredPoints;
        return _this;
    }
    return InsufficientPointsError;
}(BaseError));
export { InsufficientPointsError };
