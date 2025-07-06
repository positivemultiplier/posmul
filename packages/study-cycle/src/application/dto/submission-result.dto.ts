/**
 * DTO for Submission Result
 *
 * Represents the detailed result of an assessment submission after grading.
 */
import { UserId } from "@posmul/shared-types";
import {
  AssessmentId,
  SubmissionId,
} from "../../domain/entities/assessment.entity";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

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
