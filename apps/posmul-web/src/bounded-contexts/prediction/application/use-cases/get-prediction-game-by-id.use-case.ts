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

import {
  PredictionGameId,
  Result,
  UseCaseError,
  isFailure,
} from "@posmul/auth-economy-sdk";
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
  readonly creatorId: string;
  readonly status: string;
  readonly options: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly settlementTime: Date;
  readonly minimumStake: number;
  readonly maximumStake: number;
  readonly maxParticipants?: number;
  readonly participations?: Array<{
    userId: string;
    selectedOptionId: string;
    stake: number;
    confidence: number;
    createdAt: Date;
  }>;
  readonly statistics?: {
    totalParticipants: number;
    totalStake: number;
    averageConfidence: number;
    optionDistribution: Record<string, number>;
  };
}

/**
 * 예측 게임 상세 조회 유스케이스
 */
export class GetPredictionGameByIdUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * 예측 게임 상세 정보 조회 실행
   */
  async execute(
    request: GetPredictionGameByIdRequest
  ): Promise<Result<GetPredictionGameByIdResponse, UseCaseError>> {
    try {
      // 1. 입력 검증
      if (!request.gameId) {
        return {
          success: false,
          error: new UseCaseError("Game ID is required"),
        };
      }

      // 2. 게임 조회
      const gameResult = await this.predictionGameRepository.findById(
        request.gameId
      );
      if (isFailure(gameResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to fetch prediction game"),
        };
      }

      const game = gameResult.data;
      if (!game) {
        return {
          success: false,
          error: new UseCaseError("Prediction game not found"),
        };
      }

      // 3. 기본 응답 구성
      let response: GetPredictionGameByIdResponse = {
        id: game.id,
        title: game.title,
        description: game.description,
        creatorId: game.creatorId,
        status: game.status.toString(),
        options: game.options.map((option) => ({
          id: option.id,
          title: option.id, // GameOption에 title 속성이 없으므로 id 사용
          description: option.description,
        })),
        startTime: game.startTime,
        endTime: game.endTime,
        settlementTime: game.settlementTime,
        minimumStake: game.minimumStake,
        maximumStake: game.maximumStake,
        maxParticipants: game.maxParticipants ?? undefined,
      };

      // 4. 선택적 정보 추가
      if (request.includeParticipations) {
        const predictions = Array.from(game.predictions.values());
        const participations = predictions.map((prediction) => ({
          userId: prediction.userId,
          selectedOptionId: prediction.selectedOptionId,
          stake: prediction.stake,
          confidence: prediction.confidence,
          createdAt: new Date(), // 실제 생성 시간이 없으므로 현재 시간 사용
        }));

        response = { ...response, participations };
      }

      if (request.includeStatistics) {
        const gameStats = game.getStatistics();
        const statistics = {
          totalParticipants: gameStats.totalParticipants,
          totalStake: gameStats.totalStake,
          averageConfidence: gameStats.averageConfidence,
          optionDistribution: Object.fromEntries(gameStats.optionDistribution),
        };

        response = { ...response, statistics };
      }

      // 5. 성공 응답 반환
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in GetPredictionGameByIdUseCase",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }
}
