/**
 * MCP Donation Repository Implementation
 */
import { PaginatedResult, Result, UserId } from "@posmul/auth-economy-sdk";
import { createDefaultMCPAdapter, buildParameterizedQuery } from "../../../../shared/legacy-compatibility";
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

export class MCPDonationRepository implements IDonationRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) { }

  async save(donation: Donation): Promise<Result<void>> {
    try {
      const data = donation.getDetails();
      const query = `
        INSERT INTO donation.donations (
          id, donor_id, donation_type, amount, category, description,
          frequency, status, metadata, institute_id, opinion_leader_id,
          beneficiary_info, processing_info, scheduled_at, completed_at,
          cancelled_at, created_at, updated_at
        ) VALUES (
          $id, $donorId, $donationType, $amount, $category, $description,
          $frequency, $status, $metadata, $instituteId, $opinionLeaderId,
          $beneficiaryInfo, $processingInfo, $scheduledAt, $completedAt,
          $cancelledAt, $createdAt, $updatedAt
        )
        ON CONFLICT (id) DO UPDATE SET
          amount = EXCLUDED.amount,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata,
          beneficiary_info = EXCLUDED.beneficiary_info,
          processing_info = EXCLUDED.processing_info,
          scheduled_at = EXCLUDED.scheduled_at,
          completed_at = EXCLUDED.completed_at,
          cancelled_at = EXCLUDED.cancelled_at,
          updated_at = EXCLUDED.updated_at
      `;

      const params = {
        id: data.id,
        donorId: data.donorId,
        donationType: data.donationType,
        amount: data.amount,
        category: data.category,
        description: data.description,
        frequency: data.frequency,
        status: data.status,
        metadata: JSON.stringify(data.metadata),
        instituteId: data.instituteId || null,
        opinionLeaderId: data.opinionLeaderId || null,
        beneficiaryInfo: data.beneficiaryInfo ? JSON.stringify(data.beneficiaryInfo) : null,
        processingInfo: JSON.stringify(data.processingInfo),
        scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : null,
        completedAt: data.completedAt ? data.completedAt.toISOString() : null,
        cancelledAt: data.cancelledAt ? data.cancelledAt.toISOString() : null,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      };

      const finalQuery = buildParameterizedQuery(query, params);
      await this.mcpAdapter.executeSQL(finalQuery);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to save donation"),
      };
    }
  }

  async findById(id: DonationId): Promise<Result<Donation | null>> {
    try {
      const query = "SELECT * FROM donation.donations WHERE id = $id";
      const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
      const result = await this.mcpAdapter.executeSQL(finalQuery);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: Donation.reconstitute(result.data[0]),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to find donation"),
      };
    }
  }

  async update(donation: Donation): Promise<Result<void>> {
    return this.save(donation);
  }

  async delete(id: DonationId): Promise<Result<void>> {
    try {
      const query = "DELETE FROM donation.donations WHERE id = $id";
      const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
      await this.mcpAdapter.executeSQL(finalQuery);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to delete donation"),
      };
    }
  }

  async findByDonorId(
    donorId: UserId,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria({ donorId }, page, limit);
  }

  async findByStatus(
    status: DonationStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria({ status }, page, limit);
  }

  async findByType(
    type: DonationType,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria({ type }, page, limit);
  }

  async findByInstituteId(
    instituteId: InstituteId,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria({ instituteId }, page, limit);
  }

  async findByOpinionLeaderId(
    leaderId: OpinionLeaderId,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria({ opinionLeaderId: leaderId }, page, limit);
  }

  async findByCriteria(
    criteria: DonationSearchCriteria,
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    try {
      let query = "SELECT * FROM donation.donations WHERE 1=1";
      const params: Record<string, any> = {};

      if (criteria.donorId) {
        query += ` AND donor_id = $donorId`;
        params.donorId = criteria.donorId.toString();
      }
      if (criteria.status) {
        query += ` AND status = $status`;
        params.status = criteria.status;
      }
      if (criteria.type) {
        query += ` AND donation_type = $type`;
        params.type = criteria.type;
      }
      if (criteria.category) {
        query += ` AND category = $category`;
        params.category = criteria.category;
      }
      if (criteria.frequency) {
        query += ` AND frequency = $frequency`;
        params.frequency = criteria.frequency;
      }
      if (criteria.instituteId) {
        query += ` AND institute_id = $instituteId`;
        params.instituteId = criteria.instituteId.getValue();
      }
      if (criteria.opinionLeaderId) {
        query += ` AND opinion_leader_id = $opinionLeaderId`;
        params.opinionLeaderId = criteria.opinionLeaderId.getValue();
      }
      if (criteria.startDate) {
        query += ` AND created_at >= $startDate`;
        params.startDate = criteria.startDate.toISOString();
      }
      if (criteria.endDate) {
        query += ` AND created_at <= $endDate`;
        params.endDate = criteria.endDate.toISOString();
      }
      if (criteria.minAmount) {
        query += ` AND amount >= $minAmount`;
        params.minAmount = criteria.minAmount;
      }
      if (criteria.maxAmount) {
        query += ` AND amount <= $maxAmount`;
        params.maxAmount = criteria.maxAmount;
      }
      if (criteria.isAnonymous !== undefined) {
        query += ` AND (metadata->>'isAnonymous')::boolean = $isAnonymous`;
        params.isAnonymous = criteria.isAnonymous;
      }

      // Count query
      const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
      const finalCountQuery = buildParameterizedQuery(countQuery, params);
      const countResult = await this.mcpAdapter.executeSQL(finalCountQuery);
      const total = parseInt(countResult.data?.[0]?.count as string || "0");

      // Pagination
      query += ` ORDER BY created_at DESC LIMIT $limit OFFSET $offset`;
      params.limit = limit;
      params.offset = (page - 1) * limit;

      const finalQuery = buildParameterizedQuery(query, params);
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      const items = (result.data || []).map((row: any) =>
        Donation.reconstitute(row)
      );

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items,
          total,
          page,
          pageSize: limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to find donations"),
      };
    }
  }

  async countByStatus(status: DonationStatus): Promise<Result<number>> {
    try {
      const query = "SELECT COUNT(*) as count FROM donation.donations WHERE status = $status";
      const finalQuery = buildParameterizedQuery(query, { status });
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      return {
        success: true,
        data: parseInt(result.data?.[0]?.count || "0"),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to count donations"),
      };
    }
  }

  async countByDonor(donorId: UserId): Promise<Result<number>> {
    try {
      const query = "SELECT COUNT(*) as count FROM donation.donations WHERE donor_id = $donorId";
      const finalQuery = buildParameterizedQuery(query, { donorId: donorId.toString() });
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      return {
        success: true,
        data: parseInt(result.data?.[0]?.count || "0"),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to count donations"),
      };
    }
  }

  async getTotalAmountByDonor(donorId: UserId): Promise<Result<number>> {
    try {
      const query = "SELECT SUM(amount) as total FROM donation.donations WHERE donor_id = $donorId AND status = 'COMPLETED'";
      const finalQuery = buildParameterizedQuery(query, { donorId: donorId.toString() });
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      return {
        success: true,
        data: Number(result.data?.[0]?.total || 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to get total amount"),
      };
    }
  }

  async getTotalAmountByInstitute(
    instituteId: InstituteId
  ): Promise<Result<number>> {
    try {
      const query = "SELECT SUM(amount) as total FROM donation.donations WHERE institute_id = $instituteId AND status = 'COMPLETED'";
      const finalQuery = buildParameterizedQuery(query, { instituteId: instituteId.getValue() });
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      return {
        success: true,
        data: Number(result.data?.[0]?.total || 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to get total amount"),
      };
    }
  }

  async getTotalAmountByOpinionLeader(
    leaderId: OpinionLeaderId
  ): Promise<Result<number>> {
    try {
      const query = "SELECT SUM(amount) as total FROM donation.donations WHERE opinion_leader_id = $leaderId AND status = 'COMPLETED'";
      const finalQuery = buildParameterizedQuery(query, { leaderId: leaderId.getValue() });
      const result = await this.mcpAdapter.executeSQL(finalQuery);
      return {
        success: true,
        data: Number(result.data?.[0]?.total || 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to get total amount"),
      };
    }
  }

  async findRecurringDonations(
    page: number = 1,
    limit: number = 10
  ): Promise<Result<PaginatedResult<Donation>>> {
    return this.findByCriteria(
      { frequency: DonationFrequency.MONTHLY }, // Simplified, should check != ONCE
      page,
      limit
    );
  }

  async findDueRecurringDonations(dueDate: Date): Promise<Result<Donation[]>> {
    // This requires complex logic to check next execution date
    // For now, returning empty as placeholder
    return { success: true, data: [] };
  }

  async getDonationStatsInPeriod(
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
  > {
    // Placeholder implementation
    return {
      success: true,
      data: {
        totalDonations: 0,
        totalAmount: 0,
        averageAmount: 0,
        donationsByCategory: {} as Record<DonationCategory, number>,
        donationsByType: {} as Record<DonationType, number>,
      },
    };
  }

  async getMonthlyStats(
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
  > {
    return { success: true, data: [] };
  }

  async getYearlyStats(donorId?: UserId): Promise<
    Result<
      {
        year: number;
        totalDonations: number;
        totalAmount: number;
      }[]
    >
  > {
    return { success: true, data: [] };
  }

  async getTopDonors(
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
  > {
    return { success: true, data: [] };
  }

  async getPopularInstitutes(
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
  > {
    return { success: true, data: [] };
  }

  async getPopularOpinionLeaders(
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
  > {
    return { success: true, data: [] };
  }

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
      const totalAmountResult = await this.getTotalAmountByDonor(donorId);
      const countResult = await this.countByDonor(donorId);

      // Simplified implementation
      return {
        success: true,
        data: {
          totalDonated: totalAmountResult.success ? totalAmountResult.data : 0,
          donationCount: countResult.success ? countResult.data : 0,
          lastDonationDate: undefined,
          favoriteCategory: DonationCategory.OTHER,
          yearlyTotal: 0,
          monthlyAverage: 0,
          rewardPointsEarned: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Failed to get dashboard summary"),
      };
    }
  }
}
