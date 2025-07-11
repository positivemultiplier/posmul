/**
 * MCP Donation Repository Implementation
 */

import {
  createDefaultMCPAdapter,
  Result,
  CompatibleBaseError,
} from "../../../../shared/legacy-compatibility";

export class MCPDonationRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  async findById(id: string): Promise<Result<any, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT * FROM donations WHERE id = $1
      `);

      return {
        success: true,
        data: result.data?.[0] || null,
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  async delete(id: string): Promise<Result<void, CompatibleBaseError>> {
    try {
      await this.mcpAdapter.executeSQL(`
        DELETE FROM donations WHERE id = $1
      `);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  async countByStatus(
    status: string
  ): Promise<Result<number, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT COUNT(*) as count FROM donations WHERE status = $1
      `);

      return {
        success: true,
        data: parseInt(String(result.data?.[0]?.count || "0")),
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }
}
