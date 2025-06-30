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

import { SupabaseProjectService } from "@posmul/shared-auth";
import {
  PMP,
  PredictionGameId,
  PredictionId,
  UserId, isFailure } from "@posmul/shared-types";
import {
  Result,
  Timestamps,
  failure,
  success,
} from "@posmul/shared-types";
import type { Database } from "../../../bounded-contexts/prediction/types/supabase-prediction";
import {
  GameConfiguration,
  Prediction,
  PredictionGame,
  PredictionType,
} from "../../domain/entities/prediction-game.aggregate";
import {
  IPredictionGameRepository,
  RepositoryError,
} from "../../domain/repositories/prediction-game.repository";
import { GameStatus as DomainGameStatus } from "../../domain/value-objects/game-status";

// @ts-ignore
declare const mcp_supabase_execute_sql: (params: {
  project_id: string;
  query: string;
}) => Promise<{ data: any[] | null; error: any | null }>;

type PredictionGameRow =
  Database["prediction"]["Tables"]["prediction_games"]["Row"];
type PredictionRow = Database["prediction"]["Tables"]["predictions"]["Row"];

export class SupabasePredictionGameRepository
  implements IPredictionGameRepository
{
  private readonly projectId: string;

  constructor() {
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }

  private mapToDomain(
    row: PredictionGameRow,
    predictions: Map<PredictionId, Prediction>
  ): Result<PredictionGame, RepositoryError> {
    const gameStatus = this.mapStringToGameStatus(row.status);
    if (!gameStatus.success) return gameStatus;

    const predictionType = this.mapStringToPredictionType(row.prediction_type);
    if (!predictionType.success) return predictionType;

    const configuration: GameConfiguration = {
      title: row.title,
      description: row.description ?? "",
      predictionType: predictionType.data,
      options: row.game_options as any,
      startTime: new Date(row.registration_start),
      endTime: new Date(row.registration_end),
      settlementTime: new Date(row.settlement_date),
      minimumStake: (row.min_bet_amount ?? 0) as PMP,
      maximumStake: (row.max_bet_amount ?? 0) as PMP,
    };

    const timestamps: Timestamps = {
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    try {
      const game = PredictionGame.fromPersistence({
        id: row.game_id as PredictionGameId,
        creatorId: row.creator_id as UserId,
        configuration: configuration,
        status: gameStatus.data,
        predictions: predictions,
        timestamps: timestamps,
      });
      return success(game);
    } catch (e) {
      return failure(
        new RepositoryError(
          "Failed to map to domain",
          "MAPPING_ERROR",
          e as Error
        )
      );
    }
  }

  private escapeSql(str: string | null | undefined): string {
    if (str === null || str === undefined) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
  }

  async save(game: PredictionGame): Promise<Result<void, RepositoryError>> {
    const config = game.configuration;
    const optionsJson = JSON.stringify(config.options).replace(/'/g, "''");

    const query = `
      INSERT INTO public.prediction_games (
        game_id, creator_id, title, description, status, prediction_type, game_options, 
        registration_start, registration_end, settlement_date, min_bet_amount, max_bet_amount
      ) VALUES (
        '${game.id}', '${game.creatorId}', ${this.escapeSql(
      config.title
    )}, ${this.escapeSql(config.description)}, 
        '${game.status.toString()}', '${config.predictionType.toString()}', '${optionsJson}'::jsonb,
        '${config.startTime.toISOString()}', '${config.endTime.toISOString()}', '${config.settlementTime.toISOString()}',
        ${config.minimumStake}, ${config.maximumStake}
      )
      ON CONFLICT (game_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        prediction_type = EXCLUDED.prediction_type,
        game_options = EXCLUDED.game_options,
        registration_start = EXCLUDED.registration_start,
        registration_end = EXCLUDED.registration_end,
        settlement_date = EXCLUDED.settlement_date,
        min_bet_amount = EXCLUDED.min_bet_amount,
        max_bet_amount = EXCLUDED.max_bet_amount,
        updated_at = NOW();
    `;

    try {
      const { error } = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });
      if (error)
        return failure(
          new RepositoryError(
            "Failed to save prediction game",
            "SAVE_ERROR",
            error as Error
          )
        );
      return success(undefined);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to save prediction game",
          "SAVE_ERROR",
          error as Error
        )
      );
    }
  }

  async findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>> {
    const gameQuery = `SELECT * FROM public.prediction_games WHERE game_id = '${id}';`;

    try {
      const gameResult = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: gameQuery,
      });

      if (gameResult.error)
        return failure(
          new RepositoryError(
            "Failed to find prediction game by ID",
            gameResult.error
          )
        );

      const rows = gameResult.data as PredictionGameRow[];
      if (!rows || rows.length === 0) return success(null);

      const predictions = new Map<PredictionId, Prediction>();

      return this.mapToDomain(rows[0], predictions);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find prediction game by ID",
          "FIND_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🌊 MoneyWave 연동 - 여러 ID로 게임 조회 (경제 시스템 연동)
   */
  async findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    try {
      const idsArray = ids.map((id) => `'${id}'`).join(",");
      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count,
               SUM(p.pmp_amount) as total_pmp_staked,
               AVG(p.confidence_level) as avg_confidence
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        WHERE pg.game_id IN (${idsArray})
        GROUP BY pg.game_id
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find games by IDs",
            "FIND_BY_IDS_ERROR",
            result.error
          )
        );
      }

      const gameMap = new Map<PredictionGameId, PredictionGame>();

      for (const row of result.data || []) {
        const gameResult = this.mapToDomain(row, new Map());
        if (gameResult.success) {
          gameMap.set(row.game_id as PredictionGameId, gameResult.data);
        }
      }

      return success(gameMap);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find games by IDs",
          "FIND_BY_IDS_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🎯 MoneyWave1 연동 - 상태별 게임 조회 (EBIT 기반 PMC 분배 대상)
   */
  async findByStatus(
    status: DomainGameStatus,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    try {
      // Domain GameStatus를 DB enum으로 변환
      const dbStatus = this.mapDomainStatusToDb(status);

      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count,
               SUM(p.pmp_amount) as total_pmp_staked,
               COALESCE(mw.allocated_pmc, 0) as money_wave_pmc
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        LEFT JOIN money_wave_allocations mw ON pg.game_id = mw.game_id
        WHERE pg.status = '${dbStatus}'
        GROUP BY pg.game_id, mw.allocated_pmc
        ORDER BY pg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find games by status",
            "FIND_BY_STATUS_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);

      return success({
        items: games,
        totalCount: games.length,
        hasMore: games.length === limit,
      });
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find games by status",
          "FIND_BY_STATUS_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 📈 PMP 획득 이력 연동 - 생성자별 게임 조회 (Major League 연동)
   */
  async findByCreator(
    creatorId: UserId,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    try {
      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count,
               SUM(p.pmp_amount) as total_pmp_generated,
               u.pmp_balance as creator_pmp_balance
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        LEFT JOIN pmp_accounts u ON pg.creator_id = u.user_id
        WHERE pg.creator_id = '${creatorId}'
        GROUP BY pg.game_id, u.pmp_balance
        ORDER BY pg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find games by creator",
            "FIND_BY_CREATOR_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);

      return success({
        items: games,
        totalCount: games.length,
        hasMore: games.length === limit,
      });
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find games by creator",
          "FIND_BY_CREATOR_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 💎 PMC 보상 연동 - 참여자별 게임 조회 (Local League/Cloud Funding 연동)
   */
  async findByParticipant(
    userId: UserId,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    try {
      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const query = `
        SELECT DISTINCT pg.*, 
               p.pmp_amount as user_pmp_staked,
               p.confidence_level as user_confidence,
               p.predicted_outcome,
               p.is_correct as user_prediction_correct,
               u.pmc_balance as user_pmc_balance
        FROM prediction_games pg
        JOIN predictions p ON pg.game_id = p.game_id
        LEFT JOIN pmc_accounts u ON p.user_id = u.user_id
        WHERE p.user_id = '${userId}'
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find games by participant",
            "FIND_BY_PARTICIPANT_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);

      return success({
        items: games,
        totalCount: games.length,
        hasMore: games.length === limit,
      });
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find games by participant",
          "FIND_BY_PARTICIPANT_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🔍 고급 검색 (MoneyWave 연동 필터 포함)
   */
  async search(
    filters: any,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    try {
      // 기본 쿼리 구성
      let whereConditions = [];

      if (filters.status) {
        whereConditions.push(
          `pg.status = '${this.mapDomainStatusToDb(filters.status)}'`
        );
      }

      if (filters.minPmpStaked) {
        whereConditions.push(`total_pmp_staked >= ${filters.minPmpStaked}`);
      }

      if (filters.hasMoneyWave) {
        whereConditions.push(`mw.allocated_pmc > 0`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";
      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count,
               SUM(p.pmp_amount) as total_pmp_staked,
               COALESCE(mw.allocated_pmc, 0) as money_wave_pmc
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        LEFT JOIN money_wave_allocations mw ON pg.game_id = mw.game_id
        ${whereClause}
        GROUP BY pg.game_id, mw.allocated_pmc
        ORDER BY pg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to search games",
            "SEARCH_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);

      return success({
        items: games,
        totalCount: games.length,
        hasMore: games.length === limit,
      });
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to search games",
          "SEARCH_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🎮 활성 게임 조회 (MoneyWave1 EBIT 분배 대상)
   */
  async findActiveGames(
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return this.findByStatus(DomainGameStatus.ACTIVE, pagination);
  }

  /**
   * ⚖️ 정산 대기 게임 조회 (MoneyWave2 재분배 대상)
   */
  async findPendingSettlement(
    limit?: number
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count,
               SUM(p.pmp_amount) as total_pmp_staked
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        WHERE pg.status = 'CLOSED' 
          AND pg.settlement_date <= NOW()
        GROUP BY pg.game_id
        ORDER BY pg.settlement_date ASC
        LIMIT ${limit || 50}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find pending settlement games",
            "FIND_PENDING_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);
      return success(games);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find pending settlement games",
          "FIND_PENDING_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * ✅ 게임 존재 여부 확인
   */
  async exists(
    id: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const query = `SELECT 1 FROM prediction_games WHERE game_id = '${id}' LIMIT 1`;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to check game existence",
            "EXISTS_ERROR",
            result.error
          )
        );
      }

      return success((result.data?.length || 0) > 0);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to check game existence",
          "EXISTS_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🗑️ 게임 삭제 (소프트 삭제)
   */
  async delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    try {
      const query = `
        UPDATE prediction_games 
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE game_id = '${id}'
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to delete game",
            "DELETE_ERROR",
            result.error
          )
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to delete game",
          "DELETE_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 📋 다양한 옵션으로 게임 조회
   */
  async findMany(
    options: any
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      let whereConditions = [];

      if (options.filters) {
        if (options.filters.status) {
          whereConditions.push(
            `pg.status = '${this.mapDomainStatusToDb(options.filters.status)}'`
          );
        }
        if (options.filters.creatorId) {
          whereConditions.push(
            `pg.creator_id = '${options.filters.creatorId}'`
          );
        }
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";
      const limit = options.pagination?.limit || 20;
      const offset = options.pagination?.offset || 0;
      const orderBy = options.sorting
        ? `ORDER BY ${
            options.sorting.field
          } ${options.sorting.order.toUpperCase()}`
        : "ORDER BY created_at DESC";

      const query = `
        SELECT pg.*, 
               COUNT(p.id) as participant_count
        FROM prediction_games pg
        LEFT JOIN predictions p ON pg.game_id = p.game_id
        ${whereClause}
        GROUP BY pg.game_id
        ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to find games",
            "FIND_MANY_ERROR",
            result.error
          )
        );
      }

      const games = (result.data || [])
        .map((row) => this.mapRowToDomain(row))
        .filter((r) => r.success)
        .map((r) => r.data);
      return success(games);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to find games",
          "FIND_MANY_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🔢 필터 조건에 해당하는 게임 수 조회
   */
  async countByFilters(filters: any): Promise<Result<number, RepositoryError>> {
    try {
      let whereConditions = [];

      if (filters.status) {
        whereConditions.push(
          `status = '${this.mapDomainStatusToDb(filters.status)}'`
        );
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const query = `SELECT COUNT(*) as count FROM prediction_games ${whereClause}`;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to count games",
            "COUNT_ERROR",
            result.error
          )
        );
      }

      return success(result.data?.[0]?.count || 0);
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to count games",
          "COUNT_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 📊 게임 통계 조회 (MoneyWave 분석용)
   */
  async getStatistics(filters?: any): Promise<Result<any, RepositoryError>> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_games,
          COUNT(CASE WHEN status = 'SETTLED' THEN 1 END) as settled_games,
          SUM(CASE WHEN mw.allocated_pmc IS NOT NULL THEN mw.allocated_pmc ELSE 0 END) as total_pmc_allocated,
          AVG(participant_counts.count) as avg_participants
        FROM prediction_games pg
        LEFT JOIN money_wave_allocations mw ON pg.game_id = mw.game_id
        LEFT JOIN (
          SELECT game_id, COUNT(*) as count 
          FROM predictions 
          GROUP BY game_id
        ) participant_counts ON pg.game_id = participant_counts.game_id
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (result.error) {
        return failure(
          new RepositoryError(
            "Failed to get statistics",
            "STATISTICS_ERROR",
            result.error
          )
        );
      }

      return success(result.data?.[0] || {});
    } catch (error) {
      return failure(
        new RepositoryError(
          "Failed to get statistics",
          "STATISTICS_ERROR",
          error as Error
        )
      );
    }
  }

  /**
   * 🔄 버전 관리와 함께 게임 저장 (동시성 제어)
   */
  async saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>> {
    // 기본 save 메서드 사용 후 새 버전 반환
    const saveResult = await this.save(game);
    if (!saveResult.success) {
      if (isFailure(saveResult)) {
  if (isFailure(saveResult)) {
  return failure(saveResult.error);
} else {
  return failure(new Error("Unknown error"));
};
} else {
  return failure(new Error("Unknown error"));
}
    }
    return success(version + 1);
  }

  /**
   * 📦 게임 일괄 업데이트 (MoneyWave 배치 처리용)
   */
  async bulkUpdate(
    games: PredictionGame[]
  ): Promise<Result<number, RepositoryError>> {
    try {
      let updatedCount = 0;

      for (const game of games) {
        const result = await this.save(game);
        if (result.success) {
          updatedCount++;
        }
      }

      return success(updatedCount);
    } catch (error) {
      return failure(
        new RepositoryError("Failed to bulk update games", "BULK_UPDATE_ERROR")
      );
    }
  }

  private mapRowToDomain(
    row: PredictionGameRow
  ): Result<PredictionGame, RepositoryError> {
    return this.mapToDomain(row, new Map<PredictionId, Prediction>());
  }

  private mapDomainStatusToDb(status: DomainGameStatus): string {
    return status.toString();
  }

  private mapStringToGameStatus(
    status: string
  ): Result<DomainGameStatus, RepositoryError> {
    const result = DomainGameStatus.create(status);
    if (!result.success) {
      return {
        success: false,
        error: new RepositoryError(
          `Invalid game status: ${status}`,
          "INVALID_GAME_STATUS"
        ),
      };
    }
    return result;
  }

  private mapStringToPredictionType(
    type: string
  ): Result<PredictionType, RepositoryError> {
    // Simple string to enum conversion
    switch (type.toLowerCase()) {
      case "binary":
        return { success: true, data: PredictionType.BINARY };
      case "wdl":
        return { success: true, data: PredictionType.WIN_DRAW_LOSE };
      case "ranking":
        return { success: true, data: PredictionType.RANKING };
      default:
        return {
          success: false,
          error: new RepositoryError(
            `Invalid prediction type: ${type}`,
            "INVALID_PREDICTION_TYPE"
          ),
        };
    }
  }
}
