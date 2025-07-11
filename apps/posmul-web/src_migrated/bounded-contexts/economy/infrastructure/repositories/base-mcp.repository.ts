// @deprecated - 추후 Auth-Economy SDK로 완전 교체 예정
import {
  mcp_supabase_apply_migration,
  mcp_supabase_execute_sql,
} from "../../../../../src/shared/mcp/supabase-client";
import { SupabaseProjectService } from "../../../../../src/shared/mcp/supabase-project.service";

export abstract class BaseMCPRepository {
  protected readonly projectId: string;

  constructor() {
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }

  protected async executeQuery(query: string, params?: any[]): Promise<any> {
    // 참고: 실제 mcp_supabase_execute_sql은 파라미터를 지원하는지 확인 필요
    // 우선은 쿼리만 전달하는 형태로 구현
    return await mcp_supabase_execute_sql({
      project_id: this.projectId,
      query: query,
    });
  }

  protected async applyMigration(name: string, query: string): Promise<any> {
    return await mcp_supabase_apply_migration({
      project_id: this.projectId,
      name: name,
      query: query,
    });
  }
}
