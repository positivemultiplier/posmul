import { StudySessionId, UserId, StudySessionSummary, ChapterId } from "../../domain/entities/study-session.entity";
import { TextbookId } from "../../domain/entities/textbook.entity";

// DTO for starting a new study session
export interface StartStudySessionRequest {
  userId: UserId;
  textbookId: TextbookId;
  chapterId?: ChapterId;
}

export interface StartStudySessionResponse {
  sessionId: StudySessionId;
  startTime: Date;
}

// DTO for ending an active study session
export interface EndStudySessionRequest {
  sessionId: StudySessionId;
  userId: UserId; // For validation
}

export interface EndStudySessionResponse {
  summary: StudySessionSummary;
}

// DTO for recording progress within a session
export interface RecordProgressRequest {
  sessionId: StudySessionId;
  userId: UserId; // For validation
  pagesRead: number;
  timeSpentMinutes: number;
  notesCount: number;
  difficultyRating: number; // 1-5 scale
  comprehensionRating: number; // 1-5 scale
}

// A simple acknowledgement response for actions that don't return data
export interface AcknowledgeResponse {
  success: boolean;
  message?: string;
} 