import { BaseError } from "./base.error";
export declare class BusinessLogicError extends BaseError {
    constructor(message: string, code?: string);
}
