/**
 * Participate in Prediction Game Use Case
 *
 * 예측 게임 참여 비즈니스 로직을 처리합니다.
 * - PmpAmount 잔액 확인 및 차감
 * - 예측 참여 처리
 * - 경제 이벤트 발행
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  PmpAmount,
  PredictionGameId,
  Result,
  UseCaseError,
  UserId,
  isFailure,
  unwrapPmpAmount,
} from "@posmul/auth-economy-sdk";

import { createClient } from "../../../../lib/supabase/server";
import { failure, success } from "../../../auth/domain/helpers/result-helpers";
import { Prediction } from "../../domain/entities/prediction.entity";
import type { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
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

  private fail(message: string, details?: Record<string, unknown>) {
    return failure(new UseCaseError(message, details));
  }

  private async ensureEligibility(
    request: ParticipatePredictionRequest
  ): Promise<Result<void, UseCaseError>> {
    const eligibilityResult =
      await this.predictionEconomicService.checkPmpParticipationEligibility(
        request.userId,
        request.stakeAmount
      );

    if (!eligibilityResult.success) {
      return this.fail("Failed to check PmpAmount participation eligibility", {
        message: isFailure(eligibilityResult)
          ? "eligibility check failed"
          : "unknown error",
      });
    }

    if (!eligibilityResult.data.canParticipate) {
      return {
        success: false,
        error: new UseCaseError(
          `Insufficient PmpAmount balance. Required: ${eligibilityResult.data.requiredAmount}`
        ),
      };
    }

    return { success: true, data: undefined };
  }

  private async getGame(
    gameId: PredictionGameId
  ): Promise<Result<PredictionGame, UseCaseError>> {
    const gameResult = await this.predictionGameRepository.findById(gameId);

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

    return { success: true, data: gameResult.data };
  }

  private createPrediction(
    request: ParticipatePredictionRequest
  ): Result<Prediction, UseCaseError> {
    const predictionResult = Prediction.create({
      userId: request.userId,
      gameId: request.gameId,
      selectedOptionId: request.selectedOptionId,
      stake: request.stakeAmount,
      confidence: request.confidence || 0.5,
      reasoning: request.reasoning,
    });

    if (!predictionResult.success) {
      return this.fail("Failed to create prediction entity", {
        message: isFailure(predictionResult)
          ? "prediction creation failed"
          : "unknown error",
      });
    }

    return { success: true, data: predictionResult.data };
  }

  private addPredictionToGame(
    game: PredictionGame,
    prediction: Prediction
  ): Result<void, UseCaseError> {
    const participationResult = game.addPrediction(prediction);
    if (!participationResult.success) {
      return this.fail("Failed to add prediction to game", {
        message: isFailure(participationResult)
          ? "participation failed"
          : "unknown error",
      });
    }
    return { success: true, data: undefined };
  }

  private async savePredictionOnly(
    game: PredictionGame
  ): Promise<Result<void, UseCaseError>> {
    const saveResult = await this.predictionGameRepository.save(game, {
      skipGameUpdate: true,
    });
    if (!saveResult.success) {
      return this.fail("Failed to save prediction game state", {
        message: isFailure(saveResult) ? "save failed" : "unknown error",
      });
    }
    return { success: true, data: undefined };
  }

  async execute(
    request: ParticipatePredictionRequest
  ): Promise<Result<ParticipatePredictionResponse, UseCaseError>> {
    try {
      const eligibilityResult = await this.ensureEligibility(request);
      if (!eligibilityResult.success) return eligibilityResult;

      const gameResult = await this.getGame(request.gameId);
      if (!gameResult.success) return gameResult;
      const predictionGame = gameResult.data;

      const predictionResult = this.createPrediction(request);
      if (!predictionResult.success) return predictionResult;
      const prediction = predictionResult.data;

      const participationResult = this.addPredictionToGame(
        predictionGame,
        prediction
      );
      if (!participationResult.success) return participationResult;

      const saveResult = await this.savePredictionOnly(predictionGame);
      if (!saveResult.success) return saveResult;

      // 6. PMP 잔액 차감 - DB 트리거(process_prediction_payment)가 자동으로 처리
      // predictions 테이블 INSERT 시 트리거가 economy.pmp_pmc_accounts에서 차감하고 
      // economy.pmp_pmc_transactions에 거래 기록을 남김
      const stakeValue = unwrapPmpAmount(request.stakeAmount);

      // 7. 경제 시스템에서 이벤트 발행 (차감은 DB 트리거에서 완료)
      const economicProcessResult =
        await this.predictionEconomicService.processParticipation(
          request.userId,
          request.gameId,
          prediction.id,
          stakeValue,
          request.confidence,
          request.selectedOptionId
        );

      if (!economicProcessResult.success) {
        // NOTE: 이벤트 발행 실패는 로깅만 하고 진행 (MVP)
        // 실제 프로덕션에서는 재시도 큐 등 사용
      }

      // 8. 응답 생성
      return success({
        predictionId: prediction.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in ParticipatePredictionUseCase",
          { originalError: message }
        ),
      };
    }
  }

  /**
   * PMP 잔액 차감 (Infrastructure 직접 호출 - MVP)
   * DDD: economy.pmp_pmc_accounts가 Single Source of Truth
   * TODO: 추후 Economy Repository로 분리
   */
  private async deductPmpBalance(
    userId: UserId,
    amount: number
  ): Promise<Result<void, string>> {
    try {
      const supabase = await createClient();

      // 현재 잔액 조회 from economy schema (Single Source of Truth)
      const { data: account, error: fetchError } = await supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance")
        .eq("user_id", userId)
        .single();

      if (fetchError || !account) {
        return { success: false, error: "Failed to fetch economy account" };
      }

      const currentBalance = account.pmp_balance || 0;
      if (currentBalance < amount) {
        return { success: false, error: "Insufficient PMP balance" };
      }

      // 잔액 차감 in economy schema
      const newBalance = currentBalance - amount;
      const { error: updateError } = await supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({ pmp_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) {
        return { success: false, error: "Failed to update PMP balance" };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
