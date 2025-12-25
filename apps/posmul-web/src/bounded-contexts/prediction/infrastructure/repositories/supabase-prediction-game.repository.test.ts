/**
 * Supabase Prediction Game Repository Test
 * Infrastructure 레이어 모킹 테스트
 */
import { PredictionGameId, UserId, isFailure } from "@posmul/auth-economy-sdk";

import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { GameStatus } from "../../domain/value-objects/prediction-types";
import { RepositoryError } from "../../domain/repositories/prediction-game.repository";
import { SupabasePredictionGameRepository } from "./supabase-prediction-game.repository";

const mockDelegate = {
  save: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  findByStatus: jest.fn(),
  findByCreator: jest.fn(),
  findByParticipant: jest.fn(),
  search: jest.fn(),
  findActiveGames: jest.fn(),
  findPendingSettlement: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  findMany: jest.fn(),
  countByFilters: jest.fn(),
  getStatistics: jest.fn(),
  saveWithVersion: jest.fn(),
  bulkUpdate: jest.fn(),
  settleGame: jest.fn(),
} as const;

jest.mock("./mcp-prediction-game.repository", () => ({
  MCPPredictionGameRepository: jest.fn().mockImplementation(() => mockDelegate),
}));

describe("SupabasePredictionGameRepository", () => {
  let repository: SupabasePredictionGameRepository;

  beforeEach(() => {
    repository = new SupabasePredictionGameRepository("test-project-id");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("내부 delegate(MCP)로 save를 위임한다", async () => {
      // Given
      const mockPredictionGame = {
        id: "game-123" as PredictionGameId,
        creatorId: "user-123" as UserId,
        title: "테스트 예측 게임",
        description: "테스트용 예측 게임입니다",
      } as unknown as PredictionGame;

      mockDelegate.save.mockResolvedValueOnce({
        success: false,
        error: new RepositoryError("save failed", "SAVE_FAILED"),
      });

      // When
      const result = await repository.save(mockPredictionGame);

      // Then
      expect(mockDelegate.save).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error.code).toBe("SAVE_FAILED");
      }
    });
  });

  describe("findById", () => {
    it("내부 delegate(MCP)로 findById를 위임한다", async () => {
      // Given
      const gameId = "game-123" as PredictionGameId;

      mockDelegate.findById.mockResolvedValueOnce({
        success: true,
        data: null,
      });

      // When
      const result = await repository.findById(gameId);

      // Then
      expect(mockDelegate.findById).toHaveBeenCalledTimes(1);
      expect(mockDelegate.findById).toHaveBeenCalledWith(gameId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("findByStatus", () => {
    it("내부 delegate(MCP)로 findByStatus를 위임한다", async () => {
      // Given
      const status = GameStatus.ACTIVE;

      mockDelegate.findByStatus.mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      // When
      const result = await repository.findByStatus(status);

      // Then
      expect(mockDelegate.findByStatus).toHaveBeenCalledTimes(1);
      expect(mockDelegate.findByStatus).toHaveBeenCalledWith(status, undefined);
      expect(result.success).toBe(true);
    });
  });

});
