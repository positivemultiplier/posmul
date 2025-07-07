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
import { ERROR_CODES } from "./error-codes";
// 기본 애플리케이션 에러
var BaseError = /** @class */ (function (_super) {
    __extends(BaseError, _super);
    function BaseError(message, code, statusCode, isOperational) {
        if (code === void 0) { code = ERROR_CODES.INTERNAL_SERVER_ERROR; }
        if (statusCode === void 0) { statusCode = 500; }
        if (isOperational === void 0) { isOperational = true; }
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.code = code;
        _this.statusCode = statusCode;
        _this.isOperational = isOperational;
        // Error 클래스 상속 시 필요한 설정
        Object.setPrototypeOf(_this, _newTarget.prototype);
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return BaseError;
}(Error));
export { BaseError };
//# sourceMappingURL=base.error.js.map