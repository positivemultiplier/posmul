import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";

// 권한 관련 에러
export class ForbiddenError extends BaseError {
  constructor(message: string = "접근 권한이 없습니다.") {
    super(message, ERROR_CODES.FORBIDDEN, 403);
  }
}
