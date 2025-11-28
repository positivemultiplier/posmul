/**
 * Supabase PMP PMC Account Repository Implementation
 */
import {
  CompatibleBaseError,
  Result,
  createDefaultMCPAdapter,
} from "../../../../shared/legacy-compatibility";

export class SupabasePmpPmcAccountRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  async findByIds(
    userIds: string[]
  ): Promise<Result<any[], CompatibleBaseError>> {
    try {
      const ids = userIds.map((id) => `'${id}'`).join(",");
      const query = `SELECT * FROM user_economic_profiles WHERE user_id IN (${ids})`;

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

  async createOrUpdate(
    userId: string,
    pmpBalance: number,
    pmcBalance: number
  ): Promise<Result<any, CompatibleBaseError>> {
    try {
      const query = `
        INSERT INTO user_economic_profiles (user_id, pmp_balance, pmc_balance, last_activity_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          pmp_balance = EXCLUDED.pmp_balance,
          pmc_balance = EXCLUDED.pmc_balance,
          updated_at = NOW()
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

  async findByUserId(
    userId: string
  ): Promise<Result<any, CompatibleBaseError>> {
    try {
      const query = `SELECT * FROM user_economic_profiles WHERE user_id = $1`;
      const result = await this.mcpAdapter.executeSQL(query);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: result.data[0],
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }
}
