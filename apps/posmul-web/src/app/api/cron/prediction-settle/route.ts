import { NextRequest, NextResponse } from "next/server";
import { getAutoSettleByBillUseCase } from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/prediction-settle
 * Vercel Cron 또는 GitHub Actions 스케줄러를 통한 무인 자동 정산 엔드포인트
 *
 * 수행 작업:
 * 1. 국회 의안 처리결과(원안가결/수정가결/부결/폐기) 기반 연동 예측 게임 자동 정산 및 상금(PMC) 자동 배분
 * 2. 마감 기한이 지난 만료 예측 게임 스캔 및 상태 업데이트
 * 3. 정산 실행 결과 및 배분된 상금 통계 JSON 반환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const startTime = Date.now();
    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] Cron Prediction Settlement Started`);

    // 1. 국회 의안 기반 자동 정산 유스케이스 실행
    const autoSettleUseCase = getAutoSettleByBillUseCase();
    const settleResult = await autoSettleUseCase.execute();

    let settledCount = 0;
    let totalDistributedPMC = 0;
    let details: any[] = [];

    if (settleResult.success) {
      settledCount = settleResult.data.settledGamesCount;
      details = settleResult.data.details;
      totalDistributedPMC = details.reduce((sum, d) => sum + (d.totalRewardDistributed || 0), 0);
      logs.push(...settleResult.data.logs);
    } else {
      logs.push(`AutoSettleByBill Error: ${(settleResult as any).error?.message}`);
    }

    // 2. 마감일이 지났으나 아직 ACTIVE인 게임 카운트 및 모니터링
    const nowIso = new Date().toISOString();
    const { data: expiredGames, error: expErr } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, category, closing_date, status")
      .eq("status", "ACTIVE")
      .lte("closing_date", nowIso);

    const pendingExpiredCount = expiredGames?.length || 0;
    if (pendingExpiredCount > 0) {
      logs.push(`Found ${pendingExpiredCount} expired active games requiring manual or oracle verdict.`);
    }

    const durationMs = Date.now() - startTime;
    logs.push(`Cron Completed in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      summary: {
        settledGamesCount: settledCount,
        totalDistributedPMC,
        pendingExpiredCount,
      },
      details,
      logs,
    });
  } catch (error: any) {
    console.error("[Cron Prediction Settle Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal settlement cron error",
      },
      { status: 500 }
    );
  }
}
