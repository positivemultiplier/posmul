import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getKstHourStartIso } from "@/shared/utils/time/getKstHourStartIso";
import { getAggregatedPrizePool } from "@/bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapGameOptions,
  mapPredictionGameRowToCardModel,
  type PredictionGameCardModel,
  type PredictionGameRow,
} from "./prediction-game-mapper";
import { computeBayesianPosteriorTimeline } from "@/bounded-contexts/prediction/domain/services/collective-intelligence-engine";
import { resolveBriefingMode } from "@/bounded-contexts/prediction/application/services/balanced-briefing.service";
import type { BalancedBriefingDTO } from "@/bounded-contexts/prediction/domain/value-objects/briefing.types";
import type {
  AiForecastDTO,
  AiProviderKey,
  AiProviderStats,
  AiRecentFormItem,
} from "@/bounded-contexts/prediction/domain/value-objects/ai-forecast.types";

export interface CachedActivePredictionFeed {
  platformTotalPool: number;
  mappedGames: PredictionGameCardModel[];
}

export interface CachedPublicBetRow {
  prediction_id: string;
  user_id: string;
  bet_amount: number | string | null;
  confidence_level: number | string | null;
  prediction_data: Record<string, unknown> | null;
  created_at: string;
}

export interface CachedPredictionDetailPublicData {
  dbGame: Record<string, unknown> & PredictionGameRow;
  stats: {
    total_bet_amount?: number | string | null;
    total_participants?: number | string | null;
  } | null;
  hourlyWavePool: number;
  betsData: CachedPublicBetRow[];
  initialChartData: Array<{ time: string; [key: string]: string | number }>;
  liveMsgCount: number;
  liveChallengeCount: number;
  initialBriefing: BalancedBriefingDTO | null;
  initialForecasts: AiForecastDTO[] | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMY: "경제",
  INVEST: "투자",
  SPORTS: "스포츠",
  ENTERTAINMENT: "엔터",
  POLITICS: "정치",
  USER_PROPOSED: "제안",
  CONSUME: "소비",
};

function sampleChartPoints(
  points: Array<{ time: string; [key: string]: string | number }>,
  maxPoints = 100
) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, idx) => idx % step === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) {
    sampled.push(last);
  }
  return sampled;
}

function buildChartFromSnapshots(
  snapshots: Array<{ snapshot_time: string; option_id: string; probability: number }>,
  options: Array<{ id: string }>
): Array<{ time: string; [key: string]: string | number }> {
  const timeGroups = new Map<string, { time: string; [key: string]: string | number }>();

  for (const snap of snapshots) {
    const time = new Date(snap.snapshot_time).toLocaleTimeString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!timeGroups.has(snap.snapshot_time)) {
      const point: { time: string; [key: string]: string | number } = { time };
      options.forEach((opt) => {
        point[opt.id] = 0;
      });
      timeGroups.set(snap.snapshot_time, point);
    }

    const point = timeGroups.get(snap.snapshot_time)!;
    point[snap.option_id] = Number(snap.probability);
  }

  return sampleChartPoints(Array.from(timeGroups.values()));
}

