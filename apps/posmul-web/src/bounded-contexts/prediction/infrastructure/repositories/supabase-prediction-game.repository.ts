/**
 * Supabase Prediction Game Repository
 *
 * 기존 구현은 스텁(Not implemented)이었고, 실제 동작하는 MCPPredictionGameRepository가 이미 존재합니다.
 * - API Routes에서 여전히 SupabasePredictionGameRepository를 사용하고 있어 호환성을 위해 클래스는 유지
 * - 내부 구현은 MCPPredictionGameRepository로 위임하여 단일화
 */
import { PredictionGameId, Result, UserId } from "@posmul/auth-economy-sdk";

import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import {
  GameSearchFilters,
  IPredictionGameRepository,
  PaginatedResult,
  PaginationRequest,
  PredictionGameFindManyFilters,
  RepositoryError,
} from "../../domain/repositories/prediction-game.repository";
import { GameStatus } from "../../domain/value-objects/prediction-types";

import { MCPPredictionGameRepository } from "./mcp-prediction-game.repository";

export class SupabasePredictionGameRepository implements IPredictionGameRepository {
  private readonly delegate: IPredictionGameRepository;

  constructor(private readonly projectId: string) {
    this.delegate = new MCPPredictionGameRepository(projectId);
  }

  save(game: PredictionGame, options?: { skipGameUpdate?: boolean }): Promise<Result<void, RepositoryError>> {
    return this.delegate.save(game, options);
  }

  findById(id: PredictionGameId): Promise<Result<PredictionGame | null, RepositoryError>> {
    return this.delegate.findById(id);
  }

  findByIds(ids: PredictionGameId[]): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    return this.delegate.findByIds(ids);
  }

  findByStatus(status: GameStatus, pagination?: PaginationRequest): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.delegate.findByStatus(status, pagination);
  }

  findByCreator(creatorId: UserId, pagination?: PaginationRequest): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.delegate.findByCreator(creatorId, pagination);
  }

  findByParticipant(userId: UserId, pagination?: PaginationRequest): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.delegate.findByParticipant(userId, pagination);
  }

  search(filters: GameSearchFilters, pagination?: PaginationRequest): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.delegate.search(filters, pagination);
  }

  findActiveGames(pagination?: PaginationRequest): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.delegate.findActiveGames(pagination);
  }

  findPendingSettlement(limit?: number): Promise<Result<PredictionGame[], RepositoryError>> {
    return this.delegate.findPendingSettlement(limit);
  }

  exists(id: PredictionGameId): Promise<Result<boolean, RepositoryError>> {
    return this.delegate.exists(id);
  }

  delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    return this.delegate.delete(id);
  }

  findMany(options: {
    filters?: PredictionGameFindManyFilters;
    pagination?: { limit: number; offset: number };
    sorting?: { field: string; order: "asc" | "desc" };
  }): Promise<Result<PredictionGame[], RepositoryError>> {
    return this.delegate.findMany(options);
  }

  countByFilters(filters: PredictionGameFindManyFilters): Promise<Result<number, RepositoryError>> {
    return this.delegate.countByFilters(filters);
  }

  getStatistics(id: PredictionGameId): ReturnType<IPredictionGameRepository["getStatistics"]> {
    return this.delegate.getStatistics(id);
  }

  saveWithVersion(game: PredictionGame, version: number): Promise<Result<number, RepositoryError>> {
    return this.delegate.saveWithVersion(game, version);
  }

  bulkUpdate(games: PredictionGame[]): Promise<Result<number, RepositoryError>> {
    return this.delegate.bulkUpdate(games);
  }

  settleGame(gameId: PredictionGameId, correctOptionId: string): ReturnType<IPredictionGameRepository["settleGame"]> {
    return this.delegate.settleGame(gameId, correctOptionId);
  }
}
