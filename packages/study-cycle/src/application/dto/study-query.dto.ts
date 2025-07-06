import { UserId } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";
import { ReadingMetrics } from "../../domain/entities/reading.entity";
import { StudySessionSummary } from "../../domain/entities/study-session.entity";

// DTO for getting a user's study history
export interface GetStudyHistoryRequest {
  userId: UserId;
  limit?: number;
  offset?: number;
}

export interface GetStudyHistoryResponse {
  history: StudySessionSummary[];
  total: number;
}

// DTO for calculating progress for a specific reading round
export interface CalculateReadingProgressRequest {
  userId: UserId;
  textbookId: TextbookId;
}

export interface CalculateReadingProgressResponse {
  metrics: ReadingMetrics;
} 