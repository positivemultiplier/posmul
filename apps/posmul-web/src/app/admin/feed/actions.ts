"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  getFetchRssItemsUseCase,
  getFinancialMarketCollector,
  getBoxOfficeCollector,
  getFetchBillsUseCase,
  getGeminiClassifierAdapter,
} from "@/bounded-contexts/feed/di-container";
import { ContentClassification } from "@/bounded-contexts/feed/domain/value-objects/feed-types";

export interface FeedItemDTO {
  id: string;
  source_id: string | null;
  source_category?: string;
  source_title?: string;
  title: string;
  link: string;
  content_summary: string | null;
  published_at: string | null;
  ai_classification: "PREDICTION" | "FORUM" | "UNCLASSIFIED" | "DISCARD" | null;
  process_status: "PENDING" | "CLASSIFIED" | "DRAFT_CREATED" | "PUBLISHED" | "IGNORED" | "ERROR";
  processed_at: string | null;
  created_at: string;
}

export interface BillDTO {
  bill_id: string;
  bill_no: string;
  bill_name: string;
  proposer: string | null;
  committee: string | null;
  proc_result: string | null;
  rgs_conf_rslt: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface FeedStatsDTO {
  totalItems: number;
  predictionCandidates: number;
  publishedGames: number;
  totalBills: number;
  categoryCounts: Record<string, number>;
}

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 피드 및 의안 통계 조회
 */
export async function getFeedStats(): Promise<FeedStatsDTO> {
  try {
    const [itemsRes, billsRes, publishedRes, sourcesRes] = await Promise.all([
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("id, source_id, ai_classification, process_status"),
      supabaseAdmin.schema("feed").from("bills").select("bill_id", { count: "exact", head: true }),
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("process_status", "PUBLISHED"),
      supabaseAdmin.schema("feed").from("rss_sources").select("id, category"),
    ]);

    const items = itemsRes.data || [];
    const sourceCategoryMap = new Map<string, string>();
    (sourcesRes.data || []).forEach((s) => {
      sourceCategoryMap.set(s.id, s.category || "POLICY");
    });

    const categoryCounts: Record<string, number> = {
      ALL: items.length,
      SPORTS: 0,
      ECONOMY: 0,
      ENTERTAINMENT: 0,
      POLICY: 0,
    };

    items.forEach((item) => {
      const cat = (item.source_id && sourceCategoryMap.get(item.source_id)) || "POLICY";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const totalItems = items.length;
    const predictionCandidates = items.filter(
      (i) => i.ai_classification === "PREDICTION" && i.process_status !== "PUBLISHED" && i.process_status !== "IGNORED"
    ).length;
    const publishedGames = publishedRes.count ?? 0;
    const totalBills = billsRes.count ?? 0;

    return {
      totalItems,
      predictionCandidates,
      publishedGames,
      totalBills,
      categoryCounts,
    };
  } catch (e) {
    console.error("getFeedStats error:", e);
    return {
      totalItems: 0,
      predictionCandidates: 0,
      publishedGames: 0,
      totalBills: 0,
      categoryCounts: { ALL: 0, SPORTS: 0, ECONOMY: 0, ENTERTAINMENT: 0, POLICY: 0 },
    };
  }
}

/**
 * 피드 아이템 목록 조회 (카테고리 필터 지원)
 */
export async function getFeedItems(filter?: {
  category?: string;
  classification?: string;
  status?: string;
  limit?: number;
}): Promise<FeedItemDTO[]> {
  try {
    const [itemsRes, sourcesRes] = await Promise.all([
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filter?.limit || 60),
      supabaseAdmin.schema("feed").from("rss_sources").select("id, title, category"),
    ]);

    if (itemsRes.error) {
      console.error("getFeedItems error:", itemsRes.error);
      return [];
    }

    const sourceMap = new Map<string, { title: string; category: string }>();
    (sourcesRes.data || []).forEach((s) => {
      sourceMap.set(s.id, { title: s.title, category: s.category || "POLICY" });
    });

    let items = (itemsRes.data || []).map((item) => {
      const source = item.source_id ? sourceMap.get(item.source_id) : undefined;
      return {
        ...item,
        source_category: source?.category || "POLICY",
        source_title: source?.title || "외부 피드",
      } as FeedItemDTO;
    });

    // 카테고리 필터링
    if (filter?.category && filter.category !== "ALL") {
      items = items.filter((i) => i.source_category?.toUpperCase() === filter.category!.toUpperCase());
    }

    // 분류 필터링
    if (filter?.classification) {
      items = items.filter((i) => i.ai_classification === filter.classification);
    }

    // 상태 필터링
    if (filter?.status) {
      items = items.filter((i) => i.process_status === filter.status);
    }

    return items;
  } catch (e) {
    console.error("getFeedItems exception:", e);
    return [];
  }
}

/**
 * 국회 의안 목록 조회
 */
export async function getBills(limit: number = 30): Promise<BillDTO[]> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("feed")
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getBills error:", error);
      return [];
    }

