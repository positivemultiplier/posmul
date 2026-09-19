import { Result, success, failure } from "@posmul/auth-economy-sdk";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";

export interface BoxOfficeMovie {
  rank: number;
  movieNm: string;
  openDt: string;
  audiAcc: number;
  audiCnt: number;
}

export class BoxOfficeCollector {
  constructor(private feedItemRepository: IFeedItemRepository) {}

  /**
   * 박스오피스 순위 및 드라마 시청률 관련 엔터테인먼트 예측 피드 수집
   */
  async collect(): Promise<Result<FeedItem[]>> {
    const collectedItems: FeedItem[] = [];

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const kobisKey = process.env.KOBIS_API_KEY;

      const entertainmentTopics: Array<{
        title: string;
        link: string;
        summary: string;
      }> = [];

      // 1. KOBIS API 시도 (API 키 존재 시)
      if (kobisKey) {
        try {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const targetDt = yesterday.toISOString().split("T")[0].replace(/-/g, "");

          const kobisUrl = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${kobisKey}&targetDt=${targetDt}`;
          const res = await fetch(kobisUrl);
          if (res.ok) {
            const data = await res.json();
            const movieList = data.boxOfficeResult?.dailyBoxOfficeList as BoxOfficeMovie[] | undefined;

            if (movieList && movieList.length > 0) {
              const top1 = movieList[0];
              const top2 = movieList[1];

              entertainmentTopics.push({
                title: `[박스오피스] '${top1.movieNm}' 이번 주말 박스오피스 1위 수성할까? (누적 ${(Math.round(top1.audiAcc / 10000)).toLocaleString()}만 관객)`,
                link: `https://posmul.org/entertainment/boxoffice/${encodeURIComponent(top1.movieNm)}-${todayStr}`,
                summary: `현재 박스오피스 1위를 달리고 있는 '${top1.movieNm}'이 이번 주말에도 1위를 지켜낼 수 있을지 시민들의 관객 추이를 예측합니다.`,
              });

              if (top2) {
                entertainmentTopics.push({
                  title: `[박스오피스] '${top2.movieNm}' 개봉 2주차 누적 200만 관객 돌파할까?`,
                  link: `https://posmul.org/entertainment/boxoffice/${encodeURIComponent(top2.movieNm)}-${todayStr}`,
                  summary: `'${top2.movieNm}'의 흥행 돌풍이 200만 관객을 넘어 장기 흥행으로 이어질 수 있을지 예측합니다.`,
                });
              }
            }
          }
        } catch (err) {
          console.warn("[BoxOfficeCollector] KOBIS API fallback:", err);
        }
      }

      // 2. KOBIS 데이터가 없거나 추가 문화/시청률 토픽 보강
      if (entertainmentTopics.length === 0) {
        entertainmentTopics.push(
          {
            title: `[영화] 주말 박스오피스 1위 신작 외화 vs 한국 대작 승자는?`,
            link: `https://posmul.org/entertainment/boxoffice/weekend-top1-${todayStr}`,
            summary: `이번 주말 극장가에서 한국 기대작과 할리우드 블록버스터 간의 치열한 1위 다툼의 승자를 예측합니다.`,
          },
          {
            title: `[드라마] 주말 미니시리즈 시청률 전국 12% 돌파할까?`,
            link: `https://posmul.org/entertainment/drama/weekend-rating-${todayStr}`,
            summary: `화제성을 모으고 있는 주말 황금시간대 드라마의 전국 가구 시청률 12% 돌파 여부를 예측합니다.`,
          },
          {
            title: `[K-POP] 신곡 멜론 TOP 100 차트 1위 진입할까?`,
            link: `https://posmul.org/entertainment/music/melon-top1-${todayStr}`,
            summary: `음원 발매와 동시에 실시간 차트 정상을 차지할 것인지 팬덤 및 대중 스트리밍 추이를 예측합니다.`,
          }
        );
      }

      for (const topic of entertainmentTopics) {
        const exists = await this.feedItemRepository.findByLink(topic.link);
        if (exists.success && exists.data) {
          continue;
        }

        const newItem = FeedItem.create({
          sourceId: "550e8400-e29b-41d4-a716-446655440007", // 연예/문화 소스 ID
          title: topic.title,
          link: topic.link,
          contentSummary: topic.summary,
          publishedAt: new Date(),
          aiClassification: ContentClassification.PREDICTION,
          processStatus: ProcessStatus.PENDING,
        });

        await this.feedItemRepository.save(newItem);
        collectedItems.push(newItem);
      }

      return success(collectedItems);
    } catch (error) {
      console.error("[BoxOfficeCollector] Error:", error);
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
