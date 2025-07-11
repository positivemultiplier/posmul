/**
 * Participate in Prediction Game Use Case
 *
 * 예측 게임 참여 비즈니스 로직을 처리합니다.
 * - PmpAmount 잔액 확인
 * - 예측 참여 처리
 * - 경제 이벤트 발행
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PredictionGameId,
  Result,
  UserId,
  PmpAmount,
  UseCaseError,
  isFailure,
} from "@posmul/auth-economy-sdk";
import { Prediction } from "../../domain/entities/prediction.entity";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import { PredictionEconomicService } from "../../domain/services/prediction-economic.service";
import { success, failure } from "../../../auth/domain/helpers/result-helpers";

/**
 * 예측 참여 요청 DTO
 */
export interface ParticipatePredictionRequest {
  readonly userId: UserId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stakeAmount: PmpAmount;
  readonly confidence: number; // 0-1 사이 신뢰도
  readonly reasoning?: string; // 선택 이유 (선택사항)
}

/**
 * 예측 참여 응답 DTO
 */
export interface ParticipatePredictionResponse {
  readonly predictionId: string;
}

/**
 * 예측 게임 참여 Use Case
 */
export class ParticipatePredictionUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository,
    private readonly predictionEconomicService: PredictionEconomicService
  ) {}
  async execute(
    request: ParticipatePredictionRequest
  ): Promise<Result<ParticipatePredictionResponse, UseCaseError>> {
    try {
      // 1. PmpAmount 참여 자격 및 위험 평가
      const eligibilityResult =
        await this.predictionEconomicService.checkPmpParticipationEligibility(
          request.userId,
          request.stakeAmount
        );

      if (!eligibilityResult.success) {
        return failure(
          new UseCaseError(
            "Failed to check PmpAmount participation eligibility",
            {
              message: isFailure(eligibilityResult)
                ? "eligibility check failed"
                : "unknown error",
            }
          )
        );
      }
      if (!eligibilityResult.data.canParticipate) {
        return {
          success: false,
          error: new UseCaseError(
            `Insufficient PmpAmount balance. Required: ${eligibilityResult.data.requiredAmount}`
          ),
        };
      }

      // 2. 예측 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (!gameResult.success) {
        return {
          success: false,
          error: new UseCaseError("Failed to retrieve prediction game"),
        };
      }
      if (!gameResult.data) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }
      const predictionGame = gameResult.data;

      // 3. 예측 엔티티 생성
      const predictionResult = Prediction.create({
        userId: request.userId,
        gameId: request.gameId,
        selectedOptionId: request.selectedOptionId,
        stake: request.stakeAmount as any,
        confidence: request.confidence || 0.5,
      });

      if (!predictionResult.success) {
        return failure(
          new UseCaseError("Failed to create prediction entity", {
            message: isFailure(predictionResult)
              ? "prediction creation failed"
              : "unknown error",
          })
        );
      }
      const prediction = predictionResult.data;

      // 4. 예측 게임에 참여 처리
      const participationResult = predictionGame.addPrediction(prediction);

      if (!participationResult.success) {
        return failure(
          new UseCaseError("Failed to add prediction to game", {
            message: isFailure(participationResult)
              ? "participation failed"
              : "unknown error",
          })
        );
      }

      // 5. 게임 상태 저장
      const saveResult =
        await this.predictionGameRepository.save(predictionGame);
      if (!saveResult.success) {
        return failure(
          new UseCaseError("Failed to save prediction game state", {
            message: isFailure(saveResult) ? "save failed" : "unknown error",
          })
        );
      }

      // 6. 경제 시스템에서 예측 참여 처리 (PmpAmount 차감 + 이벤트 발행)
      const economicProcessResult =
        await this.predictionEconomicService.processParticipation(
          request.userId,
          request.gameId,
          prediction.id,
          request.stakeAmount,
          request.confidence,
          request.selectedOptionId
        );

      if (!economicProcessResult.success) {
        // NOTE: Here we have a problem. The game is saved, but the economic part failed.
        // This requires a compensation transaction (Saga pattern, etc.).
        // For now, we just return an error.
        return {
          success: false,
          error: new UseCaseError("Economic process failed"),
        };
      }

      // 7. 응답 생성
      return success({
        predictionId: prediction.id,
      });
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in ParticipatePredictionUseCase",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }
}
