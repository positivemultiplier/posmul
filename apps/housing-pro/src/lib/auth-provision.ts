import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase";
import { createServerSupabaseClient } from "./supabase/server";

const WELCOME_BONUS_PMP = 10000;

export function makeUserOwnerKey(userId: string): string {
  return `user:${userId}`;
}

export async function resolveAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function resolveOwnerKeyAndUser(
  fallbackClientKey?: string | null
): Promise<{ user: User | null; ownerKey: string }> {
  const user = await resolveAuthenticatedUser();
  if (user) {
    return { user, ownerKey: makeUserOwnerKey(user.id) };
  }
  const cleanKey = (fallbackClientKey || "").trim();
  return { user: null, ownerKey: cleanKey || "demo-housing-guest" };
}

/**
 * PosMul 플랫폼 코어(user.profiles + economy.pmp_pmc_accounts) 및
 * Housing-Pro 개인 학습 프로필(vertical_housing.study_user_profiles) 자동 초기화 보장
 */
export async function ensurePosmulUserLinked(user: User): Promise<void> {
  const nowIso = new Date().toISOString();
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const nickname =
    (meta.display_name as string | undefined) ||
    (meta.nickname as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email?.split("@")[0] ||
    `수험생_${user.id.slice(0, 6)}`;

  const username =
    (meta.username as string | undefined) ||
    (meta.nickname as string | undefined) ||
    user.email?.split("@")[0] ||
    `user_${user.id.slice(0, 8)}`;

  // 1. user.profiles 보장
  const { data: existingProfile } = await supabaseAdmin
    .schema("user")
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabaseAdmin
      .schema("user")
      .from("profiles")
      .insert({
        id: user.id,
        username,
        display_name: nickname,
        email_verified: Boolean(user.email_confirmed_at),
        onboarding_completed: true,
        account_status: "active",
        created_at: nowIso,
        updated_at: nowIso,
      });
  }

  // 2. economy.pmp_pmc_accounts 보장 (PosMul 코어 경제 계좌 연동)
  const { data: existingAcc } = await supabaseAdmin
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingAcc) {
    await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .insert({
        user_id: user.id,
        pmp_balance: WELCOME_BONUS_PMP,
        pmc_balance: 0,
        created_at: nowIso,
        updated_at: nowIso,
      });
  }

  // 3. vertical_housing.study_user_profiles 보장
  const { data: existingStudy } = await supabaseAdmin
    .schema("vertical_housing")
    .from("study_user_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingStudy) {
    await supabaseAdmin
      .schema("vertical_housing")
      .from("study_user_profiles")
      .insert({
        user_id: user.id,
        exam_date: "2026-09-12",
        active_track: "app_only_69",
        total_focus_seconds: 0,
        planner_state: {},
        created_at: nowIso,
        updated_at: nowIso,
      });
  }
}
