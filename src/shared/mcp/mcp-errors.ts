/**
 * MCP Error Handling Utilities
 *
 * PosMul Platform MCP 통합을 위한 에러 처리 유틸리티
 * MoneyWave와 경제 시스템 연동 시 사용
 */

export class MCPError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "MCPError";
  }
}

/**
 * MCP 에러 처리 핸들러
 * @param error - 발생한 에러
 * @param operation - 실행 중이던 MCP 작업
 * @param context - 추가 컨텍스트 정보
 */
export const handleMCPError = (
  error: unknown,
  operation: string,
  context?: Record<string, any>
): MCPError => {
  if (error instanceof Error) {
    return new MCPError(
      `MCP ${operation} failed: ${error.message}`,
      operation,
      error,
      context
    );
  }

  return new MCPError(
    `MCP ${operation} failed with unknown error`,
    operation,
    undefined,
    { ...context, originalError: error }
  );
};

/**
 * Supabase MCP 전용 에러 타입
 */
export class SupabaseMCPError extends MCPError {
  constructor(
    message: string,
    public projectId: string,
    public query?: string,
    cause?: Error
  ) {
    super(message, "supabase_mcp", cause, { projectId, query });
    this.name = "SupabaseMCPError";
  }
}

/**
 * MoneyWave MCP 에러 타입 (경제 시스템 전용)
 */
export class MoneyWaveMCPError extends MCPError {
  constructor(
    message: string,
    public waveType: "WAVE1" | "WAVE2" | "WAVE3",
    public economicContext?: {
      pmpAmount?: number;
      pmcAmount?: number;
      gameId?: string;
    },
    cause?: Error
  ) {
    super(
      message,
      `money_wave_${waveType.toLowerCase()}`,
      cause,
      economicContext
    );
    this.name = "MoneyWaveMCPError";
  }
}

/**
 * PMP/PMC 관련 MCP 에러 처리
 */
export const handleEconomicMCPError = (
  error: unknown,
  operation: "pmp_transaction" | "pmc_distribution" | "money_wave_allocation",
  economicData?: {
    userId?: string;
    amount?: number;
    gameId?: string;
    waveType?: string;
  }
): MCPError => {
  const context = {
    operation,
    economicData,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof Error) {
    return new MCPError(
      `Economic MCP ${operation} failed: ${error.message}`,
      operation,
      error,
      context
    );
  }

  return new MCPError(
    `Economic MCP ${operation} failed with unknown error`,
    operation,
    undefined,
    context
  );
};

/**
 * MCP 에러 로깅 유틸리티
 */
export const logMCPError = (error: MCPError): void => {
  console.error(`[MCP Error] ${error.operation}:`, {
    message: error.message,
    cause: error.cause?.message,
    context: error.context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 재시도 가능한 MCP 에러 판별
 */
export const isRetryableMCPError = (error: MCPError): boolean => {
  // 네트워크 에러, 타임아웃 등은 재시도 가능
  const retryableMessages = [
    "timeout",
    "network",
    "connection",
    "temporary",
    "rate limit",
  ];

  return retryableMessages.some((msg) =>
    error.message.toLowerCase().includes(msg)
  );
};

/**
 * MCP 작업 재시도 래퍼
 */
export const retryMCPOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      const mcpError = handleMCPError(error, operationName);

      if (i === maxRetries || !isRetryableMCPError(mcpError)) {
        throw mcpError;
      }

      // 지수 백오프로 대기
      const delay = delayMs * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw handleMCPError(lastError!, operationName);
};
