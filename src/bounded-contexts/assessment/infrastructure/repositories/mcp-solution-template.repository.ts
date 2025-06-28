/**
 * MCP-based SolutionTemplate Repository Implementation
 * 
 * Implements SolutionTemplate repository using Supabase MCP for all database operations.
 * Follows PosMul's MCP-first development principles and Clean Architecture.
 */

import { Result, success, failure } from "@/shared/errors";
import { RepositoryError } from "@/shared/errors/repository.error";
import { 
  ISolutionTemplateRepository, 
  TemplateUsageStats 
} from "../../domain/repositories/solution-template.repository";
import { 
  SolutionTemplate, 
  SolutionTemplateId, 
  TemplateType,
  ISolutionTemplateProps
} from "../../domain/entities/solution-template.entity";

/**
 * Database row interface for mapping
 */
interface SolutionTemplateRow {
  id: string;
  title: string;
  template_type: string;
  content: string;
  variables: any;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export class McpSolutionTemplateRepository implements ISolutionTemplateRepository {
  constructor(private readonly projectId: string) {}

  private escapeSql(value: string | undefined | null): string {
    if (value === null || typeof value === 'undefined') return "''";
    return value.replace(/'/g, "''");
  }

  async save(template: SolutionTemplate): Promise<Result<void, RepositoryError>> {
    try {
      const templateData = this.mapTemplateToRow(template);
      
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          INSERT INTO solution_templates (
            id, title, template_type, content, variables, is_active, version, created_at, updated_at
          )
          VALUES ('${templateData.id}', '${this.escapeSql(templateData.title)}', '${templateData.template_type}', 
                  '${this.escapeSql(templateData.content)}', '${this.escapeSql(JSON.stringify(templateData.variables))}', 
                  ${templateData.is_active}, ${templateData.version}, 
                  '${templateData.created_at}', '${templateData.updated_at}')
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            template_type = EXCLUDED.template_type,
            content = EXCLUDED.content,
            variables = EXCLUDED.variables,
            is_active = EXCLUDED.is_active,
            version = EXCLUDED.version,
            updated_at = EXCLUDED.updated_at
        `
      });

      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("SolutionTemplate 저장 실패", error));
    }
  }

  async findById(id: SolutionTemplateId): Promise<Result<SolutionTemplate | null, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM solution_templates WHERE id = '${id}'`
      });

      if (!result.data || result.data.length === 0) {
        return success(null);
      }

      const templateRow = result.data[0] as SolutionTemplateRow;
      const template = this.mapRowToTemplate(templateRow);
      return success(template);
    } catch (error) {
      return failure(new RepositoryError("SolutionTemplate 조회 실패", error));
    }
  }

  async findAll(): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: "SELECT * FROM solution_templates ORDER BY created_at DESC"
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("전체 SolutionTemplate 조회 실패", error));
    }
  }

  async delete(id: SolutionTemplateId): Promise<Result<void, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `DELETE FROM solution_templates WHERE id = '${id}'`
      });

      return success(undefined);
    } catch (error) {
      return failure(new RepositoryError("SolutionTemplate 삭제 실패", error));
    }
  }

  async findByType(templateType: TemplateType): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM solution_templates WHERE template_type = '${templateType}' ORDER BY created_at DESC`
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("타입별 SolutionTemplate 조회 실패", error));
    }
  }

  async findActiveTemplates(): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: "SELECT * FROM solution_templates WHERE is_active = true ORDER BY created_at DESC"
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("활성 SolutionTemplate 조회 실패", error));
    }
  }

  async findByTitle(title: string): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM solution_templates WHERE title = '${title.replace(/'/g, "''")}' ORDER BY created_at DESC`
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("제목별 SolutionTemplate 조회 실패", error));
    }
  }

  async findByTitleContaining(searchTerm: string): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `SELECT * FROM solution_templates WHERE title ILIKE '%${searchTerm.replace(/'/g, "''")}%' ORDER BY created_at DESC`
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("제목 검색 SolutionTemplate 조회 실패", error));
    }
  }

  async getTemplateUsageStats(templateId: SolutionTemplateId): Promise<Result<TemplateUsageStats, RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT 
            st.id as template_id,
            st.title,
            COUNT(q.id) as usage_count,
            MAX(q.created_at) as last_used_at,
            AVG(s.score) as average_score,
            COUNT(q.id) as questions_created
          FROM solution_templates st
          LEFT JOIN questions q ON st.id = q.template_id
          LEFT JOIN submissions s ON q.id = s.question_id
          WHERE st.id = '${templateId}'
          GROUP BY st.id, st.title
        `
      });

      if (!result.data || result.data.length === 0) {
        return failure(new RepositoryError("템플릿 사용 통계를 찾을 수 없습니다.", new Error("Template not found")));
      }

      const statsRow = result.data[0];
      const stats: TemplateUsageStats = {
        templateId: statsRow.template_id as SolutionTemplateId,
        title: statsRow.title,
        usageCount: parseInt(statsRow.usage_count) || 0,
        lastUsedAt: statsRow.last_used_at ? new Date(statsRow.last_used_at) : null,
        averageScore: parseFloat(statsRow.average_score) || 0,
        questionsCreated: parseInt(statsRow.questions_created) || 0
      };

      return success(stats);
    } catch (error) {
      return failure(new RepositoryError("템플릿 사용 통계 조회 실패", error));
    }
  }

  async getMostUsedTemplates(limit: number = 10): Promise<Result<SolutionTemplate[], RepositoryError>> {
    try {
      const { mcp_supabase_execute_sql } = await import("@/shared/mcp/supabase-client");
      
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT st.*, COUNT(q.id) as usage_count
          FROM solution_templates st
          LEFT JOIN questions q ON st.id = q.template_id
          WHERE st.is_active = true
          GROUP BY st.id, st.title, st.template_type, st.content, st.variables, st.is_active, st.version, st.created_at, st.updated_at
          ORDER BY usage_count DESC
          LIMIT ${limit}
        `
      });

      const templates = (result.data as SolutionTemplateRow[]).map(row => this.mapRowToTemplate(row));
      return success(templates);
    } catch (error) {
      return failure(new RepositoryError("인기 SolutionTemplate 조회 실패", error));
    }
  }

  // Private mapping methods
  private mapTemplateToRow(template: SolutionTemplate): any {
    return {
      id: template.id,
      title: template.title,
      template_type: template.templateType,
      content: template.content,
      variables: template.variables,
      is_active: template.isActive,
      version: template.version,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString()
    };
  }

  private mapRowToTemplate(row: SolutionTemplateRow): SolutionTemplate {
    const props: ISolutionTemplateProps = {
      title: row.title,
      templateType: row.template_type as TemplateType,
      content: row.content,
      variables: row.variables || {},
      isActive: row.is_active,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    return SolutionTemplate.reconstitute(props, row.id as SolutionTemplateId);
  }
} 