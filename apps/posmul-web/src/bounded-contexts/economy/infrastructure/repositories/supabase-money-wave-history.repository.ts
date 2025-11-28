/**
 * Supabase Money Wave History Repository Implementation
 */
import {
  CompatibleBaseError,
  Result,
  createDefaultMCPAdapter,
} from "../../../../shared/legacy-compatibility";

export class SupabaseMoneyWaveHistoryRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  async findByWaveType(
    waveType: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<any[], CompatibleBaseError>> {
    try {
      let query = `
        SELECT * FROM money_wave_events 
        WHERE wave_type = $1
      `;

      const params = [waveType];
      let paramIndex = 2;

      if (options?.startDate) {
        query += ` AND processed_at >= $${paramIndex}`;
        params.push(options.startDate.toISOString());
        paramIndex++;
      }

      if (options?.endDate) {
        query += ` AND processed_at <= $${paramIndex}`;
        params.push(options.endDate.toISOString());
        paramIndex++;
      }

      query += ` ORDER BY processed_at DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit.toString());
        paramIndex++;
      }

      if (options?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.offset.toString());
      }

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

  private mapDatabaseToMoneyWaveType(type: string): string {
    switch (type) {
      case "WAVE1":
        return "wave1";
      case "WAVE2":
        return "wave2";
      case "WAVE3":
        return "wave3";
      default:
        throw new Error(`Unsupported MoneyWave type: ${type}`);
    }
  }
}
