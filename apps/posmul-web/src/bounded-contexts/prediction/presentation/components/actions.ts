"use server";

/**
 * MyPredictions 컴포넌트를 위한 Server Actions
 * 
 * 클라이언트 fetch 대신 Server Action 사용으로 인증 문제 해결
 */

import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/supabase/server";

interface WithdrawResult {
  success: boolean;
  message?: string;
  error?: string;
  refundedAmount?: number;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * 예측 철회 검증 헬퍼
 */
async function validatePredictionWithdrawal(
  supabase: SupabaseClient,
  predictionId: string,
  userId: string
): Promise<{ valid: true; prediction: { game_id: string; bet_amount: number } } | { valid: false; error: string }> {
  const { data: predictionData, error: predError } = await supabase
    .schema("prediction")
    .from("predictions")
    .select("prediction_id, user_id, game_id, bet_amount, is_active")
    .eq("prediction_id", predictionId)
    .single();

  // 방어적 처리: 스키마 접근 시 배열로 반환될 수 있음
  const prediction = Array.isArray(predictionData) ? predictionData[0] : predictionData;

  if (predError || !prediction) {
    return { valid: false, error: "예측을 찾을 수 없습니다." };
  }

  if (prediction.user_id !== userId) {
    return { valid: false, error: "본인의 예측만 철회할 수 있습니다." };
  }

  if (!prediction.is_active) {
    return { valid: false, error: "이미 철회된 예측입니다." };
  }

  const { data: gameData, error: gameError } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("status")
    .eq("game_id", prediction.game_id)
    .single();

  // 방어적 처리: 스키마 접근 시 배열로 반환될 수 있음
  const game = Array.isArray(gameData) ? gameData[0] : gameData;

  if (gameError || !game || game.status !== "ACTIVE") {
    return { valid: false, error: "진행 중인 게임의 예측만 철회할 수 있습니다." };
  }

  return { valid: true, prediction: { game_id: prediction.game_id, bet_amount: prediction.bet_amount } };
}

/**
 * PMP 환불 처리 헬퍼
 */
async function processWithdrawalRefund(
  supabase: SupabaseClient,
  predictionId: string,
  userId: string,
  gameId: string,
  refundAmount: number
): Promise<{ success: true } | { success: false; error: string }> {
  // 예측 비활성화
  const { error: updateError } = await supabase
    .schema("prediction")
    .from("predictions")
    .update({ is_active: false })
    .eq("prediction_id", predictionId);

  if (updateError) {
    return { success: false, error: "철회 처리에 실패했습니다." };
  }

  // PMP 환불
  if (refundAmount > 0) {
    const { data: accountData } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance")
      .eq("user_id", userId)
      .single();

    // 방어적 처리: 스키마 접근 시 배열로 반환될 수 있음
    const account = Array.isArray(accountData) ? accountData[0] : accountData;
    const newBalance = Number(account?.pmp_balance ?? 0) + refundAmount;

    const { error: refundError } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({ pmp_balance: newBalance })
      .eq("user_id", userId);

    if (refundError) {
      // 롤백
      await supabase
        .schema("prediction")
        .from("predictions")
        .update({ is_active: true })
        .eq("prediction_id", predictionId);
      return { success: false, error: "환불 처리에 실패했습니다." };
    }
  }

  // 게임 통계 업데이트
  const { data: gameStatsData } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("current_participants, total_pool")
    .eq("game_id", gameId)
    .single();

  // 방어적 처리: 스키마 접근 시 배열로 반환될 수 있음
  const gameStats = Array.isArray(gameStatsData) ? gameStatsData[0] : gameStatsData;

  if (gameStats) {
    await supabase
      .schema("prediction")
      .from("prediction_games")
      .update({
        current_participants: Math.max(0, (gameStats.current_participants ?? 1) - 1),
        total_pool: Math.max(0, (gameStats.total_pool ?? refundAmount) - refundAmount),
      })
      .eq("game_id", gameId);
  }

  return { success: true };
}

/**
 * 예측 철회 Server Action
 */
export async function withdrawPrediction(predictionId: string): Promise<WithdrawResult> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const validation = await validatePredictionWithdrawal(supabase, predictionId, user.id);
    if (validation.valid === false) {
      return { success: false, error: validation.error };
    }

    const refundAmount = Number(validation.prediction.bet_amount);
    const result = await processWithdrawalRefund(
      supabase, predictionId, user.id, validation.prediction.game_id, refundAmount
    );

    if (result.success === false) {
      return { success: false, error: result.error };
    }

    revalidatePath("/dashboard");
    revalidatePath("/prediction/sports");

    return {
      success: true,
      message: `${refundAmount.toLocaleString()} PMP가 환불되었습니다.`,
      refundedAmount: refundAmount,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[withdrawPrediction] Error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}
