/**
 * MCP Opinion Leader Repository Implementation
 */
import { PaginatedResult, Result, UserId } from "@posmul/auth-economy-sdk";
import { createDefaultMCPAdapter, buildParameterizedQuery } from "../../../../shared/legacy-compatibility";
import { OpinionLeader, OpinionLeaderStatus, VerificationStatus } from "../../domain/entities/opinion-leader.entity";
import {
    IOpinionLeaderRepository,
    OpinionLeaderSearchCriteria,
} from "../../domain/repositories/opinion-leader.repository";
import { OpinionLeaderId, SupportCategory } from "../../domain/value-objects/donation-value-objects";

export class MCPOpinionLeaderRepository implements IOpinionLeaderRepository {
    private readonly mcpAdapter = createDefaultMCPAdapter();

    constructor(private readonly projectId: string) { }

    async save(opinionLeader: OpinionLeader): Promise<Result<void>> {
        try {
            const query = `
        INSERT INTO user.opinion_leaders (
          id, user_id, display_name, bio, profile_image_url,
          category, verification_status, is_active, created_at, updated_at
        ) VALUES (
          $id, $userId, $displayName, $bio, $profileImageUrl,
          $category, $verificationStatus, $isActive, $createdAt, $updatedAt
        )
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio,
          profile_image_url = EXCLUDED.profile_image_url,
          category = EXCLUDED.category,
          verification_status = EXCLUDED.verification_status,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at
      `;

            // Note: DB schema might be slightly different from entity, mapping needed
            // Assuming 'category' in DB is text, but entity has array of categories.
            // And 'is_active' maps to status.

            const categories = opinionLeader.getCategories();
            const primaryCategory = categories.length > 0 ? categories[0] : null;

            const params = {
                id: opinionLeader.getId().getValue(),
                userId: opinionLeader.getUserId().toString(),
                displayName: opinionLeader.getName(),
                bio: opinionLeader.getBio(),
                profileImageUrl: opinionLeader.getProfileImageUrl() || null,
                category: primaryCategory, // Simplified mapping
                verificationStatus: opinionLeader.getVerificationStatus(),
                isActive: opinionLeader.getStatus() === OpinionLeaderStatus.ACTIVE,
                createdAt: opinionLeader.getCreatedAt().toISOString(),
                updatedAt: opinionLeader.getUpdatedAt().toISOString(),
            };

            const finalQuery = buildParameterizedQuery(query, params);
            await this.mcpAdapter.executeSQL(finalQuery);

            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to save opinion leader"),
            };
        }
    }

    async findById(id: OpinionLeaderId): Promise<Result<OpinionLeader | null>> {
        try {
            const query = "SELECT * FROM user.opinion_leaders WHERE id = $id";
            const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            if (!result.data || result.data.length === 0) {
                return { success: true, data: null };
            }

            return {
                success: true,
                data: this.mapRowToEntity(result.data[0]),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to find opinion leader"),
            };
        }
    }

    async findByUserId(userId: UserId): Promise<Result<OpinionLeader | null>> {
        try {
            const query = "SELECT * FROM user.opinion_leaders WHERE user_id = $userId";
            const finalQuery = buildParameterizedQuery(query, { userId: userId.toString() });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            if (!result.data || result.data.length === 0) {
                return { success: true, data: null };
            }

            return {
                success: true,
                data: this.mapRowToEntity(result.data[0]),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to find opinion leader"),
            };
        }
    }

    async update(opinionLeader: OpinionLeader): Promise<Result<void>> {
        return this.save(opinionLeader);
    }

    async delete(id: OpinionLeaderId): Promise<Result<void>> {
        try {
            const query = "DELETE FROM user.opinion_leaders WHERE id = $id";
            const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
            await this.mcpAdapter.executeSQL(finalQuery);
            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to delete opinion leader"),
            };
        }
    }

    async findAll(
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<OpinionLeader>>> {
        return this.findByCriteria({}, page, limit);
    }

    async findByCategory(
        category: SupportCategory,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<OpinionLeader>>> {
        return this.findByCriteria({ category }, page, limit);
    }

    async findByStatus(
        status: OpinionLeaderStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<OpinionLeader>>> {
        return this.findByCriteria({ status }, page, limit);
    }

    async findByVerificationStatus(
        status: VerificationStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<OpinionLeader>>> {
        return this.findByCriteria({ verificationStatus: status }, page, limit);
    }

    async findByCriteria(
        criteria: OpinionLeaderSearchCriteria,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<OpinionLeader>>> {
        try {
            let query = "SELECT * FROM user.opinion_leaders WHERE 1=1";
            const params: Record<string, any> = {};

            if (criteria.name) {
                query += ` AND display_name ILIKE $name`;
                params.name = `%${criteria.name}%`;
            }
            if (criteria.category) {
                query += ` AND category = $category`;
                params.category = criteria.category;
            }
            if (criteria.status) {
                if (criteria.status === OpinionLeaderStatus.ACTIVE) {
                    query += ` AND is_active = true`;
                } else {
                    // Complex mapping needed if status is not just active/inactive
                }
            }
            if (criteria.verificationStatus) {
                query += ` AND verification_status = $verificationStatus`;
                params.verificationStatus = criteria.verificationStatus;
            }
            if (criteria.userId) {
                query += ` AND user_id = $userId`;
                params.userId = criteria.userId.toString();
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
            const items = (result.data || []).map((row: any) => this.mapRowToEntity(row));

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
                error: error instanceof Error ? error : new Error("Failed to find opinion leaders"),
            };
        }
    }

    async countByStatus(status: OpinionLeaderStatus): Promise<Result<number>> {
        try {
            // Simplified mapping
            const isActive = status === OpinionLeaderStatus.ACTIVE;
            const query = "SELECT COUNT(*) as count FROM user.opinion_leaders WHERE is_active = $isActive";
            const finalQuery = buildParameterizedQuery(query, { isActive });
            const result = await this.mcpAdapter.executeSQL(finalQuery);
            const count = result.data?.[0]?.count;
            return {
                success: true,
                data: parseInt(typeof count === 'string' || typeof count === 'number' ? String(count) : "0"),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to count opinion leaders"),
            };
        }
    }

    async countByCategory(category: SupportCategory): Promise<Result<number>> {
        try {
            const query = "SELECT COUNT(*) as count FROM user.opinion_leaders WHERE category = $category";
            const finalQuery = buildParameterizedQuery(query, { category });
            const result = await this.mcpAdapter.executeSQL(finalQuery);
            const count = result.data?.[0]?.count;
            return {
                success: true,
                data: parseInt(typeof count === 'string' || typeof count === 'number' ? String(count) : "0"),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to count opinion leaders"),
            };
        }
    }

    async getTopLeaders(limit: number): Promise<Result<OpinionLeader[]>> {
        try {
            // Using total_support_received for ranking
            const query = "SELECT * FROM user.opinion_leaders ORDER BY total_support_received DESC LIMIT $limit";
            const finalQuery = buildParameterizedQuery(query, { limit });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            const items = (result.data || []).map((row: any) => this.mapRowToEntity(row));

            return {
                success: true,
                data: items,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to get top leaders"),
            };
        }
    }

    private mapRowToEntity(row: any): OpinionLeader {
        // Map DB row to entity format expected by reconstitute
        const mappedData = {
            ...row,
            name: row.display_name,
            status: row.is_active ? OpinionLeaderStatus.ACTIVE : OpinionLeaderStatus.PENDING,
            categories: row.category ? [row.category] : [],
            // Other fields might need mapping
        };
        return OpinionLeader.reconstitute(mappedData);
    }
}
