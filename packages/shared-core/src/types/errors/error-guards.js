import { AuthenticationError } from "./authentication.error";
import { BaseError } from "./base.error";
import { ValidationError } from "./validation.error";
// 에러 타입 가드 함수들
export function isOperationalError(error) {
    return error instanceof BaseError && error.isOperational;
}
export function isValidationError(error) {
    return error instanceof ValidationError;
}
export function isAuthenticationError(error) {
    return error instanceof AuthenticationError;
}
