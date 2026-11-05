import { failure, Result, success } from "@posmul/auth-economy-sdk";

import { FeedItem } from "../../domain/entities/feed-item.entity";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";

export interface MarketIndicator {
  name: string;
  symbol: string;
  currentValue: number;
  unit: string;
  changeRate24h?: number;
  predictionTopic: string;
  targetThreshold: number;
  condition: "ABOVE" | "BELOW";
}

async function fetchUsdKrwRate(): Promise<number> {
  try {
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      return Math.round(fxData.rates?.KRW || 1380);
    }
  } catch {
    // Fallback to default rate
  }
  return 1380;
}

async function fetchCryptoPrices(): Promise<{ btcKrw: number; ethKrw: number }> {
  try {
    const coinRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=krw,usd",
      { next: { revalidate: 3600 } }
    );
    if (coinRes.ok) {
      const coinData = await coinRes.json();
      return {
        btcKrw: coinData.bitcoin?.krw || 110_000_000,
        ethKrw: coinData.ethereum?.krw || 3_600_000,
      };
    }
  } catch {
    // Fallback to default prices
  }
  return { btcKrw: 110_000_000, ethKrw: 3_600_000 };
}

export class FinancialMarketCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 실시간 환율·가상자산 시세 및 한국은행(ECOS)·통계청(KOSIS)·금감원(DART) 정기 경제지표 예측 피드 수집
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const collectedItems: FeedItem[] = [];

    try {
      const [usdKrw, { btcKrw, ethKrw }] = await Promise.all([
        fetchUsdKrwRate(),
        fetchCryptoPrices(),
      ]);

      const todayStr = new Date().toISOString().split("T")[0] ?? "2026-11-05";

      const indicators: Array<{
        title: string;
        link: string;
        summary: string;
      }> = [
        {
          title: `[금통위·한국은행] 차기 금융통화위원회에서 기준금리 인하할까?`,
          link: `https://posmul.org/economy/bok/base-rate-${todayStr}`,
          summary: `한국은행 금융통화위원회 본회의에서 기준금리를 인하할지, 동결·인상할지 예측합니다. (마감: 발표 1시간 전 09:00 / 정산: 한국은행 ECOS 통계표 722Y001)`,
        },
        {
          title: `[통계청·KOSIS] 이번 달 소비자물가 상승률(CPI) 전년동월비 2.5% 상회할까?`,
          link: `https://posmul.org/economy/kosis/cpi-${todayStr}`,
          summary: `통계청 소비자물가동향 발표 기준 전년동월대비 상승률이 2.5%를 초과할지 예측합니다. (마감: 발표일 07:00 / 정산: KOSIS DT_1J22003)`,
        },
        {
          title: `[실적공시·DART] 삼성전자 이번 분기 연결 영업이익 10조 원 돌파할까?`,
          link: `https://posmul.org/economy/dart/samsung-op-${todayStr}`,
          summary: `금융감독원 전자공시시스템(OpenDART) 분기보고서 기준 삼성전자 연결 영업이익 10조 원 상회 여부를 예측합니다. (정산: OpenDART fnlttSinglAcntAll API)`,
        },
        {
          title: `[환율] 금주 원/달러 환율 1,400원선 돌파할까? (현재: ${usdKrw.toLocaleString()}원)`,
          link: `https://posmul.org/market/fx/usd-krw-${todayStr}`,
          summary: `글로벌 금리 기조와 달러 강세 압력 속에서 원/달러 환율이 1,400원선을 상향 돌파할지 예측합니다. (현재 시세: 1달러 = ${usdKrw.toLocaleString()}원)`,
        },
        {
          title: `[가상자산] 비트코인(BTC) 1억 2천만 원 돌파할까? (현재: ${Math.round(btcKrw / 10000).toLocaleString()}만 원)`,
          link: `https://posmul.org/market/crypto/btc-${todayStr}`,
          summary: `비트코인 기관 자금 유입과 거시 유동성에 따른 1억 2천만 원 돌파 여부를 예측합니다. (현재 시세: ${Math.round(btcKrw / 10000).toLocaleString()}만 원, 정산: CoinGecko/업비트 기준, 이더리움 현재 ${Math.round(ethKrw / 10000).toLocaleString()}만 원)`,
        },
      ];

      for (const ind of indicators) {
        const exists = await this.feedItemRepository.findByLink(ind.link);
        if (exists.success && exists.data) {
          continue;
        }

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440003",
          title: ind.title,
          link: ind.link,
          contentSummary: ind.summary,
          publishedAt: new Date(),
          aiClassification: ContentClassification.PREDICTION,
          processStatus: ProcessStatus.CLASSIFIED,
        });

        await this.feedItemRepository.save(newItem);
        collectedItems.push(newItem);
      }

      return success(collectedItems);
    } catch (error) {
      return failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
