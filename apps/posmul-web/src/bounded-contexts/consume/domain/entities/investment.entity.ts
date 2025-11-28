// Investment Entity - 사용자의 투자/참여 기록
// utf-8-sig 인코딩
import type { Result } from "@posmul/auth-economy-sdk";
import type { DomainEvent } from "@posmul/auth-economy-sdk";
import type { UserId } from "@posmul/auth-economy-sdk";

import {
  AdvertisementId,
  CrowdFundingId,
  InvestmentId,
  InvestmentStatus,
  InvestmentType,
  MerchantId,
} from "../value-objects/investment-value-objects";

// Investment 도메인 이벤트
export class InvestmentCreatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "InvestmentCreated";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly investmentId: string,
    public readonly userId: string,
    public readonly investmentType: InvestmentType,
    public readonly targetId: string,
    public readonly amount: number
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = investmentId;
    this.timestamp = new Date();
    this.data = {
      investmentId,
      userId,
      investmentType,
      targetId,
      amount,
    };
  }
}

export class InvestmentCompletedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "InvestmentCompleted";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly investmentId: string,
    public readonly pmcEarned: number,
    public readonly pmpEarned: number
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = investmentId;
    this.timestamp = new Date();
    this.data = {
      investmentId,
      pmcEarned,
      pmpEarned,
    };
  }
}

export class InvestmentRefundedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "InvestmentRefunded";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly investmentId: string,
    public readonly refundAmount: number,
    public readonly reason: string
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = investmentId;
    this.timestamp = new Date();
    this.data = {
      investmentId,
      refundAmount,
      reason,
    };
  }
}

