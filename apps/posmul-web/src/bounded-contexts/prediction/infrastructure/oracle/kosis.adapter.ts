import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface KosisConfig {
  /** 지표 식별 코드 (예: 'CPI_RATE', 'UNEMPLOYMENT_RATE') */
  indicatorCode: string;
  /** 기관코드 (기본값: '101' 통계청) */
  orgId?: string;
  /** 통계표 ID (예: 소비자물가 'DT_1J22003', 고용동향 'DT_1DA7004S') */
  tblId?: string;
  /** 항목 ID (기본값: indicatorCode) */
  itmId?: string;
  /** 수록주기 ('M': 월, 'Q': 분기, 'Y': 년) */
  prdSe?: "M" | "Q" | "Y";
  comparisonType: "greater" | "less" | "equal" | "range";
  threshold?: number;
  optionMapping: Record<string, string>;
}

const DEFAULT_KOSIS_TABLES: Record<
  string,
  { orgId: string; tblId: string; itmId: string; prdSe: "M" | "Q" | "Y" }
> = {
  CPI_RATE: {
    orgId: "101",
    tblId: "DT_1J22003",
    itmId: "T03",
    prdSe: "M",
  },
  UNEMPLOYMENT_RATE: {
    orgId: "101",
    tblId: "DT_1DA7004S",
    itmId: "T80",
    prdSe: "M",
  },
  INDUSTRIAL_PRODUCTION: {
    orgId: "101",
    tblId: "DT_1JH2020",
    itmId: "T1",
    prdSe: "M",
  },
};

function buildKosisUrl(apiKey: string, config: KosisConfig): string {
  const preset = DEFAULT_KOSIS_TABLES[config.indicatorCode];
  const orgId = config.orgId ?? preset?.orgId ?? "101";
  const tblId = config.tblId ?? preset?.tblId ?? "DT_1J22003";
  const itmId = config.itmId ?? preset?.itmId ?? config.indicatorCode;
  const prdSe = config.prdSe ?? preset?.prdSe ?? "M";

  const params = new URLSearchParams({
    method: "getList",
    apiKey,
    orgId,
    tblId,
    itmId,
    prdSe,
    newEstPrdCnt: "2",
    format: "json",
    jsonVD: "Y",
  });

  return `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params.toString()}`;
}

export class KosisOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "kosis";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const apiKey = process.env.KOSIS_API_KEY;
    if (!apiKey) return null;

    const config = source.sourceConfig as unknown as KosisConfig;
    if (!config?.indicatorCode || !config?.optionMapping) return null;

    try {
      const res = await fetch(buildKosisUrl(apiKey, config));
      if (!res.ok) return null;

      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.item;
      const latestItem = Array.isArray(rows) ? rows[rows.length - 1] : null;
      const rawValue = latestItem?.DT ?? null;
      if (rawValue === null) return null;

      const numValue = parseFloat(String(rawValue));
      if (Number.isNaN(numValue)) return null;

      const threshold = config.threshold ?? 0;
      const resultKey =
        config.comparisonType === "less"
          ? numValue < threshold
            ? "below"
            : "above"
          : numValue > threshold
            ? "above"
            : "below";

      const winningOptionId = config.optionMapping[resultKey];
      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          indicatorCode: config.indicatorCode,
          period: latestItem?.PRD_DE,
          value: numValue,
          comparisonType: config.comparisonType,
          threshold,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    } catch {
      return null;
    }
  }
}
