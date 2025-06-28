/**
 * DTO for Assessment Submission
 *
 * Represents the data structure for a user's submission for an assessment.
 */
import { AssessmentId, QuestionId } from "../../domain/entities/assessment.entity";
import { UserId } from "../../../../shared/types/branded-types";

export interface AnswerDto {
  questionId: QuestionId;
  value: string | string[]; // For multiple choice, could be an array of option IDs
}

export interface SubmitAssessmentDto {
  assessmentId: AssessmentId;
  userId: UserId;
  answers: AnswerDto[];
} 