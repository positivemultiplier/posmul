/**
 * 공용 에러 클래스들
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
import { BaseError } from "./base.error";
import { RepositoryError } from "./repository.error";
var UseCaseError = /** @class */ (function (_super) {
    __extends(UseCaseError, _super);
    function UseCaseError(message, cause) {
        var _this = _super.call(this, message, "USE_CASE_ERROR", 400) || this;
        if (cause) {
            _this.cause = cause;
        }
        return _this;
    }
    return UseCaseError;
}(BaseError));
export { UseCaseError };
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, field) {
        var _this = _super.call(this, message, "VALIDATION_ERROR", 400) || this;
        _this.field = field;
        return _this;
    }
    return ValidationError;
}(BaseError));
export { ValidationError };
var DomainError = /** @class */ (function (_super) {
    __extends(DomainError, _super);
    function DomainError(code, message) {
        if (message === void 0) { message = "Domain error occurred"; }
        return _super.call(this, message, code, 400) || this;
    }
    return DomainError;
}(BaseError));
export { DomainError };
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        return _super.call(this, message, "NOT_FOUND", 404, false) || this;
    }
    return NotFoundError;
}(BaseError));
export { NotFoundError };
export * from "./authentication.error";
export * from "./authorization.error";
export * from "./base.error";
export * from "./business-logic.error";
export * from "./error-codes";
export * from "./error-guards";
export * from "./game.error";
export * from "./resource.error";
export * from "./service.error";
export * from "./store.error";
export * from "./user.error";
export * from "./validation.error";
export function success(data) {
    return { success: true, data: data };
}
export function failure(error) {
    return { success: false, error: error };
}
export function isSuccess(result) {
    return result.success === true;
}
export function isFailure(result) {
    return result.success === false;
}
export function unwrap(result) {
    if (isSuccess(result)) {
        return result.data;
    }
    throw new Error(result.error instanceof Error ? result.error.message : String(result.error));
}
export function unwrapOr(result, defaultValue) {
    return isSuccess(result) ? result.data : defaultValue;
}
export function mapResult(result, mapper) {
    return isSuccess(result) ? success(mapper(result.data)) : result;
}
export function mapError(result, mapper) {
    return isFailure(result) ? failure(mapper(result.error)) : result;
}
export { RepositoryError };
export * from "./business-rule.error";
export * from "./repository.error";
export * from "./use-case.error";
//# sourceMappingURL=index.js.map