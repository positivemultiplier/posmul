import { ERROR_CODES } from "./error-codes";
// 기본 애플리케이션 에러
export class BaseError extends Error {
    constructor(message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, statusCode = 500, isOperational = true) {
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
