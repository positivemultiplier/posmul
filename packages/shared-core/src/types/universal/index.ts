/**
 * Universal MCP Types를 shared-types에서 re-export
 */

// Universal MCP 타입 시스템 re-export
export {
  ResultUtils,
  isSuccess as isUniversalSuccess,
  isFailure as isUniversalFailure,
  success as universalSuccess,
  failure as universalFailure,
} from "@posmul/universal-mcp-types";

export type {
  UniversalResult,
  UniversalError,
  ResultMetadata,
  MCPOperationType,
  MCPOperationContext,
  RetryPolicy,
  BackoffStrategy,
  MCPResponse,
  SupabaseProjectInfo,
  DatabaseTable,
} from "@posmul/universal-mcp-types";

// Aliases for backward compatibility
export type {
  UniversalResult as MCPResult,
  UniversalError as MCPError,
  ResultMetadata as MCPMetadata,
} from "@posmul/universal-mcp-types";
