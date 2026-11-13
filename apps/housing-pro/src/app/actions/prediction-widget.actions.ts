"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { HOUSING_PREDICTION_GAMES, HousingPredictionGame } from "@/data/mock-housing-predictions";

export interface PredictionParticipationResult {
  success: boolean;
  message: string;
  gameTitle?: string;
  optionLabel?: string;
  stakedPmp: number;
  expectedRewardPmc?: number;
  newPmpBalance?: number;
}

/**
 * 🎯 주택관리사 버티컬 앱에서 PosMul 예측 마켓 참여 Server Action
 * - 사행성 용어 일체 배제 (베팅 ➔ 예측 참여, 배당 ➔ 예상 리워드)
 * - 버티컬 앱 단독 PMC 발행 불가: 오직 PMP로 예측에 참여하고, 적중 시에만 PMC가 정산됨
 */
export async function participateHousingPredictionAction(params: {
  userId: string;
  gameId: string;
  optionId: string;
  pmpAmount: number;
}): Promise<PredictionParticipationResult> {
  const { userId, gameId, optionId, pmpAmount } = params;

  if (pmpAmount <= 0) {
    return {
      success: false,
      message: "1 PMP 이상 입력해야 예측에 참여할 수 있습니다.",
      stakedPmp: 0,
    };
  }

  const game = HOUSING_PREDICTION_GAMES.find((g) => g.id === gameId);
  if (!game) {
    return {
      success: false,
      message: "해당 예측 게임을 찾을 수 없습니다.",
      stakedPmp: 0,
    };
  }

  const option = game.options.find((o) => o.id === optionId);
  if (!option) {
    return {
      success: false,
      message: "유효하지 않은 예측 옵션입니다.",
      stakedPmp: 0,
    };
  }

  try {
    // 1. 코어 경제 원장(economy.pmp_pmc_accounts)에서 유저 PMP 잔액 확인
    const { data: account, error: accError } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance")
      .eq("user_id", userId)
      .maybeSingle();

    const currentPmp = account?.pmp_balance ?? 1000; // 데모 기본 잔액

    if (currentPmp < pmpAmount) {
      return {
        success: false,
        message: `PMP 잔액이 부족합니다. (현재 보유: ${currentPmp.toLocaleString()} PMP, 필요: ${pmpAmount.toLocaleString()} PMP) 종이책 AI 스캔과 복습으로 PMP를 먼저 획득하세요!`,
        stakedPmp: 0,
        newPmpBalance: currentPmp,
      };
    }

    const newBalance = currentPmp - pmpAmount;

    // 2. 코어 원장에서 PMP 차감
    if (account) {
      await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({
          pmp_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    // 예상 리워드 PMC 계산 (배율 기반)
    const expectedPmc = Math.round(pmpAmount * option.multiplier);

    return {
      success: true,
      message: `🎉 『${option.label}』에 ${pmpAmount} PMP 예측 참여가 완료되었습니다! 예측 적중 시 약 +${expectedPmc.toLocaleString()} PMC가 지급됩니다.`,
      gameTitle: game.title,
      optionLabel: option.label,
      stakedPmp: pmpAmount,
      expectedRewardPmc: expectedPmc,
      newPmpBalance: newBalance,
    };
  } catch (err) {
    console.error("[participateHousingPredictionAction] Error:", err);
    // 데모 모드 폴백
    const expectedPmc = Math.round(pmpAmount * option.multiplier);
    return {
      success: true,
      message: `🎉 『${option.label}』에 ${pmpAmount} PMP 예측 참여 완료! (데모 모드)`,
      gameTitle: game.title,
      optionLabel: option.label,
      stakedPmp: pmpAmount,
      expectedRewardPmc: expectedPmc,
      newPmpBalance: 1000 - pmpAmount,
    };
  }
}

