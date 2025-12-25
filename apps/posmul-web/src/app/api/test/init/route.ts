import { NextRequest, NextResponse } from "next/server";
import { initializeTestData } from "../../../../lib/supabase/direct-client";

/**
 * POST /api/test/init
 * 테스트 데이터 초기화
 */
export async function POST(_request: NextRequest) {
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
