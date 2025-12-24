import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../../shared/ui/components/animations";

import { ClientPredictionGamesGrid } from "../../../components/ClientPredictionGamesGrid";
import {
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../../components/prediction-game-mapper";

type SubcategoryKey = "time" | "money" | "cloud";

const isSubcategoryKey = (value: string): value is SubcategoryKey => {
  return value === "time" || value === "money" || value === "cloud";
};

type LeagueKey = "local" | "major" | "cloud";

const isLeagueKey = (value: string): value is LeagueKey => {
  return value === "local" || value === "major" || value === "cloud";
};

type LeagueKeyLoose = LeagueKey | "all";

const isLeagueKeyLoose = (value: string): value is LeagueKeyLoose => {
  return isLeagueKey(value) || value === "all";
};

interface PageProps {
  params: Promise<{ subcategory: string; league: string }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function PredictionConsumeLeaguePage({ params }: PageProps) {
  const supabase = await createClient();
  const { subcategory, league } = await params;

  if (!isSubcategoryKey(subcategory) || !isLeagueKeyLoose(league)) {
    notFound();
  }

  const pool = await getAggregatedPrizePool(supabase, "INVEST", subcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const gamesQuery = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "INVEST")
    .or(`subcategory.eq.${subcategory},subcategory.eq.all,subcategory.is.null`)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: games, error } =
    league === "all"
      ? await gamesQuery.or("league.eq.all,league.is.null")
      : await gamesQuery.eq("league", league);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("PredictionConsumeLeaguePage Supabase error", error.message);
  }

  let userPredictions: UserPrediction[] = [];
  if (user) {
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true);

    userPredictions = (predictions ?? []) as UserPrediction[];
  }

  const mappedGames = ((games ?? []) as PredictionGameRow[]).map(
    mapPredictionGameRowToCardModel
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="mb-8">
            <Link href={`/prediction/consume/${subcategory}`} className="text-sm text-gray-400 hover:text-gray-200">
              ← {subcategory}
            </Link>
            <h1 className="text-4xl font-bold mt-4">리그: {league}</h1>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={4}
                category="economy"
                subcategory={subcategory}
                league={league}
                initialPool={pool}
              />
            </HoverLift>
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={`/prediction/consume/${subcategory}/${league}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
