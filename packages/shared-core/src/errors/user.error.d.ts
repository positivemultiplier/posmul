import { BaseError } from "./base.error";
export declare class UserNotFoundError extends BaseError {
    constructor(message?: string);
}
export declare class UserAlreadyExistsError extends BaseError {
    constructor(message?: string);
}
export declare class InsufficientPointsError extends BaseError {
    readonly currentPoints: number;
    readonly requiredPoints: number;
    constructor(currentPoints: number, requiredPoints: number, message?: string);
}
