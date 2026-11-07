import { IOracleProvider } from "../../domain/services/oracle/oracle.interface";
import {
  OracleResult,
  SettlementSource,
} from "../../domain/value-objects/settlement-types";

export interface CoinGeckoConfig {
  /** CoinGecko 코인 ID (예: 'bitcoin', 'ethereum', 'solana') */
  coinId: string;
  /** 기준 통화 ('usd' | 'krw') */
  vsCurrency: "usd" | "krw";
  /** 판정 방식: 목표가 돌파('threshold') 또는 24시간 등락 방향('change_direction') */
  comparisonType: "threshold" | "change_direction";
  /** comparisonType === 'threshold'일 때 목표 가격 */
  threshold?: number;
  /** 옵션 매핑: { above: 'yes', below: 'no' } 또는 { up: 'up', down: 'down' } */
  optionMapping: Record<string, string>;
}

/**
 * CoinGecko 글로벌 암호화폐 인덱스 오라클 어댑터
 * - API Key 없이 무료 Public REST 엔드포인트로 BTC, ETH 등 실시간 시세 및 목표가 돌파 여부 판정
 */
export class CoinGeckoOracleAdapter implements IOracleProvider {
  supports(sourceType: string): boolean {
    return sourceType === "coingecko";
  }

  async fetchResult(source: SettlementSource): Promise<OracleResult | null> {
    const config = source.sourceConfig as unknown as CoinGeckoConfig;
    const coinId = config?.coinId || "bitcoin";
    const vsCurrency = config?.vsCurrency || "usd";
    const optionMapping = config?.optionMapping;

    if (!optionMapping) {
      return null;
    }

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

      const currentPrice = Number(coinEntry[vsCurrency]);
      const change24h = Number(coinEntry[`${vsCurrency}_24h_change`] ?? 0);

      if (Number.isNaN(currentPrice) || currentPrice <= 0) {
        return null;
      }

      let resultKey = "below";
      if (config.comparisonType === "change_direction") {
        resultKey = change24h >= 0 ? "up" : "down";
      } else {
        const threshold = config.threshold ?? 95000;
        resultKey = currentPrice >= threshold ? "above" : "below";
      }

      const winningOptionId =
        optionMapping[resultKey] ??
        (resultKey === "above" ? optionMapping.yes : optionMapping.no);

      if (!winningOptionId) return null;

      return {
        winningOptionId,
        sourceData: {
          provider: "CoinGecko Public API v3",
          coinId,
          vsCurrency,
          currentPrice,
          change24h,
          threshold: config.threshold ?? null,
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

