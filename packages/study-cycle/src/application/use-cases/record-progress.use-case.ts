import {
  IUseCase,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import { IStudySessionRepository } from "../../domain/repositories/study-session.repository";
import {
  AcknowledgeResponse,
  RecordProgressRequest,
} from "../dto/study-session.dto";

export class RecordProgressUseCase
  implements IUseCase<RecordProgressRequest, AcknowledgeResponse>
{
  constructor(
    private readonly studySessionRepository: IStudySessionRepository
  ) {}

  async execute(
    request: RecordProgressRequest
  ): Promise<Result<AcknowledgeResponse, UseCaseError>> {
    try {
      // 1. Find the study session by ID
      const sessionResult = await this.studySessionRepository.findById(
        request.sessionId
      );
      if (!sessionResult.success) {
        return failure(
          new UseCaseError(
            "Failed to retrieve study session",
            sessionResult.error
          )
        );
      }

      const session = sessionResult.data;
      if (!session) {
        return failure(new UseCaseError("Study session not found."));
      }

      // 2. Validate ownership
      if (session.userId !== request.userId) {
        return failure(
          new UseCaseError(
            "User is not authorized to record progress for this session."
          )
        );
      }

      // 3. Record progress using the domain entity's logic
      const progressResult = session.recordProgress({
        pagesRead: request.pagesRead,
        timeSpentMinutes: request.timeSpentMinutes,
        notesCount: request.notesCount,
        difficultyRating: request.difficultyRating,
        comprehensionRating: request.comprehensionRating,
      });

      if (!progressResult.success) {
        return failure(
          new UseCaseError(progressResult.error.message, progressResult.error)
        );
      }

      // 4. Save the updated session
      const saveResult = await this.studySessionRepository.save(session);
      if (!saveResult.success) {
        return failure(
          new UseCaseError(
            "Failed to save session with new progress",
            saveResult.error
          )
        );
      }

      // 5. Return acknowledgement
      return success({
        success: true,
        message: "Progress recorded successfully.",
      });
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
