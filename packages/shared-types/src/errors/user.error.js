import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 사용자 관련 에러
export class UserNotFoundError extends BaseError {
    constructor(message = "사용자를 찾을 수 없습니다.") {
        super(message, ERROR_CODES.USER_NOT_FOUND, 404);
    }
}
export class UserAlreadyExistsError extends BaseError {
    constructor(message = "이미 존재하는 사용자입니다.") {
        super(message, ERROR_CODES.USER_ALREADY_EXISTS, 409);
    }
}
export class InsufficientPointsError extends BaseError {
    constructor(currentPoints, requiredPoints, message = "포인트가 부족합니다.") {
        super(message, ERROR_CODES.USER_INSUFFICIENT_POINTS, 400);
        this.currentPoints = currentPoints;
        this.requiredPoints = requiredPoints;
    }
}
