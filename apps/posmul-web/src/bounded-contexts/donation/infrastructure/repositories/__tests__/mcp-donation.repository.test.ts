/**
 * Donation MCP Repository Tests
 *
 * Infrastructure Layer Repository 테스트
 * 기부 관련 MCP Repository 검증
 */
import { createDefaultMCPAdapter } from "../../../../../shared/legacy-compatibility";
import { MCPDonationRepository } from "../mcp-donation.repository";
import { DonationId, DonationStatus } from "../../../domain/value-objects/donation-value-objects";

// MCP Adapter 모킹
jest.mock("../../../../../shared/legacy-compatibility", () => ({
  createDefaultMCPAdapter: jest.fn(),
  buildParameterizedQuery: (query: string) => query,
}));

describe("MCPDonationRepository", () => {
  let repository: MCPDonationRepository;
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

    repository = new MCPDonationRepository(testProjectId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should successfully find donation by ID", async () => {
      // Arrange
      const donationId = "donation-123";
      const mockDonationData = {
        id: donationId,
        donor_id: "user-123",
        recipient_id: "user-456",
        amount: 1000.5,
        donation_type: "direct_transfer",
        status: "completed",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockDonationData],
      });

      // Act
      const result = await repository.findById(new DonationId(donationId));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeTruthy();
      }
    });

    it("should return null when donation not found", async () => {
      // Arrange
      const donationId = "nonexistent-donation";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.findById(new DonationId(donationId));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle SQL execution errors", async () => {
      // Arrange
      const donationId = "error-donation";
      const sqlError = new Error("Database error");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.findById(new DonationId(donationId));

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });
  });

  describe("delete", () => {
    it("should successfully delete donation", async () => {
      // Arrange
      const donationId = "donation-to-delete";
      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await repository.delete(new DonationId(donationId));

      // Assert
      expect(result.success).toBe(true);
    });

    it("should handle delete errors", async () => {
      // Arrange
      const donationId = "error-deletion";
      const sqlError = new Error("Delete constraint violation");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.delete(new DonationId(donationId));

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });
  });

  describe("countByStatus", () => {
    it("should successfully count donations by status", async () => {
      // Arrange
      const status = DonationStatus.COMPLETED;
      const mockCountResult = {
        count: 42,
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockCountResult],
      });

      // Act
      const result = await repository.countByStatus(status);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should handle count errors", async () => {
      // Arrange
      const status = DonationStatus.REJECTED;
      const sqlError = new Error("Invalid status filter");
      mockMcpAdapter.executeSQL.mockRejectedValue(sqlError);

      // Act
      const result = await repository.countByStatus(status);

      // Assert
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBe(sqlError);
      }
    });

    it("should return zero count when no donations found", async () => {
      // Arrange
      const status = DonationStatus.PAUSED;
      const mockCountResult = {
        count: 0,
      };

      mockMcpAdapter.executeSQL.mockResolvedValue({
        data: [mockCountResult],
      });

      // Act
      const result = await repository.countByStatus(status);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });
  });

  describe("Repository Configuration", () => {
    it("should initialize with correct project ID", () => {
      // Act
      const newRepository = new MCPDonationRepository(testProjectId);

      // Assert
      expect(newRepository).toBeInstanceOf(MCPDonationRepository);
      expect(createDefaultMCPAdapter).toHaveBeenCalled();
    });
  });
});
