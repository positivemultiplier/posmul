/**
 * MCP Institute Repository Implementation
 */
import { PaginatedResult, Result } from "@posmul/auth-economy-sdk";
import { createDefaultMCPAdapter, buildParameterizedQuery } from "../../../../shared/legacy-compatibility";
import { Institute, InstituteStatus, TrustLevel } from "../../domain/entities/institute.entity";
import {
    IInstituteRepository,
    InstituteSearchCriteria,
} from "../../domain/repositories/institute.repository";
import { InstituteCategory, InstituteId } from "../../domain/value-objects/donation-value-objects";

export class MCPInstituteRepository implements IInstituteRepository {
    private readonly mcpAdapter = createDefaultMCPAdapter();

    constructor(private readonly projectId: string) { }

    async save(institute: Institute): Promise<Result<void>> {
        try {
            const query = `
        INSERT INTO donation.donation_institutes (
          id, name, description, category, contact_email, contact_phone,
          contact_website, contact_address, status, trust_level,
          registration_number, logo_url, created_at, updated_at
        ) VALUES (
          $id, $name, $description, $category, $contactEmail, $contactPhone,
          $contactWebsite, $contactAddress, $status, $trustLevel,
          $registrationNumber, $logoUrl, $createdAt, $updatedAt
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          contact_website = EXCLUDED.contact_website,
          contact_address = EXCLUDED.contact_address,
          status = EXCLUDED.status,
          trust_level = EXCLUDED.trust_level,
          registration_number = EXCLUDED.registration_number,
          logo_url = EXCLUDED.logo_url,
          updated_at = EXCLUDED.updated_at
      `;

            const contact = institute.getContactInfo();

            const params = {
                id: institute.getId().getValue(),
                name: institute.getName(),
                description: institute.getDescription(),
                category: institute.getCategory(),
                contactEmail: contact.email,
                contactPhone: contact.phone || null,
                contactWebsite: contact.website || null,
                contactAddress: contact.address || null,
                status: institute.getStatus(),
                trustLevel: institute.getTrustLevel(),
                registrationNumber: institute.getRegistrationNumber() || null,
                logoUrl: institute.getLogoUrl() || null,
                createdAt: institute.getCreatedAt().toISOString(),
                updatedAt: institute.getUpdatedAt().toISOString(),
            };

            const finalQuery = buildParameterizedQuery(query, params);
            await this.mcpAdapter.executeSQL(finalQuery);

            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to save institute"),
            };
        }
    }

    async findById(id: InstituteId): Promise<Result<Institute | null>> {
        try {
            const query = "SELECT * FROM donation.donation_institutes WHERE id = $id";
            const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            if (!result.data || result.data.length === 0) {
                return { success: true, data: null };
            }

            // Map DB columns to entity expects
            const row = result.data[0];
            const mappedData = {
                ...row,
                contact_info: {
                    email: row.contact_email,
                    phone: row.contact_phone,
                    website: row.contact_website,
                    address: row.contact_address,
                },
            };

            return {
                success: true,
                data: Institute.reconstitute(mappedData),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to find institute"),
            };
        }
    }

    async update(institute: Institute): Promise<Result<void>> {
        return this.save(institute);
    }

    async delete(id: InstituteId): Promise<Result<void>> {
        try {
            const query = "DELETE FROM donation.donation_institutes WHERE id = $id";
            const finalQuery = buildParameterizedQuery(query, { id: id.getValue() });
            await this.mcpAdapter.executeSQL(finalQuery);
            return { success: true, data: undefined };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to delete institute"),
            };
        }
    }

    async findAll(
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<Institute>>> {
        return this.findByCriteria({}, page, limit);
    }

    async findByCategory(
        category: InstituteCategory,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<Institute>>> {
        return this.findByCriteria({ category }, page, limit);
    }

    async findByStatus(
        status: InstituteStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<Institute>>> {
        return this.findByCriteria({ status }, page, limit);
    }

    async findByTrustLevel(
        level: TrustLevel,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<Institute>>> {
        return this.findByCriteria({ trustLevel: level }, page, limit);
    }

    async findByCriteria(
        criteria: InstituteSearchCriteria,
        page: number = 1,
        limit: number = 10
    ): Promise<Result<PaginatedResult<Institute>>> {
        try {
            let query = "SELECT * FROM donation.donation_institutes WHERE 1=1";
            const params: Record<string, any> = {};

            if (criteria.name) {
                query += ` AND name ILIKE $name`;
                params.name = `%${criteria.name}%`;
            }
            if (criteria.category) {
                query += ` AND category = $category`;
                params.category = criteria.category;
            }
            if (criteria.status) {
                query += ` AND status = $status`;
                params.status = criteria.status;
            }
            if (criteria.trustLevel) {
                query += ` AND trust_level = $trustLevel`;
                params.trustLevel = criteria.trustLevel;
            }
            if (criteria.isVerified !== undefined) {
                if (criteria.isVerified) {
                    query += ` AND trust_level != 'BASIC'`;
                } else {
                    query += ` AND trust_level = 'BASIC'`;
                }
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
            const items = (result.data || []).map((row: any) => {
                const mappedData = {
                    ...row,
                    contact_info: {
                        email: row.contact_email,
                        phone: row.contact_phone,
                        website: row.contact_website,
                        address: row.contact_address,
                    },
                };
                return Institute.reconstitute(mappedData);
            });

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
                error: error instanceof Error ? error : new Error("Failed to find institutes"),
            };
        }
    }

    async countByStatus(status: InstituteStatus): Promise<Result<number>> {
        try {
            const query = "SELECT COUNT(*) as count FROM donation.donation_institutes WHERE status = $status";
            const finalQuery = buildParameterizedQuery(query, { status });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            const rawCount: unknown = result.data?.[0]?.count;
            const normalizedCount =
                typeof rawCount === "number" || typeof rawCount === "string"
                    ? rawCount
                    : 0;
            return {
                success: true,
                data: parseInt(String(normalizedCount), 10),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to count institutes"),
            };
        }
    }

    async countByCategory(category: InstituteCategory): Promise<Result<number>> {
        try {
            const query = "SELECT COUNT(*) as count FROM donation.donation_institutes WHERE category = $category";
            const finalQuery = buildParameterizedQuery(query, { category });
            const result = await this.mcpAdapter.executeSQL(finalQuery);

            const rawCount: unknown = result.data?.[0]?.count;
            const normalizedCount =
                typeof rawCount === "number" || typeof rawCount === "string"
                    ? rawCount
                    : 0;
            return {
                success: true,
                data: parseInt(String(normalizedCount), 10),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to count institutes"),
            };
        }
    }
}
