import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

// 신규 가입 환영 보너스 및 개발 보너스 금액 (v3.0: PMC는 예측 성공으로만 획득하므로 초기값 0)
export const WELCOME_BONUS_PMP = 10000;
export const WELCOME_BONUS_PMC = 0;
export const DEV_BONUS_PMP = 10000;
export const DEV_BONUS_PMC = 0;

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

export function buildUserIdentity(user: User) {
  const rawNickname =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.nickname as string | undefined);

  const username =
    (user.user_metadata?.username as string | undefined) ||
    rawNickname ||
    user.email?.split("@")[0] ||
    `user_${user.id.slice(0, 8)}`;

  const displayName =
    rawNickname ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    username;

  const sido = (user.user_metadata?.sido as string | undefined) || "서울특별시";

  return { username, displayName, sido };
}

export async function ensureUserProfile(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  user: User
): Promise<{ onboardingCompleted: boolean; defaultLanding: string }> {
  const { username, displayName, sido } = buildUserIdentity(user);

  const { data: existingProfile } = await adminSupabase
    .schema("user")
    .from("profiles")
    .select("id, onboarding_completed, notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    const rawNotif = (existingProfile.notification_preferences || {}) as Record<string, any>;
    const defaultLanding = rawNotif?.personalization?.defaultLanding || "/dashboard";
    return {
      onboardingCompleted: Boolean(existingProfile.onboarding_completed),
      defaultLanding,
    };
  }

  const { error: profileError } = await adminSupabase
    .schema("user")
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      email_verified: !!user.email_confirmed_at,
      onboarding_completed: false,
      account_status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.warn("ensureUserProfile non-fatal insert error:", profileError);
  }

  // ranking.user_scores에 지역(시·도) 자동 연동
  try {
    await adminSupabase
      .schema("ranking")
      .from("user_scores")
      .upsert(
        {
          user_id: user.id,
          sido,
          job_group: "주권시민",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  } catch {
    // 무시
  }

  return {
    onboardingCompleted: false,
    defaultLanding: "/dashboard",
  };
}

export async function ensureEconomyAccount(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string
) {
  const { data: existingAccount } = await adminSupabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("user_id, pmp_balance, pmc_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingAccount) {
    if (isDevelopment()) {
      const newPmpBalance = Number(existingAccount.pmp_balance || 0) + DEV_BONUS_PMP;
      const newPmcBalance = Number(existingAccount.pmc_balance || 0) + DEV_BONUS_PMC;

      await adminSupabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({
          pmp_balance: newPmpBalance,
          pmc_balance: newPmcBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
    return;
  }

  // 최초 로그인 시 환영 스타터 자산(10,000 PMP, 0 PMC) 지급
  const { error: insertError } = await adminSupabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .insert({
      user_id: userId,
      pmp_balance: isDevelopment() ? DEV_BONUS_PMP : WELCOME_BONUS_PMP,
      pmc_balance: isDevelopment() ? DEV_BONUS_PMC : WELCOME_BONUS_PMC,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    console.warn("ensureEconomyAccount non-fatal insert error:", insertError);
  }
}

