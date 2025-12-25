import { NextRequest, NextResponse } from "next/server";
import { participateInGame, getUserEconomicBalance } from "../../../../lib/supabase/direct-client";

/**
 * POST /api/predictions/participate
 * 예측 게임 참여
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 기본 검증
    if (!body.userId || !body.gameId || !body.selectedOptionId || !body.stakeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: userId, gameId, selectedOptionId, stakeAmount'
          }
        },
        { status: 400 }
      );
    }

    // 사용자 잔액 확인
    const balance = await getUserEconomicBalance(body.userId);
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

    if (balance.pmpBalance < body.stakeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient PMP balance. Required: ${body.stakeAmount}, Available: ${balance.pmpBalance}`
          }
        },
        { status: 400 }
      );
    }

    // 예측 참여
    const { data, error } = await participateInGame({
      userId: body.userId,
      gameId: body.gameId,
      selectedOptionId: body.selectedOptionId,
      stakeAmount: body.stakeAmount,
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