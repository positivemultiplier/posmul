"use server";

import {
  ensurePosmulUserLinked,
  makeUserOwnerKey,
  resolveAuthenticatedUser,
} from "@/lib/auth-provision";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface StudyAuthProfileDTO {
  authenticated: boolean;
  userId: string | null;
  ownerKey: string | null;
  email: string | null;
  displayName: string;
  pmpBalance: number;
  pmcBalance: number;
  examDate: string;
  activeTrack: string;
  totalFocusSeconds: number;
  plannerState: Record<string, unknown>;
}

const DEFAULT_GUEST_PROFILE: StudyAuthProfileDTO = {
  authenticated: false,
  userId: null,
  ownerKey: null,
  email: null,
  displayName: "게스트 수험생",
  pmpBalance: 0,
  pmcBalance: 0,
  examDate: "2026-09-12",
  activeTrack: "app_only_69",
  totalFocusSeconds: 0,
  plannerState: {},
};

/**
 * 현재 로그인한 사용자의 PosMul 통합 프로필 + 경제 잔액 + 수험 학습 상태를 조회
 */
export async function getCurrentStudyAuthProfileAction(): Promise<StudyAuthProfileDTO> {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) return DEFAULT_GUEST_PROFILE;

    await ensurePosmulUserLinked(user);

    const [profileRes, economyRes, studyRes] = await Promise.all([
      supabaseAdmin
        .schema("user")
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance, pmc_balance")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_user_profiles")
        .select("exam_date, active_track, total_focus_seconds, planner_state")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    const displayName =
      profileRes.data?.display_name ||
      (meta.display_name as string | undefined) ||
      (meta.nickname as string | undefined) ||
      user.email?.split("@")[0] ||
      "PosMul 수험생";

    return {
      authenticated: true,
      userId: user.id,
      ownerKey: makeUserOwnerKey(user.id),
      email: user.email ?? null,
      displayName,
      pmpBalance: Number(economyRes.data?.pmp_balance ?? 0),
      pmcBalance: Number(economyRes.data?.pmc_balance ?? 0),
      examDate: String(studyRes.data?.exam_date || "2026-09-12"),
      activeTrack: String(studyRes.data?.active_track || "app_only_69"),
      totalFocusSeconds: Number(studyRes.data?.total_focus_seconds ?? 0),
      plannerState:
        (studyRes.data?.planner_state as Record<string, unknown> | null) ?? {},
    };
  } catch (err) {
    console.warn("[getCurrentStudyAuthProfileAction] fallback:", err);
    return DEFAULT_GUEST_PROFILE;
  }
}

/**
 * 이메일 간편 가입 + PosMul 프로필/경제 계좌 즉시 연동
 */
export async function signUpStudyUserWithPosmulAction(input: {
  email: string;
  password: string;
  nickname: string;
}): Promise<{ success: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const nickname = input.nickname.trim();

  if (!email || !email.includes("@")) {
    return { success: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }
  if (password.length < 6) {
    return { success: false, error: "비밀번호는 6자 이상 입력해 주세요." };
  }
  if (nickname.length < 2) {
    return { success: false, error: "닉네임은 2자 이상 입력해 주세요." };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: nickname,
        nickname,
        username: email.split("@")[0],
        vertical_origin: "housing-pro",
      },
    });

    if (error || !data?.user) {
      const msg = error?.message || "회원가입 중 오류가 발생했습니다.";
      if (/already|exists|registered/i.test(msg)) {
        return {
          success: false,
          error: "이미 PosMul에 가입된 이메일입니다. 로그인 탭에서 바로 로그인해 주세요.",
        };
      }
      return { success: false, error: msg };
    }

    await ensurePosmulUserLinked(data.user);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "회원가입 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 로그인 완료 시 게스트 시절(localStorage clientKey) 학습 기록을 개인 계정으로 안전 병합 이관
 */
