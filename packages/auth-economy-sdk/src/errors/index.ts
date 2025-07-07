/**
 * SDK 에러 타입 및 클래스 정의
 */

export type ErrorCode = 
  | 'AUTH_ERROR'
  | 'ECONOMY_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AuthEconomyError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthEconomyError';
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('AUTH_ERROR', message, details);
    this.name = 'AuthError';
  }
}

export class EconomyError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('ECONOMY_ERROR', message, details);
    this.name = 'EconomyError';
  }
}

export class ValidationError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
  }
}

// 비즈니스 로직 에러
export class BusinessLogicError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'BusinessLogicError';
  }
}

// 도메인 에러
export class DomainError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'DomainError';
  }
}

// Use Case 에러
export class UseCaseError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'UseCaseError';
  }
}

// 발행 에러
export class PublishError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('NETWORK_ERROR', message, details);
    this.name = 'PublishError';
  }
}

// 핸들러 에러
export class HandlerError extends AuthEconomyError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('UNKNOWN_ERROR', message, details);
    this.name = 'HandlerError';
  }
}
