import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";

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
