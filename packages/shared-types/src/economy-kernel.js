/**
 * Economy Kernel Types
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
// Economy Kernel Error
var EconomyKernelError = /** @class */ (function (_super) {
    __extends(EconomyKernelError, _super);
    function EconomyKernelError(message, code, cause) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.cause = cause;
        _this.name = "EconomyKernelError";
        return _this;
    }
    return EconomyKernelError;
}(Error));
export { EconomyKernelError };
// Economic Error
var EconomicError = /** @class */ (function (_super) {
    __extends(EconomicError, _super);
    function EconomicError(message, economicType) {
        var _this = _super.call(this, message) || this;
        _this.economicType = economicType;
        _this.name = "EconomicError";
        return _this;
    }
    return EconomicError;
}(Error));
export { EconomicError };
//# sourceMappingURL=economy-kernel.js.map