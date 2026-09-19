"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface FeedItemDTO {
    id: string;
    source_id: string | null;
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
}

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 피드 및 의안 통계 조회
 */
export async function getFeedStats(): Promise<FeedStatsDTO> {
    try {
        const [itemsRes, billsRes, publishedRes] = await Promise.all([
            supabaseAdmin.schema("feed").from("items").select("ai_classification, process_status", { count: "exact" }),
            supabaseAdmin.schema("feed").from("bills").select("bill_id", { count: "exact", head: true }),
            supabaseAdmin.schema("feed").from("items").select("id", { count: "exact", head: true }).eq("process_status", "PUBLISHED"),
        ]);

        const items = itemsRes.data || [];
        const totalItems = itemsRes.count ?? items.length;
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
        };
    } catch (e) {
        console.error("getFeedStats error:", e);
        return {
            totalItems: 0,
            predictionCandidates: 0,
            publishedGames: 0,
            totalBills: 0,
        };
    }
}

/**
 * 피드 아이템 목록 조회
 */
export async function getFeedItems(filter?: {
    classification?: string;
    status?: string;
    limit?: number;
}): Promise<FeedItemDTO[]> {
    try {
        let query = supabaseAdmin
            .schema("feed")
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        if (filter?.classification) {
            query = query.eq("ai_classification", filter.classification);
        }
        if (filter?.status) {
            query = query.eq("process_status", filter.status);
        }
        if (filter?.limit) {
            query = query.limit(filter.limit);
        } else {
            query = query.limit(50);
        }

        const { data, error } = await query;
        if (error) {
            console.error("getFeedItems error:", error);
            return [];
        }

        return (data || []) as FeedItemDTO[];
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

        const options = input.options && input.options.length > 0 ? input.options : [
            { id: "yes", label: "찬성 / 실현된다" },
            { id: "no", label: "반대 / 실현되지 않는다" }
        ];

        // Slug 생성 (한글/특수문자 대응)
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
            status: "ACTIVE", // 정식 게임 활성화
            is_official: true,
            slug: safeSlug,
            data_source: input.sourceUrl || "대한민국 정책브리핑 / 열린국회정보",
            metadata: {
                feed_item_id: input.feedItemId,
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
