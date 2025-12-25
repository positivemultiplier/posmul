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

// Value Objects
export { StatCategory, PeriodType, createStatisticPeriod } from "./value-objects/statistics-value-objects";

export type { StatisticPeriod } from "./value-objects/statistics-value-objects";
