import { notFound } from "next/navigation";

import { PredictionDetailTabsClient } from "./PredictionDetailTabsClient";

import { createClient } from "../../../lib/supabase/server";

import {
  getPredictionGameBySlug,
  getPredictionGameStats,
  parseGameOptions,
} from "../../../bounded-contexts/public/infrastructure/repositories/prediction.repository";

import { getUserBalance, getUserBets } from "../sports/soccer/[slug]/actions";

import { getKstHourStartIso } from "../../../shared/utils/time/getKstHourStartIso";

import { getGameHistory, type ChartDataPoint } from "../../../bounded-contexts/prediction/infrastructure/repositories/get-game-history";

type MoneyWaveCategory = "sports" | "politics" | "entertainment" | "economy" | "all";

type PredictionTypeView = "binary" | "wdl" | "ranking";

const DEFAULT_OPTIONS: ReadonlyArray<{ id: string; label: string; currentOdds: number }> = [
  { id: "yes", label: "예", currentOdds: 0.55 },
  { id: "no", label: "아니오", currentOdds: 0.45 },
];

function normalizeLowerOrAll(value: unknown): string {
  if (typeof value !== "string") return "all";
  return value.trim().toLowerCase() || "all";
}

function mapPredictionType(value: unknown): PredictionTypeView {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "binary") return "binary";
  if (normalized === "win_draw_lose" || normalized === "wdl") return "wdl";
  return "ranking";
}

function mapStatus(value: unknown): "ACTIVE" | "ENDED" | "SETTLED" {
  if (value === "ACTIVE") return "ACTIVE";
  if (value === "CLOSED") return "ENDED";
  if (value === "SETTLED") return "SETTLED";
  return "ACTIVE";
}

function toIsoOrFallback(value: unknown, fallbackMsFromNow: number): string {
  if (typeof value === "string" || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return new Date(Date.now() + fallbackMsFromNow).toISOString();
}

function getPrizePool(params: { game: unknown; totalBetAmount?: number }): number {
  const prizePool = (params.game as { allocated_prize_pool?: unknown }).allocated_prize_pool;
  if (typeof prizePool === "number" && Number.isFinite(prizePool)) return prizePool;
  if (typeof prizePool === "string" && prizePool.trim() !== "") {
    const parsed = Number(prizePool);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof params.totalBetAmount === "number") return Math.floor(params.totalBetAmount * 0.5);
  return 0;
}

type HourlyGamePoolRow = { pool_pmc: number | string | null };

const toFiniteNumberOrNull = (value: number | string | null): number | null => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

const fetchHourlyGamePrizePool = async (params: {
  gameId: string;
}): Promise<number | null> => {
  const supabase = await createClient();
  const hourStart = getKstHourStartIso();

  const { data, error } = await supabase
    .schema("economy")
    .from("money_wave_hourly_game_pools")
    .select("pool_pmc")
    .eq("domain", "prediction")
    .eq("hour_start", hourStart)
    .eq("game_id", params.gameId)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const value = toFiniteNumberOrNull((data[0] as HourlyGamePoolRow).pool_pmc);
  return value === null ? null : Math.floor(value);
};

const mapDbCategoryToMoneyWave = (value: unknown): MoneyWaveCategory => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  switch (normalized) {
    case "SPORTS":
      return "sports";
    case "POLITICS":
      return "politics";
    case "ENTERTAINMENT":
      return "entertainment";
    case "INVEST":
      return "economy";
    case "USER_PROPOSED":
      return "all";
    default:
      return "all";
  }
};

export async function renderPredictionDetailBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  const game = await getPredictionGameBySlug(decodedSlug);
  if (!game) notFound();

  const truthPrizePool = await fetchHourlyGamePrizePool({ gameId: game.game_id });

  const stats = await getPredictionGameStats(game.game_id);
  const options = parseGameOptions(game.game_options);

  const balanceResult = await getUserBalance();
  const userBalance = balanceResult ?? { pmp: 0, pmc: 0 };

  const gameOptions = options.length > 0 ? options : DEFAULT_OPTIONS;

  const subcategory = normalizeLowerOrAll((game as unknown as { subcategory?: unknown }).subcategory);
  const league = normalizeLowerOrAll((game as unknown as { league?: unknown }).league);

  const moneyWaveCategory = mapDbCategoryToMoneyWave((game as unknown as { category?: unknown }).category);
  const totalBetAmount = stats?.total_bet_amount ?? 0;
  const participantCount = stats?.total_participants ?? 0;

  // 사용자의 기존 베팅 내역 조회
  const userBets = await getUserBets(game.game_id);

  // 차트 초기 데이터 조회 (SSR)
  const initialChartData = await getGameHistory(
    game.game_id,
    gameOptions.map(opt => ({ id: opt.id }))
  );

  const gameForView = {
    id: game.game_id,
    title: game.title || "제목 없음",
    description: game.description || "",
    predictionType: mapPredictionType(game.prediction_type),
    options: gameOptions.map(
      (
        opt: { id: string; label: string; currentOdds?: number },
        idx: number
      ) => ({
        id: opt.id || `option-${idx}`,
        label: opt.label || `옵션 ${idx + 1}`,
        probability: opt.currentOdds || 0.5,
        odds: opt.currentOdds && opt.currentOdds > 0 ? 1 / opt.currentOdds : 2.0,
        volume: totalBetAmount ? Math.floor(totalBetAmount / gameOptions.length) : 0,
        change24h: 0,
      })
    ),
    totalVolume: totalBetAmount,
    participantCount,
    endTime: toIsoOrFallback(game.registration_end, 7 * 24 * 60 * 60 * 1000),
    settlementTime: toIsoOrFallback(game.settlement_date, 14 * 24 * 60 * 60 * 1000),
    status: mapStatus(game.status),
    createdAt: toIsoOrFallback(game.created_at, 0),
    category: game.category || "예측",
    creator: {
      name: "PosMul",
      reputation: 0,
      avatar: "🎯",
    },
    prizePool: truthPrizePool ?? getPrizePool({ game, totalBetAmount }),
    minimumStake: game.min_bet_amount || 100,
    maximumStake: game.max_bet_amount || 10000,
  };

  return (
    <PredictionDetailTabsClient
      game={gameForView}
      userBalance={userBalance}
      userBets={userBets}
      initialChartData={initialChartData}
      moneyWave={{
        category: moneyWaveCategory,
        subcategory,
        league,
      }}
    />
  );
}
