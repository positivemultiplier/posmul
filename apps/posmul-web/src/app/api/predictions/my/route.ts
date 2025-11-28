/**
 * 내 예측 내역 조회 API
 * GET /api/predictions/my
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." },
        },
        { status: 401 }
      );
    }

    // URL에서 userId 파라미터 확인 (본인만 조회 가능)
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId");

    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "본인의 예측 내역만 조회할 수 있습니다." },
        },
        { status: 403 }
      );
    }

    // 사용자의 예측 내역 조회 (게임 정보 포함, 활성 예측만)
    const { data: predictions, error } = await supabase
      .schema("prediction")
      .from("predictions")
      .select(`
        prediction_id,
        game_id,
        user_id,
        prediction_data,
        bet_amount,
        confidence_level,
        is_active,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "QUERY_ERROR", message: error.message },
        },
        { status: 500 }
      );
    }

    // 게임 정보 조회
    const gameIds = [...new Set(predictions?.map((p) => p.game_id) || [])];
    
    let gamesMap: Record<string, any> = {};
    if (gameIds.length > 0) {
      const { data: games } = await supabase
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, title, status, game_options, settlement_date, slug")
        .in("game_id", gameIds);

      if (games) {
        gamesMap = games.reduce((acc, game) => {
          acc[game.game_id] = game;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // 예측에 게임 정보 병합
    const predictionsWithGames = predictions?.map((prediction) => ({
      ...prediction,
      game: gamesMap[prediction.game_id] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictionsWithGames || [],
        total: predictionsWithGames?.length || 0,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      },
      { status: 500 }
    );
  }
}
