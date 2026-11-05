import { createClient } from "../lib/supabase/server";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./prediction/components/prediction-game-mapper";
import { getAggregatedPrizePool } from "../bounded-contexts/prediction/application/prediction-pool.service";
import { ClientPredictionGamesGrid } from "./prediction/components/ClientPredictionGamesGrid";
import { DomainContextHeader } from "../shared/ui/components/layout/DomainContextHeader";

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
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id", { count: "exact" }),
  ]);

  const recentGames = (gamesResult.data ?? []) as PredictionGameRow[];
  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, recentGames);
  const featuredGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  const totalUsersCount = accountsCountResult.count ?? 85;

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DomainContextHeader
          domain="prediction"
          title="🔮 PosMul · 시민 집단지성 예측 피드"
          subtitle="포럼·소비에서 모은 무위험 PMP로 미래 의제를 예측하고, 적중 시 MoneyWave PMC를 획득하여 기부에 직접 집행하세요"
          metrics={[
            {
              label: "MoneyWave 상금풀",
              value: platformTotalPool || 66461,
              unit: "PMC",
            },
            { label: "참여 주권자", value: totalUsersCount, unit: "명" },
          ]}
        />

        <section>
          <ClientPredictionGamesGrid
            games={featuredGames}
            basePath="/prediction"
          />
        </section>
      </div>
    </div>
  );
}
