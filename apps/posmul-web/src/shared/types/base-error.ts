/**
 * Base Error 클래스 정의
 * UI 컴포넌트에서 사용하는 표준 에러 클래스
 */

export class BaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = "BaseError";

    // V8에서 스택 트레이스 정리
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseError);
    }
  }

  /**
   * 에러를 JSON으로 직렬화
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      stack: this.stack,
    };
  }

  /**
   * 사용자에게 보여줄 메시지 반환
   */
  getUserMessage(): string {
    if (this.isOperational) {
      return this.message;
    }
    return "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

/**
 * 비즈니스 로직 오류
 */
export class BusinessError extends BaseError {
  constructor(message: string, code?: string) {
    super(message, code, 400, true);
    this.name = "BusinessError";
  }
}

/**
 * 검증 오류
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any
  ) {
    super(message, "VALIDATION_ERROR", 400, true);
    this.name = "ValidationError";
  }
}

/**
 * 네트워크 오류
 */
export class NetworkError extends BaseError {
  constructor(message: string, statusCode?: number) {
    super(message, "NETWORK_ERROR", statusCode || 500, true);
    this.name = "NetworkError";
  }
}

/**
 * 시스템 오류 (운영 불가능)
 */
export class SystemError extends BaseError {
  constructor(message: string, originalError?: Error) {
    super(
      `시스템 오류: ${message}${originalError ? ` (${originalError.message})` : ""}`,
      "SYSTEM_ERROR",
      500,
      false // 운영 불가능한 오류
    );
    this.name = "SystemError";

    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * 에러 타입 가드
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function isBusinessError(error: unknown): error is BusinessError {
  return error instanceof BusinessError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isSystemError(error: unknown): error is SystemError {
  return error instanceof SystemError;
}

/**
 * 에러 생성 헬퍼 함수들
 */
export const createBusinessError = (message: string, code?: string) =>
  new BusinessError(message, code);

export const createValidationError = (
  message: string,
  field?: string,
  value?: any
) => new ValidationError(message, field, value);

export const createNetworkError = (message: string, statusCode?: number) =>
  new NetworkError(message, statusCode);

export const createSystemError = (message: string, originalError?: Error) =>
  new SystemError(message, originalError);

/**
 * 기본 에러 인스턴스 (하위 호환성)
 */
export default BaseError;
