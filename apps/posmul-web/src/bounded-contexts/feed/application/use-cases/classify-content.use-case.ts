import { failure, isFailure, Result, success, UseCaseError } from "@posmul/auth-economy-sdk";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import { ILlmClassifierService } from "../../domain/services/llm-classifier.service";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";

// 결과 요약용 DTO
interface ClassifyContentResult {
    processed: number;
    failed: number;
    predictions: number;
    forums: number;
    unclassified: number;
}

export class ClassifyContentUseCase {
    constructor(
        private feedRepo: IFeedItemRepository,
        private classifier: ILlmClassifierService
    ) { }

    async execute(limit: number = 10): Promise<Result<ClassifyContentResult>> {
        // 1. Fetch Pending Items
        const pendingItemsResult = await this.feedRepo.findPendingItems(limit);
        if (isFailure(pendingItemsResult)) return failure(pendingItemsResult.error);

        const items = pendingItemsResult.data;
        const resultStats: ClassifyContentResult = {
            processed: 0, failed: 0, predictions: 0, forums: 0, unclassified: 0
        };

        // 2. Process Loop
        for (const item of items) {
            try {
                // Classify
                const contentText = `${item.title}\n\n${item.contentSummary}`;
                const classResult = await this.classifier.classify(contentText);

                if (isFailure(classResult)) {
                    console.error(`Failed to classify item ${item.id.toString()}:`, classResult.error);
                    // 실패 시 상태 변경 없음 or Error 상태로 변경?
                    // 일단 Retry 위해 PENDING 유지하되, 반복 실패 방지 로직 필요 (여기선 생략)
                    resultStats.failed++;
                    continue;
                }

                const { classification } = classResult.data;

                // PREDICTION / FORUM만 다음 파이프라인(CLASSIFIED)으로 넘기고, 비예측/잡음은 IGNORED로 제외
                if (
                    classification === ContentClassification.UNCLASSIFIED ||
                    classification === ContentClassification.DISCARD
                ) {
                    item.markAsIgnored(classification);
                } else {
                    item.classify(classification);
                }

                // Save
                const saveResult = await this.feedRepo.update(item);
                if (isFailure(saveResult)) {
                    console.error(`Failed to save item ${item.id.toString()}:`, saveResult.error);
                    resultStats.failed++;
                    continue;
                }

                // Stats Update
                resultStats.processed++;
                if (classification === ContentClassification.PREDICTION) resultStats.predictions++;
                else if (classification === ContentClassification.FORUM) resultStats.forums++;
                else resultStats.unclassified++;

            } catch (e) {
                console.error(`Unexpected error processing item ${item.id.toString()}:`, e);
                resultStats.failed++;
            }
        }

        return success(resultStats);
    }
}
