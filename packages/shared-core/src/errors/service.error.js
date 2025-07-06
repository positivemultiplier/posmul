import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 외부 서비스 관련 에러
export class ExternalServiceError extends BaseError {
    constructor(service, message = "외부 서비스 연동 중 오류가 발생했습니다.", originalError) {
        super(message, ERROR_CODES.EXTERNAL_SERVICE_ERROR, 502);
        this.service = service;
        this.originalError = originalError;
    }
}
// 네트워크 관련 에러
export class NetworkError extends BaseError {
    constructor(message = "네트워크 연결에 문제가 있습니다.") {
        super(message, ERROR_CODES.NETWORK_ERROR, 503);
    }
}
