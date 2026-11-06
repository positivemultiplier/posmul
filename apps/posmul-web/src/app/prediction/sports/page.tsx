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
    .limit(20);

  if (safeSport) {
    query = query.eq("subcategory", safeSport);
  }

  const [userResult, sportsPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "SPORTS", safeSport || undefined),
    query,
  ]);

  const user = userResult.data?.user ?? null;
  const games = (gamesResult.data ?? []) as PredictionGameRow[];
  const gameIds = games.map((g) => g.game_id);

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

  const dataSources = [
    { name: "공식 리그 데이터", desc: "K리그, EPL, MLB, KBO" },
    { name: "LiveScore API", desc: "실시간 경기 결과" },
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">📡 공인 검증 데이터:</span>
              {dataSources.map((ds) => (
                <span
                  key={ds.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-300 font-medium"
                >
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                  <span className="font-bold">{ds.name}</span>
                  <span className="text-slate-400 text-[10px]">({ds.desc})</span>
                </span>
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
            showCategoryFilter={false}
            showSortToolbar={true}
          />
        </FadeIn>
      </div>
    </div>
  );
}
