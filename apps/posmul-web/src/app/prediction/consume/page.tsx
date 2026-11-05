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
import { DomainContextHeader } from "../../../shared/ui/components/layout/DomainContextHeader";

type ConsumeSubcategory = {
  slug: "time" | "money" | "cloud";
  title: string;
  description: string;
};

const SUBCATEGORIES: ConsumeSubcategory[] = [
  { slug: "time", title: "⏰ TimeConsume", description: "시간 소비 캠페인 성과 예측" },
  { slug: "money", title: "💳 MoneyConsume", description: "지역 상생 소비 트렌드 예측" },
  { slug: "cloud", title: "☁️ CloudConsume", description: "크라우드 펀딩 달성률 예측" },
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
  const gameRowsWithPools = await attachHourlyGamePoolsToRows(
    supabase,
    gameRows
  );
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="💳 소비·임팩트 예측 마켓"
            subtitle="시간(Time)·지역소비(Money)·크라우드펀딩(Cloud) 영역의 시민 참여 성과를 예측합니다"
            metrics={[
              {
                label: "소비예측 상금풀",
                value: consumePool || 12800,
                unit: "PMC",
              },
              { label: "진행 중 마켓", value: mappedGames.length, unit: "개" },
            ]}
          />

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="economy"
              initialPool={consumePool}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {SUBCATEGORIES.map((sub) => (
              <HoverLift key={sub.slug}>
                <Link
                  href={`/prediction/consume/${sub.slug}`}
                  className="block rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 hover:border-sky-500/40 transition-colors"
                >
                  <div className="text-base font-bold text-white mb-1">
                    {sub.title}
                  </div>
                  <div className="text-xs text-slate-400">{sub.description}</div>
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
