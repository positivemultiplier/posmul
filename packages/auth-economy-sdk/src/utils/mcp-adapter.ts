/**
 * MCP Adapter for Supabase Operations
 * 
 * MCP 도구들과 SDK 사이의 어댑터
 * 실제 MCP 함수 호출을 래핑하여 SDK의 인터페이스에 맞춤
 */

import type { MCPQueryResult, MCPAdvisor } from './mcp';

// MCP 도구들의 타입 정의 (실제 구현체는 각 앱에서 주입)
declare const mcp_supabase_execute_sql: (config: {
  project_id: string;
  query: string;
}) => Promise<{ data?: Record<string, unknown>[]; error?: string }>;

declare const mcp_supabase_apply_migration: (config: {
  project_id: string;
  name: string;
  query: string;
}) => Promise<void>;

declare const mcp_supabase_list_tables: (config: {
  project_id: string;
  schemas?: string[];
}) => Promise<string[]>;

declare const mcp_supabase_get_advisors: (config: {
  project_id: string;
  type: 'security' | 'performance';
}) => Promise<Array<{
  type?: string;
  severity?: string;
  message?: string;
  remediation?: string;
}>>;

/**
 * MCP Supabase 어댑터 클래스
 */
export class MCPSupabaseAdapter {
  constructor(private readonly projectId: string) {}

  /**
   * SQL 쿼리 실행
   */
  async executeSQL<T = Record<string, unknown>>(query: string): Promise<MCPQueryResult<T>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query,
      });

      return {
        data: (result.data || []) as T[],
        error: result.error,
        count: result.data?.length || 0,
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
      };
    }
  }

  /**
   * 마이그레이션 적용
   */
  async applyMigration(name: string, query: string): Promise<void> {
    await mcp_supabase_apply_migration({
      project_id: this.projectId,
      name,
      query,
    });
  }

  /**
   * 테이블 목록 조회
   */
  async listTables(schemas?: string[]): Promise<string[]> {
    return mcp_supabase_list_tables({
      project_id: this.projectId,
      schemas,
    });
  }

  /**
   * 어드바이저 조회
   */
  async getAdvisors(type: 'security' | 'performance'): Promise<MCPAdvisor[]> {
    const advisors = await mcp_supabase_get_advisors({
      project_id: this.projectId,
      type,
    });

    // 형식 정규화
    return advisors.map((advisor) => ({
      type: (advisor.type as 'security' | 'performance') || type,
      severity: (advisor.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      message: advisor.message || 'No message',
      remediation: advisor.remediation,
    }));
  }
}

/**
 * MCP 어댑터 팩토리
 */
export const createMCPAdapter = (projectId: string): MCPSupabaseAdapter => {
  return new MCPSupabaseAdapter(projectId);
};

/**
 * 프로젝트 ID를 받아 기본 어댑터를 생성
 */
export const createDefaultMCPAdapter = (projectId?: string): MCPSupabaseAdapter => {
  if (!projectId) {
    throw new Error('Project ID is required for MCP operations');
  }
  return createMCPAdapter(projectId);
};

/**
 * 편의성을 위한 단일 SQL 실행 함수
 */
export const mcpSupabaseExecuteSql = async <T = Record<string, unknown>>(
  query: string,
  projectId: string
): Promise<MCPQueryResult<T>> => {
  const adapter = createMCPAdapter(projectId);
  return adapter.executeSQL<T>(query);
};
