import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import { FadeIn } from "../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../components/prediction-game-mapper";
import { DomainContextHeader } from "../../../../shared/ui/components/layout/DomainContextHeader";

export const revalidate = 10;

interface PageProps {
  searchParams: Promise<{
    league?: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function SoccerPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const league = resolvedSearchParams?.league;

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "SPORTS")
    .eq("subcategory", "soccer")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(30);

  if (league) {
    query = query.eq("league", league);
  }

  const [userResult, soccerPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "SPORTS", "soccer"),
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

  const userPredictions: UserPrediction[] = (predictionsResult.data ?? []) as UserPrediction[];
  const mappedGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  const dataSources = ["API-Football (실시간)", "K리그·EPL 공식 매치 기록"];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="⚽ 축구 예측 마켓"
            subtitle="프리미어리그(EPL), K리그, 라리가, 챔피언스리그 등 주요 축구 경기 승패를 예측하세요"
            metrics={[
              {
                label: "축구 상금풀",
                value: soccerPool || 15200,
                unit: "PMC",
              },
              {
                label: "진행 중 게임",
                value: mappedGames.length,
                unit: "개",
              },
            ]}
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">📡 검증 데이터 소스:</span>
              {dataSources.map((ds) => (
                <span
                  key={ds}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-300 font-medium"
                >
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                  {ds}
                </span>
              ))}
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={league ? 4 : 3}
              category="sports"
              subcategory="soccer"
              league={league}
              initialPool={soccerPool}
            />
          </div>

          {mappedGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={mappedGames}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath="/prediction/sports/soccer"
              showCategoryFilter={false}
              showSortToolbar={true}
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="text-5xl">⚽</div>
              <h3 className="text-lg font-bold text-white">
                ⚽ 축구 예측 준비 중
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                다음 라운드 경기 일정에 맞춰 새로운 축구 예측 마켓이 곧 오픈됩니다.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/prediction/sports"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  ← 스포츠 전체 마켓 보기
                </Link>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
