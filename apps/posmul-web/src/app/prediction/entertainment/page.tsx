import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../lib/supabase/server";
import { FadeIn } from "../../../shared/ui/components/animations";
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

  const dataSources = [
    { name: "KOBIS (영화관입장권통합전산망)", desc: "박스오피스" },
    { name: "닐슨코리아", desc: "시청률 공시" },
    { name: "써클차트/빌보드", desc: "음원 순위" },
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
              { label: "진행 중 게임", value: mappedGames.length, unit: "개" },
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
              category="entertainment"
              initialPool={entertainmentPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath="/prediction/entertainment"
            showCategoryFilter={false}
            showSortToolbar={true}
          />
        </FadeIn>
      </div>
    </div>
  );
}
