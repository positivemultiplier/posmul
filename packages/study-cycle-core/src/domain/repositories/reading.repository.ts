import { Result } from "../../../../shared/types";
import { RepositoryError } from "../../../../shared/errors";
import { Reading, ReadingId } from "../entities/reading.entity";
import { UserId } from "../entities/study-session.entity";
import { TextbookId } from "../entities/textbook.entity";

export interface IReadingRepository {
  /**
   * Save a reading round (create or update)
   * @param reading The Reading aggregate root to save
   */
  save(reading: Reading): Promise<Result<void, RepositoryError>>;

  /**
   * Find a reading round by its ID
   * @param id The ID of the reading round
   */
  findById(id: ReadingId): Promise<Result<Reading | null, RepositoryError>>;

  /**
   * Find all reading rounds for a specific user and textbook
   * @param userId The ID of the user
   * @param textbookId The ID of the textbook
   */
  findByUserAndTextbook(userId: UserId, textbookId: TextbookId): Promise<Result<Reading[], RepositoryError>>;

  /**
   * Find the latest reading round for a specific user and textbook
   * @param userId The ID of the user
   * @param textbookId The ID of the textbook
   */
  findLatestByUserAndTextbook(userId: UserId, textbookId: TextbookId): Promise<Result<Reading | null, RepositoryError>>;
  
  /**
   * Find all reading rounds for a user
   * @param userId The user's ID
   */
  findByUserId(userId: UserId): Promise<Result<Reading[], RepositoryError>>;

  /**
   * Delete a reading round by its ID
   * @param id The ID of the reading round
   */
  delete(id: ReadingId): Promise<Result<void, RepositoryError>>;
} 