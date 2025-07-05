/**
 * MCP Error Handling
 *
 * Provides comprehensive error handling for MCP operations.
 * PosMul Platform MCP 통합을 위한 에러 처리 유틸리티
 */
export declare class SupabaseMCPError extends Error {
    readonly projectId: string;
    readonly query?: string | undefined;
    readonly cause?: Error | undefined;
    constructor(message: string, projectId: string, query?: string | undefined, cause?: Error | undefined);
}
export declare const handleMCPError: (error: unknown, operation: string) => SupabaseMCPError;
export declare const retryMCPOperation: <T>(operation: () => Promise<T>, operationName: string, maxRetries?: number, delay?: number) => Promise<T>;
