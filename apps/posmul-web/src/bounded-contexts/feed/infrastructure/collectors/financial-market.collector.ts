import { failure, Result, success } from "@posmul/auth-economy-sdk";

import { FeedItem } from "../../domain/entities/feed-item.entity";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";
import { serializeBlueprint } from "../adapters/gemini-classifier.adapter";

interface CryptoQuote {
  btcKrw: number;
  btcUsd: number;
  ethKrw: number;
  ethUsd: number;
}

async function fetchUsdKrwRate(): Promise<number | null> {
  try {
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 1800 },
    });
    if (fxRes.ok) {
      const fxData = (await fxRes.json()) as { rates?: { KRW?: number } };
      const krw = Number(fxData.rates?.KRW);
      if (Number.isFinite(krw) && krw > 900) {
        return Math.round(krw * 10) / 10;
      }
    }
  } catch {
    // Live FX unavailable
  }
  return null;
}

async function fetchCryptoPrices(): Promise<CryptoQuote | null> {
  try {
    const coinRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=krw,usd",
      { next: { revalidate: 1800 } }
    );
    if (coinRes.ok) {
      const coinData = (await coinRes.json()) as {
        bitcoin?: { krw?: number; usd?: number };
        ethereum?: { krw?: number; usd?: number };
      };
      const btcUsd = Number(coinData.bitcoin?.usd);
      const ethUsd = Number(coinData.ethereum?.usd);
      const btcKrw = Number(coinData.bitcoin?.krw);
      const ethKrw = Number(coinData.ethereum?.krw);

      if (
        Number.isFinite(btcUsd) &&
        btcUsd > 1000 &&
        Number.isFinite(ethUsd) &&
        ethUsd > 100
      ) {
        return {
          btcKrw: Number.isFinite(btcKrw) ? btcKrw : Math.round(btcUsd * 1380),
          btcUsd: Math.round(btcUsd),
          ethKrw: Number.isFinite(ethKrw) ? ethKrw : Math.round(ethUsd * 1380),
          ethUsd: Math.round(ethUsd),
        };
      }
    }
  } catch {
    // Live crypto quote unavailable
  }
  return null;
}

/** 3일 주기 버킷 키 생성 (매일 동일 토픽 복제 방지) */
function getCycleBucketKey(now: Date): string {
  const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  const bucket = Math.floor(epochDays / 3);
  return `${now.getUTCFullYear()}-c${bucket}`;
}

