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

const MAX_ITEMS_PER_SOURCE = 12;
const SOURCE_BATCH_SIZE = 4;

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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Accept: application/rss+xml, application/xml, text/xml; q=0.1",
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

      let sources = sourcesResult.data;
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

      let totalFetched = 0;

      for (let i = 0; i < sources.length; i += SOURCE_BATCH_SIZE) {
        const batch = sources.slice(i, i + SOURCE_BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (source) => {
            try {
              const feed = await this.parser.parseURL(source.url);
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
              for (const item of recentItems) {
                const link = String(item.link);
                if (existingLinks.has(link)) continue;
                existingLinks.add(link);

                const newItem = FeedItem.create({
                  sourceId: source.id.toString(),
                  title: String(item.title).trim(),
                  link,
                  contentSummary:
                    (item.contentSnippet || item.content || "")
                      .replace(/<[^>]+>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 1200) || null,
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
