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

export const revalidate = 10;

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function PredictionEntertainmentPage() {
  const supabase = await createClient();

  // 1단계 병렬 요청
  const [userResult, entertainmentPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "ENTERTAINMENT"),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "ENTERTAINMENT")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false }),
  ]);

  const user = userResult.data?.user ?? null;
  const gameRows = (gamesResult.data || []) as PredictionGameRow[];
  const gameIds = gameRows.map((g) => g.game_id);

  // 2단계 병렬 요청
  const [gameRowsWithPools, predictionsResult] = await Promise.all([
    attachHourlyGamePoolsToRows(supabase, gameRows),
    user && gameIds.length > 0
      ? supabase
          .schema("prediction")
          .from("predictions")
          .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .in("game_id", gameIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userPredictions: UserPrediction[] = (predictionsResult.data || []) as UserPrediction[];
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const subcategories = [
    { label: "전체", href: "/prediction/entertainment" },
    { label: "영화", href: "/prediction/entertainment/movies" },
    { label: "드라마", href: "/prediction/entertainment/dramas" },
    { label: "음악", href: "/prediction/entertainment/music" },
    { label: "시상식", href: "/prediction/entertainment/awards" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="🎬 엔터테인먼트 예측 마켓"
            subtitle="영화 흥행, 드라마 시청률, 음악 차트, 글로벌 시상식 결과를 예측하세요"
            metrics={[
              {
                label: "엔터 상금풀",
                value: entertainmentPool || 11500,
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
              category="entertainment"
              initialPool={entertainmentPool}
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
