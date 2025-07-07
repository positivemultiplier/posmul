// CrowdFunding Aggregate Root - 크라우드 펀딩 관리 (Cloud Funding)
// UTF-8 인코딩

import type { Result } from "@posmul/auth-economy-sdk";
import type { isSuccess } from "@posmul/auth-economy-sdk";
import type { DomainEvent } from "@posmul/auth-economy-sdk";
import {
  CrowdFundingId,
  FundingCategory,
  FundingStatus,
  FundingGoal
} from '../value-objects/investment-value-objects';
import type { UserId } from "@posmul/auth-economy-sdk";

// CrowdFunding 도메인 이벤트
export class CrowdFundingCreatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'CrowdFundingCreated';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly fundingId: string,
    public readonly title: string,
    public readonly category: FundingCategory,
    public readonly goal: number,
    public readonly creatorId: string
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = fundingId;
    this.timestamp = new Date();
    this.data = {
      fundingId,
      title,
      category,
      goal,
      creatorId
    };
  }
}

export class CrowdFundingInvestmentEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'CrowdFundingInvestment';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly fundingId: string,
    public readonly investorId: string,
    public readonly amount: number,
    public readonly currentTotal: number
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = fundingId;
    this.timestamp = new Date();
    this.data = {
      fundingId,
      investorId,
      amount,
      currentTotal
    };
  }
}

export class CrowdFundingCompletedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'CrowdFundingCompleted';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly fundingId: string,
    public readonly finalAmount: number,
    public readonly totalInvestors: number,
    public readonly success: boolean
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = fundingId;
    this.timestamp = new Date();
    this.data = {
      fundingId,
      finalAmount,
      totalInvestors,
      success
    };
  }
}

// 투자 기록
export interface InvestmentRecord {
  investorId: UserId;
  amount: number; // 투자 금액 (원)
  investedAt: Date;
  refunded: boolean;
  refundedAt?: Date;
  message?: string; // 응원 메시지
}

// 프로젝트 업데이트
export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  imageUrls?: string[];
  publishedAt: Date;
}

// CrowdFunding Aggregate Root
export class CrowdFunding {
  private domainEvents: DomainEvent[] = [];
  private investments: InvestmentRecord[] = [];
  private updates: ProjectUpdate[] = [];

  private constructor(
    private readonly id: CrowdFundingId,
    private readonly title: string,
    private readonly description: string,
    private readonly category: FundingCategory,
    private readonly goal: FundingGoal,
    private readonly startDate: Date,
    private readonly endDate: Date,
    private status: FundingStatus,
    private readonly creatorId: UserId,
    private readonly imageUrls: string[],
    private readonly rewardTiers: RewardTier[],
    private readonly createdAt: Date,
    private updatedAt: Date,
    private completedAt?: Date,
    private readonly metadata: Record<string, unknown> = {}
  ) {}

  // 새 크라우드 펀딩 생성
  static create(
    title: string,
    description: string,
    category: FundingCategory,
    goal: FundingGoal,
    startDate: Date,
    endDate: Date,
    creatorId: UserId,
    imageUrls: string[] = [],
    rewardTiers: RewardTier[] = [],
    metadata: Record<string, unknown> = {}
  ): Result<CrowdFunding> {
    // 검증
    if (!title || title.trim().length === 0) {
      return { success: false, error: new Error('Title cannot be empty') };
    }

    if (!description || description.trim().length === 0) {
      return { success: false, error: new Error('Description cannot be empty') };
    }

    if (startDate >= endDate) {
      return { success: false, error: new Error('Start date must be before end date') };
    }

    if (endDate <= new Date()) {
      return { success: false, error: new Error('End date must be in the future') };
    }

    const id = CrowdFundingId.generate();
    const now = new Date();

    const crowdFunding = new CrowdFunding(
      id,
      title.trim(),
      description.trim(),
      category,
      goal,
      startDate,
      endDate,
      FundingStatus.DRAFT,
      creatorId,
      imageUrls,
      rewardTiers,
      now,
      now,
      undefined,
      metadata
    );

    // 도메인 이벤트 발행
    crowdFunding.addDomainEvent(new CrowdFundingCreatedEvent(
      id.getValue(),
      title.trim(),
      category,
      goal.getTargetAmount(),
      creatorId
    ));

    return { success: true, data: crowdFunding };
  }