// Investment Entity
export class Investment {
  private domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly id: InvestmentId,
    private readonly userId: UserId,
    private readonly type: InvestmentType,
    private readonly targetId: string, // MerchantId | AdvertisementId | CrowdFundingId
    private readonly amount: number, // 투자/결제 금액 (원)
    private status: InvestmentStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private completedAt?: Date,
    private refundedAt?: Date,
    private pmcEarned: number = 0,
    private pmpEarned: number = 0,
    private readonly metadata: Record<string, unknown> = {}
  ) {}

  // 새 투자 생성
  static create(
    userId: UserId,
    type: InvestmentType,
    targetId: string,
    amount: number,
    metadata: Record<string, unknown> = {}
  ): Result<Investment> {
    // 검증
    if (amount < 0) {
      return {
        success: false,
        error: new Error("Investment amount cannot be negative"),
      };
    }

    // 타입별 최소 금액 검증
    if (type === InvestmentType.CLOUD_FUNDING && amount < 1000) {
      return {
        success: false,
        error: new Error("Minimum cloud funding amount is 1,000 KRW"),
      };
    }

    if (type === InvestmentType.LOCAL_LEAGUE && amount < 1000) {
      return {
        success: false,
        error: new Error("Minimum local league payment is 1,000 KRW"),
      };
    }

    const id = InvestmentId.generate();
    const now = new Date();

    const investment = new Investment(
      id,
      userId,
      type,
      targetId,
      amount,
      InvestmentStatus.PENDING,
      now,
      now,
      undefined,
      undefined,
      0,
      0,
      metadata
    );

    // 도메인 이벤트 발행
    investment.addDomainEvent(
      new InvestmentCreatedEvent(id.getValue(), userId, type, targetId, amount)
    );

    return { success: true, data: investment };
  }

  // Local League 결제 완료 처리
  completeLocalLeaguePayment(pmcRate: number = 0.01): Result<void> {
    if (this.type !== InvestmentType.LOCAL_LEAGUE) {
      return { success: false, error: new Error("Not a local league payment") };
    }

    if (this.status !== InvestmentStatus.PENDING) {
      return {
        success: false,
        error: new Error("Investment is not in pending status"),
      };
    }

    // PmcAmount 적립 계산 (결제 금액의 1%)
    this.pmcEarned = Math.floor(this.amount * pmcRate);
    this.status = InvestmentStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new InvestmentCompletedEvent(
        this.id.getValue(),
        this.pmcEarned,
        this.pmpEarned
      )
    );

    return { success: true, data: undefined };
  }

  // Major League 광고 시청 완료 처리
  completeMajorLeagueViewing(pmcEarned: number): Result<void> {
    if (this.type !== InvestmentType.MAJOR_LEAGUE) {
      return {
        success: false,
        error: new Error("Not a major league activity"),
      };
    }

    if (this.status !== InvestmentStatus.PENDING) {
      return {
        success: false,
        error: new Error("Investment is not in pending status"),
      };
    }

    this.pmcEarned = pmcEarned;
    this.status = InvestmentStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new InvestmentCompletedEvent(
        this.id.getValue(),
        this.pmcEarned,
        this.pmpEarned
      )
    );

    return { success: true, data: undefined };
  }

  // Cloud Funding 투자 완료 처리
  completeCloudFundingInvestment(): Result<void> {
    if (this.type !== InvestmentType.CLOUD_FUNDING) {
      return {
        success: false,
        error: new Error("Not a cloud funding investment"),
      };
    }

    if (this.status !== InvestmentStatus.PENDING) {
      return {
        success: false,
        error: new Error("Investment is not in pending status"),
      };
    }

    // 크라우드 펀딩은 실제 투자이므로 PmcAmount/PmpAmount 적립 없음
    this.status = InvestmentStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new InvestmentCompletedEvent(
        this.id.getValue(),
        this.pmcEarned,
        this.pmpEarned
      )
    );

    return { success: true, data: undefined };
  }

  // 투자 취소
  cancel(): Result<void> {
    if (this.status !== InvestmentStatus.PENDING) {
      return {
        success: false,
        error: new Error("Can only cancel pending investments"),
      };
    }

    this.status = InvestmentStatus.CANCELLED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 투자 환불
  refund(reason: string): Result<void> {
    if (this.status !== InvestmentStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Can only refund completed investments"),
      };
    }

    if (
      this.type === InvestmentType.LOCAL_LEAGUE ||
      this.type === InvestmentType.MAJOR_LEAGUE
    ) {
      return {
        success: false,
        error: new Error(
          "Local League payments and Major League activities cannot be refunded"
        ),
      };
    }

    this.status = InvestmentStatus.REFUNDED;
    this.refundedAt = new Date();
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new InvestmentRefundedEvent(this.id.getValue(), this.amount, reason)
    );

    return { success: true, data: undefined };
  }

  // 이벤트 기간 추가 PmcAmount 적립
  addEventBonus(bonusPmc: number): Result<void> {
    if (this.status !== InvestmentStatus.COMPLETED) {
      return {
        success: false,
        error: new Error("Can only add bonus to completed investments"),
      };
    }

    if (bonusPmc < 0) {
      return {
        success: false,
        error: new Error("Bonus PmcAmount cannot be negative"),
      };
    }

    this.pmcEarned += bonusPmc;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 도메인 이벤트 관리
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Getter 메서드들
  getId(): InvestmentId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getType(): InvestmentType {
    return this.type;
  }

  getTargetId(): string {
    return this.targetId;
  }

  getAmount(): number {
    return this.amount;
  }

  getStatus(): InvestmentStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  getRefundedAt(): Date | undefined {
    return this.refundedAt;
  }

  getPmcEarned(): number {
    return this.pmcEarned;
  }

  getPmpEarned(): number {
    return this.pmpEarned;
  }

  getMetadata(): Record<string, unknown> {
    return { ...this.metadata };
  }

  // 비즈니스 로직 메서드들
  isPending(): boolean {
    return this.status === InvestmentStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === InvestmentStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === InvestmentStatus.CANCELLED;
  }

  isRefunded(): boolean {
    return this.status === InvestmentStatus.REFUNDED;
  }

  canCancel(): boolean {
    return this.isPending();
  }

  canRefund(): boolean {
    return this.isCompleted() && this.type === InvestmentType.CLOUD_FUNDING;
  }

  hasEarnedRewards(): boolean {
    return this.pmcEarned > 0 || this.pmpEarned > 0;
  }

  getTotalRewardsEarned(): number {
    return this.pmcEarned + this.pmpEarned;
  }

  // 투자 타입별 세부 정보
  getTargetIdAsString(): string {
    return this.targetId;
  }

  getMerchantId(): MerchantId | null {
    if (this.type === InvestmentType.LOCAL_LEAGUE) {
      const result = MerchantId.create(this.targetId);
      return result.success ? result.data : null;
    }
    return null;
  }

  getAdvertisementId(): AdvertisementId | null {
    if (this.type === InvestmentType.MAJOR_LEAGUE) {
      const result = AdvertisementId.create(this.targetId);
      return result.success ? result.data : null;
    }
    return null;
  }

  getCrowdFundingId(): CrowdFundingId | null {
    if (this.type === InvestmentType.CLOUD_FUNDING) {
      const result = CrowdFundingId.create(this.targetId);
      return result.success ? result.data : null;
    }
    return null;
  }

  // 통계 정보
  getInvestmentSummary(): {
    type: InvestmentType;
    amount: number;
    pmcEarned: number;
    pmpEarned: number;
    totalRewards: number;
    status: InvestmentStatus;
    daysSinceCreated: number;
    daysSinceCompleted?: number;
  } {
    const now = new Date();
    const daysSinceCreated = Math.floor(
      (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceCompleted = this.completedAt
      ? Math.floor(
          (now.getTime() - this.completedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : undefined;

    return {
      type: this.type,
      amount: this.amount,
      pmcEarned: this.pmcEarned,
      pmpEarned: this.pmpEarned,
      totalRewards: this.getTotalRewardsEarned(),
      status: this.status,
      daysSinceCreated,
      daysSinceCompleted,
    };
  }
}
