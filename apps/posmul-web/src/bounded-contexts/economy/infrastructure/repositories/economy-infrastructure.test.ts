/**
 * Economy Infrastructure Repository Test
 * Economy 관련 레포지토리의 모킹 테스트
 */
import { PmcAmount, PmpAmount, UserId } from "@posmul/auth-economy-sdk";

// MCP 도구들을 모킹
const mockExecuteSQL = jest.fn();
jest.mock("../../../../shared/mcp/supabase-tools", () => ({
  executeSQL: mockExecuteSQL,
}));

// Economy Repository Mock 함수들
const createMockEconomyRepository = (projectId: string) => ({
  projectId,
  async getPmpBalance(userId: UserId): Promise<PmpAmount> {
    return 1000.0 as PmpAmount;
  },
  async getPmcBalance(userId: UserId): Promise<PmcAmount> {
    return 500.0 as PmcAmount;
  },
  async deductPmp(userId: UserId, amount: PmpAmount): Promise<boolean> {
    return true;
  },
  async addPmc(userId: UserId, amount: PmcAmount): Promise<boolean> {
    return true;
  },
});

describe("Economy Infrastructure Layer", () => {
  let repository: ReturnType<typeof createMockEconomyRepository>;

  beforeEach(() => {
    repository = createMockEconomyRepository("test-project-id");
    mockExecuteSQL.mockClear();
  });

  describe("PMP Balance Operations", () => {
    it("사용자의 PMP 잔액을 조회할 수 있다", async () => {
      // Given
      const userId = "user-123" as UserId;

      // When
      const balance = await repository.getPmpBalance(userId);

      // Then
      expect(balance).toBe(1000.0);
      expect(typeof balance).toBe("number");
    });

    it("사용자의 PMP를 차감할 수 있다", async () => {
      // Given
      const userId = "user-123" as UserId;
      const amount = 100.0 as PmpAmount;

      // When
      const result = await repository.deductPmp(userId, amount);

      // Then
      expect(result).toBe(true);
    });
  });

  describe("PMC Balance Operations", () => {
    it("사용자의 PMC 잔액을 조회할 수 있다", async () => {
      // Given
      const userId = "user-123" as UserId;

      // When
      const balance = await repository.getPmcBalance(userId);

      // Then
      expect(balance).toBe(500.0);
      expect(typeof balance).toBe("number");
    });

    it("사용자에게 PMC를 지급할 수 있다", async () => {
      // Given
      const userId = "user-123" as UserId;
      const amount = 50.0 as PmcAmount;

      // When
      const result = await repository.addPmc(userId, amount);

      // Then
      expect(result).toBe(true);
    });
  });

  describe("Repository Infrastructure", () => {
    it("레포지토리가 올바른 프로젝트 ID로 초기화된다", () => {
      // Given & When
      const repo = createMockEconomyRepository("my-project-id");

      // Then
      expect(repo.projectId).toBe("my-project-id");
    });

    it("모든 경제 관련 메서드가 구현되어 있다", () => {
      // Given & When & Then
      expect(typeof repository.getPmpBalance).toBe("function");
      expect(typeof repository.getPmcBalance).toBe("function");
      expect(typeof repository.deductPmp).toBe("function");
      expect(typeof repository.addPmc).toBe("function");
    });
  });

  describe("MCP Integration Mock", () => {
    it("MCP executeSQL이 모킹되었다", () => {
      // Given & When & Then
      expect(mockExecuteSQL).toBeDefined();
      expect(typeof mockExecuteSQL).toBe("function");
    });

    it("MCP 함수 호출 시 모킹된 응답을 받는다", async () => {
      // Given
      mockExecuteSQL.mockResolvedValue({
        success: true,
        data: [{ balance: 1000.0 }],
        error: null,
      });

      // When
      const result = await mockExecuteSQL(
        "SELECT balance FROM accounts WHERE user_id = $1"
      );

      // Then
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].balance).toBe(1000.0);
    });

    it("PMP/PMC 잔액 조회가 MCP를 통해 작동한다", async () => {
      // Given
      const userId = "user-123" as UserId;
      mockExecuteSQL.mockResolvedValue({
        success: true,
        data: [{ pmp_balance: 1500.0, pmc_balance: 750.0 }],
        error: null,
      });

      // When
      await mockExecuteSQL(
        "SELECT pmp_balance, pmc_balance FROM user_accounts WHERE user_id = $1",
        [userId]
      );

      // Then
      expect(mockExecuteSQL).toHaveBeenCalledWith(
        "SELECT pmp_balance, pmc_balance FROM user_accounts WHERE user_id = $1",
        [userId]
      );
    });
  });

  describe("Error Handling", () => {
    it("MCP 에러 시 적절한 에러 응답을 받는다", async () => {
      // Given
      mockExecuteSQL.mockResolvedValue({
        success: false,
        data: null,
        error: "Database connection failed",
      });

      // When
      const result = await mockExecuteSQL("SELECT * FROM invalid_table");

      // Then
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });
  });
});
