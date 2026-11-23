import { createClient } from "../lib/supabase/server";
import { supabaseAdmin } from "../lib/supabase/admin";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./prediction/components/prediction-game-mapper";
import { ClientPredictionGamesGrid } from "./prediction/components/ClientPredictionGamesGrid";
import { HeroLandingSection } from "./components/HeroLandingSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [
    donationsResult,
    predictionsCountResult,
    gamesResult,
    accountsCountResult,
  ] = await Promise.all([
    supabaseAdmin
      .schema("donation")
      .from("donations")
      .select("pmc_amount, amount, status"),
    supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("prediction_id", { count: "exact", head: true }),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, slug, category, subcategory, league, data_source, title, description, prediction_type, game_options, registration_start, registration_end, settlement_date, min_bet_amount, max_bet_amount, status, difficulty, created_at, metadata"
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id", { count: "exact", head: true }),
  ]);

  const recentGames = (gamesResult.data ?? []) as PredictionGameRow[];
  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, recentGames);
  const featuredGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  const totalPredictionsCount = predictionsCountResult.count ?? 0;
  const totalDonationAmount = (donationsResult.data ?? []).reduce((sum, row) => {
    if (row.status === "cancelled") return sum;
    const val = Number(row.pmc_amount ?? row.amount ?? 0);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);
  const totalUsersCount = accountsCountResult.count ?? 0;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* 1. 메인 브랜드 Hero 모션그래픽 섹션 */}
        <HeroLandingSection
          totalPredictions={totalPredictionsCount}
          totalDonationAmount={totalDonationAmount}
          totalUsers={totalUsersCount}
        />

        {/* 2. 실시간 예측 마켓 그리드 */}
        <section id="featured-prediction-markets" className="pt-2">
          <ClientPredictionGamesGrid
            games={featuredGames}
            basePath="/prediction"
          />
        </section>
      </div>
    </div>
  );
}
