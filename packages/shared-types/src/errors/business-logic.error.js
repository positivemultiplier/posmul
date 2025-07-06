import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 비즈니스 로직 에러
export class BusinessLogicError extends BaseError {
    constructor(message, code = ERROR_CODES.BUSINESS_LOGIC_ERROR) {
        super(message, code, 400);
    }
}
