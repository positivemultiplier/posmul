/**
 * 도메인별 커스텀 에러 클래스 정의
 */

// 임시 해결책: app.constants 의존성을 제거하기 위해 에러 코드를 직접 정의합니다.
// TODO: 이 상수들을 @posmul/shared-types 패키지로 옮겨야 합니다.
const ERROR_CODES = {
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_INSUFFICIENT_POINTS: "USER_INSUFFICIENT_POINTS",
  GAME_NOT_FOUND: "GAME_NOT_FOUND",
  GAME_ALREADY_ENDED: "GAME_ALREADY_ENDED",
  PREDICTION_DEADLINE_PASSED: "PREDICTION_DEADLINE_PASSED",
  STORE_NOT_FOUND: "STORE_NOT_FOUND",
  STORE_NOT_ACTIVE: "STORE_NOT_ACTIVE",
  NETWORK_ERROR: "NETWORK_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

// 기본 애플리케이션 에러
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Error 클래스 상속 시 필요한 설정
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 인증 관련 에러
export class AuthenticationError extends BaseError {
  constructor(
    message: string = "인증이 필요합니다.",
    code: string = ERROR_CODES.AUTH_UNAUTHORIZED
  ) {
    super(message, code, 401);
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor(message: string = "잘못된 인증 정보입니다.") {
    super(message, ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message: string = "토큰이 만료되었습니다.") {
    super(message, ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
  }
}

// 검증 관련 에러
export class ValidationError extends BaseError {
  public readonly field?: string;
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string = "입력 값이 유효하지 않습니다.",
    field?: string,
    validationErrors?: Record<string, string[]>
  ) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400);
    this.field = field;
    this.validationErrors = validationErrors;
  }
}

// 사용자 관련 에러
export class UserNotFoundError extends BaseError {
  constructor(message: string = "사용자를 찾을 수 없습니다.") {
    super(message, ERROR_CODES.USER_NOT_FOUND, 404);
  }
}

export class UserAlreadyExistsError extends BaseError {
  constructor(message: string = "이미 존재하는 사용자입니다.") {
    super(message, ERROR_CODES.USER_ALREADY_EXISTS, 409);
  }
}

export class InsufficientPointsError extends BaseError {
  public readonly currentPoints: number;
  public readonly requiredPoints: number;

  constructor(
    currentPoints: number,
    requiredPoints: number,
    message: string = "포인트가 부족합니다."
  ) {
    super(message, ERROR_CODES.USER_INSUFFICIENT_POINTS, 400);
    this.currentPoints = currentPoints;
    this.requiredPoints = requiredPoints;
  }
}

// 게임 관련 에러
export class GameNotFoundError extends BaseError {
  constructor(message: string = "게임을 찾을 수 없습니다.") {
    super(message, ERROR_CODES.GAME_NOT_FOUND, 404);
  }
}

export class GameAlreadyEndedError extends BaseError {
  constructor(message: string = "이미 종료된 게임입니다.") {
    super(message, ERROR_CODES.GAME_ALREADY_ENDED, 400);
  }
}

export class PredictionDeadlinePassedError extends BaseError {
  constructor(message: string = "예측 마감 시간이 지났습니다.") {
    super(message, ERROR_CODES.PREDICTION_DEADLINE_PASSED, 400);
  }
}

// 매장 관련 에러
export class StoreNotFoundError extends BaseError {
  constructor(message: string = "매장을 찾을 수 없습니다.") {
    super(message, ERROR_CODES.STORE_NOT_FOUND, 404);
  }
}

export class StoreNotActiveError extends BaseError {
  constructor(message: string = "활성화되지 않은 매장입니다.") {
    super(message, ERROR_CODES.STORE_NOT_ACTIVE, 400);
  }
}

// 외부 서비스 관련 에러
export class ExternalServiceError extends BaseError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(
    service: string,
    message: string = "외부 서비스 연동 중 오류가 발생했습니다.",
    originalError?: Error
  ) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502);
    this.service = service;
    this.originalError = originalError;
  }
}

// 네트워크 관련 에러
export class NetworkError extends BaseError {
  constructor(message: string = "네트워크 연결에 문제가 있습니다.") {
    super(message, ERROR_CODES.NETWORK_ERROR, 503);
  }
}

// 권한 관련 에러
export class ForbiddenError extends BaseError {
  constructor(message: string = "접근 권한이 없습니다.") {
    super(message, "FORBIDDEN", 403);
  }
}

// 리소스 중복 에러
export class ConflictError extends BaseError {
  constructor(message: string = "이미 존재하는 리소스입니다.") {
    super(message, "CONFLICT", 409);
  }
}

// 비즈니스 로직 에러
export class BusinessLogicError extends BaseError {
  constructor(message: string, code: string = "BUSINESS_LOGIC_ERROR") {
    super(message, code, 400);
  }
}

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

// 에러 응답 형태 변환 유틸리티
export function formatErrorResponse(error: Error) {
  if (error instanceof BaseError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(error instanceof ValidationError &&
          error.validationErrors && {
            validationErrors: error.validationErrors,
          }),
        ...(error instanceof InsufficientPointsError && {
          currentPoints: error.currentPoints,
          requiredPoints: error.requiredPoints,
        }),
      },
    };
  }

  // 예상하지 못한 에러의 경우
  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "서버 내부 오류가 발생했습니다.",
      statusCode: 500,
    },
  };
}
