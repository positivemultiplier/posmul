import { NextRequest, NextResponse } from "next/server";
import { isFailure } from "@posmul/auth-economy-sdk";
import {
  getClassifyContentUseCase,
  getCreatePredictionDraftUseCase,
  getFetchRssItemsUseCase,
} from "@/bounded-contexts/feed/di-container";
import { getMasterScheduler } from "@/bounded-contexts/prediction/application/services/master-game-scheduler.service";
import {
  schedulerConfigService,
  type PredictionSchedulerConfig,
  type TemplateOverrideConfig,
} from "@/bounded-contexts/prediction/application/services/scheduler-config.service";
import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import {
  getAutoSettleByBillUseCase,
  getCreatePredictionGameUseCase,
} from "@/bounded-contexts/prediction/di-container";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type ManualStepName =
  | "rss-draft"
  | "template-sync"
  | "close-expired"
  | "oracle-settle"
  | "full-cycle";

interface SchedulerConfigPostBody {
  action?:
    | "update-config"
    | "update-template"
    | "publish-template"
    | "run-manual-step"
    | "reset-games"
    | "sample-publish";
  patch?: Partial<PredictionSchedulerConfig>;
  templateId?: string;
  override?: TemplateOverrideConfig;
  force?: boolean;
  step?: ManualStepName;
  materializeTemplates?: boolean;
  category?: string;
  includeSettled?: boolean;
  forceWithBets?: boolean;
  templateIds?: string[];
  rssDraftCount?: number;
}

