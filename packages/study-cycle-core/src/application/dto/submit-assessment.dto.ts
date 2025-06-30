/**
 * DTO for Assessment Submission
 *
 * Represents the data structure for a user's submission for an assessment.
 */
import { UserId } from "@posmul/shared-types";
import { AssessmentId } from "../../domain/entities/assessment.entity";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

export interface AnswerDto {
  questionId: QuestionId;
  value: string | string[]; // For multiple choice, could be an array of option IDs
}

export interface SubmitAssessmentDto {
  assessmentId: AssessmentId;
  userId: UserId;
  answers: AnswerDto[];
}
