/**
 * 공용 에러 클래스들
 */
import { BaseError } from "./base.error";
import { RepositoryError } from "./repository.error";
export declare class UseCaseError extends BaseError {
    constructor(message: string, cause?: Error);
}
export declare class ValidationError extends BaseError {
    field: string;
    constructor(message: string, field: string);
}
export declare class DomainError extends BaseError {
    constructor(code: string, message?: string);
}
export declare class NotFoundError extends BaseError {
    constructor(message: string);
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
export type Result<T, E = BaseError> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export declare function success<T, E = BaseError>(data: T): Result<T, E>;
export declare function failure<T, E = BaseError>(error: E): Result<T, E>;
export declare function isSuccess<T, E = BaseError>(result: Result<T, E>): result is {
    success: true;
    data: T;
};
export declare function isFailure<T, E = BaseError>(result: Result<T, E>): result is {
    success: false;
    error: E;
};
export declare function unwrap<T, E = BaseError>(result: Result<T, E>): T;
export declare function unwrapOr<T, E = BaseError>(result: Result<T, E>, defaultValue: T): T;
export declare function mapResult<T, U, E = BaseError>(result: Result<T, E>, mapper: (data: T) => U): Result<U, E>;
export declare function mapError<T, E1 = BaseError, E2 = BaseError>(result: Result<T, E1>, mapper: (error: E1) => E2): Result<T, E2>;
export { RepositoryError };
export * from "./business-rule.error";
export * from "./repository.error";
export * from "./use-case.error";
