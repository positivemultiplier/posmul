/**
 * Get Prediction Game By ID Use Case
 *
 * 특정 예측 게임의 상세 정보를 조회하는 비즈니스 로직을 처리합니다.
 * - 게임 기본 정보
 * - 참여자 목록 (선택적)
 * - 통계 정보 (선택적)
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { UseCaseError } from "../../../../shared/errors";
import { PredictionGameId } from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/common";
import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";

/**
 * 게임 상세 조회 요청 DTO
 */
export interface GetPredictionGameByIdRequest {
  readonly gameId: PredictionGameId;
  readonly includeParticipations?: boolean;
  readonly includeStatistics?: boolean;
}

/**
 * 게임 상세 조회 응답 DTO
 */
export interface GetPredictionGameByIdResponse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly predictionType: string;
  readonly options: Array<{
    readonly id: string;
    readonly label: string;
    readonly description?: string;
  }>;
  readonly status: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly createdBy: string;
  readonly importance: string;
  readonly difficulty: string;
  readonly configuration: {
    readonly minimumStake: number;
    readonly maximumStake: number;
    readonly maxParticipants?: number;
  };
  readonly moneyWaveId?: string;
  readonly gameImportanceScore: number;
  readonly allocatedPrizePool: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly version: number;
  readonly participations?: Array<{
    readonly id: string;
    readonly userId: string;
    readonly selectedOptionId: string;
    readonly stakeAmount: number;
    readonly confidence: number;
    readonly reasoning?: string;
    readonly participatedAt: Date;
  }>;
  readonly statistics?: {
    readonly totalParticipants: number;
    readonly totalStake: number;
    readonly averageStake: number;
    readonly averageConfidence: number;
    readonly optionDistribution: Record<string, number>;
  };
}

/**
 * 예측 게임 상세 조회 Use Case
 */
export class GetPredictionGameByIdUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * Use Case 실행
   */
  async execute(
    request: GetPredictionGameByIdRequest
  ): Promise<Result<GetPredictionGameByIdResponse, UseCaseError>> {
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

      // 2. 기본 응답 데이터 구성
      const response: GetPredictionGameByIdResponse = {
        id: game.id,
        title: game.getTitle(),
        description: game.getDescription(),
        predictionType: game.getPredictionType(),
        options: game.getOptions(),
        status: game.status,
        startTime: game.getStartTime(),
        endTime: game.getEndTime(),
        settlementTime: game.getSettlementTime(),
        createdBy: game.getCreatedBy(),
        importance: "medium", // 임시값
        difficulty: "medium", // 임시값
        configuration: game.configuration,
        moneyWaveId: undefined, // 임시값
        gameImportanceScore: 1.0, // 임시값
        allocatedPrizePool: 0, // 임시값
        createdAt: game.getCreatedAt(),
        updatedAt: game.getUpdatedAt(),
        version: game.getVersion(),
      };

      // 3. 참여자 정보 포함 (선택적)
      let finalResponse = response;
      if (request.includeParticipations) {
        const predictions = Array.from(game.predictions.values());
        const participations = predictions.map((prediction) => ({
          id: prediction.id,
          userId: prediction.userId,
          selectedOptionId: prediction.selectedOptionId,
          stakeAmount: prediction.stake,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
          participatedAt: prediction.timestamps.createdAt,
        }));

        finalResponse = { ...response, participations };
      }

      // 4. 통계 정보 포함 (선택적)
      if (request.includeStatistics) {
        const stats = game.getStatistics();
        const statistics = {
          totalParticipants: stats.totalParticipants,
          totalStake: stats.totalStake,
          averageStake:
            stats.totalParticipants > 0
              ? stats.totalStake / stats.totalParticipants
              : 0,
          averageConfidence: stats.averageConfidence,
          optionDistribution: Object.fromEntries(stats.optionDistribution),
        };

        finalResponse = { ...finalResponse, statistics };
      }

      return {
        success: true,
        data: finalResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in GetPredictionGameByIdUseCase",
          error as Error
        ),
      };
    }
  }
}
