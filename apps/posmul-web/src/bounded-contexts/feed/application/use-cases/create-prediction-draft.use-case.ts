import {
  failure,
  isFailure,
  Result,
  success,
} from "@posmul/auth-economy-sdk";

import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import type { SettlementSourceType } from "@/bounded-contexts/prediction/domain/value-objects/settlement-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { balancedBriefingService } from "../../../prediction/application/services/balanced-briefing.service";

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
  "ECONOMY",
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
    upper.includes("야구") ||
    upper.includes("리그")
  ) {
    return "SPORTS";
  }
  if (
    upper.includes("ECONOMY") ||
    upper.includes("CRYPTO") ||
    upper.includes("STOCK") ||
    upper.includes("경제") ||
    upper.includes("금융") ||
    upper.includes("금리") ||
    upper.includes("물가")
  ) {
    return "ECONOMY";
  }
  if (
    upper.includes("INVEST") ||
    upper.includes("CONSUME") ||
    upper.includes("RETAIL") ||
    upper.includes("소비") ||
    upper.includes("투자") ||
    upper.includes("트렌드")
  ) {
    return "INVEST";
  }
  if (
    upper.includes("ENTERTAINMENT") ||
    upper.includes("CULTURE") ||
    upper.includes("연예") ||
    upper.includes("영화") ||
    upper.includes("드라마") ||
    upper.includes("가요") ||
    upper.includes("예능")
  ) {
    return "ENTERTAINMENT";
  }
  return "POLITICS";
}

