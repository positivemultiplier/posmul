import { failure, Result, success } from "@posmul/auth-economy-sdk";

import { FeedItem } from "../../domain/entities/feed-item.entity";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";

export interface BoxOfficeMovie {
  rank: number;
  movieNm: string;
  openDt: string;
  audiAcc: number;
  audiCnt: number;
}

interface EntertainmentFeedTopic {
  title: string;
  link: string;
  summary: string;
}

async function fetchKobisTopics(
  kobisKey: string,
  todayStr: string
): Promise<EntertainmentFeedTopic[]> {
  const topics: EntertainmentFeedTopic[] = [];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const targetDt =
    yesterday.toISOString().split("T")[0]?.replace(/-/g, "") ?? "20260101";

  const kobisUrl = `https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${kobisKey}&targetDt=${targetDt}`;
  const res = await fetch(kobisUrl);
  if (!res.ok) return topics;

  const data = await res.json();
  const movieList = data.boxOfficeResult?.dailyBoxOfficeList as
    | BoxOfficeMovie[]
    | undefined;
  if (!movieList || movieList.length === 0) return topics;

  const top1 = movieList[0];
  const top2 = movieList[1];

  if (top1) {
    const accMan = Math.round(Number(top1.audiAcc) / 10000);
    const nextMilestoneMan = Math.ceil((accMan + 50) / 100) * 100;
    topics.push({
      title: `[박스오피스] '${top1.movieNm}' 이번 주말 박스오피스 1위 수성할까? (현재 누적 ${accMan.toLocaleString()}만 명)`,
      link: `https://posmul.org/entertainment/boxoffice/${encodeURIComponent(top1.movieNm)}-${todayStr}`,
      summary: `영진위 통합전산망(KOBIS) 현재 박스오피스 1위 '${top1.movieNm}'이 이번 주말에도 1위를 지키고 누적 ${nextMilestoneMan.toLocaleString()}만 관객을 돌파할지 예측합니다. [마감: 금요일 18:00 / 정산: 월요일 09:00 KOBIS 공식 집계]`,
    });
  }

  if (top2) {
    topics.push({
      title: `[박스오피스] '${top2.movieNm}' 주말 일일 관객 15만 명 돌파할까?`,
      link: `https://posmul.org/entertainment/boxoffice/${encodeURIComponent(top2.movieNm)}-${todayStr}`,
      summary: `박스오피스 2위 '${top2.movieNm}'의 주말 관객 동원력과 역주행 가능성을 예측합니다. [정산: 영진위 KOBIS 일별 박스오피스 기준]`,
    });
  }

  return topics;
}

function getStandardKContentTopics(todayStr: string): EntertainmentFeedTopic[] {
  return [
    {
      title: `[영화·KOBIS] 이번 주말 박스오피스 1위 작품, 주말 관객 50만 명 돌파할까?`,
      link: `https://posmul.org/entertainment/boxoffice/weekend-top1-${todayStr}`,
      summary: `영진위 통합전산망(KOBIS) 주말 박스오피스(금~일) 1위 영화의 주말 관객 동원력이 50만 명을 넘길지 예측합니다. (금요일 18:00 마감 ➔ 월요일 09:00 KOBIS 정산)`,
    },
    {
      title: `[주말드라마] 금토·주말 미니시리즈 전국 가구 최고 시청률 12.0% 돌파할까?`,
      link: `https://posmul.org/entertainment/drama/weekend-rating-${todayStr}`,
      summary: `이번 주 방영되는 주말 미니시리즈 중 닐슨코리아 전국 가구 기준 시청률 12.0%를 돌파하는 흥행작이 나올지 예측합니다. (본방 1시간 전 마감 ➔ 익일 09:00 시청률 정산)`,
    },
    {
      title: `[일요예능] 일요일 저녁 프라임타임 예능 동시간대 시청률 1위 수성할까?`,
      link: `https://posmul.org/entertainment/variety/sunday-rating-${todayStr}`,
      summary: `일요일 황금시간대 대표 예능 프로그램의 닐슨코리아 수도권·전국 가구 시청률 1위 달성 여부를 예측합니다. (일요일 17:00 마감 ➔ 월요일 09:00 정산)`,
    },
    {
      title: `[K-POP 음원] 금주 컴백 타이틀곡, 발매 24시간 내 멜론 TOP 10 진입할까?`,
      link: `https://posmul.org/entertainment/music/melon-top10-${todayStr}`,
      summary: `이번 주 발매되는 주요 K-POP 아티스트의 신곡이 멜론 TOP 100 및 써클차트 일간 TOP 10에 진입할지 예측합니다. (발매 1시간 전 마감 ➔ 익일 13:00 정산)`,
    },
    {
      title: `[글로벌 K-POP] K-POP 아티스트 곡, 이번 주 미국 빌보드 Hot 100 차트인 성공할까?`,
      link: `https://posmul.org/entertainment/music/billboard-hot100-${todayStr}`,
      summary: `글로벌 스트리밍과 음원 판매량을 합산한 미국 Billboard Hot 100 최신 차트에 K-POP 트랙이 진입할지 예측합니다.`,
    },
  ];
}

export class BoxOfficeCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 영화(KOBIS 박스오피스), 드라마·예능(시청률), 가요(멜론·써클·빌보드 차트) 정기 예측 토픽 수집
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const collectedItems: FeedItem[] = [];

    try {
      const todayStr = new Date().toISOString().split("T")[0] ?? "2026-11-05";
      const kobisKey = process.env.KOBIS_API_KEY;
      const entertainmentTopics: EntertainmentFeedTopic[] = [];

      if (kobisKey) {
        try {
          const kobisTopics = await fetchKobisTopics(kobisKey, todayStr);
          entertainmentTopics.push(...kobisTopics);
        } catch {
          // KOBIS 호출 실패 시 기본 K-콘텐츠 정기 토픽으로 보강
        }
      }

      // 드라마·예능·가요 정기 토픽 상시 보강
      entertainmentTopics.push(...getStandardKContentTopics(todayStr));

      for (const topic of entertainmentTopics) {
        const exists = await this.feedItemRepository.findByLink(topic.link);
        if (exists.success && exists.data) {
          continue;
        }

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440007",
          title: topic.title,
          link: topic.link,
          contentSummary: topic.summary,
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
