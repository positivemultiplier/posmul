import {
  IUseCase,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import { StudySession } from "../../domain/entities/study-session.entity";
import { IStudySessionRepository } from "../../domain/repositories/study-session.repository";
import {
  StartStudySessionRequest,
  StartStudySessionResponse,
} from "../dto/study-session.dto";

export class StartStudySessionUseCase
  implements IUseCase<StartStudySessionRequest, StartStudySessionResponse>
{
  constructor(
    private readonly studySessionRepository: IStudySessionRepository
  ) {}

  async execute(
    request: StartStudySessionRequest
  ): Promise<Result<StartStudySessionResponse, UseCaseError>> {
    try {
      // 1. Check for existing active session for the user
      const activeSessionResult =
        await this.studySessionRepository.findActiveByUserId(request.userId);
      if (!activeSessionResult.success) {
        return failure(
          new UseCaseError(
            "Failed to check for active session",
            activeSessionResult.error
          )
        );
      }
      if (activeSessionResult.data) {
        return failure(
          new UseCaseError("User already has an active study session.")
        );
      }

      // 2. Create a new StudySession entity
      const studySessionResult = StudySession.create({
        userId: request.userId,
        textbookId: request.textbookId,
        chapterId: request.chapterId,
      });

      if (!studySessionResult.success) {
        return failure(
          new UseCaseError(
            "Failed to create study session",
            studySessionResult.error
          )
        );
      }

      const newSession = studySessionResult.data;

      // 3. Save the new session to the repository
      const saveResult = await this.studySessionRepository.save(newSession);
      if (!saveResult.success) {
        return failure(
          new UseCaseError("Failed to save study session", saveResult.error)
        );
      }

      // 4. Return the response
      const response: StartStudySessionResponse = {
        sessionId: newSession.id,
        startTime: newSession.startTime,
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
