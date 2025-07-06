import {
  IUseCase,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import { IReadingRepository } from "../../domain/repositories/reading.repository";
import {
  CalculateReadingProgressRequest,
  CalculateReadingProgressResponse,
} from "../dto/study-query.dto";

export class CalculateReadingProgressUseCase
  implements
    IUseCase<CalculateReadingProgressRequest, CalculateReadingProgressResponse>
{
  constructor(private readonly readingRepository: IReadingRepository) {}

  async execute(
    request: CalculateReadingProgressRequest
  ): Promise<Result<CalculateReadingProgressResponse, UseCaseError>> {
    try {
      const { userId, textbookId } = request;

      // 1. Find the latest reading round for the textbook
      const readingResult =
        await this.readingRepository.findLatestByUserAndTextbook(
          userId,
          textbookId
        );
      if (!readingResult.success) {
        return failure(
          new UseCaseError(
            "Failed to retrieve reading session.",
            readingResult.error
          )
        );
      }

      const reading = readingResult.data;
      if (!reading) {
        return failure(
          new UseCaseError("No active reading session found for this textbook.")
        );
      }

      // 2. Use the domain entity's own method to calculate metrics
      const metrics = reading.calculateMetrics();

      const response: CalculateReadingProgressResponse = {
        metrics,
      };

      return success(response);
    } catch (error) {
      return failure(
        new UseCaseError(
          "An unexpected error occurred",
          error instanceof Error ? error : new Error(String(error))
        )
      );
    }
  }
}
