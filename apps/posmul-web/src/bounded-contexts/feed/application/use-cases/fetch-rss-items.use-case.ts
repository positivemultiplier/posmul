import Parser from "rss-parser";
import { Result, UseCaseError, failure, isFailure, success } from "@posmul/auth-economy-sdk";
import { IFeedItemRepository, IRssSourceRepository } from "../../domain/repositories/feed.repository";
import { FeedItem } from "../../domain/entities/feed-item.entity";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";

export class FetchRssItemsUseCase {
    private parser: Parser;

    constructor(
        private rssSourceRepository: IRssSourceRepository,
        private feedItemRepository: IFeedItemRepository
    ) {
        this.parser = new Parser({
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Accept: application/rss+xml, application/xml, text/xml; q=0.1"
            },
            customFields: {
                item: ['description', 'encoded'],
            }
        });
    }

    async execute(options?: { category?: string }): Promise<Result<{ fetchedCount: number; sourceCount: number }, UseCaseError>> {
        try {
            // 1. 활성 RSS 소스 조회
            const sourcesResult = await this.rssSourceRepository.findAllActive();
            if (isFailure(sourcesResult)) {
                console.error("[FetchRss] Repository Error:", sourcesResult.error);
                return failure(new UseCaseError(`Failed to fetch RSS sources: ${sourcesResult.error.message}`));
            }
            let sources = sourcesResult.data;

            // 카테고리 필터링 (지정된 경우)
            if (options?.category && options.category !== "ALL") {
                sources = sources.filter(
                    (s) => s.category.toUpperCase() === options.category!.toUpperCase()
                );
            }

            console.log(`[FetchRss] Found ${sources.length} active sources for category '${options?.category || "ALL"}'`);

            let totalFetched = 0;

            // 2. 각 소스별로 Fetching
            for (const source of sources) {
                try {
                    const feed = await this.parser.parseURL(source.url);
                    console.log(`[FetchRss] Fetched ${feed.items.length} items from ${source.title}`);

                    for (const item of feed.items) {
                        if (!item.link || !item.title) continue;

                        // 중복 체크
                        const existsResult = await this.feedItemRepository.findByLink(item.link);
                        if (existsResult.success && existsResult.data) {
                            continue; // 이미 존재함
                        }

                        // 신규 저장
                        const newItem = FeedItem.create({
                            sourceId: source.id.toString(),
                            title: item.title,
                            link: item.link,
                            contentSummary: item.contentSnippet || item.content,
                            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                            aiClassification: ContentClassification.UNCLASSIFIED,
                            processStatus: ProcessStatus.PENDING,
                        });

                        await this.feedItemRepository.save(newItem);
                        totalFetched++;
                    }
                } catch (error) {
                    console.error(`[FetchRss] Error fetching ${source.url}:`, error);
                    // 개별 소스 실패는 무시하고 계속 진행
                }
            }

            return success({ fetchedCount: totalFetched, sourceCount: sources.length });
        } catch (error) {
            return failure(new UseCaseError("Unexpected error in FetchRssItemsUseCase"));
        }
    }
}
