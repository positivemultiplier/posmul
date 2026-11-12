import Link from "next/link";
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

export default async function PredictionUserSuggestionsPage() {
  const supabase = await createClient();

  const [userResult, userProposedPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "USER_PROPOSED"),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "USER_PROPOSED")
      .in("status", ["ACTIVE", "DRAFT"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const user = userResult.data?.user ?? null;
  const gameRows = (gamesResult.data ?? []) as PredictionGameRow[];
  const gameIds = gameRows.map((g) => g.game_id);

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

  const userPredictions: UserPrediction[] = (predictionsResult.data ?? []) as UserPrediction[];
  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  const dataSources = [
    { name: "시민 아고라 투표", desc: "시민 직접 발의" },
    { name: "AI 공공뉴스 파이프라인", desc: "자동 의제 도출" },
    { name: "전문가 팩트체크", desc: "오피니언 리더" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="💡 시민 제안 예측 마켓"
            subtitle="관료가 정한 의제가 아닌, 시민과 AI·전문가가 직접 발의한 주제로 집단지성 예측 시장을 만듭니다"
            metrics={[
              {
                label: "제안 상금풀",
                value: userProposedPool || 9500,
                unit: "PMC",
              },
              {
                label: "진행 중 마켓",
                value: mappedGames.length,
                unit: "개",
              },
            ]}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/challenge/create"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition shadow-sm"
                >
                  🥊 단톡방 맞짱 · 꼬리내기 열기
                </Link>
                <Link
                  href="/prediction/create"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
                >
                  + 공식 의제 제안하기
                </Link>
              </div>
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="user_proposed"
              initialPool={userProposedPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath="/prediction/user-suggestions"
            showCategoryFilter={false}
            showSortToolbar={true}
          />
        </FadeIn>
      </div>
    </div>
  );
}
