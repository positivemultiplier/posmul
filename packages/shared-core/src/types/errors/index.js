/**
 * 공용 에러 클래스들
 */
import { BaseError } from "./base.error";
import { RepositoryError } from "./repository.error";
export class UseCaseError extends BaseError {
    constructor(message, cause) {
        super(message, "USE_CASE_ERROR", 400);
        if (cause) {
            this.cause = cause;
        }
    }
}
export class ValidationError extends BaseError {
    constructor(message, field) {
        super(message, "VALIDATION_ERROR", 400);
        this.field = field;
    }
}
export class DomainError extends BaseError {
    constructor(code, message = "Domain error occurred") {
        super(message, code, 400);
    }
}
export class NotFoundError extends BaseError {
    constructor(message) {
        super(message, "NOT_FOUND", 404, false);
    }
}
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
    return { success: true, data };
}
export function failure(error) {
    return { success: false, error };
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
