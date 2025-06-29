import { SupabaseProjectService } from "@/shared/mcp/supabase-project.service";
import {
  RepositoryError,
  Result,
  failure,
  success,
} from "@posmul/shared-types";
import { Textbook, TextbookId } from "../../domain/entities/textbook.entity";
import { ITextbookRepository } from "../../domain/repositories/textbook.repository";

declare const mcp_supabase_execute_sql: (params: {
  project_id: string;
  query: string;
}) => Promise<{
  data: Record<string, unknown>[] | null;
  error: Record<string, unknown> | null;
}>;

type TextbookRow = {
  id: TextbookId;
  title: string;
  creator_id: string;
  chapters: unknown[] | null;
  created_at: string;
  updated_at: string;
};

export class McpSupabaseTextbookRepository implements ITextbookRepository {
  private readonly projectId: string;

  constructor() {
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }

  private escapeSql(str: string | null | undefined): string {
    if (str === null || str === undefined) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
  }

  private toDomain(row: Record<string, unknown>): Textbook {
    const textbookRow = row as unknown as TextbookRow;
    return Textbook.fromPersistence({
      id: textbookRow.id,
      title: textbookRow.title,
      creatorId: textbookRow.creator_id,
      chapters: textbookRow.chapters || [],
      createdAt: new Date(textbookRow.created_at),
      updatedAt: new Date(textbookRow.updated_at),
    });
  }

  async save(textbook: Textbook): Promise<Result<void, RepositoryError>> {
    const props = textbook.propsAsJson;

    const query = `
            INSERT INTO study_cycle.sc_textbooks (id, title, creator_id, created_at, updated_at)
            VALUES (${this.escapeSql(props.id)}, ${this.escapeSql(props.title)}, ${this.escapeSql(props.creatorId)}, '${props.createdAt.toISOString()}', '${props.updatedAt.toISOString()}')
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                updated_at = EXCLUDED.updated_at;
        `;

    try {
      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });
      if (error)
        return failure(
          new RepositoryError(
            `Failed to save textbook: ${JSON.stringify(error)}`
          )
        );
      return success(undefined);
    } catch (e) {
      return failure(
        new RepositoryError("Failed to save textbook", e as Error)
      );
    }
  }

  async findById(
    id: TextbookId
  ): Promise<Result<Textbook | null, RepositoryError>> {
    const query = `SELECT * FROM study_cycle.sc_textbooks WHERE id = ${this.escapeSql(id)}`;
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error)
        return failure(
          new RepositoryError(
            `Failed to find textbook by id: ${JSON.stringify(error)}`
          )
        );
      if (!data || data.length === 0) {
        return success(null);
      }
      return success(this.toDomain(data[0]));
    } catch (e) {
      return failure(
        new RepositoryError("Failed to find textbook by id", e as Error)
      );
    }
  }

  async delete(id: TextbookId): Promise<Result<void, RepositoryError>> {
    const query = `DELETE FROM study_cycle.sc_textbooks WHERE id = ${this.escapeSql(id)}`;
    try {
      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });
      if (error)
        return failure(
          new RepositoryError(
            `Failed to delete textbook: ${JSON.stringify(error)}`
          )
        );
      return success(undefined);
    } catch (e) {
      return failure(
        new RepositoryError("Failed to delete textbook", e as Error)
      );
    }
  }

  async findAllByCreator(
    creatorId: string
  ): Promise<Result<Textbook[], RepositoryError>> {
    const query = `SELECT * FROM study_cycle.sc_textbooks WHERE creator_id = ${this.escapeSql(creatorId)} ORDER BY created_at DESC`;
    try {
      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });
      if (error)
        return failure(
          new RepositoryError(
            `Failed to find textbooks by creator: ${JSON.stringify(error)}`
          )
        );
      if (!data) return success([]);

      const textbooks = data.map((row) => this.toDomain(row));
      return success(textbooks);
    } catch (e) {
      return failure(
        new RepositoryError("Failed to find textbooks by creator", e as Error)
      );
    }
  }
}
