/**
 * Statistic Entity
 * 인구통계 데이터 엔티티
 */
import {
  RegionCode,
  StatCategory,
  StatisticPeriod,
  PeriodType,
  createRegionCode,
  createStatisticPeriod,
} from "../../../forum/domain/value-objects/forum-value-objects";

// Statistic ID 브랜드 타입
export type StatisticId = string & { readonly __brand: "StatisticId" };

export const createStatisticId = (id: string): StatisticId => {
  if (!id || id.trim().length === 0) {
    throw new Error("StatisticId cannot be empty");
  }
  return id as StatisticId;
};

// Data Source ID 브랜드 타입
export type DataSourceId = string & { readonly __brand: "DataSourceId" };

export const createDataSourceId = (id: string): DataSourceId => {
  if (!id || id.trim().length === 0) {
    throw new Error("DataSourceId cannot be empty");
  }
  return id as DataSourceId;
};

/**
 * Statistic Entity
 * 인구통계 데이터 포인트를 나타내는 엔티티
 */
export class Statistic {
  private constructor(
    private readonly id: StatisticId,
    private readonly sourceId: DataSourceId | null,
    private readonly regionCode: RegionCode,
    private readonly category: StatCategory,
    private readonly period: StatisticPeriod,
    private value: number,
    private readonly unit: string,
    private isPreliminary: boolean,
    private readonly metadata: Record<string, unknown> | null,
    private readonly collectedAt: Date,
    private readonly createdAt: Date
  ) {}

  /**
   * 새로운 통계 데이터 생성
   */
  static create(
    id: StatisticId,
    sourceId: DataSourceId | null,
    regionCode: string,
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    value: number,
    unit: string,
    month?: number,
    quarter?: number,
    metadata?: Record<string, unknown>
  ): Statistic {
    const now = new Date();
    const period = createStatisticPeriod(periodType, year, month, quarter);

    return new Statistic(
      id,
      sourceId,
      createRegionCode(regionCode),
      category,
      period,
      value,
      unit,
      true, // 새로 생성된 데이터는 기본적으로 잠정치
      metadata ?? null,
      now,
      now
    );
  }

  /**
   * 기존 통계 데이터 복원 (Repository에서 사용)
   */
  static restore(
    id: StatisticId,
    sourceId: DataSourceId | null,
    regionCode: string,
    category: StatCategory,
    periodType: PeriodType,
    year: number,
    value: number,
    unit: string,
    isPreliminary: boolean,
    collectedAt: Date,
    createdAt: Date,
    month?: number,
    quarter?: number,
    metadata?: Record<string, unknown>
  ): Statistic {
    const period = createStatisticPeriod(periodType, year, month, quarter);

    return new Statistic(
      id,
      sourceId,
      createRegionCode(regionCode),
      category,
      period,
      value,
      unit,
      isPreliminary,
      metadata ?? null,
      collectedAt,
      createdAt
    );
  }

  // Getters
  getId(): StatisticId {
    return this.id;
  }
  getSourceId(): DataSourceId | null {
    return this.sourceId;
  }
  getRegionCode(): RegionCode {
    return this.regionCode;
  }
  getCategory(): StatCategory {
    return this.category;
  }
  getPeriod(): StatisticPeriod {
    return this.period;
  }
  getValue(): number {
    return this.value;
  }
  getUnit(): string {
    return this.unit;
  }
  getIsPreliminary(): boolean {
    return this.isPreliminary;
  }
  getMetadata(): Record<string, unknown> | null {
    return this.metadata;
  }
  getCollectedAt(): Date {
    return this.collectedAt;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * 잠정치를 확정치로 변경
   */
  confirm(confirmedValue: number): void {
    this.value = confirmedValue;
    this.isPreliminary = false;
  }

  /**
   * 값 업데이트
   */
  updateValue(newValue: number): void {
    this.value = newValue;
  }

  /**
   * 기간 문자열 반환 (예: "2025년 12월", "2025년 Q4")
   */
  getPeriodString(): string {
    const { type, year, month, quarter } = this.period;

    switch (type) {
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

  /**
   * 카테고리 한글명 반환
   */
  getCategoryName(): string {
    const names: Record<StatCategory, string> = {
      [StatCategory.BIRTH]: "출생아 수",
      [StatCategory.DEATH]: "사망자 수",
      [StatCategory.MARRIAGE]: "혼인 건수",
      [StatCategory.DIVORCE]: "이혼 건수",
      [StatCategory.MIGRATION_IN]: "전입자 수",
      [StatCategory.MIGRATION_OUT]: "전출자 수",
      [StatCategory.EMPLOYMENT]: "취업자 수",
      [StatCategory.UNEMPLOYMENT]: "실업률",
      [StatCategory.LABOR_FORCE]: "경제활동인구",
      [StatCategory.CPI]: "소비자물가지수",
      [StatCategory.POPULATION]: "총인구",
    };
    return names[this.category];
  }

  /**
   * 포맷된 값 반환 (예: "1,234명", "3.5%")
   */
  getFormattedValue(): string {
    const formatted = this.value.toLocaleString("ko-KR");
    return `${formatted}${this.unit}`;
  }
}

/**
 * DataSource Entity
 * 데이터 출처를 나타내는 엔티티
 */
export class DataSource {
  private constructor(
    private readonly id: DataSourceId,
    private readonly name: string,
    private readonly apiBaseUrl: string | null,
    private readonly apiKeyEnv: string | null,
    private readonly rateLimitPerDay: number | null,
    private isActive: boolean,
    private readonly createdAt: Date
  ) {}

  static create(
    id: DataSourceId,
    name: string,
    apiBaseUrl?: string,
    apiKeyEnv?: string,
    rateLimitPerDay?: number
  ): DataSource {
    return new DataSource(
      id,
      name,
      apiBaseUrl ?? null,
      apiKeyEnv ?? null,
      rateLimitPerDay ?? null,
      true,
      new Date()
    );
  }

  static restore(
    id: DataSourceId,
    name: string,
    apiBaseUrl: string | null,
    apiKeyEnv: string | null,
    rateLimitPerDay: number | null,
    isActive: boolean,
    createdAt: Date
  ): DataSource {
    return new DataSource(
      id,
      name,
      apiBaseUrl,
      apiKeyEnv,
      rateLimitPerDay,
      isActive,
      createdAt
    );
  }

  // Getters
  getId(): DataSourceId {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getApiBaseUrl(): string | null {
    return this.apiBaseUrl;
  }
  getApiKeyEnv(): string | null {
    return this.apiKeyEnv;
  }
  getRateLimitPerDay(): number | null {
    return this.rateLimitPerDay;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * 데이터 소스 비활성화
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * 데이터 소스 활성화
   */
  activate(): void {
    this.isActive = true;
  }
}
