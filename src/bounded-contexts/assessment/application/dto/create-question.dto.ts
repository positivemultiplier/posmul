/**
 * Create Question DTO
 * 
 * Represents the data transfer object for creating a new question.
 * This DTO is used in the application layer to receive data from the presentation layer.
 */
import { QuestionType, QuestionOption } from "../../domain/entities/assessment.entity";
import { SolutionTemplateId } from "../../domain/entities/solution-template.entity";

export interface CreateQuestionDto {
  templateId: SolutionTemplateId;
  type: QuestionType;
  title: string;
  content: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string;
  gradingCriteria?: string;
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
} 