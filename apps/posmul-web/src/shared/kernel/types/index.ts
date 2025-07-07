/**
 * Shared Kernel Types
 * 
 * Common types used across all bounded contexts
 * 
 * @author PosMul Development Team
 * @since 2025-07-06
 */

// Result pattern for error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Common value objects
export interface Money {
  amount: number;
  currency: 'PMP' | 'PMC' | 'KRW';
}

// Economic context
export interface EconomicSnapshot {
  timestamp: Date;
  activeMoneyWaves: string[];
  platformActivity: number;
  totalPmpInCirculation: number;
  totalPmcInCirculation: number;
}

// User context
export interface UserContext {
  userId: string;
  level: number;
  reputation: number;
  joinedAt: Date;
}

// Error types
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(required: number, available: number) {
    super(
      `Insufficient balance: required ${required}, available ${available}`,
      'INSUFFICIENT_BALANCE',
      { required, available }
    );
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, value: any, reason: string) {
    super(
      `Validation failed for ${field}: ${reason}`,
      'VALIDATION_ERROR',
      { field, value, reason }
    );
  }
}
