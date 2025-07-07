import { AuthenticationError } from "./authentication.error";
import { BaseError } from "./base.error";
import { ValidationError } from "./validation.error";
export declare function isOperationalError(error: Error): error is BaseError;
export declare function isValidationError(error: Error): error is ValidationError;
export declare function isAuthenticationError(error: Error): error is AuthenticationError;
//# sourceMappingURL=error-guards.d.ts.map