/**
 * DTO for Assessment Solving
 *
 * Represents the data structure of an assessment prepared for a student to solve.
 * Crucially, it omits sensitive information like correct answers.
 */
import {
  AssessmentId,
  QuestionOption,
  QuestionType,
} from "../../domain/entities/assessment.entity";
import { QuestionId } from "../../domain/value-objects/question-id.value-object";

export interface QuestionForSolvingDto {
  id: QuestionId;
  type: QuestionType;
  title: string;
  content: string;
  points: number;
  options?: Omit<QuestionOption, "isCorrect" | "explanation">[];
  timeLimit?: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface AssessmentForSolvingDto {
  id: AssessmentId;
  title: string;
  description: string;
  questions: QuestionForSolvingDto[];
  timeLimit?: number;
  totalPoints: number;
  isRandomized: boolean;
}
