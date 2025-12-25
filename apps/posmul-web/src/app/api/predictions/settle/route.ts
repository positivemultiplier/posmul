/**
 * Prediction Game Settlement API Route
 * 
 * 예측 게임 정산을 처리하는 API 엔드포인트
 * Admin 권한이 필요합니다.
 * 
 * DB 함수(settle_prediction_game)를 통해:
 * - 승자에게 PMC 보상 지급
 * - 패자의 PMP 소각 기록
 * - economy.pmp_pmc_accounts + public.user_profiles 동기화
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSettlePredictionGameUseCase } from "../../../../bounded-contexts/prediction/di-container";
import { PredictionGameId, UserId } from "@posmul/auth-economy-sdk";

/**
 * POST /api/predictions/settle
 * 예측 게임 정산 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.gameId || !body.correctOptionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields: gameId, correctOptionId",
          },
        },
        { status: 400 }
      );
    }

    // 1. 현재 사용자 확인 (Admin 권한 체크)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // TODO: 실제 Admin 권한 체크 (현재는 로그인만 확인)
    // const isAdmin = await checkAdminRole(user.id);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
    //     { status: 403 }
    //   );
    // }

    // 2. 게임 정산 Use Case 실행 (DB 함수 호출)
    const settleUseCase = getSettlePredictionGameUseCase();
    const result = await settleUseCase.execute({
      gameId: body.gameId as PredictionGameId,
      correctOptionId: body.correctOptionId,
      adminUserId: user.id as UserId,
    });

    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SETTLEMENT_FAILED",
            message: result.error?.message || "Settlement failed",
          },
        },
        { status: 500 }
      );
    }

    // 3. 정산 결과 반환 (DB 함수가 모든 보상 처리를 완료함)
    const settlementData = result.data;

    return NextResponse.json({
      success: true,
      data: {
        gameId: settlementData.gameId,
        correctOptionId: settlementData.correctOptionId,
        totalRewardDistributed: settlementData.totalRewardDistributed,
        winnersCount: settlementData.winnersCount,
        losersCount: settlementData.losersCount,
        settledAt: settlementData.settledAt,
        message: `Successfully settled game. ${settlementData.winnersCount} winners rewarded with ${settlementData.totalRewardDistributed} PMC.`,
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/settle
 * 정산 대기 중인 게임 목록 조회
 */
export async function GET(_request: NextRequest) {
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
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // 정산 대기 중인 게임 조회 (ACTIVE 상태 + 정산 시간 경과)
    const { data: pendingGames, error } = await supabase
      .schema("prediction")
      .from("prediction_games")
      .select(
        `
        game_id,
        title,
        description,
        category,
        prediction_type,
        game_options,
        status,
        settlement_date,
        created_at
      `
      )
      .eq("status", "ACTIVE")
      .lte("settlement_date", new Date().toISOString())
      .order("settlement_date", { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "QUERY_ERROR",
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingGames: pendingGames || [],
        count: pendingGames?.length || 0,
      },
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
