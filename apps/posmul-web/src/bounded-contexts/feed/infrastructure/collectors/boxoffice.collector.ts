import { failure, Result, success } from "@posmul/auth-economy-sdk";

import { FeedItem } from "../../domain/entities/feed-item.entity";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";
import { serializeBlueprint } from "../adapters/gemini-classifier.adapter";

interface BoxOfficeMovie {
  rank: string;
  movieCd: string;
  movieNm: string;
  audiAcc: string;
  audiCnt: string;
}

interface EntertainmentFeedTopic {
  title: string;
  link: string;
  summary: string;
}

/** KOBIS 일별 박스오피스 API 조회 (실존 작품명 기반 팩트 생성) */
async function fetchKobisTopics(
  apiKey: string,
  bucketKey: string
): Promise<EntertainmentFeedTopic[]> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const targetDt = yesterday.toISOString().split("T")[0]!.replace(/-/g, "");

  const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${encodeURIComponent(
    apiKey
  )}&targetDt=${targetDt}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    boxOfficeResult?: { dailyBoxOfficeList?: BoxOfficeMovie[] };
  };
  const list = data.boxOfficeResult?.dailyBoxOfficeList ?? [];
  if (list.length === 0) return [];

  const topics: EntertainmentFeedTopic[] = [];
  const top1 = list[0];
  const top2 = list[1];

  if (top1) {
    const accCount = Number(top1.audiAcc || 0);
    const accMan = Math.round(accCount / 10000);
    const milestoneStep = accMan >= 300 ? 50 : accMan >= 100 ? 30 : 20;
    const nextMilestoneMan =
      Math.max(10, Math.ceil((accMan + milestoneStep) / 10) * 10);

    const blueprint = serializeBlueprint({
      title: `[박스오피스] '${top1.movieNm}' 이번 주말 누적 관객 ${nextMilestoneMan.toLocaleString()}만 명 돌파할까?`,
      summary: [
        `🎯 기준선: 영진위 KOBIS 집계 기준 '${top1.movieNm}'의 현재 누적 관객 수는 약 ${accMan.toLocaleString()}만 명(박스오피스 1위)입니다.`,
        `📈 돌파 요인: 현재 예매율 및 주말 가족·커플 관객 유입이 유지될 경우 ${nextMilestoneMan.toLocaleString()}만 명 도달 가능성이 높습니다.`,
        `📉 미달 요인: 신작 개봉에 따른 상영관 점유율 분산 여부가 핵심 변수입니다.`,
        `⚖️ 판정 기준: 주말 마감 후 월요일 오전 KOBIS 공식 누적 관객 수로 자동 정산합니다.`,
      ].join("\n"),
      keywords: [top1.movieNm, "박스오피스", "KOBIS"],
      category: "ENTERTAINMENT",
      subcategory: "movie",
      predictionType: "BINARY",
      options: [
        `${nextMilestoneMan.toLocaleString()}만 명 이상 돌파`,
        `${nextMilestoneMan.toLocaleString()}만 명 미만 유지`,
      ],
      resolutionCriteria: `영진위 통합전산망(KOBIS) '${top1.movieNm}' 공식 누적 관객 수 기준`,
      closingHoursFromNow: 72,
      settlementDelayHours: 12,
      oracleType: "kobis",
      oracleConfig: {
        movieCd: top1.movieCd,
        movieNm: top1.movieNm,
        targetAudiAcc: nextMilestoneMan * 10000,
      },
      baselineFact: `'${top1.movieNm}' 현재 누적 ${accMan.toLocaleString()}만 명`,
    });

    topics.push({
      title: `[박스오피스] '${top1.movieNm}' ${nextMilestoneMan.toLocaleString()}만 관객 돌파 예측`,
      link: `https://posmul.org/entertainment/boxoffice/${encodeURIComponent(
        top1.movieCd || top1.movieNm
      )}-${bucketKey}`,
      summary: `KOBIS 박스오피스 1위 '${top1.movieNm}' 누적 관객 예측\n\n${blueprint}`,
    });
  }

  if (top1 && top2) {
    const blueprint = serializeBlueprint({
      title: `[극장 맞대결] 이번 주말 박스오피스 1위는 '${top1.movieNm}' vs '${top2.movieNm}' 중 어느 작품일까?`,
      summary: [
        `🎯 기준선: 현재 일별 박스오피스 1위는 '${top1.movieNm}', 2위는 '${top2.movieNm}'입니다.`,
        `📈 1위 수성 시나리오: '${top1.movieNm}'의 입소문과 좌석판매율 우위가 주말까지 이어지는 경우입니다.`,
        `📉 역전 시나리오: '${top2.movieNm}' 또는 제3의 신작이 주말 스크린 확보로 순위를 뒤집는 경우입니다.`,
        `⚖️ 판정 기준: KOBIS 주말 박스오피스 1위 작품 공식 발표 기준으로 정산합니다.`,
      ].join("\n"),
      keywords: [top1.movieNm, top2.movieNm, "주말박스오피스"],
      category: "ENTERTAINMENT",
      subcategory: "movie",
      predictionType: "WIN_DRAW_LOSE",
      options: [top1.movieNm, top2.movieNm, "그 외 다른 작품 1위"],
      resolutionCriteria: "영진위 통합전산망(KOBIS) 주말 박스오피스 1위 공식 순위",
      closingHoursFromNow: 72,
      settlementDelayHours: 12,
      oracleType: "kobis",
      baselineFact: `1위 ${top1.movieNm} vs 2위 ${top2.movieNm}`,
    });

    topics.push({
      title: `[극장 맞대결] '${top1.movieNm}' vs '${top2.movieNm}' 주말 1위 대결`,
      link: `https://posmul.org/entertainment/boxoffice/versus-${bucketKey}`,
      summary: `주말 박스오피스 1위 맞대결\n\n${blueprint}`,
    });
  }

  return topics;
}

export class BoxOfficeCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 실존 영화 작품명(KOBIS API)이 확인될 때만 박스오피스 예측 토픽 수집
   * - KOBIS_API_KEY가 없는 상태에서 추상 '작품군/걸그룹' 템플릿을 매일 복제하던 동작 제거
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const kobisKey = process.env.KOBIS_API_KEY?.trim();
    if (!kobisKey) {
      return success([]);
    }

    const collectedItems: FeedItem[] = [];
    try {
      const now = new Date();
      const bucketKey = `${now.getUTCFullYear()}-w${Math.ceil(
        (now.getTime() - new Date(now.getUTCFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      )}`;

      const topics = await fetchKobisTopics(kobisKey, bucketKey);
      for (const topic of topics) {
        const exists = await this.feedItemRepository.findByLink(topic.link);
        if (exists.success && exists.data) continue;

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440007",
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
