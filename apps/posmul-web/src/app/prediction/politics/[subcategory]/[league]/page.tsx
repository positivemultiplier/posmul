import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { createClient } from "../../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../../shared/ui/components/animations";

import { ClientPredictionGamesGrid } from "../../../components/ClientPredictionGamesGrid";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../../components/prediction-game-mapper";

type PoliticsSubcategory =
  | "national-elections"
  | "local-elections"
  | "policy-changes";

const isPoliticsSubcategory = (value: string): value is PoliticsSubcategory => {
  return (
    value === "national-elections" ||
    value === "local-elections" ||
    value === "policy-changes"
  );
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

export default async function PredictionPoliticsLeaguePage({ params }: PageProps) {
  const supabase = await createClient();
  const { subcategory, league } = await params;

  const toFiniteNumber = (value: unknown): number | null => {
    const n = typeof value === "string" ? Number(value) : value;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  };

  if (!isPoliticsSubcategory(subcategory) || !league) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "POLITICS")
    .eq("subcategory", subcategory)
    .eq("league", league)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("PredictionPoliticsLeaguePage Supabase error", error.message);
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

  const gameRows = (games ?? []) as PredictionGameRow[];
  const gameRowsWithPools = await attachHourlyGamePoolsToRows(supabase, gameRows);
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const leaguePool = Math.floor(
    gameRowsWithPools.reduce((sum, game) => {
      const v = toFiniteNumber(game.allocated_prize_pool);
      return v === null ? sum : sum + v;
    }, 0)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="mb-8">
            <Link
              href={`/prediction/politics/${subcategory}`}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← {subcategory}
            </Link>
            <h1 className="text-4xl font-bold mt-4">리그: {league}</h1>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={4}
                category="politics"
                subcategory={subcategory}
                league={league}
                initialPool={leaguePool}
              />
            </HoverLift>
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={`/prediction/politics/${subcategory}/${league}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
