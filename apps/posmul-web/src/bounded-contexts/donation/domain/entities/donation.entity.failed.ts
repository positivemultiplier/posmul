/**
 * Donation Entity (Clean Version)
 * 기부 엔티티 - 모든 기부 활동의 루트 애그리거트
 */
import { AggregateRoot, UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { DomainEvent } from "@posmul/auth-economy-sdk";

import {
  BeneficiaryInfo,
  DonationAmount,
  DonationCategory,
  DonationDescription,
  DonationFrequency,
  DonationId,
  DonationMetadata,
  DonationStatus,
  DonationType,
  InstituteId,
  OpinionLeaderId,
  ProcessingInfo,
} from "../value-objects/donation-value-objects";

// === 기부 관련 타입들 ===
export interface DonationSummary {
  id: string;
  donorId: string;
  amount: number;
  status: DonationStatus;
  donationType: DonationType;
  category: DonationCategory;
  frequency: DonationFrequency;
  createdAt: Date;
  completedAt?: Date;
}

export interface DonationDetails extends DonationSummary {
  description: string;
  beneficiaryInfo?: BeneficiaryInfo;
  metadata: DonationMetadata;
  processingInfo: ProcessingInfo;
  instituteId?: string;
  opinionLeaderId?: string;
  scheduledAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

export interface DonationProgress {
  currentStatus: DonationStatus;
  timeline: DonationTimeline[];
  nextAction: string | null;
}

export interface DonationTimeline {
  status: DonationStatus;
  timestamp: Date;
  description: string;
}

// === 도메인 이벤트 클래스들 ===

// 기부 생성 이벤트
export class DonationCreatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly donationId: DonationId,
    public readonly donorId: UserId,
    public readonly donationType: DonationType,
    public readonly amount: DonationAmount
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationCreated";
    this.aggregateId = donationId.getValue();
    this.data = {
      donorId: donorId.toString(),
      donationType,
      amount: amount.getValue(),
    };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 기부 승인 이벤트
export class DonationApprovedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly donationId: DonationId,
    public readonly donorId: UserId,
    public readonly adminId: string
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationApproved";
    this.aggregateId = donationId.getValue();
    this.data = {
      donorId: donorId.toString(),
      adminId,
    };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 기부 거절 이벤트
export class DonationRejectedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly donationId: DonationId,
    public readonly donorId: UserId,
    public readonly adminId: string,
    public readonly reason: string
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationRejected";
    this.aggregateId = donationId.getValue();
    this.data = {
      donorId: donorId.toString(),
      adminId,
      reason,
    };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 기부 완료 이벤트
export class DonationCompletedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly donationId: DonationId,
    public readonly donorId: UserId,
    public readonly amount: DonationAmount,
    public readonly rewardPoints: number = 0
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationCompleted";
    this.aggregateId = donationId.getValue();
    this.data = {
      donorId: donorId.toString(),
      amount: amount.getValue(),
      rewardPoints,
    };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 기부 취소 이벤트
export class DonationCancelledEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly donationId: DonationId,
    public readonly reason: string
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationCancelled";
    this.aggregateId = donationId.getValue();
    this.data = { reason };
    this.version = 1;
    this.timestamp = new Date();
  }
}

/**
 * Donation Entity
 * 기부 도메인의 핵심 엔티티
 */
export class Donation extends AggregateRoot {
  constructor(
    private readonly id: DonationId,
    private readonly donorId: UserId,
    private readonly donationType: DonationType,
    private amount: DonationAmount, // mutable for updates
    private category: DonationCategory, // mutable for updates
    private description: DonationDescription, // mutable for updates
    private readonly frequency: DonationFrequency,
    private status: DonationStatus = DonationStatus.PENDING,
    private readonly metadata: DonationMetadata,
    private readonly instituteId?: InstituteId,
    private readonly opinionLeaderId?: OpinionLeaderId,
    private beneficiaryInfo?: BeneficiaryInfo, // mutable for updates
    private processingInfo: ProcessingInfo = {},
    private readonly scheduledAt?: Date,
    private completedAt?: Date,
    private cancelledAt?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    super();
    // 기부 생성 이벤트 발행
    this.addDomainEvent(
      new DonationCreatedEvent(id, donorId, donationType, amount)
    );
  }

  // === Getters ===
  getId(): DonationId {
    return this.id;
  }

  getDonorId(): UserId {
    return this.donorId;
  }

  getDonationType(): DonationType {
    return this.donationType;
  }

  getAmount(): DonationAmount {
    return this.amount;
  }

  getCategory(): DonationCategory {
    return this.category;
  }

  getDescription(): DonationDescription {
    return this.description;
  }

  getFrequency(): DonationFrequency {
    return this.frequency;
  }

  getStatus(): DonationStatus {
    return this.status;
  }

  getMetadata(): DonationMetadata {
    return { ...this.metadata };
  }

  getInstituteId(): InstituteId | undefined {
    return this.instituteId;
  }

  getOpinionLeaderId(): OpinionLeaderId | undefined {
    return this.opinionLeaderId;
  }

