// Infrastructure Layer - Repositories
export {
  MCPStatisticRepository,
  MCPDataSourceRepository,
} from "./repositories/mcp-statistic.repository";

// Infrastructure Layer - API Clients
export {
  KOSISClient,
  getKOSISClient,
  CATEGORY_TABLE_MAP,
  GWANGJU_KOSIS_CODES,
  type KOSISResponse,
  type KOSISStatItem,
  type KOSISTableInfo,
  type KOSISRequestParams,
} from "./api-clients/kosis.client";
