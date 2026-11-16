"use server";

import { ensurePosmulUserLinked, resolveAuthenticatedUser } from "@/lib/auth-provision";
import { supabaseAdmin } from "@/lib/supabase";

export interface ScanRewardResult {
  success: boolean;
  message: string;
  earnedPmp: number;
  newBalance?: number;
  dailyScanCount?: number;
  isSerialVerified?: boolean;
}

export interface OxRewardResult {
  success: boolean;
  message: string;
  earnedPmp: number;
  promotedToMaster: boolean;
  newBalance?: number;
}

export interface AppStudyRewardResult {
  success: boolean;
  authenticated: boolean;
  earnedPmp: number;
  newBalance?: number;
  message: string;
}

const SCAN_REWARD_PMP = 40;
const OX_REWARD_PMP = 10;
const APP_STUDY_REWARD_MAP = {
  OX: 10,
  SOLVE: 5,
  FOCUS: 10,
} as const;
const MAX_DAILY_SCANS = 5;

async function creditUserPosmulPmp(userId: string, amount: number): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data: account } = await supabaseAdmin
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance")
    .eq("user_id", userId)
    .maybeSingle();

  const currentPmp = Number(account?.pmp_balance ?? 0);
  const nextPmp = currentPmp + amount;

  if (account) {
    await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({ pmp_balance: nextPmp, updated_at: nowIso })
      .eq("user_id", userId);
  } else {
    await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .insert({
        user_id: userId,
        pmp_balance: nextPmp,
        pmc_balance: 0,
        created_at: nowIso,
        updated_at: nowIso,
      });
  }

  return nextPmp;
}

/**
 * 교재 없이 앱 내 학습(O/X 정답 · 20제 정답 · 집중 타이머 완료) 시 PosMul 코어 계좌에 실제 PMP 적립
 */
export async function grantAppStudyPmpAction(params: {
  kind: keyof typeof APP_STUDY_REWARD_MAP;
}): Promise<AppStudyRewardResult> {
  try {
    const user = await resolveAuthenticatedUser();
    const reward = APP_STUDY_REWARD_MAP[params.kind];

    if (!user) {
      return {
        success: true,
        authenticated: false,
        earnedPmp: 0,
        message: `로그인하면 PosMul 지갑에 +${reward} PMP가 즉시 적립됩니다.`,
      };
    }

    await ensurePosmulUserLinked(user);
    const newBalance = await creditUserPosmulPmp(user.id, reward);

    return {
      success: true,
      authenticated: true,
      earnedPmp: reward,
      newBalance,
      message: `PosMul 계정 적립 완료 (+${reward} PMP)`,
    };
  } catch (err) {
    return {
      success: false,
      authenticated: false,
      earnedPmp: 0,
      message: err instanceof Error ? err.message : "PMP 적립 처리 중 오류 발생",
    };
  }
}

/**
 * 📸 종이책 AI 비전 스캔 완료 시 마찰 보상 PMP 지급 (선택 기능)
 */
