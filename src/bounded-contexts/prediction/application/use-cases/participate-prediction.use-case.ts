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

import { UseCaseError } from "../../../../shared/errors";
import {
  BaseDomainEvent,
  publishEvent,
} from "../../../../shared/events/domain-events";
import {
  PredictionGameId,
  PredictionId,
  UserId,
} from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/common";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import { PredictionEconomicService } from "../../domain/services/prediction-economic.service";

/**
 * PMP 소비 이벤트 (Domain Event 규격 준수)
 */
class PmpSpentForPredictionEvent extends BaseDomainEvent {
  constructor(
    userId: UserId,
    gameId: PredictionGameId,
    amount: number,
    details: string
  ) {
    super("PMP_SPENT_FOR_PREDICTION", userId, {
      gameId,
      amount,
      purpose: "prediction-participation",
      details,
    });
  }
}

/**
 * 예측 참여 이벤트 (Domain Event 규격 준수)
 */
class PredictionParticipatedEvent extends BaseDomainEvent {
  constructor(
    userId: UserId,
    gameId: PredictionGameId,
    predictionId: PredictionId,
    stakeAmount: number,
    confidence: number,
    selectedOptionId: string
  ) {
    super("PREDICTION_PARTICIPATED", gameId, {
      userId,
      predictionId,
      stakeAmount,
      confidence,
      selectedOptionId,
    });
  }
}

/**
 * 예측 참여 요청 DTO
 */
export interface ParticipatePredictionRequest {
  readonly userId: UserId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stakeAmount: number; // PMP 스테이크 금액
  readonly confidence: number; // 0-1 사이 신뢰도
  readonly reasoning?: string; // 선택 이유 (선택사항)
}

/**
 * 예측 참여 응답 DTO
 */
export interface ParticipatePredictionResponse {
  readonly predictionId: PredictionId;
  readonly gameId: PredictionGameId;
  readonly selectedOptionId: string;
  readonly stakeAmount: number;
  readonly confidence: number;
  readonly remainingPmpBalance: number;
  readonly currentParticipants: number;
  readonly totalStakePool: number;
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
      // 1. 입력 검증
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Invalid request parameters",
            validationResult.error
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
          error: new UseCaseError(
            "Failed to retrieve prediction game",
            gameResult.error
          ),
        };
      }

      if (!gameResult.data) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      const predictionGame = gameResult.data;

      // 3. PMP 참여 자격 및 위험 평가
      const eligibilityResult =
        await this.predictionEconomicService.checkPmpParticipationEligibility(
          request.userId,
          request.stakeAmount
        );

      if (!eligibilityResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to check PMP participation eligibility",
            eligibilityResult.error
          ),
        };
      }

      const participationCheck = eligibilityResult.data;
      if (!participationCheck.canParticipate) {
        return {
          success: false,
          error: new UseCaseError(
            `Insufficient PMP balance. Required: ${participationCheck.requiredAmount}, Available: ${participationCheck.currentBalance}`
          ),
        };
      }

      // 4. 예측 게임에 참여 처리
      const participationResult = predictionGame.addPrediction(
        request.userId,
        request.selectedOptionId,
        request.stakeAmount as any, // PMP 타입 변환
        request.confidence,
        request.reasoning
      );

      if (!participationResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to participate in prediction game",
            participationResult.error
          ),
        };
      }

      const predictionId = participationResult.data;

      // 5. 게임 상태 저장
      const saveResult = await this.predictionGameRepository.save(
        predictionGame
      );
      if (!saveResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to save prediction game",
            saveResult.error
          ),
        };
      }

      // 6. 경제 시스템에서 예측 참여 처리 (PMP 차감 + 이벤트 발행)
      const economicProcessResult =
        await this.predictionEconomicService.processParticipation(
          request.userId,
          request.gameId,
          predictionId,
          request.stakeAmount,
          request.confidence,
          request.selectedOptionId
        );

      if (!economicProcessResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to process economic participation",
            economicProcessResult.error
          ),
        };
      }

      // 7. 예측 참여 이벤트 발행 (도메인 이벤트)
      const participationEvent = new PredictionParticipatedEvent(
        request.userId,
        request.gameId,
        predictionId,
        request.stakeAmount,
        request.confidence,
        request.selectedOptionId
      );

      await publishEvent(participationEvent);

      // 8. 현재 게임 통계 계산
      const gameStats = predictionGame.getStatistics();
      const newBalance = participationCheck.remainingAfterParticipation;

      // 9. 응답 생성
      return {
        success: true,
        data: {
          predictionId,
          gameId: request.gameId,
          selectedOptionId: request.selectedOptionId,
          stakeAmount: request.stakeAmount,
          confidence: request.confidence,
          remainingPmpBalance: newBalance,
          currentParticipants: gameStats.totalParticipants,
          totalStakePool: gameStats.totalStake,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in ParticipatePredictionUseCase",
          error as Error
        ),
      };
    }
  }

  /**
   * 요청 검증
   */
  private validateRequest(
    request: ParticipatePredictionRequest
  ): Result<void, Error> {
    // 스테이크 금액 검증
    if (request.stakeAmount <= 0) {
      return {
        success: false,
        error: new Error("Stake amount must be positive"),
      };
    }

    // 신뢰도 검증 (0-1 범위)
    if (request.confidence < 0 || request.confidence > 1) {
      return {
        success: false,
        error: new Error("Confidence must be between 0 and 1"),
      };
    }

    // 선택한 옵션 ID 검증
    if (!request.selectedOptionId || request.selectedOptionId.trim() === "") {
      return {
        success: false,
        error: new Error("Selected option ID is required"),
      };
    }

    // 사용자 ID 검증
    if (!request.userId) {
      return {
        success: false,
        error: new Error("User ID is required"),
      };
    }

    // 게임 ID 검증
    if (!request.gameId) {
      return {
        success: false,
        error: new Error("Game ID is required"),
      };
    }

    return { success: true, data: undefined };
  }
}
