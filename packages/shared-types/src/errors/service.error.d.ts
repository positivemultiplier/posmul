import { BaseError } from "./base.error";
export declare class ExternalServiceError extends BaseError {
    readonly service: string;
    readonly originalError?: Error;
    constructor(service: string, message?: string, originalError?: Error);
}
export declare class NetworkError extends BaseError {
    constructor(message?: string);
}
