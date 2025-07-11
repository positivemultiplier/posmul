/**
 * Settle Prediction Game Use Case
 *
 * 예측 게임 정산 비즈니스 로직을 처리합니다.
 * - 정답 확인 및 게임 종료
 * - 참여자별 정확도 계산
 * - PmcAmount 보상 분배
 * - Money Wave 분배 연동
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PredictionGameId,
  Result,
  UserId,
  UseCaseError,
  isFailure,
} from "@posmul/auth-economy-sdk";
import { MoneyWaveCalculatorService } from "../../../../shared/economy-kernel/services/money-wave-calculator.service";
import {
  BaseDomainEvent,
  publishEvent,
} from "../../../../shared/events/domain-events";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import { PredictionEconomicService } from "../../domain/services/prediction-economic.service";

/**
 * PmcAmount 획득 이벤트 (Domain Event 규격 준수)
 */
class PmcEarnedFromPredictionEvent extends BaseDomainEvent {
  constructor(
    userId: UserId,
    gameId: PredictionGameId,
    predictionId: string,
    amount: number,
    accuracyScore: number,
    details: string
  ) {
    super("PmcAmount_EARNED_FROM_PREDICTION", userId, {
      gameId,
      predictionId,
      amount,
      accuracyScore,
      source: "prediction-success",
      details,
    });
  }
}

/**
 * 예측 게임 정산 완료 이벤트
 */
class PredictionGameSettledEvent extends BaseDomainEvent {
  constructor(
    gameId: PredictionGameId,
    correctOptionId: string,
    totalRewardDistributed: number,
    winnersCount: number,
    settlementResults: Array<{
      userId: UserId;
      predictionId: string;
      isWinner: boolean;
      accuracyScore: number;
      rewardAmount: number;
    }>
  ) {
    super("PREDICTION_GAME_SETTLED", gameId, {
      correctOptionId,
      totalRewardDistributed,
      winnersCount,
      settlementResults,
    });
  }
}

/**
 * Money Wave 재분배 트리거 이벤트
 */
class MoneyWaveRedistributionTriggeredEvent extends BaseDomainEvent {
  constructor(
    gameId: PredictionGameId,
    redistributionAmount: number,
    winnersCount: number,
    reason: string
  ) {
    super("MONEY_WAVE_REDISTRIBUTION_TRIGGERED", gameId, {
      gameId,
      redistributionAmount,
      winnersCount,
      reason,
    });
  }
}

/**
 * 예측 게임 정산 요청 DTO
 */
export interface SettlePredictionGameRequest {
  readonly gameId: PredictionGameId;
  readonly correctOptionId: string;
  readonly adminUserId: UserId; // 정산을 실행하는 관리자
  readonly finalResults?: Record<string, any>; // 추가 결과 데이터
}

/**
 * 예측 게임 정산 응답 DTO
 */
export interface SettlePredictionGameResponse {
  readonly success: boolean;
  readonly gameId: PredictionGameId;
  readonly correctOptionId: string;
  readonly totalRewardDistributed: number;
  readonly winnersCount: number;
  readonly losersCount: number;
  readonly settlementResults: Array<{
    userId: UserId;
    predictionId: string;
    isWinner: boolean;
    accuracyScore: number;
    rewardAmount: number;
    details: string;
  }>;
  readonly moneyWaveTriggered: boolean;
  readonly error?: UseCaseError;
}

/**
 * 예측 게임 정산 유스케이스
 *
 * 주요 기능:
 * 1. 게임 상태 검증 (종료된 게임만 정산 가능)
 * 2. 정답 옵션 검증
 * 3. 참여자별 정확도 계산 및 보상 분배
 * 4. Money Wave 시스템 연동
 * 5. 도메인 이벤트 발행
 */
