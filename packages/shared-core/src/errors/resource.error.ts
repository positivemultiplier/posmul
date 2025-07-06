import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";

// 리소스 중복 에러
export class ConflictError extends BaseError {
  constructor(message: string = "이미 존재하는 리소스입니다.") {
    super(message, ERROR_CODES.CONFLICT, 409);
  }
}
