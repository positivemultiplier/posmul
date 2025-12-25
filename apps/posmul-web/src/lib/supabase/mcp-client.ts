import { createDefaultMCPAdapter } from "../../shared/legacy-compatibility";

export type MCPClientType = {
  executeSql: (query: string) => Promise<any[]>;
};

export const createMCPClient = async (): Promise<MCPClientType> => {
  const adapter = createDefaultMCPAdapter();

  return {
    async executeSql(query: string): Promise<any[]> {
      const result = await adapter.executeSQL(query);
      if (result.error) {
        throw result.error;
      }
      return result.data ?? [];
    },
  };
};
