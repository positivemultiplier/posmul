/**
 * Universal MCP Types - Core Result Type
 *
 * 모든 MCP 작업에서 사용할 수 있는 통합 Result 타입 정의
 * 기존 shared-types의 Result를 확장하여 MCP 메타데이터 지원
 */
/**
 * 작업 결과의 메타데이터
 */
export interface ResultMetadata {
    /** 작업의 고유 식별자 */
    operationId?: string;
    /** 작업 실행 시간 (밀리초) */
    executionTime?: number;
    /** 재시도 횟수 */
    retryCount?: number;
    /** 작업 실행 타임스탬프 */
    timestamp?: Date;
    /** 추가 컨텍스트 정보 */
    context?: Record<string, unknown>;
}
/**
 * Universal Result 타입
 *
 * @template T - 성공 시 반환할 데이터 타입
 * @template E - 실패 시 반환할 에러 타입 (기본값: UniversalError)
 */
export type UniversalResult<T, E = UniversalError> = {
    success: true;
    data: T;
    metadata?: ResultMetadata;
} | {
    success: false;
    error: E;
    metadata?: ResultMetadata;
};
/**
 * 기본 에러 인터페이스
 */
export interface UniversalError {
    readonly code: string;
    readonly message: string;
    readonly type: ErrorType;
    readonly severity: ErrorSeverity;
    readonly timestamp?: Date;
    readonly context?: Record<string, unknown>;
    readonly cause?: Error;
}
/**
 * 에러 타입 분류
 */
export declare enum ErrorType {
    /** MCP 작업 관련 에러 */
    MCP_OPERATION = "MCP_OPERATION",
    /** 유효성 검증 에러 */
    VALIDATION = "VALIDATION",
    /** 인증 에러 */
    AUTHENTICATION = "AUTHENTICATION",
    /** 권한 에러 */
    AUTHORIZATION = "AUTHORIZATION",
    /** 저장소 에러 */
    REPOSITORY = "REPOSITORY",
    /** 비즈니스 로직 에러 */
    BUSINESS_LOGIC = "BUSINESS_LOGIC",
    /** 인프라 에러 */
    INFRASTRUCTURE = "INFRASTRUCTURE",
    /** 네트워크 에러 */
    NETWORK = "NETWORK",
    /** 외부 서비스 에러 */
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    /** 알 수 없는 에러 */
    UNKNOWN = "UNKNOWN"
}
/**
 * 에러 심각도
 */
export declare enum ErrorSeverity {
    /** 낮음 - 로그만 기록 */
    LOW = "LOW",
    /** 보통 - 사용자에게 알림 */
    MEDIUM = "MEDIUM",
    /** 높음 - 즉시 처리 필요 */
    HIGH = "HIGH",
    /** 치명적 - 시스템 중단 */
    CRITICAL = "CRITICAL"
}
/**
 * 성공 결과 생성 헬퍼
 */
export declare function success<T, E = UniversalError>(data: T, metadata?: ResultMetadata): UniversalResult<T, E>;
/**
 * 실패 결과 생성 헬퍼
 */
export declare function failure<T, E = UniversalError>(error: E, metadata?: ResultMetadata): UniversalResult<T, E>;
/**
 * 타입 가드: 성공 결과인지 확인
 */
export declare function isSuccess<T, E = UniversalError>(result: UniversalResult<T, E>): result is {
    success: true;
    data: T;
    metadata?: ResultMetadata;
};
/**
 * 타입 가드: 실패 결과인지 확인
 */
export declare function isFailure<T, E = UniversalError>(result: UniversalResult<T, E>): result is {
    success: false;
    error: E;
    metadata?: ResultMetadata;
};
/**
 * 레거시 Result 타입 호환성을 위한 별칭
 *
 * @deprecated 새 코드에서는 UniversalResult를 사용하세요
 */
export type Result<T, E = UniversalError> = UniversalResult<T, E>;
//# sourceMappingURL=result.d.ts.map