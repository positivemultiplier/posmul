/**
 * Opinion Leader Repository Interface
 * 오피니언 리더 리포지토리 인터페이스
 */

import { UserId } from "@posmul/shared-types";
import {
  PaginatedResult,
  PaginationParams,
  Result,
} from "@posmul/shared-types";
import {
  OpinionLeader,
  OpinionLeaderStatus,
  VerificationStatus,
} from "../entities/opinion-leader.entity";
import {
  OpinionLeaderId,
  SupportCategory,
} from "../value-objects/donation-value-objects";

export interface OpinionLeaderSearchCriteria {
  category?: SupportCategory;
  status?: OpinionLeaderStatus;
  verificationStatus?: VerificationStatus;
  name?: string;
  verified?: boolean;
  minFollowers?: number;
  maxFollowers?: number;
}

export interface IOpinionLeaderRepository {
  // 기본 CRUD 작업
  save(opinionLeader: OpinionLeader): Promise<Result<void>>;
  findById(id: OpinionLeaderId): Promise<Result<OpinionLeader | null>>;
  findByUserId(userId: UserId): Promise<Result<OpinionLeader | null>>;
  update(opinionLeader: OpinionLeader): Promise<Result<void>>;
  delete(id: OpinionLeaderId): Promise<Result<void>>;

  // 검색 및 필터링
  findAll(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;
  findByCategory(
    category: SupportCategory,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;
  findByStatus(
    status: OpinionLeaderStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;
  findByVerificationStatus(
    status: VerificationStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 복합 검색
  findByCriteria(
    criteria: OpinionLeaderSearchCriteria,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 이름으로 검색
  searchByName(
    namePattern: string,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 활성 오피니언 리더 조회
  findActiveLeaders(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;
  findVerifiedLeaders(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 카테고리별 조회
  findByCategories(
    categories: SupportCategory[],
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 통계
  countByStatus(status: OpinionLeaderStatus): Promise<Result<number>>;
  countByCategory(category: SupportCategory): Promise<Result<number>>;
  countByVerificationStatus(
    status: VerificationStatus
  ): Promise<Result<number>>;

  // 영향력 기준 정렬
  findByInfluenceScore(
    minScore?: number,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 팔로워 수 기준 정렬
  findByFollowerCount(
    minFollowers?: number,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 인기 오피니언 리더 (후원 데이터 기반)
  getPopularLeaders(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<
    Result<
      {
        leader: OpinionLeader;
        totalSupports: number;
        totalAmount: number;
        supporterCount: number;
        influenceScore: number;
      }[]
    >
  >;

  // 카테고리별 리더 수
  getCategoryDistribution(): Promise<Result<Record<SupportCategory, number>>>;

  // 검증 대기 리더들
  getPendingVerification(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 추천 오피니언 리더 (사용자 관심사 기반)
  getRecommendedLeaders(
    userCategories: SupportCategory[],
    userId: UserId,
    limit: number
  ): Promise<Result<OpinionLeader[]>>;

  // 신규 리더
  getNewLeaders(
    days: number,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 대시보드용 요약
  getAdminSummary(): Promise<
    Result<{
      totalLeaders: number;
      activeLeaders: number;
      pendingApprovals: number;
      verifiedLeaders: number;
      categoryDistribution: Record<SupportCategory, number>;
      verificationDistribution: Record<VerificationStatus, number>;
      averageInfluenceScore: number;
      totalFollowers: number;
    }>
  >;

  // 사용자별 팔로우한 리더들
  findFollowedLeaders(
    userId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<OpinionLeader>>>;

  // 트렌딩 리더 (최근 후원 증가율 기준)
  getTrendingLeaders(
    period: "daily" | "weekly" | "monthly",
    limit: number
  ): Promise<
    Result<
      {
        leader: OpinionLeader;
        growthRate: number;
        recentSupports: number;
      }[]
    >
  >;
}
