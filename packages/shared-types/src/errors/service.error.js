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
// 외부 서비스 관련 에러
var ExternalServiceError = /** @class */ (function (_super) {
    __extends(ExternalServiceError, _super);
    function ExternalServiceError(service, message, originalError) {
        if (message === void 0) { message = "외부 서비스 연동 중 오류가 발생했습니다."; }
        var _this = _super.call(this, message, ERROR_CODES.EXTERNAL_SERVICE_ERROR, 502) || this;
        _this.service = service;
        _this.originalError = originalError;
        return _this;
    }
    return ExternalServiceError;
}(BaseError));
export { ExternalServiceError };
// 네트워크 관련 에러
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(message) {
        if (message === void 0) { message = "네트워크 연결에 문제가 있습니다."; }
        return _super.call(this, message, ERROR_CODES.NETWORK_ERROR, 503) || this;
    }
    return NetworkError;
}(BaseError));
export { NetworkError };
//# sourceMappingURL=service.error.js.map