function buildChartFromBets(
  bets: CachedPublicBetRow[],
  options: Array<{ id: string }>
): Array<{ time: string; [key: string]: string | number }> {
  if (bets.length === 0) return [];

  const signals = bets
    .map((bet) => {
      const pData = bet.prediction_data as { selectedOptionId?: string } | null;
      if (!pData?.selectedOptionId) return null;
      const rawConf = Number(bet.confidence_level);
      const normalizedConf = Number.isFinite(rawConf)
        ? rawConf > 1
          ? rawConf / 100
          : rawConf
        : 0.5;
      return {
        selectedOptionId: pData.selectedOptionId,
        stakeAmount: Number(bet.bet_amount) || 100,
        confidence: normalizedConf,
        createdAt: bet.created_at,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (signals.length === 0) return [];

  const points = computeBayesianPosteriorTimeline(
    options.map((opt) => ({ id: opt.id, label: opt.id })),
    signals
  );

  return sampleChartPoints(points);
}

function extractValidCachedBriefing(
  metadata: unknown,
  predictionType: unknown,
  optionCount: number
): BalancedBriefingDTO | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as { briefing?: Partial<BalancedBriefingDTO> }).briefing;
  if (!raw || raw.version !== 2) return null;
  const expectedMode = resolveBriefingMode(
    typeof predictionType === "string" ? predictionType : null,
    optionCount
  );
  if (raw.mode !== expectedMode) return null;
  if (!Array.isArray(raw.scenarios) || raw.scenarios.length !== optionCount) {
    return null;
  }
  return raw as BalancedBriefingDTO;
}

function buildAiProviderStats(
  providerKey: AiProviderKey,
  targetCategory: string,
  history: Array<{
    game_id: string;
    provider_key: string;
    category: string;
    is_hit: boolean;
    settled_at: string;
  }>
): AiProviderStats {
  const providerRows = history.filter((h) => h.provider_key === providerKey);
  const categoryRows = providerRows.filter(
    (h) => h.category.toUpperCase() === targetCategory.toUpperCase()
  );

  const useCategory = categoryRows.length > 0;
  const chosenRows = useCategory ? categoryRows : providerRows;
  const categoryLabel =
    CATEGORY_LABELS[targetCategory.toUpperCase()] ?? targetCategory;

  if (chosenRows.length === 0) {
    return {
      scope: "none",
      categoryLabel,
      settledCount: 0,
      hitCount: 0,
      hitRatePct: null,
      recentForm: [],
    };
  }

  const hitCount = chosenRows.filter((r) => r.is_hit).length;
  const recentForm: AiRecentFormItem[] = chosenRows.slice(0, 5).map((r) => ({
    gameId: r.game_id,
    isHit: Boolean(r.is_hit),
    settledAt: r.settled_at,
  }));

  return {
    scope: useCategory ? "category" : "overall",
    categoryLabel: useCategory ? categoryLabel : "전체",
    settledCount: chosenRows.length,
    hitCount,
    hitRatePct: Math.round((hitCount / chosenRows.length) * 100),
    recentForm,
  };
}

/**
 * 공개 활성 예측 게임 목록 + MoneyWave 총풀 15초 서버 캐시
 * (쿠키/개인정보 미포함 — 모든 유저에게 동일한 공개 마켓 데이터만 캐싱)
 */
export const getCachedActivePredictionFeed = unstable_cache(
  async (): Promise<CachedActivePredictionFeed> => {
    const [platformTotalPool, recentGamesResult] = await Promise.all([
      getAggregatedPrizePool(supabaseAdmin),
      supabaseAdmin
        .schema("prediction")
        .from("prediction_games")
        .select(
          "game_id, slug, category, subcategory, league, data_source, title, description, prediction_type, game_options, registration_start, registration_end, settlement_date, min_bet_amount, max_bet_amount, max_participants, status, difficulty, created_at, metadata"
        )
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (recentGamesResult.error) {
      return { platformTotalPool, mappedGames: [] };
    }

    const recentGameRows = (recentGamesResult.data ?? []) as PredictionGameRow[];
    const rowsWithPools = await attachHourlyGamePoolsToRows(
      supabaseAdmin,
      recentGameRows
    );

    return {
      platformTotalPool,
      mappedGames: rowsWithPools.map(mapPredictionGameRowToCardModel),
    };
  },
  ["posmul-prediction-active-feed-v1"],
  { revalidate: 15, tags: ["prediction-feed"] }
);

async function fetchGameBySlugOrId(
  decodedSlug: string
): Promise<(Record<string, unknown> & PredictionGameRow) | null> {
  const slugRes = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("slug", decodedSlug)
    .maybeSingle();

  if (slugRes.error) return null;
  if (slugRes.data) {
    return slugRes.data as Record<string, unknown> & PredictionGameRow;
  }

  const byIdRes = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("game_id", decodedSlug)
    .maybeSingle();

  if (byIdRes.error || !byIdRes.data) return null;
  return byIdRes.data as Record<string, unknown> & PredictionGameRow;
}

async function resolveInitialAiForecasts(
  aiRows: Array<{
    provider_key: string;
    provider_label: string;
    model_name: string;
    selected_option_id: string;
    selected_option_label: string;
    confidence_pct: number;
    reasoning: string;
    is_hit: boolean | null;
    brier_score: number | null;
    created_at: string;
  }>,
  category: unknown
): Promise<AiForecastDTO[] | null> {
  if (aiRows.length === 0) return null;

  const providerKeys = Array.from(
    new Set(aiRows.map((r) => r.provider_key as AiProviderKey))
  );
  const historyRes = await supabaseAdmin
    .schema("prediction")
    .from("ai_forecasts")
    .select("game_id, provider_key, category, is_hit, settled_at")
    .in("provider_key", providerKeys)
    .not("is_hit", "is", null)
    .not("settled_at", "is", null)
    .order("settled_at", { ascending: false })
    .limit(200);

  const history = (historyRes.data ?? []) as Array<{
    game_id: string;
    provider_key: string;
    category: string;
    is_hit: boolean;
    settled_at: string;
  }>;
  const targetCategory = String(category ?? "GENERAL").toUpperCase();

  return aiRows.map((row) => ({
    providerKey: row.provider_key as AiProviderKey,
    providerLabel: row.provider_label,
    modelName: row.model_name,
    selectedOptionId: row.selected_option_id,
    selectedOptionLabel: row.selected_option_label,
    confidencePct: row.confidence_pct,
    reasoning: row.reasoning,
    isHit: row.is_hit,
    brierScore: row.brier_score,
    createdAt: row.created_at,
    stats: buildAiProviderStats(
      row.provider_key as AiProviderKey,
      targetCategory,
      history
    ),
  }));
}

/**
 * 공개 예측 상세 데이터 15초 서버 캐시
 * - 중복 predictions 스캔 3회 -> 1회 통합
 * - 미사용 tailChallenges 조회 제거
 * - DB 캐시된 AI 브리핑(metadata.briefing) 및 AI 예측(ai_forecasts) SSR 즉시 포함
 */
export const getCachedPredictionDetailPublicData = unstable_cache(
  async (decodedSlug: string): Promise<CachedPredictionDetailPublicData | null> => {
    const gameRow = await fetchGameBySlugOrId(decodedSlug);
    if (!gameRow) return null;

    const parsedOptions = mapGameOptions(gameRow.game_options, gameRow.game_id);
    const hourStart = getKstHourStartIso();
    const roomLookupKeys = Array.from(
      new Set(
        [gameRow.slug, gameRow.game_id].filter((v): v is string => Boolean(v))
      )
    );

    // 2단계: 모든 공개 부가 데이터를 단일 병렬 배치로 조회 (predictions 테이블 단 1회 조회)
    const [
      statsRes,
      hourlyPoolRes,
      betsRes,
      snapshotsRes,
      liveMsgRes,
      liveChallengeRes,
      aiForecastsRes,
    ] = await Promise.all([
      supabaseAdmin
        .schema("prediction")
        .from("prediction_statistics")
        .select("total_bet_amount, total_participants")
        .eq("game_id", gameRow.game_id)
        .maybeSingle(),
      supabaseAdmin
        .schema("economy")
        .from("money_wave_hourly_game_pools")
        .select("pool_pmc")
        .eq("domain", "prediction")
        .eq("hour_start", hourStart)
        .eq("game_id", gameRow.game_id)
        .maybeSingle(),
      supabaseAdmin
        .schema("prediction")
        .from("predictions")
        .select(
          "prediction_id, user_id, bet_amount, confidence_level, prediction_data, created_at"
        )
        .eq("game_id", gameRow.game_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .schema("prediction")
        .from("game_snapshots")
        .select("snapshot_time, option_id, probability")
        .eq("game_id", gameRow.game_id)
        .order("snapshot_time", { ascending: true }),
      supabaseAdmin
        .schema("forum")
        .from("live_room_messages")
        .select("id", { count: "exact", head: true })
        .in("room_id", roomLookupKeys),
      supabaseAdmin
        .schema("prediction")
        .from("user_challenges")
        .select("id", { count: "exact", head: true })
        .eq("linked_game_id", gameRow.game_id)
        .like("title", "[LIVE]%"),
      supabaseAdmin
        .schema("prediction")
        .from("ai_forecasts")
        .select(
          "forecast_id, game_id, provider_key, provider_label, model_name, category, selected_option_id, selected_option_label, confidence_pct, reasoning, is_hit, brier_score, settled_at, created_at"
        )
        .eq("game_id", gameRow.game_id)
        .order("created_at", { ascending: true }),
    ]);

    const betsData = (betsRes.data ?? []) as CachedPublicBetRow[];
    const snapshots = (snapshotsRes.data ?? []) as Array<{
      snapshot_time: string;
      option_id: string;
      probability: number;
    }>;

    // 스냅샷이 있으면 스냅샷 사용, 없으면 이미 조회한 betsData로 메모리 내 즉시 계산 (추가 DB 왕복 0회)
    const optionIds = parsedOptions.map((o) => ({ id: o.id }));
    const initialChartData =
      snapshots.length > 0
        ? buildChartFromSnapshots(snapshots, optionIds)
        : buildChartFromBets(betsData, optionIds);

    const hourlyWavePoolRaw = Number(
      (hourlyPoolRes.data as { pool_pmc?: number | string | null } | null)
        ?.pool_pmc ?? 0
    );
    const hourlyWavePool = Number.isFinite(hourlyWavePoolRaw)
      ? hourlyWavePoolRaw
      : 0;

    // 이미 DB에 저장된 v2 AI 브리핑 즉시 추출 (클라이언트 Server Action 왕복 제거)
    const initialBriefing = extractValidCachedBriefing(
      gameRow.metadata,
      gameRow.prediction_type,
      parsedOptions.length
    );

    // 이미 DB에 저장된 AI 예측 스냅샷이 있으면 정산 성적까지 합쳐 SSR 즉시 전달
    const aiRows = (aiForecastsRes.data ?? []) as Array<{
      provider_key: string;
      provider_label: string;
      model_name: string;
      selected_option_id: string;
      selected_option_label: string;
      confidence_pct: number;
      reasoning: string;
      is_hit: boolean | null;
      brier_score: number | null;
      created_at: string;
    }>;
    const initialForecasts = await resolveInitialAiForecasts(
      aiRows,
      gameRow.category
    );

    return {
      dbGame: gameRow,
      stats: (statsRes.data as CachedPredictionDetailPublicData["stats"]) ?? null,
      hourlyWavePool,
      betsData,
      initialChartData,
      liveMsgCount: liveMsgRes.count ?? 0,
      liveChallengeCount: liveChallengeRes.count ?? 0,
      initialBriefing,
      initialForecasts,
    };
  },
  ["posmul-prediction-detail-public-v1"],
  { revalidate: 15, tags: ["prediction-detail"] }
);
