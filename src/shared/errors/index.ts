/**
 * 공용 에러 클래스들
 */

import { RepositoryError } from "./repository.error";

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

export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T, E>(data: T): Result<T, E> {
  return { success: true, data };
}

export function failure<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}

export { RepositoryError };