/**
 * 현재 파이프라인 상태, 설정, pg_cron 실제 잡 현황, 템플릿 현황 일괄 조회
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  try {
    const createGameUseCase = getCreatePredictionGameUseCase();
    const scheduler = getMasterScheduler(createGameUseCase);

    const [
      config,
      pgCronStatus,
      templatesRaw,
      gamesRes,
      pendingRssRes,
      classifiedRssRes,
      draftedRssRes,
    ] = await Promise.all([
      schedulerConfigService.getSchedulerConfig(),
      schedulerConfigService.getPgCronStatus(),
      scheduler.getAllTemplateViews(),
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("game_id, status, external_id, title"),
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("process_status", "PENDING"),
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("process_status", "CLASSIFIED"),
      supabaseAdmin
        .schema("feed")
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("process_status", "DRAFT_CREATED"),
    ]);

    const games = gamesRes.data ?? [];
    let activeGamesCount = 0;
    let closedGamesCount = 0;
    let settledGamesCount = 0;

    const activeByExternalId = new Map<string, string>();
    const activeByTitle = new Map<string, string>();

    for (const g of games) {
      if (g.status === "ACTIVE") {
        activeGamesCount += 1;
        if (g.external_id) activeByExternalId.set(String(g.external_id), String(g.game_id));
        if (g.title) activeByTitle.set(String(g.title), String(g.game_id));
      } else if (g.status === "CLOSED") {
        closedGamesCount += 1;
      } else if (g.status === "SETTLED") {
        settledGamesCount += 1;
      }
    }

    const templates = templatesRaw.map((tpl) => {
      const matchedGameId =
        activeByExternalId.get(tpl.id) ?? activeByTitle.get(tpl.title) ?? null;
      return {
        ...tpl,
        hasActiveGame: Boolean(matchedGameId),
        activeGameId: matchedGameId,
      };
    });

    return NextResponse.json({
      success: true,
      config,
      cronSynced: pgCronStatus.synced,
      cronJobs: pgCronStatus.jobs,
      cronError: pgCronStatus.error,
      templates,
      pipelineStats: {
        activeGamesCount,
        closedGamesCount,
        settledGamesCount,
        pendingRssCount: pendingRssRes.count ?? 0,
        classifiedRssCount: classifiedRssRes.count ?? 0,
        draftedRssCount: draftedRssRes.count ?? 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * Admin 스케줄러 설정 변경 / 템플릿 개별 수정 / 강제 1회 발행 / 수동 파이프라인 단계 실행
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as SchedulerConfigPostBody;
    const action = body.action;

    if (action === "update-config") {
      const patch = body.patch ?? (body as Partial<PredictionSchedulerConfig>);
      const result = await schedulerConfigService.updateSchedulerConfig(patch);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "update-template") {
      if (!body.templateId || !body.override) {
        return NextResponse.json(
          { success: false, error: "templateId와 override가 필요합니다." },
          { status: 400 }
        );
      }
      const config = await schedulerConfigService.updateTemplateOverride(
        body.templateId,
        body.override
      );
      return NextResponse.json({
        success: true,
        config,
      });
    }

    if (action === "publish-template") {
      if (!body.templateId) {
        return NextResponse.json(
          { success: false, error: "templateId가 필요합니다." },
          { status: 400 }
        );
      }
      const createGameUseCase = getCreatePredictionGameUseCase();
      const scheduler = getMasterScheduler(createGameUseCase);
      const syncResult = await scheduler.triggerSync({
        templateId: body.templateId,
        force: body.force ?? true,
        ignoreCap: true,
        materializeTemplates: true,
      });

      await schedulerConfigService.recordSchedulerRun(
        "manual-publish-template",
        {
          templateId: body.templateId,
          createdGamesCount: syncResult.createdGameIds.length,
          createdGameIds: syncResult.createdGameIds,
        },
        true
      );

      return NextResponse.json({
        success: true,
        syncResult,
      });
    }

    if (action === "run-manual-step") {
      const step = body.step ?? "full-cycle";
      const config = await schedulerConfigService.getSchedulerConfig();
      const logs: string[] = [];
      const summary: Record<string, unknown> = { step };

      const runRssDraft = async () => {
        const rssRes = await getFetchRssItemsUseCase().execute({
          category: "ALL",
        });
        if (isFailure(rssRes)) {
          logs.push(`[RSS 수집] 실패: ${rssRes.error.message}`);
        } else {
          logs.push(
            `[RSS 수집] ${rssRes.data.sourceCount}개 소스에서 ${rssRes.data.fetchedCount}건 수집`
          );
          summary.rssFetched = rssRes.data.fetchedCount;
        }

        const classifyRes = await getClassifyContentUseCase().execute(
          config.rss_classify_batch_size
        );
        if (isFailure(classifyRes)) {
          logs.push(`[AI 분류] 실패: ${classifyRes.error.message}`);
        } else {
          logs.push(
            `[AI 분류] 처리=${classifyRes.data.processed}, 예측=${classifyRes.data.predictions}, 포럼=${classifyRes.data.forums}, 실패=${classifyRes.data.failed}`
          );
          summary.classifiedProcessed = classifyRes.data.processed;
          summary.classifiedPredictions = classifyRes.data.predictions;
        }

        const draftRes = await getCreatePredictionDraftUseCase().execute(
          config.max_drafts_per_run,
          { ignoreCap: true }
        );
        if (isFailure(draftRes)) {
          logs.push(`[게임 초안] 실패: ${draftRes.error.message}`);
        } else {
          logs.push(
            `[게임 초안] ${draftRes.data.draftsCreated}개 예측 게임 생성`
          );
          if (Array.isArray(draftRes.data.logs)) {
            logs.push(...draftRes.data.logs);
          }
          summary.draftsCreated = draftRes.data.draftsCreated;
        }
      };

      const runTemplateSync = async () => {
        const scheduler = getMasterScheduler(getCreatePredictionGameUseCase());
        const syncRes = await scheduler.triggerSync({
          materializeTemplates: body.materializeTemplates ?? true,
          category: body.category,
          force: body.force ?? false,
          ignoreCap: true,
          backfillMissingBriefings: config.auto_briefing_enabled,
        });
        logs.push(
          `[정기/외부 동기화] 템플릿=${syncRes.totalTemplates}, 축구=${syncRes.footballAdded}, 실적=${syncRes.earningsAdded}, 신규발행=${syncRes.createdGameIds.length}, 브리핑보강=${syncRes.backfilledBriefings}`
        );
        summary.templateCreatedCount = syncRes.createdGameIds.length;
        summary.footballAdded = syncRes.footballAdded;
        summary.earningsAdded = syncRes.earningsAdded;
        summary.backfilledBriefings = syncRes.backfilledBriefings;
      };

      const runCloseExpired = async () => {
        const { data: closedRes, error: closeErr } = await supabaseAdmin
          .schema("prediction")
          .rpc("close_expired_games");
        if (closeErr) {
          logs.push(`[만료 마감] 오류: ${closeErr.message}`);
        } else {
          const closedCount = Number(closedRes ?? 0);
          logs.push(`[만료 마감] ACTIVE → CLOSED 전환: ${closedCount}건`);
          summary.closedCount = closedCount;
        }
      };

      const runOracleSettle = async () => {
        // 마감 누락으로 인한 정산 지연을 막기 위해 먼저 close_expired_games 실행
        await runCloseExpired();

        let billSettledCount = 0;
        const billRes = await getAutoSettleByBillUseCase().execute();
        if (billRes.success) {
          billSettledCount = billRes.data.settledGamesCount;
          logs.push(`[의안 정산] 정산 완료: ${billSettledCount}건`);
          logs.push(...billRes.data.logs);
        } else {
          logs.push(
            `[의안 정산] 경고: ${(billRes as { error?: { message?: string } }).error?.message ?? "실패"}`
          );
        }

        const oracleRes =
          await settlementOrchestrator.runScheduledAutoSettlements();
        logs.push(
          `[오라클 정산] 검사=${oracleRes.checkedSourcesCount}건, 정산=${oracleRes.settledCount}건, 스킵=${oracleRes.skippedCount}건, 배당=${oracleRes.totalRewardDistributed.toLocaleString()} PMC`
        );
        logs.push(...oracleRes.logs);

        summary.settledCount = billSettledCount + oracleRes.settledCount;
        summary.totalRewardDistributed = oracleRes.totalRewardDistributed;
      };

      if (step === "rss-draft") {
        await runRssDraft();
      } else if (step === "template-sync") {
        await runTemplateSync();
      } else if (step === "close-expired") {
        await runCloseExpired();
      } else if (step === "oracle-settle") {
        await runOracleSettle();
      } else {
        await runRssDraft();
        await runTemplateSync();
        await runOracleSettle();
      }

      await schedulerConfigService.recordSchedulerRun(
        `manual-${step}`,
        summary,
        true
      );

      return NextResponse.json({
        success: true,
        step,
        logs,
        summary,
      });
    }

    if (action === "reset-games") {
      const includeSettled = body.includeSettled ?? true;
      const forceWithBets = body.forceWithBets ?? false;

      const { count: betCount, error: betErr } = await supabaseAdmin
        .schema("prediction")
        .from("predictions")
        .select("*", { count: "exact", head: true });

      if (betErr) {
        return NextResponse.json(
          { success: false, error: `베팅 조회 오류: ${betErr.message}` },
          { status: 500 }
        );
      }

      if ((betCount ?? 0) > 0 && !forceWithBets) {
        return NextResponse.json(
          {
            success: false,
            requiresForce: true,
            betCount,
            error: `실제 참여 베팅 내역(${betCount}건)이 있어 안전을 위해 차단되었습니다. forceWithBets=true 옵션으로만 삭제할 수 있습니다.`,
          },
          { status: 409 }
        );
      }

      const countQuery = supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select("*", { count: "exact", head: true });

      const { count: beforeCount } = includeSettled
        ? await countQuery
        : await countQuery.neq("status", "SETTLED");

      const deleteQuery = supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .delete();

      const { error: delErr } = includeSettled
        ? await deleteQuery.neq("game_id", "00000000-0000-0000-0000-000000000000")
        : await deleteQuery.neq("status", "SETTLED");

      if (delErr) {
        return NextResponse.json(
          { success: false, error: `예측게임 삭제 오류: ${delErr.message}` },
          { status: 500 }
        );
      }

      const deletedCount = beforeCount ?? 0;
      await schedulerConfigService.recordSchedulerRun(
        "manual-reset-games",
        { deletedCount, includeSettled, betCount: betCount ?? 0 },
        true
      );

      return NextResponse.json({
        success: true,
        deletedCount,
        logs: [
          `[초기화 완료] prediction.prediction_games ${deletedCount}건 삭제됨 (연관 정산소스·스냅샷 CASCADE 정리)`,
        ],
      });
    }

    if (action === "sample-publish") {
      const targetTemplateIds =
        Array.isArray(body.templateIds) && body.templateIds.length > 0
          ? body.templateIds
          : [
              "us-nasdaq-daily",
              "ranking-global-asset-weekly",
              "ecos-bok-base-rate",
            ];
      const rssDraftCount = Math.max(0, Math.min(10, Number(body.rssDraftCount ?? 2)));
      const logs: string[] = [];
      const createdGameIds: string[] = [];

      const scheduler = getMasterScheduler(getCreatePredictionGameUseCase());
      for (const tid of targetTemplateIds) {
        const res = await scheduler.triggerSync({
          templateId: tid,
          force: true,
          ignoreCap: true,
          materializeTemplates: true,
        });
        if (res.createdGameIds.length > 0) {
          createdGameIds.push(...res.createdGameIds);
          logs.push(`[템플릿 발행] ${tid} -> ${res.createdGameIds.join(", ")}`);
        } else {
          logs.push(`[템플릿 스킵] ${tid} -> 생성 없음`);
        }
      }

      if (rssDraftCount > 0) {
        const config = await schedulerConfigService.getSchedulerConfig();
        const classifyRes = await getClassifyContentUseCase().execute(
          Math.max(config.rss_classify_batch_size, 25)
        );
        if (isFailure(classifyRes)) {
          logs.push(`[RSS AI 분류] 실패: ${classifyRes.error.message}`);
        } else {
          logs.push(
            `[RSS AI 분류] 처리=${classifyRes.data.processed}, 예측=${classifyRes.data.predictions}, 포럼=${classifyRes.data.forums}`
          );
        }

        const draftRes = await getCreatePredictionDraftUseCase().execute(
          rssDraftCount,
          { ignoreCap: true }
        );
        if (isFailure(draftRes)) {
          logs.push(`[RSS AI 초안] 실패: ${draftRes.error.message}`);
        } else {
          logs.push(`[RSS AI 초안] ${draftRes.data.draftsCreated}건 생성`);
          if (Array.isArray(draftRes.data.logs)) {
            logs.push(...draftRes.data.logs);
          }
        }
      }

      await schedulerConfigService.recordSchedulerRun(
        "manual-sample-publish",
        {
          templateCreatedCount: createdGameIds.length,
          rssDraftCount,
        },
        true
      );

      return NextResponse.json({
        success: true,
        createdTemplateGameIds: createdGameIds,
        logs,
      });
    }

    return NextResponse.json(
      { success: false, error: `지원하지 않는 action입니다: ${String(action)}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
