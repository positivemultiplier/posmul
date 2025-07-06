import { BaseError } from "./base.error";
export declare class GameNotFoundError extends BaseError {
    constructor(message?: string);
}
export declare class GameAlreadyEndedError extends BaseError {
    constructor(message?: string);
}
export declare class PredictionDeadlinePassedError extends BaseError {
    constructor(message?: string);
}
