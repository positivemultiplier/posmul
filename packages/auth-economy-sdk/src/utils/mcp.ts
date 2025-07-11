/**
 * MCP Utilities for Auth-Economy SDK
 * 
 * MCP (Model Context Protocol) 관련 유틸리티 함수들
 * Supabase 데이터베이스와의 통합을 위한 헬퍼 함수들
 */

// === MCP 에러 처리 ===
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly projectId: string,
    public readonly query?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "MCPError";
  }
}

export const handleMCPError = (error: unknown, operation: string): MCPError => {
  if (error instanceof MCPError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new MCPError(
      `MCP ${operation} failed: ${error.message}`,
      "",
      undefined,
      error
    );
  }
  
  return new MCPError(
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
  _delay: number = 1000  // delay는 현재 사용하지 않음 (타입 호환성용)
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw handleMCPError(lastError, operationName);
      }
      
      // 간단한 비동기 대기 (즉시 다음 시도)
      await Promise.resolve();
    }
  }
  
  throw handleMCPError(lastError, operationName);
};

// === MCP 타입 정의 ===
export interface MCPConfig {
  projectId: string;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface MCPQueryResult<T = Record<string, unknown>> {
  data: T[];
  error?: string;
  count?: number;
}

export interface MCPAdvisor {
  type: 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  remediation?: string;
}

// === MCP 클라이언트 인터페이스 ===
export interface IMCPClient {
  executeSQL<T = Record<string, unknown>>(query: string): Promise<MCPQueryResult<T>>;
  applyMigration(name: string, query: string): Promise<void>;
  listTables(schemas?: string[]): Promise<string[]>;
  getAdvisors(type: 'security' | 'performance'): Promise<MCPAdvisor[]>;
}

// === 유틸리티 함수들 ===
export const formatMCPQuery = (query: string): string => {
  return query.trim().replace(/\s+/g, ' ');
};

export const validateMCPQuery = (query: string): boolean => {
  const trimmedQuery = query.trim();
  return trimmedQuery.length > 0 && !trimmedQuery.includes('--');
};

export const buildParameterizedQuery = (
  template: string, 
  params: Record<string, string | number | boolean | null>
): string => {
  let result = template;
  
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `$${key}`;
    const safeValue = typeof value === 'string' 
      ? `'${value.replace(/'/g, "''")}'` 
      : String(value);
    result = result.replace(new RegExp(`\\${placeholder}`, 'g'), safeValue);
  });
  
  return result;
};
