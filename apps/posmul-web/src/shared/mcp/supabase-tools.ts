/**
 * Supabase MCP Tools
 *
 * Supabase MCP 관련 유틸리티 함수들
 * 테스트에서 모킹을 위해 사용됩니다.
 */

export const executeSQL = async (_query: string, _params?: any[]) => {
  // 실제 구현은 MCP 호출로 대체됩니다
  throw new Error("executeSQL should be mocked in tests");
};

export const applyMigration = async (_migrationName: string, _query: string) => {
  // 실제 구현은 MCP 호출로 대체됩니다
  throw new Error("applyMigration should be mocked in tests");
};
