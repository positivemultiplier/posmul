/**
 * DonationApplicationService 테스트 (현재 구현 기준)
 */
describe("DonationApplicationService", () => {
  const {
    DonationApplicationService,
  } = require("./donation.application-service");

  const mockDonationRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDonorId: jest.fn(),
    findByCriteria: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getDonationStatsInPeriod: jest.fn(),
    getMonthlyStats: jest.fn(),
    getYearlyStats: jest.fn(),
    getDashboardSummary: jest.fn(),
  };

  const mockInstituteRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockOpinionLeaderRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockDonationDomainService = {
    checkTierUpgradePossibility: jest.fn(),
    analyzeDonationImpact: jest.fn(),
    suggestOptimalDonation: jest.fn(),
  };

  const mockCreateDonationUseCase = {
    execute: jest.fn(),
  };

  const makeDonationMock = (overrides = {}) => {
    const base = {
      getId: () => ({ getValue: () => "donation-1" }),
      getDonorId: () => "user-123",
      getAmount: () => ({ getValue: () => 10000 }),
      getDonationType: () => "DIRECT",
      getStatus: () => "PENDING",
      getCategory: () => "EDUCATION",
      getDescription: () => ({ getValue: () => "테스트 기부" }),
      getFrequency: () => "ONE_TIME",
      getMetadata: () => ({
        isAnonymous: false,
        taxDeductible: true,
        receiptRequired: true,
      }),
      getInstituteId: () => undefined,
      getOpinionLeaderId: () => undefined,
      getBeneficiaryInfo: () => undefined,
      getProcessingInfo: () => ({}),
      getScheduledAt: () => undefined,
      getCompletedAt: () => undefined,
      getCancelledAt: () => undefined,
      getCreatedAt: () => new Date("2024-01-01"),
      getUpdatedAt: () => new Date("2024-01-01"),
    };
    return { ...base, ...overrides };
  };

  const paginated = (items, page = 1, pageSize = 10) => ({
    success: true,
    data: {
      items,
      total: items.length,
      page,
      pageSize,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  });

  let service;
  let mockDonations;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new DonationApplicationService(
      mockDonationRepository,
      mockInstituteRepository,
      mockOpinionLeaderRepository,
      mockDonationDomainService,
      mockCreateDonationUseCase
    );

    mockDonations = [
      makeDonationMock({
        getId: () => ({ getValue: () => "donation-1" }),
        getAmount: () => ({ getValue: () => 10000 }),
      }),
      makeDonationMock({
        getId: () => ({ getValue: () => "donation-2" }),
        getAmount: () => ({ getValue: () => 20000 }),
        getDonationType: () => "INSTITUTE",
        getInstituteId: () => ({ getValue: () => "institute-123" }),
      }),
    ];
  });

  describe("getDonations", () => {
    it("기부자 기부 목록을 DTO로 매핑해 반환해야 한다", async () => {
      const donorId = "user-123";
      const pagination = { page: 1, pageSize: 10 };

      mockDonationRepository.findByDonorId.mockResolvedValue(
        paginated(mockDonations, 1, 10)
      );

      const result = await service.getDonations(donorId, pagination);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe("donation-1");
      expect(result.data.items[0].amount).toBe(10000);
      expect(result.data.items[1].id).toBe("donation-2");
      expect(result.data.items[1].instituteId).toBe("institute-123");

      expect(mockDonationRepository.findByDonorId).toHaveBeenCalledWith(
        donorId,
        1,
        10
      );
    });

    it("기부 목록 조회 실패 시 에러를 반환해야 한다", async () => {
      const donorId = "user-123";
      const pagination = { page: 1, pageSize: 10 };

      mockDonationRepository.findByDonorId.mockResolvedValue({
        success: false,
        error: new Error("Database error"),
      });

      const result = await service.getDonations(donorId, pagination);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.message).toBe("Database error");
    });
  });

  describe("getDonationById", () => {
    it("DonationResponse로 변환해 반환해야 한다", async () => {
      const donationId = "donation-1";
      const donation = mockDonations[0];

      mockDonationRepository.findById.mockResolvedValue({
        success: true,
        data: donation,
      });

      const result = await service.getDonationById(donationId);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.id).toBe("donation-1");

      const passedId = mockDonationRepository.findById.mock.calls[0][0];
      expect(passedId.getValue()).toBe("donation-1");
    });

    it("존재하지 않으면 null을 반환해야 한다", async () => {
      mockDonationRepository.findById.mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await service.getDonationById("missing");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toBeNull();
    });
  });

  describe("searchDonations", () => {
    it("criteria 기반 검색 결과를 DTO로 매핑해 반환해야 한다", async () => {
      const searchRequest = {
        donorId: "user-123",
        status: "PENDING",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-12-31T00:00:00.000Z",
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      mockDonationRepository.findByCriteria.mockResolvedValue(
        paginated(mockDonations, 1, 10)
      );

      const result = await service.searchDonations(searchRequest);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(mockDonationRepository.findByCriteria).toHaveBeenCalled();
    });
  });

  describe("getDonationStats", () => {
    it("repository 통계를 기반으로 DonationStatsResponse를 반환해야 한다", async () => {
      mockDonationRepository.getDonationStatsInPeriod.mockResolvedValue({
        success: true,
        data: {
          totalDonations: 2,
          totalAmount: 30000,
          averageAmount: 15000,
          donationsByCategory: {},
          donationsByType: {},
        },
      });

      mockDonationRepository.getMonthlyStats.mockResolvedValue({
        success: true,
        data: [
          { month: 1, totalDonations: 2, totalAmount: 30000 },
        ],
      });

      mockDonationRepository.getYearlyStats.mockResolvedValue({
        success: true,
        data: [
          { year: 2024, totalDonations: 2, totalAmount: 30000 },
        ],
      });

      const result = await service.getDonationStats("user-123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.totalAmount).toBe(30000);
      expect(result.data.totalDonations).toBe(2);
      expect(result.data.averageAmount).toBe(15000);
      expect(Array.isArray(result.data.monthlyStats)).toBe(true);
      expect(Array.isArray(result.data.yearlyStats)).toBe(true);
    });
  });

  describe("createDonation", () => {
    it("use-case 결과 Donation을 DonationResponse로 매핑해 반환해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const createRequest = {
        amount: 10000,
        description: "테스트 기부",
        type: "DIRECT",
        category: "EDUCATION",
        frequency: "ONE_TIME",
        isAnonymous: false,
        taxDeductible: true,
        receiptRequired: true,
      };

      const donation = mockDonations[0];
      mockCreateDonationUseCase.execute.mockResolvedValue({
        success: true,
        data: donation,
      });

      const result = await service.createDonation(donorId, createRequest, donorBalance);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.id).toBe("donation-1");
      expect(mockCreateDonationUseCase.execute).toHaveBeenCalledWith(
        donorId,
        createRequest,
        donorBalance
      );
    });
  });

  describe("getInstitutes/getOpinionLeaders", () => {
    it("현재 임시 구현은 빈 배열을 반환한다", async () => {
      const institutes = await service.getInstitutes();
      expect(institutes.success).toBe(true);
      if (!institutes.success) return;
      expect(institutes.data).toEqual([]);

      const leaders = await service.getOpinionLeaders();
      expect(leaders.success).toBe(true);
      if (!leaders.success) return;
      expect(leaders.data).toEqual([]);
    });
  });

  describe("예외 처리", () => {
    it("repository가 throw하면 Result 실패로 감싸 반환해야 한다", async () => {
      const donorId = "user-123";
      mockDonationRepository.findByDonorId.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await service.getDonations(donorId, { page: 1, pageSize: 10 });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.message).toBe("Unexpected error");
    });
  });
});
