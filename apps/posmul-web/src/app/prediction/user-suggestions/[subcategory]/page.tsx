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

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

const SUBCATEGORY_META: Record<
  string,
  { title: string; description: string; depthSubcategory: string }
> = {
  "user-proposals": {
    title: "사용자 제안",
    description: "개인이 제안한 주제 기반 예측",
    depthSubcategory: "user-proposals",
  },
  "ai-recommendations": {
    title: "AI 추천",
    description: "AI 기반 추천 주제",
    depthSubcategory: "ai-recommendations",
  },
  "opinion-leader-suggestions": {
    title: "오피니언 리더",
    description: "전문가 초청 예측",
    depthSubcategory: "opinion-leader-suggestions",
  },
};

export default async function PredictionUserSuggestionsSubcategoryPage({
  params,
}: PageProps) {
  const supabase = await createClient();
  const { subcategory } = await params;
  const decoded = decodeURIComponent(subcategory).toLowerCase();
  const meta = SUBCATEGORY_META[decoded];

  if (!meta) notFound();

  const pool = await getAggregatedPrizePool(supabase, "all", meta.depthSubcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "USER_PROPOSED")
    .eq("subcategory", meta.depthSubcategory)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    // eslint-disable-next-line no-console
    console.error(
      "PredictionUserSuggestionsSubcategoryPage Supabase error",
      error.message
    );
  }

  type UserPrediction = {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  };

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

  const leagues = Array.from(
    new Set(
      ((games ?? []) as PredictionGameRow[])
        .map((g) => (typeof g.league === "string" ? g.league : ""))
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => v.toLowerCase())
    )
  ).sort();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-10">
            <div className="mb-4">
              <Link
                href="/prediction/user-suggestions"
                className="text-sm text-gray-300 hover:text-white"
              >
                ← 사용자 제안
              </Link>
            </div>
            <h1 className="mb-3 text-4xl sm:text-5xl font-bold">{meta.title}</h1>
            <p className="text-xl text-gray-400">{meta.description}</p>
          </div>

          <div className="mb-10">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={3}
                category="all"
                subcategory={meta.depthSubcategory}
                initialPool={pool}
              />
            </HoverLift>
          </div>

          {leagues.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {leagues.map((league) => (
                <HoverLift key={league}>
                  <Link
                    href={`/prediction/user-suggestions/${decoded}/${league}`}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                  >
                    <div className="text-lg font-semibold text-white">{league}</div>
                    <div className="mt-2 text-sm text-gray-400">리그로 이동 →</div>
                  </Link>
                </HoverLift>
              ))}
            </div>
          ) : null}

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={`/prediction/user-suggestions/${decoded}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
