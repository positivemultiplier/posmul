/**
 * Get Prediction Games Use Case
 *
 * 예측 게임 목록 조회 비즈니스 로직을 처리합니다.
 * - 필터링 및 정렬 기능
 * - 페이지네이션 지원
 * - 통계 정보 포함
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { Result, UseCaseError, isFailure } from "@posmul/auth-economy-sdk";

import { IPredictionGameRepository } from "../../domain/repositories/prediction-game.repository";

/**
 * 게임 목록 조회 요청 DTO
 */
export interface GetPredictionGamesRequest {
  readonly filters?: {
    readonly status?: "PENDING" | "ACTIVE" | "ENDED" | "SETTLED" | "CANCELLED";
    readonly category?: string;
    readonly createdBy?: string;
    readonly importance?: "low" | "medium" | "high" | "critical";
    readonly difficulty?: "easy" | "medium" | "hard" | "expert";
    readonly startTimeFrom?: Date;
    readonly startTimeTo?: Date;
  };
  readonly pagination?: {
    readonly limit: number;
    readonly offset: number;
  };
  readonly sorting?: {
    readonly field: string;
    readonly order: "asc" | "desc";
  };
}

/**
 * 게임 목록 조회 응답 DTO
 */
export interface GetPredictionGamesResponse {
  readonly games: Array<{
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly status: string;
    readonly predictionType: string;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly settlementTime: Date;
    readonly createdBy: string;
    readonly importance: string;
    readonly difficulty: string;
    readonly participantCount: number;
    readonly totalStake: number;
    readonly createdAt: Date;
  }>;
  readonly total: number;
  readonly hasMore: boolean;
}

/**
 * 예측 게임 목록 조회 Use Case
 */
export class GetPredictionGamesUseCase {
  constructor(
    private readonly predictionGameRepository: IPredictionGameRepository
  ) {}

  /**
   * Use Case 실행
   */
  async execute(
    request: GetPredictionGamesRequest
  ): Promise<Result<GetPredictionGamesResponse, UseCaseError>> {
    try {
      // 1. 기본값 설정
      const filters = request.filters || {};
      const pagination = request.pagination || { limit: 20, offset: 0 };
      const sorting = request.sorting || { field: "created_at", order: "desc" };

      // 2. Repository에서 게임 목록 조회
      const gamesResult = await this.predictionGameRepository.findMany({
        filters,
        pagination,
        sorting,
      });

      if (isFailure(gamesResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to fetch prediction games"),
        };
      }

      // 3. 총 개수 조회
      const countResult =
        await this.predictionGameRepository.countByFilters(filters);
      if (isFailure(countResult)) {
        return {
          success: false,
          error: new UseCaseError("Failed to count prediction games"),
        };
      }

      const games = gamesResult.data;
      const total = countResult.data;

      // 4. 응답 DTO 변환
      const gameList = games.map((game) => {
        const stats = game.getStatistics();
        return {
          id: game.getId(),
          title: game.title,
          description: game.description,
          status: game.status.toString(),
          predictionType: game.predictionType,
          startTime: game.startTime,
          endTime: game.endTime,
          settlementTime: game.settlementTime,
          createdBy: game.creatorId,
          importance: "medium", // TODO: real value
          difficulty: "medium", // TODO: real value
          participantCount: stats.totalParticipants,
          totalStake: stats.totalStake,
          createdAt: game.createdAt,
        };
      });

      // 5. hasMore 계산
      const hasMore = total > pagination.offset + pagination.limit;

      return {
        success: true,
        data: {
          games: gameList,
          total,
          hasMore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new UseCaseError(
          "Unexpected error in GetPredictionGamesUseCase",
          { originalError: (error as any)?.message || "Unknown error" }
        ),
      };
    }
  }
}
