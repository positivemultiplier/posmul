import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreatePredictionDraftUseCase, getFetchRssItemsUseCase } from "@/bounded-contexts/feed/di-container";
import { isFailure } from "@posmul/auth-economy-sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    // 1. Cron Secret 인증 검사 (프로덕션 보안용, 개발 환경에서는 통과)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution" }, { status: 401 });
    }

    const logs: string[] = [];

    // 2. RSS 뉴 수집
    const fetchRss = getFetchRssItemsUseCase();
    const rssRes = await fetchRss.execute({ category: "ALL" });
    if (isFailure(rssRes)) {
      logs.push(`RSS fetch failed: ${rssRes.error.message}`);
    } else {
      logs.push(`RSS fetched: ${rssRes.data.fetchedCount} items from ${rssRes.data.sourceCount} sources`);
    }

    // 3. AI 예측 게임 초안 생성 및 자동 발행
    const draftUseCase = getCreatePredictionDraftUseCase();
    const draftRes = await draftUseCase.execute(5);

    if (isFailure(draftRes)) {
      logs.push(`Draft creation failed: ${draftRes.error.message}`);
    } else {
      logs.push(`AI Prediction games drafted: ${draftRes.data.draftsCreated} games`);
    }

    // 4. 만료 도래 게임 자동 정산 처리
    const { data: expiredGames } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, game_options")
      .eq("status", "ACTIVE")
      .lte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()); // 24시간 지난 게임 자동 정산

    let autoSettledGamesCount = 0;
    if (expiredGames && expiredGames.length > 0) {
      for (const game of expiredGames) {
        const options = game.game_options?.options || ["Yes", "No"];
        const winningOption = options[0] || "Yes";

        await supabaseAdmin
          .schema("prediction")
          .from("prediction_games")
          .update({
            status: "SETTLED",
            actual_result: { winningOption },
            updated_at: new Date().toISOString(),
          })
          .eq("game_id", game.game_id);

        autoSettledGamesCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      logs,
      autoSettledGamesCount,
      message: "AI 예측 게임 자동 생성 및 정산 크론 파이프라인이 성공적으로 실행되었습니다.",
    });
  } catch (error: any) {
    console.error("Prediction pipeline cron error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute prediction pipeline cron" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
