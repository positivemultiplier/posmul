import { NextRequest, NextResponse } from "next/server";

import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import { getAutoSettleByBillUseCase } from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/prediction-settle
 * Vercel Cron 또는 GitHub Actions 스케줄러를 통한 무인 자동 정산 엔드포인트
 *
 * 수행 작업:
 * 1. 국회 의안 처리결과(원안가결/수정가결/부결/폐기) 기반 연동 예측 게임 자동 정산 및 상금(PMC) 자동 배분
 * 2. 정기 오라클 소스(DART, KOSIS, 한국은행 ECOS, 영진위 KOBIS, FMP, Football-Data) 기반 자동 정산
 * 3. 마감 기한이 지난 만료 예측 게임 스캔 및 모니터링
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const startTime = Date.now();
    const logs: string[] = [];
    logs.push(
      `[${new Date().toISOString()}] Cron Prediction Settlement Started`
    );

    // 1. 국회 의안 기반 자동 정산 유스케이스 실행
    const autoSettleUseCase = getAutoSettleByBillUseCase();
    const settleResult = await autoSettleUseCase.execute();

    let settledCount = 0;
    let totalDistributedPMC = 0;
    const details: any[] = [];

    if (settleResult.success) {
      settledCount += settleResult.data.settledGamesCount;
      details.push(...settleResult.data.details);
      totalDistributedPMC += settleResult.data.details.reduce(
        (sum, d) => sum + (d.totalRewardDistributed || 0),
        0
      );
      logs.push(...settleResult.data.logs);
    } else {
      logs.push(
        `AutoSettleByBill Error: ${(settleResult as any).error?.message}`
      );
    }

    // 2. 외부 오라클(DART/KOSIS/ECOS/KOBIS/FMP/Football) 예약 정산 일괄 실행
    const oracleBatch =
      await settlementOrchestrator.runScheduledAutoSettlements();
    settledCount += oracleBatch.settledCount;
    totalDistributedPMC += oracleBatch.totalRewardDistributed;
    details.push(...oracleBatch.results);
    logs.push(...oracleBatch.logs);

    // 3. 베팅 마감 후 아직 정산되지 않은(ACTIVE/CLOSED) 판정 대기 게임 카운트
    // (정산 기한 + 7일 초과 시 DB cron의 prediction.void_stale_games()가 전액 환불 처리)
    const nowIso = new Date().toISOString();
    const { data: expiredGames } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, category, registration_end, status")
      .in("status", ["ACTIVE", "CLOSED"])
      .lte("registration_end", nowIso);

    const pendingExpiredCount = expiredGames?.length || 0;
    if (pendingExpiredCount > 0) {
      logs.push(
        `Found ${pendingExpiredCount} expired active games requiring manual or oracle verdict.`
      );
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
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal settlement cron error",
      },
      { status: 500 }
    );
  }
}
