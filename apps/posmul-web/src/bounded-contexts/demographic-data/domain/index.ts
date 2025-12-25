// Domain Entities
export { Statistic, DataSource, createStatisticId, createDataSourceId } from "./entities/statistic.entity";

export type { StatisticId, DataSourceId } from "./entities/statistic.entity";

// Domain Repositories (Interfaces)
export type {
  IStatisticRepository,
  IDataSourceRepository,
  StatisticFilter,
  PaginationOptions,
  PaginatedResult,
  TimeSeriesDataPoint,
  Result,
} from "./repositories/statistic.repository";

// Re-export Value Objects from Forum context
export { 
  RegionLevel,
  StatCategory,
  PeriodType,
  createRegionCode,
  createStatisticPeriod,
  GWANGJU_REGION_CODES,
} from "../../forum/domain/value-objects/forum-value-objects";

export type {
  RegionCode,
  RegionInfo,
  StatisticPeriod,
  StatisticDataPoint,
} from "../../forum/domain/value-objects/forum-value-objects";
