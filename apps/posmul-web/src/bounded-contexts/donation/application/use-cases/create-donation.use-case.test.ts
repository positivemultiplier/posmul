/**
 * CreateDonationUseCase 테스트
 */
describe("CreateDonationUseCase", () => {
  const { CreateDonationUseCase } = require("./create-donation.use-case");
  const {
    DonationType,
    DonationCategory,
    DonationFrequency,
  } = require("../../domain/value-objects/donation-value-objects");

  // Mock implementations
  const mockDonationRepository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByDonorId: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
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

  let useCase;
  let validRequest;

  beforeEach(() => {
    // Reset all mocks
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
  });

  describe("성공 케이스", () => {
    it("유효한 Direct 기부 요청 시 성공해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.DIRECT,
        status: "PENDING",
        createdAt: new Date(),
      };

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await useCase.execute(donorId, validRequest, donorBalance);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDonation);
      }

      expect(mockDonationRepository.save).toHaveBeenCalledWith(mockDonation);
    });

    it("스케줄된 기부 요청 시 성공해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const scheduledAt = new Date(Date.now() + 86400000); // 1일 후
      const requestWithSchedule = {
        ...validRequest,
        scheduledAt: scheduledAt.toISOString(),
      };

      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.DIRECT,
        status: "SCHEDULED",
        scheduledAt: scheduledAt,
        createdAt: new Date(),
      };

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await useCase.execute(
        donorId,
        requestWithSchedule,
        donorBalance
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt).toEqual(scheduledAt);
      }
    });
  });

  describe("실패 케이스", () => {
    it("잘못된 요청 데이터 시 검증 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const invalidRequest = {
        ...validRequest,
        amount: -1000, // 잘못된 금액
      };

      // When
      const result = await useCase.execute(
        donorId,
        invalidRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid donation request");
      }
    });

    it("기부 금액 검증 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 5000; // 부족한 잔액

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: false,
        error: new Error("Insufficient balance"),
      });

      // When
      const result = await useCase.execute(donorId, validRequest, donorBalance);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Insufficient balance");
      }
    });

    it("기부 생성 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: false,
        error: new Error("Donation creation failed"),
      });

      // When
      const result = await useCase.execute(donorId, validRequest, donorBalance);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Donation creation failed");
      }
    });

    it("저장소 저장 실패 시 에러를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.DIRECT,
        status: "PENDING",
        createdAt: new Date(),
      };

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: false,
        error: new Error("Database save failed"),
      });

      // When
      const result = await useCase.execute(donorId, validRequest, donorBalance);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Database save failed");
      }
    });

    it("예기치 않은 에러 발생 시 적절한 에러 메시지를 반환해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;

      mockDonationDomainService.validateDonationAmount.mockImplementation(
        () => {
          throw new Error("Unexpected error");
        }
      );

      // When
      const result = await useCase.execute(donorId, validRequest, donorBalance);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Unexpected error");
      }
    });
  });

  describe("기부 타입별 처리", () => {
    it("Institute 기부 타입에 대해 올바르게 처리해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const instituteRequest = {
        ...validRequest,
        type: DonationType.INSTITUTE,
        instituteId: "institute-123",
      };

      const mockInstitute = {
        id: "institute-123",
        name: "Test Institute",
        category: DonationCategory.EDUCATION,
      };

      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.INSTITUTE,
        instituteId: "institute-123",
        status: "PENDING",
        createdAt: new Date(),
      };

      mockInstituteRepository.findById.mockResolvedValue({
        success: true,
        data: mockInstitute,
      });

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await useCase.execute(
        donorId,
        instituteRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(true);
      expect(mockInstituteRepository.findById).toHaveBeenCalledWith(
        "institute-123"
      );
    });

    it("Opinion Leader 기부 타입에 대해 올바르게 처리해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const opinionLeaderRequest = {
        ...validRequest,
        type: DonationType.OPINION_LEADER,
        opinionLeaderId: "leader-123",
      };

      const mockOpinionLeader = {
        id: "leader-123",
        name: "Test Leader",
        category: DonationCategory.SOCIAL_WELFARE,
      };

      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.OPINION_LEADER,
        opinionLeaderId: "leader-123",
        status: "PENDING",
        createdAt: new Date(),
      };

      mockOpinionLeaderRepository.findById.mockResolvedValue({
        success: true,
        data: mockOpinionLeader,
      });

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await useCase.execute(
        donorId,
        opinionLeaderRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(true);
      expect(mockOpinionLeaderRepository.findById).toHaveBeenCalledWith(
        "leader-123"
      );
    });
  });

  describe("메타데이터 처리", () => {
    it("익명 기부 메타데이터를 올바르게 처리해야 한다", async () => {
      // Given
      const donorId = "user-123";
      const donorBalance = 50000;
      const anonymousRequest = {
        ...validRequest,
        isAnonymous: true,
        message: "익명 기부입니다.",
        dedicatedTo: "사랑하는 가족에게",
      };

      const mockDonation = {
        id: "donation-123",
        donorId: donorId,
        amount: validRequest.amount,
        type: DonationType.DIRECT,
        status: "PENDING",
        metadata: {
          isAnonymous: true,
          message: "익명 기부입니다.",
          dedicatedTo: "사랑하는 가족에게",
          taxDeductible: true,
          receiptRequired: true,
        },
        createdAt: new Date(),
      };

      mockDonationDomainService.validateDonationAmount.mockReturnValue({
        success: true,
        data: true,
      });

      mockDonationDomainService.createDonation.mockReturnValue({
        success: true,
        data: mockDonation,
      });

      mockDonationRepository.save.mockResolvedValue({
        success: true,
        data: mockDonation,
      });

      // When
      const result = await useCase.execute(
        donorId,
        anonymousRequest,
        donorBalance
      );

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.isAnonymous).toBe(true);
        expect(result.data.metadata.message).toBe("익명 기부입니다.");
        expect(result.data.metadata.dedicatedTo).toBe("사랑하는 가족에게");
      }
    });
  });
});
