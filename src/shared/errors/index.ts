/**
 * 공용 에러 클래스들
 */

export class UseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "UseCaseError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class RepositoryError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "RepositoryError";
  }
}
