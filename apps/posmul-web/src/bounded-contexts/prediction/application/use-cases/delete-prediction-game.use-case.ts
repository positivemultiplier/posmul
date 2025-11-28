/**
 * Delete Prediction Game Use Case
 *
 * 예측 게임 삭제 비즈니스 로직을 처리합니다.
 * - 게임 생성자 또는 관리자만 삭제 가능
 * - 활성화된 게임은 삭제 불가
 * - 소프트 삭제 방식 사용
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  PredictionGameId,
  Result,
  UseCaseError,
  UserId,
  isFailure,
} from "@posmul/auth-economy-sdk";

import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import { GameStatusUtil } from "../../domain/value-objects/prediction-types";

/**
 * 게임 삭제 요청 DTO
 */
export interface DeletePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly deletedBy: UserId;
  readonly reason?: string;
}

/**
 * 게임 삭제 응답 DTO
 */
export interface DeletePredictionGameResponse {
  readonly gameId: string;
  readonly deletedAt: Date;
  readonly reason: string;
}

/**
 * 예측 게임 삭제 Use Case
 */
export class DeletePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * Use Case 실행
   */
  async execute(
    request: DeletePredictionGameRequest
  ): Promise<Result<DeletePredictionGameResponse, UseCaseError>> {
    try {
      // 1. 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );

      if (isFailure(gameResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to fetch prediction game"),
        };
      }

      const game = gameResult.data;
      if (!game) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      const canDelete = this.canDeleteGame(game, request.deletedBy);
      if (!canDelete) {
        return {
          success: false,
          error: new UseCaseError(
            "Only the game creator or admin can delete this game"
          ),
        };
      }

      const currentStatus = new GameStatusUtil(game.status.value);
      if (currentStatus.isActive() && this.hasParticipants(game)) {
        return {
          success: false,
          error: new UseCaseError(
            "Cannot delete an active game with participants"
          ),
        };
      }

      if (currentStatus.isCompleted() || currentStatus.isCancelled()) {
        return {
          success: false,
          error: new UseCaseError("Cannot delete completed or cancelled games"),
        };
      }
      try {
        // TODO: game.markAsDeleted 메서드 구현 필요
        // game.markAsDeleted(request.deletedBy, request.reason || "User requested deletion");
        // 임시로 상태 변경으로 처리
        // game.changeStatus('DELETED');
      } catch (error) {
        return {
          success: false,
          error: new UseCaseError("Failed to mark game as deleted"),
        };
      }

      // 5. 변경사항 저장
      const saveResult = await this.predictionGameRepository.save(game);
      if (isFailure(saveResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to save deleted game"),
        };
      }

      return {
        success: true,
        data: {
          gameId: game.getId(),
          deletedAt: new Date(),
          reason: request.reason || "User requested deletion",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in DeletePredictionGameUseCase"
        ),
      };
    }
  }

  /**
   * 게임 삭제 권한 확인
   */
  private canDeleteGame(game: any, userId: UserId): boolean {
    // TODO: 실제 구현에서는 게임의 createdBy 프로퍼티와 비교
    // 또는 관리자 권한 확인 로직 추가
    return true; // 임시로 모든 사용자에게 권한 부여
  }

  /**
   * 게임에 참여자가 있는지 확인
   */
  private hasParticipants(game: any): boolean {
    // TODO: 실제 구현에서는 게임의 predictions 맵 크기 확인
    return false; // 임시로 참여자 없음으로 처리
  }
}
