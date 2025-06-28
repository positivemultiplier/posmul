// Merchant Aggregate Root - 지역 상점 관리 (Local League)
// UTF-8 인코딩

import type { DomainEvent, Result } from "../../../../shared/types/common";
import type { UserId } from "../../../auth/domain/value-objects/user-value-objects";
import {
  Location,
  MerchantCategory,
  MerchantId,
  MerchantStatus,
  QRCode,
  Rating,
  RewardRate,
} from "../value-objects/investment-value-objects";

// Merchant 도메인 이벤트
export class MerchantRegisteredEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "MerchantRegistered";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly merchantId: string,
    public readonly name: string,
    public readonly category: MerchantCategory,
    public readonly ownerId: string
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = merchantId;
    this.timestamp = new Date();
    this.data = {
      merchantId,
      name,
      category,
      ownerId,
    };
  }
}

export class MerchantActivatedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "MerchantActivated";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly merchantId: string,
    public readonly activatedAt: Date
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = merchantId;
    this.timestamp = new Date();
    this.data = { merchantId, activatedAt };
  }
}

export class QRCodeGeneratedEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string = "QRCodeGenerated";
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number = 1;
  public readonly timestamp: Date;

  constructor(
    public readonly merchantId: string,
    public readonly qrCode: string,
    public readonly expiresAt: Date
  ) {
    this.id = crypto.randomUUID();
    this.aggregateId = merchantId;
    this.timestamp = new Date();
    this.data = { merchantId, qrCode, expiresAt };
  }
}

// 영업 시간
export interface BusinessHours {
  monday: { open: string; close: string; closed?: boolean };
  tuesday: { open: string; close: string; closed?: boolean };
  wednesday: { open: string; close: string; closed?: boolean };
  thursday: { open: string; close: string; closed?: boolean };
  friday: { open: string; close: string; closed?: boolean };
  saturday: { open: string; close: string; closed?: boolean };
  sunday: { open: string; close: string; closed?: boolean };
  [key: string]: { open: string; close: string; closed?: boolean };
}

// 상점 연락처 정보
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

// Merchant Aggregate Root
export class Merchant {
  private domainEvents: DomainEvent[] = [];
  private currentQRCode?: QRCode;
  private reviews: Array<{
    userId: UserId;
    rating: Rating;
    comment?: string;
    createdAt: Date;
  }> = [];

  private constructor(
    private readonly id: MerchantId,
    private name: string,
    private readonly category: MerchantCategory,
    private description: string,
    private readonly location: Location,
    private readonly ownerId: UserId,
    private status: MerchantStatus,
    private readonly rewardRate: RewardRate,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private businessHours: BusinessHours,
    private contactInfo: ContactInfo,
    private eventActive: boolean = false,
    private eventRewardRate?: RewardRate,
    private isSubscriptionEligible: boolean = true,
    private totalEarnings: number = 0,
    private customerCount: number = 0
  ) {}

