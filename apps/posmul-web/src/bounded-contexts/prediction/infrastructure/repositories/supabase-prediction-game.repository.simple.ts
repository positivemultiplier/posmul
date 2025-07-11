/**
 * Supabase Prediction Game Repository Implementation (Simplified)
 */

import {
  IPredictionGameRepository,
  RepositoryError,
} from "../../domain/repositories/prediction-game.repository";
import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { PredictionGameId, UserId, Result } from "@posmul/auth-economy-sdk";
import { GameStatus } from "../../domain/value-objects/game-status";

export class SupabasePredictionGameRepository
  implements IPredictionGameRepository
{
  constructor(private readonly projectId: string) {}

  // IPredictionGameRepository 인터페이스 구현
  async save(game: PredictionGame): Promise<Result<void, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findByStatus(
    status: GameStatus,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findByCreator(
    creatorId: UserId,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findByParticipant(
    userId: UserId,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async search(
    filters: any,
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findActiveGames(
    pagination?: any
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findPendingSettlement(
    limit?: number
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async exists(
    id: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async findMany(
    options: any
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async countByFilters(filters: any): Promise<Result<number, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async getStatistics(
    id: PredictionGameId
  ): Promise<Result<any, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }

  async bulkUpdate(
    games: PredictionGame[]
  ): Promise<Result<number, RepositoryError>> {
    return {
      success: false,
      error: new RepositoryError("Not implemented", "NOT_IMPLEMENTED"),
    };
  }
}
