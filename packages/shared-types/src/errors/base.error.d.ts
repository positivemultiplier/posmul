export declare abstract class BaseError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    cause?: Error;
    constructor(message: string, code?: string, statusCode?: number, isOperational?: boolean);
}
//# sourceMappingURL=base.error.d.ts.map