import { NextRequest, NextResponse } from "next/server";
import { getUserEconomicBalance } from "../../../../lib/supabase/direct-client";

/**
 * GET /api/economy/balance?userId=xxx
 * 사용자 경제 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId parameter is required'
          }
        },
        { status: 400 }
      );
    }

    const result = await getUserEconomicBalance(userId);

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BALANCE_FETCH_FAILED',
            message: result.error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        pmpBalance: result.pmpBalance,
        pmcBalance: result.pmcBalance,
        lastUpdated: new Date().toISOString()
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