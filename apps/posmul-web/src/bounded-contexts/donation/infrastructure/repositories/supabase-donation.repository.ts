
import { createClient } from "../../../../lib/supabase/client";
import { IDonationRepository, DonationSearchCriteria } from "../../domain/repositories/donation.repository";
import { Donation } from "../../domain/entities/donation.entity";
import {
    DonationStatus,
    DonationType,
    DonationCategory,
    DonationId,
    InstituteId,
    OpinionLeaderId,
    DonationFrequency
} from "../../domain/value-objects/donation-value-objects";
import { Result, PaginatedResult, UserId } from "@posmul/auth-economy-sdk";
import { PostgrestError } from "@supabase/supabase-js";

export class SupabaseDonationRepository implements IDonationRepository {
    private supabase = createClient();

    // Helper to standardise error handling
    private handleError(error: unknown): Result<any> {
        console.error("SupabaseDonationRepository Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error : new Error(JSON.stringify(error)),
        };
    }

    async save(donation: Donation): Promise<Result<void>> {
        const data = donation.getDetails();
        const { error } = await this.supabase
            .schema('donation')
            .from('donations')
            .upsert({
                id: data.id,
                donor_id: data.donorId,
                donation_type: data.donationType,
                amount: data.amount,
                category: data.category,
                description: data.description,
                frequency: data.frequency,
                status: data.status,
                metadata: data.metadata,
                institute_id: data.instituteId || null,
                opinion_leader_id: data.opinionLeaderId || null,
                beneficiary_info: data.beneficiaryInfo,
                processing_info: data.processingInfo,
                scheduled_at: data.scheduledAt?.toISOString(),
                completed_at: data.completedAt?.toISOString(),
                cancelled_at: data.cancelledAt?.toISOString(),
                created_at: data.createdAt.toISOString(),
                updated_at: data.updatedAt.toISOString(),
            });

        if (error) return this.handleError(error);
        return { success: true, data: undefined };
    }

    async findById(id: DonationId): Promise<Result<Donation | null>> {
        const { data, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('*')
            .eq('id', id.getValue())
            .single();

        if (error) {
            if (error.code === 'PGRST116') return { success: true, data: null }; // Not found
            return this.handleError(error);
        }

        if (!data) return { success: true, data: null };

        return {
            success: true,
            data: Donation.reconstitute(this.mapDatabaseRowToEntityProps(data)),
        };
    }

    async update(donation: Donation): Promise<Result<void>> {
        return this.save(donation);
    }

    async delete(id: DonationId): Promise<Result<void>> {
        const { error } = await this.supabase
            .schema('donation')
            .from('donations')
            .delete()
            .eq('id', id.getValue());

        if (error) return this.handleError(error);
        return { success: true, data: undefined };
    }

    // --- Search & Filtering ---

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
        let query = this.supabase
            .schema('donation')
            .from('donations')
            .select('*', { count: 'exact' });

        if (criteria.donorId) query = query.eq('donor_id', criteria.donorId);
        if (criteria.status) query = query.eq('status', criteria.status);
        if (criteria.type) query = query.eq('donation_type', criteria.type);
        if (criteria.category) query = query.eq('category', criteria.category);
        if (criteria.frequency) query = query.eq('frequency', criteria.frequency);
        if (criteria.instituteId) query = query.eq('institute_id', criteria.instituteId.getValue());
        if (criteria.opinionLeaderId) query = query.eq('opinion_leader_id', criteria.opinionLeaderId.getValue());
        if (criteria.startDate) query = query.gte('created_at', criteria.startDate.toISOString());
        if (criteria.endDate) query = query.lte('created_at', criteria.endDate.toISOString());
        if (criteria.minAmount) query = query.gte('amount', criteria.minAmount);
        if (criteria.maxAmount) query = query.lte('amount', criteria.maxAmount);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) return this.handleError(error);

        const items = (data || []).map(row =>
            Donation.reconstitute(this.mapDatabaseRowToEntityProps(row))
        );

