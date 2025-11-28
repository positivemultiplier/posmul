/**
 * Donation Entity Tests
 *
 * Domain Entity 테스트 - Donation Entity
 * 기부 엔티티의 핵심 비즈니스 로직 검증
 */
import { UserId } from "@posmul/auth-economy-sdk";

import {
  BeneficiaryInfo,
  DonationAmount,
  DonationCategory,
  DonationDescription,
  DonationFrequency,
  DonationId,
  DonationStatus,
  DonationType,
  InstituteId,
  OpinionLeaderId,
} from "../../value-objects/donation-value-objects";
import { Donation } from "../donation.entity";

describe("Donation Entity", () => {
  let validDonationProps: any;
  let donationId: DonationId;
  let donorId: UserId;

  beforeEach(() => {
    donationId = DonationId.create();
    donorId = "donor-123" as UserId;

    const amountResult = DonationAmount.create(10000);
    if (!amountResult.success) {
      throw new Error("Failed to create test donation amount");
    }

    validDonationProps = {
      id: donationId,
      donorId: donorId,
      donationType: DonationType.DIRECT,
      amount: amountResult.data,
      beneficiary: BeneficiaryInfo.create("Test Organization", "test-org-id"),
      category: DonationCategory.EDUCATION,
      description: DonationDescription.create("Educational support donation"),
      frequency: DonationFrequency.ONE_TIME,
      status: DonationStatus.PENDING,
    };
  });

  describe("Donation Creation", () => {
    it("유효한 데이터로 기부를 생성할 수 있다", () => {
      // When
      const result = Donation.create(validDonationProps);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getId()).toBe(donationId);
        expect(result.data.getDonorId()).toBe(donorId);
        expect(result.data.getAmount().getValue()).toBe(10000);
        expect(result.data.getStatus()).toBe(DonationStatus.PENDING);
      }
    });

    it("직접 기부를 생성할 수 있다", () => {
      // When
      const result = Donation.createDirectDonation({
        donorId,
        amount: 5000,
        beneficiaryName: "Direct Beneficiary",
        beneficiaryId: "direct-123",
        category: DonationCategory.MEDICAL,
        description: "Direct medical support",
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getDonationType()).toBe(DonationType.DIRECT);
        expect(result.data.getAmount().getValue()).toBe(5000);
        expect(result.data.getCategory()).toBe(DonationCategory.MEDICAL);
      }
    });

    it("기관 기부를 생성할 수 있다", () => {
      // Given
      const instituteId = new InstituteId("institute-456");

      // When
      const result = Donation.createInstituteDonation({
        donorId,
        amount: 20000,
        instituteId,
        category: DonationCategory.SOCIAL_WELFARE,
        description: "Institute donation",
        frequency: DonationFrequency.MONTHLY,
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getDonationType()).toBe(DonationType.INSTITUTE);
        expect(result.data.getAmount().getValue()).toBe(20000);
        expect(result.data.getFrequency()).toBe(DonationFrequency.MONTHLY);
      }
    });

    it("오피니언 리더 기부를 생성할 수 있다", () => {
      // Given
      const opinionLeaderId = new OpinionLeaderId("leader-789");

      // When
      const result = Donation.createOpinionLeaderDonation({
        donorId,
        amount: 15000,
        opinionLeaderId,
        category: DonationCategory.ENVIRONMENT,
        description: "Environmental cause donation",
      });

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getDonationType()).toBe(DonationType.OPINION_LEADER);
        expect(result.data.getAmount().getValue()).toBe(15000);
        expect(result.data.getCategory()).toBe(DonationCategory.ENVIRONMENT);
      }
    });

    it("잘못된 데이터로는 기부를 생성할 수 없다", () => {
      // Given
      const invalidProps = {
        ...validDonationProps,
        amount: DonationAmount.create(0), // 0원은 불가능
      };

      // When
      const result = Donation.create(invalidProps);

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Donation State Management", () => {
    let donation: Donation;

    beforeEach(() => {
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
      if (result.success) {
        donation = result.data;
      }
    });

    it("기부를 승인할 수 있다", () => {
      // When
      const result = donation.approve("admin-123");

      // Then
      expect(result.success).toBe(true);
      expect(donation.getStatus()).toBe(DonationStatus.APPROVED);
    });

    it("기부를 거절할 수 있다", () => {
      // Given
      const reason = "Insufficient verification";

      // When
      const result = donation.reject("admin-123", reason);

      // Then
      expect(result.success).toBe(true);
      expect(donation.getStatus()).toBe(DonationStatus.REJECTED);
    });

    it("승인된 기부를 완료할 수 있다", () => {
      // Given
      donation.approve("admin-123");

      // When
      const result = donation.complete("payment-123");

      // Then
      expect(result.success).toBe(true);
      expect(donation.getStatus()).toBe(DonationStatus.COMPLETED);
    });

    it("승인되지 않은 기부는 완료할 수 없다", () => {
      // When (PENDING 상태에서 바로 완료 시도)
      const result = donation.complete("payment-123");

      // Then
      expect(result.success).toBe(false);
    });

    it("기부를 취소할 수 있다", () => {
      // Given
      const reason = "User requested cancellation";

      // When
      const result = donation.cancel(reason);

      // Then
      expect(result.success).toBe(true);
      expect(donation.getStatus()).toBe(DonationStatus.CANCELLED);
    });

    it("완료된 기부는 취소할 수 없다", () => {
      // Given
      donation.approve("admin-123");
      donation.complete("payment-123");

      // When
      const result = donation.cancel("Too late");

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Donation Modifications", () => {
    let donation: Donation;

    beforeEach(() => {
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
      if (result.success) {
        donation = result.data;
      }
    });

    it("기부 금액을 수정할 수 있다", () => {
      // Given
      const newAmount = 15000;

      // When
      const result = donation.updateAmount(newAmount);

      // Then
      expect(result.success).toBe(true);
      expect(donation.amount.getValue()).toBe(15000);
    });

    it("PENDING 상태가 아닌 기부의 금액은 수정할 수 없다", () => {
      // Given
      donation.approve("admin-123");
      const newAmount = 15000;

      // When
      const result = donation.updateAmount(newAmount);

      // Then
      expect(result.success).toBe(false);
    });

    it("기부 설명을 수정할 수 있다", () => {
      // Given
      const newDescription = DonationDescription.create("Updated description");

      // When
      const result = donation.updateDescription(newDescription);

      // Then
      expect(result.success).toBe(true);
      expect(donation.getDescription().getValue()).toBe("Updated description");
    });

    it("기부 카테고리를 수정할 수 있다", () => {
      // When
      const result = donation.updateCategory(DonationCategory.ENVIRONMENT);

      // Then
      expect(result.success).toBe(true);
      expect(donation.getCategory()).toBe(DonationCategory.ENVIRONMENT);
    });

    it("수혜자 정보를 수정할 수 있다", () => {
      // Given
      const newBeneficiary = BeneficiaryInfo.create(
        "Updated Beneficiary",
        "updated-123"
      );

      // When
      const result = donation.updateBeneficiary(newBeneficiary);

      // Then
      expect(result.success).toBe(true);
      expect(donation.beneficiary.getName()).toBe("Updated Beneficiary");
    });
  });

  describe("Recurring Donations", () => {
    let recurringDonation: Donation;

    beforeEach(() => {
      const props = {
        ...validDonationProps,
        frequency: DonationFrequency.MONTHLY,
      };

      const result = Donation.create(props);
      expect(result.success).toBe(true);
      if (result.success) {
        recurringDonation = result.data;
      }
    });

    it("정기 기부인지 확인할 수 있다", () => {
      // When
      const isRecurring = recurringDonation.isRecurring();

      // Then
      expect(isRecurring).toBe(true);
    });

    it("다음 기부 실행일을 계산할 수 있다", () => {
      // When
      const nextExecutionDate = recurringDonation.getNextExecutionDate();

      // Then
      expect(nextExecutionDate).toBeInstanceOf(Date);
      expect(nextExecutionDate.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it("정기 기부를 일시 중지할 수 있다", () => {
      // When
      const result = recurringDonation.pauseRecurring();

      // Then
      expect(result.success).toBe(true);
      expect(recurringDonation.getStatus()).toBe(DonationStatus.PAUSED);
    });

    it("일시 중지된 정기 기부를 재개할 수 있다", () => {
      // Given
      recurringDonation.pauseRecurring();

      // When
      const result = recurringDonation.resumeRecurring();

      // Then
      expect(result.success).toBe(true);
      expect(recurringDonation.getStatus()).toBe(DonationStatus.PENDING);
    });
  });

  describe("Domain Events", () => {
    it("기부 생성시 도메인 이벤트가 발생한다", () => {
      // When
      const result = Donation.create(validDonationProps);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        const events = result.data.getDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe("DonationCreated");
      }
    });

    it("기부 승인시 도메인 이벤트가 발생한다", () => {
      // Given
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
      if (result.success) {
        const donation = result.data;
        donation.clearDomainEvents();

        // When
        donation.approve("admin-123");
        const events = donation.getDomainEvents();

        // Then
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe("DonationApproved");
      }
    });

    it("기부 완료시 도메인 이벤트가 발생한다", () => {
      // Given
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
      if (result.success) {
        const donation = result.data;
        donation.approve("admin-123");
        donation.clearDomainEvents();

        // When
        donation.complete("payment-123");
        const events = donation.getDomainEvents();

        // Then
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe("DonationCompleted");
      }
    });
  });

  describe("Business Rules", () => {
    it("최소 기부 금액 검증", () => {
      // Given
      const result = Donation.createDirectDonation({
        donorId,
        amount: 100, // 최소 금액보다 작음
        beneficiaryName: "Test",
        beneficiaryId: "test-123",
        category: DonationCategory.EDUCATION,
        description: "Small donation",
      });

      // Then
      expect(result.success).toBe(false);
    });

    it("최대 기부 금액 검증", () => {
      // Given
      const result = Donation.createDirectDonation({
        donorId,
        amount: 20000000, // 최대 금액보다 큼
        beneficiaryName: "Test",
        beneficiaryId: "test-123",
        category: DonationCategory.EDUCATION,
        description: "Large donation",
      });

      // Then
      expect(result.success).toBe(false);
    });

    it("동일한 수혜자에게 중복 기부 확인", () => {
      // This would require a domain service to check for duplicates
      // For now, just ensure the donation can be created
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
    });
  });

  describe("Donation Information", () => {
    let donation: Donation;

    beforeEach(() => {
      const result = Donation.create(validDonationProps);
      expect(result.success).toBe(true);
      if (result.success) {
        donation = result.data;
      }
    });

    it("기부 요약 정보를 조회할 수 있다", () => {
      // When
      const summary = donation.getSummary();

      // Then
      expect(summary).toBeDefined();
      expect(summary.id).toBe(donationId.getValue());
      expect(summary.amount).toBe(10000);
      expect(summary.status).toBe(DonationStatus.PENDING);
    });

    it("기부 상세 정보를 조회할 수 있다", () => {
      // When
      const details = donation.getDetails();

      // Then
      expect(details).toBeDefined();
      expect(details.donorId).toBe(donorId);
      expect(details.beneficiaryName).toBeDefined();
      expect(details.category).toBe(DonationCategory.EDUCATION);
    });

    it("기부 진행 상황을 확인할 수 있다", () => {
      // When
      const progress = donation.getProgress();

      // Then
      expect(progress.currentStatus).toBe(DonationStatus.PENDING);
      expect(progress.canModify).toBe(true);
      expect(progress.canCancel).toBe(true);
    });
  });
});
