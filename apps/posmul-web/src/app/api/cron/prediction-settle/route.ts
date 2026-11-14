import { NextRequest, NextResponse } from "next/server";

import { schedulerConfigService } from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import { getAutoSettleByBillUseCase } from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/prediction-settle
 * Vercel Cron 또는 pg_cron 스케줄러를 통한 만료 마감 + 무인 자동 정산 엔드포인트
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const config = await schedulerConfigService.getSchedulerConfig();
    const isCron = auth.authType === "cron";

    if (
      isCron &&
      (!config.master_auto_enabled ||
        (!config.auto_oracle_settle_enabled && !config.auto_close_expired_enabled))
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "scheduler auto settlement/close disabled in config",
        timestamp: new Date().toISOString(),
      });
    }

    const startTime = Date.now();
    const logs: string[] = [];
    logs.push(
      `[${new Date().toISOString()}] Cron Prediction Settlement Started`
    );

    // 0. 베팅 마감 시각(registration_end) 지난 ACTIVE 게임을 먼저 CLOSED로 전환
    let closedGamesCount = 0;
    if (config.auto_close_expired_enabled || !isCron) {
      const { data: closedRes, error: closeErr } = await supabaseAdmin
        .schema("prediction")
        .rpc("close_expired_games");
      if (closeErr) {
        logs.push(`CloseExpiredGames Warning: ${closeErr.message}`);
      } else {
        closedGamesCount = Number(closedRes ?? 0);
        logs.push(`Closed expired active games: ${closedGamesCount}`);
      }
    }

    let settledCount = 0;
    let totalDistributedPMC = 0;
    const details: any[] = [];

    if (config.auto_oracle_settle_enabled || !isCron) {
      // 1. 국회 의안 기반 자동 정산 유스케이스 실행
      const autoSettleUseCase = getAutoSettleByBillUseCase();
      const settleResult = await autoSettleUseCase.execute();

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

      // 2. 외부 오라클(DART/KOSIS/ECOS/KOBIS/FMP/Football/CoinGecko) 예약 + 마감 완료 게임 자동 정산 일괄 실행
      const oracleBatch =
        await settlementOrchestrator.runScheduledAutoSettlements();
      settledCount += oracleBatch.settledCount;
      totalDistributedPMC += oracleBatch.totalRewardDistributed;
      details.push(...oracleBatch.results);
      logs.push(...oracleBatch.logs);
    } else {
      logs.push("Oracle auto-settlement skipped by scheduler_config.");
    }

    // 3. 베팅 마감 후 아직 정산되지 않은(ACTIVE/CLOSED) 판정 대기 게임 카운트
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
        `Found ${pendingExpiredCount} expired active/closed games awaiting verdict.`
      );
    }

    // 4. 유저 자율 예측 / 맞짱 챌린지 자동 확정(10분 경과) 및 호스트 잠적(24시간 경과) 자동 환불
    let challengeSummary: Record<string, unknown> = {};
    try {
      const { data: challengeBatch, error: challengeErr } = await supabaseAdmin.rpc(
        "process_expired_user_challenges"
      );
      if (challengeErr) {
        logs.push(`UserChallenge AutoCron Error: ${challengeErr.message}`);
      } else if (challengeBatch) {
        challengeSummary = challengeBatch as Record<string, unknown>;
        logs.push(
          `UserChallenges AutoProcessed: finalized=${challengeSummary.finalized_count ?? 0}, refunded=${challengeSummary.refunded_count ?? 0}, failed=${challengeSummary.failed_count ?? 0}`
        );
      }
    } catch (chErr: unknown) {
      logs.push(
        `UserChallenge AutoCron Exception: ${chErr instanceof Error ? chErr.message : String(chErr)}`
      );
    }

    const durationMs = Date.now() - startTime;
    logs.push(`Cron Completed in ${durationMs}ms`);

    await schedulerConfigService.recordSchedulerRun(
      "prediction-settle",
      {
        closedGamesCount,
        settledCount,
        totalDistributedPMC,
        pendingExpiredCount,
      },
      !isCron
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      summary: {
        closedGamesCount,
        settledGamesCount: settledCount,
        totalDistributedPMC,
        pendingExpiredCount,
        userChallenges: challengeSummary,
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
