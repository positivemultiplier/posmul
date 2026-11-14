import { isFailure } from "@posmul/auth-economy-sdk";
import { NextResponse } from "next/server";

import {
  getClassifyContentUseCase,
  getCreatePredictionDraftUseCase,
  getFetchRssItemsUseCase,
} from "@/bounded-contexts/feed/di-container";
import { schedulerConfigService } from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import { getAutoSettleByBillUseCase } from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const config = await schedulerConfigService.getSchedulerConfig();
    const isCron = auth.authType === "cron";

    if (isCron && (!config.master_auto_enabled || !config.auto_rss_draft_enabled)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: !config.master_auto_enabled
          ? "master_auto_enabled is disabled"
          : "auto_rss_draft_enabled is disabled",
        timestamp: new Date().toISOString(),
      });
    }

    const logs: string[] = [];

    // 1. RSS 뉴스 및 피드 수집
    const fetchRss = getFetchRssItemsUseCase();
    const rssRes = await fetchRss.execute({ category: "ALL" });
    if (isFailure(rssRes)) {
      logs.push(`RSS fetch failed: ${rssRes.error.message}`);
    } else {
      logs.push(
        `RSS fetched: ${rssRes.data.fetchedCount} items from ${rssRes.data.sourceCount} sources`
      );
    }

    // 2. 미분류(PENDING) RSS 아이템 AI 분류 (PENDING -> CLASSIFIED)
    const classifyUseCase = getClassifyContentUseCase();
    const classifyRes = await classifyUseCase.execute(config.rss_classify_batch_size);
    if (isFailure(classifyRes)) {
      logs.push(`AI Classification failed: ${classifyRes.error.message}`);
    } else {
      logs.push(
        `AI Classified: processed=${classifyRes.data.processed}, predictions=${classifyRes.data.predictions}, forums=${classifyRes.data.forums}, failed=${classifyRes.data.failed}`
      );
    }

    // 3. AI 예측 게임 초안 생성 및 자동 발행
    const draftUseCase = getCreatePredictionDraftUseCase();
    const draftRes = await draftUseCase.execute(config.max_drafts_per_run);

    let draftsCreated = 0;
    if (isFailure(draftRes)) {
      logs.push(`Draft creation failed: ${draftRes.error.message}`);
    } else {
      draftsCreated = draftRes.data.draftsCreated;
      logs.push(
        `AI Prediction games drafted: ${draftRes.data.draftsCreated} games`
      );
      logs.push(...(draftRes.data.logs || []));
    }

    // 4. 베팅 마감 도래 게임 즉시 종료 (ACTIVE -> CLOSED)
    let closedCount = 0;
    if (config.auto_close_expired_enabled) {
      const { data: closedRes, error: closeErr } = await supabaseAdmin
        .schema("prediction")
        .rpc("close_expired_games");
      if (closeErr) {
        logs.push(`Close expired games warning: ${closeErr.message}`);
      } else {
        closedCount = Number(closedRes ?? 0);
        logs.push(`Closed expired active games: ${closedCount}`);
      }
    }

    // 5. 국회 의안 결과 기반 자동 정산 + 외부 오라클 자동 정산 실행
    let autoSettledGamesCount = 0;
    let totalRewardDistributed = 0;

    if (config.auto_oracle_settle_enabled) {
      const billSettleRes = await getAutoSettleByBillUseCase().execute();
      const oracleSettleRes =
        await settlementOrchestrator.runScheduledAutoSettlements();

      const billSettledCount = billSettleRes.success
        ? billSettleRes.data.settledGamesCount
        : 0;
      autoSettledGamesCount = billSettledCount + oracleSettleRes.settledCount;
      totalRewardDistributed = oracleSettleRes.totalRewardDistributed;

      if (billSettleRes.success) {
        logs.push(...billSettleRes.data.logs);
      }
      logs.push(...oracleSettleRes.logs);
    } else {
      logs.push("Auto oracle settlement skipped (auto_oracle_settle_enabled=false).");
    }

    await schedulerConfigService.recordSchedulerRun(
      "prediction-pipeline",
      {
        draftsCreated,
        closedCount,
        autoSettledGamesCount,
        totalRewardDistributed,
      },
      !isCron
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      logs,
      draftsCreated,
      closedCount,
      autoSettledGamesCount,
      totalRewardDistributed,
      message:
        "AI 예측 게임 자동 분류/생성 및 오라클 기반 정산 크론 파이프라인이 성공적으로 실행되었습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute prediction pipeline cron",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