        const total = count || 0;
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
            }
        };
    }

    // --- Aggregations ---

    async countByStatus(status: DonationStatus): Promise<Result<number>> {
        const { count, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

        if (error) return this.handleError(error);
        return { success: true, data: count || 0 };
    }

    async countByDonor(donorId: UserId): Promise<Result<number>> {
        const { count, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('donor_id', donorId);

        if (error) return this.handleError(error);
        return { success: true, data: count || 0 };
    }

    async getTotalAmountByDonor(donorId: UserId): Promise<Result<number>> {
        // Note: Supabase JS doesn't support SUM directly well without RPC or client-side calculation (or raw query if allowed)
        // For now, assume we fetch and sum locally or use a custom RPC eventually if performance matters.
        // However, since we are doing browser-side, let's keep it simple or use .select('amount')

        // Attempting to use a simple approach: fetch all amounts (careful with large datasets)
        // Better approach: create a DB view or RPC. But for "Local First", let's try to limit if possible.
        // Or we can use `rpc` call if `get_total_donation_amount` exists.
        // Fallback: fetch basic stats.

        const { data, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('amount')
            .eq('donor_id', donorId)
            .eq('status', 'COMPLETED');

        if (error) return this.handleError(error);

        const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
        return { success: true, data: total };
    }

    async getTotalAmountByInstitute(instituteId: InstituteId): Promise<Result<number>> {
        const { data, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('amount')
            .eq('institute_id', instituteId.getValue())
            .eq('status', 'COMPLETED');

        if (error) return this.handleError(error);
        const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
        return { success: true, data: total };
    }

    async getTotalAmountByOpinionLeader(leaderId: OpinionLeaderId): Promise<Result<number>> {
        const { data, error } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('amount')
            .eq('opinion_leader_id', leaderId.getValue())
            .eq('status', 'COMPLETED');

        if (error) return this.handleError(error);
        const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
        return { success: true, data: total };
    }

    // --- Recurring & Stats (Placeholders / Simplified) ---

    async findRecurringDonations(page: number = 1, limit: number = 10): Promise<Result<PaginatedResult<Donation>>> {
        return this.findByCriteria({ frequency: DonationFrequency.MONTHLY }, page, limit);
    }

    async findDueRecurringDonations(dueDate: Date): Promise<Result<Donation[]>> {
        return { success: true, data: [] }; // Implementation complex, skipped for now
    }

    async getDonationStatsInPeriod(startDate: Date, endDate: Date, donorId?: UserId): Promise<Result<any>> {
        // Placeholder
        return {
            success: true, data: {
                totalDonations: 0,
                totalAmount: 0,
                averageAmount: 0,
                donationsByCategory: {},
                donationsByType: {}
            }
        };
    }

    async getMonthlyStats(year: number, donorId?: UserId): Promise<Result<any>> {
        return { success: true, data: [] };
    }

    async getYearlyStats(donorId?: UserId): Promise<Result<any>> {
        return { success: true, data: [] };
    }

    async getTopDonors(period: any, limit: number): Promise<Result<any>> {
        return { success: true, data: [] };
    }

    async getPopularInstitutes(period: any, limit: number): Promise<Result<any>> {
        return { success: true, data: [] };
    }

    async getPopularOpinionLeaders(period: any, limit: number): Promise<Result<any>> {
        return { success: true, data: [] };
    }

    async getDashboardSummary(donorId: UserId): Promise<Result<any>> {
        const totalAmount = await this.getTotalAmountByDonor(donorId);
        const count = await this.countByDonor(donorId);

        // Get favorite category (naive implementation: fetch last 50 and count)
        const favoriteRec = await this.getFavoriteCategory(donorId);

        return {
            success: true,
            data: {
                totalDonated: totalAmount.success ? totalAmount.data : 0,
                donationCount: count.success ? count.data : 0,
                lastDonationDate: undefined,
                favoriteCategory: favoriteRec,
                yearlyTotal: 0,
                monthlyAverage: 0,
                rewardPointsEarned: 0
            }
        };
    }

    private async getFavoriteCategory(donorId: UserId): Promise<DonationCategory> {
        const { data } = await this.supabase
            .schema('donation')
            .from('donations')
            .select('category')
            .eq('donor_id', donorId)
            .limit(50);

        if (!data || data.length === 0) return DonationCategory.OTHER;

        const counts: Record<string, number> = {};
        data.forEach(row => {
            counts[row.category] = (counts[row.category] || 0) + 1;
        });

        let max = 0;
        let fav = DonationCategory.OTHER;
        for (const [cat, count] of Object.entries(counts)) {
            if (count > max) {
                max = count;
                fav = cat as DonationCategory;
            }
        }
        return fav;
    }

    // --- Mapper ---
    private mapDatabaseRowToEntityProps(row: any): any {
        // DB columns are snake_case, entity expects camelCase or plain object for reconstitution?
        // Donation.reconstitute expects whatever "raw" structure or a specific DTO.
        // Looking at existing `mcp-donation.repository.ts`, it passes raw rows directly.
        // But `mcp-donation.repository.ts` uses `row as Record<string, unknown>`.
        // Let's assume standard snake_case to camelCase mapping might be needed inside `reconstitute` 
        // OR `reconstitute` handles snake_case keys.
        // Checking `Donation.reconstitute` signature would be best.
        // For now, I will map common fields to be safe if `reconstitute` uses camelCase props from DTO.
        // Actually, looking at mcp repo again: `Donation.reconstitute(result.data[0])` where `result.data` comes from SQL query `SELECT *`.
        // So `reconstitute` likely handles snake_case keys OR the SQL result was mapped (unlikely for MCP adapter).

        // Let's manually map to be safe:
        return {
            id: row.id,
            donorId: row.donor_id,
            donationType: row.donation_type,
            amount: row.amount,
            category: row.category,
            description: row.description,
            frequency: row.frequency,
            status: row.status,
            metadata: row.metadata,
            instituteId: row.institute_id,
            opinionLeaderId: row.opinion_leader_id,
            beneficiaryInfo: row.beneficiary_info,
            processingInfo: row.processing_info,
            scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
            cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
        };
    }
}
