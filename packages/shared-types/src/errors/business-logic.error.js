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
// 비즈니스 로직 에러
var BusinessLogicError = /** @class */ (function (_super) {
    __extends(BusinessLogicError, _super);
    function BusinessLogicError(message, code) {
        if (code === void 0) { code = ERROR_CODES.BUSINESS_LOGIC_ERROR; }
        return _super.call(this, message, code, 400) || this;
    }
    return BusinessLogicError;
}(BaseError));
export { BusinessLogicError };
