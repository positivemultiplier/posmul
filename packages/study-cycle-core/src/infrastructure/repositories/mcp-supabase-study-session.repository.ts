import {
  RepositoryError,
  Result,
  failure,
  success,
} from "@posmul/shared-types";
import {
  StudySession,
  StudySessionId,
  StudySessionStatus,
  UserId,
} from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { IStudySessionRepository } from "../../domain/repositories/study-session.repository";
import { Tables } from "../../types/supabase-study_cycle";

type StudySessionRow = Tables<{ schema: "study_cycle" }, "sc_study_sessions">;

declare global {
  function mcp_supabase_execute_sql(params: {
    project_id: string;
    query: string;
  }): Promise<{ data?: unknown[]; error?: { message: string } }>;
}

// Helper function to handle repository errors
function handleRepositoryError(
  error: unknown,
  operation: string
): RepositoryError {
  if (error instanceof Error) {
    return new RepositoryError(`Failed to ${operation}: ${error.message}`);
  }
  return new RepositoryError(`Failed to ${operation}: Unknown error`);
}

export class McpSupabaseStudySessionRepository
  implements IStudySessionRepository
{
  constructor(private readonly projectId: string) {}

  async save(session: StudySession): Promise<Result<void, RepositoryError>> {
    try {
      // Try to find existing session first
      const existingResult = await this.findById(session.id);
      if (!existingResult.success) {
        if (isFailure(existingResult)) {
  if (isFailure(existingResult)) {
  return failure(existingResult.error);
} else {
  return failure(new Error("Unknown error"));
};
} else {
  return failure(new Error("Unknown error"));
}
      }

      const insertData = session.toInsert();

      let query: string;
      if (existingResult.data) {
        // Update existing session
        const updateData = session.toUpdate();
        query = `
          UPDATE study_cycle.sc_study_sessions 
          SET 
            end_time = '${updateData.end_time}',
            duration_seconds = ${updateData.duration_seconds}
          WHERE id = '${session.id}'
        `;
      } else {
        // Insert new session
        query = `
          INSERT INTO study_cycle.sc_study_sessions (
            id, user_id, textbook_id, chapter_id, start_time, end_time, duration_seconds, created_at
          ) VALUES (
            '${insertData.id}',
            '${insertData.user_id}',
            '${insertData.textbook_id}',
            ${insertData.chapter_id ? `'${insertData.chapter_id}'` : "NULL"},
            '${insertData.start_time}',
            ${insertData.end_time ? `'${insertData.end_time}'` : "NULL"},
            ${insertData.duration_seconds || "NULL"},
            '${insertData.created_at}'
          )
        `;
      }

      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to save study session: ${error.message}`)
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(handleRepositoryError(error, "save study session"));
    }
  }

  async findById(
    id: StudySessionId
  ): Promise<Result<StudySession | null, RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_study_sessions 
        WHERE id = '${id}'
        LIMIT 1
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find study session by ID: ${error.message}`
          )
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const session = StudySession.fromPersistence(data[0] as StudySessionRow);
      return success(session);
    } catch (error) {
      return failure(handleRepositoryError(error, "find study session by ID"));
    }
  }

  async findActiveByUserId(
    userId: UserId
  ): Promise<Result<StudySession | null, RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_study_sessions 
        WHERE user_id = '${userId}' 
          AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find active study session: ${error.message}`
          )
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const session = StudySession.fromPersistence(data[0] as StudySessionRow, {
        status: StudySessionStatus.ACTIVE,
      });
      return success(session);
    } catch (error) {
      return failure(handleRepositoryError(error, "find active study session"));
    }
  }

  async findByUserId(
    userId: UserId,
    limit = 50,
    offset = 0
  ): Promise<Result<StudySession[], RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_study_sessions 
        WHERE user_id = '${userId}'
        ORDER BY start_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find study sessions by user: ${error.message}`
          )
        );
      }

      const sessions = (data || []).map((row) =>
        StudySession.fromPersistence(row as StudySessionRow)
      );
      return success(sessions);
    } catch (error) {
      return failure(
        handleRepositoryError(error, "find study sessions by user")
      );
    }
  }

  async findByTextbookId(
    textbookId: TextbookId,
    limit = 50,
    offset = 0
  ): Promise<Result<StudySession[], RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_study_sessions 
        WHERE textbook_id = '${textbookId}'
        ORDER BY start_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find study sessions by textbook: ${error.message}`
          )
        );
      }

      const sessions = (data || []).map((row) =>
        StudySession.fromPersistence(row as StudySessionRow)
      );
      return success(sessions);
    } catch (error) {
      return failure(
        handleRepositoryError(error, "find study sessions by textbook")
      );
    }
  }

  async findByUserAndTextbook(
    userId: UserId,
    textbookId: TextbookId
  ): Promise<Result<StudySession[], RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_study_sessions 
        WHERE user_id = '${userId}' AND textbook_id = '${textbookId}'
        ORDER BY start_time DESC
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find study sessions by user and textbook: ${error.message}`
          )
        );
      }

      const sessions = (data || []).map((row) =>
        StudySession.fromPersistence(row as StudySessionRow)
      );
      return success(sessions);
    } catch (error) {
      return failure(
        handleRepositoryError(error, "find study sessions by user and textbook")
      );
    }
  }

  async delete(id: StudySessionId): Promise<Result<void, RepositoryError>> {
    try {
      const query = `
        DELETE FROM study_cycle.sc_study_sessions 
        WHERE id = '${id}'
      `;

      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to delete study session: ${error.message}`
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(handleRepositoryError(error, "delete study session"));
    }
  }

  async getTotalStudyTimeByUserId(
    userId: UserId
  ): Promise<Result<number, RepositoryError>> {
    try {
      const query = `
        SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
        FROM study_cycle.sc_study_sessions 
        WHERE user_id = '${userId}' AND duration_seconds IS NOT NULL
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to get total study time: ${error.message}`
          )
        );
      }

      const result = data?.[0] as { total_seconds: number };
      const totalSeconds = result?.total_seconds || 0;
      return success(Math.floor(totalSeconds / 60)); // Return minutes
    } catch (error) {
      return failure(handleRepositoryError(error, "get total study time"));
    }
  }

  async getStudyStatsByUserId(userId: UserId): Promise<
    Result<
      {
        totalSessions: number;
        totalTimeMinutes: number;
        averageSessionLength: number;
        completedSessions: number;
        totalPagesRead: number;
      },
      RepositoryError
    >
  > {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sessions,
          COALESCE(SUM(duration_seconds), 0) as total_seconds,
          COALESCE(AVG(duration_seconds), 0) as avg_seconds,
          COUNT(CASE WHEN end_time IS NOT NULL THEN 1 END) as completed_sessions
        FROM study_cycle.sc_study_sessions 
        WHERE user_id = '${userId}'
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to get study stats: ${error.message}`)
        );
      }

      const stats = data?.[0] as {
        total_sessions: string;
        total_seconds: number;
        avg_seconds: number;
        completed_sessions: string;
      };

      return success({
        totalSessions: parseInt(stats?.total_sessions || "0", 10),
        totalTimeMinutes: Math.floor((stats?.total_seconds || 0) / 60),
        averageSessionLength: Math.floor((stats?.avg_seconds || 0) / 60),
        completedSessions: parseInt(stats?.completed_sessions || "0", 10),
        totalPagesRead: 0, // This would need additional tracking in extended properties
      });
    } catch (error) {
      return failure(handleRepositoryError(error, "get study stats"));
    }
  }
}
