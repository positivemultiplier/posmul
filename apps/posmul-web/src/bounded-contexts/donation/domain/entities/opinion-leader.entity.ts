/**
 * Opinion Leader Entity
 * 오피니언 리더 엔티티
 */
import { UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { DomainEvent } from "@posmul/auth-economy-sdk";

import {
  DonorRating,
  OpinionLeaderId,
  SupportCategory,
} from "../value-objects/donation-value-objects";

// 오피니언 리더 등록 이벤트
export class OpinionLeaderRegisteredEvent implements DomainEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly aggregateId: string;
  public readonly data: Record<string, unknown>;
  public readonly version: number;
  public readonly timestamp: Date;

  constructor(
    public readonly leaderId: OpinionLeaderId,
    public readonly name: string,
    public readonly categories: SupportCategory[]
  ) {
    this.id = crypto.randomUUID();
    this.type = "OpinionLeaderRegistered";
    this.aggregateId = leaderId.getValue();
    this.data = { name, categories };
    this.version = 1;
    this.timestamp = new Date();
  }
}

// 오피니언 리더 상태
export enum OpinionLeaderStatus {
  PENDING = "PENDING", // 승인 대기
  ACTIVE = "ACTIVE", // 활성
  SUSPENDED = "SUSPENDED", // 일시 정지
  TERMINATED = "TERMINATED", // 종료
}

// 검증 상태
export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED", // 미검증
  PENDING = "PENDING", // 검증 대기
  VERIFIED = "VERIFIED", // 검증됨
  REJECTED = "REJECTED", // 거부됨
}

// 소셜 미디어 정보
export interface SocialMediaInfo {
  platform: string;
  handle: string;
  followers: number;
  verified: boolean;
}

// 오피니언 리더 통계
export interface OpinionLeaderStats {
  totalSupports: number;
  supporterCount: number;
  totalAmount: number;
  averageAmount: number;
  monthlyGrowthRate: number;
  contentCount: number;
  engagementRate: number;
}

// 콘텐츠 정보
export interface ContentInfo {
  id: string;
  title: string;
  description: string;
  url?: string;
  publishedAt: Date;
  supportAmount: number;
  supporterCount: number;
}

/**
 * OpinionLeader Entity
 * 후원을 받는 오피니언 리더를 나타내는 엔티티
 */
export class OpinionLeader {
  private events: DomainEvent[] = [];

  constructor(
    private readonly id: OpinionLeaderId,
    private readonly userId: UserId,
    private name: string,
    private description: string,
    private bio: string,
    private categories: SupportCategory[],
    private socialMediaInfo: SocialMediaInfo[],
    private status: OpinionLeaderStatus = OpinionLeaderStatus.PENDING,
    private verificationStatus: VerificationStatus = VerificationStatus.UNVERIFIED,
    private profileImageUrl?: string,
    private websiteUrl?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    // 오피니언 리더 등록 이벤트 발행
    this.addDomainEvent(new OpinionLeaderRegisteredEvent(id, name, categories));
  }

  // Getters
  getId(): OpinionLeaderId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getBio(): string {
    return this.bio;
  }

  getCategories(): SupportCategory[] {
    return [...this.categories];
  }

  getSocialMediaInfo(): SocialMediaInfo[] {
    return [...this.socialMediaInfo];
  }

  getStatus(): OpinionLeaderStatus {
    return this.status;
  }

  getVerificationStatus(): VerificationStatus {
    return this.verificationStatus;
  }

  getProfileImageUrl(): string | undefined {
    return this.profileImageUrl;
  }

