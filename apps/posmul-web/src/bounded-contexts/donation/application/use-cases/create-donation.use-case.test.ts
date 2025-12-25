/**
 * CreateDonationUseCase 테스트 (현재 구현 기준)
 */
describe("CreateDonationUseCase", () => {
  const { ValidationError } = require("@posmul/auth-economy-sdk");
  const { CreateDonationUseCase } = require("./create-donation.use-case");
  const {
    DonationType,
    DonationCategory,
    DonationFrequency,
  } = require("../../domain/value-objects/donation-value-objects");

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
  };

  const mockOpinionLeaderRepository = {
    findById: jest.fn(),
  };

  const mockDonationDomainService = {
    validateDonationEligibility: jest.fn(),
  };

  const emptyHistory = {
    success: true,
    data: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };

  let useCase;
  let validRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new CreateDonationUseCase(
      mockDonationRepository,
      mockInstituteRepository,
      mockOpinionLeaderRepository,
      mockDonationDomainService
    );

    validRequest = {
      amount: 10000,
      description: "테스트 기부",
      type: DonationType.DIRECT,
      category: DonationCategory.EDUCATION,
      frequency: DonationFrequency.ONE_TIME,
      isAnonymous: false,
      taxDeductible: true,
      receiptRequired: true,
      beneficiaryName: "테스트 수혜자",
      beneficiaryDescription: "교육 지원이 필요한 학생들",
      beneficiaryContact: "contact@test.com",
    };

    mockDonationRepository.findByDonorId.mockResolvedValue(emptyHistory);
    mockDonationRepository.save.mockResolvedValue({ success: true, data: undefined });
  });

  describe("성공 케이스", () => {
    it("유효한 Direct 기부 요청 시 Donation 엔티티를 생성하고 저장해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;

      const result = await useCase.execute(donorId, validRequest, donorBalance);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.getDonorId()).toBe(donorId);
      expect(result.data.getDonationType()).toBe(DonationType.DIRECT);
      expect(result.data.getAmount().getValue()).toBe(validRequest.amount);
      expect(result.data.getCategory()).toBe(validRequest.category);
      expect(result.data.getDescription().getValue()).toBe(validRequest.description);

      expect(mockDonationRepository.save).toHaveBeenCalledTimes(1);
      const savedDonation = mockDonationRepository.save.mock.calls[0][0];
      expect(savedDonation.getAmount().getValue()).toBe(validRequest.amount);
    });

    it("scheduledAt이 포함된 요청이면 Donation.scheduledAt이 설정되어야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const scheduledAt = new Date(Date.now() + 86400000);
      const requestWithSchedule = {
        ...validRequest,
        scheduledAt: scheduledAt.toISOString(),
      };

      const result = await useCase.execute(
        donorId,
        requestWithSchedule,
        donorBalance
      );

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.getScheduledAt()!.toISOString()).toBe(
        scheduledAt.toISOString()
      );
    });
  });

  describe("실패 케이스", () => {
    it("잘못된 요청 데이터 시 ValidationError를 반환해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const invalidRequest = {
        ...validRequest,
        amount: -1000,
      };

      const result = await useCase.execute(donorId, invalidRequest, donorBalance);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain("Invalid donation request");
    });

    it("잔액이 부족하면 실패해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 5000;

      const result = await useCase.execute(donorId, validRequest, donorBalance);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toBe("Insufficient balance");
    });

    it("저장소 저장 실패 시 에러를 반환해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      mockDonationRepository.save.mockResolvedValue({
        success: false,
        error: new Error("Database save failed"),
      });

      const result = await useCase.execute(donorId, validRequest, donorBalance);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.message).toBe("Database save failed");
    });
  });

  describe("기부 타입별 처리", () => {
    it("Institute 기부는 기관 조회/적격성 검증 후 저장해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const instituteRequest = {
        ...validRequest,
        type: DonationType.INSTITUTE,
        instituteId: "institute-123",
      };

      mockInstituteRepository.findById.mockResolvedValue({
        success: true,
        data: {
          canReceiveDonations: () => true,
        },
      });

      mockDonationDomainService.validateDonationEligibility.mockReturnValue({
        isEligible: true,
        reasons: [],
      });

      const result = await useCase.execute(donorId, instituteRequest, donorBalance);

      expect(result.success).toBe(true);
      expect(mockInstituteRepository.findById).toHaveBeenCalledTimes(1);
      const passedInstituteId = mockInstituteRepository.findById.mock.calls[0][0];
      expect(passedInstituteId.getValue()).toBe("institute-123");
      expect(mockDonationDomainService.validateDonationEligibility).toHaveBeenCalledTimes(1);
    });

    it("Opinion Leader 기부는 리더 조회/적격성 검증 후 저장해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const opinionLeaderRequest = {
        ...validRequest,
        type: DonationType.OPINION_LEADER,
        opinionLeaderId: "leader-123",
      };

      mockOpinionLeaderRepository.findById.mockResolvedValue({
        success: true,
        data: {
          canReceiveSupport: () => true,
        },
      });

      mockDonationDomainService.validateDonationEligibility.mockReturnValue({
        isEligible: true,
        reasons: [],
      });

      const result = await useCase.execute(donorId, opinionLeaderRequest, donorBalance);

      expect(result.success).toBe(true);
      expect(mockOpinionLeaderRepository.findById).toHaveBeenCalledTimes(1);
      const passedLeaderId = mockOpinionLeaderRepository.findById.mock.calls[0][0];
      expect(passedLeaderId.getValue()).toBe("leader-123");
      expect(mockDonationDomainService.validateDonationEligibility).toHaveBeenCalledTimes(1);
    });
  });

  describe("메타데이터 처리", () => {
    it("익명/메시지/헌정 메타데이터를 Donation에 반영해야 한다", async () => {
      const donorId = "user-123";
      const donorBalance = 50000;
      const anonymousRequest = {
        ...validRequest,
        isAnonymous: true,
        message: "익명 기부입니다.",
        dedicatedTo: "사랑하는 가족에게",
      };

      const result = await useCase.execute(donorId, anonymousRequest, donorBalance);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const md = result.data.getMetadata();
      expect(md.isAnonymous).toBe(true);
      expect(md.message).toBe("익명 기부입니다.");
      expect(md.dedicatedTo).toBe("사랑하는 가족에게");
      expect(md.taxDeductible).toBe(true);
      expect(md.receiptRequired).toBe(true);
    });
  });
});
