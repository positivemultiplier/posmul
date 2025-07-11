// Advertisement Aggregate Root - 광고 관리 (Major League)
// UTF-8 인코딩

import type { Result } from "@posmul/auth-economy-sdk";

import type { DomainEvent } from "@posmul/auth-economy-sdk";
import {
  AdvertisementId,
  AdvertisementCategory,
  AdvertisementStatus,
  ViewingDuration,
  RewardRate
} from '../value-objects/investment-value-objects';
import type { UserId } from "@posmul/auth-economy-sdk";

// Advertisement 도메인 이벤트
export class AdvertisementCreatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'AdvertisementCreated';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly advertisementId: string,
    public readonly title: string,
    public readonly category: AdvertisementCategory,
    public readonly advertiserId: string
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = advertisementId;
    this.timestamp = new Date();
    this.data = {
      advertisementId,
      title,
      category,
      advertiserId
    };
  }
}

export class AdvertisementViewedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'AdvertisementViewed';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly advertisementId: string,
    public readonly viewerId: string,
    public readonly duration: number,
    public readonly pmcEarned: number
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = advertisementId;
    this.timestamp = new Date();
    this.data = {
      advertisementId,
      viewerId,
      duration,
      pmcEarned
    };
  }
}

export class AdvertisementCompletedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = 'AdvertisementCompleted';
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly advertisementId: string,
    public readonly viewerId: string,
    public readonly totalDuration: number,
    public readonly bonusPmcEarned: number
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = advertisementId;
    this.timestamp = new Date();
    this.data = {
      advertisementId,
      viewerId,
      totalDuration,
      bonusPmcEarned
    };
  }
}

// Advertisement 시청 기록
export interface ViewingRecord {
  viewerId: UserId;
  startedAt: Date;
  duration: ViewingDuration;
  completed: boolean;
  rating?: number;
  feedback?: string;
  pmcEarned: number;
}

// Advertisement Aggregate Root
export class Advertisement {
  private domainEvents: DomainEvent[] = [];
  private viewingRecords: ViewingRecord[] = [];

  private constructor(
    private readonly id: AdvertisementId,
    private readonly title: string,
    private readonly description: string,
    private readonly category: AdvertisementCategory,
    private readonly contentUrl: string,
    private readonly thumbnailUrl: string,
    private readonly duration: ViewingDuration, // 총 광고 시간
    private readonly targetAudience: string[], // 타겟 오디언스
    private readonly rewardRate: RewardRate, // 시청 보상율
    private status: AdvertisementStatus,
    private readonly advertiserId: UserId, // 광고주
    private readonly createdAt: Date,
    private updatedAt: Date,
    private publishedAt?: Date,
    private readonly metadata: Record<string, unknown> = {}
  ) {}

  // 새 광고 생성
  static create(
    title: string,
    description: string,
    category: AdvertisementCategory,
    contentUrl: string,
    thumbnailUrl: string,
    duration: ViewingDuration,
    targetAudience: string[],
    rewardRate: RewardRate,
    advertiserId: UserId,
    metadata: Record<string, unknown> = {}
  ): Result<Advertisement> {
    // 검증
    if (!title || title.trim().length === 0) {
      return { success: false, error: new Error('Title cannot be empty') };
    }

    if (!description || description.trim().length === 0) {
      return { success: false, error: new Error('Description cannot be empty') };
    }

    if (!contentUrl || !thumbnailUrl) {
      return { success: false, error: new Error('Content URL and thumbnail URL are required') };
    }

    if (targetAudience.length === 0) {
      return { success: false, error: new Error('Target audience must be specified') };
    }

    const id = AdvertisementId.generate();
    const now = new Date();

    const advertisement = new Advertisement(
      id,
      title.trim(),
      description.trim(),
      category,
      contentUrl,
      thumbnailUrl,
      duration,
      targetAudience,
      rewardRate,
      AdvertisementStatus.DRAFT,
      advertiserId,
      now,
      now,
      undefined,
      metadata
    );

    // 도메인 이벤트 발행
    advertisement.addDomainEvent(new AdvertisementCreatedEvent(
      id.getValue(),
      title.trim(),
      category,
      advertiserId
    ));

    return { success: true, data: advertisement };
  }

