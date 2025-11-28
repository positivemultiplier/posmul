/**
 * DonationApplicationService 테스트
 */
describe("DonationApplicationService", () => {
  const {
    DonationApplicationService,
  } = require("./donation.application-service");

  // Mock implementations
  const mockDonationRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDonorId: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    findByCriteria: jest.fn(), // 추가
    getDonationStatsInPeriod: jest.fn(), // 추가
  };

  const mockInstituteRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    search: jest.fn(),
    findByCategory: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockOpinionLeaderRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    search: jest.fn(),
    findByCategory: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDonationDomainService = {
    validateDonationAmount: jest.fn(),
    calculateTaxDeduction: jest.fn(),
    processPayment: jest.fn(),
    createDonation: jest.fn(),
  };

  const mockCreateDonationUseCase = {
    execute: jest.fn(),
  };

  let service;
  let mockDonations;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    service = new DonationApplicationService(
      mockDonationRepository,
      mockInstituteRepository,
      mockOpinionLeaderRepository,
      mockDonationDomainService,
      mockCreateDonationUseCase
    );

    // Mock donation data - Donation Entity의 메서드들을 포함
    mockDonations = [
      {
        id: "donation-1",
        donorId: "user-123",
        amount: 10000,
        type: "DIRECT",
        status: "COMPLETED",
        createdAt: new Date("2024-01-01"),
        // Donation Entity 메서드들을 mock으로 추가
        getId: () => ({ getValue: () => "donation-1" }),
        getDonorId: () => "user-123",
        getAmount: () => ({ getValue: () => 10000 }),
        getDonationType: () => "DIRECT",
        getStatus: () => "COMPLETED",
        getCategory: () => "SOCIAL",
        getDescription: () => ({ getValue: () => "테스트 기부" }),
        getFrequency: () => "ONE_TIME",
        getMetadata: () => ({}),
        getInstituteId: () => null,
        getOpinionLeaderId: () => null,
        getBeneficiaryInfo: () => null,
        getProcessingInfo: () => ({}),
        getScheduledAt: () => null,
        getCompletedAt: () => new Date("2024-01-01"),
        getCancelledAt: () => null,
        getCreatedAt: () => new Date("2024-01-01"),
        getUpdatedAt: () => new Date("2024-01-01"),
      },
      {
        id: "donation-2",
        donorId: "user-123",
        amount: 20000,
        type: "INSTITUTE",
        status: "COMPLETED",
        createdAt: new Date("2024-01-02"),
        // Donation Entity 메서드들을 mock으로 추가
        getId: () => ({ getValue: () => "donation-2" }),
        getDonorId: () => "user-123",
        getAmount: () => ({ getValue: () => 20000 }),
        getDonationType: () => "INSTITUTE",
        getStatus: () => "COMPLETED",
        getCategory: () => "EDUCATION",
        getDescription: () => ({ getValue: () => "교육 기부" }),
        getFrequency: () => "ONE_TIME",
        getMetadata: () => ({}),
        getInstituteId: () => ({ getValue: () => "institute-123" }),
        getOpinionLeaderId: () => null,
        getBeneficiaryInfo: () => null,
        getProcessingInfo: () => ({}),
        getScheduledAt: () => null,
        getCompletedAt: () => new Date("2024-01-02"),
        getCancelledAt: () => null,
        getCreatedAt: () => new Date("2024-01-02"),
        getUpdatedAt: () => new Date("2024-01-02"),
      },
    ];
  });

  describe("getDonations", () => {
    it("사용자의 기부 목록을 올바르게 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const pagination = { page: 1, limit: 10 };

      mockDonationRepository.findByDonorId.mockResolvedValue({
        success: true,
        data: mockDonations,
      });

      // When
      const result = await service.getDonations(donorId, pagination);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDonations);
      }

      expect(mockDonationRepository.findByDonorId).toHaveBeenCalledWith(
        donorId,
        pagination
      );
    });

    it("기부 목록 조회 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const pagination = { page: 1, limit: 10 };

      mockDonationRepository.findByDonorId.mockResolvedValue({
        success: false,
        error: new Error("Database error"),
      });

      // When
      const result = await service.getDonations(donorId, pagination);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Database error");
      }
    });
  });

  describe("getDonationById", () => {
    it("특정 기부를 올바르게 반환해야 한다", async () => {
      // Given
      const donationId = "donation-1";
      const mockDonation = mockDonations[0];

      mockDonationRepository.findById.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await service.getDonationById(donationId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDonation);
      }

      expect(mockDonationRepository.findById).toHaveBeenCalledWith(donationId);
    });

    it("기부를 찾을 수 없을 때 에러를 반환해야 한다", async () => {
      // Given
      const donationId = "non-existent";

      mockDonationRepository.findById.mockResolvedValue({
        success: false,
        error: new Error("Donation not found"),
      });

      // When
      const result = await service.getDonationById(donationId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Donation not found");
      }
    });
  });

  describe("searchDonations", () => {
    it("검색 조건에 맞는 기부 목록을 반환해야 한다", async () => {
      // Given
      const searchRequest = {
        donorId: "user-123",
        status: "COMPLETED",
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        page: 1,
        limit: 10,
      };

      const searchCriteria = {
        donorId: searchRequest.donorId,
        status: searchRequest.status,
        dateRange: {
          from: new Date(searchRequest.dateFrom),
          to: new Date(searchRequest.dateTo),
        },
      };

      mockDonationRepository.search.mockResolvedValue({
        success: true,
        data: mockDonations.filter((d) => d.status === "COMPLETED"),
      });

      // When
      const result = await service.searchDonations(searchRequest);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data.every((d) => d.status === "COMPLETED")).toBe(true);
      }

      expect(mockDonationRepository.search).toHaveBeenCalledWith(
        searchCriteria,
        { page: searchRequest.page, limit: searchRequest.limit }
      );
    });

    it("검색 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const searchRequest = {
        donorId: "user-123",
        page: 1,
        limit: 10,
      };

      mockDonationRepository.search.mockResolvedValue({
        success: false,
        error: new Error("Search failed"),
      });

      // When
      const result = await service.searchDonations(searchRequest);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Search failed");
      }
    });
  });

  describe("getDonationStats", () => {
    it("기부 통계를 올바르게 계산해야 한다", async () => {
      // Given
      const donorId = "user-123";

      mockDonationRepository.findByDonorId.mockResolvedValue({
        success: true,
        data: mockDonations,
      });

      // When
      const result = await service.getDonationStats(donorId);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAmount).toBe(30000);
        expect(result.data.totalCount).toBe(2);
        expect(result.data.averageAmount).toBe(15000);
        expect(result.data.completedCount).toBe(2);
      }
    });

    it("기부 통계 계산 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";

      mockDonationRepository.findByDonorId.mockResolvedValue({
        success: false,
        error: new Error("Failed to fetch donations"),
      });

      // When
      const result = await service.getDonationStats(donorId);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Failed to fetch donations");
      }
    });
  });

  describe("createDonation", () => {
    it("기부 생성 유스케이스를 올바르게 호출해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const createRequest = {
        amount: 10000,
        description: "테스트 기부",
        type: "DIRECT",
        isAnonymous: false,
        taxDeductible: true,
      };

      const mockDonation = {
        id: "donation-new",
        donorId: donorId,
        amount: createRequest.amount,
        type: createRequest.type,
        status: "PENDING",
        createdAt: new Date(),
      };

      mockCreateDonationUseCase.execute.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await service.createDonation(
        donorId,
        createRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDonation);
      }

      expect(mockCreateDonationUseCase.execute).toHaveBeenCalledWith(
        donorId,
        createRequest,
        donorBalance
      );
    });

    it("기부 생성 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const createRequest = {
        amount: 10000,
        description: "테스트 기부",
        type: "DIRECT",
      };

      mockCreateDonationUseCase.execute.mockResolvedValue({
        success: false,
        error: new Error("Donation creation failed"),
      });

      // When
      const result = await service.createDonation(
        donorId,
        createRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Donation creation failed");
      }
    });
  });

  describe("getInstitutes", () => {
    it("모든 기관 목록을 반환해야 한다", async () => {
      // Given
      const mockInstitutes = [
        { id: "inst-1", name: "Institute 1", category: "EDUCATION" },
        { id: "inst-2", name: "Institute 2", category: "HEALTH" },
      ];

      mockInstituteRepository.findAll.mockResolvedValue({
        success: true,
        data: mockInstitutes,
      });

      // When
      const result = await service.getInstitutes();

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockInstitutes);
      }

      expect(mockInstituteRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("getOpinionLeaders", () => {
    it("모든 오피니언 리더 목록을 반환해야 한다", async () => {
      // Given
      const mockOpinionLeaders = [
        { id: "leader-1", name: "Leader 1", category: "EDUCATION" },
        { id: "leader-2", name: "Leader 2", category: "ENVIRONMENT" },
      ];

      mockOpinionLeaderRepository.findAll.mockResolvedValue({
        success: true,
        data: mockOpinionLeaders,
      });

      // When
      const result = await service.getOpinionLeaders();

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockOpinionLeaders);
      }

      expect(mockOpinionLeaderRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("예외 처리", () => {
    it("예기치 않은 에러 발생 시 적절히 처리해야 한다", async () => {
      // Given
      const donorId = "user-123";

      mockDonationRepository.findByDonorId.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // When
      const result = await service.getDonations(donorId, {
        page: 1,
        limit: 10,
      });

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Unexpected error");
      }
    });
  });
});
