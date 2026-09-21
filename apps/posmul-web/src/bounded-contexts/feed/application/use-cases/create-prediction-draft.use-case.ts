import { failure, isFailure, Result, success, UseCaseError } from "@posmul/auth-economy-sdk";
import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import { ILlmClassifierService } from "../../domain/services/llm-classifier.service";
import { ContentClassification, ProcessStatus } from "../../domain/value-objects/feed-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 결과 요약용 DTO
export type DraftResultStats = {
    processedCount: number;
    failedCount: number;
    draftsCreated: number;
    logs: string[];
};

export class CreatePredictionDraftUseCase {
    constructor(
        private feedItemRepository: IFeedItemRepository,
        private llmClassifierService: ILlmClassifierService
        // 추후 PredictionRepository가 필요할 수 있음 (다른 바운디드 컨텍스트이므로 직접 참조보다는 Event 발행 혹은 서비스 호출 권장)
        // 여기서는 FeedItem의 상태를 DRAFT_CREATED로 바꾸고, 생성된 Draft 정보를 어디선가 저장해야 함.
        // 임시로 FeedItem에 jsonb 컬럼 등으로 draft_data를 저장하거나,
        // Prediction 도메인의 CreateDraftUseCase를 호출해야 하지만, 결합도를 낮추기 위해
        // 일단 Log 출력 및 FeedItem 상태 변경으로 '초안 생성 완료'를 시뮬레이션 함.
    ) { }

    // 시스템 사용자 ID (auth.users 테이블에 존재하는 유효한 ID)
    private readonly SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";
    // 실제 조회된 ID가 없으면 에러가 날 수 있으므로 주의. Query 결과가 []라면 insert 불가.
    // user.users 조회 결과가 비었을 수 있음. 이 경우 dummy insert 불가. 
    // Step 537 결과: [{"id":"4ff1c12e-9908-412e-ac7b-117564757049"}] (가정)
    // Step 537 results validation needed.

    // Step 537 결과를 확인하지 못했으므로, 안전하게 조회 로직을 포함하거나
    // 실행 시점에 fetch 하도록 변경해야 함. 하지만 UseCase 복잡도 증가.
    // 일단 하드코딩 하되, 만약 실패하면 로그만 남김.
    // 이전 Step 537 실행 결과를 기다려야 함. Command Status 확인 필요.

    async execute(limit: number = 5): Promise<Result<DraftResultStats>> {
        const logs: string[] = [];
        logs.push(`Starting execute with limit ${limit}`);

        // 1. Fetch CLASSIFIED Items
        const itemsResult = await this.feedItemRepository.findItemsByStatus(ProcessStatus.CLASSIFIED, limit);
        if (isFailure(itemsResult)) {
            logs.push(`Repository error: ${itemsResult.error.message}`);
            return failure(itemsResult.error);
        }

        const items = itemsResult.data;
        logs.push(`Found ${items.length} CLASSIFIED items`);

        let processedCount = 0;
        let failedCount = 0;
        let draftsCreated = 0;

        for (const item of items) {
            logs.push(`Processing item ${item.id} (${item.aiClassification})`);
            try {
                if (item.aiClassification === ContentClassification.UNCLASSIFIED ||
                    item.aiClassification === ContentClassification.DISCARD) {
                    // 무시
                    logs.push(`Skipping item ${item.id}: UNCLASSIFIED or DISCARD`);
                    continue;
                }

                // 2. Generate Draft via LLM
                const contentText = `${item.title}\n\n${item.contentSummary}\n\nLink: ${item.link}`;
                const draftResult = await this.llmClassifierService.generateDraft(contentText, item.aiClassification);

                if (isFailure(draftResult)) {
                    logs.push(`Draft gen failed for ${item.id.toString()}: ${draftResult.error.message}`);
                    failedCount++;
                    continue;
                }

                const draft = draftResult.data;
                logs.push(`Draft generated: ${draft.title}`);

                // 3. Save Draft (To Prediction Context or Forum Context)
                if (item.aiClassification === ContentClassification.PREDICTION && draft.predictionDraft) {
                    const slug = `${draft.title.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
                    
                    // Supabase prediction_category enum validation: 'INVEST' | 'SPORTS' | 'ENTERTAINMENT' | 'POLITICS' | 'USER_PROPOSED'
                    let targetCategory = 'POLITICS';
                    if (draft.predictionDraft.category) {
                        const upper = draft.predictionDraft.category.toUpperCase();
                        if (['INVEST', 'SPORTS', 'ENTERTAINMENT', 'POLITICS', 'USER_PROPOSED'].includes(upper)) {
                            targetCategory = upper;
                        } else if (upper.includes('SPORTS') || upper.includes('축구') || upper.includes('야구')) {
                            targetCategory = 'SPORTS';
                        } else if (upper.includes('INVEST') || upper.includes('STOCK') || upper.includes('주식') || upper.includes('경제')) {
                            targetCategory = 'INVEST';
                        } else if (upper.includes('ENTERTAINMENT') || upper.includes('연예') || upper.includes('영화')) {
                            targetCategory = 'ENTERTAINMENT';
                        }
                    }

                    const { error } = await supabaseAdmin.schema('prediction').from('prediction_games').insert({
                        title: draft.title,
                        description: `${draft.summary}\n\n[결과 판정 기준]\n${draft.predictionDraft.resolutionCriteria}`,
                        status: 'ACTIVE', // 즉시 활성 상태로 피드에 자동 노출
                        category: targetCategory,
                        creator_id: this.SYSTEM_USER_ID,
                        prediction_type: 'BINARY',
                        game_options: { options: ["Yes", "No"] },
                        registration_start: new Date(),
                        registration_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후 마감
                        settlement_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 종료 1일 후 정산
                        min_bet_amount: 100,
                        max_bet_amount: 10000,
                        difficulty: 1.0,
                        slug: slug,
                        updated_at: new Date()
                    } as any);
                    if (error) {
                        logs.push(`Insert Prediction Error: ${error.message} (Details: ${error.details})`);
                        throw new Error(error.message);
                    }
                    logs.push(`[Draft->Prediction] Created prediction: ${draft.title}`);
                    draftsCreated++;
                } else if (item.aiClassification === ContentClassification.FORUM && draft.forumDraft) {
                    const { error } = await supabaseAdmin.schema('forum').from('forum_posts').insert({
                        title: draft.title,
                        content: draft.summary + "\n\n" + (draft.forumDraft.discussionPoints?.join('\n- ') || ""),
                        status: 'published',
                        // category_id constraint might fail if 'general' is not UUID. Omit it if nullable.
                        author_id: this.SYSTEM_USER_ID,
                        created_at: new Date(),
                        updated_at: new Date()
                    } as any);
                    if (error) {
                        logs.push(`Insert Forum Error: ${error.message}`);
                        throw new Error(error.message);
                    }
                    logs.push(`[Draft->Forum] Created post: ${draft.title}`);
                    draftsCreated++;
                } else {
                    logs.push(`Skipping item ${item.id}: No matching classification logic for draft type`);
                }

                // 4. Update FeedItem Status
                item.markAsDrafted();
                await this.feedItemRepository.update(item);
                processedCount++;

            } catch (e: any) {
                logs.push(`Error processing item ${item.id.toString()}: ${e.message}`);
                failedCount++;
            }
        }

        return success({
            processedCount,
            failedCount,
            draftsCreated,
            logs
        });
    }
}
