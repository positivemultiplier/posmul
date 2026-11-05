import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../components/prediction-game-mapper";
import { DomainContextHeader } from "../../../shared/ui/components/layout/DomainContextHeader";

export default async function PredictionPoliticsPage() {
  const supabase = await createClient();

  const politicsPool = await getAggregatedPrizePool(supabase, "POLITICS");

  const query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "POLITICS")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  interface UserPrediction {
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  }

  let userPredictions: UserPrediction[] = [];
  if (user) {
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true);
    userPredictions = (predictions || []) as UserPrediction[];
  }

  const { data: games } = await query;

  const gameRows = (games || []) as PredictionGameRow[];
  const gameRowsWithPools = await attachHourlyGamePoolsToRows(
    supabase,
    gameRows
  );
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const subcategories = [
    { label: "전체", href: "/prediction/politics" },
    { label: "국가 선거", href: "/prediction/politics/national-elections" },
    { label: "지역 선거", href: "/prediction/politics/local-elections" },
    { label: "정책 변화", href: "/prediction/politics/policy-changes" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="🗳️ 정치·선거 예측 마켓"
            subtitle="국가·지역 선거 결과와 핵심 법안·정책 변화를 집단지성으로 예측하세요"
            metrics={[
              {
                label: "정치 상금풀",
                value: politicsPool || 14200,
                unit: "PMC",
              },
              { label: "진행 중 마켓", value: mappedGames.length, unit: "개" },
            ]}
          >
            <div className="flex flex-wrap gap-1.5">
              {subcategories.map((item, idx) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    idx === 0
                      ? "bg-sky-500/20 border-sky-400/40 text-sky-200"
                      : "bg-slate-900/70 border-slate-800 hover:text-slate-200 text-slate-400"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="politics"
              initialPool={politicsPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
          />
        </FadeIn>
      </div>
    </div>
  );
}
