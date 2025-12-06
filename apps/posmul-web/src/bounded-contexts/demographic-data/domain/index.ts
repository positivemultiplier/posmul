// Domain Entities
export {
  Statistic,
  StatisticId,
  DataSource,
  DataSourceId,
  createStatisticId,
  createDataSourceId,
} from "./entities/statistic.entity";

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
  RegionCode,
  RegionLevel,
  RegionInfo,
  StatCategory,
  PeriodType,
  StatisticPeriod,
  StatisticDataPoint,
  createRegionCode,
  createStatisticPeriod,
  GWANGJU_REGION_CODES,
} from "../../forum/domain/value-objects/forum-value-objects";
