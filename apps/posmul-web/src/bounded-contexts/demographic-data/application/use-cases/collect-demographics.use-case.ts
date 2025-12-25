/**
 * Collect Demographics Use Case
 * KOSIS API에서 인구통계 데이터를 수집하여 저장하는 유스케이스
 */
import {
  Statistic,
  createStatisticId,
  createDataSourceId,
} from "../../domain/entities/statistic.entity";
import {
  IStatisticRepository,
  IDataSourceRepository,
  Result,
} from "../../domain/repositories/statistic.repository";
import { StatCategory, PeriodType } from "../../domain/value-objects/statistics-value-objects";
import { KOSISClient, KOSISStatItem as _KOSISStatItem } from "../../infrastructure/api-clients/kosis.client";

/**
 * 수집 요청 DTO
 */
export interface CollectDemographicsRequest {
  regionCode: string;
  categories: StatCategory[];
  year: number;
  month?: number; // 없으면 해당 연도 전체
}

/**
 * 수집 결과 DTO
 */
export interface CollectDemographicsResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  savedCount: number;
  skippedCount: number; // 이미 존재하는 데이터
  errors: string[];
  collectedData: CollectedDataSummary[];
}

export interface CollectedDataSummary {
  category: StatCategory;
  regionCode: string;
  period: string;
  value: number;
  unit: string;
  isNew: boolean;
}

/**
 * CollectDemographicsUseCase
 * KOSIS API에서 인구통계 데이터를 수집하여 저장
 */
export class CollectDemographicsUseCase {
  constructor(
    private readonly statisticRepository: IStatisticRepository,
    private readonly dataSourceRepository: IDataSourceRepository,
    private readonly kosisClient: KOSISClient
  ) {}

  private ensureKosisConfigured(): Result<void> {
    if (!this.kosisClient.isConfigured()) {
      return {
        success: false,
        error: new Error("KOSIS API Key가 설정되지 않았습니다. KOSIS_API_KEY 환경변수를 확인하세요."),
      };
    }
    return { success: true, data: undefined };
  }

  private async resolveKosisSourceId(): Promise<string> {
    const sourceResult = await this.dataSourceRepository.findByName("KOSIS");
    return sourceResult.success && sourceResult.data
      ? sourceResult.data.getId()
      : createDataSourceId("kosis");
  }

