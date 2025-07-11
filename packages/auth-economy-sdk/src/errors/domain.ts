import { BaseError } from "./base";

export class DomainError extends BaseError {
  constructor(message: string, code: string = "DOMAIN_ERROR") {
    super(message, code, 400);
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    public field: string
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class UseCaseError extends BaseError {
  public cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, "USE_CASE_ERROR", 400);
    if (cause) {
      this.cause = cause;
    }
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404, false);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401, false);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = "Forbidden access") {
    super(message, "FORBIDDEN", 403, false);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, "CONFLICT", 409, false);
  }
}

export class InternalError extends BaseError {
  public cause?: Error;

  constructor(message: string = "Internal server error", cause?: Error) {
    super(message, "INTERNAL_ERROR", 500, true);
    if (cause) {
      this.cause = cause;
    }
  }
}
