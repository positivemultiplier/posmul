/**
 * Donation Entity
 * 기부 엔티티 - 모든 기부 활동의 루트 애그리거트
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";
import { DomainEvent } from "@posmul/auth-economy-sdk";
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
} from "../value-objects/donation-value-objects";

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
    public readonly rewardPoints: number
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

// 기부 메타데이터
export interface DonationMetadata {
  isAnonymous: boolean;
  message?: string;
  dedicatedTo?: string;
  taxDeductible: boolean;
  receiptRequired: boolean;
}

// 기부 처리 정보
export interface ProcessingInfo {
  processedAt?: Date;
  processedBy?: string;
  transactionId?: string;
  receiptUrl?: string;
}

/**
 * Donation Entity
 * 기부를 나타내는 루트 애그리거트
 */
export class Donation {
  private events: DomainEvent[] = [];

  constructor(
    private readonly id: DonationId,
    private readonly donorId: UserId,
    private readonly donationType: DonationType,
    private readonly amount: DonationAmount,
    private readonly category: DonationCategory,
    private readonly description: DonationDescription,
    private readonly frequency: DonationFrequency,
    private status: DonationStatus = DonationStatus.PENDING,
    private readonly metadata: DonationMetadata,
    private readonly instituteId?: InstituteId,
    private readonly opinionLeaderId?: OpinionLeaderId,
    private readonly beneficiaryInfo?: BeneficiaryInfo,
    private processingInfo: ProcessingInfo = {},
    private readonly scheduledAt?: Date,
    private completedAt?: Date,
    private cancelledAt?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    // 기부 생성 이벤트 발행
    this.addDomainEvent(
      new DonationCreatedEvent(id, donorId, donationType, amount)
    );
  }

  // Getters
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
    return this.scheduledAt ? new Date(this.scheduledAt) : undefined;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt ? new Date(this.completedAt) : undefined;
  }

  getCancelledAt(): Date | undefined {
    return this.cancelledAt ? new Date(this.cancelledAt) : undefined;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // 기부 처리 시작
  startProcessing(transactionId: string): Result<void> {
    if (this.status !== DonationStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending donations can be processed"),
      };
    }

    this.status = DonationStatus.PROCESSING;
    this.processingInfo = {
      ...this.processingInfo,
      transactionId,
      processedAt: new Date(),
    };
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 완료
  complete(receiptUrl?: string): Result<void> {
    if (this.status !== DonationStatus.PROCESSING) {
      return {
        success: false,
        error: new Error("Only processing donations can be completed"),
      };
    }

    this.status = DonationStatus.COMPLETED;
    this.completedAt = new Date();
    this.processingInfo = {
      ...this.processingInfo,
      receiptUrl,
    };
    this.updatedAt = new Date();

    // 보상 포인트 계산
    const rewardPoints = this.amount.calculateRewardPoints();

    // 기부 완료 이벤트 발행
    this.addDomainEvent(
      new DonationCompletedEvent(
        this.id,
        this.donorId,
        this.amount,
        rewardPoints
      )
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

    if (this.status === DonationStatus.CANCELLED) {
      return {
        success: false,
        error: new Error("Donation is already cancelled"),
      };
    }

    this.status = DonationStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();

    // 기부 취소 이벤트 발행
    this.addDomainEvent(new DonationCancelledEvent(this.id, reason));

    return { success: true, data: undefined };
  }
  // 기부 실패 처리
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fail(_reason: string): Result<void> {
    if (this.status !== DonationStatus.PROCESSING) {
      return {
        success: false,
        error: new Error("Only processing donations can fail"),
      };
    }

    this.status = DonationStatus.FAILED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 처리 정보 업데이트
  updateProcessingInfo(info: Partial<ProcessingInfo>): Result<void> {
    if (
      this.status === DonationStatus.COMPLETED ||
      this.status === DonationStatus.CANCELLED
    ) {
      return {
        success: false,
        error: new Error(
          "Cannot update processing info for completed or cancelled donations"
        ),
      };
    }

    this.processingInfo = {
      ...this.processingInfo,
      ...info,
    };
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }
  // 기부 가능 여부 확인 (PMC 잔액 기준)
  canProcess(pmcBalance: number): boolean {
    return (
      this.status === DonationStatus.PENDING &&
      pmcBalance >= this.amount.getValue()
    );
  }

  // 완료된 기부 여부
  isCompleted(): boolean {
    return this.status === DonationStatus.COMPLETED;
  }

  // 취소된 기부 여부
  isCancelled(): boolean {
    return this.status === DonationStatus.CANCELLED;
  }

  // 실패한 기부 여부
  isFailed(): boolean {
    return this.status === DonationStatus.FAILED;
  }

  // 정기 기부 여부
  isRecurring(): boolean {
    return this.frequency !== DonationFrequency.ONE_TIME;
  }

  // 익명 기부 여부
  isAnonymous(): boolean {
    return this.metadata.isAnonymous;
  }

  // 세금 공제 가능 여부
  isTaxDeductible(): boolean {
    return this.metadata.taxDeductible;
  }

  // 영수증 필요 여부
  requiresReceipt(): boolean {
    return this.metadata.receiptRequired;
  }

  // 예약된 기부 여부
  isScheduled(): boolean {
    return this.scheduledAt !== undefined;
  }

  // 기부 대상 검증
  validateTarget(): Result<void> {
    switch (this.donationType) {
      case DonationType.DIRECT:
        if (!this.beneficiaryInfo) {
          return {
            success: false,
            error: new Error(
              "Beneficiary info is required for direct donations"
            ),
          };
        }
        break;
      case DonationType.INSTITUTE:
        if (!this.instituteId) {
          return {
            success: false,
            error: new Error(
              "Institute ID is required for institute donations"
            ),
          };
        }
        break;
      case DonationType.OPINION_LEADER:
        if (!this.opinionLeaderId) {
          return {
            success: false,
            error: new Error(
              "Opinion leader ID is required for opinion leader support"
            ),
          };
        }
        break;
      default:
        return { success: false, error: new Error("Invalid donation type") };
    }

    return { success: true, data: undefined };
  }

  // 보상 포인트 계산
  calculateRewardPoints(): number {
    return this.amount.calculateRewardPoints();
  }

  // 도메인 이벤트 관리
  private addDomainEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.events];
  }

  clearDomainEvents(): void {
    this.events = [];
  }

  // 동등성 비교
  equals(other: Donation): boolean {
    return this.id.equals(other.id);
  }

  // Factory 메서드들

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
      return validationResult;
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
      return validationResult;
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
      return validationResult;
    }

    return { success: true, data: donation };
  }
}
