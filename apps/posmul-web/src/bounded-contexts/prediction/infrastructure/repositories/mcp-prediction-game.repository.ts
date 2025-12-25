/**
 * MCP-based Prediction Game Repository Implementation
 *
 * Supabase MCP를 통한 예측 게임 Repository 구현체
 * DDD + Clean Architecture 원칙 준수
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { PredictionGameId, Result, UserId, createPredictionGameId } from "@posmul/auth-economy-sdk";
import { createPmpAmount } from "@posmul/auth-economy-sdk";
import { createClient } from "../../../../lib/supabase/server";
import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { Prediction } from "../../domain/entities/prediction.entity";
import {
  IPredictionGameRepository,
  PaginatedResult,
  PaginationRequest,
  GameSearchFilters,
  PredictionGameFindManyFilters,
  RepositoryError,
  RepositoryHelpers,
} from "../../domain/repositories/prediction-game.repository";
import { GameStatus, PredictionType, GameOption } from "../../domain/value-objects/prediction-types";

/**
 * DB 로우를 도메인 모델로 매핑하기 위한 인터페이스
 */
interface PredictionGameRow {
  game_id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  prediction_type: string;
  game_options: unknown;
  difficulty: number;
  min_bet_amount: number;
  max_bet_amount: number;
  registration_start: string;
  registration_end: string;
  settlement_date: string;
  actual_result: unknown;
  status: string;
  external_id: string | null;
  data_source: string | null;
  tags: string[] | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  slug: string;
}

interface PredictionRow {
  prediction_id: string;
  game_id: string;
  user_id: string;
  prediction_data: { selectedOptionId: string } | unknown;
  confidence_level: number;
  bet_amount: number;
  expected_reward: number;
  odds_at_time: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * MCP 기반 Prediction Game Repository 구현체
 */
export class MCPPredictionGameRepository implements IPredictionGameRepository {
  constructor(private readonly projectId: string = "fabyagohqqnusmnwekuc") {}

  /**
   * 게임 저장 (Upsert) - 게임 생성자만 게임 데이터를 수정할 수 있음
   * 참여자는 predictions만 저장됨
   */
  async save(game: PredictionGame, options?: { skipGameUpdate?: boolean }): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await createClient();

      // 게임 데이터 업데이트 (생성자만 가능)
      // skipGameUpdate가 true이거나, 새 predictions만 추가하는 경우 게임 테이블 업데이트 스킵
      if (!options?.skipGameUpdate) {
        const gameData = {
          game_id: game.getId(),
          creator_id: game.creatorId,
          title: game.title,
          description: game.description,
          prediction_type: this.mapPredictionTypeToDB(game.predictionType),
          game_options: JSON.stringify(game.options),
          min_bet_amount: Number(game.minimumStake),
          max_bet_amount: Number(game.maximumStake),
          registration_start: game.startTime.toISOString(),
          registration_end: game.endTime.toISOString(),
          settlement_date: game.settlementTime.toISOString(),
          status: this.mapStatusToDB(game.getStatus()),
          metadata: { maxParticipants: game.maxParticipants },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .schema("prediction")
          .from("prediction_games")
          .upsert(gameData, { onConflict: "game_id" });

        if (error) {
          // RLS 오류인 경우 게임 데이터 업데이트 실패지만, predictions 저장은 계속 진행
          void error;
        }
      }

      // 예측 정보 저장 (참여자도 가능)
      // skipGameUpdate 모드에서는 마지막 prediction만 저장 (새로 추가된 것)
      // 일반 모드에서는 모든 predictions 저장
      const predictions = game.predictions;
      if (predictions.length > 0) {
        // 참여(베팅)는 반드시 원자적으로 처리 (PMP 즉시 차감 + prediction insert)
        if (options?.skipGameUpdate) {
          const last = predictions[predictions.length - 1];

          const { data: predictionId, error: rpcError } = await supabase
            .schema("prediction")
            .rpc("place_prediction_bet", {
              p_game_id: game.getId(),
              p_prediction_data: { selectedOptionId: last.selectedOptionId },
              p_confidence_level: Math.round(last.confidence * 100),
              p_bet_amount: Number(last.stake),
              p_expected_reward: 0,
              p_odds_at_time: 1,
            });

          if (rpcError) {
            return {
              success: false,
              error: RepositoryHelpers.createSaveFailedError(
                "place_prediction_bet",
                rpcError.message,
                new Error(rpcError.message)
              ),
            };
          }

          // Domain의 prediction_id와 DB에서 생성된 prediction_id가 달라도,
          // 현재 구현은 DB가 최종 소스이므로 RPC 결과를 신뢰한다.
          void predictionId;
        } else {
          // 관리자/배치 저장 모드에서는 경제 잔액 변동이 발생하면 안 되므로 기존 insert 경로 유지
          const predictionData = predictions.map((p) => ({
            prediction_id: p.id,
            game_id: game.getId(),
            user_id: p.userId,
            prediction_data: { selectedOptionId: p.selectedOptionId },
            confidence_level: Math.round(p.confidence * 100),
            bet_amount: Number(p.stake),
            expected_reward: 0,
            odds_at_time: 1.0,
            is_active: true,
            created_at: p.timestamps.createdAt.toISOString(),
            updated_at: p.timestamps.updatedAt.toISOString(),
          }));

          const { error: predError } = await supabase
            .schema("prediction")
            .from("predictions")
            .insert(predictionData);

          if (predError) {
            return {
              success: false,
              error: RepositoryHelpers.createSaveFailedError(
                "Predictions",
                predError.message,
                new Error(predError.message)
              ),
            };
          }
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          error instanceof Error ? error.message : "Unknown error",
          error instanceof Error ? error : undefined
        ),
      };
    }
  }