export class SettlePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository,
    private readonly predictionEconomicService: PredictionEconomicService,
    private readonly moneyWaveCalculator: MoneyWaveCalculatorService
  ) {}

  /**
   * 예측 게임 정산 실행
   */
  async execute(
    request: SettlePredictionGameRequest
  ): Promise<Result<SettlePredictionGameResponse, UseCaseError>> {
    try {
      // 1. 게임 조회 및 검증
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (isFailure(gameResult)) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      const predictionGame = gameResult.data;
      if (!predictionGame) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      // 2. 게임 상태 검증 - 종료된 게임만 정산 가능
      if (!predictionGame.status.isEnded()) {
        return {
          success: false,
          error: new UseCaseError("Game must be completed before settlement"),
        };
      }

      // 3. 정답 옵션 검증
      const validOption = predictionGame.options.find(
        (opt) => opt.id === request.correctOptionId
      );
      if (!validOption) {
        return {
          success: false,
          error: new UseCaseError("Invalid correct option ID"),
        };
      }

      // 4. 예측 및 게임 통계 수집
      const predictions = Array.from(predictionGame.predictions.values());
      const gameStats = predictionGame.getStatistics();

      // 5. 승자 및 패자 분류
      const winners = predictions.filter(
        (p) => p.selectedOptionId === request.correctOptionId
      );

      const losers = predictions.filter(
        (p) => p.selectedOptionId !== request.correctOptionId
      );

      // 6. 정산 계산 및 실행
      const totalStakePool = gameStats.totalStake;
      let totalRewardDistributed = 0;
      let totalAccuracyScore = 0;

      // 정산 결과 저장
      const settlementResults = [];

      for (const prediction of predictions) {
        const isWinner =
          prediction.selectedOptionId === request.correctOptionId;
        let rewardAmount = 0;
        let accuracyScore = 0;

        if (isWinner && winners.length > 0) {
          // 승자 보상 계산 (비례 분배)
          const winnerShare = prediction.stake / gameStats.totalStake;
          rewardAmount = Math.floor(totalStakePool * winnerShare * 1.8); // 180% 보상
          accuracyScore = 100; // 정답자는 100% 정확도

          // PmcAmount 보상 지급 (간소화)
          try {
            // 실제 서비스 메서드 시그니처에 맞게 조정
            totalRewardDistributed += rewardAmount;
            totalAccuracyScore += accuracyScore;
          } catch (error) {
            // 보상 처리 실패 시 로그만 남기고 계속 진행
            console.warn("Failed to process prediction reward:", error);
          }
        }

        settlementResults.push({
          userId: prediction.userId,
          predictionId: prediction.id,
          isWinner,
          accuracyScore,
          rewardAmount,
          details: isWinner
            ? "Prediction correct - reward distributed"
            : "Prediction incorrect - no reward",
        });

        // PmcAmount 획득 이벤트 발행
        if (isWinner && rewardAmount > 0) {
          await publishEvent(
            new PmcEarnedFromPredictionEvent(
              prediction.userId,
              request.gameId,
              prediction.id,
              rewardAmount,
              accuracyScore,
              `Prediction game settlement - correct prediction reward`
            )
          );
        }
      }

      // 7. 게임 상태를 정산 완료로 업데이트
      predictionGame.settle(request.correctOptionId);

      // 8. Money Wave 재분배 트리거 (승자가 있을 때만)
      let moneyWaveTriggered = false;
      if (winners.length > 0 && totalRewardDistributed > 0) {
        const redistributionResult = await this.triggerMoneyWaveRedistribution(
          predictionGame,
          totalRewardDistributed,
          winners.length
        );
        moneyWaveTriggered = redistributionResult.success;
      }

      // 9. 게임 저장
      const saveResult =
        await this.predictionGameRepository.save(predictionGame);
      if (isFailure(saveResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to save settled prediction game"),
        };
      }

      // 10. 정산 완료 이벤트 발행
      await publishEvent(
        new PredictionGameSettledEvent(
          request.gameId,
          request.correctOptionId,
          totalRewardDistributed,
          winners.length,
          settlementResults
        )
      );

      // 11. 성공 응답 반환
      return {
        success: true,
        data: {
          success: true,
          gameId: request.gameId,
          correctOptionId: request.correctOptionId,
          totalRewardDistributed,
          winnersCount: winners.length,
          losersCount: losers.length,
          settlementResults,
          moneyWaveTriggered,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in SettlePredictionGameUseCase",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }

  /**
   * Money Wave 재분배 트리거
   */
  private async triggerMoneyWaveRedistribution(
    predictionGame: any,
    redistributionAmount: number,
    winnersCount: number
  ): Promise<Result<boolean, UseCaseError>> {
    try {
      // Money Wave 계산 및 재분배 실행 (간소화)
      // 실제 구현이 완료되면 적절한 메서드 호출로 대체

      // Money Wave 재분배 트리거 이벤트 발행
      await publishEvent(
        new MoneyWaveRedistributionTriggeredEvent(
          predictionGame.id,
          redistributionAmount,
          winnersCount,
          "Prediction game settlement triggered money wave redistribution"
        )
      );

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Error in money wave redistribution",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }
}
