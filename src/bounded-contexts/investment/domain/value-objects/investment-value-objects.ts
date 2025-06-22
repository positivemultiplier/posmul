// Investment 도메인 Value Objects
// UTF-8 인코딩

import { z } from "zod";
import type { Result } from "../../../../shared/types/common";

// Investment 서비스 타입
export enum InvestmentType {
  LOCAL_LEAGUE = "LOCAL_LEAGUE", // 지역 리그
  MAJOR_LEAGUE = "MAJOR_LEAGUE", // 메이저 리그
  CLOUD_FUNDING = "CLOUD_FUNDING", // 클라우드 펀딩
}

// 상점 카테고리
export enum MerchantCategory {
  RESTAURANT = "RESTAURANT", // 음식점
  CAFE = "CAFE", // 카페
  RETAIL = "RETAIL", // 소매점
  GROCERY = "GROCERY", // 식료품
  HEALTH = "HEALTH", // 건강/의료
  BEAUTY = "BEAUTY", // 뷰티
  CLOTHING = "CLOTHING", // 의류
  ELECTRONICS = "ELECTRONICS", // 전자제품
  TRADITIONAL_MARKET = "TRADITIONAL_MARKET", // 전통시장
  AGRICULTURE = "AGRICULTURE", // 농수산물
  OTHER = "OTHER", // 기타
}

// 광고 카테고리
export enum AdvertisementCategory {
  PRODUCT = "PRODUCT", // 제품
  SERVICE = "SERVICE", // 서비스
  BRAND = "BRAND", // 브랜드
  EVENT = "EVENT", // 이벤트
  ESG = "ESG", // ESG
  OTHER = "OTHER", // 기타
}

// 펀딩 카테고리
export enum FundingCategory {
  ACCESSORY = "ACCESSORY", // 액세서리
  BOOK = "BOOK", // 도서
  MOVIE = "MOVIE", // 영화
  PERFORMANCE = "PERFORMANCE", // 공연
  ART = "ART", // 예술품
  TECHNOLOGY = "TECHNOLOGY", // 기술
  FOOD = "FOOD", // 음식
  FASHION = "FASHION", // 패션
  GAME = "GAME", // 게임
  OTHER = "OTHER", // 기타
}

// 상태 관리
export enum MerchantStatus {
  PENDING = "PENDING", // 승인 대기
  ACTIVE = "ACTIVE", // 활성
  INACTIVE = "INACTIVE", // 비활성
  SUSPENDED = "SUSPENDED", // 일시 정지
  TERMINATED = "TERMINATED", // 계약 종료
}

export enum AdvertisementStatus {
  DRAFT = "DRAFT", // 초안
  PENDING = "PENDING", // 검토 중
  PUBLISHED = "PUBLISHED", // 게시됨
  ACTIVE = "ACTIVE", // 활성
  PAUSED = "PAUSED", // 일시 정지
  COMPLETED = "COMPLETED", // 완료
  ARCHIVED = "ARCHIVED", // 보관됨
  REJECTED = "REJECTED", // 거부
}

export enum FundingStatus {
  DRAFT = "DRAFT", // 초안
  PENDING = "PENDING", // 검토 중
  ACTIVE = "ACTIVE", // 펀딩 중
  SUCCESS = "SUCCESS", // 성공
  FAILED = "FAILED", // 실패
  CANCELLED = "CANCELLED", // 취소
}

export enum InvestmentStatus {
  PENDING = "PENDING", // 처리 중
  COMPLETED = "COMPLETED", // 완료
  CANCELLED = "CANCELLED", // 취소
  REFUNDED = "REFUNDED", // 환불
}

// 새로운 투자 기회 관련 열거형들
export enum InvestmentCategory {
  TECH = "TECH", // 기술
  HEALTHCARE = "HEALTHCARE", // 헬스케어
  ENERGY = "ENERGY", // 에너지
  EDUCATION = "EDUCATION", // 교육
  FINANCE = "FINANCE", // 금융
  RETAIL = "RETAIL", // 소매
  MANUFACTURING = "MANUFACTURING", // 제조업
  AGRICULTURE = "AGRICULTURE", // 농업
  REAL_ESTATE = "REAL_ESTATE", // 부동산
  OTHER = "OTHER", // 기타
}

