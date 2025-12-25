/**
 * KOSIS API Client
 * 국가통계포털(KOSIS) Open API 클라이언트
 *
 * KOSIS API 문서: https://kosis.kr/openapi/
 *
 * 주요 테이블 ID:
 * - 인구동향조사: DT_1B8000F (출생/사망/혼인/이혼)
 * - 주민등록인구: DT_1B04005N
 * - 인구이동(전입/전출): DT_1B26001_A01
 * - 경제활동인구: DT_1DA7004S
 * - 소비자물가지수: DT_1J20004
 */

import { StatCategory, PeriodType } from "../../domain/value-objects/statistics-value-objects";

/**
 * KOSIS API 응답 타입
 */
export interface KOSISResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
  totalCount?: number;
}

/**
 * KOSIS 통계 데이터 항목
 */
export interface KOSISStatItem {
  TBL_ID: string; // 테이블 ID
  TBL_NM: string; // 테이블명
  ORG_ID: string; // 기관 ID
  C1: string; // 분류1 코드 (지역코드 등)
  C1_NM: string; // 분류1 명칭
  C2?: string; // 분류2 코드
  C2_NM?: string; // 분류2 명칭
  PRD_DE: string; // 기준시점 (YYYYMM or YYYY)
  DT: string; // 수치값
  UNIT_NM: string; // 단위
}

/**
 * KOSIS 테이블 정보
 */
export interface KOSISTableInfo {
  tableId: string;
  tableName: string;
  category: StatCategory;
  orgId: string;
  itemCode?: string;
  itemCodeNm?: string;
  /**
   * KOSIS OpenAPI v2 가이드 기준 통계 조회 키(userStatsId).
   * 값은 보통 KOSIS OpenAPI 화면에서 통계표 등록/선택 후 발급됩니다.
   */
  userStatsIdEnvVar?: string;
}

/**
 * 광주광역시 지역코드 매핑
 */
export const GWANGJU_KOSIS_CODES: Record<string, string> = {
  "29000": "29", // 광주광역시 전체
  "29110": "29110", // 동구
  "29140": "29140", // 서구
  "29155": "29155", // 남구
  "29170": "29170", // 북구
  "29200": "29200", // 광산구
};

/**
 * 통계 카테고리별 KOSIS 테이블 매핑
 */
export const CATEGORY_TABLE_MAP: Record<StatCategory, KOSISTableInfo> = {
  [StatCategory.BIRTH]: {
    tableId: "DT_1B8000F",
    tableName: "시도/월별 출생",
    category: StatCategory.BIRTH,
    orgId: "101",
    itemCode: "T1",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_BIRTH",
  },
  [StatCategory.DEATH]: {
    tableId: "DT_1B8000F",
    tableName: "시도/월별 사망",
    category: StatCategory.DEATH,
    orgId: "101",
    itemCode: "T2",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_DEATH",
  },
  [StatCategory.MARRIAGE]: {
    tableId: "DT_1B8000F",
    tableName: "시도/월별 혼인",
    category: StatCategory.MARRIAGE,
    orgId: "101",
    itemCode: "T3",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_MARRIAGE",
  },
  [StatCategory.DIVORCE]: {
    tableId: "DT_1B8000F",
    tableName: "시도/월별 이혼",
    category: StatCategory.DIVORCE,
    orgId: "101",
    itemCode: "T4",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_DIVORCE",
  },
  [StatCategory.MIGRATION_IN]: {
    tableId: "DT_1B26001_A01",
    tableName: "시도/월별 전입",
    category: StatCategory.MIGRATION_IN,
    orgId: "101",
    itemCode: "T10",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_MIGRATION_IN",
  },
  [StatCategory.MIGRATION_OUT]: {
    tableId: "DT_1B26001_A01",
    tableName: "시도/월별 전출",
    category: StatCategory.MIGRATION_OUT,
    orgId: "101",
    itemCode: "T20",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_MIGRATION_OUT",
  },
  [StatCategory.EMPLOYMENT]: {
    tableId: "DT_1DA7004S",
    tableName: "시도별 취업자",
    category: StatCategory.EMPLOYMENT,
    orgId: "101",
    itemCode: "T20",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_EMPLOYMENT",
  },
  [StatCategory.UNEMPLOYMENT]: {
    tableId: "DT_1DA7004S",
    tableName: "시도별 실업률",
    category: StatCategory.UNEMPLOYMENT,
    orgId: "101",
    itemCode: "T60",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_UNEMPLOYMENT",
  },
  [StatCategory.LABOR_FORCE]: {
    tableId: "DT_1DA7004S",
    tableName: "시도별 경제활동인구",
    category: StatCategory.LABOR_FORCE,
    orgId: "101",
    itemCode: "T10",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_LABOR_FORCE",
  },
  [StatCategory.CPI]: {
    tableId: "DT_1J20004",
    tableName: "소비자물가지수",
    category: StatCategory.CPI,
    orgId: "101",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_CPI",
  },
  [StatCategory.POPULATION]: {
    tableId: "DT_1B04005N",
    tableName: "주민등록인구",
    category: StatCategory.POPULATION,
    orgId: "101",
    userStatsIdEnvVar: "KOSIS_USER_STATS_ID_POPULATION",
  },
};

