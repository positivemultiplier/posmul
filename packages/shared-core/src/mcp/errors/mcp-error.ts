/**
 * Universal MCP Types - 간소화된 에러 타입
 * 
 * 실용적이고 사용하기 쉬운 에러 처리 시스템
 */

import { ErrorType, ErrorSeverity } from '../core/result';

/**
 * 기본 MCP 에러 클래스
 */
export class BaseMCPError extends Error {
  readonly code: string;
  readonly errorType: ErrorType;
  readonly severity: ErrorSeverity;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;
  readonly originalError?: Error;

  constructor(
    code: string,
    message: string,
    errorType: ErrorType = ErrorType.MCP_OPERATION,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.errorType = errorType;
    this.severity = severity;
    this.timestamp = new Date();
    
    if (context) {
      this.context = context;
    }
    
    if (originalError) {
      this.originalError = originalError;
    }

    // Error 클래스 상속 시 필요한 설정
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      errorType: this.errorType,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context
    };
  }
}

/**
 * Supabase MCP 관련 에러
 */
export class SupabaseMCPError extends BaseMCPError {
  readonly projectId?: string;
  readonly query?: string;

  constructor(
    message: string,
    projectId?: string,
    query?: string,
    originalError?: Error
  ) {
    const context: Record<string, unknown> = {};
    if (projectId) context.projectId = projectId;
    if (query) context.query = query;

    super(
      'SUPABASE_MCP_ERROR',
      message,
      ErrorType.MCP_OPERATION,
      ErrorSeverity.HIGH,
      Object.keys(context).length > 0 ? context : undefined,
      originalError
    );

    this.projectId = projectId;
    this.query = query;
  }
}

/**
 * 네트워크 관련 에러
 */
export class NetworkMCPError extends BaseMCPError {
  readonly url?: string;
  readonly statusCode?: number;

  constructor(
    message: string,
    url?: string,
    statusCode?: number,
    originalError?: Error
  ) {
    const context: Record<string, unknown> = {};
    if (url) context.url = url;
    if (statusCode) context.statusCode = statusCode;

    super(
      'NETWORK_ERROR',
      message,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      Object.keys(context).length > 0 ? context : undefined,
      originalError
    );

    this.url = url;
    this.statusCode = statusCode;
  }
}

/**
 * 타임아웃 에러
 */
export class TimeoutMCPError extends BaseMCPError {
  readonly timeoutMs: number;

  constructor(
    operation: string,
    timeoutMs: number,
    originalError?: Error
  ) {
    super(
      'TIMEOUT_ERROR',
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      { operation, timeoutMs },
      originalError
    );

    this.timeoutMs = timeoutMs;
  }
}

/**
 * 에러 헬퍼 함수들
 */
export const ErrorHelpers = {
  /**
   * 알 수 없는 에러를 MCP 에러로 변환
   */
  fromUnknown(error: unknown, operation: string): BaseMCPError {
    if (error instanceof BaseMCPError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new BaseMCPError(
        'UNKNOWN_ERROR',
        `${operation} failed: ${error.message}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.MEDIUM,
        { operation },
        error
      );
    }
    
    return new BaseMCPError(
      'UNKNOWN_ERROR',
      `${operation} failed with unknown error`,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { operation, originalValue: String(error) }
    );
  },

  /**
   * HTTP 응답에서 에러 생성
   */
  fromHttpResponse(
    url: string,
    status: number,
    statusText: string,
    body?: string
  ): NetworkMCPError {
    const message = body || statusText || `HTTP ${status}`;
    return new NetworkMCPError(message, url, status);
  },

  /**
   * 에러가 재시도 가능한지 확인
   */
  isRetryable(error: BaseMCPError): boolean {
    // 네트워크 에러는 재시도 가능할 수 있음
    if (error instanceof NetworkMCPError) {
      const statusCode = error.statusCode;
      if (!statusCode) return true;
      
      // 5xx 서버 에러, 429 (Rate Limit), 408 (Timeout)은 재시도 가능
      return statusCode >= 500 || statusCode === 429 || statusCode === 408;
    }
    
    if (error instanceof TimeoutMCPError) {
      return true;
    }
    
    // 치명적인 에러는 재시도 불가
    return error.severity !== ErrorSeverity.CRITICAL;
  }
};
