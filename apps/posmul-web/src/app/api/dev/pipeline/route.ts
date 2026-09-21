import { NextRequest, NextResponse } from "next/server";
import { getCreatePredictionDraftUseCase, getFetchRssItemsUseCase } from "@/bounded-contexts/feed/di-container";
import { getParticipatePredictionUseCase } from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isFailure } from "@posmul/auth-economy-sdk";

export async function GET(req: NextRequest) {
  try {
    // 1. Supabase prediction.prediction_games 테이블에서 최근 생성된 게임 10개 조회
    const { data: games, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const normalizedGames = (games || []).map((g: any) => {
      const actualId = g.game_id || g.id;
      return {
        ...g,
        game_id: actualId,
        id: actualId,
      };
    });

    return NextResponse.json({ success: true, count: normalizedGames.length, games: normalizedGames });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, gameId, optionId, amount, userId } = body;

    // 1. RSS 뉴스 수집 + AI 분석 게임 자동 생성 트리거
    if (action === "ingest-and-draft") {
      const logs: string[] = [];

      // Step A: RSS 가져오기
      const fetchRss = getFetchRssItemsUseCase();
      const rssRes = await fetchRss.execute({ category: "ALL" });
      if (isFailure(rssRes)) {
        logs.push(`RSS fetch failed: ${rssRes.error.message}`);
      } else {
        logs.push(`RSS fetched: ${rssRes.data.fetchedCount} items from ${rssRes.data.sourceCount} sources`);
      }

      // Step B: Gemini 초안/예측게임 자동 생성
      const draftUseCase = getCreatePredictionDraftUseCase();
      const draftRes = await draftUseCase.execute(5);

      if (isFailure(draftRes)) {
        return NextResponse.json({ success: false, logs, error: draftRes.error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Pipeline completed successfully!",
        data: draftRes.data,
        logs: [...logs, ...draftRes.data.logs],
      });
    }

    // 2. 예측 게임 베팅 테스트 트리거
    if (action === "participate") {
      if (!gameId || !optionId || !amount) {
        return NextResponse.json({ success: false, error: "Missing gameId, optionId, or amount" }, { status: 400 });
      }

      const targetUserId = userId || "00000000-0000-0000-0000-000000000001";
      const betNum = Number(amount);

      // Dev 모드: Supabase prediction.predictions 테이블에 실제 스키마 컬럼으로 등록
      const { data: betData, error: betError } = await supabaseAdmin
        .schema("prediction")
        .from("predictions")
        .insert({
          game_id: gameId,
          user_id: targetUserId,
          prediction_data: { selectedOptionId: optionId },
          confidence_level: 50,
          bet_amount: betNum,
          expected_reward: betNum * 1.5,
          odds_at_time: 1.5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (betError) {
        console.error("Bet Insert Error:", betError);
        return NextResponse.json({ success: false, error: betError.message || JSON.stringify(betError) }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully bet ${amount}P on game ${gameId} (Option: ${optionId})`,
        data: betData,
      });
    }

    // 3. 예측 게임 승부 정산 테스트 트리거
    if (action === "settle") {
      const { winningOption } = body;
      if (!gameId || !winningOption) {
        return NextResponse.json({ success: false, error: "Missing gameId or winningOption" }, { status: 400 });
      }

      // Step A: prediction_games 상태를 SETTLED로 변경
      const { error: gameUpdateError } = await supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .update({
          status: "SETTLED",
          actual_result: { winningOption },
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", gameId);

      if (gameUpdateError) {
        return NextResponse.json({ success: false, error: gameUpdateError.message }, { status: 400 });
      }

      // Step B: 해당 게임에 참여한 베팅 내역 조회
      const { data: predictions, error: fetchError } = await supabaseAdmin
        .schema("prediction")
        .from("predictions")
        .select("*")
        .eq("game_id", gameId);

      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 400 });
      }

      let settledCount = 0;
      let winnerCount = 0;

      if (predictions && predictions.length > 0) {
        for (const pred of predictions) {
          const selectedOption = pred.prediction_data?.selectedOptionId;
          const isWinner = selectedOption === winningOption;

          await supabaseAdmin
            .schema("prediction")
            .from("predictions")
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("prediction_id", pred.prediction_id);

          settledCount++;
          if (isWinner) winnerCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully settled game with winning option '${winningOption}'`,
        settledCount,
        winnerCount,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
