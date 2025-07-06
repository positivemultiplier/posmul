/**
 * Create Question Use Case
 *
 * This use case is responsible for orchestrating the creation of a new question
 * and adding it to an existing assessment.
 */
import {
  DomainError,
  NotFoundError,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import {
  AssessmentId,
  Question,
} from "../../domain/entities/assessment.entity";
import { IAssessmentRepository } from "../../domain/repositories/assessment.repository";
import { CreateQuestionDto } from "../dto/create-question.dto";

export class CreateQuestionUseCase {
  constructor(private readonly assessmentRepository: IAssessmentRepository) {}

  async execute(
    assessmentId: AssessmentId,
    dto: CreateQuestionDto
  ): Promise<Result<Question, UseCaseError | DomainError | NotFoundError>> {
    try {
      // 1. Create Question entity
      const questionResult = Question.create(dto);
      if (!questionResult.success) {
        return questionResult; // Propagate domain validation error
      }
      const question = questionResult.data;

      // 2. Fetch the Assessment aggregate
      const assessmentResult =
        await this.assessmentRepository.findById(assessmentId);
      if (!assessmentResult.success) {
        // Propagate repository error as a UseCaseError
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

      // 3. Add the question to the assessment
      const addQuestionResult = assessment.addQuestion(question);
      if (!addQuestionResult.success) {
        return addQuestionResult; // Propagate domain business rule error
      }

      // 4. Save the updated assessment
      const saveResult = await this.assessmentRepository.save(assessment);
      if (!saveResult.success) {
        return failure(
          new UseCaseError("Failed to save assessment.", saveResult.error)
        );
      }

      return success(question);
    } catch (error: unknown) {
      return failure(
        new UseCaseError(
          "An unexpected error occurred while creating the question.",
          error as Error
        )
      );
    }
  }
}