    return (data || []) as BillDTO[];
  } catch (e) {
    console.error("getBills exception:", e);
    return [];
  }
}

export interface PublishGameInput {
  feedItemId?: string;
  billId?: string;
  billNo?: string;
  title: string;
  description: string;
  category?: string;
  options?: Array<{ id: string; label: string }>;
  durationDays?: number;
  minBetAmount?: number;
  maxBetAmount?: number;
  sourceUrl?: string;
}

/**
 * Draft를 정식 예측 게임으로 발행 (Publish)
 */
export async function publishToPredictionGame(input: PublishGameInput): Promise<{ success: boolean; gameId?: string; error?: string }> {
  try {
    const duration = input.durationDays ?? 7;
    const now = new Date();
    const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    const settlementDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);

    const options =
      input.options && input.options.length > 0
        ? input.options
        : [
            { id: "yes", label: "찬성 / 실현된다" },
            { id: "no", label: "반대 / 실현되지 않는다" },
          ];

    const safeSlug = `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const gameRecord = {
      creator_id: SYSTEM_USER_ID,
      title: input.title,
      description: input.description,
      category: (input.category || "POLITICS").toUpperCase(),
      prediction_type: "BINARY",
      game_options: { options },
      difficulty: 1.0,
      min_bet_amount: input.minBetAmount ?? 100,
      max_bet_amount: input.maxBetAmount ?? 10000,
      registration_start: now.toISOString(),
      registration_end: endDate.toISOString(),
      settlement_date: settlementDate.toISOString(),
      status: "ACTIVE",
      is_official: true,
      slug: safeSlug,
      external_id: input.billId || null,
      data_source: input.sourceUrl || "외부 피드 / 공공데이터",
      metadata: {
        feed_item_id: input.feedItemId,
        bill_id: input.billId,
        bill_no: input.billNo,
        published_via: "ADMIN_AI_PIPELINE",
      },
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .insert(gameRecord as any)
      .select("game_id")
      .single();

    if (insertError) {
      console.error("Error inserting prediction game:", insertError);
      return { success: false, error: insertError.message };
    }

    // feed.items 상태를 PUBLISHED로 업데이트
    if (input.feedItemId) {
      await supabaseAdmin
        .schema("feed")
        .from("items")
        .update({
          process_status: "PUBLISHED",
          processed_at: new Date().toISOString(),
        })
        .eq("id", input.feedItemId);
    }

    revalidatePath("/admin/feed");
    revalidatePath("/prediction");
    revalidatePath("/prediction/politics");
    revalidatePath("/prediction/economy");
    revalidatePath("/prediction/sports");
    revalidatePath("/prediction/entertainment");

    return { success: true, gameId: inserted?.game_id };
  } catch (e: any) {
    console.error("publishToPredictionGame exception:", e);
    return { success: false, error: e?.message || "알 수 없는 오류가 발생했습니다." };
  }
}

/**
 * 피드 아이템 제외/보관 처리 (IGNORED)
 */
export async function ignoreFeedItem(feedItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .update({
        process_status: "IGNORED",
        processed_at: new Date().toISOString(),
      })
      .eq("id", feedItemId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/feed");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * 카테고리별 RSS 수집 실행 액션
 */
export async function fetchFeedsByCategoryAction(category?: string): Promise<{ success: boolean; message: string }> {
  try {
    const useCase = getFetchRssItemsUseCase();
    const result = await useCase.execute({ category });

    revalidatePath("/admin/feed");

    if (result.success === false) {
      return { success: false, message: result.error.message };
    }

    const { fetchedCount, sourceCount } = result.data;
    return {
      success: true,
      message: `${sourceCount}개 소스에서 신규 기사 ${fetchedCount}건을 성공적으로 수집했습니다.`,
    };
  } catch (e: any) {
    console.error("fetchFeedsByCategoryAction exception:", e);
    return { success: false, message: e?.message || "수집 중 오류 발생" };
  }
}

/**
 * 실시간 환율 및 비트코인/코스피 경제 지표 수집 액션
 */
export async function fetchMarketIndicatorsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const collector = getFinancialMarketCollector();
    const result = await collector.collect();

    revalidatePath("/admin/feed");

    if (result.success === false) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      message: `실시간 환율 및 비트코인 등 금융 경제 예측 피드 ${result.data.length}건이 수집되었습니다.`,
    };
  } catch (e: any) {
    console.error("fetchMarketIndicatorsAction exception:", e);
    return { success: false, message: e?.message || "시장 지표 수집 중 오류 발생" };
  }
}

/**
 * 박스오피스 및 대중문화/시청률 수집 액션
 */
export async function fetchBoxOfficeAction(): Promise<{ success: boolean; message: string }> {
  try {
    const collector = getBoxOfficeCollector();
    const result = await collector.collect();

    revalidatePath("/admin/feed");

    if (result.success === false) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      message: `영화 박스오피스 및 대중문화/시청률 예측 피드 ${result.data.length}건이 수집되었습니다.`,
    };
  } catch (e: any) {
    console.error("fetchBoxOfficeAction exception:", e);
    return { success: false, message: e?.message || "박스오피스 수집 중 오류 발생" };
  }
}

/**
 * 국회 의안 신규 수집 액션
 */
export async function fetchBillsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const useCase = getFetchBillsUseCase();
    const result = await useCase.execute();

    revalidatePath("/admin/feed");

    if (result.success === false) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      message: "국회 의안 수집 및 모니터링이 완료되었습니다.",
    };
  } catch (e: any) {
    console.error("fetchBillsAction exception:", e);
    return { success: false, message: e?.message || "의안 수집 중 오류 발생" };
  }
}

/**
 * 전체 다채널 통합 원클릭 수집 액션
 */
export async function fetchAllFeedsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const [rssRes, marketRes, movieRes] = await Promise.allSettled([
      fetchFeedsByCategoryAction("ALL"),
      fetchMarketIndicatorsAction(),
      fetchBoxOfficeAction(),
    ]);

    revalidatePath("/admin/feed");
    return {
      success: true,
      message: "스포츠, 경제, 엔터, 뉴스 및 시장 지표 전체 통합 수집이 완료되었습니다.",
    };
  } catch (e: any) {
    console.error("fetchAllFeedsAction exception:", e);
    return { success: false, message: e?.message || "통합 수집 중 오류 발생" };
  }
}

/**
 * 도메인 특화 Gemini AI 초안 생성 액션
 */
export async function generateAiDraftForFeedItemAction(
  feedItemId: string
): Promise<{
  success: boolean;
  draft?: {
    title: string;
    summary: string;
    options: string[];
    resolutionCriteria: string;
  };
  error?: string;
}> {
  try {
    const { data: item, error } = await supabaseAdmin
      .schema("feed")
      .from("items")
      .select("*")
      .eq("id", feedItemId)
      .single();

    if (error || !item) {
      return { success: false, error: "피드 아이템을 찾을 수 없습니다." };
    }

    const classifier = getGeminiClassifierAdapter();
    const contentToAnalyze = `${item.title}\n\n${item.content_summary || ""}`;
    const draftRes = await classifier.generateDraft(contentToAnalyze, ContentClassification.PREDICTION);

    if (draftRes.success === false) {
      return { success: false, error: draftRes.error.message };
    }

    const predictionDraft = draftRes.data.predictionDraft;
    return {
      success: true,
      draft: {
        title: draftRes.data.title || item.title,
        summary: draftRes.data.summary || item.content_summary || "",
        options: predictionDraft?.options || ["찬성 / 승리 / 달성", "반대 / 패배 / 미달"],
        resolutionCriteria: predictionDraft?.resolutionCriteria || "공식 결과 발표 기준 판정",
      },
    };
  } catch (e: any) {
    console.error("generateAiDraftForFeedItemAction exception:", e);
    return { success: false, error: e?.message || "AI 초안 생성 오류" };
  }
}

/**
 * 국회 의안 처리 결과 기반 자동 정산 실행 액션
 */
export async function autoSettleBillsAction() {
  try {
    const { getAutoSettleByBillUseCase } = await import(
      "@/bounded-contexts/prediction/di-container"
    );
    const useCase = getAutoSettleByBillUseCase();
    const result = await useCase.execute();

    revalidatePath("/admin/feed");
    revalidatePath("/prediction", "layout");

    if (result.success === false) {
      return {
        success: false,
        error: (result as any).error?.message || "정산 실패",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (e: any) {
    console.error("autoSettleBillsAction exception:", e);
    return {
      success: false,
      error: e?.message || "자동 정산 실행 중 오류가 발생했습니다.",
    };
  }
}
