/**
 * MCP Auth Repository Tests
 *
 * Infrastructure Layer Repository 테스트
 * 인증 관련 MCP Repository 검증
 */
import { createDefaultMCPAdapter } from "../../../../../shared/legacy-compatibility";
import { MCPAuthRepository } from "../mcp-auth.repository";

// MCP Adapter 모킹
jest.mock("../../../../../shared/legacy-compatibility", () => ({
  createDefaultMCPAdapter: jest.fn(),
  buildParameterizedQuery: (query: string) => query,
}));

describe("MCPAuthRepository", () => {
  let repository: MCPAuthRepository;
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

    repository = new MCPAuthRepository(testProjectId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getSession", () => {
    it("should successfully get session by ID", async () => {
      // Arrange
      const sessionId = "session-123";
      const mockSessionData = {
        id: sessionId,
        user_id: "user-123",
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
        expires_at: "2024-12-31T23:59:59Z",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockSessionData],
      });

      // Act
      const result = await repository.getSession(sessionId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("SELECT")
      );
    });

    it("should return null when session not found", async () => {
      // Arrange
      const sessionId = "nonexistent-session";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.getSession(sessionId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle SQL execution errors", async () => {
      // Arrange
      const sessionId = "session-123";
      const sqlError = new Error("Database error");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.getSession(sessionId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.message).toBe("GET_SESSION_ERROR");
      }
    });
  });

  describe("getUserCredentials", () => {
    it("should successfully get user credentials", async () => {
      // Arrange
      const userId = "user-123" as any; // UserId 타입
      const mockCredentials = {
        user_id: userId,
        email: "test@example.com",
        password_hash: "hashed-password",
        salt: "random-salt",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockCredentials],
      });

      // Act
      const result = await repository.getUserCredentials(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it("should return null when credentials not found", async () => {
      // Arrange
      const userId = "nonexistent-user" as any;
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.getUserCredentials(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle credential lookup errors", async () => {
      // Arrange
      const userId = "user-123" as any;
      const sqlError = new Error("Credential lookup failed");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.getUserCredentials(userId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toStrictEqual(expect.any(Error));
        expect(result.error.message).toBe("Credential lookup failed");
      }
    });
  });

  describe("invalidateSession", () => {
    it("should successfully invalidate session", async () => {
      // Arrange
      const sessionId = "session-to-invalidate";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.invalidateSession(sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE")
      );
    });

    it("should handle invalidation errors", async () => {
      // Arrange
      const sessionId = "session-error";
      const sqlError = new Error("Invalidation failed");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.invalidateSession(sessionId);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toStrictEqual(expect.any(Error));
        expect(result.error.message).toBe("Invalidation failed");
      }
    });
  });

  describe("getActiveSessions", () => {
    it("should successfully get active sessions for user", async () => {
      // Arrange
      const userId = "user-123" as any;
      const mockSessions = [
        {
          id: "session-1",
          user_id: userId,
          expires_at: "2024-12-31T23:59:59Z",
          is_active: true,
        },
        {
          id: "session-2",
          user_id: userId,
          expires_at: "2024-12-31T23:59:59Z",
          is_active: true,
        },
      ];

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: mockSessions,
      });

      // Act
      const result = await repository.getActiveSessions(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return empty array when no active sessions", async () => {
      // Arrange
      const userId = "user-no-sessions" as any;
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.getActiveSessions(userId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("Repository Configuration", () => {
    it("should initialize with correct project ID", () => {
      // Act
      const newRepository = new MCPAuthRepository(testProjectId);

      // Assert
      expect(newRepository).toBeInstanceOf(MCPAuthRepository);
      expect(createDefaultMCPAdapter).toHaveBeenCalled();
    });
  });
});
