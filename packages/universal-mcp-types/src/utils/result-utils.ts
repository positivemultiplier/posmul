/**
 * Universal MCP Types - 유틸리티 함수들
 * 
 * Result와 Error 처리를 위한 헬퍼 함수들
 */

import { UniversalResult, UniversalError, isSuccess, isFailure, ErrorType, ErrorSeverity } from '../core/result';

/**
 * Result 유틸리티 함수들
 */
export const ResultUtils = {
  /**
   * 에러로부터 Result 생성 (legacy Result 타입 지원)
   */
  fromError<E>(error: E): { success: false; error: E } {
    return { success: false, error };
  },

  /**
   * 데이터로부터 Result 생성 (legacy Result 타입 지원)
   */
  fromData<T>(data: T): { success: true; data: T } {
    return { success: true, data };
  },

  /**
   * Result를 Promise로 변환
   */
  toPromise<T, E = UniversalError>(result: UniversalResult<T, E>): Promise<T> {
    if (isSuccess(result)) {
      return Promise.resolve(result.data);
    }
    
    const error = result.error;
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    
    return Promise.reject(new Error(String(error)));
  },

  /**
   * Promise를 Result로 변환
   */
  async fromPromise<T>(promise: Promise<T>): Promise<UniversalResult<T, UniversalError>> {
    try {
      const data = await promise;
      return { success: true, data };
    } catch (error) {
      const universalError: UniversalError = {
        code: 'PROMISE_REJECTION',
        message: error instanceof Error ? error.message : String(error),
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        ...(error instanceof Error && { cause: error })
      };
      return { success: false, error: universalError };
    }
  },

  /**
   * 배열의 모든 성공 Result를 추출
   */
  successes<T, E = UniversalError>(
    results: UniversalResult<T, E>[]
  ): T[] {
    return results
      .filter(isSuccess)
      .map(result => result.data);
  },

  /**
   * 배열의 모든 실패 Result를 추출
   */
  failures<T, E = UniversalError>(
    results: UniversalResult<T, E>[]
  ): E[] {
    return results
      .filter(isFailure)
      .map(result => result.error);
  }
};