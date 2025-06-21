/**
 * Supabase PredictionGame Repository Implementation
 *
 * Infrastructure 계층에서 PredictionGame Repository 인터페이스를 구현
 * Clean Architecture 의존성 역전 원칙 준수
 *
 * @author PosMul Development Team
 * @since 2024-12
 * @task PD-006
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AccuracyScore,
  createPredictionGameId,
  createUserId,
  PMC,
  PMP,
  PredictionGameId,
  UserId,
} from "../../../../shared/types/branded-types";
import {
  failure,
  Result,
  success,
} from "../../../../shared/types/economic-system";
import {
  GameConfiguration,
  Prediction,
  PredictionGame,
  PredictionOption,
  PredictionType,
} from "../../domain/entities/prediction-game.aggregate";
import {
  GameSearchFilters,
  IPredictionGameRepository,
  PaginatedResult,
  PaginationRequest,
  RepositoryError,
  RepositoryErrorCodes,
  RepositoryHelpers,
} from "../../domain/repositories/prediction-game.repository";
import { GameStatus } from "../../domain/value-objects/game-status";

/**
 * 데이터베이스 행 타입 정의
 */
interface PredictionGameRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  prediction_type: string;
  options: any; // JSON
  start_time: string;
  end_time: string;
  settlement_time: string;
  minimum_stake: number;
  maximum_stake: number;
  max_participants: number | null;
  status: string;
  money_wave_id: string | null;
  game_importance_score: number;
  allocated_prize_pool: number;
  created_at: string;
  updated_at: string;
  version: number;
}

