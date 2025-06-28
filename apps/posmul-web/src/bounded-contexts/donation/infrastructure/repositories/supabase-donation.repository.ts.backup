/**
 * Supabase Donation Repository Implementation
 * Supabase를 사용한 기부 리포지토리 구현
 */

import { UserId } from "@/bounded-contexts/auth/domain/value-objects/user-value-objects";
import {
  PaginatedResult,
  PaginationParams,
  Result,
} from "@/shared/types/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Donation } from "../../domain/entities/donation.entity";
import {
  DonationSearchCriteria,
  IDonationRepository,
} from "../../domain/repositories/donation.repository";
import {
  DonationCategory,
  DonationFrequency,
  DonationId,
  DonationStatus,
  DonationType,
  InstituteId,
  OpinionLeaderId,
} from "../../domain/value-objects/donation-value-objects";

interface DonationRecord {
  id: string;
  donor_id: string;
  type: DonationType;
  status: DonationStatus;
  amount: number;
  category: DonationCategory;
  description: string;
  frequency: DonationFrequency;
  target_amount: number | null;
  institute_id: string | null;
  opinion_leader_id: string | null;
  metadata: Record<string, unknown>;
  beneficiary_info: Record<string, unknown> | null;
  processing_info: Record<string, unknown> | null;
  scheduled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SupabaseDonationRepository
 * Supabase를 사용한 기부 리포지토리 구현
 */
export class SupabaseDonationRepository implements IDonationRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * 기부 저장
   */
  async save(donation: Donation): Promise<Result<void>> {
    try {
      const record = this.mapDonationToRecord(donation);

      const { error } = await this.supabase.from("donations").upsert(record);

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to save donation: ${error.message}`),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * ID로 기부 조회
   */
  async findById(id: DonationId): Promise<Result<Donation | null>> {
    try {
      const { data, error } = await this.supabase
        .from("donations")
        .select("*")
        .eq("id", id.getValue())
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        return {
          success: false,
          error: new Error(`Failed to find donation: ${error.message}`),
        };
      }

      if (!data) {
        return { success: true, data: null };
      }

      const donation = this.mapRecordToDonation(data);
      return { success: true, data: donation };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 기부자별 기부 목록 조회
   */
  async findByDonorId(
    donorId: UserId,
    pagination: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    try {
      const { data, error, count } = await this.supabase
        .from("donations")
        .select("*", { count: "exact" })
        .eq("donor_id", donorId)
        .order(pagination.sortBy || "created_at", {
          ascending: pagination.sortOrder === "asc",
        })
        .range(
          (pagination.page - 1) * pagination.limit,
          pagination.page * pagination.limit - 1
        );

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to find donations: ${error.message}`),
        };
      }

      const donations = data.map((record) => this.mapRecordToDonation(record));
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          data: donations,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1,
          },
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 상태별 기부 목록 조회
   */
  async findByStatus(
    status: DonationStatus,
    pagination: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    try {
      const { data, error, count } = await this.supabase
        .from("donations")
        .select("*", { count: "exact" })
        .eq("status", status)
        .order(pagination.sortBy || "created_at", {
          ascending: pagination.sortOrder === "asc",
        })
        .range(
          (pagination.page - 1) * pagination.limit,
          pagination.page * pagination.limit - 1
        );

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to find donations: ${error.message}`),
        };
      }

      const donations = data.map((record) => this.mapRecordToDonation(record));
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          data: donations,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1,
          },
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 기부 검색
   */
  async search(
    criteria: DonationSearchCriteria,
    pagination: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    try {
      let query = this.supabase
        .from("donations")
        .select("*", { count: "exact" });

      // 검색 조건 적용
      if (criteria.donorId) {
        query = query.eq("donor_id", criteria.donorId);
      }
      if (criteria.status) {
        query = query.eq("status", criteria.status);
      }
      if (criteria.type) {
        query = query.eq("type", criteria.type);
      }
      if (criteria.category) {
        query = query.eq("category", criteria.category);
      }
      if (criteria.frequency) {
        query = query.eq("frequency", criteria.frequency);
      }
      if (criteria.startDate) {
        query = query.gte("created_at", criteria.startDate.toISOString());
      }
      if (criteria.endDate) {
        query = query.lte("created_at", criteria.endDate.toISOString());
      }
      if (criteria.minAmount) {
        query = query.gte("amount", criteria.minAmount);
      }
      if (criteria.maxAmount) {
        query = query.lte("amount", criteria.maxAmount);
      }

      const { data, error, count } = await query
        .order(pagination.sortBy || "created_at", {
          ascending: pagination.sortOrder === "asc",
        })
        .range(
          (pagination.page - 1) * pagination.limit,
          pagination.page * pagination.limit - 1
        );

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to search donations: ${error.message}`),
        };
      }

      const donations = data.map((record) => this.mapRecordToDonation(record));
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          data: donations,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1,
          },
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 기부 통계 조회
   */
  async getStats(donorId?: UserId): Promise<
    Result<{
      totalDonations: number;
      totalAmount: number;
      averageAmount: number;
      donationsByCategory: Record<DonationCategory, number>;
      donationsByType: Record<DonationType, number>;
    }>
  > {
    try {
      let query = this.supabase
        .from("donations")
        .select("amount, category, type");

      if (donorId) {
        query = query.eq("donor_id", donorId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to get stats: ${error.message}`),
        };
      }

      const totalDonations = data.length;
      const totalAmount = data.reduce((sum, record) => sum + record.amount, 0);
      const averageAmount =
        totalDonations > 0 ? totalAmount / totalDonations : 0;

      const donationsByCategory = data.reduce((acc, record) => {
        acc[record.category as DonationCategory] =
          (acc[record.category as DonationCategory] || 0) + 1;
        return acc;
      }, {} as Record<DonationCategory, number>);

      const donationsByType = data.reduce((acc, record) => {
        acc[record.type as DonationType] =
          (acc[record.type as DonationType] || 0) + 1;
        return acc;
      }, {} as Record<DonationType, number>);

      return {
        success: true,
        data: {
          totalDonations,
          totalAmount,
          averageAmount,
          donationsByCategory,
          donationsByType,
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 월별 통계 조회
   */
  async getMonthlyStats(
    year: number,
    donorId?: UserId
  ): Promise<
    Result<
      Array<{
        month: number;
        totalDonations: number;
        totalAmount: number;
      }>
    >
  > {
    try {
      let query = this.supabase
        .from("donations")
        .select("amount, created_at")
        .gte("created_at", `${year}-01-01T00:00:00Z`)
        .lt("created_at", `${year + 1}-01-01T00:00:00Z`);

      if (donorId) {
        query = query.eq("donor_id", donorId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to get monthly stats: ${error.message}`),
        };
      }

      const monthlyStats = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        totalDonations: 0,
        totalAmount: 0,
      }));

      data.forEach((record) => {
        const month = new Date(record.created_at).getMonth();
        monthlyStats[month].totalDonations++;
        monthlyStats[month].totalAmount += record.amount;
      });

      return { success: true, data: monthlyStats };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 연별 통계 조회
   */
  async getYearlyStats(donorId?: UserId): Promise<
    Result<
      Array<{
        year: number;
        totalDonations: number;
        totalAmount: number;
      }>
    >
  > {
    try {
      let query = this.supabase.from("donations").select("amount, created_at");

      if (donorId) {
        query = query.eq("donor_id", donorId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to get yearly stats: ${error.message}`),
        };
      }

      const yearlyStatsMap = new Map<
        number,
        { totalDonations: number; totalAmount: number }
      >();

      data.forEach((record) => {
        const year = new Date(record.created_at).getFullYear();
        const existing = yearlyStatsMap.get(year) || {
          totalDonations: 0,
          totalAmount: 0,
        };
        yearlyStatsMap.set(year, {
          totalDonations: existing.totalDonations + 1,
          totalAmount: existing.totalAmount + record.amount,
        });
      });

      const yearlyStats = Array.from(yearlyStatsMap.entries())
        .map(([year, stats]) => ({
          year,
          ...stats,
        }))
        .sort((a, b) => b.year - a.year);

      return { success: true, data: yearlyStats };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 대시보드 요약 정보 조회
   */
  async getDashboardSummary(donorId: UserId): Promise<
    Result<{
      totalDonated: number;
      donationCount: number;
      lastDonationDate?: Date;
      favoriteCategory: DonationCategory;
      yearlyTotal: number;
      monthlyAverage: number;
      rewardPointsEarned: number;
    }>
  > {
    try {
      const { data, error } = await this.supabase
        .from("donations")
        .select("amount, category, created_at")
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to get dashboard summary: ${error.message}`),
        };
      }

      if (data.length === 0) {
        return {
          success: true,
          data: {
            totalDonated: 0,
            donationCount: 0,
            favoriteCategory: DonationCategory.EDUCATION,
            yearlyTotal: 0,
            monthlyAverage: 0,
            rewardPointsEarned: 0,
          },
        };
      }

      const totalDonated = data.reduce((sum, record) => sum + record.amount, 0);
      const donationCount = data.length;
      const lastDonationDate = new Date(data[0].created_at);

      // 가장 많이 기부한 카테고리 찾기
      const categoryCount = data.reduce((acc, record) => {
        acc[record.category as DonationCategory] =
          (acc[record.category as DonationCategory] || 0) + 1;
        return acc;
      }, {} as Record<DonationCategory, number>);

      const favoriteCategory = Object.entries(categoryCount).reduce((a, b) =>
        categoryCount[a[0] as DonationCategory] >
        categoryCount[b[0] as DonationCategory]
          ? a
          : b
      )[0] as DonationCategory;

      // 올해 기부 총액
      const currentYear = new Date().getFullYear();
      const yearlyTotal = data
        .filter(
          (record) => new Date(record.created_at).getFullYear() === currentYear
        )
        .reduce((sum, record) => sum + record.amount, 0);

      // 월 평균 (올해 기준)
      const monthsElapsed = new Date().getMonth() + 1;
      const monthlyAverage =
        monthsElapsed > 0 ? yearlyTotal / monthsElapsed : 0;

      // 보상 포인트 (임시 계산)
      const rewardPointsEarned = Math.floor(totalDonated * 0.01); // 1% 포인트 적립

      return {
        success: true,
        data: {
          totalDonated,
          donationCount,
          lastDonationDate,
          favoriteCategory,
          yearlyTotal,
          monthlyAverage,
          rewardPointsEarned,
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 기부 삭제
   */
  async delete(id: DonationId): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from("donations")
        .delete()
        .eq("id", id.getValue());

      if (error) {
        return {
          success: false,
          error: new Error(`Failed to delete donation: ${error.message}`),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  /**
   * 레코드를 엔티티로 변환
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mapRecordToDonation(_record: DonationRecord): Donation {
    // TODO: 실제 Donation 엔티티 생성자에 맞게 구현
    // 현재는 임시 구현
    throw new Error("mapRecordToDonation not implemented yet");
  }

  /**
   * 엔티티를 레코드로 변환
   */
  private mapDonationToRecord(donation: Donation): Partial<DonationRecord> {
    return {
      id: donation.getId().getValue(),
      donor_id: donation.getDonorId(),
      // TODO: 실제 Donation 엔티티 메서드에 맞게 구현
      type: DonationType.DIRECT, // 임시
      status: donation.getStatus(),
      amount: 0, // donation.getAmount().getValue(), // 임시
      category: DonationCategory.EDUCATION, // 임시
      description: "", // donation.getDescription().getValue(), // 임시
      frequency: DonationFrequency.ONE_TIME, // 임시
      target_amount: null,
      institute_id: donation.getInstituteId()?.getValue(),
      opinion_leader_id: donation.getOpinionLeaderId()?.getValue(),
      metadata: {}, // 임시
      beneficiary_info: null, // 임시
      processing_info: {}, // 임시
      scheduled_at: donation.getScheduledAt()?.toISOString(),
      completed_at: donation.getCompletedAt()?.toISOString(),
      cancelled_at: donation.getCancelledAt()?.toISOString(),
      created_at: donation.getCreatedAt().toISOString(),
      updated_at: donation.getUpdatedAt().toISOString(),
    };
  }
  // TODO: 누락된 Repository 메서드들 구현
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_donation: Donation): Promise<Result<void>> {
    throw new Error("update method not implemented yet");
  }

  async findByType(
    _type: DonationType,
    _pagination: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findByType method not implemented yet");
  }

  async findByInstituteId(
    _instituteId: InstituteId,
    _pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findByInstituteId method not implemented yet");
  }

  async findByOpinionLeaderId(
    _leaderId: OpinionLeaderId,
    _pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findByOpinionLeaderId method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findRecurring(_donorId?: UserId): Promise<Result<Donation[]>> {
    throw new Error("findRecurring method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findScheduled(_date: Date): Promise<Result<Donation[]>> {
    throw new Error("findScheduled method not implemented yet");
  }

  async findByDateRange(
    _startDate: Date,
    _endDate: Date,
    _pagination: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findByDateRange method not implemented yet");
  }

  async getTotalByDonor(
    _donorId: UserId,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<Result<number>> {
    throw new Error("getTotalByDonor method not implemented yet");
  }

  async getTopDonors(
    _period: "monthly" | "yearly" | "all",
    _limit: number
  ): Promise<
    Result<
      Array<{
        donorId: UserId;
        totalAmount: number;
        donationCount: number;
        rank: number;
      }>
    >
  > {
    throw new Error("getTopDonors method not implemented yet");
  }

  async getCategoryStats(
    _startDate?: Date,
    _endDate?: Date
  ): Promise<
    Result<Record<DonationCategory, { count: number; totalAmount: number }>>
  > {
    throw new Error("getCategoryStats method not implemented yet");
  }

  async getRecentActivity(
    _donorId: UserId,
    _limit: number
  ): Promise<Result<Donation[]>> {
    throw new Error("getRecentActivity method not implemented yet");
  }

  async findPendingProcessing(): Promise<Result<Donation[]>> {
    throw new Error("findPendingProcessing method not implemented yet");
  }

  async getCompletionRate(
    _donorId?: UserId,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<Result<number>> {
    throw new Error("getCompletionRate method not implemented yet");
  }

  async getAverageAmount(
    _donorId?: UserId,
    _category?: DonationCategory
  ): Promise<Result<number>> {
    throw new Error("getAverageAmount method not implemented yet");
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findExpiredScheduled(_date: Date): Promise<Result<Donation[]>> {
    throw new Error("findExpiredScheduled method not implemented yet");
  }

  // 누락된 IDonationRepository 인터페이스 메서드들 추가

  async findByCriteria(
    _criteria: DonationSearchCriteria,
    _pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findByCriteria method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async countByStatus(_status: DonationStatus): Promise<Result<number>> {
    throw new Error("countByStatus method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async countByDonor(_donorId: UserId): Promise<Result<number>> {
    throw new Error("countByDonor method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTotalAmountByDonor(_donorId: UserId): Promise<Result<number>> {
    throw new Error("getTotalAmountByDonor method not implemented yet");
  }

  async getTotalAmountByInstitute(
    _instituteId: InstituteId
  ): Promise<Result<number>> {
    throw new Error("getTotalAmountByInstitute method not implemented yet");
  }

  async getTotalAmountByOpinionLeader(
    _leaderId: OpinionLeaderId
  ): Promise<Result<number>> {
    throw new Error("getTotalAmountByOpinionLeader method not implemented yet");
  }

  async findRecurringDonations(
    _pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<Donation>>> {
    throw new Error("findRecurringDonations method not implemented yet");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findDueRecurringDonations(_dueDate: Date): Promise<Result<Donation[]>> {
    throw new Error("findDueRecurringDonations method not implemented yet");
  }

  async getDonationStatsInPeriod(
    _startDate: Date,
    _endDate: Date,
    _donorId?: UserId
  ): Promise<
    Result<{
      totalDonations: number;
      totalAmount: number;
      averageAmount: number;
      donationsByCategory: Record<DonationCategory, number>;
      donationsByType: Record<DonationType, number>;
    }>
  > {
    throw new Error("getDonationStatsInPeriod method not implemented yet");
  }

  async getPopularInstitutes(
    _period: "monthly" | "yearly" | "all",
    _limit: number
  ): Promise<
    Result<
      {
        instituteId: InstituteId;
        totalAmount: number;
        donorCount: number;
        donationCount: number;
      }[]
    >
  > {
    throw new Error("getPopularInstitutes method not implemented yet");
  }

  async getPopularOpinionLeaders(
    _period: "monthly" | "yearly" | "all",
    _limit: number
  ): Promise<
    Result<
      {
        leaderId: OpinionLeaderId;
        totalAmount: number;
        supporterCount: number;
        supportCount: number;
      }[]
    >
  > {
    throw new Error("getPopularOpinionLeaders method not implemented yet");
  }
}
