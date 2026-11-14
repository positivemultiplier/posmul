import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface CoinGeckoRangeOption {
  id: string;
  min?: number;
  max?: number;
}

export interface CoinGeckoConfig {
  /** CoinGecko 코인 ID ('bitcoin', 'ethereum') 또는 환율 식별자('usd-krw', 'fx-usd-krw') */
  coinId: string;
  /** 기준 통화 ('usd' | 'krw') */
  vsCurrency: "usd" | "krw";
  /** 판정 방식: 목표가 돌파('threshold') 또는 24시간 등락 방향('change_direction') */
  comparisonType?: "threshold" | "change_direction";
  /** 임계값 비교 연산자 */
  comparison?: "gte" | "gt" | "lte" | "lt";
  /** comparisonType === 'threshold'일 때 목표 가격 */
  threshold?: number;
  /** 다자선택(RANKING) 가격 구간 판정 설정 */
  ranges?: CoinGeckoRangeOption[];
  /** 옵션 매핑: { above: 'yes', below: 'no' } 또는 { up: 'up', down: 'down' } */
  optionMapping?: Record<string, string>;
}

/**
 * CoinGecko 글로벌 암호화폐 & USD/KRW 환율 오라클 어댑터
 * - 무료 Public API로 BTC, ETH 실시간 시세, 다자선택 가격 구간(ranges),
 *   및 USD/KRW 환율(open.er-api.com)을 자동 판정합니다.
 */
export class CoinGeckoOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "coingecko";
  }

  private async fetchUsdKrwRate(): Promise<number | null> {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const krw = Number(data?.rates?.KRW);
      if (Number.isNaN(krw) || krw <= 0) return null;
      return krw;
    } catch {
      return null;
    }
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const config = (source.sourceConfig ?? {}) as unknown as CoinGeckoConfig;
    const coinId = config.coinId || "bitcoin";
    const vsCurrency = config.vsCurrency || "usd";

    let currentPrice = 0;
    let change24h = 0;
    let providerLabel = "CoinGecko Public API v3";

    if (coinId === "usd-krw" || coinId === "fx-usd-krw") {
      const fxPrice = await this.fetchUsdKrwRate();
      if (!fxPrice) return null;
      currentPrice = fxPrice;
      providerLabel = "ExchangeRate Open API (USD/KRW)";
    } else {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        coinId
      )}&vs_currencies=${encodeURIComponent(
        vsCurrency
      )}&include_24hr_change=true`;

      try {
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) return null;

        const data = await res.json();
        const coinEntry = data?.[coinId];
        if (!coinEntry) return null;

        currentPrice = Number(coinEntry[vsCurrency]);
        change24h = Number(coinEntry[`${vsCurrency}_24h_change`] ?? 0);
      } catch {
        return null;
      }
    }

    if (Number.isNaN(currentPrice) || currentPrice <= 0) {
      return null;
    }

    // 1. 다자선택 가격 구간(ranges) 매칭 지원
    if (Array.isArray(config.ranges) && config.ranges.length > 0) {
      const matchedRange = config.ranges.find((range) => {
        const minOk = range.min === undefined || currentPrice >= range.min;
        const maxOk = range.max === undefined || currentPrice < range.max;
        return minOk && maxOk;
      });

      if (!matchedRange) return null;

      return {
        winningOptionId: matchedRange.id,
        sourceData: {
          provider: providerLabel,
          coinId,
          vsCurrency,
          currentPrice,
          change24h,
          matchedRange,
        },
        confidence: 1.0,
        fetchedAt: new Date(),
      };
    }

    // 2. 방향/임계치 이진 판정 (optionMapping이 없어도 기본 yes/no/up/down 폴백)
    const effectiveMapping: Record<string, string> = {
      above: "yes",
      below: "no",
      yes: "yes",
      no: "no",
      up: "up",
      down: "down",
      ...(config.optionMapping ?? {}),
    };

    let resultKey = "below";
    if (config.comparisonType === "change_direction") {
      resultKey = change24h >= 0 ? "up" : "down";
    } else {
      const threshold = config.threshold ?? 95000;
      const op = config.comparison ?? "gte";
      const matched =
        op === "gt"
          ? currentPrice > threshold
          : op === "lte"
            ? currentPrice <= threshold
            : op === "lt"
              ? currentPrice < threshold
              : currentPrice >= threshold;
      resultKey = matched ? "above" : "below";
    }

    const winningOptionId =
      effectiveMapping[resultKey] ??
      (resultKey === "above" ? effectiveMapping.yes : effectiveMapping.no);

    if (!winningOptionId) return null;

    return {
      winningOptionId,
      sourceData: {
        provider: providerLabel,
        coinId,
        vsCurrency,
        currentPrice,
        change24h,
        threshold: config.threshold ?? null,
        comparison: config.comparison ?? "gte",
        resultKey,
      },
      confidence: 1.0,
      fetchedAt: new Date(),
    };
  }
}
