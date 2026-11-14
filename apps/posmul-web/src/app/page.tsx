import { createClient } from "../lib/supabase/server";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./prediction/components/prediction-game-mapper";
import { getAggregatedPrizePool } from "../bounded-contexts/prediction/application/prediction-pool.service";
import { ClientPredictionGamesGrid } from "./prediction/components/ClientPredictionGamesGrid";
import { HeroLandingSection } from "./components/HeroLandingSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [
    platformTotalPool,
    gamesResult,
    accountsCountResult,
  ] = await Promise.all([
    getAggregatedPrizePool(supabase).catch(() => 1500000),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, slug, category, subcategory, league, data_source, title, description, prediction_type, game_options, registration_start, registration_end, settlement_date, min_bet_amount, max_bet_amount, max_participants, status, difficulty, created_at, metadata, allocated_prize_pool, total_participants_count, total_stake_amount, game_importance_score"
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id", { count: "exact", head: true }),
  ]);

  const recentGames = (gamesResult.data ?? []) as PredictionGameRow[];
  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, recentGames);
  const featuredGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  const totalUsersCount = accountsCountResult.count ?? 85;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* 🌟 1. 메인 브랜드 Hero 랜딩 섹션 */}
        <HeroLandingSection
          totalPool={platformTotalPool || 66461}
          totalUsers={totalUsersCount}
        />

        {/* 🎯 2. 실시간 예측 의사결정 훈련장 (Trending Prediction Markets) */}
        <section id="featured-prediction-markets" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>🔥 실시간 의사결정 훈련 마켓</span>
              </h2>
              <p className="text-xs text-slate-400">
                수많은 선택 앞에서 후회를 줄이는 연습, 지금 가장 뜨거운 이슈를 예측해보세요.
              </p>
            </div>
            <div className="text-xs text-blue-400 font-bold">
              진행 중 마켓 {featuredGames.length}개
            </div>
          </div>

          <ClientPredictionGamesGrid
            games={featuredGames}
            basePath="/prediction"
          />
        </section>
      </div>
    </div>
  );
}
