/**
 * Supabase Prediction Game Repository Implementation
 * 
 * 예측 게임 데이터를 위한 Supabase 기반 Repository 구현
 * Mock 데이터와 향후 실제 Supabase 연동 모두 지원
 */

import {
  IPredictionGameRepository,
  RepositoryError,
  PaginatedResult,
  PaginationRequest,
  GameSearchFilters,
} from "../../domain/repositories/prediction-game.repository";
import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { PredictionGameId, UserId, Result, createPmpAmount } from "@posmul/auth-economy-sdk";
import { GameStatus } from "../../domain/value-objects/game-status";
import { PredictionType, GameStatus as GameStatusType } from "../../domain/value-objects/prediction-types";

/**
 * Mock 게임 데이터 - 개발/테스트용
 * 실제 배포 시 Supabase에서 데이터 조회
 */
const mockGamesData = [
  {
    id: "game-1",
    title: "2024년 한국 GDP 성장률 예측",
    description: "올해 한국의 실질 GDP 성장률이 몇 %가 될지 예측해보세요. 정확한 예측으로 PmcAmount를 획득하고 경제 전문성을 키워보세요!",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "opt-1", label: "2.0% 미만" },
      { id: "opt-2", label: "2.0% - 2.5%" },
      { id: "opt-3", label: "2.5% - 3.0%" },
      { id: "opt-4", label: "3.0% 초과" },
    ],
    startTime: new Date("2024-01-01"),
    endTime: new Date("2024-12-20"),
    settlementTime: new Date("2024-12-31"),
    minimumStake: 100,
    maximumStake: 5000,
    maxParticipants: 1000,
    status: "ACTIVE" as GameStatusType,
    creatorId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "game-2",
    title: "다음 대선 투표율 예측",
    description: "2027년 대통령 선거의 투표율을 예측해보세요. 민주주의 참여도를 예측하며 시민 의식을 키워보세요!",
    predictionType: PredictionType.BINARY,
    options: [
      { id: "opt-1", label: "70% 이상" },
      { id: "opt-2", label: "70% 미만" },
    ],
    startTime: new Date("2024-01-15"),
    endTime: new Date("2027-03-01"),
    settlementTime: new Date("2027-03-10"),
    minimumStake: 50,
    maximumStake: 2000,
    maxParticipants: null,
    status: "ACTIVE" as GameStatusType,
    creatorId: "user-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "game-3",
    title: "2025 K리그 우승팀 예측",
    description: "2025년 K리그 1 우승팀을 예측해보세요. 축구 팬들을 위한 스포츠 예측 게임입니다!",
    predictionType: PredictionType.RANKING,
    options: [
      { id: "opt-1", label: "울산 현대" },
      { id: "opt-2", label: "전북 현대" },
      { id: "opt-3", label: "포항 스틸러스" },
      { id: "opt-4", label: "FC 서울" },
      { id: "opt-5", label: "기타" },
    ],
    startTime: new Date("2025-01-01"),
    endTime: new Date("2025-11-30"),
    settlementTime: new Date("2025-12-15"),
    minimumStake: 100,
    maximumStake: 3000,
    maxParticipants: 500,
    status: "ACTIVE" as GameStatusType,
    creatorId: "user-2",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

/**
 * Mock 데이터를 PredictionGame 도메인 객체로 변환
 */
function createPredictionGameFromMock(data: typeof mockGamesData[0]): PredictionGame | null {
  const result = PredictionGame.create({
    title: data.title,
    description: data.description,
    predictionType: data.predictionType,
    options: data.options,
    startTime: data.startTime,
    endTime: data.endTime,
    settlementTime: data.settlementTime,
    creatorId: data.creatorId as UserId,
    minimumStake: createPmpAmount(data.minimumStake),
    maximumStake: createPmpAmount(data.maximumStake),
    maxParticipants: data.maxParticipants ?? undefined,
  });
  
  return result.success ? result.data : null;
}