interface PredictionRow {
  id: string;
  user_id: string;
  game_id: string;
  selected_option_id: string;
  stake: number;
  confidence: number;
  reasoning: string | null;
  is_correct: boolean | null;
  accuracy_score: number | null;
  reward_amount: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase PredictionGame Repository 구현체
 */
export class SupabasePredictionGameRepository
  implements IPredictionGameRepository
{
  private readonly supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {
          "X-Client-Info": "prediction-context",
        },
      },
    });
  }

  /**
   * 예측 게임을 데이터베이스에 저장
   */
  async save(game: PredictionGame): Promise<Result<void, RepositoryError>> {
    try {
      const gameData = {
        id: game.id,
        creator_id: game.getCreatedBy(),
        title: game.getTitle(),
        description: game.getDescription(),
        prediction_type: game.getPredictionType(),
        options: JSON.stringify(game.getOptions()),
        start_time: game.getStartTime().toISOString(),
        end_time: game.getEndTime().toISOString(),
        settlement_time: game.getSettlementTime().toISOString(),
        minimum_stake: game.getMinimumStake(),
        maximum_stake: game.getMaximumStake(),
        max_participants: game.getMaxParticipants(),
        status: game.status,
        created_at: game.getCreatedAt().toISOString(),
        updated_at: game.getUpdatedAt().toISOString(),
        version: game.getVersion(),
      };

      const { error: gameError } = await this.supabase
        .from("prediction_games")
        .upsert(gameData, {
          onConflict: "id",
          ignoreDuplicates: false,
        });

      if (gameError) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "PredictionGame",
            gameError.message,
            gameError
          )
        );
      }

      // 예측 데이터 저장
      const predictions = Array.from(game.predictions.values());
      if (predictions.length > 0) {
        const predictionData = predictions.map((p) =>
          this.mapPredictionToDatabase(p)
        );

        const { error: predictionError } = await this.supabase
          .from("predictions")
          .upsert(predictionData, {
            onConflict: "id",
            ignoreDuplicates: false,
          });

        if (predictionError) {
          return failure(
            RepositoryHelpers.createSaveFailedError(
              "Predictions",
              predictionError.message,
              predictionError
            )
          );
        }
      }

      return success(undefined);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          "Unexpected error during save operation",
          error as Error
        )
      );
    }
  }

  /**
   * ID로 예측 게임 조회
   */
  async findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>> {
    try {
      const { data: gameData, error: gameError } = await this.supabase
        .from("prediction_games")
        .select("*")
        .eq("id", id)
        .single();

      if (gameError) {
        if (gameError.code === "PGRST116") {
          // No rows returned
          return success(null);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findById",
            gameError.message,
            gameError
          )
        );
      }

      // 관련 예측 데이터 조회
      const { data: predictionsData, error: predictionsError } =
        await this.supabase.from("predictions").select("*").eq("game_id", id);

      if (predictionsError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findById - predictions",
            predictionsError.message,
            predictionsError
          )
        );
      }

      const game = this.mapDatabaseToDomain(gameData, predictionsData || []);
      return success(game);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findById",
          "Unexpected error during query",
          error as Error
        )
      );
    }
  }

  /**
   * 여러 ID로 예측 게임 일괄 조회
   */
  async findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    try {
      if (ids.length === 0) {
        return success(new Map());
      }

      const { data: gamesData, error: gamesError } = await this.supabase
        .from("prediction_games")
        .select("*")
        .in("id", ids);

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByIds",
            gamesError.message,
            gamesError
          )
        );
      }

      // 모든 게임의 예측 데이터 조회
      const { data: predictionsData, error: predictionsError } =
        await this.supabase.from("predictions").select("*").in("game_id", ids);

      if (predictionsError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByIds - predictions",
            predictionsError.message,
            predictionsError
          )
        );
      }

      // 게임별 예측 그룹화
      const predictionsByGame = new Map<string, PredictionRow[]>();
      (predictionsData || []).forEach((prediction) => {
        const gameId = prediction.game_id;
        if (!predictionsByGame.has(gameId)) {
          predictionsByGame.set(gameId, []);
        }
        predictionsByGame.get(gameId)!.push(prediction);
      });

      const result = new Map<PredictionGameId, PredictionGame>();
      (gamesData || []).forEach((gameData) => {
        const predictions = predictionsByGame.get(gameData.id) || [];
        const game = this.mapDatabaseToDomain(gameData, predictions);
        result.set(game.id, game);
      });

      return success(result);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findByIds",
          "Unexpected error during bulk query",
          error as Error
        )
      );
    }
  }

  /**
   * 상태별 예측 게임 조회
   */
  async findByStatus(
    status: GameStatus,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const paginationConfig =
        pagination || RepositoryHelpers.getDefaultPagination();
      const validationResult =
        RepositoryHelpers.validatePagination(paginationConfig);

      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      const offset = (paginationConfig.page - 1) * paginationConfig.limit;

      // 총 개수 조회
      const { count, error: countError } = await this.supabase
        .from("prediction_games")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (countError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByStatus - count",
            countError.message,
            countError
          )
        );
      }

      // 데이터 조회
      let query = this.supabase
        .from("prediction_games")
        .select("*")
        .eq("status", status)
        .range(offset, offset + paginationConfig.limit - 1);

      // 정렬 적용
      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data: gamesData, error: gamesError } = await query;

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByStatus",
            gamesError.message,
            gamesError
          )
        );
      }

      // 예측 데이터 조회
      const gameIds = (gamesData || []).map((g) => g.id);
      const predictionsMap = await this.fetchPredictionsForGames(gameIds);

      if (!predictionsMap.success) {
        return failure(predictionsMap.error);
      }

      // 도메인 객체 변환
      const games = (gamesData || []).map((gameData) => {
        const predictions = predictionsMap.data.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<PredictionGame> = {
        items: games,
        totalCount,
        totalPages,
        currentPage: paginationConfig.page,
        hasNext: paginationConfig.page < totalPages,
        hasPrev: paginationConfig.page > 1,
      };

      return success(result);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findByStatus",
          "Unexpected error during status query",
          error as Error
        )
      );
    }
  }

  /**
   * 생성자별 예측 게임 조회
   */
  async findByCreator(
    creatorId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const paginationConfig =
        pagination || RepositoryHelpers.getDefaultPagination();
      const validationResult =
        RepositoryHelpers.validatePagination(paginationConfig);

      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      const offset = (paginationConfig.page - 1) * paginationConfig.limit;

      // 총 개수 조회
      const { count, error: countError } = await this.supabase
        .from("prediction_games")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      if (countError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByCreator - count",
            countError.message,
            countError
          )
        );
      }

      // 데이터 조회
      let query = this.supabase
        .from("prediction_games")
        .select("*")
        .eq("creator_id", creatorId)
        .range(offset, offset + paginationConfig.limit - 1);

      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data: gamesData, error: gamesError } = await query;

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByCreator",
            gamesError.message,
            gamesError
          )
        );
      }

      // 예측 데이터 조회
      const gameIds = (gamesData || []).map((g) => g.id);
      const predictionsMap = await this.fetchPredictionsForGames(gameIds);

      if (!predictionsMap.success) {
        return failure(predictionsMap.error);
      }

      // 도메인 객체 변환
      const games = (gamesData || []).map((gameData) => {
        const predictions = predictionsMap.data.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<PredictionGame> = {
        items: games,
        totalCount,
        totalPages,
        currentPage: paginationConfig.page,
        hasNext: paginationConfig.page < totalPages,
        hasPrev: paginationConfig.page > 1,
      };

      return success(result);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findByCreator",
          "Unexpected error during creator query",
          error as Error
        )
      );
    }
  }

  /**
   * 사용자 참여 게임 조회
   */
  async findByParticipant(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const paginationConfig =
        pagination || RepositoryHelpers.getDefaultPagination();
      const validationResult =
        RepositoryHelpers.validatePagination(paginationConfig);

      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      // 사용자가 참여한 게임 ID 조회
      const { data: participatedGames, error: participationError } =
        await this.supabase
          .from("predictions")
          .select("game_id")
          .eq("user_id", userId);

      if (participationError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByParticipant - participation",
            participationError.message,
            participationError
          )
        );
      }

      const gameIds = [
        ...new Set((participatedGames || []).map((p) => p.game_id)),
      ];

      if (gameIds.length === 0) {
        const emptyResult: PaginatedResult<PredictionGame> = {
          items: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: paginationConfig.page,
          hasNext: false,
          hasPrev: false,
        };
        return success(emptyResult);
      }

      const offset = (paginationConfig.page - 1) * paginationConfig.limit;

      // 게임 데이터 조회
      let query = this.supabase
        .from("prediction_games")
        .select("*")
        .in("id", gameIds)
        .range(offset, offset + paginationConfig.limit - 1);

      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data: gamesData, error: gamesError } = await query;

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByParticipant",
            gamesError.message,
            gamesError
          )
        );
      }

      // 예측 데이터 조회
      const queriedGameIds = (gamesData || []).map((g) => g.id);
      const predictionsMap = await this.fetchPredictionsForGames(
        queriedGameIds
      );

      if (!predictionsMap.success) {
        return failure(predictionsMap.error);
      }

      // 도메인 객체 변환
      const games = (gamesData || []).map((gameData) => {
        const predictions = predictionsMap.data.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      const totalCount = gameIds.length;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<PredictionGame> = {
        items: games,
        totalCount,
        totalPages,
        currentPage: paginationConfig.page,
        hasNext: paginationConfig.page < totalPages,
        hasPrev: paginationConfig.page > 1,
      };

      return success(result);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findByParticipant",
          "Unexpected error during participant query",
          error as Error
        )
      );
    }
  }

  /**
   * 고급 검색
   */
  async search(
    filters: GameSearchFilters,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const paginationConfig =
        pagination || RepositoryHelpers.getDefaultPagination();
      const validationResult =
        RepositoryHelpers.validatePagination(paginationConfig);

      if (!validationResult.success) {
        return failure(validationResult.error);
      }

      const offset = (paginationConfig.page - 1) * paginationConfig.limit;

      // 쿼리 빌드
      let query = this.supabase.from("prediction_games").select("*");
      let countQuery = this.supabase
        .from("prediction_games")
        .select("*", { count: "exact", head: true });

      // 필터 적용
      if (filters.creatorId) {
        query = query.eq("creator_id", filters.creatorId);
        countQuery = countQuery.eq("creator_id", filters.creatorId);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
        countQuery = countQuery.eq("status", filters.status);
      }

      if (filters.predictionType) {
        query = query.eq("prediction_type", filters.predictionType);
        countQuery = countQuery.eq("prediction_type", filters.predictionType);
      }

      if (filters.title) {
        query = query.ilike("title", `%${filters.title}%`);
        countQuery = countQuery.ilike("title", `%${filters.title}%`);
      }

      if (filters.startTimeFrom) {
        query = query.gte("start_time", filters.startTimeFrom.toISOString());
        countQuery = countQuery.gte(
          "start_time",
          filters.startTimeFrom.toISOString()
        );
      }

      if (filters.startTimeTo) {
        query = query.lte("start_time", filters.startTimeTo.toISOString());
        countQuery = countQuery.lte(
          "start_time",
          filters.startTimeTo.toISOString()
        );
      }

      if (filters.minParticipants !== undefined) {
        // 이 필터는 서브쿼리가 필요하므로 복잡함. 일단 스킵하고 애플리케이션 레벨에서 필터링
      }

      // 총 개수 조회
      const { count, error: countError } = await countQuery;

      if (countError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "search - count",
            countError.message,
            countError
          )
        );
      }

      // 데이터 조회
      query = query.range(offset, offset + paginationConfig.limit - 1);

      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data: gamesData, error: gamesError } = await query;

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "search",
            gamesError.message,
            gamesError
          )
        );
      }

      // 예측 데이터 조회
      const gameIds = (gamesData || []).map((g) => g.id);
      const predictionsMap = await this.fetchPredictionsForGames(gameIds);

      if (!predictionsMap.success) {
        return failure(predictionsMap.error);
      }

      // 도메인 객체 변환
      let games = (gamesData || []).map((gameData) => {
        const predictions = predictionsMap.data.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      // 애플리케이션 레벨 필터링 (DB 레벨에서 처리하기 어려운 필터들)
      if (filters.minParticipants !== undefined) {
        games = games.filter(
          (game) => game.predictions.size >= filters.minParticipants!
        );
      }

      if (filters.maxParticipants !== undefined) {
        games = games.filter(
          (game) => game.predictions.size <= filters.maxParticipants!
        );
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<PredictionGame> = {
        items: games,
        totalCount,
        totalPages,
        currentPage: paginationConfig.page,
        hasNext: paginationConfig.page < totalPages,
        hasPrev: paginationConfig.page > 1,
      };

      return success(result);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "search",
          "Unexpected error during search",
          error as Error
        )
      );
    }
  }

  /**
   * 활성 게임 목록 조회
   */
  async findActiveGames(
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.findByStatus(GameStatus.ACTIVE, pagination);
  }

  /**
   * 정산 대기 게임 목록 조회
   */
  async findPendingSettlement(
    limit?: number
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const queryLimit = limit || 50;

      const { data: gamesData, error: gamesError } = await this.supabase
        .from("prediction_games")
        .select("*")
        .eq("status", GameStatus.ENDED)
        .lte("settlement_time", new Date().toISOString())
        .limit(queryLimit);

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findPendingSettlement",
            gamesError.message,
            gamesError
          )
        );
      }

      // 예측 데이터 조회
      const gameIds = (gamesData || []).map((g) => g.id);
      const predictionsMap = await this.fetchPredictionsForGames(gameIds);

      if (!predictionsMap.success) {
        return failure(predictionsMap.error);
      }

      // 도메인 객체 변환
      const games = (gamesData || []).map((gameData) => {
        const predictions = predictionsMap.data.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      return success(games);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findPendingSettlement",
          "Unexpected error during pending settlement query",
          error as Error
        )
      );
    }
  }

  /**
   * 게임 존재 여부 확인
   */
  async exists(
    id: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const { data, error } = await this.supabase
        .from("prediction_games")
        .select("id")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(false);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "exists",
            error.message,
            error
          )
        );
      }

      return success(!!data);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "exists",
          "Unexpected error during existence check",
          error as Error
        )
      );
    }
  }

  /**
   * 게임 삭제 (소프트 삭제)
   */
  async delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    try {
      // 소프트 삭제 구현 (status를 'DELETED'로 변경)
      const { error } = await this.supabase
        .from("prediction_games")
        .update({
          status: "DELETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "PredictionGame",
            `Failed to delete game: ${error.message}`,
            error
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          "Unexpected error during deletion",
          error as Error
        )
      );
    }
  }

  /**
   * 게임 통계 조회
   */
  async getStatistics(id: PredictionGameId): Promise<
    Result<
      {
        totalParticipants: number;
        totalStake: number;
        averageConfidence: number;
        statusDistribution: Record<string, number>;
      },
      RepositoryError
    >
  > {
    try {
      const { data: statsData, error: statsError } = await this.supabase
        .from("prediction_game_stats")
        .select("*")
        .eq("game_id", id)
        .single();

      if (statsError) {
        if (statsError.code === "PGRST116") {
          // 통계가 없으면 실시간 계산
          return this.calculateRealTimeStatistics(id);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "getStatistics",
            statsError.message,
            statsError
          )
        );
      }

      const statistics = {
        totalParticipants: statsData.total_participants,
        totalStake: statsData.total_stake,
        averageConfidence: statsData.average_confidence,
        statusDistribution: statsData.status_distribution || {},
      };

      return success(statistics);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "getStatistics",
          "Unexpected error during statistics query",
          error as Error
        )
      );
    }
  }

  /**
   * 버전을 포함한 게임 저장
   */
  async saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>> {
    try {
      const gameData = this.mapDomainToDatabase(game);
      gameData.version = version + 1;

      const { data, error } = await this.supabase
        .from("prediction_games")
        .update(gameData)
        .eq("id", game.id)
        .eq("version", version)
        .select("version")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // 버전 충돌
          return failure(
            new RepositoryError(
              "Concurrent modification detected",
              RepositoryErrorCodes.CONCURRENT_MODIFICATION,
              error
            )
          );
        }
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "PredictionGame",
            error.message,
            error
          )
        );
      }

      return success(data.version);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          "Unexpected error during versioned save",
          error as Error
        )
      );
    }
  }

  /**
   * 벌크 업데이트
   */
  async bulkUpdate(
    games: PredictionGame[]
  ): Promise<Result<number, RepositoryError>> {
    try {
      if (games.length === 0) {
        return success(0);
      }

      const gamesData = games.map((game) => this.mapDomainToDatabase(game));

      const { data, error } = await this.supabase
        .from("prediction_games")
        .upsert(gamesData, { onConflict: "id" })
        .select("id");

      if (error) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "PredictionGame",
            `Bulk update failed: ${error.message}`,
            error
          )
        );
      }

      return success(data?.length || 0);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          "Unexpected error during bulk update",
          error as Error
        )
      );
    }
  }

  // =========================
  // Private Helper Methods
  // =========================

  /**
   * 도메인 객체를 데이터베이스 행으로 변환
   */
  private mapDomainToDatabase(game: PredictionGame): PredictionGameRow {
    return {
      id: game.id,
      creator_id: game.getCreatedBy(),
      title: game.getTitle(),
      description: game.getDescription(),
      prediction_type: game.getPredictionType(),
      options: JSON.stringify(game.getOptions()),
      start_time: game.getStartTime().toISOString(),
      end_time: game.getEndTime().toISOString(),
      settlement_time: game.getSettlementTime().toISOString(),
      minimum_stake: game.getMinimumStake(),
      maximum_stake: game.getMaximumStake(),
      max_participants: game.getMaxParticipants() || null,
      status: game.status,
      money_wave_id: null, // MoneyWave 연동 시 설정
      game_importance_score: 1.0, // 기본값
      allocated_prize_pool: 0, // MoneyWave에서 설정
      created_at: game.getCreatedAt().toISOString(),
      updated_at: game.getUpdatedAt().toISOString(),
      version: game.getVersion(),
    };
  }

  /**
   * 예측 도메인 객체를 데이터베이스 행으로 변환
   */
  private mapPredictionToDatabase(prediction: Prediction): PredictionRow {
    return {
      id: prediction.id,
      user_id: prediction.userId,
      game_id: prediction.gameId,
      selected_option_id: prediction.selectedOptionId,
      stake: prediction.stake,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning || null,
      is_correct: (prediction.result as any)?.isCorrect || null,
      accuracy_score: prediction.accuracyScore || null,
      reward_amount: prediction.reward || null,
      created_at: prediction.timestamps.createdAt.toISOString(),
      updated_at: prediction.timestamps.updatedAt.toISOString(),
    };
  }

  /**
   * 데이터베이스 행을 도메인 객체로 변환
   */
  private mapDatabaseToDomain(
    gameData: PredictionGameRow,
    predictionsData: PredictionRow[]
  ): PredictionGame {
    const configuration: GameConfiguration = {
      title: gameData.title,
      description: gameData.description,
      predictionType: gameData.prediction_type as PredictionType,
      options: JSON.parse(gameData.options) as PredictionOption[],
      startTime: new Date(gameData.start_time),
      endTime: new Date(gameData.end_time),
      settlementTime: new Date(gameData.settlement_time),
      minimumStake: gameData.minimum_stake as PMP,
      maximumStake: gameData.maximum_stake as PMP,
      maxParticipants: gameData.max_participants || undefined,
    };

    // PredictionGame 재구성을 위한 리플렉션 접근
    // 실제 구현에서는 PredictionGame에 fromDatabase 정적 메서드를 추가하는 것이 좋음
    const game = (PredictionGame as any).create(
      createUserId(gameData.creator_id),
      configuration
    );

    if (!game.success) {
      throw new Error(`Failed to create PredictionGame: ${game.error.message}`);
    }

    const predictionGame = game.data;

    // 상태 설정
    (predictionGame as any)._status = gameData.status as unknown as GameStatus;
    (predictionGame as any)._timestamps = {
      createdAt: new Date(gameData.created_at),
      updatedAt: new Date(gameData.updated_at),
    };

    // 예측 데이터 추가
    predictionsData.forEach((predictionData) => {
      const prediction = this.mapDatabaseToPrediction(predictionData);
      (predictionGame as any)._predictions.set(prediction.id, prediction);
    });

    return predictionGame;
  }

  /**
   * 데이터베이스 행을 예측 도메인 객체로 변환
   */
  private mapDatabaseToPrediction(data: PredictionRow): Prediction {
    const prediction = (Prediction as any).create(
      createUserId(data.user_id),
      createPredictionGameId(data.game_id),
      data.selected_option_id,
      data.stake as PMP,
      data.confidence,
      data.reasoning || undefined
    );

    if (!prediction.success) {
      throw new Error(
        `Failed to create Prediction: ${prediction.error.message}`
      );
    }

    const predictionEntity = prediction.data;

    // 결과 설정
    if (
      data.is_correct !== null &&
      data.accuracy_score !== null &&
      data.reward_amount !== null
    ) {
      predictionEntity.setResult(
        { isCorrect: data.is_correct },
        data.accuracy_score as AccuracyScore,
        data.reward_amount as PMC
      );
    }

    // 타임스탬프 설정
    (predictionEntity as any)._timestamps = {
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return predictionEntity;
  }

  /**
   * 게임들의 예측 데이터 일괄 조회
   */
  private async fetchPredictionsForGames(
    gameIds: string[]
  ): Promise<Result<Map<string, PredictionRow[]>, RepositoryError>> {
    try {
      if (gameIds.length === 0) {
        return success(new Map());
      }

      const { data: predictionsData, error: predictionsError } =
        await this.supabase
          .from("predictions")
          .select("*")
          .in("game_id", gameIds);

      if (predictionsError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "fetchPredictionsForGames",
            predictionsError.message,
            predictionsError
          )
        );
      }

      const predictionsByGame = new Map<string, PredictionRow[]>();
      (predictionsData || []).forEach((prediction) => {
        const gameId = prediction.game_id;
        if (!predictionsByGame.has(gameId)) {
          predictionsByGame.set(gameId, []);
        }
        predictionsByGame.get(gameId)!.push(prediction);
      });

      return success(predictionsByGame);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "fetchPredictionsForGames",
          "Unexpected error during predictions fetch",
          error as Error
        )
      );
    }
  }

  /**
   * 정렬 컬럼 매핑
   */
  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      title: "title",
    };
    return columnMap[sortBy] || "created_at";
  }

  /**
   * 실시간 통계 계산
   */
  private async calculateRealTimeStatistics(gameId: PredictionGameId): Promise<
    Result<
      {
        totalParticipants: number;
        totalStake: number;
        averageConfidence: number;
        statusDistribution: Record<string, number>;
      },
      RepositoryError
    >
  > {
    try {
      const { data: predictionsData, error: predictionsError } =
        await this.supabase
          .from("predictions")
          .select("stake, confidence")
          .eq("game_id", gameId);

      if (predictionsError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "calculateRealTimeStatistics",
            predictionsError.message,
            predictionsError
          )
        );
      }

      const predictions = predictionsData || [];
      const totalParticipants = predictions.length;
      const totalStake = predictions.reduce((sum, p) => sum + p.stake, 0);
      const averageConfidence =
        totalParticipants > 0
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) /
            totalParticipants
          : 0;

      const statistics = {
        totalParticipants,
        totalStake,
        averageConfidence,
        statusDistribution: {}, // 간단한 구현에서는 빈 객체
      };

      return success(statistics);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "calculateRealTimeStatistics",
          "Unexpected error during real-time statistics calculation",
          error as Error
        )
      );
    }
  }

  /**
   * 필터 조건으로 게임 목록 조회 (새로운 UseCase용)
   */
  async findMany(options: {
    filters?: any;
    pagination?: { limit: number; offset: number };
    sorting?: { field: string; order: "asc" | "desc" };
  }): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const {
        filters = {},
        pagination = { limit: 20, offset: 0 },
        sorting = { field: "created_at", order: "desc" },
      } = options;

      // Supabase 쿼리 빌더 생성
      let query = this.supabase.from("prediction_games").select("*");

      // 필터 조건 추가
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.createdBy) {
        query = query.eq("creator_id", filters.createdBy);
      }

      // 정렬 추가
      const sortField =
        sorting.field === "created_at" ? "created_at" : "updated_at";
      const ascending = sorting.order === "asc";
      query = query.order(sortField, { ascending });

      // 페이지네이션 추가
      query = query.range(
        pagination.offset,
        pagination.offset + pagination.limit - 1
      );

      const { data: gamesData, error: gamesError } = await query;

      if (gamesError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findMany",
            gamesError.message,
            gamesError
          )
        );
      }

      if (!gamesData || gamesData.length === 0) {
        return success([]);
      }

      // 예측 데이터 조회
      const gameIds = gamesData.map((game) => game.id);
      const predictionsResult = await this.fetchPredictionsForGames(gameIds);

      if (!predictionsResult.success) {
        return failure(predictionsResult.error);
      }

      const predictionsByGame = predictionsResult.data;

      // 도메인 객체로 변환
      const games = gamesData.map((gameData) => {
        const predictions = predictionsByGame.get(gameData.id) || [];
        return this.mapDatabaseToDomain(gameData, predictions);
      });

      return success(games);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findMany",
          "Unexpected error during find many",
          error as Error
        )
      );
    }
  }

  /**
   * 필터 조건에 해당하는 게임 수 조회
   */
  async countByFilters(filters: any): Promise<Result<number, RepositoryError>> {
    try {
      let query = this.supabase
        .from("prediction_games")
        .select("*", { count: "exact", head: true });

      // 필터 조건 추가
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.createdBy) {
        query = query.eq("creator_id", filters.createdBy);
      }

      const { count, error } = await query;

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "countByFilters",
            error.message,
            error
          )
        );
      }

      return success(count || 0);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "countByFilters",
          "Unexpected error during count",
          error as Error
        )
      );
    }
  }
}
