/**
 * @file assessment-result.dto.ts
 * @description This file contains the Data Transfer Objects (DTOs) for representing
 * the results of a completed assessment. These DTOs are designed to be sent to the
 * presentation layer to display a detailed analysis of a user's performance.
 */

import {
  AssessmentId,
  QuestionOption,
  QuestionType,
} from "../../domain/entities/assessment.entity";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

// Re-export QuestionType for external use
export { QuestionType };

/**
 * Represents the type of a user's answer for a question. It can be a single
 * string (e.g., for short answer or single-choice) or an array of strings
 * (e.g., for multiple-select). It can be null if the user did not answer.
 */
export type UserAnswer = string | string[] | number | null;

/**
 * Represents the result of a single question within an assessment.
 */
export interface QuestionResultDto {
  id: QuestionId;
  type: QuestionType;
  title: string;
  content: string;
  userAnswer: UserAnswer;
  correctAnswer: UserAnswer; // Correct answer can also be complex
  isCorrect: boolean;
  score: number;
  maxScore: number;
  options: QuestionOption[];
  explanation?: string;
}

/**
 * Represents the complete result of a user's assessment attempt.
 * This DTO aggregates the assessment details, user's overall performance,
 * and a breakdown of each question's result.
 */
export interface AssessmentResultDto {
  assessmentId: AssessmentId;
  userId: string; // Assuming userId is a string
  title: string;
  description: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F"; // Example grading
  startedAt: Date;
  completedAt: Date;
  timeTakenInSeconds: number;
  questionResults: QuestionResultDto[];
}
