/**
 * MCP User Repository Tests
 *
 * Infrastructure Layer Repository 테스트
 * MCP 패턴을 사용하는 사용자 관리 Repository 검증
 */
import { createDefaultMCPAdapter } from "../../../../../shared/legacy-compatibility";
import { MCPUserRepository } from "../mcp-user.repository";

// MCP Adapter 모킹
jest.mock("../../../../../shared/legacy-compatibility", () => ({
  createDefaultMCPAdapter: jest.fn(),
}));

describe("MCPUserRepository", () => {
  let repository: MCPUserRepository;
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

    repository = new MCPUserRepository(testProjectId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should successfully find user by ID", async () => {
      // Arrange
      const userId = "user-123";
      const mockUserData = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockUserData],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: userId,
          email: "test@example.com",
          name: "Test User",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        });
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(`
        SELECT * FROM users WHERE id = $1
      `);
    });

    it("should return null when user not found", async () => {
      // Arrange
      const userId = "nonexistent-user";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle SQL execution errors", async () => {
      // Arrange
      const userId = "user-123";
      const sqlError = new Error("Connection timeout");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });

    it("should handle empty user ID", async () => {
      // Arrange
      const userId = "";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(`
        SELECT * FROM users WHERE id = $1
      `);
    });

    it("should handle malformed database response", async () => {
      // Arrange
      const userId = "user-123";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [null], // malformed response
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(false);
      // Repository should handle null data gracefully by returning error
    });
  });

  describe("mapDatabaseToUser", () => {
    it("should correctly map database fields to user object", async () => {
      // Arrange: private 메서드이므로 간접적으로 테스트
      const userId = "map-test-user";
      const dbData = {
        id: userId,
        email: "map@test.com",
        name: "Map Test",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-02T15:30:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [dbData],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: userId,
          email: "map@test.com",
          name: "Map Test",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-02T15:30:00Z",
        });
      }
    });

    it("should handle partial database data", async () => {
      // Arrange
      const userId = "partial-user";
      const partialDbData = {
        id: userId,
        email: "partial@test.com",
        name: null, // missing name
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null, // missing update time
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [partialDbData],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(userId);
        expect(result.data?.email).toBe("partial@test.com");
        expect(result.data?.name).toBeNull();
        expect(result.data?.updatedAt).toBeNull();
      }
    });
  });

  describe("Repository Configuration", () => {
    it("should initialize with correct project ID", () => {
      // Act
      const newRepository = new MCPUserRepository(testProjectId);

      // Assert
      expect(newRepository).toBeInstanceOf(MCPUserRepository);
      expect(createDefaultMCPAdapter).toHaveBeenCalled();
    });

    it("should handle different project IDs", () => {
      // Arrange
      const customProjectId = "custom-project-456";

      // Act
      const customRepository = new MCPUserRepository(customProjectId);

      // Assert
      expect(customRepository).toBeInstanceOf(MCPUserRepository);
    });
  });

  describe("Edge Cases and Performance", () => {
    it("should handle UUID format user IDs", async () => {
      // Arrange
      const uuidUserId = "a0b1c2d3-e4f5-6789-abcd-ef0123456789";
      const mockUserData = {
        id: uuidUserId,
        email: "uuid@test.com",
        name: "UUID User",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockUserData],
      });

      // Act
      const result = await repository.findById(uuidUserId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(uuidUserId);
      }
    });

    it("should handle special characters in user data", async () => {
      // Arrange
      const userId = "special-char-user";
      const mockUserData = {
        id: userId,
        email: "special+test@example.com",
        name: "Test User (™)",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockUserData],
      });

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.email).toBe("special+test@example.com");
        expect(result.data?.name).toBe("Test User (™)");
      }
    });

    it("should handle database timeout gracefully", async () => {
      // Arrange
      const userId = "timeout-user";
      const timeoutError = new Error("Query timeout exceeded");
      mockMcpAdapter.executeSQL.mockRejectedValue(timeoutError);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.message).toContain("timeout");
      }
    });

    it("should handle multiple concurrent requests", async () => {
      // Arrange
      const userIds = ["user-1", "user-2", "user-3"];
      const mockResults = userIds.map((id) => ({
        id,
        email: `${id}@test.com`,
        name: `User ${id}`,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }));

      // Mock different responses for each call
      mockMcpAdapter.executeSQL
        .mockResolvedValueOnce({ data: [mockResults[0]] })
        .mockResolvedValueOnce({ data: [mockResults[1]] })
        .mockResolvedValueOnce({ data: [mockResults[2]] });

      // Act
      const promises = userIds.map((id) => repository.findById(id));
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data?.id).toBe(userIds[index]);
        }
      });
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledTimes(3);
    });
  });
});
