import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface EcosConfig {
  /** 한국은행 통계표 코드 (예: '722Y001' 기준금리, '200Y101' 실질GDP, '301Y013' 경상수지) */
  statCode: string;
  /** 주기 ('D': 일, 'M': 월, 'Q': 분기, 'A': 연) */
  cycle: "D" | "M" | "Q" | "A";
  /** 통계항목 코드1 (예: 기준금리 '0101000') */
  itemCode1: string;
  /** 판정 방식: 임계값 비교('greater' | 'less') 또는 직전치 대비 변동 방향('change_direction') */
  comparisonType: "greater" | "less" | "change_direction";
  /** comparisonType이 greater/less일 때 기준값 */
  threshold?: number;
  /** 결과 키 매핑 (예: { above: 'above', below: 'below' } 또는 { hike: 'hike', hold: 'hold', cut: 'cut' }) */
  optionMapping: Record<string, string>;
}

interface EcosRow {
  STAT_CODE: string;
  STAT_NAME: string;
  ITEM_CODE1: string;
  ITEM_NAME1: string;
  DATA_VALUE: string;
  TIME: string;
}

interface EcosApiResponse {
  StatisticSearch?: {
    list_total_count: number;
    row: EcosRow[];
  };
  RESULT?: {
    CODE: string;
    MESSAGE: string;
  };
}

function buildEcosPeriodRange(cycle: EcosConfig["cycle"]): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const prevYear = year - 1;

  if (cycle === "D") {
    const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().split("T")[0]?.replace(/-/g, "") ?? `${year}0101`;
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (cycle === "M") {
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return { startDate: `${prevYear}01`, endDate: `${year}${month}` };
  }
  if (cycle === "Q") {
    return { startDate: `${prevYear}Q1`, endDate: `${year}Q4` };
  }
  return { startDate: `${prevYear}`, endDate: `${year}` };
}

function evaluateEcosOutcome(
  config: EcosConfig,
  latestVal: number,
  prevVal: number
): string {
  if (config.comparisonType === "change_direction") {
    if (latestVal > prevVal) return "hike";
    if (latestVal < prevVal) return "cut";
    return "hold";
  }

  const threshold = config.threshold ?? 0;
  if (config.comparisonType === "greater") {
    return latestVal > threshold ? "above" : "below";
  }
  return latestVal < threshold ? "below" : "above";
}

/**
 * 한국은행 경제통계시스템(ECOS) 오라클 어댑터
 * - 기준금리(722Y001), 실질 GDP 성장률(200Y101), 무역/경상수지(301Y013) 등 공식 지표 자동 판정
 */
export class EcosOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "ecos";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const apiKey = process.env.ECOS_API_KEY || process.env.BOK_ECOS_API_KEY;
    if (!apiKey) {
      return null;
    }

    const config = source.sourceConfig as unknown as EcosConfig;
    if (!config?.statCode || !config?.cycle || !config?.optionMapping) {
      return null;
    }

    const { startDate, endDate } = buildEcosPeriodRange(config.cycle);
    const itemSegment = config.itemCode1 ? `/${config.itemCode1}` : "";
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/10/${config.statCode}/${config.cycle}/${startDate}/${endDate}${itemSegment}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const data: EcosApiResponse = await res.json();
      const rows = data.StatisticSearch?.row;
      if (!rows || rows.length === 0) return null;

      const latestRow = rows[rows.length - 1];
      const prevRow = rows.length >= 2 ? rows[rows.length - 2] : latestRow;
      if (!latestRow) return null;

      const latestVal = parseFloat(latestRow.DATA_VALUE);
      const prevVal = parseFloat(prevRow?.DATA_VALUE ?? latestRow.DATA_VALUE);
      if (Number.isNaN(latestVal)) return null;

      const resultKey = evaluateEcosOutcome(config, latestVal, prevVal);
      const winningOptionId = config.optionMapping[resultKey];
      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          statCode: config.statCode,
          statName: latestRow.STAT_NAME,
          itemName: latestRow.ITEM_NAME1,
          period: latestRow.TIME,
          latestValue: latestVal,
          previousValue: prevVal,
          resultKey,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    } catch {
      return null;
    }
  }
}
