import { NextRequest, NextResponse } from "next/server";

import { balancedBriefingService } from "@/bounded-contexts/prediction/application/services/balanced-briefing.service";
import { settlementOrchestrator } from "@/bounded-contexts/prediction/application/services/settlement-orchestrator.service";
import { resolveNormalizedRegion } from "@/bounded-contexts/prediction/domain/value-objects/region-hierarchy";
import type { SettlementSourceType } from "@/bounded-contexts/prediction/domain/value-objects/settlement-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

interface CreateGameBody {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  options?: Array<string | { id?: string; label?: string }>;
  minBetAmount?: number;
  maxBetAmount?: number;
  registrationEnd?: string;
  settlementDate?: string;
  sourceType?: SettlementSourceType;
  sourceConfig?: Record<string, unknown>;
  externalId?: string;
  autoGenerateBriefing?: boolean;
  regionLevel?: string;
  regionCode?: string;
  regionName?: string;
}

function buildStructuredOptions(
  rawOptions: Array<string | { id?: string; label?: string }>
): Array<{ id: string; label: string }> {
  return rawOptions.map((opt, idx) => {
    if (typeof opt === "string") {
      const label = opt.trim();
      const id =
        rawOptions.length === 2
          ? idx === 0
            ? "yes"
            : "no"
          : `opt_${idx}`;
      return { id, label };
    }
    const label = String(opt.label || opt.id || `옵션 ${idx + 1}`).trim();
    const id = String(
      opt.id ||
        (rawOptions.length === 2 ? (idx === 0 ? "yes" : "no") : `opt_${idx}`)
    );
    return { id, label };
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as CreateGameBody;
    const {
      title,
      description,
      category,
      subcategory,
      options,
      minBetAmount,
      maxBetAmount,
      registrationEnd,
      settlementDate,
      sourceType = "manual",
      sourceConfig = {},
      externalId,
      autoGenerateBriefing = true,
      regionLevel,
      regionCode,
      regionName,
    } = body;

    const cleanTitle = (title || "").trim();
    if (!cleanTitle || cleanTitle.length < 10 || cleanTitle.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "제목은 10자 이상 200자 이하로 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    if (!options || options.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "최소 2개의 선택지가 필요합니다.",
        },
        { status: 400 }
      );
    }

    let safeDescription = (description || "").trim();
    if (safeDescription.length < 20) {
      const base = safeDescription || cleanTitle;
      safeDescription = `${base} — 공식 데이터 오라클 및 PosMul 운영 원칙에 따라 최종 승부 결과가 정산됩니다.`;
    }
    if (safeDescription.length > 2000) {
      safeDescription = safeDescription.slice(0, 2000);
    }

    const structuredOptions = buildStructuredOptions(options);
    const predictionType =
      structuredOptions.length === 2 ? "BINARY" : "MULTIPLE_CHOICE";

    const slug = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const creatorId =
      auth.authType === "admin"
        ? auth.user.id
        : "00000000-0000-0000-0000-000000000001";

    const regEndIso =
      registrationEnd ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const settleIso =
      settlementDate ||
      new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();

    if (new Date(settleIso).getTime() <= new Date(regEndIso).getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "정산 예정일은 예측 참여 마감일 이후로 설정해야 합니다.",
        },
        { status: 400 }
      );
    }

    const hasOracle = sourceType !== "manual";
    const settlementType =
      sourceType === "manual"
        ? "manual"
        : sourceType === "rss_ai" || sourceType === "kcontent"
          ? "semi_auto"
          : "auto";

    const nowIso = new Date().toISOString();
    const normalizedRegion = resolveNormalizedRegion({
      regionLevel,
      regionCode,
      regionName,
      title: cleanTitle,
      summary: safeDescription,
    });

    const { data: newGame, error } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .insert({
        title: cleanTitle,
        description: safeDescription,
        status: "ACTIVE",
        category: category || "POLITICS",
        subcategory: subcategory?.trim() || null,
        creator_id: creatorId,
        prediction_type: predictionType,
        game_options: { options: structuredOptions },
        registration_start: nowIso,
        registration_end: regEndIso,
        settlement_date: settleIso,
        min_bet_amount: Number(minBetAmount) || 100,
        max_bet_amount: Number(maxBetAmount) || 10000,
        difficulty: 1.0,
        settlement_type: settlementType,
        data_source: hasOracle ? sourceType : null,
        external_id: externalId?.trim() || null,
        is_official: hasOracle,
        slug,
        metadata: {
          source: "admin",
          regionLevel: normalizedRegion.regionLevel,
          regionCode: normalizedRegion.regionCode,
          regionName: normalizedRegion.regionName,
        },
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();

    if (error || !newGame) {
      return NextResponse.json(
        { success: false, error: error?.message || "게임 생성 실패" },
        { status: 500 }
      );
    }

    const createdGameId = String(newGame.game_id);
    let oracleRegistered = false;
    let briefingGenerated = false;

    if (hasOracle) {
      const mergedConfig: Record<string, unknown> = {
        ...sourceConfig,
        title: title.trim(),
        resolutionCriteria: (description || title).trim(),
        options: structuredOptions,
        optionMapping:
          (sourceConfig.optionMapping as Record<string, string> | undefined) ?? {
            above: structuredOptions[0].id,
            below: structuredOptions[1].id,
            up: structuredOptions[0].id,
            down: structuredOptions[1].id,
            yes: structuredOptions[0].id,
            no: structuredOptions[1].id,
          },
      };

      oracleRegistered = await settlementOrchestrator.registerSettlementSource({
        gameId: createdGameId,
        sourceType,
        sourceConfig: mergedConfig,
        scheduledAt: new Date(settleIso),
        externalId: externalId?.trim() || undefined,
      });
    }

    if (autoGenerateBriefing) {
      try {
        await balancedBriefingService.getOrCreateForGameId(createdGameId, {
          timeoutMs: 12000,
        });
        briefingGenerated = true;
      } catch {
        briefingGenerated = false;
      }
    }

    return NextResponse.json({
      success: true,
      game: newGame,
      oracleRegistered,
      briefingGenerated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
