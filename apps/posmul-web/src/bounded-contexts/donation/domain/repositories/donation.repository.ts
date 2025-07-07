/**
 * Donation Repository Interface
 * 기�? 리포지?�리 ?�터?�이??
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { PaginatedResult } from "@posmul/auth-economy-sdk";
 // TODO: SDK로 마이그레이션 필요 // TODO: SDK로 마이그레이션 필요
import { Result, CompatibleBaseError, ExtendedPaginationParams } from "../../../../shared/legacy-compatibility";
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
  // 기본 CRUD ?�업
  save(donation: Donation): Promise<Result<void, CompatibleBaseError>>;
  findById(id: DonationId): Promise<Result<Donation | null, CompatibleBaseError>>;
  update(donation: Donation): Promise<Result<void, CompatibleBaseError>>;
  delete(id: DonationId): Promise<Result<void, CompatibleBaseError>>;

  // 검??�??�터�?
  findByDonorId(
    donorId: UserId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByStatus(
    status: DonationStatus,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByType(
    type: DonationType,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByInstituteId(
    instituteId: InstituteId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findByOpinionLeaderId(
    leaderId: OpinionLeaderId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;

  // 복합 검??
  findByCriteria(
    criteria: DonationSearchCriteria,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;

  // ?�계 �?집계
  countByStatus(status: DonationStatus): Promise<Result<number, CompatibleBaseError>>;
  countByDonor(donorId: UserId): Promise<Result<number, CompatibleBaseError>>;
  getTotalAmountByDonor(donorId: UserId): Promise<Result<number, CompatibleBaseError>>;
  getTotalAmountByInstitute(instituteId: InstituteId): Promise<Result<number, CompatibleBaseError>>;
  getTotalAmountByOpinionLeader(
    leaderId: OpinionLeaderId
  ): Promise<Result<number, CompatibleBaseError>>;

  // ?�기 기�? 관??
  findRecurringDonations(
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>>>;
  findDueRecurringDonations(dueDate: Date): Promise<Result<Donation[], CompatibleBaseError>>;

  // ?�정 기간 ?�계
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

  // ?�별/?�별 ?�계
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

  // 기�?????��
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

  // ?�기 기�? ?�??
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

  // ?�?�보?�용 ?�약 ?�이??
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
