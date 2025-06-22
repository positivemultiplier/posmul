/**
 * MCPError
 * MCP 도구 사용 시 발생하는 오류를 위한 커스텀 에러 클래스
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "MCPError";
  }
}

/**
 * handleMCPError
 * 알 수 없는 타입의 오류를 MCPError로 변환하는 헬퍼 함수
 * @param error - catch 블록에서 받은 오류 객체
 * @param operation - 오류가 발생한 작업명
 * @returns MCPError 객체
 */
export const handleMCPError = (error: unknown, operation: string): MCPError => {
  if (error instanceof Error) {
    return new MCPError(
      `MCP operation '${operation}' failed: ${error.message}`,
      operation,
      error
    );
  }
  return new MCPError(
    `MCP operation '${operation}' failed with an unknown error.`,
    operation,
    error
  );
};
