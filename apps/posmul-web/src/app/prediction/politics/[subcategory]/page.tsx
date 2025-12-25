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
  params: Promise<{ subcategory: string }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function PredictionPoliticsSubcategoryPage({
  params,
}: PageProps) {
  const supabase = await createClient();
  const { subcategory } = await params;

  if (!isPoliticsSubcategory(subcategory)) {
    notFound();
  }

  const pool = await getAggregatedPrizePool(supabase, "POLITICS", subcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "POLITICS")
    .eq("subcategory", subcategory)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "PredictionPoliticsSubcategoryPage Supabase error",
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

  const gameRows = (games ?? []) as PredictionGameRow[];
  const gameRowsWithPools = await attachHourlyGamePoolsToRows(supabase, gameRows);
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const title =
    subcategory === "national-elections"
      ? "🗳️ 국가 선거"
      : subcategory === "local-elections"
        ? "🏛️ 지역 선거"
        : "📜 정책 변화";

  const leagueCandidates = Array.from(
    new Set(
      gameRows
        .map((g) => (typeof g.league === "string" ? g.league : "all"))
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
              href="/prediction/politics"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← 정치/선거
            </Link>
            <h1 className="text-4xl font-bold mt-4">{title} 예측</h1>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={3}
                category="politics"
                subcategory={subcategory}
                initialPool={pool}
              />
            </HoverLift>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {leagues.map((league) => (
              <HoverLift key={league}>
                <Link
                  href={`/prediction/politics/${subcategory}/${league}`}
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
            basePath={`/prediction/politics/${subcategory}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
