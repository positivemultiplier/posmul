/**
 * Institute Entity
 * 기부 기관 엔티티
 */

import { UserId } from "@posmul/shared-types";
import { DomainEvent, Result } from "@posmul/shared-types";
import {
  InstituteCategory,
  InstituteId,
} from "../value-objects/donation-value-objects";

// 기관 등록 이벤트
export class InstituteRegisteredEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly instituteId: InstituteId,
    public readonly name: string,
    public readonly category: InstituteCategory
  ) {
    this.id = crypto.randomUUID();
    this.type = "InstituteRegistered";
    this.aggregateId = instituteId.getValue();
    this.data = { name, category };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 기관 상태
export enum InstituteStatus {
  PENDING = "PENDING", // 승인 대기
  ACTIVE = "ACTIVE", // 활성
  SUSPENDED = "SUSPENDED", // 일시 정지
  TERMINATED = "TERMINATED", // 종료
}

// 기관 신뢰도 등급
export enum TrustLevel {
  BASIC = "BASIC", // 기본
  VERIFIED = "VERIFIED", // 검증됨
  PREMIUM = "PREMIUM", // 프리미엄
  GOLD = "GOLD", // 골드
}

// 기관 연락처 정보
export interface ContactInfo {
  email: string;
  phone?: string;
  website?: string;
  address?: string;
}

// 기관 통계
export interface InstituteStats {
  totalDonations: number;
  donorCount: number;
  totalAmount: number;
  averageAmount: number;
  monthlyGrowthRate: number;
}

/**
 * Institute Entity
 * 기부를 받는 기관을 나타내는 엔티티
 */
export class Institute {
  private events: DomainEvent[] = [];

  constructor(
    private readonly id: InstituteId,
    private name: string,
    private description: string,
    private readonly category: InstituteCategory,
    private contactInfo: ContactInfo,
    private status: InstituteStatus = InstituteStatus.PENDING,
    private trustLevel: TrustLevel = TrustLevel.BASIC,
    private registrationNumber?: string,
    private logoUrl?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    // 기관 등록 이벤트 발행
    this.addDomainEvent(new InstituteRegisteredEvent(id, name, category));
  }

  // Getters
  getId(): InstituteId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): InstituteCategory {
    return this.category;
  }

  getContactInfo(): ContactInfo {
    return { ...this.contactInfo };
  }

  getStatus(): InstituteStatus {
    return this.status;
  }

  getTrustLevel(): TrustLevel {
    return this.trustLevel;
  }

  getRegistrationNumber(): string | undefined {
    return this.registrationNumber;
  }

  getLogoUrl(): string | undefined {
    return this.logoUrl;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // 기관 정보 업데이트
  updateInfo(
    name: string,
    description: string,
    contactInfo: ContactInfo,
    logoUrl?: string
  ): Result<void> {
    if (this.status === InstituteStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Cannot update terminated institute"),
      };
    }

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: new Error("Institute name cannot be empty"),
      };
    }

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: new Error("Institute description cannot be empty"),
      };
    }

    if (!contactInfo.email || !this.isValidEmail(contactInfo.email)) {
      return { success: false, error: new Error("Valid email is required") };
    }

    this.name = name.trim();
    this.description = description.trim();
    this.contactInfo = { ...contactInfo };
    this.logoUrl = logoUrl;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기관 승인
  approve(registrationNumber?: string): Result<void> {
    if (this.status !== InstituteStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending institutes can be approved"),
      };
    }

    this.status = InstituteStatus.ACTIVE;
    this.registrationNumber = registrationNumber;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }
  // 기관 일시 정지
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  suspend(_reason?: string): Result<void> {
    if (this.status !== InstituteStatus.ACTIVE) {
      return {
        success: false,
        error: new Error("Only active institutes can be suspended"),
      };
    }

    this.status = InstituteStatus.SUSPENDED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기관 재활성화
  reactivate(): Result<void> {
    if (this.status !== InstituteStatus.SUSPENDED) {
      return {
        success: false,
        error: new Error("Only suspended institutes can be reactivated"),
      };
    }

    this.status = InstituteStatus.ACTIVE;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }
  // 기관 종료
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  terminate(_reason?: string): Result<void> {
    if (this.status === InstituteStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Institute is already terminated"),
      };
    }

    this.status = InstituteStatus.TERMINATED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 신뢰도 등급 업그레이드
  upgradeTrustLevel(newLevel: TrustLevel): Result<void> {
    const levelOrder = [
      TrustLevel.BASIC,
      TrustLevel.VERIFIED,
      TrustLevel.PREMIUM,
      TrustLevel.GOLD,
    ];
    const currentIndex = levelOrder.indexOf(this.trustLevel);
    const newIndex = levelOrder.indexOf(newLevel);

    if (newIndex <= currentIndex) {
      return {
        success: false,
        error: new Error("Trust level can only be upgraded"),
      };
    }

    this.trustLevel = newLevel;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 기부 가능 여부 확인
  canReceiveDonations(): boolean {
    return this.status === InstituteStatus.ACTIVE;
  }

  // 기관 활성 여부
  isActive(): boolean {
    return this.status === InstituteStatus.ACTIVE;
  }

  // 검증된 기관 여부
  isVerified(): boolean {
    return this.trustLevel !== TrustLevel.BASIC;
  }

  // 기관 통계 계산 (외부 데이터 필요)
  calculateStats(
    donations: { amount: number; donorId: UserId }[]
  ): InstituteStats {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = new Set(donations.map((d) => d.donorId.toString()))
      .size;
    const averageAmount = totalDonations > 0 ? totalAmount / totalDonations : 0;

    return {
      totalDonations,
      donorCount: uniqueDonors,
      totalAmount,
      averageAmount,
      monthlyGrowthRate: 0, // 실제로는 이전 달 데이터와 비교 필요
    };
  }

  // 기관 평점 계산 (외부 데이터 필요)
  calculateRating(reviews: { rating: number }[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    return totalRating / reviews.length;
  }

  // 이메일 유효성 검사
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
  equals(other: Institute): boolean {
    return this.id.equals(other.id);
  }

  // Factory 메서드
  static create(
    name: string,
    description: string,
    category: InstituteCategory,
    contactInfo: ContactInfo,
    logoUrl?: string
  ): Result<Institute> {
    // 유효성 검사
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: new Error("Institute name cannot be empty"),
      };
    }

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: new Error("Institute description cannot be empty"),
      };
    }

    if (
      !contactInfo.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)
    ) {
      return { success: false, error: new Error("Valid email is required") };
    }

    const institute = new Institute(
      InstituteId.generate(),
      name.trim(),
      description.trim(),
      category,
      contactInfo,
      InstituteStatus.PENDING,
      TrustLevel.BASIC,
      undefined,
      logoUrl
    );

    return { success: true, data: institute };
  }
}
