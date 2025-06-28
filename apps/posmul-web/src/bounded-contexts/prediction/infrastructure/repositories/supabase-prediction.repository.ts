/**
 * Supabase Prediction Repository Implementation
 *
 * Infrastructure 계층에서 Prediction Repository 인터페이스를 구현
 * 개별 예측 엔티티에 특화된 CRUD 및 쿼리 기능 제공
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
  PredictionId,
  UserId,
} from "../../../../shared/types/branded-types";
import {
  failure,
  Result,
  success,
} from "../../../../shared/types/economic-system";
import { Prediction } from "../../domain/entities/prediction-game.aggregate";
import {
  PaginatedResult,
  PaginationRequest,
  RepositoryError,
  RepositoryHelpers,
} from "../../domain/repositories/prediction-game.repository";
import {
  IPredictionRepository,
  PredictionPerformanceStats,
  PredictionSearchFilters,
} from "../../domain/repositories/prediction.repository";

/**
 * 데이터베이스 행 타입 정의
 */
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
 * 성과 통계 데이터베이스 행 타입
 */
interface UserPredictionStatsRow {
  user_id: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  average_confidence: number;
  total_staked: number;
  total_rewards: number;
  roi: number;
  period_start: string;
  period_end: string;
}

/**
 * Supabase Prediction Repository 구현체
 */
