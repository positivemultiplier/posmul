/**
 * Supabase Prediction Game Repository Test
 * Infrastructure 레이어 모킹 테스트
 */
import { PredictionGameId, UserId } from "@posmul/auth-economy-sdk";

import { PredictionGame } from "../../domain/entities/prediction-game.aggregate";
import { GameStatus } from "../../domain/value-objects/game-status";
import { SupabasePredictionGameRepository } from "./supabase-prediction-game.repository";

// Supabase MCP 도구들을 모킹
jest.mock("../../../../shared/mcp/supabase-tools", () => ({
  executeSQL: jest.fn(),
  applyMigration: jest.fn(),
}));

describe("SupabasePredictionGameRepository", () => {
  let repository: SupabasePredictionGameRepository;
  let mockExecuteSQL: jest.Mock;

  beforeEach(() => {
    const { executeSQL } = require("../../../../shared/mcp/supabase-tools");
    mockExecuteSQL = executeSQL as jest.Mock;

    repository = new SupabasePredictionGameRepository("test-project-id");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("현재 구현되지 않은 상태에서 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const mockPredictionGame = {
        id: "game-123" as PredictionGameId,
        creatorId: "user-123" as UserId,
        title: "테스트 예측 게임",
        description: "테스트용 예측 게임입니다",
      } as PredictionGame;

      // When
      const result = await repository.save(mockPredictionGame);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findById", () => {
    it("현재 구현되지 않은 상태에서 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const gameId = "game-123" as PredictionGameId;

      // When
      const result = await repository.findById(gameId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findByIds", () => {
    it("복수 ID 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const gameIds = ["game-123", "game-456"] as PredictionGameId[];

      // When
      const result = await repository.findByIds(gameIds);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findByStatus", () => {
    it("상태별 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const statusResult = GameStatus.create("ACTIVE");
      expect(statusResult.success).toBe(true);

      if (statusResult.success) {
        const status = statusResult.data;

        // When
        const result = await repository.findByStatus(status);

        // Then
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("NOT_IMPLEMENTED");
          expect(result.error.message).toBe("Not implemented");
        }
      }
    });
  });

  describe("findByCreator", () => {
    it("생성자별 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const creatorId = "user-123" as UserId;

      // When
      const result = await repository.findByCreator(creatorId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findByParticipant", () => {
    it("참가자별 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const userId = "user-123" as UserId;

      // When
      const result = await repository.findByParticipant(userId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("search", () => {
    it("검색 기능 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // Given
      const filters = { title: "테스트" };

      // When
      const result = await repository.search(filters);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findActiveGames", () => {
    it("활성 게임 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // When
      const result = await repository.findActiveGames();

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("findPendingSettlement", () => {
    it("정산 대기 게임 조회 시 NOT_IMPLEMENTED 에러를 반환한다", async () => {
      // When
      const result = await repository.findPendingSettlement(10);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
        expect(result.error.message).toBe("Not implemented");
      }
    });
  });

  describe("Repository Readiness", () => {
    it("레포지토리가 올바른 프로젝트 ID로 초기화된다", () => {
      // Given & When
      const repo = new SupabasePredictionGameRepository("my-project-id");

      // Then
      expect(repo).toBeInstanceOf(SupabasePredictionGameRepository);
      // 프라이빗 멤버 접근은 불가능하지만, 인스턴스가 생성되었음을 확인
    });

    it("모든 메서드가 IRepository 인터페이스를 구현한다", () => {
      // Given & When & Then
      expect(typeof repository.save).toBe("function");
      expect(typeof repository.findById).toBe("function");
      expect(typeof repository.findByIds).toBe("function");
      expect(typeof repository.findByStatus).toBe("function");
      expect(typeof repository.findByCreator).toBe("function");
      expect(typeof repository.findByParticipant).toBe("function");
      expect(typeof repository.search).toBe("function");
      expect(typeof repository.findActiveGames).toBe("function");
      expect(typeof repository.findPendingSettlement).toBe("function");
    });
  });
});
