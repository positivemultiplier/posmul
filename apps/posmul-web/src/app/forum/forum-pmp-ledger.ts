import type { SupabaseClient } from "@supabase/supabase-js";
import { FORUM_DAILY_MAX_PMP } from "./forum-pmp-policy";

export function startOfSeoulOrLocalToday(): Date {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart;
}

/**
 * 오늘(00:00 이후) 사용자가 포럼 활동으로 획득한 총 PMP를 조회합니다.
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

async function creditPmpAccountAndLedger(params: {
  supabase: SupabaseClient;
  userId: string;
  pmpAmount: number;
  description: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { supabase, userId, pmpAmount, description, metadata } = params;
  if (pmpAmount <= 0) return;

  const { data: account } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (account) {
    const currentBalance = Number(account.pmp_balance) || 0;
    await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({
        pmp_balance: currentBalance + pmpAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .insert({
        user_id: userId,
        pmp_balance: pmpAmount,
        pmc_balance: 0,
        updated_at: new Date().toISOString(),
      });
  }

  await supabase.schema("economy").from("pmp_pmc_transactions").insert({
    user_id: userId,
    transaction_type: "PMP_EARN",
    pmp_amount: pmpAmount,
    description,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

/**
 * 포럼 일일 총 상한(FORUM_DAILY_MAX_PMP)을 초과하지 않는 범위에서 PMP를 지급하고 로그를 기록합니다.
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
    supabase,
    userId,
    activityType,
    requestedPmp,
    description,
    ledgerDescription,
    postId,
    commentId,
    metadata = {},
  } = params;

  const todayEarned = await getForumDailyEarnedPmp(supabase, userId);
  const remainingBefore = Math.max(0, FORUM_DAILY_MAX_PMP - todayEarned);
  const awardedPmp = Math.max(0, Math.min(requestedPmp, remainingBefore));

  await supabase.schema("forum").from("forum_activity_logs").insert({
    user_id: userId,
    activity_type: activityType,
    post_id: postId ?? null,
    comment_id: commentId ?? null,
    description,
    pmp_earned: awardedPmp,
    metadata,
  });

  if (awardedPmp > 0) {
    await creditPmpAccountAndLedger({
      supabase,
      userId,
      pmpAmount: awardedPmp,
      description: ledgerDescription ?? description,
      metadata: {
        source: "forum",
        activity_type: activityType,
        post_id: postId,
        comment_id: commentId,
        ...metadata,
      },
    });
  }

  return {
    awardedPmp,
    dailyRemaining: Math.max(0, remainingBefore - awardedPmp),
  };
}

