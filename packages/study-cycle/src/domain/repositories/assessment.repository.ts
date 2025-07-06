import { Result, UserId } from "@posmul/shared-types";
import {
  Assessment,
  AssessmentId,
  AssessmentStatus,
  Submission,
} from "../entities/assessment.entity";

// Stats interfaces for analytics
export interface AssessmentStats {
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
}

export interface QuestionStats {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  averageScore: number;
  difficultyRating: number;
}

export interface StudentProgress {
  studentId: UserId;
  assessmentId: AssessmentId;
  currentQuestionIndex: number;
  completedQuestions: number;
  totalQuestions: number;
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Assessment Repository Interface
 *
 * Defines the contract for Assessment aggregate persistence.
 * Follows Clean Architecture principles - domain defines interface,
 * infrastructure provides implementation.
 *
 * All data access for child entities (Question, Submission) should go through the Assessment aggregate.
 */
export abstract class IAssessmentRepository {
  abstract save(assessment: Assessment): Promise<Result<void, Error>>;
  abstract findById(
    id: AssessmentId
  ): Promise<Result<Assessment | null, Error>>;
  abstract findByCreatorId(
    creatorId: UserId
  ): Promise<Result<Assessment[], Error>>;
  abstract findByStatus(
    status: AssessmentStatus
  ): Promise<Result<Assessment[], Error>>;
  abstract delete(id: AssessmentId): Promise<Result<void, Error>>;

  // Submission methods
  abstract saveSubmission(submission: Submission): Promise<Result<void, Error>>;
  abstract findSubmissionsByStudentId(
    studentId: UserId
  ): Promise<Result<Submission[], Error>>;
  abstract findSubmission(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<Submission | null, Error>>;

  // Analytics methods (optional - can be implemented later)
  abstract getAssessmentStats?(
    assessmentId: AssessmentId
  ): Promise<Result<AssessmentStats, Error>>;
  abstract getQuestionStats?(
    assessmentId: AssessmentId
  ): Promise<Result<QuestionStats[], Error>>;
  abstract getStudentProgress?(
    assessmentId: AssessmentId,
    studentId: UserId
  ): Promise<Result<StudentProgress | null, Error>>;
}
