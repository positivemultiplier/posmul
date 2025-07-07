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
// 매장 관련 에러
var StoreNotFoundError = /** @class */ (function (_super) {
    __extends(StoreNotFoundError, _super);
    function StoreNotFoundError(message) {
        if (message === void 0) { message = "매장을 찾을 수 없습니다."; }
        return _super.call(this, message, ERROR_CODES.STORE_NOT_FOUND, 404) || this;
    }
    return StoreNotFoundError;
}(BaseError));
export { StoreNotFoundError };
var StoreNotActiveError = /** @class */ (function (_super) {
    __extends(StoreNotActiveError, _super);
    function StoreNotActiveError(message) {
        if (message === void 0) { message = "활성화되지 않은 매장입니다."; }
        return _super.call(this, message, ERROR_CODES.STORE_NOT_ACTIVE, 400) || this;
    }
    return StoreNotActiveError;
}(BaseError));
export { StoreNotActiveError };
//# sourceMappingURL=store.error.js.map