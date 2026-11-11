import { NextRequest, NextResponse } from "next/server";
import { isFailure } from "@posmul/auth-economy-sdk";
import {
  getCreatePredictionDraftUseCase,
  getFetchRssItemsUseCase,
} from "@/bounded-contexts/feed/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";
import { predictionLearningStatsService } from "@/bounded-contexts/prediction/application/services/prediction-learning-stats.service";

export const dynamic = "force-dynamic";

interface PipelineRequestBody {
  action?: string;
  gameId?: string;
  optionId?: string;
  amount?: number | string;
  userId?: string;
  winningOption?: string;
}

/**
 * RSS 피드 수집 후 AI 예측 게임 초안/발행 파이프라인 실행
 */
async function handleIngestAndDraft(): Promise<NextResponse> {
  const fetchRss = getFetchRssItemsUseCase();
  const rssRes = await fetchRss.execute({ category: "ALL" });
  const logs: string[] = [];

  if (isFailure(rssRes)) {
    logs.push(`RSS fetch failed: ${rssRes.error.message}`);
  } else {
    logs.push(
      `RSS fetched: ${rssRes.data.fetchedCount} items from ${rssRes.data.sourceCount} sources`
    );
  }

  const draftUseCase = getCreatePredictionDraftUseCase();
  const draftRes = await draftUseCase.execute(5);

  if (isFailure(draftRes)) {
    return NextResponse.json(
      { success: false, logs, error: draftRes.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Pipeline completed successfully!",
    data: draftRes.data,
    logs: [...logs, ...(draftRes.data.logs || [])],
  });
}

/**
 * 관리자 테스트용 예측 참여 기록 생성
 */
async function handleAdminParticipate(
  body: PipelineRequestBody,
  adminUserId: string
): Promise<NextResponse> {
  const { gameId, optionId, amount, userId } = body;
  if (!gameId || !optionId || !amount) {
    return NextResponse.json(
      { success: false, error: "Missing gameId, optionId, or amount" },
      { status: 400 }
    );
  }

  const targetUserId = userId || adminUserId;
  const stakeNum = Number(amount);

  const { data: betData, error: betError } = await supabaseAdmin
    .schema("prediction")
    .from("predictions")
    .insert({
      game_id: gameId,
      user_id: targetUserId,
      prediction_data: { selectedOptionId: optionId },
      confidence_level: 50,
      bet_amount: stakeNum,
      expected_reward: stakeNum * 1.5,
      odds_at_time: 1.5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (betError) {
    return NextResponse.json(
      {
        success: false,
        error: betError.message || JSON.stringify(betError),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Successfully recorded ${amount}P on game ${gameId} (Option: ${optionId})`,
    data: betData,
  });
}

/**
 * 관리자 수동 게임 정산 실행
 */
async function handleManualSettle(
  body: PipelineRequestBody
): Promise<NextResponse> {
  const { gameId, winningOption } = body;
  if (!gameId || !winningOption) {
    return NextResponse.json(
      { success: false, error: "Missing gameId or winningOption" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  let settledCount = 0;
  let winnerCount = 0;
  let totalRewardDistributed = 0;

  // 1. 정식 DB 정산 RPC 우선 시도 (보상 지급 + winning_option_id + settled_at + MoneyWave 이력 일관성 보장)
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "settle_prediction_game",
    {
      p_game_id: gameId,
      p_correct_option_id: winningOption,
    }
  );

  if (!rpcError && rpcData) {
    const rpcResult = rpcData as {
      winners_count?: number;
      losers_count?: number;
      total_reward_distributed?: number;
    };
    winnerCount = Number(rpcResult.winners_count ?? 0);
    settledCount = winnerCount + Number(rpcResult.losers_count ?? 0);
    totalRewardDistributed = Number(rpcResult.total_reward_distributed ?? 0);
  } else {
    // RPC가 허용하지 않는 상태(예: 재정산 등)인 경우 최소 메타데이터만 안전 업데이트 (is_active 유지)
    const { error: gameUpdateError } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .update({
        status: "SETTLED",
        winning_option_id: winningOption,
        settled_at: nowIso,
        actual_result: {
          correctOptionId: winningOption,
          winningOption,
        },
        updated_at: nowIso,
      })
      .eq("game_id", gameId);

    if (gameUpdateError) {
      return NextResponse.json(
        { success: false, error: gameUpdateError.message },
        { status: 400 }
      );
    }

    const { data: predictions, error: fetchError } = await supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, prediction_data")
      .eq("game_id", gameId)
      .eq("is_active", true);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 400 }
      );
    }

    for (const pred of predictions || []) {
      const selectedOption = (
        pred.prediction_data as { selectedOptionId?: string } | null
      )?.selectedOptionId;
      if (selectedOption === winningOption) {
        winnerCount++;
      }
      settledCount++;
    }
  }

  // 2. 참여자 Brier · Calibration · CAPM 학습 통계 및 통합 랭킹 동기화
  try {
    await predictionLearningStatsService.syncLearningStatsForGame(gameId);
  } catch (statsError) {
    void statsError;
  }

  return NextResponse.json({
    success: true,
    message: `Successfully settled game with winning option '${winningOption}'`,
    settledCount,
    winnerCount,
    totalRewardDistributed,
  });
}

/**
 * GET /api/admin/prediction/pipeline
 * 최근 생성된 예측 게임 목록 조회 (관리자 전용)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const { data: games, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalizedGames = (games || []).map((g: Record<string, unknown>) => {
      const actualId = g.game_id || g.id;
      return {
        ...g,
        game_id: actualId,
        id: actualId,
      };
    });

    return NextResponse.json({
      success: true,
      count: normalizedGames.length,
      games: normalizedGames,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prediction/pipeline
 * 관리자 전용 예측 파이프라인 제어 (피드 수집/초안 생성, 관리자 참여 테스트, 수동 정산)
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as PipelineRequestBody;

    switch (body.action) {
      case "ingest-and-draft":
        return await handleIngestAndDraft();
      case "participate": {
        const adminId =
          auth.authType === "admin"
            ? auth.user.id
            : "00000000-0000-0000-0000-000000000001";
        return await handleAdminParticipate(body, adminId);
      }
      case "settle":
        return await handleManualSettle(body);
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
