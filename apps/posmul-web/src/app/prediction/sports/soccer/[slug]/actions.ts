"use server";

/**
 * Soccer Prediction Game Server Actions
 *
 * DDD + Clean Architecture 기반 예측 게임 서버 액션
 * Use Case를 통해 비즈니스 로직 처리
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { revalidatePath } from "next/cache";
import {
  UserId,
  PredictionGameId,
  createPmpAmount,
} from "@posmul/auth-economy-sdk";

import { createClient } from "../../../../../lib/supabase/server";
import { getParticipatePredictionUseCase } from "../../../../../bounded-contexts/prediction/di-container";

export interface PlaceBetRequest {
  gameId: string;
  optionId: string;
  stakeAmount: number;
  confidence?: number; // 0-1 사이 신뢰도 (선택사항, 기본 0.5)
}

export interface PlaceBetResponse {
  success: boolean;
  message: string;
  predictionId?: string;
  newBalance?: number;
  error?: string;
}

/**
 * 예측 게임에 베팅하는 Server Action
 * 
 * Clean Architecture의 Use Case를 통해 처리:
 * 1. 인증 확인
 * 2. ParticipatePredictionUseCase 호출
 * 3. 결과 반환
 */
export async function placeBet(request: PlaceBetRequest): Promise<PlaceBetResponse> {
  try {
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
        error: "UNAUTHORIZED",
      };
    }

    // 2. Use Case 호출
    const useCase = getParticipatePredictionUseCase();
    
    const result = await useCase.execute({
      userId: user.id as UserId,
      gameId: request.gameId as PredictionGameId,
      selectedOptionId: request.optionId,
      stakeAmount: createPmpAmount(request.stakeAmount),
      confidence: request.confidence ?? 0.5,
    });

    if (result.success === false) {
      // 에러 메시지 한글화
      const errorMessage = getKoreanErrorMessage(result.error.message);
      return {
        success: false,
        message: errorMessage,
        error: result.error.message,
      };
    }

    // 3. 새 잔액 조회 (economy.pmp_pmc_accounts - Single Source of Truth)
    const { data: account } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance")
      .eq("user_id", user.id)
      .single();

    // 4. 페이지 새로고침
    revalidatePath(`/prediction/sports/soccer/${request.gameId}`);

    return {
      success: true,
      message: `${request.stakeAmount.toLocaleString()} PMP로 베팅이 완료되었습니다!`,
      predictionId: result.data.predictionId,
      newBalance: account?.pmp_balance ?? 0,
    };
  } catch (error) {
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("placeBet 오류:", error);
    }
    return {
      success: false,
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      error: "SERVER_ERROR",
    };
  }
}

/**
 * 에러 메시지 한글화 헬퍼
 */
function getKoreanErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Insufficient PmpAmount balance": "PMP 잔액이 부족합니다.",
    "Prediction game not found": "예측 게임을 찾을 수 없습니다.",
    "Failed to retrieve prediction game": "게임 정보를 불러올 수 없습니다.",
    "Failed to check PmpAmount participation eligibility": "참여 자격을 확인할 수 없습니다.",
    "Failed to create prediction entity": "예측 생성에 실패했습니다.",
    "Failed to add prediction to game": "게임 참여에 실패했습니다.",
    "Failed to save prediction game state": "게임 상태 저장에 실패했습니다.",
    "Economic process failed": "경제 처리에 실패했습니다.",
  };

  // 부분 매칭 시도
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  return "예측 참여 중 오류가 발생했습니다.";
}

/**
 * 현재 사용자의 잔액 조회
 */
export async function getUserBalance(): Promise<{ pmp: number; pmc: number } | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log("[getUserBalance] Auth error:", authError.message);
      return null;
    }
    
    if (!user) {
      console.log("[getUserBalance] No user logged in");
      return null;
    }

    console.log("[getUserBalance] Fetching balance for user:", user.id);

    // DDD: economy.pmp_pmc_accounts is the Single Source of Truth for balances
    const { data: accountData, error: accountError } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance, pmc_balance")
      .eq("user_id", user.id)
      .single();

    if (accountError) {
      console.log("[getUserBalance] Account error:", accountError.message);
      return null;
    }

    // 방어적 처리: 배열 또는 객체 모두 처리
    const account = Array.isArray(accountData) ? accountData[0] : accountData;
    
    console.log("[getUserBalance] Raw account data:", JSON.stringify(accountData, null, 2));
    console.log("[getUserBalance] Processed account:", JSON.stringify(account, null, 2));
    console.log("[getUserBalance] account.pmp_balance:", account?.pmp_balance, "type:", typeof account?.pmp_balance);

    // Decimal 타입은 문자열 또는 숫자로 반환될 수 있으므로 Number()로 변환
    const pmpBalance = account?.pmp_balance != null ? Number(account.pmp_balance) : 0;
    const pmcBalance = account?.pmc_balance != null ? Number(account.pmc_balance) : 0;

    console.log("[getUserBalance] Returning:", { pmp: pmpBalance, pmc: pmcBalance });

    return {
      pmp: pmpBalance,
      pmc: pmcBalance,
    };
  } catch (error) {
    console.error("[getUserBalance] Exception:", error);
    return null;
  }
}

/**
 * 사용자의 베팅 내역 조회
 */
