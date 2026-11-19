import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FORUM_DAILY_MAX_PMP } from "./forum-pmp-policy";

/**
 * KST(Asia/Seoul) 자정 시작 시각을 반환합니다. (Vercel UTC 환경 버그 수정)
 */
export function startOfSeoulOrLocalToday(): Date {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs);
  const startUtcMs =
    Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()) -
    9 * 60 * 60 * 1000;
  return new Date(startUtcMs);
}

/**
 * 오늘(KST 00:00 이후) 사용자가 포럼 활동으로 획득한 총 PMP를 조회합니다.
 */
export async function getForumDailyEarnedPmp(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const todayStart = startOfSeoulOrLocalToday();
  const { data } = await supabase
    .schema("forum")
    .from("forum_activity_logs")
    .select("pmp_earned")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  if (!Array.isArray(data)) return 0;

  return data.reduce((sum, row) => sum + (Number(row?.pmp_earned) || 0), 0);
}

/**
 * 포럼 일일 총 상한(KST 자정 기준 FORUM_DAILY_MAX_PMP)을 advisory lock 원자적 RPC로 검증·지급합니다.
 */
export async function grantForumPmpWithDailyCap(params: {
  supabase: SupabaseClient;
  userId: string;
  activityType: string;
  requestedPmp: number;
  description: string;
  ledgerDescription?: string;
  postId?: string;
  commentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ awardedPmp: number; dailyRemaining: number }> {
  const {
    userId,
    activityType,
    requestedPmp,
    description,
    ledgerDescription,
    postId,
    commentId,
    metadata = {},
  } = params;

  const { data: rpcResult, error: rpcError } = await supabaseAdmin
    .schema("economy")
    .rpc("grant_forum_pmp_capped", {
      p_user_id: userId,
      p_requested_pmp: Math.max(0, Math.floor(requestedPmp)),
      p_daily_cap: FORUM_DAILY_MAX_PMP,
      p_activity_type: activityType,
      p_description: description,
      p_ledger_description: ledgerDescription ?? description,
      p_post_id: postId ?? null,
      p_comment_id: commentId ?? null,
      p_metadata: metadata,
    });

  if (rpcError) {
    console.error("[grantForumPmpWithDailyCap] RPC error:", rpcError.message);
    return { awardedPmp: 0, dailyRemaining: 0 };
  }

  const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
  return {
    awardedPmp: Number(row?.awarded_pmp ?? 0),
    dailyRemaining: Number(row?.daily_remaining ?? 0),
  };
}
