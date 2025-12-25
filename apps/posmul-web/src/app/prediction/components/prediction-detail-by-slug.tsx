import { notFound } from "next/navigation";

import { PredictionDetailTabsClient } from "./PredictionDetailTabsClient";

import {
  getPredictionGameBySlug,
  getPredictionGameStats,
  parseGameOptions,
} from "../../../bounded-contexts/public/infrastructure/repositories/prediction.repository";

import { getUserBalance } from "../sports/soccer/[slug]/actions";

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
  if (typeof prizePool === "number") return prizePool;
  if (typeof params.totalBetAmount === "number") return Math.floor(params.totalBetAmount * 0.5);
  return 0;
}

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
    category: game.category || "예측",
    creator: {
      name: "PosMul",
      reputation: 0,
      avatar: "🎯",
    },
    prizePool: getPrizePool({ game, totalBetAmount }),
    minimumStake: game.min_bet_amount || 100,
    maximumStake: game.max_bet_amount || 10000,
  };

  return (
    <PredictionDetailTabsClient
      game={gameForView}
      userBalance={userBalance}
      moneyWave={{
        category: moneyWaveCategory,
        subcategory,
        league,
      }}
    />
  );
}
