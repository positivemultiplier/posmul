import { NextRequest, NextResponse } from "next/server";

import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import type { SettlementSourceType } from "@/bounded-contexts/prediction/domain/value-objects/settlement-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export const dynamic = "force-dynamic";

interface OracleAssistBody {
  action?: string;
  gameId?: string;
  sourceType?: SettlementSourceType;
  sourceConfig?: Record<string, unknown>;
  title?: string;
  description?: string;
  options?: Array<{ id?: string; label?: string } | string>;
  verifiedValue?: number;
  verifiedOptionId?: string;
}

function normalizeGameOptions(
  raw: unknown
): Array<{ id: string; label: string }> {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { options?: unknown[] }).options)
      ? (raw as { options: unknown[] }).options
      : [];

  if (list.length === 0) {
    return [
      { id: "yes", label: "예 (Yes)" },
      { id: "no", label: "아니오 (No)" },
    ];
  }

  return list.map((item, idx) => {
    if (typeof item === "string") {
      return { id: idx === 0 ? "yes" : idx === 1 ? "no" : `opt_${idx}`, label: item };
    }
    const obj = item as Record<string, unknown>;
    return {
      id: String(obj.id || obj.value || `opt_${idx}`),
      label: String(obj.label || obj.text || obj.title || obj.id || `옵션 ${idx + 1}`),
    };
  });
}

async function handlePreview(body: OracleAssistBody): Promise<NextResponse> {
  const sourceType = (body.sourceType || "rss_ai") as SettlementSourceType;
  const normalizedOptions = normalizeGameOptions(body.options);

  const preview = await settlementOrchestrator.previewOracleResult({
    id: "preview",
    gameId: body.gameId || "preview",
    sourceType,
    sourceConfig: {
      ...(body.sourceConfig || {}),
      title: body.title || (body.sourceConfig?.title as string) || "",
      resolutionCriteria:
        body.description ||
        (body.sourceConfig?.resolutionCriteria as string) ||
        "",
      options: normalizedOptions,
    },
  });

  return NextResponse.json({
    success: true,
    sourceType,
    preview,
  });
}

async function handleSuggestSettlement(body: OracleAssistBody): Promise<NextResponse> {
  if (!body.gameId) {
    return NextResponse.json(
      { success: false, error: "gameId가 필요합니다." },
      { status: 400 }
    );
  }

  const { data: game, error: gameErr } = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .select("game_id, title, description, game_options, data_source, settlement_type")
    .eq("game_id", body.gameId)
    .maybeSingle();

  if (gameErr || !game) {
    return NextResponse.json(
      { success: false, error: "대상 게임을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data: sourceRow } = await supabaseAdmin
    .schema("prediction")
    .from("settlement_sources")
    .select("*")
    .eq("game_id", body.gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const normalizedOptions = normalizeGameOptions(game.game_options);
  const useRegistered =
    sourceRow && sourceRow.source_type && sourceRow.source_type !== "manual";

  const targetSourceType: SettlementSourceType = useRegistered
    ? (sourceRow.source_type as SettlementSourceType)
    : "rss_ai";

  const baseConfig =
    useRegistered && sourceRow.source_config
      ? (sourceRow.source_config as Record<string, unknown>)
      : {};

  const preview = await settlementOrchestrator.previewOracleResult({
    id: sourceRow?.id ? String(sourceRow.id) : "adhoc-rss-suggest",
    gameId: body.gameId,
    sourceType: targetSourceType,
    externalId: sourceRow?.external_id ? String(sourceRow.external_id) : undefined,
    sourceConfig: {
      ...baseConfig,
      title: baseConfig.title || game.title,
      resolutionCriteria: baseConfig.resolutionCriteria || game.description,
      options: baseConfig.options || normalizedOptions,
    },
  });

  // 공식 오라클이 아직 미정일 때 RSS 뉴스 보조 확인도 함께 실행 가능하도록 결과 반환
  return NextResponse.json({
    success: true,
    gameId: body.gameId,
    sourceType: targetSourceType,
    usedFallbackRss: !useRegistered,
    preview,
  });
}

async function handlePingAdapters(): Promise<NextResponse> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [coinGeckoPing, rssCountRes, overdueSourcesRes] = await Promise.all([
    fetch("https://api.coingecko.com/api/v3/ping")
      .then((r) => ({ ok: r.ok, status: r.status }))
      .catch(() => ({ ok: false, status: 0 })),
    supabaseAdmin
      .schema("feed")
      .from("items")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabaseAdmin
      .schema("prediction")
      .from("settlement_sources")
      .select("id, game_id, source_type, scheduled_at")
      .lte("scheduled_at", nowIso),
  ]);

  const overdueRows = overdueSourcesRes.data || [];
  let overduePendingGames = 0;

  if (overdueRows.length > 0) {
    const gameIds = overdueRows.map((r) => String(r.game_id));
    const { data: activeOverdue } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id")
      .in("game_id", gameIds)
      .in("status", ["ACTIVE", "CLOSED"]);
    overduePendingGames = activeOverdue?.length ?? 0;
  }

  return NextResponse.json({
    success: true,
    checkedAt: nowIso,
    checks: {
      coinGeckoOk: coinGeckoPing.ok,
      recentRssItems7d: rssCountRes.count ?? 0,
      overdueSourcesCount: overdueRows.length,
      overduePendingGames,
      llmConfigured: Boolean(
        process.env.GOOGLE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          process.env.EXAONE_API_KEY
      ),
    },
  });
}

async function handleSaveKContentVerdict(body: OracleAssistBody): Promise<NextResponse> {
  if (!body.gameId) {
    return NextResponse.json(
      { success: false, error: "gameId가 필요합니다." },
      { status: 400 }
    );
  }

  const { data: sourceRow } = await supabaseAdmin
    .schema("prediction")
    .from("settlement_sources")
    .select("*")
    .eq("game_id", body.gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sourceRow) {
    return NextResponse.json(
      { success: false, error: "등록된 오라클 소스가 없습니다." },
      { status: 404 }
    );
  }

  const nextConfig = {
    ...((sourceRow.source_config as Record<string, unknown>) || {}),
    ...(typeof body.verifiedValue === "number" ? { verifiedValue: body.verifiedValue } : {}),
    ...(body.verifiedOptionId ? { verifiedOptionId: body.verifiedOptionId } : {}),
  };

  await supabaseAdmin
    .schema("prediction")
    .from("settlement_sources")
    .update({
      source_config: nextConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceRow.id);

  const settleExec = await settlementOrchestrator.executeAutoSettlement({
    id: String(sourceRow.id),
    gameId: body.gameId,
    sourceType: sourceRow.source_type as SettlementSourceType,
    sourceConfig: nextConfig,
    scheduledAt: sourceRow.scheduled_at ? new Date(sourceRow.scheduled_at) : undefined,
  });

  return NextResponse.json({
    success: settleExec.success,
    error: settleExec.error,
    result: settleExec.result,
    rewardDistributed: settleExec.rewardDistributed ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as OracleAssistBody;

    switch (body.action) {
      case "preview":
        return await handlePreview(body);
      case "suggest-settlement":
        return await handleSuggestSettlement(body);
      case "ping-adapters":
        return await handlePingAdapters();
      case "save-kcontent-verdict":
        return await handleSaveKContentVerdict(body);
      default:
        return NextResponse.json(
          { success: false, error: "지원하지 않는 action입니다." },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Oracle assist error",
      },
      { status: 500 }
    );
  }
}

