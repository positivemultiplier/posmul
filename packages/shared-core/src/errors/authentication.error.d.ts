import { BaseError } from "./base.error";
export declare class AuthenticationError extends BaseError {
    constructor(message?: string, code?: string);
}
export declare class InvalidCredentialsError extends BaseError {
    constructor(message?: string);
}
export declare class TokenExpiredError extends BaseError {
    constructor(message?: string);
}
