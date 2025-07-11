/**
 * Supabase Utility Function Repository Implementation
 */

import {
  createDefaultMCPAdapter,
  Result,
  CompatibleBaseError,
} from "../../../../shared/legacy-compatibility";

export class SupabaseUtilityFunctionRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  async findByUserIds(
    userIds: string[]
  ): Promise<Result<any[], CompatibleBaseError>> {
    try {
      const ids = userIds.map((id) => `'${id}'`).join(",");
      const query = `SELECT * FROM social_welfare_parameters WHERE user_id IN (${ids})`;

      const result = await this.mcpAdapter.executeSQL(query);

      return {
        success: true,
        data: result.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  async saveParameters(
    parameters: any
  ): Promise<Result<any, CompatibleBaseError>> {
    try {
      const query = `
        INSERT INTO social_welfare_parameters (lambda, mu, nu, phi, psi, omega, calculation_date, total_population, sample_size, statistical_significance)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      return {
        success: true,
        data: result.data?.[0],
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  async findByDateRange(
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<any[], CompatibleBaseError>> {
    try {
      let whereClauses = [];

      if (startDate) {
        whereClauses.push(`timestamp >= '${startDate.toISOString()}'`);
      }
      if (endDate) {
        whereClauses.push(`timestamp <= '${endDate.toISOString()}'`);
      }

      const query = `
        SELECT * FROM social_welfare_parameters
        ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
        ORDER BY calculation_date DESC
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: [] };
      }

      return {
        success: true,
        data: result.data.map((record: any) =>
          this.mapDatabaseToSocialWelfareParameters(record)
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  private mapDatabaseToSocialWelfareParameters(data: any): any {
    return {
      lambda: data.lambda,
      mu: data.mu,
      nu: data.nu,
      phi: data.phi,
      psi: data.psi,
      omega: data.omega,
      calculationDate: new Date(data.calculation_date),
      totalPopulation: data.total_population,
      sampleSize: data.sample_size,
      statisticalSignificance: data.statistical_significance,
    };
  }
}