  // 새 상점 생성
  static create(
    name: string,
    category: MerchantCategory,
    description: string,
    location: Location,
    ownerId: UserId,
    rewardRate: RewardRate,
    businessHours: BusinessHours,
    contactInfo: ContactInfo
  ): Result<Merchant> {
    // 검증
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        error: new Error("Merchant name must be at least 2 characters"),
      };
    }

    if (!description || description.trim().length < 10) {
      return {
        success: false,
        error: new Error("Description must be at least 10 characters"),
      };
    }

    if (name.trim().length > 100) {
      return {
        success: false,
        error: new Error("Merchant name must not exceed 100 characters"),
      };
    }

    if (description.trim().length > 1000) {
      return {
        success: false,
        error: new Error("Description must not exceed 1000 characters"),
      };
    }

    const id = MerchantId.generate();
    const now = new Date();

    const merchant = new Merchant(
      id,
      name.trim(),
      category,
      description.trim(),
      location,
      ownerId,
      MerchantStatus.PENDING,
      rewardRate,
      now,
      now,
      businessHours,
      contactInfo
    );

    // 도메인 이벤트 발행
    merchant.addDomainEvent(
      new MerchantRegisteredEvent(id.getValue(), name.trim(), category, ownerId)
    );

    return { success: true, data: merchant };
  }

  // 상점 활성화
  activate(): Result<void> {
    if (this.status !== MerchantStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending merchants can be activated"),
      };
    }

    this.status = MerchantStatus.ACTIVE;
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new MerchantActivatedEvent(this.id.getValue(), this.updatedAt)
    );

    return { success: true, data: undefined };
  }

  // QR 코드 생성
  generateQRCode(expirationHours: number = 24): Result<QRCode> {
    if (!this.isActive()) {
      return {
        success: false,
        error: new Error("Only active merchants can generate QR codes"),
      };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const qrCodeResult = QRCode.create(this.id.getValue(), expiresAt);
    if (!qrCodeResult.success) {
      return qrCodeResult;
    }

    this.currentQRCode = qrCodeResult.data;
    this.updatedAt = new Date();

    // 도메인 이벤트 발행
    this.addDomainEvent(
      new QRCodeGeneratedEvent(
        this.id.getValue(),
        this.currentQRCode.getCode(),
        expiresAt
      )
    );

    return { success: true, data: this.currentQRCode };
  }

  // 리뷰 추가
  addReview(userId: UserId, rating: Rating, comment?: string): Result<void> {
    // 중복 리뷰 확인
    const existingReview = this.reviews.find(
      (review) => review.userId === userId
    );
    if (existingReview) {
      return {
        success: false,
        error: new Error("User has already reviewed this merchant"),
      };
    }

    this.reviews.push({
      userId,
      rating,
      comment: comment?.trim(),
      createdAt: new Date(),
    });

    this.updatedAt = new Date();
    return { success: true, data: undefined };
  }

  // 상점 정보 업데이트
  updateInfo(
    name?: string,
    description?: string,
    businessHours?: BusinessHours,
    contactInfo?: ContactInfo
  ): Result<void> {
    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 100) {
        return { success: false, error: new Error("Invalid name length") };
      }
      this.name = name.trim();
    }

    if (description !== undefined) {
      if (
        !description ||
        description.trim().length < 10 ||
        description.trim().length > 1000
      ) {
        return {
          success: false,
          error: new Error("Invalid description length"),
        };
      }
      this.description = description.trim();
    }

    if (businessHours) {
      this.businessHours = businessHours;
    }

    if (contactInfo) {
      this.contactInfo = contactInfo;
    }

    this.updatedAt = new Date();
    return { success: true, data: undefined };
  }

  // 이벤트 활성화
  activateEvent(eventRewardRate: RewardRate): Result<void> {
    if (!this.isActive()) {
      return {
        success: false,
        error: new Error("Merchant must be active to activate events"),
      };
    }

    this.eventActive = true;
    this.eventRewardRate = eventRewardRate;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 이벤트 비활성화
  deactivateEvent(): Result<void> {
    this.eventActive = false;
    this.eventRewardRate = undefined;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 매출 기록
  recordSale(amount: number, customerCount: number = 1): Result<void> {
    if (amount <= 0) {
      return {
        success: false,
        error: new Error("Sale amount must be positive"),
      };
    }

    this.totalEarnings += amount;
    this.customerCount += customerCount;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }
  // 상점 일시 정지
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  suspend(_reason?: string): Result<void> {
    if (this.status === MerchantStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Cannot suspend terminated merchant"),
      };
    }

    this.status = MerchantStatus.SUSPENDED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 상점 재활성화
  reactivate(): Result<void> {
    if (
      this.status !== MerchantStatus.SUSPENDED &&
      this.status !== MerchantStatus.INACTIVE
    ) {
      return {
        success: false,
        error: new Error("Can only reactivate suspended or inactive merchants"),
      };
    }

    this.status = MerchantStatus.ACTIVE;
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
  getId(): MerchantId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCategory(): MerchantCategory {
    return this.category;
  }

  getDescription(): string {
    return this.description;
  }

  getLocation(): Location {
    return this.location;
  }

  getOwnerId(): UserId {
    return this.ownerId;
  }

  getStatus(): MerchantStatus {
    return this.status;
  }

  getRewardRate(): RewardRate {
    return this.rewardRate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getBusinessHours(): BusinessHours {
    return { ...this.businessHours };
  }

  getContactInfo(): ContactInfo {
    return { ...this.contactInfo };
  }

  getCurrentQRCode(): QRCode | undefined {
    return this.currentQRCode;
  }

  getReviews(): Array<{
    userId: UserId;
    rating: Rating;
    comment?: string;
    createdAt: Date;
  }> {
    return [...this.reviews];
  }

  getTotalEarnings(): number {
    return this.totalEarnings;
  }

  getCustomerCount(): number {
    return this.customerCount;
  }

  // 비즈니스 로직 메서드들
  isActive(): boolean {
    return this.status === MerchantStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.status === MerchantStatus.PENDING;
  }

  isSuspended(): boolean {
    return this.status === MerchantStatus.SUSPENDED;
  }

  isTerminated(): boolean {
    return this.status === MerchantStatus.TERMINATED;
  }

  hasValidQRCode(): boolean {
    return this.currentQRCode ? this.currentQRCode.isValid() : false;
  }
  isEventActive(): boolean {
    return this.eventActive;
  }

  getEffectiveRewardRate(): RewardRate {
    return this.isEventActive() && this.eventRewardRate
      ? this.eventRewardRate
      : this.rewardRate;
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;

    const totalScore = this.reviews.reduce(
      (sum, review) => sum + review.rating.getScore(),
      0
    );
    return totalScore / this.reviews.length;
  }

  getReviewCount(): number {
    return this.reviews.length;
  }

  isOpenAt(date: Date): boolean {
    const day = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const hours = this.businessHours[day];

    if (hours.closed) return false;

    const currentTime = date.toTimeString().substring(0, 5); // HH:MM
    return currentTime >= hours.open && currentTime <= hours.close;
  }

  isOpenNow(): boolean {
    return this.isOpenAt(new Date());
  }

  // 월별 수익률 계산
  getMonthlyRevenue(): number {
    // 실제로는 더 복잡한 계산 필요 (기간별 매출 추적)
    return this.totalEarnings;
  }

  // 상점 성과 통계
  getPerformanceStats(): {
    totalEarnings: number;
    customerCount: number;
    averageRating: number;
    reviewCount: number;
    isEventActive: boolean;
    rewardRate: string;
  } {
    return {
      totalEarnings: this.totalEarnings,
      customerCount: this.customerCount,
      averageRating: this.getAverageRating(),
      reviewCount: 0, // 임시값, 실제로는 별도 관리 필요
      isEventActive: this.isEventActive(),
      rewardRate: this.getEffectiveRewardRate().toString(),
    };
  }
}