export class SupabasePredictionRepository implements IPredictionRepository {
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
   * 예측 저장
   */
  async save(prediction: Prediction): Promise<Result<void, RepositoryError>> {
    try {
      const predictionData = this.mapDomainToDatabase(prediction);

      const { error } = await this.supabase
        .from("predictions")
        .upsert(predictionData, {
          onConflict: "id",
          ignoreDuplicates: false,
        });

      if (error) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "Prediction",
            error.message,
            error
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "Prediction",
          "Unexpected error during save operation",
          error as Error
        )
      );
    }
  }

  /**
   * ID로 예측 조회
   */
  async findById(
    id: PredictionId
  ): Promise<Result<Prediction | null, RepositoryError>> {
    try {
      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(null);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findById",
            error.message,
            error
          )
        );
      }

      const prediction = this.mapDatabaseToDomain(data);
      return success(prediction);
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
   * 여러 ID로 예측 일괄 조회
   */
  async findByIds(
    ids: PredictionId[]
  ): Promise<Result<Map<PredictionId, Prediction>, RepositoryError>> {
    try {
      if (ids.length === 0) {
        return success(new Map());
      }

      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .in("id", ids);

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByIds",
            error.message,
            error
          )
        );
      }

      const result = new Map<PredictionId, Prediction>();
      (data || []).forEach((row) => {
        const prediction = this.mapDatabaseToDomain(row);
        result.set(prediction.id, prediction);
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
   * 게임별 예측 조회
   */
  async findByGame(
    gameId: PredictionGameId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>> {
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
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId);

      if (countError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByGame - count",
            countError.message,
            countError
          )
        );
      }

      // 데이터 조회
      let query = this.supabase
        .from("predictions")
        .select("*")
        .eq("game_id", gameId)
        .range(offset, offset + paginationConfig.limit - 1);

      // 정렬 적용
      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data, error } = await query;

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByGame",
            error.message,
            error
          )
        );
      }

      const predictions = (data || []).map((row) =>
        this.mapDatabaseToDomain(row)
      );

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<Prediction> = {
        items: predictions,
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
          "findByGame",
          "Unexpected error during game query",
          error as Error
        )
      );
    }
  }

  /**
   * 사용자별 예측 조회
   */
  async findByUser(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>> {
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
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByUser - count",
            countError.message,
            countError
          )
        );
      }

      // 데이터 조회
      let query = this.supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .range(offset, offset + paginationConfig.limit - 1);

      if (paginationConfig.sortBy) {
        const sortColumn = this.mapSortColumn(paginationConfig.sortBy);
        query = query.order(sortColumn, {
          ascending: paginationConfig.sortOrder === "asc",
        });
      }

      const { data, error } = await query;

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByUser",
            error.message,
            error
          )
        );
      }

      const predictions = (data || []).map((row) =>
        this.mapDatabaseToDomain(row)
      );

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<Prediction> = {
        items: predictions,
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
          "findByUser",
          "Unexpected error during user query",
          error as Error
        )
      );
    }
  }

  /**
   * 사용자의 특정 게임 예측 조회
   */
  async findByUserAndGame(
    userId: UserId,
    gameId: PredictionGameId
  ): Promise<Result<Prediction | null, RepositoryError>> {
    try {
      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("game_id", gameId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(null);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findByUserAndGame",
            error.message,
            error
          )
        );
      }

      const prediction = this.mapDatabaseToDomain(data);
      return success(prediction);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findByUserAndGame",
          "Unexpected error during user-game query",
          error as Error
        )
      );
    }
  }

  /**
   * 고급 검색
   */
  async search(
    filters: PredictionSearchFilters,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<Prediction>, RepositoryError>> {
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
      let query = this.supabase.from("predictions").select("*");
      let countQuery = this.supabase
        .from("predictions")
        .select("*", { count: "exact", head: true });

      // 필터 적용
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
        countQuery = countQuery.eq("user_id", filters.userId);
      }

      if (filters.gameId) {
        query = query.eq("game_id", filters.gameId);
        countQuery = countQuery.eq("game_id", filters.gameId);
      }

      if (filters.selectedOptionId) {
        query = query.eq("selected_option_id", filters.selectedOptionId);
        countQuery = countQuery.eq(
          "selected_option_id",
          filters.selectedOptionId
        );
      }

      if (filters.minStake !== undefined) {
        query = query.gte("stake", filters.minStake);
        countQuery = countQuery.gte("stake", filters.minStake);
      }

      if (filters.maxStake !== undefined) {
        query = query.lte("stake", filters.maxStake);
        countQuery = countQuery.lte("stake", filters.maxStake);
      }

      if (filters.minConfidence !== undefined) {
        query = query.gte("confidence", filters.minConfidence);
        countQuery = countQuery.gte("confidence", filters.minConfidence);
      }

      if (filters.maxConfidence !== undefined) {
        query = query.lte("confidence", filters.maxConfidence);
        countQuery = countQuery.lte("confidence", filters.maxConfidence);
      }

      if (filters.hasResult !== undefined) {
        if (filters.hasResult) {
          query = query.not("is_correct", "is", null);
          countQuery = countQuery.not("is_correct", "is", null);
        } else {
          query = query.is("is_correct", null);
          countQuery = countQuery.is("is_correct", null);
        }
      }

      if (filters.createdFrom) {
        query = query.gte("created_at", filters.createdFrom.toISOString());
        countQuery = countQuery.gte(
          "created_at",
          filters.createdFrom.toISOString()
        );
      }

      if (filters.createdTo) {
        query = query.lte("created_at", filters.createdTo.toISOString());
        countQuery = countQuery.lte(
          "created_at",
          filters.createdTo.toISOString()
        );
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

      const { data, error } = await query;

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "search",
            error.message,
            error
          )
        );
      }

      const predictions = (data || []).map((row) =>
        this.mapDatabaseToDomain(row)
      );

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / paginationConfig.limit);

      const result: PaginatedResult<Prediction> = {
        items: predictions,
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
   * 결과 미설정 예측 조회
   */
  async findPendingResults(
    gameIds: PredictionGameId[],
    limit?: number
  ): Promise<Result<Prediction[], RepositoryError>> {
    try {
      if (gameIds.length === 0) {
        return success([]);
      }

      const queryLimit = limit || 100;

      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .in("game_id", gameIds)
        .is("is_correct", null)
        .limit(queryLimit);

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findPendingResults",
            error.message,
            error
          )
        );
      }

      const predictions = (data || []).map((row) =>
        this.mapDatabaseToDomain(row)
      );
      return success(predictions);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findPendingResults",
          "Unexpected error during pending results query",
          error as Error
        )
      );
    }
  }

  /**
   * 사용자 예측 성과 통계
   */
  async getUserPerformanceStats(
    userId: UserId,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<PredictionPerformanceStats, RepositoryError>> {
    try {
      // 미리 계산된 통계가 있는지 확인
      const { data: statsData, error: statsError } = await this.supabase
        .from("user_prediction_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError && statsError.code !== "PGRST116") {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "getUserPerformanceStats - precomputed",
            statsError.message,
            statsError
          )
        );
      }

      if (statsData) {
        const stats: PredictionPerformanceStats = {
          totalPredictions: statsData.total_predictions,
          correctPredictions: statsData.correct_predictions,
          accuracyRate: statsData.accuracy_rate,
          averageConfidence: statsData.average_confidence,
          totalStaked: statsData.total_staked,
          totalRewards: statsData.total_rewards,
          roi: statsData.roi,
        };
        return success(stats);
      }

      // 실시간 계산
      return this.calculateUserPerformanceStats(userId, fromDate, toDate);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "getUserPerformanceStats",
          "Unexpected error during performance stats query",
          error as Error
        )
      );
    }
  }

  /**
   * 게임별 예측 통계
   */
  async getGamePredictionStats(gameId: PredictionGameId): Promise<
    Result<
      {
        totalPredictions: number;
        optionDistribution: Record<string, number>;
        averageStake: number;
        averageConfidence: number;
        uniqueParticipants: number;
      },
      RepositoryError
    >
  > {
    try {
      const { data, error } = await this.supabase
        .from("predictions")
        .select("selected_option_id, stake, confidence, user_id")
        .eq("game_id", gameId);

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "getGamePredictionStats",
            error.message,
            error
          )
        );
      }

      const predictions = data || [];
      const totalPredictions = predictions.length;

      // 옵션별 분포 계산
      const optionDistribution: Record<string, number> = {};
      predictions.forEach((p) => {
        optionDistribution[p.selected_option_id] =
          (optionDistribution[p.selected_option_id] || 0) + 1;
      });

      // 평균 계산
      const averageStake =
        totalPredictions > 0
          ? predictions.reduce((sum, p) => sum + p.stake, 0) / totalPredictions
          : 0;

      const averageConfidence =
        totalPredictions > 0
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) /
            totalPredictions
          : 0;

      // 고유 참여자 수
      const uniqueParticipants = new Set(predictions.map((p) => p.user_id))
        .size;

      const stats = {
        totalPredictions,
        optionDistribution,
        averageStake,
        averageConfidence,
        uniqueParticipants,
      };

      return success(stats);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "getGamePredictionStats",
          "Unexpected error during game stats calculation",
          error as Error
        )
      );
    }
  }

  /**
   * 예측 존재 여부 확인
   */
  async exists(id: PredictionId): Promise<Result<boolean, RepositoryError>> {
    try {
      const { data, error } = await this.supabase
        .from("predictions")
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
   * 사용자가 게임에 이미 참여했는지 확인
   */
  async hasUserParticipated(
    userId: UserId,
    gameId: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const { data, error } = await this.supabase
        .from("predictions")
        .select("id")
        .eq("user_id", userId)
        .eq("game_id", gameId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return success(false);
        }
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "hasUserParticipated",
            error.message,
            error
          )
        );
      }

      return success(!!data);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "hasUserParticipated",
          "Unexpected error during participation check",
          error as Error
        )
      );
    }
  }

  /**
   * 예측 삭제 (소프트 삭제)
   */
  async delete(id: PredictionId): Promise<Result<void, RepositoryError>> {
    try {
      // 실제 삭제 대신 소프트 삭제 구현 가능
      const { error } = await this.supabase
        .from("predictions")
        .delete()
        .eq("id", id);

      if (error) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "Prediction",
            `Failed to delete prediction: ${error.message}`,
            error
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "Prediction",
          "Unexpected error during deletion",
          error as Error
        )
      );
    }
  }

  /**
   * 벌크 예측 결과 업데이트
   */
  async bulkUpdateResults(
    predictions: Prediction[]
  ): Promise<Result<number, RepositoryError>> {
    try {
      if (predictions.length === 0) {
        return success(0);
      }

      const updateData = predictions.map((prediction) => ({
        id: prediction.id,
        is_correct: prediction.result?.isCorrect,
        accuracy_score: prediction.accuracyScore,
        reward_amount: prediction.reward,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await this.supabase
        .from("predictions")
        .upsert(updateData, { onConflict: "id" })
        .select("id");

      if (error) {
        return failure(
          RepositoryHelpers.createSaveFailedError(
            "Prediction",
            `Bulk update failed: ${error.message}`,
            error
          )
        );
      }

      return success(data?.length || 0);
    } catch (error) {
      return failure(
        RepositoryHelpers.createSaveFailedError(
          "Prediction",
          "Unexpected error during bulk update",
          error as Error
        )
      );
    }
  }

  /**
   * 높은 신뢰도 예측 조회
   */
  async findHighConfidencePredictions(
    minConfidence: number,
    limit?: number
  ): Promise<Result<Prediction[], RepositoryError>> {
    try {
      const queryLimit = limit || 50;

      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .gte("confidence", minConfidence)
        .order("confidence", { ascending: false })
        .limit(queryLimit);

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "findHighConfidencePredictions",
            error.message,
            error
          )
        );
      }

      const predictions = (data || []).map((row) =>
        this.mapDatabaseToDomain(row)
      );
      return success(predictions);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "findHighConfidencePredictions",
          "Unexpected error during high confidence query",
          error as Error
        )
      );
    }
  }

  /**
   * 게임별 상위 성과 예측자 조회
   */
  async getTopPerformersForGame(
    gameId: PredictionGameId,
    limit?: number
  ): Promise<
    Result<
      Array<{
        userId: UserId;
        prediction: Prediction;
        performanceScore: number;
      }>,
      RepositoryError
    >
  > {
    try {
      const queryLimit = limit || 10;

      const { data, error } = await this.supabase
        .from("predictions")
        .select("*")
        .eq("game_id", gameId)
        .not("accuracy_score", "is", null)
        .order("accuracy_score", { ascending: false })
        .limit(queryLimit);

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "getTopPerformersForGame",
            error.message,
            error
          )
        );
      }

      const topPerformers = (data || []).map((row) => {
        const prediction = this.mapDatabaseToDomain(row);
        return {
          userId: prediction.userId,
          prediction,
          performanceScore: prediction.accuracyScore || 0,
        };
      });

      return success(topPerformers);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "getTopPerformersForGame",
          "Unexpected error during top performers query",
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
  private mapDomainToDatabase(prediction: Prediction): PredictionRow {
    return {
      id: prediction.id,
      user_id: prediction.userId,
      game_id: prediction.gameId,
      selected_option_id: prediction.selectedOptionId,
      stake: prediction.stake,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning || null,
      is_correct: prediction.result?.isCorrect || null,
      accuracy_score: prediction.accuracyScore || null,
      reward_amount: prediction.reward || null,
      created_at: prediction.timestamps.createdAt.toISOString(),
      updated_at: prediction.timestamps.updatedAt.toISOString(),
    };
  }

  /**
   * 데이터베이스 행을 도메인 객체로 변환
   */
  private mapDatabaseToDomain(data: PredictionRow): Prediction {
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
   * 정렬 컬럼 매핑
   */
  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      stake: "stake",
      confidence: "confidence",
    };
    return columnMap[sortBy] || "created_at";
  }

  /**
   * 사용자 성과 통계 실시간 계산
   */
  private async calculateUserPerformanceStats(
    userId: UserId,
    fromDate?: Date,
    toDate?: Date
  ): Promise<Result<PredictionPerformanceStats, RepositoryError>> {
    try {
      let query = this.supabase
        .from("predictions")
        .select("stake, is_correct, accuracy_score, reward_amount, confidence")
        .eq("user_id", userId);

      if (fromDate) {
        query = query.gte("created_at", fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte("created_at", toDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        return failure(
          RepositoryHelpers.createQueryFailedError(
            "calculateUserPerformanceStats",
            error.message,
            error
          )
        );
      }

      const predictions = data || [];
      const totalPredictions = predictions.length;
      const correctPredictions = predictions.filter(
        (p) => p.is_correct === true
      ).length;
      const accuracyRate =
        totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      const averageConfidence =
        totalPredictions > 0
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) /
            totalPredictions
          : 0;
      const totalStaked = predictions.reduce((sum, p) => sum + p.stake, 0);
      const totalRewards = predictions.reduce(
        (sum, p) => sum + (p.reward_amount || 0),
        0
      );
      const roi =
        totalStaked > 0 ? (totalRewards - totalStaked) / totalStaked : 0;

      const stats: PredictionPerformanceStats = {
        totalPredictions,
        correctPredictions,
        accuracyRate,
        averageConfidence,
        totalStaked,
        totalRewards,
        roi,
      };

      return success(stats);
    } catch (error) {
      return failure(
        RepositoryHelpers.createQueryFailedError(
          "calculateUserPerformanceStats",
          "Unexpected error during stats calculation",
          error as Error
        )
      );
    }
  }
}
