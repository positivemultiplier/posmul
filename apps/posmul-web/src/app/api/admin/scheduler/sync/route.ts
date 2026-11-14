import { NextRequest, NextResponse } from "next/server";

import { getMasterScheduler } from "@/bounded-contexts/prediction/application/services/master-game-scheduler.service";
import { schedulerConfigService } from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import { getCreatePredictionGameUseCase } from "@/bounded-contexts/prediction/di-container";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/admin/scheduler/sync
 * 정기 경제지표(한국은행 ECOS, 통계청 KOSIS, 금감원 DART), K-콘텐츠(KOBIS/드라마/예능/가요),
 * 글로벌 실적(FMP) 및 축구 경기(Football-Data) 스케줄러 동기화 엔드포인트
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const config = await schedulerConfigService.getSchedulerConfig();
    const isCron = auth.authType === "cron";

    if (isCron && (!config.master_auto_enabled || !config.auto_template_sync_enabled)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "scheduler template sync disabled in config",
        syncedAt: new Date().toISOString(),
      });
    }

    let body: {
      materializeTemplates?: boolean;
      category?: string;
      templateId?: string;
      force?: boolean;
      ignoreCap?: boolean;
      backfillMissingBriefings?: boolean;
    } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const createGameUseCase = getCreatePredictionGameUseCase();
    const scheduler = getMasterScheduler(createGameUseCase);
    const syncResult = await scheduler.triggerSync({
      materializeTemplates: body.materializeTemplates ?? false,
      category: body.category,
      templateId: body.templateId,
      force: body.force,
      ignoreCap: body.ignoreCap ?? !isCron,
      backfillMissingBriefings: body.backfillMissingBriefings,
    });

    await schedulerConfigService.recordSchedulerRun(
      "scheduler-sync",
      {
        createdGamesCount: syncResult.createdGameIds.length,
        templateGames: syncResult.totalTemplates,
        backfilledBriefings: syncResult.backfilledBriefings,
      },
      !isCron
    );

    return NextResponse.json({
      success: true,
      message: "마스터 예측 스케줄러 동기화가 완료되었습니다.",
      syncedAt: new Date().toISOString(),
      stats: {
        footballGames: syncResult.footballAdded,
        earningsGames: syncResult.earningsAdded,
        templateGames: syncResult.totalTemplates,
        createdGamesCount: syncResult.createdGameIds.length,
        createdGameIds: syncResult.createdGameIds,
        backfilledBriefings: syncResult.backfilledBriefings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/scheduler/sync
 * 현재 등록된 정기 예측 게임 템플릿 및 오라클 상태 조회
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { allowCronSecret: true });
  if (!auth.ok) return auth.response;

  try {
    const createGameUseCase = getCreatePredictionGameUseCase();
    const scheduler = getMasterScheduler(createGameUseCase);
    const templates = await scheduler.getAllTemplateViews();
    const status = scheduler.getStatus();

    return NextResponse.json({
      ...status,
      templates,
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
