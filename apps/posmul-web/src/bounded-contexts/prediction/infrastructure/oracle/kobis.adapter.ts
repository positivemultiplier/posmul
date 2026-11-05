import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface KobisConfig {
  /** 판정 모드: 누적 관객수 돌파 여부('audience_threshold') 또는 1위 영화 맞추기('rank1') */
  mode: "audience_threshold" | "rank1";
  /** 조회 대상 일자 (YYYYMMDD, 미지정 시 어제 날짜 기준) */
  targetDt?: string;
  /** 주간/주말 박스오피스 사용 여부 ('daily' | 'weekend') */
  periodType?: "daily" | "weekend";
  /** 대상 영화명 (audience_threshold 모드에서 필수) */
  movieNm?: string;
  /** 목표 누적 관객수 (예: 2000000) */
  threshold?: number;
  /** 옵션 매핑: audience_threshold -> { above: 'yes', below: 'no' }, rank1 -> { '영화명': 'opt_1', default: 'other' } */
  optionMapping: Record<string, string>;
}

interface KobisBoxOfficeItem {
  rank: string;
  movieNm: string;
  movieCd: string;
  openDt: string;
  audiCnt: string;
  audiAcc: string;
}

interface KobisApiResponse {
  boxOfficeResult?: {
    boxofficeType: string;
    showRange: string;
    dailyBoxOfficeList?: KobisBoxOfficeItem[];
    weeklyBoxOfficeList?: KobisBoxOfficeItem[];
  };
}

function resolveDefaultTargetDate(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split("T")[0]?.replace(/-/g, "") ?? "20260101";
}

function evaluateKobisBoxOffice(
  config: KobisConfig,
  list: KobisBoxOfficeItem[]
): { winningOptionId: string | undefined; matchedMovie: KobisBoxOfficeItem | undefined; resultKey: string } {
  if (config.mode === "rank1") {
    const top1 = list.find((m) => m.rank === "1") ?? list[0];
    if (!top1) {
      return { winningOptionId: undefined, matchedMovie: undefined, resultKey: "none" };
    }
    const directMatch = config.optionMapping[top1.movieNm];
    const fallbackMatch = config.optionMapping.default ?? config.optionMapping.other;
    return {
      winningOptionId: directMatch ?? fallbackMatch,
      matchedMovie: top1,
      resultKey: top1.movieNm,
    };
  }

  const targetMovie = config.movieNm
    ? list.find((m) => m.movieNm.includes(config.movieNm!))
    : list[0];

  if (!targetMovie) {
    return { winningOptionId: undefined, matchedMovie: undefined, resultKey: "not_found" };
  }

  const audiAcc = parseInt(targetMovie.audiAcc.replace(/,/g, ""), 10);
  const threshold = config.threshold ?? 1000000;
  const resultKey = audiAcc >= threshold ? "above" : "below";
  return {
    winningOptionId: config.optionMapping[resultKey],
    matchedMovie: targetMovie,
    resultKey,
  };
}

/**
 * 영화진흥위원회(KOBIS) 박스오피스 오라클 어댑터
 * - 주말/일간 박스오피스 1위 영화 및 누적 관객수 돌파 여부 자동 판정
 */
export class KobisOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "kobis";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const apiKey = process.env.KOBIS_API_KEY;
    if (!apiKey) {
      return null;
    }

    const config = source.sourceConfig as unknown as KobisConfig;
    if (!config?.mode || !config?.optionMapping) {
      return null;
    }

    const targetDt = config.targetDt || resolveDefaultTargetDate();
    const isWeekend = config.periodType === "weekend";
    const endpoint = isWeekend
      ? `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json?key=${apiKey}&targetDt=${targetDt}&weekGb=1`
      : `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${apiKey}&targetDt=${targetDt}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) return null;

      const data: KobisApiResponse = await res.json();
      const list =
        data.boxOfficeResult?.weeklyBoxOfficeList ??
        data.boxOfficeResult?.dailyBoxOfficeList ??
        [];

      if (list.length === 0) return null;

      const { winningOptionId, matchedMovie, resultKey } = evaluateKobisBoxOffice(
        config,
        list
      );
      if (!winningOptionId || !matchedMovie) return null;

      return {
        winningOptionId,
        sourceData: {
          targetDt,
          periodType: config.periodType ?? "daily",
          movieNm: matchedMovie.movieNm,
          rank: matchedMovie.rank,
          audiAcc: parseInt(matchedMovie.audiAcc, 10),
          audiCnt: parseInt(matchedMovie.audiCnt, 10),
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
