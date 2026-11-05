import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export type DartReportCode = "11013" | "11012" | "11014" | "11011";

export interface DartConfig {
  /** 고유번호 8자리 (예: 삼성전자 00126380, SK하이닉스 00164779, 현대차 00164742, NAVER 00266961, 카카오 00258801) */
  corpCode: string;
  /** 사업연도 (미지정 또는 'auto' 시 현재 날짜 기준 자동 산출) */
  bsnsYear?: string;
  /** 보고서 코드: 11013(1Q), 11012(반기/2Q), 11014(3Q), 11011(사업보고서/4Q) */
  reprtCode?: DartReportCode | "auto";
  /** 계정과목명 ('영업이익', '매출액', '당기순이익') */
  accountName: string;
  comparisonType: "greater" | "less";
  /** 비교 기준 금액 (원 단위) */
  threshold: number;
  optionMapping: Record<string, string>;
}

interface DartAccountItem {
  account_nm: string;
  thstrm_amount: string;
}

interface DartApiResponse {
  status: string;
  message: string;
  list?: DartAccountItem[];
}

/**
 * 현재 시점 기준 가장 최근 공시 대상 사업연도 및 분기 보고서 코드 자동 산출
 * - 1~3월: 전년도 사업보고서(11011)
 * - 4~5월: 당해 1분기보고서(11013)
 * - 6~8월: 당해 반기보고서(11012)
 * - 9~12월: 당해 3분기보고서(11014)
 */
export function resolveDartPeriod(
  bsnsYear?: string,
  reprtCode?: DartReportCode | "auto"
): { year: string; code: DartReportCode } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const defaultYear = month <= 3 ? String(currentYear - 1) : String(currentYear);
  let defaultCode: DartReportCode = "11014";
  if (month <= 3) defaultCode = "11011";
  else if (month <= 5) defaultCode = "11013";
  else if (month <= 8) defaultCode = "11012";

  return {
    year: !bsnsYear || bsnsYear === "auto" ? defaultYear : bsnsYear,
    code: !reprtCode || reprtCode === "auto" ? defaultCode : reprtCode,
  };
}

function findTargetDartAccount(
  list: DartAccountItem[],
  accountName: string
): DartAccountItem | undefined {
  const normalizedTarget = accountName.replace(/\s/g, "");
  return list.find(
    (item) =>
      item.account_nm.replace(/\s/g, "") === normalizedTarget ||
      item.account_nm.includes(accountName)
  );
}

export class DartOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "dart";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const apiKey =
      process.env.DART_API_KEY || process.env.NEXT_PUBLIC_DART_API_KEY;
    if (!apiKey) return null;

    const config = source.sourceConfig as unknown as DartConfig;
    if (!config?.corpCode || !config?.accountName || !config?.optionMapping) {
      return null;
    }

    const { year, code } = resolveDartPeriod(config.bsnsYear, config.reprtCode);
    const url = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?crtfc_key=${apiKey}&corp_code=${config.corpCode}&bsns_year=${year}&reprt_code=${code}&fs_div=CFS`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const data: DartApiResponse = await res.json();
      if (data.status !== "000" || !data.list || data.list.length === 0) {
        return null;
      }

      const targetAccount = findTargetDartAccount(
        data.list,
        config.accountName
      );
      if (!targetAccount) return null;

      const amount = parseFloat(targetAccount.thstrm_amount.replace(/,/g, ""));
      if (Number.isNaN(amount)) return null;

      const resultKey =
        config.comparisonType === "less"
          ? amount < config.threshold
            ? "below"
            : "above"
          : amount > config.threshold
            ? "above"
            : "below";

      const winningOptionId = config.optionMapping[resultKey];
      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          corpCode: config.corpCode,
          bsnsYear: year,
          reprtCode: code,
          accountName: targetAccount.account_nm,
          amount,
          threshold: config.threshold,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    } catch {
      return null;
    }
  }
}
