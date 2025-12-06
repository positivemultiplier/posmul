/**
 * Statistic Repository Interface
 * Domain Layer - 인프라스트럭처 구현에 대한 추상화
 */
import {
  Statistic,
  StatisticId,
  DataSource,
  DataSourceId,
} from "../entities/statistic.entity";
import {
  RegionCode,
  StatCategory,
  PeriodType,
} from "../../../forum/domain/value-objects/forum-value-objects";

// Result 타입 정의
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 통계 데이터 검색 필터
 */
export interface StatisticFilter {
  regionCode?: RegionCode | string;
  category?: StatCategory;
  periodType?: PeriodType;
  year?: number;
  month?: number;
  quarter?: number;
  isPreliminary?: boolean;
  sourceId?: DataSourceId;
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * 페이지네이션 결과
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 시계열 데이터 포인트
 */
export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  isPreliminary: boolean;
}

/**
 * IStatisticRepository
 * 통계 데이터 저장소 인터페이스
 */
export interface IStatisticRepository {
  /**
   * ID로 통계 데이터 조회
   */
  findById(id: StatisticId): Promise<Result<Statistic | null>>;

  /**
   * 필터 조건으로 통계 데이터 목록 조회
   */
  findByFilter(
    filter: StatisticFilter,
    pagination?: PaginationOptions
  ): Promise<Result<PaginatedResult<Statistic>>>;

  /**
   * 특정 지역 + 카테고리의 최신 데이터 조회
   */
  findLatest(
    regionCode: RegionCode | string,
    category: StatCategory
  ): Promise<Result<Statistic | null>>;

  /**
   * 시계열 데이터 조회 (차트용)
   */
  findTimeSeries(
    regionCode: RegionCode | string,
    category: StatCategory,
    startYear: number,
    endYear: number,
    periodType?: PeriodType
  ): Promise<Result<TimeSeriesDataPoint[]>>;

  /**
   * 여러 지역의 동일 카테고리 데이터 비교
   */
  findForComparison(
    regionCodes: (RegionCode | string)[],
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ): Promise<Result<Statistic[]>>;

  /**
   * 통계 데이터 저장
   */
  save(statistic: Statistic): Promise<Result<void>>;

  /**
   * 여러 통계 데이터 일괄 저장 (upsert)
   */
  saveMany(statistics: Statistic[]): Promise<Result<number>>;

  /**
   * 통계 데이터 삭제
   */
  delete(id: StatisticId): Promise<Result<void>>;

  /**
   * 중복 데이터 확인 (지역 + 카테고리 + 기간)
   */
  exists(
    regionCode: RegionCode | string,
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    month?: number,
    quarter?: number
  ): Promise<Result<boolean>>;
}

/**
 * IDataSourceRepository
 * 데이터 소스 저장소 인터페이스
 */
export interface IDataSourceRepository {
  /**
   * ID로 데이터 소스 조회
   */
  findById(id: DataSourceId): Promise<Result<DataSource | null>>;

  /**
   * 이름으로 데이터 소스 조회
   */
  findByName(name: string): Promise<Result<DataSource | null>>;

  /**
   * 활성화된 모든 데이터 소스 조회
   */
  findAllActive(): Promise<Result<DataSource[]>>;

  /**
   * 데이터 소스 저장
   */
  save(dataSource: DataSource): Promise<Result<void>>;

  /**
   * 데이터 소스 삭제
   */
  delete(id: DataSourceId): Promise<Result<void>>;
}