/**
 * KOSIS API 요청 파라미터
 */
export interface KOSISRequestParams {
  method: "getList";
  apiKey: string;
  userStatsId: string;
  itmId?: string; // 항목 ID
  objL1?: string; // 분류1 (지역코드)
  objL2?: string; // 분류2
  prdSe?: "M" | "Q" | "Y"; // 기간구분 (월/분기/연)
  startPrdDe?: string; // 시작기간
  endPrdDe?: string; // 종료기간
  prdInterval?: string; // 시점 간격
  newEstPrdCnt?: string; // 최신시점 개수
  format?: "json" | "xml";
  jsonVD?: "Y" | "N"; // JSON 유효성 검증
}

/**
 * KOSISClient
 * KOSIS Open API 호출 클라이언트
 */
export class KOSISClient {
  private readonly baseUrl = "https://kosis.kr/openapi/statisticsData.do";
  private readonly apiKey: string;
  private requestCount = 0;
  private readonly rateLimit = 1000; // 일일 요청 제한

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.KOSIS_API_KEY ?? "";

    // API Key 미설정 시 silent (런타임에서 처리)
  }

  /**
   * API 키 유효성 확인
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Rate Limit 체크
   */
  checkRateLimit(): boolean {
    return this.requestCount < this.rateLimit;
  }

  /**
   * 통계 데이터 조회
   */
  async fetchStatistics(
    category: StatCategory,
    regionCode: string,
    startYear: number,
    endYear: number,
    periodType: PeriodType = PeriodType.MONTHLY
  ): Promise<KOSISResponse<KOSISStatItem>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "KOSIS API Key가 설정되지 않았습니다.",
      };
    }

    if (!this.checkRateLimit()) {
      return {
        success: false,
        error: "일일 API 요청 한도를 초과했습니다.",
      };
    }

    const tableInfo = CATEGORY_TABLE_MAP[category];
    if (!tableInfo) {
      return {
        success: false,
        error: `지원하지 않는 통계 카테고리입니다: ${category}`,
      };
    }

    const userStatsId = this.resolveUserStatsId(tableInfo);
    if (!userStatsId) {
      return {
        success: false,
        error:
          "KOSIS userStatsId가 설정되지 않았습니다. OpenAPI에서 통계표 등록 후 발급된 userStatsId를 환경변수로 설정하세요.",
      };
    }

    const params = this.buildParams({
      method: "getList",
      apiKey: this.apiKey,
      userStatsId,
      prdSe: this.mapPeriodType(periodType),
      startPrdDe: this.formatPeriod(startYear, 1, periodType),
      endPrdDe: this.formatPeriod(endYear, 12, periodType),
      format: "json",
      jsonVD: "Y",
    });

    try {
      this.requestCount++;
      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP Error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      // KOSIS API는 에러 시에도 200을 반환하므로 응답 내용 확인
      if (data.err) {
        return {
          success: false,
          error: `KOSIS Error: ${data.err}`,
        };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        totalCount: Array.isArray(data) ? data.length : 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 특정 월 데이터 조회
   */
  async fetchMonthlyData(
    category: StatCategory,
    regionCode: string,
    year: number,
    month: number
  ): Promise<KOSISResponse<KOSISStatItem>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "KOSIS API Key가 설정되지 않았습니다.",
      };
    }

    const tableInfo = CATEGORY_TABLE_MAP[category];
    if (!tableInfo) {
      return {
        success: false,
        error: `지원하지 않는 통계 카테고리입니다: ${category}`,
      };
    }

    const userStatsId = this.resolveUserStatsId(tableInfo);
    if (!userStatsId) {
      return {
        success: false,
        error:
          "KOSIS userStatsId가 설정되지 않았습니다. OpenAPI에서 통계표 등록 후 발급된 userStatsId를 환경변수로 설정하세요.",
      };
    }

    const prdDe = `${year}${month.toString().padStart(2, "0")}`;

    const params = this.buildParams({
      method: "getList",
      apiKey: this.apiKey,
      userStatsId,
      prdSe: "M",
      startPrdDe: prdDe,
      endPrdDe: prdDe,
      format: "json",
      jsonVD: "Y",
    });

    try {
      this.requestCount++;
      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP Error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.err) {
        return {
          success: false,
          error: `KOSIS Error: ${data.err}`,
        };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        totalCount: Array.isArray(data) ? data.length : 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 여러 카테고리 데이터 일괄 조회
   */
  async fetchMultipleCategories(
    categories: StatCategory[],
    regionCode: string,
    year: number,
    month: number
  ): Promise<Map<StatCategory, KOSISResponse<KOSISStatItem>>> {
    const results = new Map<StatCategory, KOSISResponse<KOSISStatItem>>();

    // 순차 실행 (Rate Limit 고려)
    for (const category of categories) {
      const result = await this.fetchMonthlyData(category, regionCode, year, month);
      results.set(category, result);

      // 연속 요청 시 딜레이 추가
      await this.delay(100);
    }

    return results;
  }

  /**
   * URL 파라미터 빌드
   */
  private buildParams(params: KOSISRequestParams): string {
    const searchParams = new URLSearchParams();

    searchParams.append("method", params.method);
    searchParams.append("apiKey", params.apiKey);
    searchParams.append("userStatsId", params.userStatsId);

    if (params.itmId) searchParams.append("itmId", params.itmId);
    if (params.objL1) searchParams.append("objL1", params.objL1);
    if (params.objL2) searchParams.append("objL2", params.objL2);
    if (params.prdSe) searchParams.append("prdSe", params.prdSe);
    if (params.startPrdDe) searchParams.append("startPrdDe", params.startPrdDe);
    if (params.endPrdDe) searchParams.append("endPrdDe", params.endPrdDe);
    if (params.prdInterval) searchParams.append("prdInterval", params.prdInterval);
    if (params.newEstPrdCnt) searchParams.append("newEstPrdCnt", params.newEstPrdCnt);
    if (params.format) searchParams.append("format", params.format);
    if (params.jsonVD) searchParams.append("jsonVD", params.jsonVD);

    return searchParams.toString();
  }

  private resolveUserStatsId(tableInfo: KOSISTableInfo): string | null {
    if (!tableInfo.userStatsIdEnvVar) return null;
    const v = process.env[tableInfo.userStatsIdEnvVar];
    if (!v) return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * PeriodType을 KOSIS 기간구분으로 변환
   */
  private mapPeriodType(periodType: PeriodType): "M" | "Q" | "Y" {
    switch (periodType) {
      case PeriodType.MONTHLY:
        return "M";
      case PeriodType.QUARTERLY:
        return "Q";
      case PeriodType.YEARLY:
        return "Y";
      default:
        return "M";
    }
  }

  /**
   * 기간 포맷팅
   */
  private formatPeriod(year: number, month: number, periodType: PeriodType): string {
    switch (periodType) {
      case PeriodType.MONTHLY:
        return `${year}${month.toString().padStart(2, "0")}`;
      case PeriodType.QUARTERLY:
        const quarter = Math.ceil(month / 3);
        return `${year}${quarter}`;
      case PeriodType.YEARLY:
        return `${year}`;
      default:
        return `${year}${month.toString().padStart(2, "0")}`;
    }
  }

  /**
   * 딜레이 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * KOSIS 데이터를 내부 형식으로 변환
   */
  static parseStatItem(
    item: KOSISStatItem,
    _category: StatCategory
  ): {
    regionCode: string;
    year: number;
    month: number | null;
    value: number;
    unit: string;
  } | null {
    try {
      const prdDe = item.PRD_DE;
      const year = parseInt(prdDe.substring(0, 4), 10);
      const month = prdDe.length >= 6 ? parseInt(prdDe.substring(4, 6), 10) : null;
      const value = parseFloat(item.DT.replace(/,/g, ""));

      if (isNaN(value)) {
        return null;
      }

      return {
        regionCode: item.C1,
        year,
        month,
        value,
        unit: item.UNIT_NM || "명",
      };
    } catch {
      return null;
    }
  }
}

/**
 * 싱글톤 인스턴스 팩토리
 */
let kosisClientInstance: KOSISClient | null = null;

export function getKOSISClient(apiKey?: string): KOSISClient {
  if (!kosisClientInstance) {
    kosisClientInstance = new KOSISClient(apiKey);
  }
  return kosisClientInstance;
}