  getBeneficiaryInfo(): BeneficiaryInfo | undefined {
    return this.beneficiaryInfo;
  }

  getProcessingInfo(): ProcessingInfo {
    return { ...this.processingInfo };
  }

  getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  getCancelledAt(): Date | undefined {
    return this.cancelledAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // === 비즈니스 메서드들 ===

  // 기부 승인
  approve(adminId: string): Result<void> {
    if (this.status !== DonationStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending donations can be approved"),
      };
    }

    this.status = DonationStatus.APPROVED;
    this.processingInfo.approvedBy = adminId;
    this.processingInfo.approvedAt = new Date();
    this.updatedAt = new Date();

    // 승인 이벤트 발행
    this.addDomainEvent(
      new DonationApprovedEvent(this.id, this.donorId, adminId)
    );

    return { success: true, data: undefined };
  }

  // 기부 거절
  reject(adminId: string, reason: string): Result<void> {
    if (this.status !== DonationStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending donations can be rejected"),
      };
    }

    this.status = DonationStatus.REJECTED;
    this.processingInfo.rejectedBy = adminId;
    this.processingInfo.rejectedAt = new Date();
    this.processingInfo.rejectionReason = reason;
    this.updatedAt = new Date();

    // 거절 이벤트 발행
    this.addDomainEvent(
      new DonationRejectedEvent(this.id, this.donorId, adminId, reason)
    );

