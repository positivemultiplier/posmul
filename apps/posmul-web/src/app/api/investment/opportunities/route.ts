import { NextResponse } from "next/server";

import { MCPInvestmentOpportunityRepository } from "../../../../bounded-contexts/investment/infrastructure/repositories/mcp-investment-opportunity.repository";

/**
 * GET /api/investment/opportunities
 * 활성 투자 기회 목록을 조회하는 API
 */
export async function GET(request: Request) {
  try {
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "default";
    const opportunityRepo = new MCPInvestmentOpportunityRepository(projectId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 참고: 실제 구현에서는 findActive 메서드가 필요합니다.
    // const result = await opportunityRepo.findActive(limit, offset);

    // 임시로 성공 응답을 반환합니다.
    const result = { success: true, data: { opportunities: [], total: 0 } };

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      // 오류 발생 시
      return NextResponse.json(
        { error: "Failed to fetch investment opportunities" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching investment opportunities:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
