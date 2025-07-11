// Error classes for type-safe error handling

export class AuthenticationError extends Error {
  public code?: string;

  constructor(message: string = "인증이 필요합니다", code?: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

export class BusinessLogicError extends Error {
  public code?: string;

  constructor(
    message: string = "비즈니스 로직 오류가 발생했습니다",
    code?: string
  ) {
    super(message);
    this.name = "BusinessLogicError";
    this.code = code;
  }
}

export class DomainError extends Error {
  public code?: string;

  constructor(
    message: string = "도메인 규칙 위반 오류가 발생했습니다",
    code?: string
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export class NetworkError extends Error {
  public code?: string;

  constructor(message: string = "네트워크 오류가 발생했습니다", code?: string) {
    super(message);
    this.name = "NetworkError";
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  public code?: string;

  constructor(message: string = "접근 권한이 없습니다", code?: string) {
    super(message);
    this.name = "ForbiddenError";
    this.code = code;
  }
}

export class ValidationError extends Error {
  public field?: string;
  public code?: string;

  constructor(
    message: string = "입력값이 올바르지 않습니다",
    field?: string,
    code?: string
  ) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}