export async function claimGuestStudyRecordsAction(guestClientKey: string): Promise<{
  success: boolean;
  migratedQuestions: number;
  migratedOptions: number;
}> {
  try {
    const user = await resolveAuthenticatedUser();
    const cleanGuest = guestClientKey.trim();
    if (!user || !cleanGuest || cleanGuest.startsWith("user:")) {
      return { success: true, migratedQuestions: 0, migratedOptions: 0 };
    }

    const userOwnerKey = makeUserOwnerKey(user.id);
    const nowIso = new Date().toISOString();

    // 1. 문제 풀이 이관 (이미 계정에 풀었던 문항은 덮어쓰지 않음)
    const [{ data: guestQ }, { data: existingQ }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("id, question_id")
        .eq("client_key", cleanGuest),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id")
        .eq("client_key", userOwnerKey),
    ]);

    const existingQIds = new Set((existingQ || []).map((r) => String(r.question_id)));
    const qIdsToClaim = (guestQ || [])
      .filter((r) => !existingQIds.has(String(r.question_id)))
      .map((r) => String(r.id));
    const qIdsToDrop = (guestQ || [])
      .filter((r) => existingQIds.has(String(r.question_id)))
      .map((r) => String(r.id));

    if (qIdsToClaim.length > 0) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .update({ client_key: userOwnerKey, user_id: user.id, updated_at: nowIso })
        .in("id", qIdsToClaim);
    }
    if (qIdsToDrop.length > 0) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .delete()
        .in("id", qIdsToDrop);
    }

    // 2. 선지 마킹/약점 이관
    const [{ data: guestO }, { data: existingO }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("id, option_id")
        .eq("client_key", cleanGuest),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("option_id")
        .eq("client_key", userOwnerKey),
    ]);

    const existingOIds = new Set((existingO || []).map((r) => String(r.option_id)));
    const oIdsToClaim = (guestO || [])
      .filter((r) => !existingOIds.has(String(r.option_id)))
      .map((r) => String(r.id));
    const oIdsToDrop = (guestO || [])
      .filter((r) => existingOIds.has(String(r.option_id)))
      .map((r) => String(r.id));

    if (oIdsToClaim.length > 0) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .update({ client_key: userOwnerKey, user_id: user.id, updated_at: nowIso })
        .in("id", oIdsToClaim);
    }
    if (oIdsToDrop.length > 0) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .delete()
        .in("id", oIdsToDrop);
    }

    return {
      success: true,
      migratedQuestions: qIdsToClaim.length,
      migratedOptions: oIdsToClaim.length,
    };
  } catch (err) {
    console.warn("[claimGuestStudyRecordsAction] error:", err);
    return { success: false, migratedQuestions: 0, migratedOptions: 0 };
  }
}

/**
 * 개인 플래너·목표시험일·누적 집중시간을 DB에 영구 동기화
 */
export async function syncPlannerStateToDbAction(input: {
  examDate?: string;
  activeTrack?: string;
  addedFocusSeconds?: number;
  plannerState?: Record<string, unknown>;
}): Promise<{ success: boolean }> {
  try {
    const user = await resolveAuthenticatedUser();
    if (!user) return { success: false };

    await ensurePosmulUserLinked(user);

    const { data: current } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_user_profiles")
      .select("total_focus_seconds")
      .eq("user_id", user.id)
      .maybeSingle();

    const nextFocusSeconds =
      Number(current?.total_focus_seconds ?? 0) +
      Math.max(0, Math.round(input.addedFocusSeconds ?? 0));

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.examDate) updatePayload.exam_date = input.examDate;
    if (input.activeTrack) updatePayload.active_track = input.activeTrack;
    if (typeof input.addedFocusSeconds === "number" && input.addedFocusSeconds > 0) {
      updatePayload.total_focus_seconds = nextFocusSeconds;
    }
    if (input.plannerState) updatePayload.planner_state = input.plannerState;

    const { error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_user_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function signOutStudyUserAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch {
    return { success: false };
  }
}
