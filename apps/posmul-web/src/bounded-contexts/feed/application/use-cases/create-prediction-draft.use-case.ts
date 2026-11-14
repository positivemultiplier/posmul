import {
  failure,
  isFailure,
  Result,
  success,
} from "@posmul/auth-economy-sdk";

import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import {
  type DuplicateCheckStrictness,
  schedulerConfigService,
} from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import type { SettlementSourceType } from "@/bounded-contexts/prediction/domain/value-objects/settlement-types";
import { resolveNormalizedRegion } from "@/bounded-contexts/prediction/domain/value-objects/region-hierarchy";
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

export interface CreatePredictionDraftOptions {
  categoryFilter?: string[];
  allowedTypes?: string[];
  minBet?: number;
  maxBet?: number;
  closingHours?: number;
  settlementDelayHours?: number;
  autoBriefing?: boolean;
  maxActiveCap?: number;
  strictness?: DuplicateCheckStrictness;
  ignoreCap?: boolean;
}

export type DraftResultStats = {
  processedCount: number;
  failedCount: number;
  draftsCreated: number;
  skippedByCategory?: number;
  skippedByCap?: boolean;
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
  "kr_public",
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
  optionCount: number,
  allowedTypes?: string[]
): "BINARY" | "WIN_DRAW_LOSE" | "RANKING" {
  const upper = rawType?.toUpperCase();
  let resolved: "BINARY" | "WIN_DRAW_LOSE" | "RANKING" = "BINARY";
  if (upper === "WIN_DRAW_LOSE" && optionCount === 3) {
    resolved = "WIN_DRAW_LOSE";
  } else if (upper === "RANKING" || optionCount >= 4) {
    resolved = "RANKING";
  } else if (optionCount === 3) {
    resolved = "WIN_DRAW_LOSE";
  }

  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(resolved)) {
    if (allowedTypes.includes("BINARY")) return "BINARY";
    if (allowedTypes.includes("WIN_DRAW_LOSE") && optionCount >= 3) return "WIN_DRAW_LOSE";
    if (allowedTypes.includes("RANKING") && optionCount >= 4) return "RANKING";
    return allowedTypes[0] as "BINARY" | "WIN_DRAW_LOSE" | "RANKING";
  }

  return resolved;
}

