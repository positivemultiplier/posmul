import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../shared/ui/components/animations";

import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import {
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../components/prediction-game-mapper";

type EntertainmentSubcategory = "movies" | "dramas" | "music" | "awards";

const isEntertainmentSubcategory = (
  value: string
): value is EntertainmentSubcategory => {
  return (
    value === "movies" ||
    value === "dramas" ||
    value === "music" ||
    value === "awards"
  );
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

export default async function PredictionEntertainmentSubcategoryPage({
  params,
}: PageProps) {
  const supabase = await createClient();
  const { subcategory } = await params;

  if (!isEntertainmentSubcategory(subcategory)) {
    notFound();
  }

  const pool = await getAggregatedPrizePool(supabase, "ENTERTAINMENT", subcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "ENTERTAINMENT")
    .eq("subcategory", subcategory)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "PredictionEntertainmentSubcategoryPage Supabase error",
      error.message
    );
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

  const title =
    subcategory === "movies"
      ? "🎬 영화"
      : subcategory === "dramas"
        ? "📺 드라마"
        : subcategory === "music"
          ? "🎵 음악"
          : "🏆 시상식";

  const leagueCandidates = Array.from(
    new Set(
      (games ?? [])
        .map((g) => (typeof (g as Record<string, unknown>).league === "string" ? ((g as Record<string, unknown>).league as string) : "all"))
        .map((v) => v.trim())
        .filter((v) => v)
    )
  );

  const leagues = leagueCandidates.length ? leagueCandidates : ["all"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="mb-8">
            <Link
              href="/prediction/entertainment"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← 엔터테인먼트
            </Link>
            <h1 className="text-4xl font-bold mt-4">{title} 예측</h1>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={3}
                category="entertainment"
                subcategory={subcategory}
                initialPool={pool}
              />
            </HoverLift>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {leagues.map((league) => (
              <HoverLift key={league}>
                <Link
                  href={`/prediction/entertainment/${subcategory}/${league}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="text-lg font-semibold mb-1">📌 {league}</div>
                  <div className="text-sm text-gray-300">리그별 게임 보기</div>
                </Link>
              </HoverLift>
            ))}
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={`/prediction/entertainment/${subcategory}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
