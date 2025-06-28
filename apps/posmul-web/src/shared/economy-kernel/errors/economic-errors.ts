/**
 * EconomicError
 * 경제 시스템 관련 비즈니스 규칙 위반 시 발생하는 오류
 */
export class EconomicError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "insufficient-pmp"
      | "insufficient-pmc"
      | "invalid-transaction"
      | "account-not-found"
      | "unknown"
  ) {
    super(message);
    this.name = "EconomicError";
  }
}
