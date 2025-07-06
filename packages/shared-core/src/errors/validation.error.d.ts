import { BaseError } from "./base.error";
export declare class ValidationError extends BaseError {
    readonly field?: string;
    readonly validationErrors?: Record<string, string[]>;
    constructor(message?: string, field?: string, validationErrors?: Record<string, string[]>);
}