export enum OpportunityStatus {
  DRAFT = "DRAFT", // 초안
  ACTIVE = "ACTIVE", // 활성 (투자 모집 중)
  FUNDED = "FUNDED", // 자금 모집 완료
  IN_PROGRESS = "IN_PROGRESS", // 진행 중
  COMPLETED = "COMPLETED", // 완료
  FAILED = "FAILED", // 실패
  CANCELLED = "CANCELLED", // 취소
}

export enum ParticipationStatus {
  ACTIVE = "ACTIVE", // 활성
  COMPLETED = "COMPLETED", // 완료 (수익/손실 정산)
  CANCELLED = "CANCELLED", // 취소
  DEFAULTED = "DEFAULTED", // 채무 불이행
}

export enum CurrencyType {
  PMP = "PMP", // PMP 토큰
  PMC = "PMC", // PMC 토큰
  MIXED = "MIXED", // 혼합
}

export enum RiskLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

// MerchantId Value Object
export class MerchantId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<MerchantId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return { success: false, error: new Error("Invalid merchant ID format") };
    }

    return { success: true, data: new MerchantId(value) };
  }

  static generate(): MerchantId {
    return new MerchantId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MerchantId): boolean {
    return this.value === other.value;
  }
}

// AdvertisementId Value Object
export class AdvertisementId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<AdvertisementId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: new Error("Invalid advertisement ID format"),
      };
    }

    return { success: true, data: new AdvertisementId(value) };
  }

  static generate(): AdvertisementId {
    return new AdvertisementId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AdvertisementId): boolean {
    return this.value === other.value;
  }
}

// CrowdFundingId Value Object
export class CrowdFundingId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<CrowdFundingId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: new Error("Invalid crowd funding ID format"),
      };
    }

    return { success: true, data: new CrowdFundingId(value) };
  }

  static generate(): CrowdFundingId {
    return new CrowdFundingId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: CrowdFundingId): boolean {
    return this.value === other.value;
  }
}

// InvestmentId Value Object
export class InvestmentId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<InvestmentId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: new Error("Invalid investment ID format"),
      };
    }

    return { success: true, data: new InvestmentId(value) };
  }

  static generate(): InvestmentId {
    return new InvestmentId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InvestmentId): boolean {
    return this.value === other.value;
  }
}

// Location Value Object (지역 정보)
export class Location {
  private constructor(
    private readonly address: string,
    private readonly latitude: number,
    private readonly longitude: number,
    private readonly region: string,
    private readonly district?: string
  ) {}

  static create(
    address: string,
    latitude: number,
    longitude: number,
    region: string,
    district?: string
  ): Result<Location> {
    // 주소 검증
    if (!address || address.trim().length < 10) {
      return {
        success: false,
        error: new Error("Address must be at least 10 characters"),
      };
    }

    // 위도/경도 검증
    if (latitude < -90 || latitude > 90) {
      return {
        success: false,
        error: new Error("Latitude must be between -90 and 90"),
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        success: false,
        error: new Error("Longitude must be between -180 and 180"),
      };
    }

    // 지역 검증
    if (!region || region.trim().length === 0) {
      return { success: false, error: new Error("Region is required") };
    }

    return {
      success: true,
      data: new Location(
        address.trim(),
        latitude,
        longitude,
        region.trim(),
        district?.trim()
      ),
    };
  }

  getAddress(): string {
    return this.address;
  }

  getLatitude(): number {
    return this.latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }

  getRegion(): string {
    return this.region;
  }

  getDistrict(): string | undefined {
    return this.district;
  }

