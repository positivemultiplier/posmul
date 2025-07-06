/**
 * Universal MCP Types - Core Result Type
 *
 * 모든 MCP 작업에서 사용할 수 있는 통합 Result 타입 정의
 * 기존 shared-types의 Result를 확장하여 MCP 메타데이터 지원
 */
/**
 * 에러 타입 분류
 */
export var ErrorType;
(function (ErrorType) {
    /** MCP 작업 관련 에러 */
    ErrorType["MCP_OPERATION"] = "MCP_OPERATION";
    /** 유효성 검증 에러 */
    ErrorType["VALIDATION"] = "VALIDATION";
    /** 인증 에러 */
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    /** 권한 에러 */
    ErrorType["AUTHORIZATION"] = "AUTHORIZATION";
    /** 저장소 에러 */
    ErrorType["REPOSITORY"] = "REPOSITORY";
    /** 비즈니스 로직 에러 */
    ErrorType["BUSINESS_LOGIC"] = "BUSINESS_LOGIC";
    /** 인프라 에러 */
    ErrorType["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    /** 네트워크 에러 */
    ErrorType["NETWORK"] = "NETWORK";
    /** 외부 서비스 에러 */
    ErrorType["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    /** 알 수 없는 에러 */
    ErrorType["UNKNOWN"] = "UNKNOWN";
})(ErrorType || (ErrorType = {}));
/**
 * 에러 심각도
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    /** 낮음 - 로그만 기록 */
    ErrorSeverity["LOW"] = "LOW";
    /** 보통 - 사용자에게 알림 */
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    /** 높음 - 즉시 처리 필요 */
    ErrorSeverity["HIGH"] = "HIGH";
    /** 치명적 - 시스템 중단 */
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * 성공 결과 생성 헬퍼
 */
export function success(data, metadata) {
    if (metadata !== undefined) {
        return {
            success: true,
            data: data,
            metadata: metadata
        };
    }
    return {
        success: true,
        data: data
    };
}
/**
 * 실패 결과 생성 헬퍼
 */
export function failure(error, metadata) {
    if (metadata !== undefined) {
        return {
            success: false,
            error: error,
            metadata: metadata
        };
    }
    return {
        success: false,
        error: error
    };
}
/**
 * 타입 가드: 성공 결과인지 확인
 */
export function isSuccess(result) {
    return result.success === true;
}
/**
 * 타입 가드: 실패 결과인지 확인
 */
export function isFailure(result) {
    return result.success === false;
}
