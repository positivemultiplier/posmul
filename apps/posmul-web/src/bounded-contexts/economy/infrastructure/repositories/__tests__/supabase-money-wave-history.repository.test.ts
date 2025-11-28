/**
 * Supabase Money Wave History Repository Tests
 *
 * Infrastructure Layer Repository 테스트
 * MoneyWave 이벤트 이력 관리 Repository 검증
 */
import { createDefaultMCPAdapter } from "../../../../../shared/legacy-compatibility";
import { SupabaseMoneyWaveHistoryRepository } from "../supabase-money-wave-history.repository";

// MCP Adapter 모킹
jest.mock("../../../../../shared/legacy-compatibility", () => ({
  createDefaultMCPAdapter: jest.fn(),
}));

describe("SupabaseMoneyWaveHistoryRepository", () => {
  let repository: SupabaseMoneyWaveHistoryRepository;
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

    repository = new SupabaseMoneyWaveHistoryRepository(testProjectId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByWaveType", () => {
    it("should successfully find money wave events by type", async () => {
      // Arrange
      const waveType = "WAVE_TYPE_1";
      const mockWaveData = [
        {
          id: "wave-event-1",
          wave_type: waveType,
          user_id: "user-1",
          amount: 1000.5,
          processed_at: "2024-01-01T10:00:00Z",
          status: "completed",
        },
        {
          id: "wave-event-2",
          wave_type: waveType,
          user_id: "user-2",
          amount: 500.25,
          processed_at: "2024-01-01T11:00:00Z",
          status: "completed",
        },
      ];

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: mockWaveData,
      });

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockWaveData);
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM money_wave_events")
      );
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("WHERE wave_type = $1")
      );
    });

    it("should apply date range filters correctly", async () => {
      // Arrange
      const waveType = "WAVE_TYPE_2";
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const options = {
        startDate,
        endDate,
        limit: 10,
        offset: 5,
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByWaveType(waveType, options);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("processed_at >= $2")
      );
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("processed_at <= $3")
      );
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT $4")
      );
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("OFFSET $5")
      );
    });

    it("should handle pagination options", async () => {
      // Arrange
      const waveType = "WAVE_TYPE_3";
      const options = {
        limit: 25,
        offset: 50,
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByWaveType(waveType, options);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT $2")
      );
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("OFFSET $3")
      );
    });

    it("should handle SQL execution errors", async () => {
      // Arrange
      const waveType = "INVALID_TYPE";
      const sqlError = new Error("Table does not exist");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });

    it("should return empty array when no events found", async () => {
      // Arrange
      const waveType = "NON_EXISTENT_TYPE";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("mapDatabaseToMoneyWaveType", () => {
    it("should correctly map database wave types", async () => {
      // Arrange: private 메서드이므로 간접적으로 테스트
      const waveType = "TEST_WAVE_TYPE";
      const mockData = [
        {
          wave_type: waveType,
          amount: 1000,
        },
      ];

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: mockData,
      });

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
    });
  });

  describe("Repository Configuration", () => {
    it("should initialize with correct project ID", () => {
      // Act
      const newRepository = new SupabaseMoneyWaveHistoryRepository(
        testProjectId
      );

      // Assert
      expect(newRepository).toBeInstanceOf(SupabaseMoneyWaveHistoryRepository);
      expect(createDefaultMCPAdapter).toHaveBeenCalled();
    });

    it("should handle different project configurations", () => {
      // Arrange
      const customProjectId = "custom-project-123";

      // Act
      const customRepository = new SupabaseMoneyWaveHistoryRepository(
        customProjectId
      );

      // Assert
      expect(customRepository).toBeInstanceOf(
        SupabaseMoneyWaveHistoryRepository
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null/undefined options gracefully", async () => {
      // Arrange
      const waveType = "TEST_TYPE";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByWaveType(waveType, undefined);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY processed_at DESC")
      );
    });

    it("should handle empty wave type string", async () => {
      // Arrange
      const waveType = "";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMcpAdapter.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining("WHERE wave_type = $1")
      );
    });

    it("should handle large data sets", async () => {
      // Arrange
      const waveType = "BULK_TYPE";
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `wave-${i}`,
        wave_type: waveType,
        amount: i * 100,
        processed_at: "2024-01-01T00:00:00Z",
      }));

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: largeDataSet,
      });

      // Act
      const result = await repository.findByWaveType(waveType);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1000);
        expect(result.data[0].id).toBe("wave-0");
        expect(result.data[999].id).toBe("wave-999");
      }
    });

    it("should handle invalid date ranges", async () => {
      // Arrange
      const waveType = "TEST_TYPE";
      const invalidStartDate = new Date("invalid-date");
      const endDate = new Date("2024-01-31");
      const options = {
        startDate: invalidStartDate,
        endDate,
      };

      // Invalid date causes SQL error - simulate this
      const sqlError = new Error("Invalid date format");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findByWaveType(waveType, options);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.message).toContain("Invalid");
      }
    });
  });
});
