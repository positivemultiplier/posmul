/**
 * 공용 에러 클래스들
 */

import { BaseError } from "./base.error";
import { RepositoryError } from "./repository.error";

export class UseCaseError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, "USE_CASE_ERROR", 400);
    if (cause) {
      (this as any).cause = cause;
    }
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    public field: string
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class DomainError extends BaseError {
  constructor(message: string, code: string = "DOMAIN_ERROR") {
    super(message, code, 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
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

export type Result<T, E = BaseError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T, E = BaseError>(data: T): Result<T, E> {
  return { success: true, data };
}

export function failure<T, E = BaseError>(error: E): Result<T, E> {
  return { success: false, error };
}

export function isSuccess<T, E = BaseError>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success === true;
}

export function isFailure<T, E = BaseError>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return result.success === false;
}

export function unwrap<T, E = BaseError>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(
    result.error instanceof Error ? result.error.message : String(result.error)
  );
}

export function unwrapOr<T, E = BaseError>(
  result: Result<T, E>,
  defaultValue: T
): T {
  return isSuccess(result) ? result.data : defaultValue;
}

export function mapResult<T, U, E = BaseError>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> {
  return isSuccess(result) ? success(mapper(result.data)) : result;
}

export function mapError<T, E1 = BaseError, E2 = BaseError>(
  result: Result<T, E1>,
  mapper: (error: E1) => E2
): Result<T, E2> {
  return isFailure(result) ? failure(mapper(result.error)) : result;
}

export { RepositoryError };

export * from "./business-rule.error";
export * from "./repository.error";
export * from "./use-case.error";