export class SupabasePredictionGameRepository
  implements IPredictionGameRepository
{
  constructor(private readonly projectId: string) {}

  async save(game: PredictionGame): Promise<Result<void, RepositoryError>> {
    // TODO: 실제 Supabase에 저장하는 로직 구현
    console.log("[Repository] Saving game:", game.id);
    return { success: true, data: undefined };
  }

  async findById(
    id: PredictionGameId
  ): Promise<Result<PredictionGame | null, RepositoryError>> {
    try {
      const mockData = mockGamesData.find(g => g.id === id);
      if (!mockData) {
        return { success: true, data: null };
      }
      
      const game = createPredictionGameFromMock(mockData);
      return { success: true, data: game };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find game by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async findByIds(
    ids: PredictionGameId[]
  ): Promise<Result<Map<PredictionGameId, PredictionGame>, RepositoryError>> {
    try {
      const resultMap = new Map<PredictionGameId, PredictionGame>();
      
      for (const id of ids) {
        const mockData = mockGamesData.find(g => g.id === id);
        if (mockData) {
          const game = createPredictionGameFromMock(mockData);
          if (game) {
            resultMap.set(id, game);
          }
        }
      }
      
      return { success: true, data: resultMap };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find games by IDs: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async findByStatus(
    status: GameStatus,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      // GameStatus class의 toString() 메서드로 문자열 비교
      const statusString = status.toString();
      const filteredData = mockGamesData.filter(g => g.status === statusString);
      const games = filteredData
        .map(createPredictionGameFromMock)
        .filter((g): g is PredictionGame => g !== null);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedGames = games.slice(startIndex, startIndex + limit);
      
      return {
        success: true,
        data: {
          items: paginatedGames,
          totalCount: games.length,
          totalPages: Math.ceil(games.length / limit),
          currentPage: page,
          hasNext: startIndex + limit < games.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find games by status: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async findByCreator(
    creatorId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      const filteredData = mockGamesData.filter(g => g.creatorId === creatorId);
      const games = filteredData
        .map(createPredictionGameFromMock)
        .filter((g): g is PredictionGame => g !== null);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedGames = games.slice(startIndex, startIndex + limit);
      
      return {
        success: true,
        data: {
          items: paginatedGames,
          totalCount: games.length,
          totalPages: Math.ceil(games.length / limit),
          currentPage: page,
          hasNext: startIndex + limit < games.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find games by creator: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async findByParticipant(
    userId: UserId,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    // TODO: 실제 참여 데이터 기반으로 필터링
    return this.findActiveGames(pagination);
  }

  async search(
    filters: GameSearchFilters,
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    try {
      let filteredData = [...mockGamesData];
      
      if (filters.status) {
        const statusString = filters.status.toString();
        filteredData = filteredData.filter(g => g.status === statusString);
      }
      if (filters.creatorId) {
        filteredData = filteredData.filter(g => g.creatorId === filters.creatorId);
      }
      if (filters.predictionType) {
        // PredictionType enum to string value 비교
        const typeString = filters.predictionType;
        filteredData = filteredData.filter(g => {
          // PredictionType enum의 값은 문자열이므로 직접 비교
          return g.predictionType === PredictionType.BINARY && typeString === "binary" ||
                 g.predictionType === PredictionType.WIN_DRAW_LOSE && typeString === "wdl" ||
                 g.predictionType === PredictionType.RANKING && typeString === "ranking";
        });
      }
      if (filters.title) {
        filteredData = filteredData.filter(g => 
          g.title.toLowerCase().includes(filters.title!.toLowerCase())
        );
      }
      
      const games = filteredData
        .map(createPredictionGameFromMock)
        .filter((g): g is PredictionGame => g !== null);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedGames = games.slice(startIndex, startIndex + limit);
      
      return {
        success: true,
        data: {
          items: paginatedGames,
          totalCount: games.length,
          totalPages: Math.ceil(games.length / limit),
          currentPage: page,
          hasNext: startIndex + limit < games.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to search games: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async findActiveGames(
    pagination?: PaginationRequest
  ): Promise<Result<PaginatedResult<PredictionGame>, RepositoryError>> {
    return this.findByStatus(GameStatus.ACTIVE, pagination);
  }

  async findPendingSettlement(
    limit?: number
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      const now = new Date();
      const filteredData = mockGamesData.filter(
        g => g.status === "ACTIVE" && g.endTime < now
      );
      const games = filteredData
        .slice(0, limit || 10)
        .map(createPredictionGameFromMock)
        .filter((g): g is PredictionGame => g !== null);
      
      return { success: true, data: games };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find pending settlement games: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async exists(
    id: PredictionGameId
  ): Promise<Result<boolean, RepositoryError>> {
    try {
      const exists = mockGamesData.some(g => g.id === id);
      return { success: true, data: exists };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to check game existence: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async delete(id: PredictionGameId): Promise<Result<void, RepositoryError>> {
    // TODO: 실제 Supabase에서 삭제 (소프트 삭제 권장)
    console.log("[Repository] Deleting game:", id);
    return { success: true, data: undefined };
  }

  async findMany(
    options: {
      filters?: any;
      pagination?: { limit: number; offset: number };
      sorting?: { field: string; order: "asc" | "desc" };
    }
  ): Promise<Result<PredictionGame[], RepositoryError>> {
    try {
      let filteredData = [...mockGamesData];
      
      // 필터 적용
      if (options.filters?.status) {
        filteredData = filteredData.filter(g => g.status === options.filters.status);
      }
      if (options.filters?.category) {
        // 카테고리 필터링 (현재 mock 데이터에는 카테고리가 없으므로 생략)
      }
      
      // 정렬 적용
      if (options.sorting) {
        const { field, order } = options.sorting;
        filteredData.sort((a, b) => {
          const aVal = (a as any)[field] || a.createdAt;
          const bVal = (b as any)[field] || b.createdAt;
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return order === "asc" ? comparison : -comparison;
        });
      }
      
      // 페이지네이션 적용
      const offset = options.pagination?.offset || 0;
      const limit = options.pagination?.limit || 20;
      const paginatedData = filteredData.slice(offset, offset + limit);
      
      const games = paginatedData
        .map(createPredictionGameFromMock)
        .filter((g): g is PredictionGame => g !== null);
      
      return { success: true, data: games };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to find games: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async countByFilters(filters: any): Promise<Result<number, RepositoryError>> {
    try {
      let filteredData = [...mockGamesData];
      
      if (filters?.status) {
        filteredData = filteredData.filter(g => g.status === filters.status);
      }
      if (filters?.category) {
        // 카테고리 필터링 (현재 mock 데이터에는 카테고리가 없으므로 생략)
      }
      
      return { success: true, data: filteredData.length };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to count games: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async getStatistics(
    id: PredictionGameId
  ): Promise<Result<{
    totalParticipants: number;
    totalStake: number;
    averageConfidence: number;
    statusDistribution: Record<string, number>;
  }, RepositoryError>> {
    try {
      const mockData = mockGamesData.find(g => g.id === id);
      if (!mockData) {
        return {
          success: false,
          error: new RepositoryError(`Game not found: ${id}`, "NOT_FOUND"),
        };
      }
      
      // Mock 통계 데이터
      return {
        success: true,
        data: {
          totalParticipants: Math.floor(Math.random() * 200) + 50,
          totalStake: Math.floor(Math.random() * 500000) + 100000,
          averageConfidence: 0.65 + Math.random() * 0.2,
          statusDistribution: {
            pending: 10,
            completed: 85,
            cancelled: 5,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new RepositoryError(
          `Failed to get game statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
          "QUERY_FAILED"
        ),
      };
    }
  }

  async saveWithVersion(
    game: PredictionGame,
    version: number
  ): Promise<Result<number, RepositoryError>> {
    // TODO: 낙관적 잠금 구현
    console.log("[Repository] Saving game with version:", game.id, version);
    return { success: true, data: version + 1 };
  }

  async bulkUpdate(
    games: PredictionGame[]
  ): Promise<Result<number, RepositoryError>> {
    // TODO: 벌크 업데이트 구현
    console.log("[Repository] Bulk updating games:", games.length);
    return { success: true, data: games.length };
  }
}
