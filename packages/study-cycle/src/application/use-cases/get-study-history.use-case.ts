import {
  IUseCase,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import {
  StudySession,
  StudySessionSummary,
} from "../../domain/entities/study-session.entity";
import { IStudySessionRepository } from "../../domain/repositories/study-session.repository";
import {
  GetStudyHistoryRequest,
  GetStudyHistoryResponse,
} from "../dto/study-query.dto";

export class GetStudyHistoryUseCase
  implements IUseCase<GetStudyHistoryRequest, GetStudyHistoryResponse>
{
  constructor(
    private readonly studySessionRepository: IStudySessionRepository
  ) {}

  async execute(
    request: GetStudyHistoryRequest
  ): Promise<Result<GetStudyHistoryResponse, UseCaseError>> {
    try {
      const { userId, limit, offset } = request;

      // Fetch sessions from the repository
      const sessionsResult = await this.studySessionRepository.findByUserId(
        userId,
        limit,
        offset
      );
      if (!sessionsResult.success) {
        return failure(
          new UseCaseError(
            "Failed to retrieve study history",
            sessionsResult.error
          )
        );
      }

      const sessions = sessionsResult.data;

      // For now, total is the count of the returned sessions.
      // A more robust implementation would have a separate count query.
      const total = sessions.length;

      // Map completed entities to summary DTOs
      const history: StudySessionSummary[] = sessions
        .filter((session) => session.status === "completed" && session.endTime)
        .map((session) => this.mapToSummary(session));

      const response: GetStudyHistoryResponse = {
        history,
        total,
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

  private mapToSummary(session: StudySession): StudySessionSummary {
    // This mapping assumes the StudySession entity has public getters or properties
    // for all the required fields in StudySessionSummary.
    return {
      sessionId: session.id,
      textbookId: session.textbookId,
      chapterId: session.chapterId,
      totalTimeMinutes: session.getSessionDurationMinutes(),
      pagesCompleted: session.pagesCompleted,
      averageDifficulty: session.calculateAverageRating(
        session.difficultyRatings
      ),
      averageComprehension: session.calculateAverageRating(
        session.comprehensionRatings
      ),
      startedAt: session.startTime,
      completedAt: session.endTime!, // Non-null assertion is safe here due to the filter above
    };
  }
}
