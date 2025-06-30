import {
  IUseCase,
  Result,
  UseCaseError,
  failure,
  success,
} from "@posmul/shared-types";
import { IStudySessionRepository } from "../../domain/repositories/study-session.repository";
import {
  EndStudySessionRequest,
  EndStudySessionResponse,
} from "../dto/study-session.dto";

export class EndStudySessionUseCase
  implements IUseCase<EndStudySessionRequest, EndStudySessionResponse>
{
  constructor(
    private readonly studySessionRepository: IStudySessionRepository
  ) {}

  async execute(
    request: EndStudySessionRequest
  ): Promise<Result<EndStudySessionResponse, UseCaseError>> {
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
          new UseCaseError("User is not authorized to end this session.")
        );
      }

      // 3. End the session using the domain entity's logic
      const endResult = session.endSession();
      if (!endResult.success) {
        // The error from the domain is a DomainError, wrap it in a UseCaseError
        return failure(
          new UseCaseError(endResult.error.message, endResult.error)
        );
      }

      // 4. Save the updated session
      const saveResult = await this.studySessionRepository.save(session);
      if (!saveResult.success) {
        return failure(
          new UseCaseError("Failed to save the ended session", saveResult.error)
        );
      }

      // 5. Return the response DTO
      const response: EndStudySessionResponse = {
        summary: endResult.data,
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
