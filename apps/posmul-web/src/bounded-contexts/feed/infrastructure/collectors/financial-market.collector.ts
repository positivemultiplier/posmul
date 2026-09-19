import { Result, success, failure } from "@posmul/auth-economy-sdk";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";

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

export class FinancialMarketCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 실시간 환율 및 주요 암호화폐 시세를 수집하고 경제 예측 피드 아이템으로 생성
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const collectedItems: FeedItem[] = [];

    try {
      // 1. 환율 (USD/KRW) 수집
      let usdKrw = 1380;
      try {
        const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
          next: { revalidate: 3600 },
        });
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          usdKrw = Math.round(fxData.rates?.KRW || 1380);
        }
      } catch (err) {
        console.warn("[MarketCollector] FX API fallback:", err);
      }

      // 2. 비트코인 / 이더리움 시세 수집
      let btcKrw = 110000000;
      let ethKrw = 3600000;
      try {
        const coinRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=krw,usd",
          { next: { revalidate: 3600 } }
        );
        if (coinRes.ok) {
          const coinData = await coinRes.json();
          btcKrw = coinData.bitcoin?.krw || btcKrw;
          ethKrw = coinData.ethereum?.krw || ethKrw;
        }
      } catch (err) {
        console.warn("[MarketCollector] Coin API fallback:", err);
      }

      const todayStr = new Date().toISOString().split("T")[0];

      // 예측 지표 목록 정의
      const indicators: Array<{
        title: string;
        link: string;
        summary: string;
      }> = [
        {
          title: `[환율] 금주 원/달러 환율 1,400원선 돌파할까? (현재: ${usdKrw.toLocaleString()}원)`,
          link: `https://posmul.org/market/fx/usd-krw-${todayStr}`,
          summary: `글로벌 금리 기조와 달러 강세 압력 속에서 원/달러 환율이 1,400원선을 상향 돌파할 것인지에 대한 실시간 시민 경제 전망입니다. (현재 시세: 1달러 = ${usdKrw.toLocaleString()}원)`,
        },
        {
          title: `[가상자산] 비트코인(BTC) 1억 2천만 원 신고가 달성할까? (현재: ${(Math.round(btcKrw / 10000)).toLocaleString()}만 원)`,
          link: `https://posmul.org/market/crypto/btc-${todayStr}`,
          summary: `비트코인 반감기 이후 기관 투자 유입과 거시 유동성에 힘입어 1억 2천만 원 돌파 여부를 예측합니다. (현재 시세: ${(Math.round(btcKrw / 10000)).toLocaleString()}만 원)`,
        },
        {
          title: `[가상자산] 이더리움(ETH) 400만 원 선 회복할까? (현재: ${(Math.round(ethKrw / 10000)).toLocaleString()}만 원)`,
          link: `https://posmul.org/market/crypto/eth-${todayStr}`,
          summary: `이더리움 현물 ETF 유입세와 레이어2 생태계 확장에 따른 400만 원선 탈환 여부 예측입니다. (현재 시세: ${(Math.round(ethKrw / 10000)).toLocaleString()}만 원)`,
        },
        {
          title: `[증시] 코스피(KOSPI) 이번 분기 2,700선 안착할까?`,
          link: `https://posmul.org/market/stock/kospi-2700-${todayStr}`,
          summary: `국내 반도체 수출 실적 회복세 및 외국인 순매수 지속 여부에 따른 코스피 2,700선 도달 가능성을 예측합니다.`,
        },
      ];

      for (const ind of indicators) {
        const exists = await this.feedItemRepository.findByLink(ind.link);
        if (exists.success && exists.data) {
          continue;
        }

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440003", // 금융/증권 소스 ID
          title: ind.title,
          link: ind.link,
          contentSummary: ind.summary,
          publishedAt: new Date(),
          aiClassification: ContentClassification.PREDICTION,
          processStatus: ProcessStatus.PENDING,
        });

        await this.feedItemRepository.save(newItem);
        collectedItems.push(newItem);
      }

      return success(collectedItems);
    } catch (error) {
      console.error("[FinancialMarketCollector] Error:", error);
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