export async function recordAiScanAndRewardPmp(params: {
  userId?: string;
  bookCode: string;
  pageNumber: number;
  detectedMarkings: Array<{ question: number; option: number; mark: "STAR" | "X" }>;
}): Promise<ScanRewardResult> {
  const { bookCode, pageNumber, detectedMarkings } = params;

  try {
    const sessionUser = await resolveAuthenticatedUser();
    const effectiveUserId = sessionUser?.id || params.userId;

    if (!effectiveUserId) {
      return {
        success: true,
        message: "스캔 분석 완료! 로그인 시 학습 이력과 PMP가 PosMul 계정에 영구 저장됩니다.",
        earnedPmp: 0,
        isSerialVerified: false,
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: userSerial } = await supabaseAdmin
      .schema("vertical_housing")
      .from("book_serials")
      .select("id, status")
      .eq("registered_user_id", effectiveUserId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    const isSerialVerified = Boolean(userSerial);

    const { data: existingScan } = await supabaseAdmin
      .schema("vertical_housing")
      .from("ai_scan_logs")
      .select("id")
      .eq("user_id", effectiveUserId)
      .eq("book_code", bookCode)
      .eq("page_number", pageNumber)
      .eq("scanned_date", today)
      .maybeSingle();

    if (existingScan) {
      return {
        success: false,
        message: "이미 오늘 스캔 완료된 페이지입니다. (1일 1회 한정)",
        earnedPmp: 0,
        isSerialVerified,
      };
    }

    const { count: dailyScanCount } = await supabaseAdmin
      .schema("vertical_housing")
      .from("ai_scan_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", effectiveUserId)
      .eq("scanned_date", today);

    if ((dailyScanCount || 0) >= MAX_DAILY_SCANS) {
      return {
        success: false,
        message: `일일 스캔 보상 상한(${MAX_DAILY_SCANS}회)에 도달했습니다.`,
        earnedPmp: 0,
        dailyScanCount: dailyScanCount || 0,
        isSerialVerified,
      };
    }

    const effectiveRewardPmp = sessionUser ? SCAN_REWARD_PMP : 0;
    const newPmp = effectiveRewardPmp > 0 ? await creditUserPosmulPmp(effectiveUserId, effectiveRewardPmp) : 0;

    await supabaseAdmin
      .schema("vertical_housing")
      .from("ai_scan_logs")
      .insert({
        user_id: effectiveUserId,
        serial_id: userSerial?.id || null,
        book_code: bookCode,
        page_number: pageNumber,
        detected_markings: detectedMarkings,
        confidence_score: 98.5,
        reward_pmp: effectiveRewardPmp,
        scanned_date: today,
      });

    return {
      success: true,
      message:
        effectiveRewardPmp > 0
          ? `AI 스캔 완료! PosMul 계정에 +${SCAN_REWARD_PMP} PMP가 지급되었습니다.`
          : "AI 스캔 완료! 로그인 시 +40 PMP가 실제 지급됩니다.",
      earnedPmp: effectiveRewardPmp,
      newBalance: effectiveRewardPmp > 0 ? newPmp : undefined,
      dailyScanCount: (dailyScanCount || 0) + 1,
      isSerialVerified,
    };
  } catch (err: unknown) {
    console.error("[recordAiScanAndRewardPmp Error]:", err);
    return {
      success: false,
      message: "스캔 기록 처리 중 일시적인 오류가 발생했습니다.",
      earnedPmp: 0,
    };
  }
}

/**
 * 💡 3초 컷 1줄 O/X 복습 정답 처리 및 3회 연속 달성 시 PMP 체화 보상
 */
export async function recordOxMasteryAndRewardPmp(params: {
  userId?: string;
  optionId: string;
  isCorrectAnswer: boolean;
  currentStreak: number;
}): Promise<OxRewardResult> {
  const { isCorrectAnswer, currentStreak } = params;

  if (!isCorrectAnswer) {
    return {
      success: true,
      message: "오답 처리되었습니다. 연속 정답 카운트가 초기화됩니다.",
      earnedPmp: 0,
      promotedToMaster: false,
    };
  }

  const nextStreak = currentStreak + 1;
  const isPromoted = nextStreak >= 3;
  const rewardPmp = isPromoted ? OX_REWARD_PMP : 0;

  try {
    const sessionUser = await resolveAuthenticatedUser();
    const effectiveUserId = sessionUser?.id || params.userId;

    let newBalance: number | undefined;
    if (isPromoted && effectiveUserId && sessionUser) {
      newBalance = await creditUserPosmulPmp(effectiveUserId, rewardPmp);
    }

    return {
      success: true,
      message: isPromoted
        ? effectiveUserId && sessionUser
          ? `축하합니다! 3회 연속 정답 달성 (+${rewardPmp} PMP 적립)`
          : "축하합니다! 3회 연속 정답 달성 (로그인 시 PMP 실지급)"
        : `정답입니다! (연속 정답 ${nextStreak}/3회)`,
      earnedPmp: effectiveUserId && sessionUser ? rewardPmp : 0,
      promotedToMaster: isPromoted,
      newBalance,
    };
  } catch {
    return {
      success: true,
      message: isPromoted ? "3회 연속 정답 달성!" : `정답입니다! (${nextStreak}/3회)`,
      earnedPmp: 0,
      promotedToMaster: isPromoted,
    };
  }
}