  // 두 위치 간의 거리 계산 (km)
  distanceTo(other: Location): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((other.latitude - this.latitude) * Math.PI) / 180;
    const dLon = ((other.longitude - this.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((this.latitude * Math.PI) / 180) *
        Math.cos((other.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  equals(other: Location): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  toString(): string {
    return `${this.address} (${this.latitude}, ${this.longitude})`;
  }
}

// QRCode Value Object (결제용 QR 코드)
export class QRCode {
  private constructor(
    private readonly code: string,
    private readonly merchantId: string,
    private readonly expiresAt: Date
  ) {}

  static create(merchantId: string, expiresAt: Date): Result<QRCode> {
    if (!merchantId || merchantId.trim().length === 0) {
      return { success: false, error: new Error("Merchant ID is required") };
    }

    if (expiresAt <= new Date()) {
      return {
        success: false,
        error: new Error("Expiration time must be in the future"),
      };
    }

    // QR 코드 생성 (실제로는 더 복잡한 로직 필요)
    const code = `${merchantId}_${Date.now()}_${Math.random().toString(36)}`;

    return {
      success: true,
      data: new QRCode(code, merchantId, expiresAt),
    };
  }

  getCode(): string {
    return this.code;
  }

  getMerchantId(): string {
    return this.merchantId;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isExpired();
  }

  equals(other: QRCode): boolean {
    return this.code === other.code;
  }
}

// Rating Value Object (평점)
export class Rating {
  private constructor(
    private readonly score: number,
    private readonly maxScore: number = 5
  ) {}

  static create(score: number, maxScore: number = 5): Result<Rating> {
    if (score < 0 || score > maxScore) {
      return {
        success: false,
        error: new Error(`Rating must be between 0 and ${maxScore}`),
      };
    }

    return { success: true, data: new Rating(score, maxScore) };
  }

  getScore(): number {
    return this.score;
  }

  getMaxScore(): number {
    return this.maxScore;
  }

  getPercentage(): number {
    return (this.score / this.maxScore) * 100;
  }

  isExcellent(): boolean {
    return this.getPercentage() >= 80;
  }

  isGood(): boolean {
    return this.getPercentage() >= 60;
  }

  isFair(): boolean {
    return this.getPercentage() >= 40;
  }

  isPoor(): boolean {
    return this.getPercentage() < 40;
  }

  equals(other: Rating): boolean {
    return this.score === other.score && this.maxScore === other.maxScore;
  }

  toString(): string {
    return `${this.score}/${this.maxScore} (${this.getPercentage().toFixed(
      1
    )}%)`;
  }
}

// RewardRate Value Object (보상율)
export class RewardRate {
  private constructor(
    private readonly rate: number,
    private readonly type: "PERCENTAGE" | "FIXED"
  ) {}

  static createPercentage(rate: number): Result<RewardRate> {
    if (rate < 0 || rate > 100) {
      return {
        success: false,
        error: new Error("Percentage rate must be between 0 and 100"),
      };
    }

    return { success: true, data: new RewardRate(rate, "PERCENTAGE") };
  }

  static createFixed(amount: number): Result<RewardRate> {
    if (amount < 0) {
      return {
        success: false,
        error: new Error("Fixed amount must be non-negative"),
      };
    }

    return { success: true, data: new RewardRate(amount, "FIXED") };
  }

  getRate(): number {
    return this.rate;
  }

  getType(): "PERCENTAGE" | "FIXED" {
    return this.type;
  }

  calculateReward(amount: number): number {
    if (this.type === "PERCENTAGE") {
      return Math.round((amount * this.rate) / 100);
    }
    return this.rate;
  }

  equals(other: RewardRate): boolean {
    return this.rate === other.rate && this.type === other.type;
  }

  toString(): string {
    return this.type === "PERCENTAGE" ? `${this.rate}%` : `${this.rate}원`;
  }
}

// FundingGoal Value Object (펀딩 목표)
export class FundingGoal {
  private constructor(
    private readonly targetAmount: number,
    private readonly currency: "KRW" | "PMC" | "PMP",
    private readonly deadline: Date
  ) {}

  static create(
    targetAmount: number,
    currency: "KRW" | "PMC" | "PMP",
    deadline: Date
  ): Result<FundingGoal> {
    if (targetAmount <= 0) {
      return {
        success: false,
        error: new Error("Target amount must be positive"),
      };
    }

    if (deadline <= new Date()) {
      return {
        success: false,
        error: new Error("Deadline must be in the future"),
      };
    }

    return {
      success: true,
      data: new FundingGoal(targetAmount, currency, deadline),
    };
  }

  getTargetAmount(): number {
    return this.targetAmount;
  }

  getCurrency(): "KRW" | "PMC" | "PMP" {
    return this.currency;
  }

  getDeadline(): Date {
    return this.deadline;
  }

  isExpired(): boolean {
    return new Date() > this.deadline;
  }

  calculateProgress(currentAmount: number): number {
    return Math.min(100, (currentAmount / this.targetAmount) * 100);
  }

  isAchieved(currentAmount: number): boolean {
    return currentAmount >= this.targetAmount;
  }

  getRemainingDays(): number {
    const now = new Date();
    const timeDiff = this.deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  }

  equals(other: FundingGoal): boolean {
    return (
      this.targetAmount === other.targetAmount &&
      this.currency === other.currency &&
      this.deadline.getTime() === other.deadline.getTime()
    );
  }

  format(): string {
    const formatter = new Intl.NumberFormat("ko-KR");
    const amount = formatter.format(this.targetAmount);

    switch (this.currency) {
      case "KRW":
        return `${amount}원`;
      case "PMC":
        return `${amount} PMC`;
      case "PMP":
        return `${amount} PMP`;
      default:
        return `${amount} ${this.currency}`;
    }
  }
}

// ViewingDuration Value Object (시청 시간)
export class ViewingDuration {
  private constructor(
    private readonly totalSeconds: number,
    private readonly completionPercentage: number
  ) {}

  static create(
    totalSeconds: number,
    completionPercentage: number
  ): Result<ViewingDuration> {
    if (totalSeconds < 0) {
      return {
        success: false,
        error: new Error("Total seconds must be non-negative"),
      };
    }

    if (completionPercentage < 0 || completionPercentage > 100) {
      return {
        success: false,
        error: new Error("Completion percentage must be between 0 and 100"),
      };
    }

    return {
      success: true,
      data: new ViewingDuration(totalSeconds, completionPercentage),
    };
  }
  getTotalSeconds(): number {
    return this.totalSeconds;
  }

  // Advertisement 엔티티에서 사용하는 메서드
  getSeconds(): number {
    return this.totalSeconds;
  }

  getCompletionPercentage(): number {
    return this.completionPercentage;
  }

  getTotalMinutes(): number {
    return Math.floor(this.totalSeconds / 60);
  }

  isCompleteViewing(): boolean {
    return this.completionPercentage >= 100;
  }

  isQualifiedForBonus(minimumPercentage: number = 80): boolean {
    return this.completionPercentage >= minimumPercentage;
  }

  calculateReward(
    baseRewardPerMinute: number,
    bonusMultiplier: number = 1.5
  ): number {
    const baseReward = this.getTotalMinutes() * baseRewardPerMinute;
    return this.isCompleteViewing()
      ? Math.round(baseReward * bonusMultiplier)
      : baseReward;
  }

  equals(other: ViewingDuration): boolean {
    return (
      this.totalSeconds === other.totalSeconds &&
      this.completionPercentage === other.completionPercentage
    );
  }

  toString(): string {
    const minutes = Math.floor(this.totalSeconds / 60);
    const seconds = this.totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")} (${
      this.completionPercentage
    }%)`;
  }
}

// 새로운 투자 기회 관련 값 객체들
export class InvestmentOpportunityId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<InvestmentOpportunityId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: new Error("Invalid investment opportunity ID format"),
      };
    }

    return { success: true, data: new InvestmentOpportunityId(value) };
  }

  static generate(): InvestmentOpportunityId {
    return new InvestmentOpportunityId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InvestmentOpportunityId): boolean {
    return this.value === other.value;
  }
}

export class InvestmentParticipationId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<InvestmentParticipationId> {
    const schema = z.string().uuid();
    const result = schema.safeParse(value);

    if (!result.success) {
      return {
        success: false,
        error: new Error("Invalid investment participation ID format"),
      };
    }

    return { success: true, data: new InvestmentParticipationId(value) };
  }

  static generate(): InvestmentParticipationId {
    return new InvestmentParticipationId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InvestmentParticipationId): boolean {
    return this.value === other.value;
  }
}
