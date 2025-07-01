import {
  mcp_supabase_apply_migration,
  mcp_supabase_execute_sql,
<<<<<<< HEAD:apps/posmul-web/src/bounded-contexts/economy/infrastructure/repositories/base-mcp.repository.ts
} from "@posmul/shared-auth";
import { SupabaseProjectService } from "@posmul/shared-auth";
=======
} from "@/shared/mcp/supabase-client";
import { SupabaseProjectService } from "@/shared/mcp/supabase-project.service";
>>>>>>> main:src/bounded-contexts/economy/infrastructure/repositories/base-mcp.repository.ts

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
