import Link from "next/link";

import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";

import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../components/prediction-game-mapper";

type ConsumeSubcategory = {
  slug: "time" | "money" | "cloud";
  title: string;
  description: string;
};

const SUBCATEGORIES: ConsumeSubcategory[] = [
  { slug: "time", title: "⏰ TimeConsume", description: "시간 소비 영역" },
  { slug: "money", title: "💳 MoneyConsume", description: "지역 소비 영역" },
  { slug: "cloud", title: "☁️ CloudConsume", description: "펀딩/후원 영역" },
];

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function PredictionConsumePage() {
  const supabase = await createClient();

  const consumePool = await getAggregatedPrizePool(supabase, "INVEST");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: games, error } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "INVEST")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("PredictionConsumePage Supabase error", error.message);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              💳 소비 예측
            </h1>
            <p className="text-xl text-gray-400">
              투자→소비 영역(Time/Money/Cloud)의 성과를 예측합니다
            </p>
          </div>

          <div className="mb-12">
            <HoverLift>
              <CompactMoneyWaveCard
                depthLevel={2}
                category="economy"
                initialPool={consumePool}
              />
            </HoverLift>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {SUBCATEGORIES.map((sub) => (
              <HoverLift key={sub.slug}>
                <Link
                  href={`/prediction/consume/${sub.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="text-lg font-semibold mb-2">{sub.title}</div>
                  <div className="text-sm text-gray-300">{sub.description}</div>
                </Link>
              </HoverLift>
            ))}
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath="/prediction/consume"
          />
        </FadeIn>
      </div>
    </div>
  );
}
