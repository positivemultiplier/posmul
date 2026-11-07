import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface KContentConfig {
  /** 세부 분류: 'drama_rating' | 'variety_rating_rank1' | 'music_chart_top10' | 'ott_top1' */
  subCategory:
    | "drama_rating"
    | "variety_rating_rank1"
    | "music_chart_top10"
    | "ott_top1";
  /** 측정 지표명 (예: 'nielsen_national_household', 'netflix_kr_top10', 'melon_weekly_top10') */
  metric?: string;
  /** 시청률 등 수치 임계값 (예: 12.0) */
  threshold?: number;
  /** 공식 발표 후 검증 입력된 수치 (존재 시 자동 판정) */
  verifiedValue?: number;
  /** 공식 발표 후 확정된 승리 옵션 ID (존재 시 즉시 정산) */
  verifiedOptionId?: string;
  /** 결과 매핑 ({ above: 'yes', below: 'no' }) */
  optionMapping?: Record<string, string>;
}

/**
 * K-콘텐츠 (닐슨코리아 드라마/예능 시청률 · 넷플릭스 TOP 10 · 써클/멜론 음원차트) 오라클 어댑터
 * - 공인 집계 발표 시각 이후 확정된 시청률/순위 스냅샷을 기반으로 정산 수행
 */
export class KContentOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "kcontent";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const config = source.sourceConfig as unknown as KContentConfig;
    if (!config?.subCategory) {
      return null;
    }

    // 1. 공식 결과 옵션이 확정 등록된 경우 즉시 반환
    if (config.verifiedOptionId) {
      return {
        winningOptionId: config.verifiedOptionId,
        sourceData: {
          provider: "K-Content Official Rating/Chart Oracle",
          subCategory: config.subCategory,
          metric: config.metric ?? "official_announcement",
          verifiedOptionId: config.verifiedOptionId,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    }

    // 2. 시청률 수치(verifiedValue)와 임계값(threshold)이 주어진 경우 자동 비교 판정
    if (
      typeof config.verifiedValue === "number" &&
      typeof config.threshold === "number" &&
      config.optionMapping
    ) {
      const resultKey =
        config.verifiedValue >= config.threshold ? "above" : "below";
      const winningOptionId =
        config.optionMapping[resultKey] ??
        (resultKey === "above"
          ? config.optionMapping.yes
          : config.optionMapping.no);

      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          provider: "Nielsen Korea / Official K-Content Rating",
          subCategory: config.subCategory,
          metric: config.metric ?? "nielsen_national_household",
          verifiedValue: config.verifiedValue,
          threshold: config.threshold,
          resultKey,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    }

    return null;
  }
}