function resolveSmartTimeline(
  draft: NonNullable<DraftResult["predictionDraft"]>,
  defaultClosingHours = 48,
  defaultSettlementDelayHours = 2
): {
  registrationStart: Date;
  registrationEnd: Date;
  settlementDate: Date;
} {
  const now = new Date();
  const closingHours = Math.min(
    720,
    Math.max(1, draft.closingHoursFromNow ?? defaultClosingHours)
  );
  const settlementDelayHours = Math.min(
    168,
    Math.max(0, draft.settlementDelayHours ?? defaultSettlementDelayHours)
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

interface InsertPredictionFromDraftParams {
  allowedTypes: string[];
  minBet: number;
  maxBet: number;
  defaultClosingHours: number;
  defaultSettlementDelayHours: number;
  autoBriefing: boolean;
}

async function insertPredictionGameFromDraft(
  draft: DraftResult,
  params: InsertPredictionFromDraftParams
): Promise<string> {
  const predDraft = draft.predictionDraft!;
  const targetCategory = mapDraftCategoryToDb(predDraft.category);
  const { registrationStart, registrationEnd, settlementDate } =
    resolveSmartTimeline(
      predDraft,
      params.defaultClosingHours,
      params.defaultSettlementDelayHours
    );

  const optionLabels =
    predDraft.options && predDraft.options.length >= 2
      ? predDraft.options.map((o) => String(o).trim()).filter(Boolean)
      : ["예 (Yes)", "아니오 (No)"];

  const dbPredictionType = resolveDraftPredictionType(
    predDraft.predictionType,
    optionLabels.length,
    params.allowedTypes
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
  const normalizedRegion = resolveNormalizedRegion({
    regionLevel: predDraft.regionLevel,
    regionCode: predDraft.regionCode,
    regionName: predDraft.regionName,
    title: safeTitle,
    summary: draft.summary,
  });

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
      min_bet_amount: params.minBet,
      max_bet_amount: params.maxBet,
      difficulty,
      settlement_type: hasAutoOracle ? "auto" : "manual",
      data_source: hasAutoOracle ? oracleType : null,
      is_official: hasAutoOracle,
      slug,
      metadata: {
        source: "rss_draft",
        regionLevel: normalizedRegion.regionLevel,
        regionCode: normalizedRegion.regionCode,
        regionName: normalizedRegion.regionName,
      },
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

  // AI 균형 의사결정 브리핑 사전 생성 (autoBriefing=true일 때만, 실패 시 상세 페이지 조회 시 보강)
  if (createdGameId && params.autoBriefing) {
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

  // forum_posts.category_id NOT NULL 제약 대응: 기본 토론 카테고리 조회 후 폴백
  let categoryId = "040567a7-dd38-4826-896b-08da1bfcd25d";
  const { data: catRow } = await supabaseAdmin
    .schema("forum")
    .from("forum_categories")
    .select("id")
    .eq("is_active", true)
    .gte("sort_order", 1)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (catRow?.id) {
    categoryId = String(catRow.id);
  }

  const { error } = await supabaseAdmin
    .schema("forum")
    .from("forum_posts")
    .insert({
      title: draft.title,
      content: `${draft.summary}\n\n${discussionText}`,
      category_id: categoryId,
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
  activeTitles: string[],
  strictness: DuplicateCheckStrictness = "normal"
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
      if (strictness === "strict") {
        if (overlap >= 2 || (overlap >= 1 && overlapRatio >= 0.4)) {
          return activeTitle;
        }
      } else if (strictness === "relaxed") {
        if (overlap >= 4 && overlapRatio >= 0.8) {
          return activeTitle;
        }
      } else {
        if (overlap >= 3 || (overlap >= 2 && overlapRatio >= 0.6)) {
          return activeTitle;
        }
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

  async execute(
    limit?: number,
    options?: CreatePredictionDraftOptions
  ): Promise<Result<DraftResultStats>> {
    const schedConfig = await schedulerConfigService.getSchedulerConfig();
    const effectiveLimit = limit ?? schedConfig.max_drafts_per_run;
    const effectiveCategories = new Set(
      (options?.categoryFilter ?? schedConfig.enabled_categories).map((c) =>
        c.toUpperCase()
      )
    );
    const allowedTypes = options?.allowedTypes ?? schedConfig.enabled_prediction_types;
    const minBet = options?.minBet ?? schedConfig.default_min_bet;
    const maxBet = options?.maxBet ?? schedConfig.default_max_bet;
    const defaultClosingHours =
      options?.closingHours ?? schedConfig.default_closing_hours;
    const defaultSettlementDelayHours =
      options?.settlementDelayHours ?? schedConfig.default_settlement_delay_hours;
    const autoBriefing = options?.autoBriefing ?? schedConfig.auto_briefing_enabled;
    const maxActiveCap = options?.maxActiveCap ?? schedConfig.max_active_games_cap;
    const strictness = options?.strictness ?? schedConfig.duplicate_check_strictness;
    const ignoreCap = options?.ignoreCap ?? false;

    const logs: string[] = [
      `Starting CreatePredictionDraft with limit=${effectiveLimit}, cap=${maxActiveCap}, strictness=${strictness}`,
    ];

    // 현재 ACTIVE 게임 제목 목록 및 상한선 검사
    const { data: activeRows } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("title")
      .eq("status", "ACTIVE");
    const activeTitles = ((activeRows || []) as Array<{ title: string | null }>)
      .map((r) => r.title ?? "")
      .filter(Boolean);

    if (!ignoreCap && activeTitles.length >= maxActiveCap) {
      logs.push(
        `Active games cap reached (현재 ${activeTitles.length}개 / 상한 ${maxActiveCap}개) - 자동 생성을 보류합니다.`
      );
      return success({
        processedCount: 0,
        failedCount: 0,
        draftsCreated: 0,
        skippedByCap: true,
        logs,
      });
    }

    const fetchBatchLimit = Math.max(effectiveLimit * 2, effectiveLimit);
    const itemsResult = await this.feedItemRepository.findItemsByStatus(
      ProcessStatus.CLASSIFIED,
      fetchBatchLimit
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
    let skippedByCategory = 0;

    for (const item of items) {
      if (draftsCreated >= effectiveLimit) break;
      if (!ignoreCap && activeTitles.length >= maxActiveCap) {
        logs.push(
          `Active games cap reached mid-run (${activeTitles.length}/${maxActiveCap})`
        );
        break;
      }

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
        const preDup = findDuplicateActiveTitle(
          item.title,
          activeTitles,
          strictness
        );
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
          item.markAsIgnored(ContentClassification.DISCARD);
          await this.feedItemRepository.update(item);
          logs.push(
            `Draft rejected/failed for ${item.id.toString()}: ${draftResult.error.message}`
          );
          continue;
        }

        const draft = draftResult.data;
        if (item.aiClassification === ContentClassification.PREDICTION) {
          if (draft.predictionDraft) {
            const mappedCategory = mapDraftCategoryToDb(draft.predictionDraft.category);
            if (!effectiveCategories.has(mappedCategory)) {
              skippedByCategory++;
              item.markAsIgnored(ContentClassification.DISCARD);
              await this.feedItemRepository.update(item);
              logs.push(
                `[Skip Category] '${draft.title}' category=${mappedCategory} is disabled in scheduler config`
              );
              continue;
            }
          }

          const postDup = findDuplicateActiveTitle(
            draft.title,
            activeTitles,
            strictness
          );
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
          logs,
          {
            allowedTypes,
            minBet,
            maxBet,
            defaultClosingHours,
            defaultSettlementDelayHours,
            autoBriefing,
          }
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
      skippedByCategory,
      logs,
    });
  }

  private async persistDraftByClassification(
    classification: ContentClassification,
    draft: DraftResult,
    logs: string[],
    insertParams: InsertPredictionFromDraftParams
  ): Promise<boolean> {
    if (
      classification === ContentClassification.PREDICTION &&
      draft.predictionDraft
    ) {
      await insertPredictionGameFromDraft(draft, insertParams);
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