    return { success: true, data: undefined };
  }

  // 기부 완료
  complete(paymentId: string): Result<void> {
    if (this.status !== DonationStatus.APPROVED) {
      return {
        success: false,
        error: new Error("Only approved donations can be completed"),
      };
    }

    this.status = DonationStatus.COMPLETED;
    this.processingInfo.paymentId = paymentId;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 완료 이벤트 발행
    this.addDomainEvent(
      new DonationCompletedEvent(this.id, this.donorId, this.amount)
    );

    return { success: true, data: undefined };
  }

  // 기부 취소
  cancel(reason: string): Result<void> {
    if (this.status === DonationStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Completed donations cannot be cancelled"),
      };
    }

    this.status = DonationStatus.CANCELLED;
    this.processingInfo.cancelReason = reason;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 금액 수정 (PENDING 상태에서만)
  updateAmount(newAmount: DonationAmount): Result<void> {
    if (this.status !== DonationStatus.PENDING) {
      return {
        success: false,
        error: new Error("Amount can only be updated for pending donations"),
      };
    }

    this.amount = newAmount;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 설명 수정
  updateDescription(newDescription: DonationDescription): Result<void> {
    if (this.status === DonationStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Cannot update description of completed donations"),
      };
    }

    this.description = newDescription;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 카테고리 수정
  updateCategory(newCategory: DonationCategory): Result<void> {
    if (this.status === DonationStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Cannot update category of completed donations"),
      };
    }

    this.category = newCategory;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 수혜자 정보 수정
  updateBeneficiary(newBeneficiary: BeneficiaryInfo): Result<void> {
    if (this.status === DonationStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Cannot update beneficiary of completed donations"),
      };
    }

    this.beneficiaryInfo = newBeneficiary;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 다음 기부 실행일 계산 (정기 기부)
  getNextExecutionDate(): Date | null {
    if (
      this.frequency === DonationFrequency.ONCE ||
      this.frequency === DonationFrequency.ONE_TIME
    ) {
      return null;
    }

    const baseDate = this.scheduledAt || this.createdAt;

    switch (this.frequency) {
      case DonationFrequency.WEEKLY:
        return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      case DonationFrequency.MONTHLY:
        const nextMonth = new Date(baseDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case DonationFrequency.QUARTERLY:
        const nextQuarter = new Date(baseDate);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      case DonationFrequency.YEARLY:
        const nextYear = new Date(baseDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;
      default:
        return null;
    }
  }

  // 정기 기부 일시 중지
  pauseRecurring(): Result<void> {
    if (
      this.frequency === DonationFrequency.ONCE ||
      this.frequency === DonationFrequency.ONE_TIME
    ) {
      return {
        success: false,
        error: new Error("Cannot pause one-time donations"),
      };
    }

    this.processingInfo.isPaused = true;
    this.processingInfo.pausedAt = new Date();
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 정기 기부 재개
  resumeRecurring(): Result<void> {
    if (!this.processingInfo.isPaused) {
      return {
        success: false,
        error: new Error("Donation is not paused"),
      };
    }

    this.processingInfo.isPaused = false;
    this.processingInfo.resumedAt = new Date();
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 요약 정보
  getSummary(): DonationSummary {
    return {
      id: this.id.getValue(),
      donorId: this.donorId.toString(),
      amount: this.amount.getValue(),
      status: this.status,
      donationType: this.donationType,
      category: this.category,
      frequency: this.frequency,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
    };
  }

  // 기부 상세 정보
  getDetails(): DonationDetails {
    return {
      ...this.getSummary(),
      description: this.description.getValue(),
      beneficiaryInfo: this.beneficiaryInfo,
      metadata: this.metadata,
      processingInfo: this.processingInfo,
      instituteId: this.instituteId?.getValue(),
      opinionLeaderId: this.opinionLeaderId?.getValue(),
      scheduledAt: this.scheduledAt,
      cancelledAt: this.cancelledAt,
      updatedAt: this.updatedAt,
    };
  }

  // 기부 진행 상황
  getProgress(): DonationProgress {
    return {
      currentStatus: this.status,
      timeline: this.getTimeline(),
      nextAction: this.getNextAction(),
    };
  }

  private getTimeline(): DonationTimeline[] {
    const timeline: DonationTimeline[] = [
      {
        status: DonationStatus.PENDING,
        timestamp: this.createdAt,
        description: "기부 생성",
      },
    ];

    if (this.processingInfo.approvedAt) {
      timeline.push({
        status: DonationStatus.APPROVED,
        timestamp: this.processingInfo.approvedAt,
        description: "기부 승인",
      });
    }

    if (this.completedAt) {
      timeline.push({
        status: DonationStatus.COMPLETED,
        timestamp: this.completedAt,
        description: "기부 완료",
      });
    }

    if (this.cancelledAt) {
      timeline.push({
        status: DonationStatus.CANCELLED,
        timestamp: this.cancelledAt,
        description: "기부 취소",
      });
    }

    return timeline;
  }

  private getNextAction(): string | null {
    switch (this.status) {
      case DonationStatus.PENDING:
        return "승인 대기 중";
      case DonationStatus.APPROVED:
        return "결제 대기 중";
      case DonationStatus.COMPLETED:
        return null;
      case DonationStatus.CANCELLED:
        return null;
      case DonationStatus.REJECTED:
        return null;
      default:
        return null;
    }
  }

  // 기부 대상 검증
  validateTarget(): Result<void> {
    // 기본 검증 로직
    return { success: true, data: undefined };
  }

  // === Factory 메서드들 ===

  // 일반적인 기부 생성 (테스트용)
  static create(props: {
    id: DonationId;
    donorId: UserId;
    donationType: DonationType;
    amount: DonationAmount;
    beneficiary: BeneficiaryInfo;
    category: DonationCategory;
    description: DonationDescription;
    frequency: DonationFrequency;
    status: DonationStatus;
    scheduledAt?: Date;
  }): Result<Donation> {
    try {
      const donation = new Donation(
        props.id,
        props.donorId,
        props.donationType,
        props.amount,
        props.category,
        props.description,
        props.frequency,
        props.status,
        {
          isAnonymous: false,
          taxDeductible: true,
          receiptRequired: false,
        }, // metadata
        undefined, // instituteId
        undefined, // opinionLeaderId
        props.beneficiary,
        {}, // processingInfo
        props.scheduledAt
      );

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Donation creation failed"),
      };
    }
  }

  // 직접 기부 생성
  static createDirectDonation(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    beneficiaryInfo: BeneficiaryInfo,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    scheduledAt?: Date
  ): Result<Donation> {
    const donation = new Donation(
      DonationId.generate(),
      donorId,
      DonationType.DIRECT,
      amount,
      category,
      description,
      frequency,
      DonationStatus.PENDING,
      metadata,
      undefined,
      undefined,
      beneficiaryInfo,
      {},
      scheduledAt
    );

    const validationResult = donation.validateTarget();
    if (!validationResult.success) {
      return {
        success: false,
        error: new Error("기부 검증 실패"),
      };
    }

    return { success: true, data: donation };
  }

  // 기관 기부 생성
  static createInstituteDonation(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    instituteId: InstituteId,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    scheduledAt?: Date
  ): Result<Donation> {
    const donation = new Donation(
      DonationId.generate(),
      donorId,
      DonationType.INSTITUTE,
      amount,
      category,
      description,
      frequency,
      DonationStatus.PENDING,
      metadata,
      instituteId,
      undefined,
      undefined,
      {},
      scheduledAt
    );

    const validationResult = donation.validateTarget();
    if (!validationResult.success) {
      return {
        success: false,
        error: new Error("기부 검증 실패"),
      };
    }

    return { success: true, data: donation };
  }

  // 오피니언 리더 후원 생성
  static createOpinionLeaderSupport(
    donorId: UserId,
    amount: DonationAmount,
    category: DonationCategory,
    description: DonationDescription,
    opinionLeaderId: OpinionLeaderId,
    frequency: DonationFrequency,
    metadata: DonationMetadata,
    scheduledAt?: Date
  ): Result<Donation> {
    const donation = new Donation(
      DonationId.generate(),
      donorId,
      DonationType.OPINION_LEADER,
      amount,
      category,
      description,
      frequency,
      DonationStatus.PENDING,
      metadata,
      undefined,
      opinionLeaderId,
      undefined,
      {},
      scheduledAt
    );

    const validationResult = donation.validateTarget();
    if (!validationResult.success) {
      return {
        success: false,
        error: new Error("기부 검증 실패"),
      };
    }

    return { success: true, data: donation };
  }

  // 오피니언 리더 기부 생성 (별칭)
  static createOpinionLeaderDonation = Donation.createOpinionLeaderSupport;
}
