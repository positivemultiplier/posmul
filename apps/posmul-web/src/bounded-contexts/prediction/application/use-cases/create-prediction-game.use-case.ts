import { EconomyKernel } from "../../../../shared/economy-kernel/services/economy-kernel.service";
import { MoneyWaveCalculatorService } from "../../../../shared/economy-kernel/services/money-wave-calculator.service";
import { UseCaseError } from "../../../../shared/errors";
import { publishEvent } from "../../../../shared/events/domain-events";
import { UserId } from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/common";
// PMP는 branded-types에서 import하거나 number로 대체
import {
  GameConfiguration,
  PredictionGame,
  PredictionType,
} from "../../domain/entities/prediction-game.aggregate";
import { PredictionGameCreatedEvent } from "../../domain/events/prediction-game-events";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";

export interface CreatePredictionGameRequest {
  readonly title: string;
  readonly description: string;
  readonly predictionType: "binary" | "wdl" | "ranking";
  readonly options: Array<{ id: string; label: string; description?: string }>;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly createdBy: UserId;
  readonly importance: "low" | "medium" | "high" | "critical";
  readonly difficulty: "easy" | "medium" | "hard" | "expert";
  readonly minimumStake: number;
  readonly maximumStake: number;
  readonly maxParticipants?: number;
}

export interface CreatePredictionGameResponse {
  readonly gameId: string;
  readonly allocatedPrizePool: number;
  readonly estimatedParticipants: number;
  readonly gameImportanceScore: number;
}

export class CreatePredictionGameUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository,
    private readonly economyKernel: EconomyKernel,
    private readonly moneyWaveCalculator: MoneyWaveCalculatorService
  ) {}

  async execute(
    request: CreatePredictionGameRequest
  ): Promise<Result<CreatePredictionGameResponse, UseCaseError>> {
    try {
      // 1. MoneyWave1: 일일 상금 풀 계산
      const dailyPrizePoolResult =
        await this.moneyWaveCalculator.calculateDailyPrizePool();
      if (!dailyPrizePoolResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to calculate daily prize pool",
            dailyPrizePoolResult.error
          ),
        };
      }

      // 2. 게임 중요도 점수 계산
      const gameImportanceScore = this.calculateGameImportanceScore(
        request.importance,
        request.difficulty
      );

      // 3. 게임별 상금 배정
      const allocatedPrizePool =
        await this.moneyWaveCalculator.allocatePrizePoolToGame(
          dailyPrizePoolResult.data.totalDailyPool,
          gameImportanceScore,
          request.endTime
        );

      // 4. GameConfiguration 생성
      const gameConfiguration: GameConfiguration = {
        title: request.title,
        description: request.description,
        predictionType: request.predictionType as PredictionType,
        options: request.options,
        startTime: request.startTime,
        endTime: request.endTime,
        settlementTime: request.settlementTime,
        minimumStake: request.minimumStake as any, // PMP 타입
        maximumStake: request.maximumStake as any, // PMP 타입
        maxParticipants: request.maxParticipants,
      };

      // 5. PredictionGame 생성
      const predictionGameResult = PredictionGame.create(
        request.createdBy,
        gameConfiguration
      );

      if (!predictionGameResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to create prediction game",
            predictionGameResult.error
          ),
        };
      }

      const predictionGame = predictionGameResult.data;

      // 6. Repository에 저장
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

      // 7. 도메인 이벤트 발행
      const event = new PredictionGameCreatedEvent(
        predictionGame.id,
        predictionGame.configuration.title,
        predictionGame.configuration.description,
        predictionGame.configuration.predictionType as any,
        request.createdBy,
        predictionGame.configuration.startTime,
        predictionGame.configuration.endTime,
        allocatedPrizePool
      );

      await publishEvent(event);

      // 8. 예상 참여자 수 계산
      const estimatedParticipants = this.estimateParticipants(
        allocatedPrizePool,
        gameImportanceScore,
        request.minimumStake
      );

      return {
        success: true,
        data: {
          gameId: predictionGame.id,
          allocatedPrizePool,
          estimatedParticipants,
          gameImportanceScore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in CreatePredictionGameUseCase",
          error as Error
        ),
      };
    }
  }

  /**
   * 게임 중요도와 난이도를 종합한 점수 계산
   */
  private calculateGameImportanceScore(
    importance: string,
    difficulty: string
  ): number {
    const importanceScores = {
      low: 1.0,
      medium: 2.0,
      high: 3.5,
      critical: 5.0,
    };

    const difficultyScores = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      expert: 2.5,
    };

    const importanceScore =
      importanceScores[importance as keyof typeof importanceScores] || 1.0;
    const difficultyScore =
      difficultyScores[difficulty as keyof typeof difficultyScores] || 1.0;

    return importanceScore * 0.7 + difficultyScore * 0.3;
  }

  /**
   * 예상 참여자 수 계산
   */
  private estimateParticipants(
    prizePool: number,
    importanceScore: number,
    minimumStake: number
  ): number {
    const basePredictors = Math.floor(prizePool / 100);
    const importanceMultiplier = 1 + importanceScore * 0.2;
    const stakePenalty = Math.max(0.3, 1 - minimumStake / 1000);

    const estimatedParticipants = Math.floor(
      basePredictors * importanceMultiplier * stakePenalty
    );

    return Math.max(1, estimatedParticipants);
  }
}
