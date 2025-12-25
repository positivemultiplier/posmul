/**
 * 예측 철회 API
 * POST /api/predictions/[predictionId]/withdraw
 * 
 * ACTIVE 상태의 게임에서만 철회 가능
 * 철회 시 bet_amount 만큼 PMP 환불
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

interface RouteParams {
  params: Promise<{
    predictionId: string;
  }>;
}

type ErrorResponse = {
  code: string;
  message: string;
  status: number;
};

type ValidationSuccess = { valid: true; prediction: PredictionData; game: GameData };
type ValidationFailure = { valid: false; error: ErrorResponse };
type ValidationResult = ValidationSuccess | ValidationFailure;

interface PredictionData {
  prediction_id: string;
  game_id: string;
  user_id: string;
  bet_amount: number | null;
  is_active: boolean;
}

interface GameData {
  game_id: string;
  status: string;
  title: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function validateWithdrawal(
  supabase: SupabaseClient,
  predictionId: string,
  userId: string
): Promise<ValidationResult> {
  // 예측 정보 조회
  const { data: prediction, error: predictionError } = await supabase
    .schema("prediction")
    .from("predictions")
    .select("prediction_id, game_id, user_id, bet_amount, is_active")
    .eq("prediction_id", predictionId)
    .single();

  if (predictionError || !prediction) {
    return { valid: false, error: { code: "NOT_FOUND", message: "예측을 찾을 수 없습니다.", status: 404 } };
  }

  if (prediction.user_id !== userId) {
    return { valid: false, error: { code: "FORBIDDEN", message: "본인의 예측만 철회할 수 있습니다.", status: 403 } };
  }

  if (!prediction.is_active) {
    return { valid: false, error: { code: "ALREADY_INACTIVE", message: "이미 철회되거나 정산된 예측입니다.", status: 400 } };
  }

  // 게임 상태 확인
  const { data: game, error: gameError } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("game_id, status, title")
    .eq("game_id", prediction.game_id)
    .single();

  if (gameError || !game) {
    return { valid: false, error: { code: "GAME_NOT_FOUND", message: "게임을 찾을 수 없습니다.", status: 404 } };
  }

  if (game.status !== "ACTIVE") {
    const statusMessage = game.status === "CLOSED" ? "마감된" : "정산된";
    return { valid: false, error: { code: "GAME_NOT_ACTIVE", message: `${statusMessage} 게임의 예측은 철회할 수 없습니다.`, status: 400 } };
  }

  return { valid: true, prediction: prediction as PredictionData, game: game as GameData };
}

async function processWithdrawal(
  supabase: SupabaseClient,
  predictionId: string,
  userId: string,
  betAmount: number,
  gameTitle: string
): Promise<{ success: boolean; error?: ErrorResponse }> {
  // 예측 비활성화
  const { error: updateError } = await supabase
    .schema("prediction")
    .from("predictions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("prediction_id", predictionId);

  if (updateError) {
    return { success: false, error: { code: "UPDATE_FAILED", message: "예측 철회에 실패했습니다.", status: 500 } };
  }

  // PMP 환불 (배팅금액이 있는 경우)
  if (betAmount > 0) {
    const { error: refundError } = await supabase.rpc("grant_pmp", {
      p_user_id: userId,
      p_amount: betAmount,
      p_reason: `예측 철회 환불: ${gameTitle}`,
    });

    if (refundError) {
      // 환불 실패 시 예측 복구
      await supabase
        .schema("prediction")
        .from("predictions")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("prediction_id", predictionId);

      return { success: false, error: { code: "REFUND_FAILED", message: "PMP 환불에 실패했습니다.", status: 500 } };
    }
  }

  return { success: true };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { predictionId } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // 철회 가능 여부 검증
    const validationResult = await validateWithdrawal(supabase, predictionId, user.id);
    if (validationResult.valid === false) {
      const validationError = validationResult.error;
      return NextResponse.json(
        { success: false, error: { code: validationError.code, message: validationError.message } },
        { status: validationError.status }
      );
    }

    const { prediction, game } = validationResult;
    const betAmount = prediction.bet_amount || 0;

    // 철회 처리
    const withdrawResult = await processWithdrawal(supabase, predictionId, user.id, betAmount, game.title);
    if (!withdrawResult.success && withdrawResult.error) {
      return NextResponse.json(
        { success: false, error: { code: withdrawResult.error.code, message: withdrawResult.error.message } },
        { status: withdrawResult.error.status }
      );
    }

    const message = betAmount > 0 
      ? `예측이 철회되었습니다. ${betAmount.toLocaleString()} PMP가 환불되었습니다.`
      : "예측이 철회되었습니다.";

    return NextResponse.json({
      success: true,
      data: { predictionId, gameTitle: game.title, refundedAmount: betAmount, message },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." } },
      { status: 500 }
    );
  }
}
