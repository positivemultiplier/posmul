/**
 * Get Assessment For Solving Use Case
 *
 * This use case retrieves an assessment and prepares it for a student to solve,
 * ensuring sensitive information like correct answers is stripped out.
 */
import {
  NotFoundError,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import { AssessmentId } from "../../domain/entities/assessment.entity";
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";
import {
  AssessmentForSolvingDto,
  QuestionForSolvingDto,
} from "../dto/assessment-for-solving.dto";

export class GetAssessmentForSolvingUseCase {
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    assessmentId: AssessmentId
  ): Promise<Result<AssessmentForSolvingDto, UseCaseError | NotFoundError>> {
    try {
      const assessmentResult =
        await this.assessmentRepository.findById(assessmentId);
      if (!assessmentResult.success) {
        return failure(
          new UseCaseError(
            "Failed to retrieve assessment.",
            assessmentResult.error
          )
        );
      }

      const assessment = assessmentResult.data;
      if (!assessment) {
        return failure(
          new NotFoundError(`Assessment with id ${assessmentId} not found.`)
        );
      }

      // Map domain entities to DTOs, stripping sensitive information
      const questionsForSolving: QuestionForSolvingDto[] =
        assessment.questions.map((q) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          content: q.content,
          points: q.points,
          options: q.options?.map((opt) => ({ id: opt.id, text: opt.text })),
          timeLimit: q.timeLimit,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
        }));

      const assessmentForSolving: AssessmentForSolvingDto = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        questions: assessment.isRandomized
          ? this.shuffleArray(questionsForSolving)
          : questionsForSolving,
        timeLimit: assessment.timeLimit,
        totalPoints: assessment.totalPoints,
        isRandomized: assessment.isRandomized,
      };

      return success(assessmentForSolving);
    } catch (error: unknown) {
      return failure(
        new UseCaseError("An unexpected error occurred.", error as Error)
      );
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
