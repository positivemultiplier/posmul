import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../shared/ui/components/animations";

import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../components/prediction-game-mapper";

type SubcategoryKey = "time" | "money" | "cloud";

const isSubcategoryKey = (value: string): value is SubcategoryKey => {
  return value === "time" || value === "money" || value === "cloud";
};

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function PredictionConsumeSubcategoryPage({ params }: PageProps) {
  const supabase = await createClient();
  const { subcategory } = await params;

  if (!isSubcategoryKey(subcategory)) {
    notFound();
  }

  const league = "all";
  const pool = await getAggregatedPrizePool(supabase, "INVEST", subcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "INVEST")
    .or(`subcategory.eq.${subcategory},subcategory.eq.all,subcategory.is.null`)
    .or("league.eq.all,league.is.null")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("PredictionConsumeSubcategoryPage Supabase error", error.message);
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

  const title =
    subcategory === "time"
      ? "⏰ TimeConsume"
      : subcategory === "money"
        ? "💳 MoneyConsume"
        : "☁️ CloudConsume";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="mb-8">
            <Link href="/prediction/consume" className="text-sm text-gray-400 hover:text-gray-200">
              ← 소비 예측
            </Link>
            <h1 className="text-4xl font-bold mt-4">{title}</h1>
            <p className="text-gray-400 mt-2">리그: {league}</p>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={3}
                category="economy"
                subcategory={subcategory}
                initialPool={pool}
              />
            </HoverLift>
          </div>

          <div className="mb-10">
            <HoverLift>
              <Link
                href={`/prediction/consume/${subcategory}/${league}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="text-lg font-semibold mb-1">📌 {league}</div>
                <div className="text-sm text-gray-300">이 리그의 게임 보기</div>
              </Link>
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