  getWebsiteUrl(): string | undefined {
    return this.websiteUrl;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // 프로필 업데이트
  updateProfile(
    name: string,
    description: string,
    bio: string,
    categories: SupportCategory[],
    profileImageUrl?: string,
    websiteUrl?: string
  ): Result<void> {
    if (this.status === OpinionLeaderStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Cannot update terminated opinion leader"),
      };
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: new Error("Name cannot be empty") };
    }

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: new Error("Description cannot be empty"),
      };
    }

    if (!bio || bio.trim().length === 0) {
      return { success: false, error: new Error("Bio cannot be empty") };
    }

    if (categories.length === 0) {
      return {
        success: false,
        error: new Error("At least one category is required"),
      };
    }

    if (bio.length > 1000) {
      return {
        success: false,
        error: new Error("Bio cannot exceed 1000 characters"),
      };
    }

    this.name = name.trim();
    this.description = description.trim();
    this.bio = bio.trim();
    this.categories = [...categories];
    this.profileImageUrl = profileImageUrl;
    this.websiteUrl = websiteUrl;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 소셜 미디어 정보 업데이트
  updateSocialMediaInfo(socialMediaInfo: SocialMediaInfo[]): Result<void> {
    if (this.status === OpinionLeaderStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Cannot update terminated opinion leader"),
      };
    }

    // 중복 플랫폼 검사
    const platforms = socialMediaInfo.map((info) => info.platform);
    const uniquePlatforms = new Set(platforms);
    if (platforms.length !== uniquePlatforms.size) {
      return {
        success: false,
        error: new Error("Duplicate social media platforms not allowed"),
      };
    }

    this.socialMediaInfo = [...socialMediaInfo];
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 오피니언 리더 승인
  approve(): Result<void> {
    if (this.status !== OpinionLeaderStatus.PENDING) {
      return {
        success: false,
        error: new Error("Only pending opinion leaders can be approved"),
      };
    }

    this.status = OpinionLeaderStatus.ACTIVE;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 검증 상태 업데이트
  updateVerificationStatus(status: VerificationStatus): Result<void> {
    if (this.status !== OpinionLeaderStatus.ACTIVE) {
      return {
        success: false,
        error: new Error("Only active opinion leaders can be verified"),
      };
    }

    this.verificationStatus = status;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 오피니언 리더 일시 정지
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  suspend(_reason?: string): Result<void> {
    if (this.status !== OpinionLeaderStatus.ACTIVE) {
      return {
        success: false,
        error: new Error("Only active opinion leaders can be suspended"),
      };
    }

    this.status = OpinionLeaderStatus.SUSPENDED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 오피니언 리더 재활성화
  reactivate(): Result<void> {
    if (this.status !== OpinionLeaderStatus.SUSPENDED) {
      return {
        success: false,
        error: new Error("Only suspended opinion leaders can be reactivated"),
      };
    }

    this.status = OpinionLeaderStatus.ACTIVE;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 오피니언 리더 종료
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  terminate(_reason?: string): Result<void> {
    if (this.status === OpinionLeaderStatus.TERMINATED) {
      return {
        success: false,
        error: new Error("Opinion leader is already terminated"),
      };
    }

    this.status = OpinionLeaderStatus.TERMINATED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // 후원 가능 여부 확인
  canReceiveSupport(): boolean {
    return this.status === OpinionLeaderStatus.ACTIVE;
  }

  // 활성 여부
  isActive(): boolean {
    return this.status === OpinionLeaderStatus.ACTIVE;
  }

  // 검증된 오피니언 리더 여부
  isVerified(): boolean {
    return this.verificationStatus === VerificationStatus.VERIFIED;
  }

  // 카테고리 포함 여부 확인
  hasCategory(category: SupportCategory): boolean {
    return this.categories.includes(category);
  }

  // 총 팔로워 수 계산
  getTotalFollowers(): number {
    return this.socialMediaInfo.reduce(
      (total, info) => total + info.followers,
      0
    );
  }

  // 검증된 소셜 미디어 계정 수
  getVerifiedAccountCount(): number {
    return this.socialMediaInfo.filter((info) => info.verified).length;
  }

  // 영향력 점수 계산 (팔로워 수와 검증 상태 기반)
  calculateInfluenceScore(): number {
    const totalFollowers = this.getTotalFollowers();
    const verifiedBonus = this.getVerifiedAccountCount() * 10000;
    const verificationMultiplier = this.isVerified() ? 1.5 : 1.0;

    return Math.floor(
      (totalFollowers + verifiedBonus) * verificationMultiplier
    );
  }

  // 오피니언 리더 통계 계산 (외부 데이터 필요)
  calculateStats(
    supports: { amount: number; supporterId: UserId }[],
    contents: ContentInfo[]
  ): OpinionLeaderStats {
    const totalSupports = supports.length;
    const totalAmount = supports.reduce((sum, s) => sum + s.amount, 0);
    const uniqueSupporters = new Set(
      supports.map((s) => s.supporterId.toString())
    ).size;
    const averageAmount = totalSupports > 0 ? totalAmount / totalSupports : 0;

    const totalEngagements = contents.reduce(
      (sum, c) => sum + c.supporterCount,
      0
    );
    const engagementRate =
      contents.length > 0 ? totalEngagements / contents.length : 0;

    return {
      totalSupports,
      supporterCount: uniqueSupporters,
      totalAmount,
      averageAmount,
      monthlyGrowthRate: 0, // 실제로는 이전 달 데이터와 비교 필요
      contentCount: contents.length,
      engagementRate,
    };
  }

  // 등급 계산 (연간 후원 금액 기준)
  calculateTier(annualSupportAmount: number): DonorRating {
    return DonorRating.calculateTier(annualSupportAmount);
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
  equals(other: OpinionLeader): boolean {
    return this.id.equals(other.id);
  }

  // Factory 메서드
  static create(
    userId: UserId,
    name: string,
    description: string,
    bio: string,
    categories: SupportCategory[],
    socialMediaInfo: SocialMediaInfo[] = [],
    profileImageUrl?: string,
    websiteUrl?: string
  ): Result<OpinionLeader> {
    // 유효성 검사
    if (!name || name.trim().length === 0) {
      return { success: false, error: new Error("Name cannot be empty") };
    }

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: new Error("Description cannot be empty"),
      };
    }

    if (!bio || bio.trim().length === 0) {
      return { success: false, error: new Error("Bio cannot be empty") };
    }

    if (categories.length === 0) {
      return {
        success: false,
        error: new Error("At least one category is required"),
      };
    }

    if (bio.length > 1000) {
      return {
        success: false,
        error: new Error("Bio cannot exceed 1000 characters"),
      };
    }

    // 중복 플랫폼 검사
    const platforms = socialMediaInfo.map((info) => info.platform);
    const uniquePlatforms = new Set(platforms);
    if (platforms.length !== uniquePlatforms.size) {
      return {
        success: false,
        error: new Error("Duplicate social media platforms not allowed"),
      };
    }

    const opinionLeader = new OpinionLeader(
      OpinionLeaderId.generate(),
      userId,
      name.trim(),
      description.trim(),
      bio.trim(),
      categories,
      socialMediaInfo,
      OpinionLeaderStatus.PENDING,
      VerificationStatus.UNVERIFIED,
      profileImageUrl,
      websiteUrl
    );

    return { success: true, data: opinionLeader };
  }

  // DB 데이터로부터 엔티티 재구성
  static reconstitute(data: any): OpinionLeader {
    const leader = new OpinionLeader(
      new OpinionLeaderId(data.id),
      data.user_id as UserId,
      data.display_name || data.name, // DB column might be display_name
      data.description || data.bio, // Mapping might vary
      data.bio,
      data.categories || [],
      data.social_media_info || [],
      data.status as OpinionLeaderStatus,
      data.verification_status as VerificationStatus,
      data.profile_image_url,
      data.website_url,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    leader.clearDomainEvents();
    return leader;
  }
}