export class FinancialMarketCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 실시간 외환(USD/KRW)·가상자산(BTC/ETH) 시세 기반 동적 팽팽한 라인 예측 블루프린트 수집
   * - 정적 반복 템플릿(금통위/물가/삼성전자 등 스케줄러 중복)은 생성하지 않음
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const collectedItems: FeedItem[] = [];

    try {
      const [usdKrw, crypto] = await Promise.all([
        fetchUsdKrwRate(),
        fetchCryptoPrices(),
      ]);

      const now = new Date();
      const bucketKey = getCycleBucketKey(now);
      const topics: Array<{ title: string; link: string; summary: string }> = [];

      if (usdKrw) {
        const anchor = Math.round(usdKrw / 10) * 10;
        const low = anchor - 10;
        const high = anchor + 10;
        const options = [
          `${low.toLocaleString()}원 미만`,
          `${low.toLocaleString()}~${anchor.toLocaleString()}원`,
          `${anchor.toLocaleString()}~${high.toLocaleString()}원`,
          `${high.toLocaleString()}원 이상`,
        ];

        const blueprint = serializeBlueprint({
          title: `[실시간 외환] 원/달러 환율, 3일 후 마감 기준 어느 가격대에 위치할까?`,
          summary: [
            `🎯 기준선: 현재 원/달러 환율은 1달러 = ${usdKrw.toLocaleString()}원 부근에서 거래 중입니다.`,
            `📈 상승·달러 강세 요인: 미국 국채금리 상승 및 글로벌 달러 인덱스 강세 압력이 상존합니다.`,
            `📉 하락·원화 강세 요인: 외국인 주식 순매수 및 외환당국 구두 개입 경계감이 상단을 제한합니다.`,
            `⚖️ 판정 기준: 72시간 후 글로벌 외환시장 기준 환율(USD/KRW) 수치로 4개 구간 중 하나를 정산합니다.`,
          ].join("\n"),
          keywords: ["원달러환율", "USD/KRW", "외환시장"],
          category: "ECONOMY",
          subcategory: "indicators",
          predictionType: "RANKING",
          options,
          resolutionCriteria:
            "마감 시점 공식 USD/KRW 환율(ExchangeRate API / 서울외국환중개) 기준 구간 정산",
          closingHoursFromNow: 60,
          settlementDelayHours: 12,
          oracleType: "manual",
          baselineFact: `현재 원/달러 환율 ${usdKrw.toLocaleString()}원 (중심 구간 ${anchor.toLocaleString()}원)`,
        });

        topics.push({
          title: `[실시간 외환] 원/달러 환율 (${usdKrw.toLocaleString()}원 기준) 4구간 예측`,
          link: `https://posmul.org/market/fx/usd-krw-${bucketKey}`,
          summary: `현재 원/달러 환율 ${usdKrw.toLocaleString()}원 기준 단기 방향성 예측\n\n${blueprint}`,
        });
      }

      if (crypto) {
        const btcAnchor = Math.round(crypto.btcUsd / 2000) * 2000;
        const btcStep = Math.max(2000, Math.round((crypto.btcUsd * 0.03) / 1000) * 1000);
        const lowBtc = btcAnchor - btcStep;
        const highBtc = btcAnchor + btcStep;
        const btcManKrw = Math.round(crypto.btcKrw / 10000);

        const btcBlueprint = serializeBlueprint({
          title: `[비트코인 4구간] BTC/USD 3일 후 마감 시점 예상 가격대는?`,
          summary: [
            `🎯 기준선: 현재 비트코인(BTC) 시세는 $${crypto.btcUsd.toLocaleString()}(약 ${btcManKrw.toLocaleString()}만 원)입니다.`,
            `📈 강세 요인: 현물 ETF 순유입 흐름과 글로벌 유동성 완화 기대가 하단을 지지합니다.`,
            `📉 약세 요인: 주요 저항선 부근 차익 실현 물량과 거시 변동성 확대 우려가 존재합니다.`,
            `⚖️ 판정 기준: 72시간 후 CoinGecko 공식 BTC/USD 현물 가격 기준으로 자동 정산합니다.`,
          ].join("\n"),
          keywords: ["비트코인", "BTC", "가상자산"],
          category: "ECONOMY",
          subcategory: "crypto",
          predictionType: "RANKING",
          options: [
            `$${lowBtc.toLocaleString()} 미만`,
            `$${lowBtc.toLocaleString()}~$${btcAnchor.toLocaleString()}`,
            `$${btcAnchor.toLocaleString()}~$${highBtc.toLocaleString()}`,
            `$${highBtc.toLocaleString()} 이상`,
          ],
          resolutionCriteria:
            "정산 시점 CoinGecko 공식 BTC/USD 현물 가격 기준 4구간 정산",
          closingHoursFromNow: 60,
          settlementDelayHours: 12,
          oracleType: "coingecko",
          oracleConfig: {
            coinId: "bitcoin",
            vsCurrency: "usd",
            ranges: [
              { id: "rank_1", max: lowBtc },
              { id: "rank_2", min: lowBtc, max: btcAnchor },
              { id: "rank_3", min: btcAnchor, max: highBtc },
              { id: "rank_4", min: highBtc },
            ],
          },
          baselineFact: `현재 BTC $${crypto.btcUsd.toLocaleString()} (${btcManKrw.toLocaleString()}만 원)`,
        });

        topics.push({
          title: `[비트코인 4구간] BTC/USD 현재 $${crypto.btcUsd.toLocaleString()} 예측`,
          link: `https://posmul.org/market/crypto/btc-range-${bucketKey}`,
          summary: `비트코인 실시간 시세 $${crypto.btcUsd.toLocaleString()} 기반 4구간 레인지\n\n${btcBlueprint}`,
        });

        const ethTarget = Math.round((crypto.ethUsd * 1.02) / 50) * 50;
        const ethManKrw = Math.round(crypto.ethKrw / 10000);
        const ethBlueprint = serializeBlueprint({
          title: `[이더리움] ETH/USD 3일 후 $${ethTarget.toLocaleString()} 이상 돌파·마감할까?`,
          summary: [
            `🎯 기준선: 현재 이더리움(ETH) 시세는 $${crypto.ethUsd.toLocaleString()}(약 ${ethManKrw.toLocaleString()}만 원)입니다.`,
            `📈 돌파 논거: 현재가 대비 약 +2% 상단 돌파 시 생태계 TVL 회복세가 탄력을 받을 수 있습니다.`,
            `📉 미달 논거: 알트코인 순환매 약세 및 BTC 도미넌스 상승 시 돌파가 지연될 수 있습니다.`,
            `⚖️ 판정 기준: 정산 시점 CoinGecko ETH/USD 가격 $${ethTarget.toLocaleString()} 이상 여부로 자동 정산합니다.`,
          ].join("\n"),
          keywords: ["이더리움", "ETH", "가상자산"],
          category: "ECONOMY",
          subcategory: "crypto",
          predictionType: "BINARY",
          options: [
            `$${ethTarget.toLocaleString()} 이상 마감`,
            `$${ethTarget.toLocaleString()} 미만 마감`,
          ],
          resolutionCriteria: `정산 시점 CoinGecko ETH/USD 공식 가격 $${ethTarget.toLocaleString()} 이상 여부`,
          closingHoursFromNow: 60,
          settlementDelayHours: 12,
          oracleType: "coingecko",
          oracleConfig: {
            coinId: "ethereum",
            vsCurrency: "usd",
            threshold: ethTarget,
            comparison: "gte",
          },
          baselineFact: `현재 ETH $${crypto.ethUsd.toLocaleString()}, 목표선 $${ethTarget.toLocaleString()}`,
        });

        topics.push({
          title: `[이더리움] ETH/USD $${ethTarget.toLocaleString()} 돌파 예측`,
          link: `https://posmul.org/market/crypto/eth-target-${bucketKey}`,
          summary: `이더리움 실시간 시세 $${crypto.ethUsd.toLocaleString()} 목표선 돌파\n\n${ethBlueprint}`,
        });
      }

      const candidateLinks = topics.map((t) => t.link);
      let existingLinks = new Set<string>();
      if (this.feedItemRepository.findExistingLinks && candidateLinks.length > 0) {
        const res = await this.feedItemRepository.findExistingLinks(candidateLinks);
        if (res.success) existingLinks = res.data;
      }

      for (const topic of topics) {
        if (existingLinks.has(topic.link)) continue;
        if (!this.feedItemRepository.findExistingLinks) {
          const single = await this.feedItemRepository.findByLink(topic.link);
          if (single.success && single.data) continue;
        }

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440003",
          title: topic.title,
          link: topic.link,
          contentSummary: topic.summary,
          publishedAt: new Date(),
          aiClassification: ContentClassification.PREDICTION,
          processStatus: ProcessStatus.CLASSIFIED,
        });

        const saveRes = await this.feedItemRepository.save(newItem);
        if (saveRes.success) {
          collectedItems.push(newItem);
        }
      }

      return success(collectedItems);
    } catch (error) {
      return failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
