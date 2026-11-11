import { NextRequest, NextResponse } from "next/server";
import { initializeTestData } from "../../../../lib/supabase/direct-client";
import { blockInProduction, requireAdminApi } from "@/shared/lib/security/admin-auth";

/**
 * POST /api/test/init
 * 테스트 데이터 초기화 (개발 전용 + Admin 권한 필수, 프로덕션 차단)
 */
export async function POST(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await initializeTestData();
    
    return NextResponse.json({
      success: result.success,
      data: result.success ? {
        userId: result.userId,
        message: "Test data initialized successfully",
        testCredentials: {
          email: "test@posmul.com",
          password: "test123456"
        }
      } : null,
      error: result.success ? null : result.error
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INIT_FAILED',
          message: 'Failed to initialize test data',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
}
