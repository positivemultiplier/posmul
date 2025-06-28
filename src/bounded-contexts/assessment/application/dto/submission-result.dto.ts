/**
 * DTO for Submission Result
 *
 * Represents the detailed result of an assessment submission after grading.
 */
import { AssessmentId, QuestionId, SubmissionId } from "../../domain/entities/assessment.entity";
import { UserId } from "../../../../shared/types/branded-types";

export interface GradedAnswer {
  questionId: QuestionId;
  isCorrect: boolean;
  score: number;
  userAnswer?: string | string[];
  correctAnswer?: string | string[];
}

export interface SubmissionResultDto {
  submissionId: SubmissionId;
  assessmentId: AssessmentId;
  studentId: UserId;
  finalScore: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  gradedAnswers: GradedAnswer[];
} 