import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";

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