function resolveDraftPredictionType(
  rawType: string | undefined,
  optionCount: number
): "BINARY" | "WIN_DRAW_LOSE" | "RANKING" {
  const upper = rawType?.toUpperCase();
  if (upper === "WIN_DRAW_LOSE" && optionCount === 3) {
    return "WIN_DRAW_LOSE";
  }
  if (upper === "RANKING" || optionCount >= 4) {
    return "RANKING";
  }
  if (optionCount === 3) {
    return "WIN_DRAW_LOSE";
  }
  return "BINARY";
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
      ? predDraft.options.map((o) => String(o).trim()).filter(Boolean)
      : ["예 (Yes)", "아니오 (No)"];

  const dbPredictionType = resolveDraftPredictionType(
    predDraft.predictionType,
    optionLabels.length
  );

  let structuredOptions: Array<{ id: string; label: string }>;
  if (dbPredictionType === "BINARY") {
    structuredOptions = [
      { id: "yes", label: optionLabels[0] ?? "예 (Yes)" },
      { id: "no", label: optionLabels[1] ?? "아니오 (No)" },
    ];
  } else if (dbPredictionType === "WIN_DRAW_LOSE") {
    const isEcosRate =
      predDraft.oracleType === "ecos" &&
      optionLabels.some((l) => l.includes("동결") || l.includes("인하"));
    const wdlIds = isEcosRate ? ["hold", "cut", "hike"] : ["win", "draw", "lose"];
    structuredOptions = optionLabels.slice(0, 3).map((label, idx) => ({
      id: wdlIds[idx] ?? `opt_${idx + 1}`,
      label,
    }));
  } else {
    structuredOptions = optionLabels.slice(0, 8).map((label, idx) => ({
      id: `rank_${idx + 1}`,
      label,
    }));
  }

  const oracleType = normalizeOracleType(predDraft.oracleType);
  const hasAutoOracle = oracleType !== "manual";
  const rawTitle = draft.title.trim();
  const safeTitle =
    rawTitle.length >= 10 ? rawTitle.slice(0, 200) : `${rawTitle} 예측 결과는?`;
  const rawDesc = `${draft.summary}\n\n[결과 판정 기준]\n${predDraft.resolutionCriteria}`.trim();
  const safeDesc =
    rawDesc.length >= 20
      ? rawDesc.slice(0, 2000)
      : `${rawDesc} (PosMul 공식 데이터 기반 예측 마켓)`;

  const difficulty =
    dbPredictionType === "RANKING" ? 3.5 : dbPredictionType === "WIN_DRAW_LOSE" ? 2.5 : 1.8;

  const slug = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const { data: inserted, error } = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .insert({
      title: safeTitle,
      description: safeDesc,
      status: "ACTIVE",
      category: targetCategory,
      subcategory: predDraft.subcategory ?? null,
      creator_id: SYSTEM_USER_ID,
      prediction_type: dbPredictionType,
      game_options: { options: structuredOptions },
      registration_start: registrationStart.toISOString(),
      registration_end: registrationEnd.toISOString(),
      settlement_date: settlementDate.toISOString(),
      min_bet_amount: 500,
      max_bet_amount: 50000,
      difficulty,
      settlement_type: hasAutoOracle ? "auto" : "manual",
      data_source: hasAutoOracle ? oracleType : null,
      is_official: hasAutoOracle,
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
  if (createdGameId && hasAutoOracle) {
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

  // AI 균형 의사결정 브리핑 사전 생성 (베스트에포트 — 실패 시 상세 페이지 조회 시 보강)
  if (createdGameId) {
    try {
      await balancedBriefingService.getOrCreateForGameId(createdGameId, {
        timeoutMs: 14000,
      });
    } catch (briefingError) {
      console.warn(
        "[CreatePredictionDraft] AI 균형 브리핑 사전 생성 건너뜀:",
        briefingError,
      );
    }
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

const DUPLICATE_TITLE_STOPWORDS = new Set([
  "이번",
  "금주",
  "내일",
  "오늘",
  "주말",
  "분기",
  "연결",
  "기준",
  "마감",
  "돌파",
  "상회",
  "하회",
  "유지",
  "예상",
  "예측",
  "결과",
  "여부",
  "할까",
  "어느",
  "이상",
  "미만",
  "현재",
  "시가",
  "종가",
  "가격대",
  "위치할까",
]);

function extractTitleTokens(title: string): Set<string> {
  const withoutTag = title.replace(/^\[[^\]]+\]\s*/, "").toLowerCase();
  const rawTokens = withoutTag.match(/[가-힣]{2,}|[a-z0-9]{2,}/g) ?? [];
  const filtered = new Set<string>();
  for (const t of rawTokens) {
    if (!DUPLICATE_TITLE_STOPWORDS.has(t) && !/^\d+$/.test(t)) {
      filtered.add(t);
    }
  }
  return filtered;
}

const SINGLETON_TOPIC_PATTERNS: RegExp[] = [
  /비트코인|btc/i,
  /이더리움|eth\b/i,
  /원\/달러|usd\/krw/i,
  /금통위|기준금리/i,
  /소비자물가|cpi/i,
];

function findDuplicateActiveTitle(
  candidateTitle: string,
  activeTitles: string[]
): string | null {
  const cleanCandidate = candidateTitle.trim().toLowerCase();
  const candidateTokens = extractTitleTokens(candidateTitle);

  for (const activeTitle of activeTitles) {
    if (activeTitle.trim().toLowerCase() === cleanCandidate) {
      return activeTitle;
    }

    for (const pattern of SINGLETON_TOPIC_PATTERNS) {
      if (pattern.test(candidateTitle) && pattern.test(activeTitle)) {
        return activeTitle;
      }
    }

    const activeTokens = extractTitleTokens(activeTitle);
    if (candidateTokens.size >= 2 && activeTokens.size >= 2) {
      let overlap = 0;
      for (const tok of candidateTokens) {
        if (activeTokens.has(tok)) overlap++;
      }
      const overlapRatio = overlap / Math.min(candidateTokens.size, activeTokens.size);
      if (overlap >= 3 || (overlap >= 2 && overlapRatio >= 0.6)) {
        return activeTitle;
      }
    }
  }

  return null;
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

    // 현재 ACTIVE 게임 제목 목록 조회 (중복 게임 생성 차단)
    const { data: activeRows } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("title")
      .eq("status", "ACTIVE");
    const activeTitles = ((activeRows || []) as Array<{ title: string | null }>)
      .map((r) => r.title ?? "")
      .filter(Boolean);

    let processedCount = 0;
    let failedCount = 0;
    let draftsCreated = 0;

    for (const item of items) {
      if (
        item.aiClassification === ContentClassification.UNCLASSIFIED ||
        item.aiClassification === ContentClassification.DISCARD
      ) {
        item.markAsIgnored(item.aiClassification);
        await this.feedItemRepository.update(item);
        continue;
      }

      // 사전 제목 중복 검사 (LLM 호출 절감)
      if (item.aiClassification === ContentClassification.PREDICTION) {
        const preDup = findDuplicateActiveTitle(item.title, activeTitles);
        if (preDup) {
          item.markAsIgnored(ContentClassification.DISCARD);
          await this.feedItemRepository.update(item);
          logs.push(`[Skip Duplicate Pre-Check] '${item.title}' matches '${preDup}'`);
          continue;
        }
      }

      try {
        const contentText = `${item.title}\n\n${item.contentSummary}\n\nLink: ${item.link}`;
        const draftResult = await this.llmClassifierService.generateDraft(
          contentText,
          item.aiClassification
        );

        if (isFailure(draftResult)) {
          failedCount++;
          // 품질 게이트 탈락/생성 실패 아이템이 큐 상단을 계속 막지 않도록 IGNORED 전환
          item.markAsIgnored(ContentClassification.DISCARD);
          await this.feedItemRepository.update(item);
          logs.push(
            `Draft rejected/failed for ${item.id.toString()}: ${draftResult.error.message}`
          );
          continue;
        }

        const draft = draftResult.data;
        if (item.aiClassification === ContentClassification.PREDICTION) {
          const postDup = findDuplicateActiveTitle(draft.title, activeTitles);
          if (postDup) {
            item.markAsIgnored(ContentClassification.DISCARD);
            await this.feedItemRepository.update(item);
            logs.push(`[Skip Duplicate Post-Check] '${draft.title}' matches '${postDup}'`);
            continue;
          }
        }

        const created = await this.persistDraftByClassification(
          item.aiClassification,
          draft,
          logs
        );
        if (created) {
          draftsCreated++;
          if (item.aiClassification === ContentClassification.PREDICTION) {
            activeTitles.push(draft.title);
          }
        }

        item.markAsDrafted();
        await this.feedItemRepository.update(item);
        processedCount++;
      } catch (e: any) {
        failedCount++;
        logs.push(`Error processing item ${item.id.toString()}: ${e.message}`);
      }
    }

    if (draftsCreated > 0) {
      try {
        await supabaseAdmin
          .schema("economy")
          .rpc("compute_prediction_hourly_game_pools");
        logs.push("[MoneyWave] Refreshed hourly game prize pools");
      } catch (mwErr: any) {
        logs.push(`[MoneyWave] Refresh warning: ${mwErr?.message || mwErr}`);
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
