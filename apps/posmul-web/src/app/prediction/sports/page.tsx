import { createClient } from "../../../lib/supabase/server";
import { FadeIn } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../components/prediction-game-mapper";
import { DomainContextHeader } from "../../../shared/ui/components/layout/DomainContextHeader";

export const revalidate = 10;

interface PageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const SPORT_WHITELIST = [
  "soccer",
  "baseball",
  "basketball",
  "esports",
  "other",
] as const;

const normalizeSport = (sport?: string) => {
  if (!sport) return undefined;
  return SPORT_WHITELIST.includes(sport as (typeof SPORT_WHITELIST)[number])
    ? sport
    : undefined;
};

export default async function PredictionSportsPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const safeSport = normalizeSport(resolvedSearchParams?.sport);

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "SPORTS")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (safeSport) {
    query = query.eq("subcategory", safeSport);
  }

  // 1단계 병렬 요청: 유저 인증, 스포츠 상금풀, 스포츠 게임 쿼리를 동시 실행
  const [userResult, sportsPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "SPORTS", safeSport || undefined),
    query,
  ]);

  const user = userResult.data?.user ?? null;
  const games = (gamesResult.data ?? []) as PredictionGameRow[];
  const gameIds = games.map((g) => g.game_id);

  // 2단계 병렬 요청: 게임별 실시간 상금풀 및 유저 베팅 내역을 동시 실행
  const [gamesWithPools, predictionsResult] = await Promise.all([
    attachHourlyGamePoolsToRows(supabase, games),
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

  const visibleGames = gamesWithPools;

  const filters = [
    { label: "전체", value: undefined },
    { label: "축구", value: "soccer" },
    { label: "야구", value: "baseball" },
    { label: "농구", value: "basketball" },
    { label: "e스포츠", value: "esports" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="⚽ 스포츠 예측 마켓"
            subtitle="축구, 야구, 농구, e스포츠 경기 결과를 예측하고 MoneyWave PMC를 획득하세요"
            metrics={[
              { label: "스포츠 상금풀", value: sportsPool || 15200, unit: "PMC" },
              { label: "진행 중 게임", value: visibleGames.length, unit: "개" },
            ]}
          >
            <div className="flex flex-wrap gap-1.5">
              {filters.map((filter) => (
                <Link
                  key={filter.label}
                  href={
                    filter.value
                      ? `/prediction/sports/${filter.value}`
                      : "/prediction/sports"
                  }
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    safeSport === filter.value
                      ? "bg-sky-500/20 border-sky-400/40 text-sky-200"
                      : "bg-slate-900/70 border-slate-800 hover:text-slate-200 text-slate-400"
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="sports"
              initialPool={sportsPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={visibleGames.map(mapPredictionGameRowToCardModel)}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={
              safeSport
                ? `/prediction/sports/${safeSport}`
                : "/prediction/sports/soccer"
            }
          />
        </FadeIn>
      </div>
    </div>
  );
}
