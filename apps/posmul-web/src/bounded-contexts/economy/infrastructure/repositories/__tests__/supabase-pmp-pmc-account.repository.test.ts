/**
 * Supabase PMP PMC Account Repository Tests
 *
 * Infrastructure Layer Repository 테스트
 * MCP 패턴을 사용하는 PMP/PMC 계정 관리 Repository 검증
 */
import { createDefaultMCPAdapter } from "../../../../../shared/legacy-compatibility";
import { SupabasePmpPmcAccountRepository } from "../supabase-pmp-pmc-account.repository";

// MCP Adapter 모킹
jest.mock("../../../../../shared/legacy-compatibility", () => ({
  createDefaultMCPAdapter: jest.fn(),
}));

describe("SupabasePmpPmcAccountRepository", () => {
  let repository: SupabasePmpPmcAccountRepository;
  let mockMcpAdapter: any;
  const testProjectId = "test-project-id";

  beforeEach(() => {
    mockMcpAdapter = {
      executeSQL: jest.fn(),
    };
    (
      createDefaultMCPAdapter as jest.MockedFunction<
        typeof createDefaultMCPAdapter
      >
    ).mockReturnValue(mockMcpAdapter);

    repository = new SupabasePmpPmcAccountRepository(testProjectId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByIds", () => {
    it("should successfully find accounts by user IDs", async () => {
      // Arrange
      const userIds = ["user-1", "user-2", "user-3"];
      const mockAccountData = [
        {
          user_id: "user-1",
          pmp_balance: 1000.5,
          pmc_balance: 500.25,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          user_id: "user-2",
          pmp_balance: 2000.75,
          pmc_balance: 800.4,
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: mockAccountData,
      });

      // Act
      const result = await repository.findByIds(userIds);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockAccountData);
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        "SELECT * FROM user_economic_profiles WHERE user_id IN ('user-1','user-2','user-3')"
      );
    });

    it("should return empty array when no accounts found", async () => {
      // Arrange
      const userIds = ["nonexistent-user"];
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByIds(userIds);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should handle SQL execution errors", async () => {
      // Arrange
      const userIds = ["user-1"];
      const sqlError = new Error("Database connection failed");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findByIds(userIds);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });
  });

  describe("findByUserId", () => {
    it("should successfully find account by single user ID", async () => {
      // Arrange
      const userId = "test-user-id";
      const mockAccountData = {
        user_id: userId,
        pmp_balance: 1500.75,
        pmc_balance: 600.25,
        total_pmp_earned: 2000.0,
        total_pmc_earned: 800.0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockAccountData],
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockAccountData);
      }
    });

    it("should return null when user account not found", async () => {
      // Arrange
      const userId = "nonexistent-user";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle SQL execution errors for single user query", async () => {
      // Arrange
      const userId = "test-user";
      const sqlError = new Error("Query timeout");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });
  });

  describe("createOrUpdate", () => {
    it("should successfully create or update account", async () => {
      // Arrange
      const userId = "test-user";
      const pmpBalance = 1000.5;
      const pmcBalance = 500.25;
      const mockResult = {
        data: [
          {
            user_id: userId,
            pmp_balance: pmpBalance,
            pmc_balance: pmcBalance,
          },
        ],
      };

      mockMcpAdapter.executeSQL.mockResolvedValue(mockResult);

      // Act
      const result = await repository.createOrUpdate(
        userId,
        pmpBalance,
        pmcBalance
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockResult.data[0]);
      }
    });

    it("should handle create/update errors", async () => {
      // Arrange
      const userId = "test-user";
      const pmpBalance = 1000.5;
      const pmcBalance = 500.25;
      const sqlError = new Error("Constraint violation");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.createOrUpdate(
        userId,
        pmpBalance,
        pmcBalance
      );

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });
  });

  describe("Repository Configuration", () => {
    it("should initialize with correct project ID", () => {
      // Act
      const newRepository = new SupabasePmpPmcAccountRepository(testProjectId);

      // Assert
      expect(newRepository).toBeInstanceOf(SupabasePmpPmcAccountRepository);
      expect(createDefaultMCPAdapter).toHaveBeenCalled();
    });
  });
});
