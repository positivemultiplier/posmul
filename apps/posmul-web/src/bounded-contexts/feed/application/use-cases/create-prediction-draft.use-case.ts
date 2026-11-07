import {
  failure,
  isFailure,
  Result,
  success,
} from "@posmul/auth-economy-sdk";

import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import type { SettlementSourceType } from "@/bounded-contexts/prediction/domain/value-objects/settlement-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { IFeedItemRepository } from "../../domain/repositories/feed.repository";
import {
  DraftResult,
  ILlmClassifierService,
} from "../../domain/services/llm-classifier.service";
import {
  ContentClassification,
  ProcessStatus,
} from "../../domain/value-objects/feed-types";

export type DraftResultStats = {
  processedCount: number;
  failedCount: number;
  draftsCreated: number;
  logs: string[];
};

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

const VALID_DB_CATEGORIES = new Set([
  "INVEST",
  "SPORTS",
  "ENTERTAINMENT",
  "POLITICS",
  "USER_PROPOSED",
]);

const VALID_ORACLE_TYPES = new Set<SettlementSourceType>([
  "ecos",
  "kosis",
  "dart",
  "kobis",
  "kcontent",
  "coingecko",
  "fmp",
  "alpha-vantage",
  "football_data",
  "manual",
]);

function mapDraftCategoryToDb(rawCategory?: string): string {
  if (!rawCategory) return "POLITICS";
  const upper = rawCategory.toUpperCase();
  if (VALID_DB_CATEGORIES.has(upper)) return upper;

  if (
    upper.includes("SPORTS") ||
    upper.includes("축구") ||
    upper.includes("야구")
  ) {
    return "SPORTS";
  }
  if (
    upper.includes("INVEST") ||
    upper.includes("ECONOMY") ||
    upper.includes("CRYPTO") ||
    upper.includes("STOCK") ||
    upper.includes("경제") ||
    upper.includes("금융")
  ) {
    return "INVEST";
  }
  if (
    upper.includes("ENTERTAINMENT") ||
    upper.includes("연예") ||
    upper.includes("영화") ||
    upper.includes("드라마") ||
    upper.includes("가요")
  ) {
    return "ENTERTAINMENT";
  }
  return "POLITICS";
}

function resolveSmartTimeline(
  draft: NonNullable<DraftResult["predictionDraft"]>
): {
  registrationStart: Date;
  registrationEnd: Date;
  settlementDate: Date;
} {
  const now = new Date();
  const closingHours = Math.min(
    720,
    Math.max(2, draft.closingHoursFromNow ?? 72)
  );
  const settlementDelayHours = Math.min(
    168,
    Math.max(1, draft.settlementDelayHours ?? 12)
  );

  const registrationEnd = new Date(
    now.getTime() + closingHours * 60 * 60 * 1000
  );
  const settlementDate = new Date(
    registrationEnd.getTime() + settlementDelayHours * 60 * 60 * 1000
  );

  return {
    registrationStart: now,
    registrationEnd,
    settlementDate,
  };
}

function normalizeOracleType(rawType?: string): SettlementSourceType {
  if (rawType && VALID_ORACLE_TYPES.has(rawType as SettlementSourceType)) {
    return rawType as SettlementSourceType;
  }
  return "manual";
}

