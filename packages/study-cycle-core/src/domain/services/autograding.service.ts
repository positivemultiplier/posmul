import { Result } from "@/shared/types/common";
import { Submission } from "../entities/submission.entity";
import { Question } from "../entities/question.entity";

export interface GradedResult {
  isCorrect: boolean;
  score: number;
  feedback?: string;
}

export abstract class IAutoGradingService {
  abstract grade(
    submission: Submission,
    question: Question
  ): Promise<Result<GradedResult, Error>>;
} 