  // 펀딩 시작 (게시)
  launch(): Result<void> {
    if (this.status !== FundingStatus.DRAFT) {
      return { success: false, error: new Error('Only draft fundings can be launched') };
    }

    if (new Date() < this.startDate) {
      return { success: false, error: new Error('Cannot launch before start date') };
    }

    this.status = FundingStatus.ACTIVE;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 투자하기
  invest(investorId: UserId, amount: number, message?: string): Result<void> {
    if (this.status !== FundingStatus.ACTIVE) {
      return { success: false, error: new Error('Funding is not active') };
    }

    if (new Date() > this.endDate) {
      return { success: false, error: new Error('Funding period has ended') };
    }

    if (amount < 1000) {
      return { success: false, error: new Error('Minimum investment amount is 1,000 KRW') };
    }

    if (amount % 1000 !== 0) {
      return { success: false, error: new Error('Investment amount must be in 1,000 KRW units') };
    }

    // 목표 금액 초과 방지
    const currentAmount = this.getCurrentAmount();
    if (currentAmount + amount > this.goal.getTargetAmount()) {
      return { success: false, error: new Error('Investment would exceed funding goal') };
    }

    // 투자 기록 추가
    const investment: InvestmentRecord = {
      investorId,
      amount,
      investedAt: new Date(),
      refunded: false,
      message: message?.trim()
    };

    this.investments.push(investment);
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(new CrowdFundingInvestmentEvent(
      this.id.getValue(),
      investorId,
      amount,
      this.getCurrentAmount()
    ));

    // 목표 달성 확인
    if (this.getCurrentAmount() >= this.goal.getTargetAmount()) {
      this.completeSuccess();
    }

    return { success: true, data: undefined };
  }

  // 펀딩 성공 완료
  private completeSuccess(): void {
    this.status = FundingStatus.SUCCESS;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(new CrowdFundingCompletedEvent(
      this.id.getValue(),
      this.getCurrentAmount(),
      this.getInvestorCount(),
      true
    ));
  }

  // 펀딩 실패 처리
  completeFailed(): Result<void> {
    if (this.status !== FundingStatus.ACTIVE) {
      return { success: false, error: new Error('Only active fundings can be marked as failed') };
    }

    if (new Date() <= this.endDate) {
      return { success: false, error: new Error('Cannot mark as failed before end date') };
    }

    this.status = FundingStatus.FAILED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 모든 투자를 환불 처리
    this.investments.forEach(investment => {
      investment.refunded = true;
      investment.refundedAt = new Date();
    });

    this.addDomainEvent(new CrowdFundingCompletedEvent(
      this.id.getValue(),
      this.getCurrentAmount(),
      this.getInvestorCount(),
      false
    ));

    return { success: true, data: undefined };
  }

  // 펀딩 취소
  cancel(): Result<void> {
    if (this.status === FundingStatus.SUCCESS || this.status === FundingStatus.FAILED) {
      return { success: false, error: new Error('Cannot cancel completed funding') };
    }

    this.status = FundingStatus.CANCELLED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    // 모든 투자를 환불 처리
    this.investments.forEach(investment => {
      investment.refunded = true;
      investment.refundedAt = new Date();
    });

    return { success: true, data: undefined };
  }

  // 프로젝트 업데이트 추가
  addUpdate(title: string, content: string, imageUrls: string[] = []): Result<void> {
    if (this.status !== FundingStatus.ACTIVE && this.status !== FundingStatus.SUCCESS) {
      return { success: false, error: new Error('Can only add updates to active or successful fundings') };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: new Error('Update title cannot be empty') };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: new Error('Update content cannot be empty') };
    }

    const update: ProjectUpdate = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      imageUrls,
      publishedAt: new Date()
    };

    this.updates.push(update);
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 현재 펀딩 금액
  getCurrentAmount(): number {
    return this.investments
      .filter(investment => !investment.refunded)
      .reduce((total, investment) => total + investment.amount, 0);
  }

  // 목표 달성률
  getAchievementRate(): number {
    const current = this.getCurrentAmount();
    const target = this.goal.getTargetAmount();
    return target > 0 ? (current / target) * 100 : 0;
  }

  // 투자자 수
  getInvestorCount(): number {
    const uniqueInvestors = new Set(
      this.investments
        .filter(investment => !investment.refunded)
        .map(investment => investment.investorId)
    );
    return uniqueInvestors.size;
  }

  // 남은 시간 (일)
  getDaysRemaining(): number {
    const now = new Date();
    if (now > this.endDate) return 0;
    
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
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
  getId(): CrowdFundingId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): FundingCategory {
    return this.category;
  }

  getGoal(): FundingGoal {
    return this.goal;
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  getStatus(): FundingStatus {
    return this.status;
  }

  getCreatorId(): UserId {
    return this.creatorId;
  }

  getImageUrls(): string[] {
    return [...this.imageUrls];
  }

  getRewardTiers(): RewardTier[] {
    return [...this.rewardTiers];
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

  getMetadata(): Record<string, unknown> {
    return { ...this.metadata };
  }

  getInvestments(): InvestmentRecord[] {
    return [...this.investments];
  }

  getUpdates(): ProjectUpdate[] {
    return [...this.updates];
  }

  // 비즈니스 로직 메서드들
  isDraft(): boolean {
    return this.status === FundingStatus.DRAFT;
  }

  isActive(): boolean {
    return this.status === FundingStatus.ACTIVE;
  }

  isSuccess(): boolean {
    return this.status === FundingStatus.SUCCESS;
  }

  isFailed(): boolean {
    return this.status === FundingStatus.FAILED;
  }

  isCancelled(): boolean {
    return this.status === FundingStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.isSuccess() || this.isFailed() || this.isCancelled();
  }

  canInvest(): boolean {
    return this.isActive() && new Date() <= this.endDate;
  }

  hasUserInvested(userId: UserId): boolean {
    return this.investments.some(
      investment => investment.investorId === userId && !investment.refunded
    );
  }

  getUserInvestmentAmount(userId: UserId): number {
    return this.investments
      .filter(investment => investment.investorId === userId && !investment.refunded)
      .reduce((total, investment) => total + investment.amount, 0);
  }

  // 통계 정보
  getStatistics(): {
    currentAmount: number;
    targetAmount: number;
    achievementRate: number;
    investorCount: number;
    daysRemaining: number;
    averageInvestment: number;
    totalUpdates: number;
  } {
    const investorCount = this.getInvestorCount();
    const currentAmount = this.getCurrentAmount();

    return {
      currentAmount,
      targetAmount: this.goal.getTargetAmount(),
      achievementRate: this.getAchievementRate(),
      investorCount,
      daysRemaining: this.getDaysRemaining(),
      averageInvestment: investorCount > 0 ? currentAmount / investorCount : 0,
      totalUpdates: this.updates.length
    };
  }
}

// 보상 티어 인터페이스
export interface RewardTier {
  id: string;
  name: string;
  description: string;
  minimumAmount: number;
  estimatedDelivery?: Date;
  limitedQuantity?: number;
  remainingQuantity?: number;
}
