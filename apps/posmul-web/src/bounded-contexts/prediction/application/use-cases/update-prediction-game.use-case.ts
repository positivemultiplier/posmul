/**
 * Update Prediction Game Use Case
 *
 * 예측 게임 정보 수정 비즈니스 로직을 처리합니다.
 * - 게임 생성자만 수정 가능
 * - 활성화된 게임의 제한적 수정
 * - 버전 관리
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { UseCaseError } from "../../../../shared/errors";
import {
  PMP,
  PredictionGameId,
  UserId,
} from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/common";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";

/**
 * 게임 수정 요청 DTO
 */
export interface UpdatePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly updatedBy: UserId;
  readonly updates: {
    readonly title?: string;
    readonly description?: string;
    readonly endTime?: Date;
    readonly settlementTime?: Date;
    readonly minimumStake?: number;
    readonly maximumStake?: number;
    readonly maxParticipants?: number;
  };
}

/**
 * 게임 수정 응답 DTO
 */
export interface UpdatePredictionGameResponse {
  readonly gameId: string;
  readonly updatedFields: string[];
  readonly version: number;
  readonly updatedAt: Date;
}

/**
 * 예측 게임 수정 Use Case
 */
export class UpdatePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * Use Case 실행
   */
  async execute(
    request: UpdatePredictionGameRequest
  ): Promise<Result<UpdatePredictionGameResponse, UseCaseError>> {
    try {
      // 1. 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );

      if (!gameResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to fetch prediction game",
            gameResult.error
          ),
        };
      }

      const game = gameResult.data;
      if (!game) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      // 2. 권한 확인 (생성자만 수정 가능)
      if (game.getCreatedBy() !== request.updatedBy) {
        return {
          success: false,
          error: new UseCaseError("Only the game creator can update this game"),
        };
      } // 3. 게임 상태 확인 (활성화된 게임은 제한적 수정만 가능)
      const currentStatus = game.status;
      if (currentStatus.isSettled()) {
        return {
          success: false,
          error: new UseCaseError("Cannot update completed or cancelled games"),
        };
      }

      // 4. 수정 가능한 필드 확인
      const updatedFields: string[] = [];
      let hasChanges = false;

      // 제목 수정
      if (request.updates.title && request.updates.title !== game.getTitle()) {
        const updateResult = game.updateTitle(request.updates.title);
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update title: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("title");
        hasChanges = true;
      }

      // 설명 수정
      if (
        request.updates.description &&
        request.updates.description !== game.getDescription()
      ) {
        const updateResult = game.updateDescription(
          request.updates.description
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update description: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("description");
        hasChanges = true;
      } // 종료 시간 수정 (활성화 전에만 가능)
      if (request.updates.endTime && currentStatus.isCreated()) {
        const updateResult = game.updateEndTime(request.updates.endTime);
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update end time: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("endTime");
        hasChanges = true;
      } // 정산 시간 수정 (활성화 전에만 가능)
      if (request.updates.settlementTime && currentStatus.isCreated()) {
        const updateResult = game.updateSettlementTime(
          request.updates.settlementTime
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update settlement time: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("settlementTime");
        hasChanges = true;
      } // 최소 스테이크 수정 (활성화 전에만 가능)
      if (
        request.updates.minimumStake !== undefined &&
        currentStatus.isCreated()
      ) {
        const updateResult = game.updateMinimumStake(
          request.updates.minimumStake as PMP
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update minimum stake: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("minimumStake");
        hasChanges = true;
      } // 최대 스테이크 수정 (활성화 전에만 가능)
      if (
        request.updates.maximumStake !== undefined &&
        currentStatus.isCreated()
      ) {
        const updateResult = game.updateMaximumStake(
          request.updates.maximumStake as PMP
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update maximum stake: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("maximumStake");
        hasChanges = true;
      } // 최대 참여자 수정 (활성화 전에만 가능)
      if (
        request.updates.maxParticipants !== undefined &&
        currentStatus.isCreated()
      ) {
        const updateResult = game.updateMaxParticipants(
          request.updates.maxParticipants
        );
        if (!updateResult.success) {
          return {
            success: false,
            error: new UseCaseError(
              `Failed to update max participants: ${updateResult.error.message}`,
              updateResult.error
            ),
          };
        }
        updatedFields.push("maxParticipants");
        hasChanges = true;
      }

      // 5. 변경사항이 없는 경우
      if (!hasChanges) {
        return {
          success: false,
          error: new UseCaseError("No valid updates provided"),
        };
      }

      // 6. 게임 저장
      const saveResult = await this.predictionGameRepository.save(game);
      if (!saveResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to save updated game",
            saveResult.error
          ),
        };
      }

      return {
        success: true,
        data: {
          gameId: game.id,
          updatedFields,
          version: game.getVersion(),
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in UpdatePredictionGameUseCase",
          error as Error
        ),
      };
    }
  }
}