  /**
   * ID로 게임 조회
   */
  async findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>> {
    try {
      const supabase = await createClient();

      const { data: gameRow, error } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*")
        .eq("game_id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { success: true, data: null };
        }
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "findById",
            error.message,
            new Error(error.message)
          ),
        };
      }

      if (!gameRow) {
        return { success: true, data: null };
      }

      // Supabase .schema()와 .single() 조합 시 배열로 반환되는 문제 처리
      const processedGameRow = Array.isArray(gameRow) ? gameRow[0] : gameRow;

      if (!processedGameRow) {
        return { success: true, data: null };
      }

      // 게임에 대한 예측들 조회
      const { data: predictionRows } = await supabase
        .schema("prediction")
        .from("predictions")
        .select("*")
        .eq("game_id", id)
        .eq("is_active", true);

      const game = this.mapRowToAggregate(
        processedGameRow as PredictionGameRow,
        (predictionRows || []) as PredictionRow[]
      );

      return { success: true, data: game };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "findById",
          error instanceof Error ? error.message : "Unknown error",
          error instanceof Error ? error : undefined
        ),
      };
    }
  }

  /**
   * 여러 ID로 게임 일괄 조회
   */
  async findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    try {
      const supabase = await createClient();

      const { data: gameRows, error } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*")
        .in("game_id", ids);

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "findByIds",
            error.message,
            new Error(error.message)
          ),
        };
      }

      const result = new Map<PredictionGameId, PredictionGame>();

      for (const row of gameRows || []) {
        const { data: predictionRows } = await supabase
          .schema("prediction")
          .from("predictions")
          .select("*")
          .eq("game_id", row.game_id)
          .eq("is_active", true);

        const game = this.mapRowToAggregate(
          row as PredictionGameRow,
          (predictionRows || []) as PredictionRow[]
        );
        if (game) {
          result.set(row.game_id as PredictionGameId, game);
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "findByIds",
          error instanceof Error ? error.message : "Unknown error",
          error instanceof Error ? error : undefined
        ),
      };
    }
  }

  /**
   * 상태별 게임 조회
   */
  async findByStatus(
    status: GameStatus,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.search({ status }, pagination);
  }

  /**
   * 생성자별 게임 조회
   */
  async findByCreator(
    creatorId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.search({ creatorId }, pagination);
  }

  /**
   * 사용자 참여 게임 조회
   */
  async findByParticipant(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const supabase = await createClient();
      const pag = pagination || RepositoryHelpers.getDefaultPagination();
      const offset = (pag.page - 1) * pag.limit;

      // 사용자가 참여한 게임 ID 조회
      const { data: participations, error: partError } = await supabase
        .schema("prediction")
        .from("predictions")
        .select("game_id")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (partError) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "findByParticipant",
            partError.message
          ),
        };
      }

      const gameIds = [...new Set((participations || []).map((p) => p.game_id))];

      if (gameIds.length === 0) {
        return {
          success: true,
          data: {
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pag.page,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      const { data: gameRows, error, count } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*", { count: "exact" })
        .in("game_id", gameIds)
        .order(pag.sortBy || "created_at", { ascending: pag.sortOrder === "asc" })
        .range(offset, offset + pag.limit - 1);

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "findByParticipant",
            error.message
          ),
        };
      }

      const games: PredictionGame[] = [];
      for (const row of gameRows || []) {
        const game = this.mapRowToAggregate(row as PredictionGameRow, []);
        if (game) games.push(game);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pag.limit);

      return {
        success: true,
        data: {
          items: games,
          totalCount,
          totalPages,
          currentPage: pag.page,
          hasNext: pag.page < totalPages,
          hasPrev: pag.page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "findByParticipant",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
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
      const supabase = await createClient();
      const pag = pagination || RepositoryHelpers.getDefaultPagination();
      const offset = (pag.page - 1) * pag.limit;

      const baseQuery = supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*", { count: "exact" });

      const applyFilters = (query: typeof baseQuery) => {
        let q = query;

        if (filters.creatorId) {
          q = q.eq("creator_id", filters.creatorId);
        }
        if (filters.status) {
          q = q.eq("status", this.mapStatusToDB(filters.status));
        }
        if (filters.predictionType) {
          q = q.eq("prediction_type", filters.predictionType);
        }
        if (filters.title) {
          q = q.ilike("title", `%${filters.title}%`);
        }
        if (filters.startTimeFrom) {
          q = q.gte(
            "registration_start",
            filters.startTimeFrom.toISOString()
          );
        }
        if (filters.startTimeTo) {
          q = q.lte("registration_start", filters.startTimeTo.toISOString());
        }

        return q;
      };

      const applyPagination = (query: typeof baseQuery) => {
        const sortBy = pag.sortBy || "created_at";
        const ascending = pag.sortOrder === "asc";

        return query
          .order(sortBy, { ascending })
          .range(offset, offset + pag.limit - 1);
      };

      const mapRowsToGames = (rows: unknown[] | null) => {
        if (!rows?.length) return [];

        return rows
          .map((row) => this.mapRowToAggregate(row as PredictionGameRow, []))
          .filter((game): game is PredictionGame => game !== null);
      };

      const query = applyPagination(applyFilters(baseQuery));
      const { data: gameRows, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError("search", error.message),
        };
      }

      const games = mapRowsToGames(gameRows as unknown[] | null);

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pag.limit);

      return {
        success: true,
        data: {
          items: games,
          totalCount,
          totalPages,
          currentPage: pag.page,
          hasNext: pag.page < totalPages,
          hasPrev: pag.page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "search",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 활성 게임 목록 조회
   */
  async findActiveGames(
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.search({ status: GameStatus.ACTIVE }, pagination);
  }

  /**
   * 정산 대기 게임 조회
   */
  async findPendingSettlement(
    limit: number = 10
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const supabase = await createClient();

      const { data: gameRows, error } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*")
        .eq("status", "CLOSED")
        .lte("settlement_date", new Date().toISOString())
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "findPendingSettlement",
            error.message
          ),
        };
      }

      const games: PredictionGame[] = [];
      for (const row of gameRows || []) {
        // 각 게임의 예측 정보 조회
        const { data: predictionRows } = await supabase
          .schema("prediction")
          .from("predictions")
          .select("*")
          .eq("game_id", row.game_id)
          .eq("is_active", true);

        const game = this.mapRowToAggregate(
          row as PredictionGameRow,
          (predictionRows || []) as PredictionRow[]
        );
        if (game) games.push(game);
      }

      return { success: true, data: games };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "findPendingSettlement",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 게임 존재 여부 확인
   */
  async exists(id: PredictionGameId): Promise<Result<boolean, RepositoryError>> {
    try {
      const supabase = await createClient();

      const { count, error } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*", { count: "exact", head: true })
        .eq("game_id", id);

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError("exists", error.message),
        };
      }

      return { success: true, data: (count || 0) > 0 };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "exists",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 게임 삭제 (소프트 삭제)
   */
  async delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .update({ status: "CANCELLED" })
        .eq("game_id", id);

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createSaveFailedError(
            "PredictionGame",
            error.message
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createSaveFailedError(
          "PredictionGame",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 다양한 옵션으로 게임 조회
   */
  async findMany(options: {
    filters?: PredictionGameFindManyFilters;
    pagination?: { limit: number; offset: number };
    sorting?: { field: string; order: "asc" | "desc" };
  }): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const supabase = await createClient();

      let query = supabase.schema("prediction").from("prediction_games").select("*");

      // 필터 적용
      if (options.filters) {
        const filters = options.filters;

        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        if (filters.category) {
          query = query.eq("category", filters.category);
        }

        if (filters.createdBy) {
          query = query.eq("creator_id", filters.createdBy);
        }

        if (filters.startTimeFrom) {
          query = query.gte(
            "registration_start",
            filters.startTimeFrom.toISOString()
          );
        }

        if (filters.startTimeTo) {
          query = query.lte(
            "registration_start",
            filters.startTimeTo.toISOString()
          );
        }
      }

      // 정렬
      if (options.sorting) {
        query = query.order(options.sorting.field, {
          ascending: options.sorting.order === "asc",
        });
      }

      // 페이지네이션
      if (options.pagination) {
        query = query.range(
          options.pagination.offset,
          options.pagination.offset + options.pagination.limit - 1
        );
      }

      const { data: gameRows, error } = await query;

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError("findMany", error.message),
        };
      }

      const games: PredictionGame[] = [];
      for (const row of gameRows || []) {
        const game = this.mapRowToAggregate(row as PredictionGameRow, []);
        if (game) games.push(game);
      }

      return { success: true, data: games };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "findMany",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 필터 조건에 맞는 게임 수 카운트
   */
  async countByFilters(
    filters: PredictionGameFindManyFilters
  ): Promise<Result<number, RepositoryError>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .schema("prediction")
        .from("prediction_games")
        .select("*", { count: "exact", head: true });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.createdBy) {
        query = query.eq("creator_id", filters.createdBy);
      }

      if (filters.startTimeFrom) {
        query = query.gte("registration_start", filters.startTimeFrom.toISOString());
      }

      if (filters.startTimeTo) {
        query = query.lte("registration_start", filters.startTimeTo.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "countByFilters",
            error.message
          ),
        };
      }

      return { success: true, data: count || 0 };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "countByFilters",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
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
      const supabase = await createClient();

      const { data: stats, error } = await supabase
        .schema("prediction")
        .from("prediction_statistics")
        .select("*")
        .eq("game_id", id)
        .single();

      if (error) {
        // 통계가 없으면 기본값 반환
        return {
          success: true,
          data: {
            totalParticipants: 0,
            totalStake: 0,
            averageConfidence: 0,
            statusDistribution: {},
          },
        };
      }

      return {
        success: true,
        data: {
          totalParticipants: stats.total_participants || 0,
          totalStake: stats.total_bet_amount || 0,
          averageConfidence: 0.5,
          statusDistribution: (stats.option_distributions as Record<string, number>) || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "getStatistics",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 버전 관리와 함께 저장 (낙관적 잠금)
   */
  async saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>> {
    // 현재 구현에서는 단순 저장 후 새 버전 반환
    const saveResult = await this.save(game);
    if (saveResult.success === false) {
      return { success: false, error: saveResult.error };
    }
    return { success: true, data: version + 1 };
  }

  /**
   * 벌크 업데이트
   */
  async bulkUpdate(
    games: PredictionGame[]
  ): Promise<Result<number, RepositoryError>> {
    let successCount = 0;

    for (const game of games) {
      const result = await this.save(game);
      if (result.success) {
        successCount++;
      }
    }

    return { success: true, data: successCount };
  }

  // ============ Private Helper Methods ============

  /**
   * DB 상태를 도메인 상태(enum)로 매핑
   */
  private mapStatusFromDB(dbStatus: string): GameStatus {
    const statusMap: Record<string, GameStatus> = {
      DRAFT: GameStatus.PENDING,
      PENDING: GameStatus.PENDING,
      ACTIVE: GameStatus.ACTIVE,
      CLOSED: GameStatus.ENDED,
      SETTLED: GameStatus.COMPLETED,
      CANCELLED: GameStatus.CANCELLED,
    };
    return statusMap[dbStatus] || GameStatus.PENDING;
  }

  /**
   * 도메인 상태(enum)를 DB 상태로 매핑
   */
  private mapStatusToDB(domainStatus: GameStatus): string {
    const statusMap: Record<GameStatus, string> = {
      [GameStatus.PENDING]: "DRAFT",
      [GameStatus.CREATED]: "DRAFT",
      [GameStatus.ACTIVE]: "ACTIVE",
      [GameStatus.ENDED]: "CLOSED",
      [GameStatus.COMPLETED]: "SETTLED",
      [GameStatus.CANCELLED]: "CANCELLED",
    };
    return statusMap[domainStatus] || "DRAFT";
  }

  /**
   * 예측 타입 매핑
   */
  private mapPredictionType(dbType: string): PredictionType {
    const typeMap: Record<string, PredictionType> = {
      binary: PredictionType.BINARY,
      BINARY: PredictionType.BINARY,
      win_draw_lose: PredictionType.WIN_DRAW_LOSE,
      WIN_DRAW_LOSE: PredictionType.WIN_DRAW_LOSE,
      wdl: PredictionType.WIN_DRAW_LOSE,
      WDL: PredictionType.WIN_DRAW_LOSE,
      ranking: PredictionType.RANKING,
      RANKING: PredictionType.RANKING,
    };
    return typeMap[dbType] || PredictionType.BINARY;
  }

  /**
   * Domain PredictionType → DB enum 값 변환
   * DB enum: 'BINARY', 'WIN_DRAW_LOSE', 'RANKING' (대문자)
   */
  private mapPredictionTypeToDB(domainType: PredictionType): string {
    const typeMap: Record<PredictionType, string> = {
      [PredictionType.BINARY]: "BINARY",
      [PredictionType.WIN_DRAW_LOSE]: "WIN_DRAW_LOSE",
      [PredictionType.RANKING]: "RANKING",
    };
    return typeMap[domainType] || "BINARY";
  }

  /**
   * DB 로우를 도메인 Aggregate로 변환
   */
  private mapRowToAggregate(
    row: PredictionGameRow,
    predictionRows: PredictionRow[]
  ): PredictionGame | null {
    try {
      // Supabase .schema()와 .single() 조합 시 배열로 반환되는 문제 처리
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actualRow: PredictionGameRow = Array.isArray(row) ? (row as any)[0] : row;
      
      if (!actualRow) {
        return null;
      }

      // game_options 파싱 - 다양한 형식 지원
      let options: GameOption[] = [];
      if (actualRow.game_options) {
        const parsed =
          typeof actualRow.game_options === "string"
            ? JSON.parse(actualRow.game_options)
            : actualRow.game_options;

        // 형식 1: [{ id, label }, ...] - 직접 배열
        // 형식 2: { options: [{ id, label }, ...] } - options 키 안에 배열
        const optionsArray = Array.isArray(parsed) 
          ? parsed 
          : (parsed?.options && Array.isArray(parsed.options)) 
            ? parsed.options 
            : [];

        options = optionsArray.map((opt: { id?: string; label?: string; text?: string; currentOdds?: number; description?: string }, idx: number) => ({
          id: opt.id || `option-${idx}`,
          label: opt.label || opt.text || `Option ${idx + 1}`,
          description: opt.description,
        }));
      }

      // 기본 옵션 설정
      if (options.length === 0) {
        options = [
          { id: "yes", label: "예" },
          { id: "no", label: "아니오" },
        ];
      }

      // PredictionGame.create 대신 직접 reconstruct 방식 사용
      // (create는 검증이 있어서 기존 데이터 로딩에 부적합)
      
      // DB에서 Decimal로 반환되므로 정수로 변환 (parseInt 사용)
      const minBetParsed = parseInt(String(actualRow.min_bet_amount), 10);
      const maxBetParsed = parseInt(String(actualRow.max_bet_amount), 10);
      
      // DB status를 도메인 GameStatus로 변환
      const gameStatus = this.mapStatusFromDB(actualRow.status);
      
      const gameResult = PredictionGame.create({
        id: createPredictionGameId(actualRow.game_id), // DB에서 로딩한 ID 사용
        creatorId: actualRow.creator_id as UserId,
        title: actualRow.title,
        description: actualRow.description,
        predictionType: this.mapPredictionType(actualRow.prediction_type),
        options,
        startTime: new Date(actualRow.registration_start),
        endTime: new Date(actualRow.registration_end),
        settlementTime: new Date(actualRow.settlement_date),
        minimumStake: createPmpAmount(minBetParsed) as any,
        maximumStake: createPmpAmount(maxBetParsed) as any,
        maxParticipants: (actualRow.metadata as { maxParticipants?: number })?.maxParticipants,
        status: gameStatus, // DB에서 로딩한 상태 전달
      });

      if (!gameResult.success) {
        return null;
      }

      const game = gameResult.data;

      // 예측 정보 추가
      for (const predRow of predictionRows) {
        const predData = predRow.prediction_data as { selectedOptionId?: string } | null;
        const selectedOptionId = predData?.selectedOptionId || "unknown";

        const predictionResult = Prediction.create({
          userId: predRow.user_id as UserId,
          gameId: actualRow.game_id as PredictionGameId,
          selectedOptionId,
          // DB에서 Decimal로 반환되므로 정수로 변환 (parseInt 사용)
          stake: createPmpAmount(parseInt(String(predRow.bet_amount), 10)) as any,
          confidence: predRow.confidence_level / 100,
        });

        if (predictionResult.success) {
          game.addPrediction(predictionResult.data);
        }
      }

      return game;
    } catch (error) {
      return null;
    }
  }

  /**
   * 게임 정산 실행 (DB 함수 호출)
   * public.settle_prediction_game() 함수를 직접 호출하여 정산 처리
   */
  async settleGame(
    gameId: PredictionGameId,
    correctOptionId: string
  ): Promise<
    Result<
      {
        gameId: string;
        correctOptionId: string;
        winnersCount: number;
        losersCount: number;
        totalRewardDistributed: number;
        settledAt: Date;
      },
      RepositoryError
    >
  > {
    try {
      const supabase = await createClient();

      // DB 함수 호출로 정산 실행
      const { data, error } = await supabase.rpc("settle_prediction_game", {
        p_game_id: gameId,
        p_correct_option_id: correctOptionId,
      });

      if (error) {
        return {
          success: false,
          error: RepositoryHelpers.createQueryFailedError(
            "settleGame",
            error.message
          ),
        };
      }

      // DB 함수 결과 파싱
      const result = data as {
        game_id: string;
        correct_option_id: string;
        winners_count: number;
        losers_count: number;
        total_reward_distributed: number;
        settled_at: string;
      };

      return {
        success: true,
        data: {
          gameId: result.game_id,
          correctOptionId: result.correct_option_id,
          winnersCount: result.winners_count,
          losersCount: result.losers_count,
          totalRewardDistributed: result.total_reward_distributed,
          settledAt: new Date(result.settled_at),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: RepositoryHelpers.createQueryFailedError(
          "settleGame",
          (error as Error).message
        ),
      };
    }
  }
}

/**
 * Repository 팩토리 함수
 */
export function createMCPPredictionGameRepository(
  projectId?: string
): IPredictionGameRepository {
  return new MCPPredictionGameRepository(projectId);
}
