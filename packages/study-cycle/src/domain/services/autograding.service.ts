import { Result } from "@posmul/shared-types";
import { Question, Submission } from "../entities/assessment.entity";

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
