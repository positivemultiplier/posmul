/**
 * Participate in Prediction Game Use Case
 *
 * 예측 게임 참여 비즈니스 로직을 처리합니다.
 * - PMP 잔액 확인
 * - 예측 참여 처리
 * - 경제 이벤트 발행
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { PredictionGameId, PredictionId, Result, UserId, PmpAmount, UseCaseError } from "@posmul/auth-economy-sdk";
import { Prediction } from "../../domain/entities/prediction.entity";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import { PredictionEconomicService } from "../../domain/services/prediction-economic.service";

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
  readonly predictionId: PredictionId;
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
      // 1. PMP 참여 자격 및 위험 평가
      const eligibilityResult =
        await this.predictionEconomicService.checkPmpParticipationEligibility(
          request.userId,
          request.stakeAmount
        );

      if (!eligibilityResult.success) {
        return failure(
          new UseCaseError(
            "Failed to check PMP participation eligibility",
            eligibilityResult.error
          )
        );
      }
      if (!eligibilityResult.data.canParticipate) {
        return failure(
          new UseCaseError(
            `Insufficient PMP balance. Required: ${eligibilityResult.data.requiredAmount}, Available: ${eligibilityResult.data.currentBalance}`
          )
        );
      }

      // 2. 예측 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (!gameResult.success) {
        return failure(
          new UseCaseError(
            "Failed to retrieve prediction game",
            gameResult.error
          )
        );
      }
      if (!gameResult.data) {
        return failure(new UseCaseError("Prediction game not found"));
      }
      const predictionGame = gameResult.data;

      // 3. 예측 엔티티 생성
      const predictionResult = Prediction.create({
        userId: request.userId,
        gameId: request.gameId,
        selectedOptionId: request.selectedOptionId,
        stake: request.stakeAmount,
        confidence: request.confidence,
        reasoning: request.reasoning,
      });

      if (!predictionResult.success) {
        return failure(
          new UseCaseError(
            "Failed to create prediction entity",
            predictionResult.error
          )
        );
      }
      const prediction = predictionResult.data;

      // 4. 예측 게임에 참여 처리
      const participationResult = predictionGame.addPrediction(prediction);

      if (!participationResult.success) {
        return failure(
          new UseCaseError(
            "Failed to add prediction to game",
            participationResult.error
          )
        );
      }

      // 5. 게임 상태 저장
      const saveResult =
        await this.predictionGameRepository.save(predictionGame);
      if (!saveResult.success) {
        return failure(
          new UseCaseError(
            "Failed to save prediction game state",
            saveResult.error
          )
        );
      }

      // 6. 경제 시스템에서 예측 참여 처리 (PMP 차감 + 이벤트 발행)
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
        return failure(
          new UseCaseError(
            "Game saved, but failed to process economic participation. Please check system.",
            economicProcessResult.error
          )
        );
      }

      // 7. 응답 생성
      return success({
        predictionId: prediction.id,
      });
    } catch (error) {
      return failure(
        new UseCaseError(
          "Unexpected error in ParticipatePredictionUseCase",
          error as Error
        )
      );
    }
  }
}
