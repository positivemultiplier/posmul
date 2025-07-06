/**
 * Universal MCP Types - 메인 엔트리 포인트
 * 
 * 모든 MCP 관련 타입을 중앙화하여 일관된 사용 지원
 */

// Core types
export * from './core/result';
export * from './core/mcp-base';

// Utility functions  
export * from './utils/result-utils';

// Re-export commonly used types with aliases for backward compatibility
export type {
  UniversalResult as MCPResult,
  UniversalError as MCPError,
  ResultMetadata as MCPMetadata
} from './core/result';

export type {
  MCPOperationType,
  MCPOperationContext,
  RetryPolicy,
  BackoffStrategy,
  MCPResponse,
  SupabaseProjectInfo,
  DatabaseTable
} from './core/mcp-base';
