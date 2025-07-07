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
// 인증 관련 에러
var AuthenticationError = /** @class */ (function (_super) {
    __extends(AuthenticationError, _super);
    function AuthenticationError(message, code) {
        if (message === void 0) { message = "인증이 필요합니다."; }
        if (code === void 0) { code = ERROR_CODES.AUTH_UNAUTHORIZED; }
        return _super.call(this, message, code, 401) || this;
    }
    return AuthenticationError;
}(BaseError));
export { AuthenticationError };
var InvalidCredentialsError = /** @class */ (function (_super) {
    __extends(InvalidCredentialsError, _super);
    function InvalidCredentialsError(message) {
        if (message === void 0) { message = "잘못된 인증 정보입니다."; }
        return _super.call(this, message, ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401) || this;
    }
    return InvalidCredentialsError;
}(BaseError));
export { InvalidCredentialsError };
var TokenExpiredError = /** @class */ (function (_super) {
    __extends(TokenExpiredError, _super);
    function TokenExpiredError(message) {
        if (message === void 0) { message = "토큰이 만료되었습니다."; }
        return _super.call(this, message, ERROR_CODES.AUTH_TOKEN_EXPIRED, 401) || this;
    }
    return TokenExpiredError;
}(BaseError));
export { TokenExpiredError };
//# sourceMappingURL=authentication.error.js.map