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

export default async function PredictionPoliticsPage() {
  const supabase = await createClient();

  // 1단계 병렬 요청
  const [userResult, politicsPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "POLITICS"),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "POLITICS")
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
    { name: "중앙선거관리위원회", desc: "공식 투·개표 결과" },
    { name: "대한민국 국회 의안정보시스템", desc: "법안 통과/계류" },
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
              category="politics"
              initialPool={politicsPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath="/prediction/politics"
            showCategoryFilter={false}
            showSortToolbar={true}
          />
        </FadeIn>
      </div>
    </div>
  );
}
