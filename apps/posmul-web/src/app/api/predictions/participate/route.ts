import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { participateInGame, getUserEconomicBalance } from "../../../../lib/supabase/direct-client";

/**
 * POST /api/predictions/participate
 * 예측 게임 참여
 */
export async function POST(request: NextRequest) {
  try {
    // 인증된 세션 확인 (body.userId 스푸핑 방지)
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

    const body = await request.json();

    if (body.userId && body.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot participate on behalf of another user",
          },
        },
        { status: 403 }
      );
    }

    // 기본 검증
    if (!body.gameId || !body.selectedOptionId || !body.stakeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: gameId, selectedOptionId, stakeAmount'
          }
        },
        { status: 400 }
      );
    }

    const stakeAmount = Number(body.stakeAmount);
    if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "stakeAmount must be a positive number",
          },
        },
        { status: 400 }
      );
    }

    // 사용자 잔액 확인 (세션 user.id 기준)
    const balance = await getUserEconomicBalance(user.id);
    if (balance.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BALANCE_CHECK_FAILED',
            message: 'Could not verify user balance'
          }
        },
        { status: 500 }
      );
    }

    if (balance.pmpBalance < stakeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient PMP balance. Required: ${stakeAmount}, Available: ${balance.pmpBalance}`
          }
        },
        { status: 400 }
      );
    }

    // 예측 참여
    const { data, error } = await participateInGame({
      userId: user.id,
      gameId: body.gameId,
      selectedOptionId: body.selectedOptionId,
      stakeAmount,
      confidence: body.confidence || 0.5
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARTICIPATION_FAILED',
            message: error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        predictionId: data?.id,
        message: 'Successfully participated in prediction game',
        prediction: data
      }
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}