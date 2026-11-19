import { NextRequest, NextResponse } from "next/server";
import { getUserEconomicBalance } from "../../../../lib/supabase/direct-client";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminUser } from "@/shared/lib/security/admin-auth";

/**
 * GET /api/economy/balance?userId=xxx
 * 사용자 경제 상태 조회 (본인 또는 관리자만 조회 가능)
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") || user.id;

    if (requestedUserId !== user.id) {
      const adminInfo = await resolveAdminUser(user);
      if (!adminInfo.isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot access another user's economic balance",
            },
          },
          { status: 403 }
        );
      }
    }

    const userId = requestedUserId;

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