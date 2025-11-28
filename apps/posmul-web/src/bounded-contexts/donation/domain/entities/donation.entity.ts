/**
 * Donation Entity
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
  DonationStatus,
  DonationType,
  InstituteId,
  OpinionLeaderId,
} from "../value-objects/donation-value-objects";

// === 기부 관련 타입들 ===
interface DonationSummary {
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

interface DonationDetails extends DonationSummary {
  description: string;
  beneficiaryInfo?: BeneficiaryInfo;
  beneficiaryName?: string;
  metadata: DonationMetadata;
  processingInfo: ProcessingInfo;
  instituteId?: string;
  opinionLeaderId?: string;
  scheduledAt?: Date;
  cancelledAt?: Date;
  updatedAt: Date;
}

interface DonationProgress {
  currentStatus: DonationStatus;
  timeline: DonationTimeline[];
  nextAction: string | null;
  canModify: boolean;
  canCancel: boolean;
}

interface DonationTimeline {
  status: DonationStatus;
  timestamp: Date;
  description: string;
}

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
    private _amount: DonationAmount
  ) {
    this.id = crypto.randomUUID();
    this.type = "DonationCreated";
    this.aggregateId = donationId.getValue();
    this.data = {
      donorId: donorId.toString(),
      donationType,
      amount: _amount.getValue(),
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
  paymentId?: string; // 결제 ID
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  cancelReason?: string; // 취소 사유
  isPaused?: boolean; // 일시중지 여부 (정기 기부)
  pausedAt?: Date; // 일시중지일시
  resumedAt?: Date; // 재개일시
  [key: string]: unknown; // 확장 가능한 추가 정보
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
    private _amount: DonationAmount, // mutable for updateAmount
    private category: DonationCategory, // mutable for updateCategory
    private description: DonationDescription, // mutable for updateDescription
    private readonly frequency: DonationFrequency,
    private status: DonationStatus = DonationStatus.PENDING,
    private readonly metadata: DonationMetadata,
    private readonly instituteId?: InstituteId,
    private readonly opinionLeaderId?: OpinionLeaderId,
    private beneficiaryInfo?: BeneficiaryInfo, // mutable for updateBeneficiary
    private processingInfo: ProcessingInfo = {},
    private readonly scheduledAt?: Date,
    private completedAt?: Date,
    private cancelledAt?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    // 기부 생성 이벤트 발행
    this.addDomainEvent(
      new DonationCreatedEvent(id, donorId, donationType, this._amount)
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
    return this._amount;
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

  // 테스트 호환성을 위한 별칭
  get beneficiary(): BeneficiaryInfo | undefined {
    return this.beneficiaryInfo;
  }

  // 테스트 호환성을 위한 amount 직접 접근
  get amount(): DonationAmount {
    return this._amount;
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
  // 기부 가능 여부 확인 (PmcAmount 잔액 기준)
  canProcess(pmcBalance: number): boolean {
    return (
      this.status === DonationStatus.PENDING &&
      pmcBalance >= this._amount.getValue()
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
    return this._amount.calculateRewardPoints();
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
      new DonationCompletedEvent(this.id, this.donorId, this._amount)
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
  updateAmount(newAmount: DonationAmount | number): Result<void> {
    if (this.status !== DonationStatus.PENDING) {
      return {
        success: false,
        error: new Error("Amount can only be updated for pending donations"),
      };
    }

    if (typeof newAmount === "number") {
      const amountResult = DonationAmount.create(newAmount);
      if (amountResult.success === false) {
        return { success: false, error: amountResult.error };
      }
      this._amount = amountResult.data;
    } else {
      this._amount = newAmount;
    }

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
    if (this.frequency === DonationFrequency.ONCE) {
      return null;
    }

    const baseDate = this.scheduledAt || this.createdAt;
    const now = new Date();

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
    if (this.frequency === DonationFrequency.ONCE) {
      return {
        success: false,
        error: new Error("Cannot pause one-time donations"),
      };
    }

    this.status = DonationStatus.PAUSED;
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

    this.status = DonationStatus.PENDING;
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
      amount: this._amount.getValue(),
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
      beneficiaryName: this.beneficiaryInfo?.getName(),
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
      canModify: this.status === DonationStatus.PENDING,
      canCancel:
        this.status !== DonationStatus.COMPLETED &&
        this.status !== DonationStatus.CANCELLED,
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

  // Factory 메서드들

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
  static createDirectDonation(props: {
    donorId: UserId;
    amount: number;
    beneficiaryName: string;
    beneficiaryId: string;
    category: DonationCategory;
    description: string;
    frequency?: DonationFrequency;
  }): Result<Donation> {
    try {
      const amountResult = DonationAmount.create(props.amount);
      if (amountResult.success === false) {
        return { success: false, error: amountResult.error };
      }
      const amountVO = amountResult.data;

      const descriptionVO = DonationDescription.create(props.description);
      const beneficiaryInfo = BeneficiaryInfo.create(
        props.beneficiaryName,
        props.description,
        props.beneficiaryId
      );
      const frequency = props.frequency || DonationFrequency.ONE_TIME;

      const donation = new Donation(
        DonationId.generate(),
        props.donorId,
        DonationType.DIRECT,
        amountVO,
        props.category,
        descriptionVO,
        frequency,
        DonationStatus.PENDING,
        {
          isAnonymous: false,
          taxDeductible: true,
          receiptRequired: false,
        },
        undefined,
        undefined,
        beneficiaryInfo,
        {},
        undefined
      );

      const validationResult = donation.validateTarget();
      if (!validationResult.success) {
        return {
          success: false,
          error: new Error("기부 검증 실패"),
        };
      }

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Direct donation creation failed"),
      };
    }
  }

  // 기관 기부 생성
  static createInstituteDonation(props: {
    donorId: UserId;
    amount: number;
    instituteId: InstituteId;
    category: DonationCategory;
    description: string;
    frequency: DonationFrequency;
  }): Result<Donation> {
    try {
      const amountResult = DonationAmount.create(props.amount);
      if (amountResult.success === false) {
        return { success: false, error: amountResult.error };
      }
      const amountVO = amountResult.data;

      const descriptionVO = DonationDescription.create(props.description);
      const instituteIdVO = new InstituteId(String(props.instituteId));

      const donation = new Donation(
        DonationId.generate(),
        props.donorId,
        DonationType.INSTITUTE,
        amountVO,
        props.category,
        descriptionVO,
        props.frequency,
        DonationStatus.PENDING,
        {
          isAnonymous: false,
          taxDeductible: true,
          receiptRequired: false,
        },
        instituteIdVO,
        undefined,
        undefined,
        {},
        undefined
      );

      const validationResult = donation.validateTarget();
      if (!validationResult.success) {
        return {
          success: false,
          error: new Error("기부 검증 실패"),
        };
      }

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Institute donation creation failed"),
      };
    }
  }

  // 오피니언 리더 후원 생성
  static createOpinionLeaderSupport(props: {
    donorId: UserId;
    amount: number;
    opinionLeaderId: OpinionLeaderId;
    category: DonationCategory;
    description: string;
    frequency?: DonationFrequency;
  }): Result<Donation> {
    try {
      const amountResult = DonationAmount.create(props.amount);
      if (amountResult.success === false) {
        return { success: false, error: amountResult.error };
      }
      const amountVO = amountResult.data;

      const descriptionVO = DonationDescription.create(props.description);
      const opinionLeaderIdVO = new OpinionLeaderId(
        String(props.opinionLeaderId)
      );
      const frequency = props.frequency || DonationFrequency.ONE_TIME;

      const donation = new Donation(
        DonationId.generate(),
        props.donorId,
        DonationType.OPINION_LEADER,
        amountVO,
        props.category,
        descriptionVO,
        frequency,
        DonationStatus.PENDING,
        {
          isAnonymous: false,
          taxDeductible: true,
          receiptRequired: false,
        },
        undefined,
        opinionLeaderIdVO,
        undefined,
        {},
        undefined
      );

      const validationResult = donation.validateTarget();
      if (!validationResult.success) {
        return {
          success: false,
          error: new Error("기부 검증 실패"),
        };
      }

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("Opinion leader donation creation failed"),
      };
    }
  }

  // 오피니언 리더 기부 생성 (별칭)
  static createOpinionLeaderDonation = Donation.createOpinionLeaderSupport;

  // DB 데이터로부터 엔티티 재구성
  static reconstitute(data: any): Donation {
    const donation = new Donation(
      new DonationId(data.id),
      data.donor_id as UserId,
      data.donation_type as DonationType,
      (() => {
        const amountResult = DonationAmount.create(Number(data.amount));
        if (amountResult.success) {
          return amountResult.data;
        } else {
          throw (amountResult as any).error;
        }
      })(),
      data.category as DonationCategory,
      new DonationDescription(data.description || ""),
      (data.frequency || DonationFrequency.ONCE) as DonationFrequency,
      data.status as DonationStatus,
      data.metadata || {
        isAnonymous: false,
        taxDeductible: false,
        receiptRequired: false,
      },
      data.institute_id ? new InstituteId(data.institute_id) : undefined,
      data.opinion_leader_id ? new OpinionLeaderId(data.opinion_leader_id) : undefined,
      data.beneficiary_info ? new BeneficiaryInfo(data.beneficiary_info.name, data.beneficiary_info.description || "", data.beneficiary_info.contact) : undefined,
      data.processing_info || {},
      data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      data.completed_at ? new Date(data.completed_at) : undefined,
      data.cancelled_at ? new Date(data.cancelled_at) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    // 재구성 시에는 이벤트 초기화
    donation.clearDomainEvents();
    return donation;
  }
}
