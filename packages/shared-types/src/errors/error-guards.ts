import { AuthenticationError } from "./authentication.error";
import { BaseError } from "./base.error";
import { ValidationError } from "./validation.error";

// 에러 타입 가드 함수들
export function isOperationalError(error: Error): error is BaseError {
  return error instanceof BaseError && error.isOperational;
}

export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(
  error: Error
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}
