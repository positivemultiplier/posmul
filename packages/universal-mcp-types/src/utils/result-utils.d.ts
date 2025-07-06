/**
 * Universal MCP Types - 유틸리티 함수들
 *
 * Result와 Error 처리를 위한 헬퍼 함수들
 */
import { UniversalResult, UniversalError } from '../core/result';
/**
 * Result 유틸리티 함수들
 */
export declare const ResultUtils: {
    /**
     * Result를 Promise로 변환
     */
    toPromise<T, E = UniversalError>(result: UniversalResult<T, E>): Promise<T>;
    /**
     * Promise를 Result로 변환
     */
    fromPromise<T>(promise: Promise<T>): Promise<UniversalResult<T>>;
    /**
     * Result 체이닝 (map)
     */
    map<T, U, E = UniversalError>(result: UniversalResult<T, E>, mapper: (data: T) => U): UniversalResult<U, E>;
    /**
     * Result 체이닝 (flatMap)
     */
    flatMap<T, U, E = UniversalError>(result: UniversalResult<T, E>, mapper: (data: T) => UniversalResult<U, E>): UniversalResult<U, E>;
    /**
     * 여러 Result를 모두 성공해야 하는 조합
     */
    all<T extends readonly unknown[], E = UniversalError>(results: { [K in keyof T]: UniversalResult<T[K], E>; }): UniversalResult<T, E>;
    /**
     * Result 배열에서 성공한 것들만 추출
     */
    successes<T, E = UniversalError>(results: UniversalResult<T, E>[]): T[];
    /**
     * Result 배열에서 실패한 것들만 추출
     */
    failures<T, E = UniversalError>(results: UniversalResult<T, E>[]): E[];
};
/**
 * 타입 가드 함수들
 */
export declare const TypeGuards: {
    /**
     * UniversalError 타입 가드
     */
    isUniversalError(error: unknown): error is UniversalError;
    /**
     * Error 객체 타입 가드
     */
    isError(error: unknown): error is Error;
    /**
     * 특정 에러 코드 체크
     */
    hasErrorCode(error: unknown, code: string): boolean;
    /**
     * 에러 타입별 체크
     */
    isErrorType(error: unknown, type: string): boolean;
};
/**
 * 비동기 작업 헬퍼
 */
export declare const AsyncUtils: {
    /**
     * 재시도 로직
     */
    retry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<UniversalResult<T>>;
    /**
     * 타임아웃 처리
     */
    withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<UniversalResult<T>>;
    /**
     * 딜레이 함수
     */
    sleep(ms: number): Promise<void>;
};
//# sourceMappingURL=result-utils.d.ts.map