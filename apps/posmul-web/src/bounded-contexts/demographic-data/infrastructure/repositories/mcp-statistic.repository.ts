/**
 * MCP Statistic Repository
 * Supabase MCP를 통한 통계 데이터 저장소 구현
 */
import {
  Statistic,
  StatisticId,
  DataSource,
  DataSourceId,
  createStatisticId,
  createDataSourceId,
} from "../../domain/entities/statistic.entity";
import {
  IStatisticRepository,
  IDataSourceRepository,
  StatisticFilter,
  PaginationOptions,
  PaginatedResult,
  TimeSeriesDataPoint,
  Result,
} from "../../domain/repositories/statistic.repository";
import {
  RegionCode,
} from "../../../forum/domain/value-objects/forum-value-objects";

import { StatCategory, PeriodType } from "../../domain/value-objects/statistics-value-objects";

// Supabase 클라이언트 타입 (실제 구현 시 import)
type SupabaseClient = {
  from: (table: string) => unknown;
};

/**
 * MCPStatisticRepository
 * demographic_data.statistics 테이블에 대한 CRUD 구현
 */
export class MCPStatisticRepository implements IStatisticRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: StatisticId): Promise<Result<Statistic | null>> {
    try {
      const { data, error } = await (this.supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: unknown) => { single: () => Promise<{ data: StatisticRow | null; error: Error | null }> } } } }).from("demographic_data.statistics")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: null };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: this.mapRowToEntity(data) };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findByFilter(
    filter: StatisticFilter,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<Result<PaginatedResult<Statistic>>> {
    try {
      let query = (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics").select("*", { count: "exact" });

      // 필터 적용
      if (filter.regionCode) {
        query = query.eq("region_code", String(filter.regionCode));
      }
      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (filter.periodType) {
        query = query.eq("period_type", filter.periodType);
      }
      if (filter.year) {
        query = query.eq("year", filter.year);
      }
      if (filter.month !== undefined) {
        query = query.eq("month", filter.month);
      }
      if (filter.quarter !== undefined) {
        query = query.eq("quarter", filter.quarter);
      }
      if (filter.isPreliminary !== undefined) {
        query = query.eq("is_preliminary", filter.isPreliminary);
      }
      if (filter.sourceId) {
        query = query.eq("source_id", filter.sourceId);
      }

      // 페이지네이션
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to).order("year", { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      const total = count ?? 0;
      const statistics = (data as StatisticRow[]).map((row) => this.mapRowToEntity(row));

      return {
        success: true,
        data: {
          data: statistics,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findLatest(
    regionCode: RegionCode | string,
    category: StatCategory
  ): Promise<Result<Statistic | null>> {
    try {
      const { data, error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder<StatisticRow> }).from("demographic_data.statistics")
        .select("*")
        .eq("region_code", String(regionCode))
        .eq("category", category)
        .order("year", { ascending: false })
        .order("month", { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: null };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: this.mapRowToEntity(data) };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findTimeSeries(
    regionCode: RegionCode | string,
    category: StatCategory,
    startYear: number,
    endYear: number,
    periodType?: PeriodType
  ): Promise<Result<TimeSeriesDataPoint[]>> {
    try {
      let query = (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .select("year, month, quarter, period_type, value, is_preliminary")
        .eq("region_code", String(regionCode))
        .eq("category", category)
        .gte("year", startYear)
        .lte("year", endYear);

      if (periodType) {
        query = query.eq("period_type", periodType);
      }

      query = query.order("year").order("month", { nullsFirst: true });

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      const points: TimeSeriesDataPoint[] = (data as TimeSeriesRow[]).map((row) => ({
        period: this.formatPeriod(row.period_type, row.year, row.month, row.quarter),
        value: row.value,
        isPreliminary: row.is_preliminary,
      }));

      return { success: true, data: points };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findForComparison(
    regionCodes: (RegionCode | string)[],
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ): Promise<Result<Statistic[]>> {
    try {
      let query = (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .select("*")
        .in("region_code", regionCodes.map(String))
        .eq("category", category)
        .eq("period_type", periodType)
        .eq("year", year);

      if (month !== undefined) {
        query = query.eq("month", month);
      }
      if (quarter !== undefined) {
        query = query.eq("quarter", quarter);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as StatisticRow[]).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async save(statistic: Statistic): Promise<Result<void>> {
    try {
      const row = this.mapEntityToRow(statistic);
      const { error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .upsert(row, { onConflict: "region_code,category,period_type,year,month,quarter" });

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async saveMany(statistics: Statistic[]): Promise<Result<number>> {
    try {
      const rows = statistics.map((s) => this.mapEntityToRow(s));
      const { error, count } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .upsert(rows, { onConflict: "region_code,category,period_type,year,month,quarter" });

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: count ?? statistics.length };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async delete(id: StatisticId): Promise<Result<void>> {
    try {
      const { error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .delete()
        .eq("id", id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async exists(
    regionCode: RegionCode | string,
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ): Promise<Result<boolean>> {
    try {
      let query = (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.statistics")
        .select("id", { count: "exact", head: true })
        .eq("region_code", String(regionCode))
        .eq("category", category)
        .eq("period_type", periodType)
        .eq("year", year);

      if (month !== undefined) {
        query = query.eq("month", month);
      }
      if (quarter !== undefined) {
        query = query.eq("quarter", quarter);
      }

      const { count, error } = await query;

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: (count ?? 0) > 0 };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  // Private helpers
  private mapRowToEntity(row: StatisticRow): Statistic {
    return Statistic.restore(
      createStatisticId(row.id),
      row.source_id ? createDataSourceId(row.source_id) : null,
      row.region_code,
      row.category as StatCategory,
      row.period_type as PeriodType,
      row.year,
      row.value,
      row.unit,
      row.is_preliminary,
      new Date(row.collected_at),
      new Date(row.created_at),
      row.month ?? undefined,
      row.quarter ?? undefined,
      row.metadata as Record<string, unknown> | undefined
    );
  }

  private mapEntityToRow(entity: Statistic): StatisticRow {
    const period = entity.getPeriod();
    return {
      id: entity.getId(),
      source_id: entity.getSourceId(),
      region_code: String(entity.getRegionCode()),
      category: entity.getCategory(),
      period_type: period.type,
      year: period.year,
      month: period.month ?? null,
      quarter: period.quarter ?? null,
      value: entity.getValue(),
      unit: entity.getUnit(),
      is_preliminary: entity.getIsPreliminary(),
      metadata: entity.getMetadata(),
      collected_at: entity.getCollectedAt().toISOString(),
      created_at: entity.getCreatedAt().toISOString(),
    };
  }

  private formatPeriod(
    periodType: string,
    year: number,
    month: number | null,
    quarter: number | null
  ): string {
    switch (periodType) {
      case PeriodType.MONTHLY:
        return `${year}년 ${month}월`;
      case PeriodType.QUARTERLY:
        return `${year}년 Q${quarter}`;
      case PeriodType.YEARLY:
        return `${year}년`;
      default:
        return `${year}년`;
    }
  }
}

/**
 * MCPDataSourceRepository
 * demographic_data.data_sources 테이블에 대한 CRUD 구현
 */
export class MCPDataSourceRepository implements IDataSourceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: DataSourceId): Promise<Result<DataSource | null>> {
    try {
      const { data, error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder<DataSourceRow> }).from("demographic_data.data_sources")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: null };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: this.mapRowToEntity(data) };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findByName(name: string): Promise<Result<DataSource | null>> {
    try {
      const { data, error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder<DataSourceRow> }).from("demographic_data.data_sources")
        .select("*")
        .eq("name", name)
        .single();

      if (error) {
        if (error.message.includes("No rows")) {
          return { success: true, data: null };
        }
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: this.mapRowToEntity(data) };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async findAllActive(): Promise<Result<DataSource[]>> {
    try {
      const { data, error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.data_sources")
        .select("*")
        .eq("is_active", true);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return {
        success: true,
        data: (data as DataSourceRow[]).map((row) => this.mapRowToEntity(row)),
      };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async save(dataSource: DataSource): Promise<Result<void>> {
    try {
      const row = this.mapEntityToRow(dataSource);
      const { error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.data_sources")
        .upsert(row, { onConflict: "id" });

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  async delete(id: DataSourceId): Promise<Result<void>> {
    try {
      const { error } = await (this.supabase as unknown as { from: (table: string) => QueryBuilder }).from("demographic_data.data_sources")
        .delete()
        .eq("id", id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: e as Error };
    }
  }

  private mapRowToEntity(row: DataSourceRow): DataSource {
    return DataSource.restore(
      createDataSourceId(row.id),
      row.name,
      row.api_base_url,
      row.api_key_env,
      row.rate_limit_per_day,
      row.is_active,
      new Date(row.created_at)
    );
  }

  private mapEntityToRow(entity: DataSource): DataSourceRow {
    return {
      id: entity.getId(),
      name: entity.getName(),
      api_base_url: entity.getApiBaseUrl(),
      api_key_env: entity.getApiKeyEnv(),
      rate_limit_per_day: entity.getRateLimitPerDay(),
      is_active: entity.getIsActive(),
      created_at: entity.getCreatedAt().toISOString(),
    };
  }
}

// Row 타입 정의
interface StatisticRow {
  id: string;
  source_id: string | null;
  region_code: string;
  category: string;
  period_type: string;
  year: number;
  month: number | null;
  quarter: number | null;
  value: number;
  unit: string;
  is_preliminary: boolean;
  metadata: Record<string, unknown> | null;
  collected_at: string;
  created_at: string;
}

interface TimeSeriesRow {
  year: number;
  month: number | null;
  quarter: number | null;
  period_type: string;
  value: number;
  is_preliminary: boolean;
}

interface DataSourceRow {
  id: string;
  name: string;
  api_base_url: string | null;
  api_key_env: string | null;
  rate_limit_per_day: number | null;
  is_active: boolean;
  created_at: string;
}

// Query Builder 타입 (Supabase 호환)
interface QueryBuilder<T = unknown> {
  select: (cols: string, options?: { count?: string; head?: boolean }) => QueryBuilder<T>;
  eq: (col: string, val: unknown) => QueryBuilder<T>;
  in: (col: string, vals: unknown[]) => QueryBuilder<T>;
  gte: (col: string, val: unknown) => QueryBuilder<T>;
  lte: (col: string, val: unknown) => QueryBuilder<T>;
  order: (col: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => QueryBuilder<T>;
  range: (from: number, to: number) => QueryBuilder<T>;
  limit: (n: number) => QueryBuilder<T>;
  single: () => Promise<{ data: T; error: Error | null }>;
  upsert: (data: unknown, options?: { onConflict?: string }) => Promise<{ error: Error | null; count?: number }>;
  delete: () => QueryBuilder<T>;
  then: <T>(fn: (result: { data: unknown[]; error: Error | null; count?: number }) => T) => Promise<T>;
}
