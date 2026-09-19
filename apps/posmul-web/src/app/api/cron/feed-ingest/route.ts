import { NextRequest, NextResponse } from "next/server";
import {
  getFetchRssItemsUseCase,
  getFinancialMarketCollector,
  getBoxOfficeCollector,
  getFetchBillsUseCase,
} from "@/bounded-contexts/feed/di-container";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/feed-ingest
 * Vercel Cron 또는 정기 스케줄러를 통한 무인 자동 피드 수집 엔드포인트
 *
 * Query Params:
 * - category: 'all' | 'sports' | 'economy' | 'entertainment' | 'market' | 'bills' (기본값: 'all')
 * - secret: CRON_SECRET 환경변수 일치 여부 확인 (설정된 경우)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const authHeader = request.headers.get("authorization");
    const secretParam = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized cron request" },
          { status: 401 }
        );
      }
    }

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
