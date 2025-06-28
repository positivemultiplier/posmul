import {
  PmpAmount,
  PredictionGameId,
  Result,
  UserId,
} from "@posmul/shared-types";
import { UseCaseError } from "../../../../shared/errors";
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
    private readonly predictionGameRepository: IPredictionGameRepository
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

      // 2. Repository에 저장
      const saveResult =
        await this.predictionGameRepository.save(predictionGame);
      if (!saveResult.success) {
        return {
          success: false,
          error: new UseCaseError(
            "Failed to save prediction game",
            saveResult.error
          ),
        };
      }

      // 3. 도메인 이벤트는 Aggregate 내부에서 처리되므로 여기서는 발행하지 않음

      return {
        success: true,
        data: {
          gameId: predictionGame.id,
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
}