  private async collectForCategory(
    request: CollectDemographicsRequest,
    category: StatCategory,
    kosisSourceId: string,
    result: CollectDemographicsResult
  ): Promise<void> {
    try {
      const response = request.month
        ? await this.kosisClient.fetchMonthlyData(category, request.regionCode, request.year, request.month)
        : await this.kosisClient.fetchStatistics(
            category,
            request.regionCode,
            request.year,
            request.year,
            PeriodType.MONTHLY
          );

      if (!response.success || !response.data) {
        result.failedCount++;
        result.errors.push(`${category}: ${response.error}`);
        return;
      }

      result.successCount++;
      await this.processItems(category, response.data, kosisSourceId, result);
    } catch (error) {
      result.failedCount++;
      result.errors.push(`${category}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async processItems(
    category: StatCategory,
    items: _KOSISStatItem[],
    kosisSourceId: string,
    result: CollectDemographicsResult
  ): Promise<void> {
    for (const item of items) {
      const parsedData = KOSISClient.parseStatItem(item, category);
      if (!parsedData) continue;

      const existsResult = await this.statisticRepository.exists(
        parsedData.regionCode,
        category,
        PeriodType.MONTHLY,
        parsedData.year,
        parsedData.month ?? undefined
      );

      if (existsResult.success && existsResult.data) {
        result.skippedCount++;
        result.collectedData.push({
          category,
          regionCode: parsedData.regionCode,
          period: this.formatPeriod(parsedData.year, parsedData.month),
          value: parsedData.value,
          unit: parsedData.unit,
          isNew: false,
        });
        continue;
      }

      const statistic = Statistic.create(
        createStatisticId(crypto.randomUUID()),
        kosisSourceId,
        parsedData.regionCode,
        category,
        PeriodType.MONTHLY,
        parsedData.year,
        parsedData.value,
        parsedData.unit,
        parsedData.month ?? undefined,
        undefined,
        { rawData: item }
      );

      const saveResult = await this.statisticRepository.save(statistic);
      if (saveResult.success) {
        result.savedCount++;
        result.collectedData.push({
          category,
          regionCode: parsedData.regionCode,
          period: this.formatPeriod(parsedData.year, parsedData.month),
          value: parsedData.value,
          unit: parsedData.unit,
          isNew: true,
        });
        continue;
      }

      const failedResult = saveResult as { success: false; error: Error };
      result.errors.push(
        `저장 실패 (${category}, ${parsedData.year}/${parsedData.month}): ${failedResult.error.message}`
      );
    }
  }

  /**
   * 인구통계 데이터 수집 실행
   */
  async execute(request: CollectDemographicsRequest): Promise<Result<CollectDemographicsResult>> {
    const result: CollectDemographicsResult = {
      totalRequested: request.categories.length,
      successCount: 0,
      failedCount: 0,
      savedCount: 0,
      skippedCount: 0,
      errors: [],
      collectedData: [],
    };

    const configuredResult = this.ensureKosisConfigured();
    if (!configuredResult.success) return configuredResult;

    const kosisSourceId = await this.resolveKosisSourceId();

    for (const category of request.categories) {
      await this.collectForCategory(request, category, kosisSourceId, result);
    }

    return { success: true, data: result };
  }

  /**
   * 광주 서구 전체 카테고리 수집 (편의 메서드)
   */
  async collectGwangjuSeoguAll(year: number, month?: number): Promise<Result<CollectDemographicsResult>> {
    return this.execute({
      regionCode: "29140", // 광주 서구
      categories: [
        StatCategory.BIRTH,
        StatCategory.DEATH,
        StatCategory.MIGRATION_IN,
        StatCategory.MIGRATION_OUT,
        StatCategory.EMPLOYMENT,
        StatCategory.UNEMPLOYMENT,
      ],
      year,
      month,
    });
  }

  /**
   * 기간 포맷팅 헬퍼
   */
  private formatPeriod(year: number, month: number | null): string {
    if (month) {
      return `${year}년 ${month}월`;
    }
    return `${year}년`;
  }
}

/**
 * GetStatisticsUseCase
 * 저장된 통계 데이터 조회
 */
export class GetStatisticsUseCase {
  constructor(private readonly statisticRepository: IStatisticRepository) {}

  /**
   * 최신 통계 데이터 조회
   */
  async getLatest(
    regionCode: string,
    category: StatCategory
  ): Promise<Result<Statistic | null>> {
    return this.statisticRepository.findLatest(regionCode, category);
  }

  /**
   * 시계열 데이터 조회
   */
  async getTimeSeries(
    regionCode: string,
    category: StatCategory,
    startYear: number,
    endYear: number
  ): Promise<Result<{ period: string; value: number; isPreliminary: boolean }[]>> {
    return this.statisticRepository.findTimeSeries(
      regionCode,
      category,
      startYear,
      endYear,
      PeriodType.MONTHLY
    );
  }

  /**
   * 지역 비교 데이터 조회
   */
  async compareRegions(
    regionCodes: string[],
    category: StatCategory,
    year: number,
    month: number
  ): Promise<Result<{ regionCode: string; value: number; unit: string }[]>> {
    const result = await this.statisticRepository.findForComparison(
      regionCodes,
      category,
      PeriodType.MONTHLY,
      year,
      month
    );

    if (!result.success) {
      return result as Result<never>;
    }

    return {
      success: true,
      data: result.data.map((stat) => ({
        regionCode: String(stat.getRegionCode()),
        value: stat.getValue(),
        unit: stat.getUnit(),
      })),
    };
  }
}
