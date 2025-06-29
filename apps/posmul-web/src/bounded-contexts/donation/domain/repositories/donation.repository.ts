/**
 * Donation Repository Interface
 * 기부 리포지토리 인터페이스
 */

import { UserId } from "@posmul/shared-types";
import {
  PaginatedResult,
  PaginationParams,
  Result,
} from "@posmul/shared-types";
import { Donation } from "../entities/donation.entity";
import {
  DonationCategory,
  DonationFrequency,
  DonationId,
  DonationStatus,
  DonationType,
  InstituteId,
  OpinionLeaderId,
} from "../value-objects/donation-value-objects";

export interface DonationSearchCriteria {
  donorId?: UserId;
  status?: DonationStatus;
  type?: DonationType;
  category?: DonationCategory;
  frequency?: DonationFrequency;
  instituteId?: InstituteId;
  opinionLeaderId?: OpinionLeaderId;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isAnonymous?: boolean;
}

export interface IDonationRepository {
  // 기본 CRUD 작업
  save(donation: Donation): Promise<Result<void>>;
  findById(id: DonationId): Promise<Result<Donation | null>>;
  update(donation: Donation): Promise<Result<void>>;
  delete(id: DonationId): Promise<Result<void>>;

  // 검색 및 필터링
  findByDonorId(
    donorId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByStatus(
    status: DonationStatus,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByType(
    type: DonationType,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByInstituteId(
    instituteId: InstituteId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByOpinionLeaderId(
    leaderId: OpinionLeaderId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;

  // 복합 검색
  findByCriteria(
    criteria: DonationSearchCriteria,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;

  // 통계 및 집계
  countByStatus(status: DonationStatus): Promise<Result<number>>;
  countByDonor(donorId: UserId): Promise<Result<number>>;
  getTotalAmountByDonor(donorId: UserId): Promise<Result<number>>;
  getTotalAmountByInstitute(instituteId: InstituteId): Promise<Result<number>>;
  getTotalAmountByOpinionLeader(
    leaderId: OpinionLeaderId
  ): Promise<Result<number>>;

  // 정기 기부 관련
  findRecurringDonations(
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findDueRecurringDonations(dueDate: Date): Promise<Result<Donation[]>>;

  // 특정 기간 통계
  getDonationStatsInPeriod(
    startDate: Date,
    endDate: Date,
    donorId?: UserId
  ): Promise<
    Result<{
      totalDonations: number;
      totalAmount: number;
      averageAmount: number;
      donationsByCategory: Record<DonationCategory, number>;
      donationsByType: Record<DonationType, number>;
    }>
  >;

  // 월별/연별 통계
  getMonthlyStats(
    year: number,
    donorId?: UserId
  ): Promise<
    Result<
      {
        month: number;
        totalDonations: number;
        totalAmount: number;
      }[]
    >
  >;

  getYearlyStats(donorId?: UserId): Promise<
    Result<
      {
        year: number;
        totalDonations: number;
        totalAmount: number;
      }[]
    >
  >;

  // 기부자 랭킹
  getTopDonors(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<
    Result<
      {
        donorId: UserId;
        totalAmount: number;
        donationCount: number;
        rank: number;
      }[]
    >
  >;

  // 인기 기부 대상
  getPopularInstitutes(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<
    Result<
      {
        instituteId: InstituteId;
        totalAmount: number;
        donorCount: number;
        donationCount: number;
      }[]
    >
  >;

  getPopularOpinionLeaders(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<
    Result<
      {
        leaderId: OpinionLeaderId;
        totalAmount: number;
        supporterCount: number;
        supportCount: number;
      }[]
    >
  >;

  // 대시보드용 요약 데이터
  getDashboardSummary(donorId: UserId): Promise<
    Result<{
      totalDonated: number;
      donationCount: number;
      lastDonationDate?: Date;
      favoriteCategory: DonationCategory;
      yearlyTotal: number;
      monthlyAverage: number;
      rewardPointsEarned: number;
    }>
  >;
}
