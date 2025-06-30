import {
  RepositoryError,
  Result,
  failure,
  isFailure,
  success,
} from "@posmul/shared-types";
import {
  ChapterProgress,
  Reading,
  ReadingId,
} from "../../domain/entities/reading.entity";
import { UserId } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { IReadingRepository } from "../../domain/repositories/reading.repository";
// import { Tables } from "../../types/supabase-study_cycle"; // 임시 제거

// 임시 타입 정의
type ReadingRow = {
  id: string;
  user_id: string;
  textbook_id: string;
  round: number;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  daily_pages_target?: number | null;
  weekly_hours_target?: number | null;
  completion_deadline?: string | null;
  total_time_minutes: number;
  total_pages_read: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  version?: number;
};

type ReadingProgressRow = {
  id: string;
  reading_id: string;
  chapter_id: string;
  chapter_title: string;
  total_pages: number;
  completed_pages: number;
  last_read_at?: string | null;
  is_completed: boolean;
  difficulty_rating?: number | null;
  comprehension_rating?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

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

export class McpSupabaseReadingRepository implements IReadingRepository {
  constructor(private readonly projectId: string) {}

  async save(reading: Reading): Promise<Result<void, RepositoryError>> {
    try {
      // Try to find existing reading first
      const existingResult = await this.findById(reading.id);
      if (!existingResult.success) {
        if (isFailure(existingResult)) {
          if (isFailure(existingResult)) {
            return failure(existingResult.error);
          } else {
            return failure(new Error("Unknown error"));
          }
        } else {
          return failure(new Error("Unknown error"));
        }
      }

      let query: string;
      if (existingResult.data) {
        // Update existing reading
        const updateData = reading.toUpdate();
        query = `
          UPDATE study_cycle.sc_readings 
          SET 
            status = '${updateData.status}',
            started_at = ${updateData.started_at ? `'${updateData.started_at}'` : "NULL"},
            completed_at = ${updateData.completed_at ? `'${updateData.completed_at}'` : "NULL"},
            last_accessed_at = ${updateData.last_accessed_at ? `'${updateData.last_accessed_at}'` : "NULL"},
            daily_pages_target = ${updateData.daily_pages_target || "NULL"},
            weekly_hours_target = ${updateData.weekly_hours_target || "NULL"},
            completion_deadline = ${updateData.completion_deadline ? `'${updateData.completion_deadline}'` : "NULL"},
            total_time_minutes = ${updateData.total_time_minutes || 0},
            total_pages_read = ${updateData.total_pages_read || 0},
            notes = ${updateData.notes ? `'${updateData.notes.replace(/'/g, "''")}'` : "NULL"},
            updated_at = NOW(),
            version = version + 1
          WHERE id = '${reading.id}'
        `;
      } else {
        // Insert new reading
        const insertData = reading.toInsert();
        query = `
          INSERT INTO study_cycle.sc_readings (
            id, user_id, textbook_id, round, status, started_at, completed_at, last_accessed_at,
            daily_pages_target, weekly_hours_target, completion_deadline, 
            total_time_minutes, total_pages_read, notes, created_at, updated_at, version
          ) VALUES (
            '${insertData.id}',
            '${insertData.user_id}',
            '${insertData.textbook_id}',
            ${insertData.round},
            '${insertData.status}',
            ${insertData.started_at ? `'${insertData.started_at}'` : "NULL"},
            ${insertData.completed_at ? `'${insertData.completed_at}'` : "NULL"},
            ${insertData.last_accessed_at ? `'${insertData.last_accessed_at}'` : "NULL"},
            ${insertData.daily_pages_target || "NULL"},
            ${insertData.weekly_hours_target || "NULL"},
            ${insertData.completion_deadline ? `'${insertData.completion_deadline}'` : "NULL"},
            ${insertData.total_time_minutes || 0},
            ${insertData.total_pages_read || 0},
            ${insertData.notes ? `'${insertData.notes.replace(/'/g, "''")}'` : "NULL"},
            '${insertData.created_at}',
            '${insertData.updated_at}',
            ${(insertData as any).version || 1}
          )
        `;
      }

      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to save reading: ${error.message}`)
        );
      }

      // Save chapter progress if any
      if (reading.chaptersProgress.length > 0) {
        const saveProgressResult = await this.saveChapterProgress(
          reading.id,
          reading.chaptersProgress
        );
        if (!saveProgressResult.success) {
          if (isFailure(saveProgressResult)) {
            if (isFailure(saveProgressResult)) {
              return failure(saveProgressResult.error);
            } else {
              return failure(new Error("Unknown error"));
            }
          } else {
            return failure(new Error("Unknown error"));
          }
        }
      }

      return success(undefined);
    } catch (error) {
      return failure(handleRepositoryError(error, "save reading"));
    }
  }

  async findById(
    id: ReadingId
  ): Promise<Result<Reading | null, RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_readings 
        WHERE id = '${id}'
        LIMIT 1
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to find reading by ID: ${error.message}`)
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const readingRow = data[0] as ReadingRow;

      // Load chapter progress
      const chaptersProgressResult = await this.loadChapterProgress(id);
      if (!chaptersProgressResult.success) {
        if (isFailure(chaptersProgressResult)) {
          if (isFailure(chaptersProgressResult)) {
            return failure(chaptersProgressResult.error);
          } else {
            return failure(new Error("Unknown error"));
          }
        } else {
          return failure(new Error("Unknown error"));
        }
      }

      const reading = Reading.fromPersistence(readingRow, {
        chaptersProgress: chaptersProgressResult.data,
        studySessionIds: [], // TODO: Load from study sessions if needed
      });

      return success(reading);
    } catch (error) {
      return failure(handleRepositoryError(error, "find reading by ID"));
    }
  }

  async findByUserAndTextbook(
    userId: UserId,
    textbookId: TextbookId
  ): Promise<Result<Reading[], RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_readings 
        WHERE user_id = '${userId}' AND textbook_id = '${textbookId}'
        ORDER BY round ASC
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find readings by user and textbook: ${error.message}`
          )
        );
      }

      const readings = await Promise.all(
        (data || []).map(async (row) => {
          const readingRow = row as ReadingRow;
          const chaptersProgressResult = await this.loadChapterProgress(
            readingRow.id as ReadingId
          );

          return Reading.fromPersistence(readingRow, {
            chaptersProgress: chaptersProgressResult.success
              ? chaptersProgressResult.data
              : [],
            studySessionIds: [],
          });
        })
      );

      return success(readings);
    } catch (error) {
      return failure(
        handleRepositoryError(error, "find readings by user and textbook")
      );
    }
  }

  async findLatestByUserAndTextbook(
    userId: UserId,
    textbookId: TextbookId
  ): Promise<Result<Reading | null, RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_readings 
        WHERE user_id = '${userId}' AND textbook_id = '${textbookId}'
        ORDER BY round DESC
        LIMIT 1
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to find latest reading: ${error.message}`)
        );
      }

      if (!data || data.length === 0) {
        return success(null);
      }

      const readingRow = data[0] as ReadingRow;

      // Load chapter progress
      const chaptersProgressResult = await this.loadChapterProgress(
        readingRow.id as ReadingId
      );
      if (!chaptersProgressResult.success) {
        if (isFailure(chaptersProgressResult)) {
          if (isFailure(chaptersProgressResult)) {
            return failure(chaptersProgressResult.error);
          } else {
            return failure(new Error("Unknown error"));
          }
        } else {
          return failure(new Error("Unknown error"));
        }
      }

      const reading = Reading.fromPersistence(readingRow, {
        chaptersProgress: chaptersProgressResult.data,
        studySessionIds: [],
      });

      return success(reading);
    } catch (error) {
      return failure(handleRepositoryError(error, "find latest reading"));
    }
  }

  async findByUserId(
    userId: UserId
  ): Promise<Result<Reading[], RepositoryError>> {
    try {
      const query = `
        SELECT * FROM study_cycle.sc_readings 
        WHERE user_id = '${userId}'
        ORDER BY created_at DESC
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to find readings by user: ${error.message}`
          )
        );
      }

      const readings = await Promise.all(
        (data || []).map(async (row) => {
          const readingRow = row as ReadingRow;
          const chaptersProgressResult = await this.loadChapterProgress(
            readingRow.id as ReadingId
          );

          return Reading.fromPersistence(readingRow, {
            chaptersProgress: chaptersProgressResult.success
              ? chaptersProgressResult.data
              : [],
            studySessionIds: [],
          });
        })
      );

      return success(readings);
    } catch (error) {
      return failure(handleRepositoryError(error, "find readings by user"));
    }
  }

  async delete(id: ReadingId): Promise<Result<void, RepositoryError>> {
    try {
      // Delete chapter progress first (foreign key constraint)
      const deleteProgressQuery = `
        DELETE FROM study_cycle.sc_reading_progress 
        WHERE reading_id = '${id}'
      `;

      const { error: progressError } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: deleteProgressQuery,
      });

      if (progressError) {
        return failure(
          new RepositoryError(
            `Failed to delete reading progress: ${progressError.message}`
          )
        );
      }

      // Delete reading
      const deleteReadingQuery = `
        DELETE FROM study_cycle.sc_readings 
        WHERE id = '${id}'
      `;

      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: deleteReadingQuery,
      });

      if (error) {
        return failure(
          new RepositoryError(`Failed to delete reading: ${error.message}`)
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(handleRepositoryError(error, "delete reading"));
    }
  }

  // Private helper methods
  private async loadChapterProgress(
    readingId: ReadingId
  ): Promise<Result<ChapterProgress[], RepositoryError>> {
    try {
      const query = `
        SELECT rp.*, c.title as chapter_title, c.order as chapter_order
        FROM study_cycle.sc_reading_progress rp
        LEFT JOIN study_cycle.sc_chapters c ON rp.chapter_id = c.id
        WHERE rp.reading_id = '${readingId}'
        ORDER BY c.order ASC
      `;

      const { data, error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (error) {
        return failure(
          new RepositoryError(
            `Failed to load chapter progress: ${error.message}`
          )
        );
      }

      const chaptersProgress: ChapterProgress[] = (data || []).map((row) => {
        const progressRow = row as ReadingProgressRow & {
          chapter_title: string;
          chapter_order: number;
        };
        return {
          chapterId: progressRow.chapter_id,
          chapterTitle:
            progressRow.chapter_title ||
            `Chapter ${progressRow.chapter_order || 1}`,
          totalPages: 100, // TODO: Get from chapter data when available
          completedPages: progressRow.completed_pages || 0,
          lastReadAt: progressRow.updated_at
            ? new Date(progressRow.updated_at)
            : undefined,
          isCompleted: progressRow.is_completed || false,
          difficultyRating: progressRow.difficulty_rating || undefined,
          comprehensionRating: progressRow.comprehension_rating || undefined,
          notes: progressRow.notes || undefined,
        };
      });

      return success(chaptersProgress);
    } catch (error) {
      return failure(handleRepositoryError(error, "load chapter progress"));
    }
  }

  private async saveChapterProgress(
    readingId: ReadingId,
    chaptersProgress: ChapterProgress[]
  ): Promise<Result<void, RepositoryError>> {
    try {
      // Delete existing progress first
      const deleteQuery = `
        DELETE FROM study_cycle.sc_reading_progress 
        WHERE reading_id = '${readingId}'
      `;

      const { error: deleteError } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: deleteQuery,
      });

      if (deleteError) {
        return failure(
          new RepositoryError(
            `Failed to clear existing progress: ${deleteError.message}`
          )
        );
      }

      // Insert new progress records
      for (const progress of chaptersProgress) {
        const insertQuery = `
          INSERT INTO study_cycle.sc_reading_progress (
            id, reading_id, chapter_id, pages_read, time_spent_minutes,
            comprehension_rating, difficulty_rating, notes, is_completed,
            completed_at, created_at, updated_at
          ) VALUES (
            '${crypto.randomUUID()}',
            '${readingId}',
            '${progress.chapterId}',
            ${progress.completedPages},
            0,
            ${progress.comprehensionRating || "NULL"},
            ${progress.difficultyRating || "NULL"},
            ${progress.notes ? `'${progress.notes.replace(/'/g, "''")}'` : "NULL"},
            ${progress.isCompleted},
            ${progress.isCompleted && progress.lastReadAt ? `'${progress.lastReadAt.toISOString()}'` : "NULL"},
            NOW(),
            NOW()
          )
        `;

        const { error } = await mcp_supabase_execute_sql({
          project_id: this.projectId,
          query: insertQuery,
        });

        if (error) {
          return failure(
            new RepositoryError(
              `Failed to save chapter progress: ${error.message}`
            )
          );
        }
      }

      return success(undefined);
    } catch (error) {
      return failure(handleRepositoryError(error, "save chapter progress"));
    }
  }
}
