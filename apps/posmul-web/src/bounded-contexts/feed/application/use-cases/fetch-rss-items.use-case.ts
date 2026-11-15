import Parser from "rss-parser";
import {
  Result,
  UseCaseError,
  failure,
  isFailure,
  success,
} from "@posmul/auth-economy-sdk";
import {
  IFeedItemRepository,
  IRssSourceRepository,
} from "../../domain/repositories/feed.repository";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";
import { schedulerConfigService } from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import {
  fetchCleanPressBodyByUrl,
  isPublicPressSourceUrl,
} from "../../infrastructure/collectors/public-press.collector";

const MAX_ITEMS_PER_SOURCE = 12;
const SOURCE_BATCH_SIZE = 4;
const MAX_DETAIL_ENRICH_PER_SOURCE = 5;

export class FetchRssItemsUseCase {
  private parser: Parser;

  constructor(
    private rssSourceRepository: IRssSourceRepository,
    private feedItemRepository: IFeedItemRepository
  ) {
    this.parser = new Parser({
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      },
      customFields: {
        item: ["description", "encoded"],
      },
    });
  }

  async execute(options?: {
    category?: string;
  }): Promise<Result<{ fetchedCount: number; sourceCount: number }, UseCaseError>> {
    try {
      const sourcesResult = await this.rssSourceRepository.findAllActive();
      if (isFailure(sourcesResult)) {
        console.error("[FetchRss] Repository Error:", sourcesResult.error);
        return failure(
          new UseCaseError(
            `Failed to fetch RSS sources: ${sourcesResult.error.message}`
          )
        );
      }

      let sources = sourcesResult.data.filter(
        (s) => !isPublicPressSourceUrl(s.url)
      );
      if (options?.category && options.category !== "ALL") {
        const targetCat = options.category.toUpperCase();
        sources = sources.filter(
          (s) => s.category.toUpperCase() === targetCat
        );
      }

      console.log(
        `[FetchRss] Found ${sources.length} active sources for category '${
          options?.category || "ALL"
        }'`
      );

      const schedulerConfig = await schedulerConfigService.getSchedulerConfig();
      const pendingTtlHours = Math.max(12, schedulerConfig.feed_pending_ttl_hours || 48);
      const staleCutoffMs = Date.now() - pendingTtlHours * 60 * 60 * 1000;
      let totalFetched = 0;
      let skippedStaleCount = 0;

      for (let i = 0; i < sources.length; i += SOURCE_BATCH_SIZE) {
        const batch = sources.slice(i, i + SOURCE_BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (source) => {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 9000);
              let rawXml = "";
              try {
                const res = await fetch(source.url, {
                  signal: controller.signal,
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
                  },
                  cache: "no-store",
                });
                if (!res.ok) {
                  throw new Error(`HTTP ${res.status}`);
                }
                rawXml = (await res.text()).replace(/^\uFEFF/, "").trim();
              } finally {
                clearTimeout(timer);
              }
              const feed = await this.parser.parseString(rawXml);
              const recentItems = (feed.items || [])
                .filter((item) => Boolean(item.link && item.title))
                .slice(0, MAX_ITEMS_PER_SOURCE);

              if (recentItems.length === 0) return 0;

              const candidateLinks = recentItems.map((it) => String(it.link));
              let existingLinks = new Set<string>();

              if (this.feedItemRepository.findExistingLinks) {
                const bulkRes =
                  await this.feedItemRepository.findExistingLinks(candidateLinks);
                if (bulkRes.success) {
                  existingLinks = bulkRes.data;
                }
              } else {
                for (const link of candidateLinks) {
                  const single = await this.feedItemRepository.findByLink(link);
                  if (single.success && single.data) {
                    existingLinks.add(link);
                  }
                }
              }

              let savedForSource = 0;
              let enrichedDetailCount = 0;
              for (const item of recentItems) {
                const rawPubDate = item.isoDate || item.pubDate;
                if (rawPubDate) {
                  const pubMs = new Date(String(rawPubDate)).getTime();
                  if (!Number.isNaN(pubMs) && pubMs < staleCutoffMs) {
                    skippedStaleCount++;
                    continue;
                  }
                }
                const link = String(item.link);
                if (existingLinks.has(link)) continue;
                existingLinks.add(link);

                let contentSummary =
                  (item.contentSnippet || item.content || "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 1800) || null;

                // 과기정통부 등 본문 없이 제목+링크만 제공하는 공식 RSS는 상세 페이지에서 원문 보강
                if (
                  (!contentSummary || contentSummary.length < 120) &&
                  enrichedDetailCount < MAX_DETAIL_ENRICH_PER_SOURCE
                ) {
                  enrichedDetailCount++;
                  const detailBody = await fetchCleanPressBodyByUrl(link);
                  if (detailBody && detailBody.length >= 60) {
                    contentSummary = detailBody.slice(0, 1800);
                  }
                }

                const newItem = FeedItem.create({
                  sourceId: source.id.toString(),
                  title: String(item.title).trim(),
                  link,
                  contentSummary,
                  publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                  aiClassification: ContentClassification.UNCLASSIFIED,
                  processStatus: ProcessStatus.PENDING,
                });

                const saveRes = await this.feedItemRepository.save(newItem);
                if (saveRes.success) {
                  savedForSource++;
                }
              }

              return savedForSource;
            } catch (error) {
              console.error(`[FetchRss] Error fetching ${source.url}:`, error);
              return 0;
            }
          })
        );

        for (const res of batchResults) {
          if (res.status === "fulfilled") {
            totalFetched += res.value;
          }
        }
      }

      return success({ fetchedCount: totalFetched, sourceCount: sources.length });
    } catch {
      return failure(new UseCaseError("Unexpected error in FetchRssItemsUseCase"));
    }
  }
}
