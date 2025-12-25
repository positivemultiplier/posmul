/**
 * MCP User Repository Implementation
 */
import {
  CompatibleBaseError,
  Result,
  createDefaultMCPAdapter,
} from "../../../../shared/legacy-compatibility";

export class MCPUserRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  async findById(id: string): Promise<Result<any, CompatibleBaseError>> {
    try {
      void id;
      const result = await this.mcpAdapter.executeSQL(`
        SELECT * FROM users WHERE id = $1
      `);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      return {
        success: true,
        data: this.mapDatabaseToUser(userData),
      };
    } catch (error) {
      return {
        success: false,
        error: error as CompatibleBaseError,
      };
    }
  }

  private mapDatabaseToUser(data: any): any {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
