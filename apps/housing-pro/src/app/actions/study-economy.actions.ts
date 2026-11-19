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
const VERTICAL_DAILY_MAX_PMP = 300;

function getKstDayStartIso(): string {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs);
  const startKstUtcMs =
    Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()) -
    9 * 60 * 60 * 1000;
  return new Date(startKstUtcMs).toISOString();
}

async function getTodayVerticalEarnedPmp(userId: string): Promise<number> {
  const dayStartIso = getKstDayStartIso();
  const { data } = await supabaseAdmin
    .schema("economy")
    .from("pmp_pmc_transactions")
    .select("pmp_amount")
    .eq("user_id", userId)
    .in("transaction_type", ["VERTICAL_HOUSING_STUDY", "VERTICAL_HOUSING_SCAN"])
    .gte("created_at", dayStartIso);

  return (data || []).reduce((sum, row) => sum + Math.max(0, Number(row.pmp_amount ?? 0)), 0);
}

async function creditUserPosmulPmp(
  userId: string,
  amount: number,
  transactionType: "VERTICAL_HOUSING_STUDY" | "VERTICAL_HOUSING_SCAN" = "VERTICAL_HOUSING_STUDY",
  description = "Housing-Pro 학습 PMP 적립"
): Promise<{ granted: number; newBalance: number; dailyRemaining: number }> {
  const earnedToday = await getTodayVerticalEarnedPmp(userId);
  const remaining = Math.max(0, VERTICAL_DAILY_MAX_PMP - earnedToday);
  const granted = Math.min(amount, remaining);

  if (granted <= 0) {
    const { data: account } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      granted: 0,
      newBalance: Number(account?.pmp_balance ?? 0),
      dailyRemaining: 0,
    };
  }

  // ACID 보장 원자적 원장 RPC로 PMP 가산 + economy.pmp_pmc_transactions 기록 동시 수행
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
    "execute_ledger_transaction",
    {
      p_user_id: userId,
      p_transaction_type: transactionType,
      p_pmp_change: granted,
      p_pmc_change: 0,
      p_description: description,
      p_metadata: {
        source: "housing-pro",
        daily_cap: VERTICAL_DAILY_MAX_PMP,
        earned_before: earnedToday,
      },
    }
  );

  if (rpcError) {
    throw new Error(`원장 적립 실패: ${rpcError.message}`);
  }

  const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
  return {
    granted,
    newBalance: Number(row?.new_pmp_balance ?? 0),
    dailyRemaining: Math.max(0, remaining - granted),
  };
}

/**
 * 교재 없이 앱 내 학습(O/X 정답 · 20제 정답 · 집중 타이머 완료) 시 PosMul 코어 계좌에 실제 PMP 적립
 * (v3.0 헌법: 버티컬 일일 최대 300 PMP Hard Cap + 원장 기록 강제)
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
    const { granted, newBalance, dailyRemaining } = await creditUserPosmulPmp(
      user.id,
      reward,
      "VERTICAL_HOUSING_STUDY",
      `Housing-Pro 앱 학습 보상 (${params.kind})`
    );

    if (granted <= 0) {
      return {
        success: true,
        authenticated: true,
        earnedPmp: 0,
        newBalance,
        message: `오늘의 Housing-Pro 학습 PMP 일일 한도(${VERTICAL_DAILY_MAX_PMP} PMP)에 도달했습니다.`,
      };
    }

    return {
      success: true,
      authenticated: true,
      earnedPmp: granted,
      newBalance,
      message: `PosMul 계정 적립 완료 (+${granted} PMP · 오늘 잔여 ${dailyRemaining} PMP)`,
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
    const effectiveUserId = sessionUser?.id;

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

    const requestedRewardPmp = sessionUser ? SCAN_REWARD_PMP : 0;
    const creditResult =
      requestedRewardPmp > 0
        ? await creditUserPosmulPmp(
            effectiveUserId,
            requestedRewardPmp,
            "VERTICAL_HOUSING_SCAN",
            `Housing-Pro AI 스캔 마찰 보상 (${bookCode} p.${pageNumber})`
          )
        : { granted: 0, newBalance: 0, dailyRemaining: 0 };

    const effectiveRewardPmp = creditResult.granted;
    const newPmp = creditResult.newBalance;

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
          ? `AI 스캔 완료! PosMul 계정에 +${effectiveRewardPmp} PMP가 지급되었습니다. (오늘 잔여 ${creditResult.dailyRemaining} PMP)`
          : sessionUser
            ? `AI 스캔 완료! 오늘의 일일 PMP 상한(${VERTICAL_DAILY_MAX_PMP} PMP)에 도달했습니다.`
            : "AI 스캔 완료! 로그인 시 +40 PMP가 실제 지급됩니다.",
      earnedPmp: effectiveRewardPmp,
      newBalance: sessionUser ? newPmp : undefined,
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
    const effectiveUserId = sessionUser?.id;

    let newBalance: number | undefined;
    let grantedPmp = 0;
    if (isPromoted && effectiveUserId && sessionUser) {
      const creditResult = await creditUserPosmulPmp(
        effectiveUserId,
        rewardPmp,
        "VERTICAL_HOUSING_STUDY",
        "Housing-Pro O/X 3회 연속 정복 보상"
      );
      grantedPmp = creditResult.granted;
      newBalance = creditResult.newBalance;
    }

    return {
      success: true,
      message: isPromoted
        ? effectiveUserId && sessionUser
          ? grantedPmp > 0
            ? `축하합니다! 3회 연속 정답 달성 (+${grantedPmp} PMP 적립)`
            : `축하합니다! 3회 연속 정답 달성 (일일 상한 ${VERTICAL_DAILY_MAX_PMP} PMP 도달)`
          : "축하합니다! 3회 연속 정답 달성 (로그인 시 PMP 실지급)"
        : `정답입니다! (연속 정답 ${nextStreak}/3회)`,
      earnedPmp: grantedPmp,
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