async function insertPredictionGameFromDraft(
  draft: DraftResult
): Promise<string> {
  const predDraft = draft.predictionDraft!;
  const targetCategory = mapDraftCategoryToDb(predDraft.category);
  const { registrationStart, registrationEnd, settlementDate } =
    resolveSmartTimeline(predDraft);

  const optionLabels =
    predDraft.options && predDraft.options.length >= 2
      ? predDraft.options
      : ["예 (Yes)", "아니오 (No)"];

  const structuredOptions = [
    { id: "yes", label: optionLabels[0] ?? "예 (Yes)" },
    { id: "no", label: optionLabels[1] ?? "아니오 (No)" },
  ];

  const slug = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const { data: inserted, error } = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .insert({
      title: draft.title,
      description: `${draft.summary}\n\n[결과 판정 기준]\n${predDraft.resolutionCriteria}`,
      status: "ACTIVE",
      category: targetCategory,
      creator_id: SYSTEM_USER_ID,
      prediction_type: "BINARY",
      game_options: { options: structuredOptions },
      registration_start: registrationStart.toISOString(),
      registration_end: registrationEnd.toISOString(),
      settlement_date: settlementDate.toISOString(),
      min_bet_amount: 100,
      max_bet_amount: 50000,
      difficulty: 1.0,
      slug,
      updated_at: nowIso(),
    } as any)
    .select("game_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Insert Prediction Error: ${error.message}`);
  }

  const createdGameId = inserted?.game_id ? String(inserted.game_id) : "";

  // 오라클 정산 소스를 settlement_sources 테이블에 함께 등록
  const oracleType = normalizeOracleType(predDraft.oracleType);
  if (createdGameId && oracleType !== "manual") {
    await settlementOrchestrator.registerSettlementSource({
      gameId: createdGameId,
      sourceType: oracleType,
      sourceConfig: predDraft.oracleConfig ?? {
        resolutionCriteria: predDraft.resolutionCriteria,
        optionMapping: { above: "yes", below: "no" },
      },
      scheduledAt: settlementDate,
    });
  }

  return createdGameId;
}

async function insertForumPostFromDraft(draft: DraftResult): Promise<void> {
  const discussionText = draft.forumDraft?.discussionPoints?.join("\n- ") || "";
  const { error } = await supabaseAdmin
    .schema("forum")
    .from("forum_posts")
    .insert({
      title: draft.title,
      content: `${draft.summary}\n\n${discussionText}`,
      status: "published",
      author_id: SYSTEM_USER_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    } as any);

  if (error) {
    throw new Error(`Insert Forum Error: ${error.message}`);
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

export class CreatePredictionDraftUseCase {
  constructor(
    private feedItemRepository: IFeedItemRepository,
    private llmClassifierService: ILlmClassifierService
  ) {}

  async execute(limit: number = 5): Promise<Result<DraftResultStats>> {
    const logs: string[] = [`Starting execute with limit ${limit}`];

    const itemsResult = await this.feedItemRepository.findItemsByStatus(
      ProcessStatus.CLASSIFIED,
      limit
    );
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
      if (
        item.aiClassification === ContentClassification.UNCLASSIFIED ||
        item.aiClassification === ContentClassification.DISCARD
      ) {
        continue;
      }

      try {
        const contentText = `${item.title}\n\n${item.contentSummary}\n\nLink: ${item.link}`;
        const draftResult = await this.llmClassifierService.generateDraft(
          contentText,
          item.aiClassification
        );

        if (isFailure(draftResult)) {
          failedCount++;
          logs.push(
            `Draft gen failed for ${item.id.toString()}: ${draftResult.error.message}`
          );
          continue;
        }

        const draft = draftResult.data;
        const created = await this.persistDraftByClassification(
          item.aiClassification,
          draft,
          logs
        );
        if (created) draftsCreated++;

        item.markAsDrafted();
        await this.feedItemRepository.update(item);
        processedCount++;
      } catch (e: any) {
        failedCount++;
        logs.push(`Error processing item ${item.id.toString()}: ${e.message}`);
      }
    }

    return success({
      processedCount,
      failedCount,
      draftsCreated,
      logs,
    });
  }

  private async persistDraftByClassification(
    classification: ContentClassification,
    draft: DraftResult,
    logs: string[]
  ): Promise<boolean> {
    if (
      classification === ContentClassification.PREDICTION &&
      draft.predictionDraft
    ) {
      await insertPredictionGameFromDraft(draft);
      logs.push(`[Draft->Prediction] Created prediction: ${draft.title}`);
      return true;
    }

    if (classification === ContentClassification.FORUM && draft.forumDraft) {
      await insertForumPostFromDraft(draft);
      logs.push(`[Draft->Forum] Created post: ${draft.title}`);
      return true;
    }

    return false;
  }
}
