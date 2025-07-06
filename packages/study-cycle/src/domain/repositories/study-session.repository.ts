import { RepositoryError, Result } from "@posmul/shared-types";
import {
  StudySession,
  StudySessionId,
  UserId,
} from "../entities/study-session.entity";
import { TextbookId } from "../entities/textbook.entity";

export interface IStudySessionRepository {
  /**
   * Save a study session (create or update)
   */
  save(session: StudySession): Promise<Result<void, RepositoryError>>;

  /**
   * Find study session by ID
   */
  findById(
    id: StudySessionId
  ): Promise<Result<StudySession | null, RepositoryError>>;

  /**
   * Find active study session for a user
   */
  findActiveByUserId(
    userId: UserId
  ): Promise<Result<StudySession | null, RepositoryError>>;

  /**
   * Find all study sessions for a user
   */
  findByUserId(
    userId: UserId,
    limit?: number,
    offset?: number
  ): Promise<Result<StudySession[], RepositoryError>>;

  /**
   * Find study sessions by textbook
   */
  findByTextbookId(
    textbookId: TextbookId,
    limit?: number,
    offset?: number
  ): Promise<Result<StudySession[], RepositoryError>>;

  /**
   * Find study sessions by user and textbook
   */
  findByUserAndTextbook(
    userId: UserId,
    textbookId: TextbookId
  ): Promise<Result<StudySession[], RepositoryError>>;

  /**
   * Delete a study session
   */
  delete(id: StudySessionId): Promise<Result<void, RepositoryError>>;

  /**
   * Get total study time for a user
   */
  getTotalStudyTimeByUserId(
    userId: UserId
  ): Promise<Result<number, RepositoryError>>;

  /**
   * Get study session statistics for a user
   */
  getStudyStatsByUserId(userId: UserId): Promise<
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
  >;
}
