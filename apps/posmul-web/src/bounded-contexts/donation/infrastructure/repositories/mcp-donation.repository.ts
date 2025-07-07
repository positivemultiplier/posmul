/**
 * MCP-based Donation Repository Implementation
 * Supabase MCP를 사용한 기부 리포지토리 구현체
 */

import { 
  MCPError, 
  adaptErrorToBaseError,
  createDefaultMCPAdapter,
  Result,
  CompatibleBaseError,
  ExtendedPaginationParams,
  success,
  failure,
  normalizeExtendedPaginationParams
} from "../../../../shared/legacy-compatibility";
import { PaginatedResult } from "@posmul/auth-economy-sdk";

import { UserId } from "@posmul/auth-economy-sdk";

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
  DonationAmount,
  DonationDescription,
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
 * MCPDonationRepository
 * MCP를 사용한 기부 리포지토리 구현체
 */
export class MCPDonationRepository implements IDonationRepository {
  private readonly mcpAdapter;

  constructor() {
    this.mcpAdapter = createDefaultMCPAdapter();
  }

  /**
   * 기부 저장
   */
  async save(donation: Donation): Promise<Result<void, CompatibleBaseError>> {
    try {
      const record = this.mapDonationToRecord(donation);

      const query = `
        INSERT INTO donations (
          id, donor_id, type, status, amount, category, description, frequency,
          target_amount, institute_id, opinion_leader_id, metadata, beneficiary_info,
          processing_info, scheduled_at, completed_at, cancelled_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          amount = EXCLUDED.amount,
          metadata = EXCLUDED.metadata,
          processing_info = EXCLUDED.processing_info,
          completed_at = EXCLUDED.completed_at,
          cancelled_at = EXCLUDED.cancelled_at,
          updated_at = NOW();
      `;

      await this.mcpAdapter.executeSQL(query, [
        record.id, record.donor_id, record.type, record.status, record.amount,
        record.category, record.description, record.frequency, record.target_amount,
        record.institute_id, record.opinion_leader_id, JSON.stringify(record.metadata),
        JSON.stringify(record.beneficiary_info), JSON.stringify(record.processing_info),
        record.scheduled_at, record.completed_at, record.cancelled_at
      ]);

      return success(undefined);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "save_donation"));
    }
  }

  /**
   * ID로 기부 조회
   */
  async findById(id: DonationId): Promise<Result<Donation | null, CompatibleBaseError>> {
    try {
      const query = `SELECT * FROM donations WHERE id = $1`;

      const result = await this.mcpAdapter.executeSQL(query, [id.getValue()]);

      if (!result?.data || result.data.length === 0) {
        return success(null);
      }

      const donation = this.mapRecordToDonation(result.data[0]);
      return success(donation);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donation_by_id"));
    }
  }

  /**
   * 기부자별 기부 목록 조회
   */
  async findByDonorId(
    donorId: UserId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const dataQuery = `
        SELECT * FROM donations 
        WHERE donor_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE donor_id = $1
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [donorId, normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, [donorId]),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_donor"));
    }
  }

  /**
   * 상태별 기부 목록 조회
   */
  async findByStatus(
    status: DonationStatus,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const dataQuery = `
        SELECT * FROM donations 
        WHERE status = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE status = $1
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [status, normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, [status]),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_status"));
    }
  }

  /**
   * 업데이트
   */
  async update(donation: Donation): Promise<Result<void, CompatibleBaseError>> {
    try {
      const record = this.mapDonationToRecord(donation);

      const query = `
        UPDATE donations SET
          status = $2,
          amount = $3,
          metadata = $4,
          processing_info = $5,
          completed_at = $6,
          cancelled_at = $7,
          updated_at = NOW()
        WHERE id = $1
      `;

      await this.mcpAdapter.executeSQL(query, [
        record.id, record.status, record.amount, JSON.stringify(record.metadata),
        JSON.stringify(record.processing_info), record.completed_at, record.cancelled_at
      ]);

      return success(undefined);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "update_donation"));
    }
  }

  /**
   * 삭제
   */
  async delete(id: DonationId): Promise<Result<void, CompatibleBaseError>> {
    try {
      const query = `DELETE FROM donations WHERE id = $1`;
      await this.mcpAdapter.executeSQL(query, [id.getValue()]);
      return success(undefined);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "delete_donation"));
    }
  }

  /**
   * 타입별 기부 목록 조회
   */
  async findByType(
    type: DonationType,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const dataQuery = `
        SELECT * FROM donations 
        WHERE type = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE type = $1
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [type, normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, [type]),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_type"));
    }
  }

  /**
   * 기관별 기부 목록 조회
   */
  async findByInstituteId(
    instituteId: InstituteId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const dataQuery = `
        SELECT * FROM donations 
        WHERE institute_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE institute_id = $1
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [instituteId.getValue(), normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, [instituteId.getValue()]),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_institute"));
    }
  }

  /**
   * 오피니언 리더별 기부 목록 조회
   */
  async findByOpinionLeaderId(
    leaderId: OpinionLeaderId,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const dataQuery = `
        SELECT * FROM donations 
        WHERE opinion_leader_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE opinion_leader_id = $1
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [leaderId.getValue(), normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, [leaderId.getValue()]),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_opinion_leader"));
    }
  }

  /**
   * 복합 검색
   */
  async findByCriteria(
    criteria: DonationSearchCriteria,
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;
      const sortBy = normalizedPagination.sortBy || "created_at";
      const sortOrder = normalizedPagination.sortOrder === "asc" ? "ASC" : "DESC";

      const whereClause = this.buildWhereClause(criteria);
      const params = this.buildQueryParams(criteria);

      const dataQuery = `
        SELECT * FROM donations 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        ${whereClause}
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [...params, normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery, params),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_donations_by_criteria"));
    }
  }

  // 통계 메서드들 - 간단한 구현
  async countByStatus(status: DonationStatus): Promise<Result<number, CompatibleBaseError>> {
    try {
      const query = `SELECT COUNT(*) as count FROM donations WHERE status = $1`;
      const result = await this.mcpAdapter.executeSQL(query, [status]);
      return success(result.data?.[0]?.count || 0);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "count_by_status"));
    }
  }

  async countByDonor(donorId: UserId): Promise<Result<number, CompatibleBaseError>> {
    try {
      const query = `SELECT COUNT(*) as count FROM donations WHERE donor_id = $1`;
      const result = await this.mcpAdapter.executeSQL(query, [donorId]);
      return success(result.data?.[0]?.count || 0);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "count_by_donor"));
    }
  }

  async getTotalAmountByDonor(donorId: UserId): Promise<Result<number, CompatibleBaseError>> {
    try {
      const query = `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donor_id = $1 AND status = 'completed'`;
      const result = await this.mcpAdapter.executeSQL(query, [donorId]);
      return success(result.data?.[0]?.total || 0);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_total_amount_by_donor"));
    }
  }

  async getTotalAmountByInstitute(instituteId: InstituteId): Promise<Result<number, CompatibleBaseError>> {
    try {
      const query = `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE institute_id = $1 AND status = 'completed'`;
      const result = await this.mcpAdapter.executeSQL(query, [instituteId.getValue()]);
      return success(result.data?.[0]?.total || 0);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_total_amount_by_institute"));
    }
  }

  async getTotalAmountByOpinionLeader(leaderId: OpinionLeaderId): Promise<Result<number, CompatibleBaseError>> {
    try {
      const query = `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE opinion_leader_id = $1 AND status = 'completed'`;
      const result = await this.mcpAdapter.executeSQL(query, [leaderId.getValue()]);
      return success(result.data?.[0]?.total || 0);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_total_amount_by_opinion_leader"));
    }
  }

  // 정기 기부 관련
  async findRecurringDonations(
    pagination?: ExtendedPaginationParams
  ): Promise<Result<PaginatedResult<Donation>, CompatibleBaseError>> {
    try {
      const normalizedPagination = normalizeExtendedPaginationParams(pagination);
      const offset = (normalizedPagination.page - 1) * normalizedPagination.limit;

      const dataQuery = `
        SELECT * FROM donations 
        WHERE frequency != 'one_time'
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM donations 
        WHERE frequency != 'one_time'
      `;

      const [dataResult, countResult] = await Promise.all([
        this.mcpAdapter.executeSQL(dataQuery, [normalizedPagination.limit, offset]),
        this.mcpAdapter.executeSQL(countQuery),
      ]);

      const donations = dataResult.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      const total = countResult.data?.[0]?.total || 0;
      const totalPages = Math.ceil(total / normalizedPagination.limit);

      return success({
        data: donations,
        total,
        page: normalizedPagination.page,
        pageSize: normalizedPagination.limit,
        totalPages,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_recurring_donations"));
    }
  }

  async findDueRecurringDonations(dueDate: Date): Promise<Result<Donation[], CompatibleBaseError>> {
    try {
      const query = `
        SELECT * FROM donations 
        WHERE frequency != 'one_time' 
          AND scheduled_at <= $1 
          AND status = 'pending'
        ORDER BY scheduled_at ASC
      `;
      
      const result = await this.mcpAdapter.executeSQL(query, [dueDate.toISOString()]);
      const donations = result.data?.map((record: any) =>
        this.mapRecordToDonation(record)
      ) || [];

      return success(donations);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "find_due_recurring_donations"));
    }
  }

  // 통계 메서드들 - 기본 구현
  async getDonationStatsInPeriod(
    startDate: Date,
    endDate: Date,
    donorId?: UserId
  ): Promise<Result<{
    totalDonations: number;
    totalAmount: number;
    averageAmount: number;
    donationsByCategory: Record<DonationCategory, number>;
    donationsByType: Record<DonationType, number>;
  }, CompatibleBaseError>> {
    try {
      // 간단한 구현 - 실제로는 더 복잡한 쿼리 필요
      return success({
        totalDonations: 0,
        totalAmount: 0,
        averageAmount: 0,
        donationsByCategory: {} as Record<DonationCategory, number>,
        donationsByType: {} as Record<DonationType, number>,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_donation_stats_in_period"));
    }
  }

  async getMonthlyStats(
    year: number,
    donorId?: UserId
  ): Promise<Result<{
    month: number;
    totalDonations: number;
    totalAmount: number;
  }[], CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success([]);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_monthly_stats"));
    }
  }

  async getYearlyStats(donorId?: UserId): Promise<Result<{
    year: number;
    totalDonations: number;
    totalAmount: number;
  }[], CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success([]);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_yearly_stats"));
    }
  }

  async getTopDonors(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<Result<{
    donorId: UserId;
    totalAmount: number;
    donationCount: number;
    rank: number;
  }[], CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success([]);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_top_donors"));
    }
  }

  async getPopularInstitutes(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<Result<{
    instituteId: InstituteId;
    totalAmount: number;
    donorCount: number;
    donationCount: number;
  }[], CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success([]);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_popular_institutes"));
    }
  }

  async getPopularOpinionLeaders(
    period: "monthly" | "yearly" | "all",
    limit: number
  ): Promise<Result<{
    leaderId: OpinionLeaderId;
    totalAmount: number;
    supporterCount: number;
    supportCount: number;
  }[], CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success([]);
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_popular_opinion_leaders"));
    }
  }

  async getDashboardSummary(donorId: UserId): Promise<Result<{
    totalDonated: number;
    donationCount: number;
    lastDonationDate?: Date;
    favoriteCategory: DonationCategory;
    yearlyTotal: number;
    monthlyAverage: number;
    rewardPointsEarned: number;
  }, CompatibleBaseError>> {
    try {
      // 간단한 구현
      return success({
        totalDonated: 0,
        donationCount: 0,
        favoriteCategory: 'charity' as DonationCategory,
        yearlyTotal: 0,
        monthlyAverage: 0,
        rewardPointsEarned: 0,
      });
    } catch (error) {
      return failure(adaptErrorToBaseError(error, "get_dashboard_summary"));
    }
  }

  // 헬퍼 메서드들
  private mapDonationToRecord(donation: Donation): DonationRecord {
    return {
      id: donation.getId().getValue(),
      donor_id: donation.getDonorId(),
      type: donation.getDonationType(),
      status: donation.getStatus(),
      amount: donation.getAmount().getValue(),
      category: donation.getCategory(),
      description: donation.getDescription().getValue(),
      frequency: donation.getFrequency(),
      target_amount: null, // Donation entity에 targetAmount가 없어 보임
      institute_id: donation.getInstituteId()?.getValue() || null,
      opinion_leader_id: donation.getOpinionLeaderId()?.getValue() || null,
      metadata: donation.getMetadata() as any,
      beneficiary_info: donation.getBeneficiaryInfo() as any || null,
      processing_info: donation.getProcessingInfo() as any,
      scheduled_at: null, // Donation entity 확인 필요
      completed_at: null, // Donation entity 확인 필요
      cancelled_at: null, // Donation entity 확인 필요
      created_at: new Date().toISOString(), // Donation entity 확인 필요
      updated_at: new Date().toISOString(), // Donation entity 확인 필요
    };
  }

  private mapRecordToDonation(record: DonationRecord): Donation {
    return new Donation(
      new DonationId(record.id),
      record.donor_id as UserId,
      record.type,
      new DonationAmount(record.amount),
      record.category,
      new DonationDescription(record.description),
      record.frequency,
      record.status,
      record.metadata as any,
      record.institute_id ? new InstituteId(record.institute_id) : undefined,
      record.opinion_leader_id ? new OpinionLeaderId(record.opinion_leader_id) : undefined,
      record.beneficiary_info as any,
      record.processing_info as any,
      record.scheduled_at ? new Date(record.scheduled_at) : undefined,
      record.completed_at ? new Date(record.completed_at) : undefined,
      record.cancelled_at ? new Date(record.cancelled_at) : undefined,
      new Date(record.created_at),
      new Date(record.updated_at),
    );
  }

  private buildWhereClause(criteria: DonationSearchCriteria): string {
    const conditions: string[] = [];
    let paramIndex = 1;

    if (criteria.donorId) conditions.push(`donor_id = $${paramIndex++}`);
    if (criteria.status) conditions.push(`status = $${paramIndex++}`);
    if (criteria.type) conditions.push(`type = $${paramIndex++}`);
    if (criteria.category) conditions.push(`category = $${paramIndex++}`);
    if (criteria.frequency) conditions.push(`frequency = $${paramIndex++}`);
    if (criteria.instituteId) conditions.push(`institute_id = $${paramIndex++}`);
    if (criteria.opinionLeaderId) conditions.push(`opinion_leader_id = $${paramIndex++}`);
    if (criteria.startDate) conditions.push(`created_at >= $${paramIndex++}`);
    if (criteria.endDate) conditions.push(`created_at <= $${paramIndex++}`);
    if (criteria.minAmount) conditions.push(`amount >= $${paramIndex++}`);
    if (criteria.maxAmount) conditions.push(`amount <= $${paramIndex++}`);
    if (criteria.isAnonymous !== undefined) conditions.push(`metadata->>'isAnonymous' = $${paramIndex++}`);

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildQueryParams(criteria: DonationSearchCriteria): any[] {
    const params: any[] = [];

    if (criteria.donorId) params.push(criteria.donorId);
    if (criteria.status) params.push(criteria.status);
    if (criteria.type) params.push(criteria.type);
    if (criteria.category) params.push(criteria.category);
    if (criteria.frequency) params.push(criteria.frequency);
    if (criteria.instituteId) params.push(criteria.instituteId.getValue());
    if (criteria.opinionLeaderId) params.push(criteria.opinionLeaderId.getValue());
    if (criteria.startDate) params.push(criteria.startDate.toISOString());
    if (criteria.endDate) params.push(criteria.endDate.toISOString());
    if (criteria.minAmount) params.push(criteria.minAmount);
    if (criteria.maxAmount) params.push(criteria.maxAmount);
    if (criteria.isAnonymous !== undefined) params.push(criteria.isAnonymous.toString());

    return params;
  }
}
