/**
 * Result helper functions for legacy compatibility
 */

import { Result, ValidationError } from "@posmul/auth-economy-sdk";

export function success<T>(data: T): Result<T, never> {
  return {
    success: true,
    data,
  };
}

export function failure<E>(error: E): Result<never, E> {
  return {
    success: false,
    error,
  };
}

// ValidationError helper with proper structure
export function createValidationError(
  message: string,
  field?: string
): ValidationError {
  return new ValidationError(message, { field: field || "unknown" });
}

// Domain error types for legacy compatibility
export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "DOMAIN_ERROR") {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export class AuthenticationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "AUTH_ERROR") {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}
