import {
  PmpAmount,
  PredictionGameId,
  Result,
  UseCaseError,
  UserId,
  isFailure,
} from "@posmul/auth-economy-sdk";

import { MoneyWaveCalculatorService } from "../../../../shared/economy-kernel/services/money-wave-calculator.service";
import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";
import {
  GameOptions,
  PredictionType,
} from "../../domain/value-objects/prediction-types";

export interface CreatePredictionGameRequest {
  readonly title: string;
  readonly description: string;
  readonly predictionType: "binary" | "wdl" | "ranking";
  readonly options: GameOptions;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly creatorId: UserId;
  readonly minimumStake: PmpAmount;
  readonly maximumStake: PmpAmount;
  readonly maxParticipants?: number;
}

export interface CreatePredictionGameResponse {
  readonly gameId: PredictionGameId;
}

export class CreatePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository,
    private readonly moneyWaveCalculator: MoneyWaveCalculatorService
  ) {}

  async execute(
    request: CreatePredictionGameRequest
  ): Promise<Result<CreatePredictionGameResponse, UseCaseError>> {
    try {
      // 1. PredictionGame 생성
      const predictionGameResult = PredictionGame.create({
        creatorId: request.creatorId,
        title: request.title,
        description: request.description,
        predictionType: request.predictionType as PredictionType,
        options: request.options,
        startTime: request.startTime,
        endTime: request.endTime,
        settlementTime: request.settlementTime,
        minimumStake: request.minimumStake,
        maximumStake: request.maximumStake,
        maxParticipants: request.maxParticipants,
      });

      if (isFailure(predictionGameResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to create prediction game"),
        };
      }

      const predictionGame = predictionGameResult.data;

      // 2. MoneyWave 상금 풀 배정 (핵심 로직 활성화!)
      try {
        // 2.1. 일일 상금 풀 계산
        const dailyPoolResult =
          await this.moneyWaveCalculator.calculateDailyPrizePool();
        if (dailyPoolResult.success) {
          // 2.2. 게임 중요도 계산
          const gameImportanceScore = this.calculateGameImportance(request);

          // 2.3. 게임별 배정 금액 계산
          const allocatedAmount =
            await this.moneyWaveCalculator.allocatePrizePoolToGame(
              dailyPoolResult.data.totalDailyPool,
              gameImportanceScore,
              request.endTime
            );

          // 2.4. 게임에 배정 금액 설정
          const setScoreResult =
            predictionGame.setGameImportanceScore(gameImportanceScore);
          if (isFailure(setScoreResult)) {
            return {
              success: false,
              error: new UseCaseError("Failed to set game importance score"),
            };
          }

          const setPrizeResult = predictionGame.setAllocatedPrizePool(
            allocatedAmount as PmpAmount
          );
          if (isFailure(setPrizeResult)) {
            return {
              success: false,
              error: new UseCaseError("Failed to set allocated prize pool"),
            };
          }
        }
      } catch (error) {
        // MoneyWave 계산 중 오류 발생 시 게임 생성은 계속 진행
        void error;
      }

      // 3. Repository에 저장
      const saveResult =
        await this.predictionGameRepository.save(predictionGame);
      if (isFailure(saveResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to save prediction game"),
        };
      }

      // 4. 도메인 이벤트는 Aggregate 내부에서 처리되므로 여기서는 발행하지 않음

      return {
        success: true,
        data: {
          gameId: predictionGame.getId(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in CreatePredictionGameUseCase"
        ),
      };
    }
  }

  /**
   * 게임 중요도 계산
   * 기존 distribute-money-wave.use-case.ts의 로직을 활용하여 게임 생성 시점에서도 중요도 계산
   */
  private calculateGameImportance(
    request: CreatePredictionGameRequest
  ): number {
    let importance = 1.0; // 기본 중요도

    // 게임 유형별 기본 중요도
    switch (request.predictionType) {
      case "binary":
        importance *= 1.0; // 기본
        break;
      case "wdl":
        importance *= 1.2; // 승무패 게임은 약간 더 복잡
        break;
      case "ranking":
        importance *= 1.5; // 순위 예측은 가장 복잡
        break;
      default:
        importance *= 1.0;
    }

    // 스테이크 범위에 따른 조정
    if (request.minimumStake && request.maximumStake) {
      const minValue =
        typeof request.minimumStake === "number"
          ? request.minimumStake
          : Number(request.minimumStake);
      const maxValue =
        typeof request.maximumStake === "number"
          ? request.maximumStake
          : Number(request.maximumStake);
      const stakeRange = maxValue - minValue;

      if (stakeRange > 5000) {
        importance *= 1.3; // 높은 스테이크 범위는 더 중요
      } else if (stakeRange > 1000) {
        importance *= 1.1;
      }
    }

    // 최대 참여자 수에 따른 조정
    if (request.maxParticipants) {
      if (request.maxParticipants >= 1000) {
        importance *= 1.4;
      } else if (request.maxParticipants >= 100) {
        importance *= 1.2;
      }
    }

    // 게임 기간에 따른 조정 (짧은 게임은 더 긴급)
    const gameLength = request.endTime.getTime() - request.startTime.getTime();
    const daysLength = gameLength / (1000 * 60 * 60 * 24);

    if (daysLength <= 1) {
      importance *= 1.3; // 1일 이내 단기 게임
    } else if (daysLength <= 7) {
      importance *= 1.1; // 1주 이내 중기 게임
    }
    // 장기 게임은 기본값 유지

    // 최종 중요도는 1.0~5.0 사이로 제한
    return Math.min(Math.max(importance, 1.0), 5.0);
  }
}