  // 광고 게시
  publish(): Result<void> {
    if (this.status !== AdvertisementStatus.DRAFT) {
      return { success: false, error: new Error('Only draft advertisements can be published') };
    }

    this.status = AdvertisementStatus.PUBLISHED;
    this.publishedAt = new Date();
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 광고 시청 시작
  startViewing(viewerId: UserId): Result<void> {
    if (this.status !== AdvertisementStatus.PUBLISHED) {
      return { success: false, error: new Error('Advertisement is not published') };
    }

    // 이미 시청 중인지 확인
    const existingRecord = this.viewingRecords.find(
      record => record.viewerId === viewerId && !record.completed
    );

    if (existingRecord) {
      return { success: false, error: new Error('User is already viewing this advertisement') };
    }

    return { success: true, data: undefined };
  }

  // 광고 시청 완료/중단
  completeViewing(
    viewerId: UserId,
    actualDuration: ViewingDuration,
    completed: boolean,
    rating?: number,
    feedback?: string
  ): Result<number> {
    if (this.status !== AdvertisementStatus.PUBLISHED) {
      return { success: false, error: new Error('Advertisement is not published') };
    }

    // PmcAmount 계산
    const basePmc = this.calculateBasePmc(actualDuration);
    let totalPmc = basePmc;

    // 완전 시청 보너스 (30초 이상 시청 시 1.5배)
    if (completed && actualDuration.getSeconds() >= 30) {
      totalPmc = Math.floor(basePmc * 1.5);
    }

    // 평가 보너스 (평점 제공 시 추가 포인트)
    if (rating && rating >= 1 && rating <= 5) {
      totalPmc += 5; // 평점 제공 시 5 PmcAmount 추가
    }

    // 피드백 보너스 (댓글 작성 시 추가 포인트)
    if (feedback && feedback.trim().length >= 10) {
      totalPmc += 10; // 10자 이상 피드백 시 10 PmcAmount 추가
    }

    // 시청 기록 추가
    const viewingRecord: ViewingRecord = {
      viewerId,
      startedAt: new Date(),
      duration: actualDuration,
      completed,
      rating,
      feedback,
      pmcEarned: totalPmc
    };

    this.viewingRecords.push(viewingRecord);

    // 도메인 이벤트 발행
    if (completed) {
      this.addDomainEvent(new AdvertisementCompletedEvent(
        this.id.getValue(),
        viewerId,
        actualDuration.getSeconds(),
        totalPmc - basePmc // 보너스 PmcAmount
      ));
    } else {
      this.addDomainEvent(new AdvertisementViewedEvent(
        this.id.getValue(),
        viewerId,
        actualDuration.getSeconds(),
        totalPmc
      ));
    }

    return { success: true, data: totalPmc };
  }

  // 광고 비활성화
  deactivate(): Result<void> {
    if (this.status === AdvertisementStatus.ARCHIVED) {
      return { success: false, error: new Error('Advertisement is already archived') };
    }

    this.status = AdvertisementStatus.ARCHIVED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // PmcAmount 계산 (1분당 10 PmcAmount)
  private calculateBasePmc(duration: ViewingDuration): number {
    const minutes = Math.floor(duration.getSeconds() / 60);
    const remainingSeconds = duration.getSeconds() % 60;
    
    let pmc = minutes * 10; // 완전한 분에 대해 10 PmcAmount
    
    // 30초 이상의 나머지 시간에 대해 5 PmcAmount
    if (remainingSeconds >= 30) {
      pmc += 5;
    }
    
    return pmc;
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
  getId(): AdvertisementId {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): AdvertisementCategory {
    return this.category;
  }

  getContentUrl(): string {
    return this.contentUrl;
  }

  getThumbnailUrl(): string {
    return this.thumbnailUrl;
  }

  getDuration(): ViewingDuration {
    return this.duration;
  }

  getTargetAudience(): string[] {
    return [...this.targetAudience];
  }

  getRewardRate(): RewardRate {
    return this.rewardRate;
  }

  getStatus(): AdvertisementStatus {
    return this.status;
  }

  getAdvertiserId(): UserId {
    return this.advertiserId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getPublishedAt(): Date | undefined {
    return this.publishedAt;
  }

  getMetadata(): Record<string, unknown> {
    return { ...this.metadata };
  }

  getViewingRecords(): ViewingRecord[] {
    return [...this.viewingRecords];
  }

  // 비즈니스 로직 메서드들
  isDraft(): boolean {
    return this.status === AdvertisementStatus.DRAFT;
  }

  isPublished(): boolean {
    return this.status === AdvertisementStatus.PUBLISHED;
  }

  isArchived(): boolean {
    return this.status === AdvertisementStatus.ARCHIVED;
  }

  getTotalViews(): number {
    return this.viewingRecords.length;
  }

  getCompletionRate(): number {
    const totalViews = this.getTotalViews();
    if (totalViews === 0) return 0;
    
    const completedViews = this.viewingRecords.filter(record => record.completed).length;
    return (completedViews / totalViews) * 100;
  }

  getAverageRating(): number {
    const ratingsExist = this.viewingRecords.filter(record => record.rating);
    if (ratingsExist.length === 0) return 0;
    
    const totalRating = ratingsExist.reduce((sum, record) => sum + (record.rating || 0), 0);
    return totalRating / ratingsExist.length;
  }

  getTotalPmcDistributed(): number {
    return this.viewingRecords.reduce((total, record) => total + record.pmcEarned, 0);
  }

  hasUserViewed(userId: UserId): boolean {
    return this.viewingRecords.some(record => record.viewerId === userId);
  }

  getUserViewingRecord(userId: UserId): ViewingRecord | undefined {
    return this.viewingRecords.find(record => record.viewerId === userId);
  }

  // 통계 정보
  getStatistics(): {
    totalViews: number;
    completedViews: number;
    completionRate: number;
    averageRating: number;
    totalPmcDistributed: number;
    averageViewingDuration: number;
  } {
    const totalViews = this.getTotalViews();
    const completedViews = this.viewingRecords.filter(record => record.completed).length;
    const totalDuration = this.viewingRecords.reduce(
      (sum, record) => sum + record.duration.getSeconds(), 0
    );

    return {
      totalViews,
      completedViews,
      completionRate: this.getCompletionRate(),
      averageRating: this.getAverageRating(),
      totalPmcDistributed: this.getTotalPmcDistributed(),
      averageViewingDuration: totalViews > 0 ? totalDuration / totalViews : 0
    };
  }
}