export async function getUserBets(gameId: string): Promise<Array<{
  betId: string;
  selectedOption: string;
  betAmount: number;
  status: string;
  createdAt: string;
}>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    // predictions 테이블에서 조회 (DDD 모델 기반)
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, prediction_data, bet_amount, created_at")
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return (predictions || []).map(pred => ({
      betId: pred.prediction_id,
      selectedOption: (pred.prediction_data as { selectedOptionId?: string })?.selectedOptionId || "",
      betAmount: pred.bet_amount,
      status: "PENDING", // predictions 테이블에는 status가 없으므로 기본값
      createdAt: pred.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * 베팅 철회 결과 타입
 */
export interface WithdrawBetResponse {
  success: boolean;
  message: string;
  refundedAmount?: number;
  newBalance?: number;
  error?: string;
}

/**
 * 예측 철회를 위한 검증 헬퍼 함수
 */
async function validateWithdrawal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  predictionId: string
): Promise<
  | { valid: true; prediction: { prediction_id: string; user_id: string; game_id: string; bet_amount: number; is_active: boolean } }
  | { valid: false; error: WithdrawBetResponse }
> {
  // 예측 정보 조회
  const { data: predictionData, error: predError } = await supabase
    .schema("prediction")
    .from("predictions")
    .select("prediction_id, user_id, game_id, bet_amount, is_active")
    .eq("prediction_id", predictionId)
    .single();

  // 방어적 처리: .single()이지만 스키마 접근 시 배열로 반환될 수 있음
  const prediction = Array.isArray(predictionData) ? predictionData[0] : predictionData;

  if (predError || !prediction) {
    return { valid: false, error: { success: false, message: "예측을 찾을 수 없습니다.", error: "PREDICTION_NOT_FOUND" } };
  }

  if (prediction.user_id !== userId) {
    return { valid: false, error: { success: false, message: "본인의 예측만 철회할 수 있습니다.", error: "FORBIDDEN" } };
  }

  if (!prediction.is_active) {
    return { valid: false, error: { success: false, message: "이미 철회된 예측입니다.", error: "ALREADY_WITHDRAWN" } };
  }

  // 게임 상태 확인
  const { data: gameData, error: gameError } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("status")
    .eq("game_id", prediction.game_id)
    .single();

  // 방어적 처리: 스키마 접근 시 배열로 반환될 수 있음
  const game = Array.isArray(gameData) ? gameData[0] : gameData;

  if (gameError || !game) {
    return { valid: false, error: { success: false, message: "게임 정보를 찾을 수 없습니다.", error: "GAME_NOT_FOUND" } };
  }

  if (game.status !== "ACTIVE") {
    return { valid: false, error: { success: false, message: "진행 중인 게임의 예측만 철회할 수 있습니다.", error: "GAME_NOT_ACTIVE" } };
  }

  return { valid: true, prediction };
}

/**
 * PMP 환불 처리 헬퍼 함수
 */
async function processRefund(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  predictionId: string,
  refundAmount: number
): Promise<{ success: true; newBalance: number } | { success: false; error: string }> {
  // 예측 비활성화
  const { error: updateError } = await supabase
    .schema("prediction")
    .from("predictions")
    .update({ is_active: false })
    .eq("prediction_id", predictionId);

  if (updateError) {
    return { success: false, error: "UPDATE_FAILED" };
  }

  // 현재 잔액 조회 및 환불
  const { data: accountData } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance")
    .eq("user_id", userId)
    .single();

  // 방어적 처리
  const account = Array.isArray(accountData) ? accountData[0] : accountData;

  const currentBalance = Number(account?.pmp_balance ?? 0);
  const newBalance = currentBalance + refundAmount;

  const { error: refundError } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmp_balance: newBalance })
    .eq("user_id", userId);

  // eslint-disable-next-line no-console
  console.log("[processRefund] Refund update:", { refundError: refundError?.message });

  if (refundError) {
    // 롤백: 예측 다시 활성화
    await supabase
      .schema("prediction")
      .from("predictions")
      .update({ is_active: true })
      .eq("prediction_id", predictionId);

    return { success: false, error: "REFUND_FAILED" };
  }

  return { success: true, newBalance };
}

/**
 * 예측 베팅 철회 Server Action
 * 
 * 게임이 ACTIVE 상태일 때만 철회 가능
 * 철회 시 베팅 금액 전액 환불
 */
export async function withdrawBet(
  predictionId: string,
  gameSlug: string
): Promise<WithdrawBetResponse> {
  try {
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: "로그인이 필요합니다.", error: "UNAUTHORIZED" };
    }

    // 2. 검증
    const validation = await validateWithdrawal(supabase, user.id, predictionId);
    if (validation.valid === false) {
      return validation.error;
    }

    const { prediction } = validation;
    const refundAmount = Number(prediction.bet_amount);

    // 3. 환불 처리
    const refundResult = await processRefund(supabase, user.id, predictionId, refundAmount);
    if (refundResult.success === false) {
      return {
        success: false,
        message: refundResult.error === "REFUND_FAILED" ? "환불 처리에 실패했습니다." : "철회 처리에 실패했습니다.",
        error: refundResult.error,
      };
    }

    // 4. 게임 참가자 수, 총 베팅액 업데이트
    const { data: gameData } = await supabase
      .schema("prediction")
      .from("prediction_games")
      .select("current_participants, total_pool")
      .eq("game_id", prediction.game_id)
      .single();

    if (gameData) {
      await supabase
        .schema("prediction")
        .from("prediction_games")
        .update({
          current_participants: Math.max(0, (gameData.current_participants ?? 1) - 1),
          total_pool: Math.max(0, (gameData.total_pool ?? refundAmount) - refundAmount),
        })
        .eq("game_id", prediction.game_id);
    }

    // 5. 페이지 캐시 무효화
    revalidatePath(`/prediction/sports/soccer/${gameSlug}`);
    revalidatePath("/prediction/sports");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `${refundAmount.toLocaleString()} PMP가 환불되었습니다.`,
      refundedAmount: refundAmount,
      newBalance: refundResult.newBalance,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("withdrawBet 오류:", error);
    }
    return {
      success: false,
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      error: "SERVER_ERROR",
    };
  }
}
