import { notFound } from "next/navigation";

import { PredictionDetailView } from "../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";

import {
  getPredictionGameBySlug,
  getPredictionGameStats,
  parseGameOptions,
} from "../../../bounded-contexts/public/infrastructure/repositories/prediction.repository";

import { getUserBalance } from "../sports/soccer/[slug]/actions";

export async function renderPredictionDetailBySlug(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  const game = await getPredictionGameBySlug(decodedSlug);
  if (!game) notFound();

  const stats = await getPredictionGameStats(game.game_id);
  const options = parseGameOptions(game.game_options);

  const balanceResult = await getUserBalance();
  const userBalance = balanceResult ?? { pmp: 0, pmc: 0 };

  const defaultOptions = [
    { id: "yes", label: "예", currentOdds: 0.55 },
    { id: "no", label: "아니오", currentOdds: 0.45 },
  ];

  const gameOptions = options.length > 0 ? options : defaultOptions;

  const gameForView = {
    id: game.game_id,
    title: game.title || "제목 없음",
    description: game.description || "",
    predictionType: (game.prediction_type?.toLowerCase() === "binary"
      ? "binary"
      : game.prediction_type?.toLowerCase() === "win_draw_lose" ||
          game.prediction_type?.toLowerCase() === "wdl"
        ? "wdl"
        : "ranking") as "binary" | "wdl" | "ranking",
    options: gameOptions.map(
      (
        opt: { id: string; label: string; currentOdds?: number },
        idx: number
      ) => ({
        id: opt.id || `option-${idx}`,
        label: opt.label || `옵션 ${idx + 1}`,
        probability: opt.currentOdds || 0.5,
        odds: opt.currentOdds && opt.currentOdds > 0 ? 1 / opt.currentOdds : 2.0,
        volume: stats?.total_bet_amount
          ? Math.floor(stats.total_bet_amount / gameOptions.length)
          : 0,
        change24h: 0,
      })
    ),
    totalVolume: stats?.total_bet_amount || 0,
    participantCount: stats?.total_participants || 0,
    endTime: game.registration_end
      ? new Date(game.registration_end)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    settlementTime: game.settlement_date
      ? new Date(game.settlement_date)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: (game.status === "ACTIVE"
      ? "ACTIVE"
      : game.status === "CLOSED"
        ? "ENDED"
        : game.status === "SETTLED"
          ? "SETTLED"
          : "ACTIVE") as "ACTIVE" | "ENDED" | "SETTLED",
    category: game.category || "예측",
    creator: {
      name: "PosMul",
      reputation: 0,
      avatar: "🎯",
    },
    prizePool: 0,
    minimumStake: game.min_bet_amount || 100,
    maximumStake: game.max_bet_amount || 10000,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PredictionDetailView game={gameForView} userBalance={userBalance} />
      </div>
    </div>
  );
}
