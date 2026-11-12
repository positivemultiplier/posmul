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
  /** 분류 ID (예: 실업률 전국 '00', CPI 전국 'T10') */
  objL1?: string;
  /** 계산 방식 ('raw': 원수치 직접 비교, 'yoy_pct': 전년동월비 % 계산) */
  calculationType?: "raw" | "yoy_pct";
  /** 수록주기 ('M': 월, 'Q': 분기, 'Y': 년) */
  prdSe?: "M" | "Q" | "Y";
  comparisonType: "greater" | "less" | "equal" | "range";
  threshold?: number;
  optionMapping: Record<string, string>;
}

interface KosisRow {
  PRD_DE?: string;
  DT?: string | number;
}

const DEFAULT_KOSIS_TABLES: Record<
  string,
  {
    orgId: string;
    tblId: string;
    itmId: string;
    objL1: string;
    prdSe: "M" | "Q" | "Y";
    calculationType?: "raw" | "yoy_pct";
  }
> = {
  CPI_RATE: {
    orgId: "101",
    tblId: "DT_1J22003",
    itmId: "T",
    objL1: "T10",
    prdSe: "M",
    calculationType: "yoy_pct",
  },
  UNEMPLOYMENT_RATE: {
    orgId: "101",
    tblId: "DT_1DA7004S",
    itmId: "T80",
    objL1: "00",
    prdSe: "M",
    calculationType: "raw",
  },
  INDUSTRIAL_PRODUCTION: {
    orgId: "101",
    tblId: "DT_1JH2020",
    itmId: "T1",
    objL1: "00",
    prdSe: "M",
    calculationType: "raw",
  },
};

function isYoyCalculation(config: KosisConfig): boolean {
  const preset = DEFAULT_KOSIS_TABLES[config.indicatorCode];
  return (config.calculationType ?? preset?.calculationType) === "yoy_pct";
}

function resolveItemAndObjL1(config: KosisConfig): {
  orgId: string;
  tblId: string;
  itmId: string;
  objL1: string;
  prdSe: "M" | "Q" | "Y";
} {
  const preset = DEFAULT_KOSIS_TABLES[config.indicatorCode];
  const orgId = config.orgId ?? preset?.orgId ?? "101";
  const tblId = config.tblId ?? preset?.tblId ?? "DT_1J22003";
  // DT_1J22003(소비자물가지수 총지수)는 KOSIS API에서 항목 ID 'T'와 전국 코드 'T10'만 유효
  const normalizedItmId =
    tblId === "DT_1J22003" && config.itmId === "T03"
      ? "T"
      : (config.itmId ?? preset?.itmId ?? config.indicatorCode);
  const objL1 =
    tblId === "DT_1J22003"
      ? (config.objL1 ?? "T10")
      : (config.objL1 ?? preset?.objL1 ?? "00");
  const prdSe = config.prdSe ?? preset?.prdSe ?? "M";
  return { orgId, tblId, itmId: normalizedItmId, objL1, prdSe };
}

function buildKosisUrl(apiKey: string, config: KosisConfig): string {
  const { orgId, tblId, itmId, objL1, prdSe } = resolveItemAndObjL1(config);
  const newEstPrdCnt = isYoyCalculation(config) ? "13" : "2";

  const params = new URLSearchParams({
    method: "getList",
    apiKey,
    orgId,
    tblId,
    objL1,
    itmId,
    prdSe,
    newEstPrdCnt,
    format: "json",
    jsonVD: "Y",
  });

  return `https://kosis.kr/openapi/Param/statisticsParameterData.do?${params.toString()}`;
}

function computeKosisMetricValue(
  rows: KosisRow[],
  config: KosisConfig
): { period: string; value: number } | null {
  const sortedRows = [...rows].sort((a, b) =>
    String(a?.PRD_DE ?? "").localeCompare(String(b?.PRD_DE ?? ""))
  );
  const latestItem = sortedRows[sortedRows.length - 1];
  const latestPeriod = String(latestItem?.PRD_DE ?? "");
  const latestVal = parseFloat(String(latestItem?.DT ?? ""));
  if (!latestPeriod || Number.isNaN(latestVal)) return null;

  if (!isYoyCalculation(config)) {
    return { period: latestPeriod, value: latestVal };
  }

  // YYYYMM 형태에서 1년 전 동월((YYYY-1)MM) 지수와 비교해 전년동월비(%) 산출
  const year = parseInt(latestPeriod.slice(0, 4), 10);
  const suffix = latestPeriod.slice(4);
  if (Number.isNaN(year) || !suffix) return null;

  const prevYearPeriod = `${year - 1}${suffix}`;
  const prevItem = sortedRows.find((r) => String(r?.PRD_DE ?? "") === prevYearPeriod);
  const prevVal = parseFloat(String(prevItem?.DT ?? ""));
  if (Number.isNaN(prevVal) || prevVal <= 0) return null;

  const yoyPct = Number((((latestVal - prevVal) / prevVal) * 100).toFixed(4));
  return { period: latestPeriod, value: yoyPct };
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
      if (!Array.isArray(rows) || rows.length === 0) return null;

      const metric = computeKosisMetricValue(rows as KosisRow[], config);
      if (!metric) return null;

      const threshold = config.threshold ?? 0;
      const resultKey =
        config.comparisonType === "less"
          ? metric.value < threshold
            ? "below"
            : "above"
          : metric.value > threshold
            ? "above"
            : "below";

      const winningOptionId = config.optionMapping[resultKey];
      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          indicatorCode: config.indicatorCode,
          period: metric.period,
          value: metric.value,
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
