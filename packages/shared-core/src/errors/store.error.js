import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 매장 관련 에러
export class StoreNotFoundError extends BaseError {
    constructor(message = "매장을 찾을 수 없습니다.") {
        super(message, ERROR_CODES.STORE_NOT_FOUND, 404);
    }
}
export class StoreNotActiveError extends BaseError {
    constructor(message = "활성화되지 않은 매장입니다.") {
        super(message, ERROR_CODES.STORE_NOT_ACTIVE, 400);
    }
}
