import { NextRequest, NextResponse } from "next/server";
import {
  getFetchRssItemsUseCase,
  getFinancialMarketCollector,
  getBoxOfficeCollector,
  getFetchBillsUseCase,
} from "@/bounded-contexts/feed/di-container";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/feed-ingest
 * Vercel Cron 또는 정기 스케줄러를 통한 무인 자동 피드 수집 엔드포인트
 *
 * Query Params:
 * - category: 'all' | 'sports' | 'economy' | 'entertainment' | 'market' | 'bills' (기본값: 'all')
 * - secret: CRON_SECRET 환경변수 일치 여부 확인 (또는 관리자 세션 필수)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";

    const results: Record<string, any> = {};

    if (category === "all" || category === "sports") {
      const rssUseCase = getFetchRssItemsUseCase();
      const sportsRes = await rssUseCase.execute({ category: "SPORTS" });
      results.sports = sportsRes.success
        ? sportsRes.data
        : { error: (sportsRes as any).error?.message || "Failed" };
    }

    if (category === "all" || category === "economy") {
      const rssUseCase = getFetchRssItemsUseCase();
      const econRes = await rssUseCase.execute({ category: "ECONOMY" });
      results.economy = econRes.success
        ? econRes.data
        : { error: (econRes as any).error?.message || "Failed" };
    }

    if (category === "all" || category === "entertainment") {
      const rssUseCase = getFetchRssItemsUseCase();
      const enterRes = await rssUseCase.execute({ category: "ENTERTAINMENT" });
      results.entertainment = enterRes.success
        ? enterRes.data
        : { error: (enterRes as any).error?.message || "Failed" };
    }

    if (category === "all" || category === "market") {
      const marketCollector = getFinancialMarketCollector();
      const marketRes = await marketCollector.collect();
      results.marketIndicators = marketRes.success
        ? { collectedCount: marketRes.data.length }
        : { error: (marketRes as any).error?.message || "Failed" };
    }

    if (category === "all" || category === "boxoffice") {
      const boxOfficeCollector = getBoxOfficeCollector();
      const movieRes = await boxOfficeCollector.collect();
      results.boxOffice = movieRes.success
        ? { collectedCount: movieRes.data.length }
        : { error: (movieRes as any).error?.message || "Failed" };
    }

    if (category === "all" || category === "bills") {
      const billsUseCase = getFetchBillsUseCase();
      const billsRes = await billsUseCase.execute();
      results.bills = billsRes.success
        ? { success: true }
        : { error: (billsRes as any).error?.message || "Failed" };
    }

    // 1차 수집된 미분류(PENDING) 최신 RSS 뉴스를 LG EXAONE + Gemini 듀얼 AI로 자동 분류
    try {
      const { getClassifyContentUseCase, getCreatePredictionDraftUseCase } = await import(
        "@/bounded-contexts/feed/di-container"
      );
      const classifyUseCase = getClassifyContentUseCase();
      const classifyRes = await classifyUseCase.execute(8);
      results.aiClassification = classifyRes.success
        ? classifyRes.data
        : { error: (classifyRes as any).error?.message || "Classification failed" };

      // 2차로 분류 완료된(CLASSIFIED) 피드를 품질 게이트 검증 후 고품질 예측 게임으로 발행
      const draftUseCase = getCreatePredictionDraftUseCase();
      const draftRes = await draftUseCase.execute(6);
      results.autoCreatedGames = draftRes.success
        ? draftRes.data
        : { error: (draftRes as any).error?.message || "Failed to create drafts" };
    } catch (draftErr: any) {
      results.autoCreatedGames = { error: draftErr?.message || "Auto creation skipped" };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      categoryRequested: category,
      results,
    });
  } catch (error: any) {
    console.error("[Cron Feed Ingest Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
