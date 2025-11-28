/**
 * MCP Error Handling
 *
 * Provides comprehensive error handling for MCP operations.
 * PosMul Platform MCP 통합을 위한 에러 처리 유틸리티
 */

export class SupabaseMCPError extends Error {
  constructor(
    message: string,
    public readonly projectId: string,
    public readonly query?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "SupabaseMCPError";
  }
}

export const handleMCPError = (
  error: unknown,
  operation: string
): SupabaseMCPError => {
  if (error instanceof SupabaseMCPError) {
    return error;
  }

  if (error instanceof Error) {
    return new SupabaseMCPError(
      `MCP ${operation} failed: ${error.message}`,
      "",
      undefined,
      error
    );
  }

  return new SupabaseMCPError(
    `MCP ${operation} failed with unknown error`,
    "",
    undefined,
    undefined
  );
};

export const retryMCPOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }

  throw new SupabaseMCPError(
    `Failed to execute ${operationName} after ${maxRetries} attempts`,
    "",
    undefined,
    lastError
  );
};
