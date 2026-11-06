import Link from "next/link";
import { notFound } from "next/navigation";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../../lib/supabase/server";
import { FadeIn } from "../../../../shared/ui/components/animations";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../components/prediction-game-mapper";
import { DomainContextHeader } from "../../../../shared/ui/components/layout/DomainContextHeader";

export const revalidate = 10;

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const SUGGESTION_SUBCATEGORY_CONFIG = {
  "user-proposals": {
    title: "🙋 시민 직접 제안 예측 마켓",
    subtitle: "주권자인 시민이 직접 발의한 사회·지역 의제 기반 집단지성 예측 마켓입니다",
    depthSubcategory: "user_proposals",
    dataSources: ["PosMul 시민 아고라 합의 검증"],
  },
  "ai-recommendations": {
    title: "🤖 AI 추천 예측 마켓",
    subtitle: "실시간 공공 뉴스와 국가 예산 데이터에서 AI가 도출한 핵심 예측 주제입니다",
    depthSubcategory: "ai_recommendations",
    dataSources: ["AI 공공뉴스 팩트 파이프라인"],
  },
  "opinion-leader-suggestions": {
    title: "🌟 오피니언 리더 제안 마켓",
    subtitle: "각 분야 정책 전문가와 오피니언 리더가 화두를 던진 공익 예측 마켓입니다",
    depthSubcategory: "opinion_leaders",
    dataSources: ["전문가 자문단 공인 검증"],
  },
} as const;

type SuggestionSubKey = keyof typeof SUGGESTION_SUBCATEGORY_CONFIG;

export default async function PredictionUserSuggestionsSubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const decoded = decodeURIComponent(subcategory);
  const config = SUGGESTION_SUBCATEGORY_CONFIG[decoded as SuggestionSubKey];

  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  const [userResult, pool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "USER_PROPOSED", config.depthSubcategory),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "USER_PROPOSED")
      .eq("subcategory", config.depthSubcategory)
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

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title={config.title}
            subtitle={config.subtitle}
            metrics={[
              {
                label: "제안 상금풀",
                value: pool || 9500,
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
                <span className="font-semibold text-slate-300">📡 검증 데이터 소스:</span>
                {config.dataSources.map((ds) => (
                  <span
                    key={ds}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-300 font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                    {ds}
                  </span>
                ))}
              </div>
              <Link
                href="/prediction/create"
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
              >
                + 새 예측 의제 제안하기
              </Link>
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={3}
              category="user_proposed"
              subcategory={config.depthSubcategory}
              initialPool={pool}
            />
          </div>

          {mappedGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={mappedGames}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath={`/prediction/user-suggestions/${decoded}`}
              showCategoryFilter={false}
              showSortToolbar={true}
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="text-5xl">💡</div>
              <h3 className="text-lg font-bold text-white">
                {config.title.replace(" 마켓", "")} 준비 중
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                새로운 제안 의제가 승인되는 즉시 마켓이 오픈됩니다. 직접 예측 의제를 제안해 보세요!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/prediction/user-suggestions"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  ← 시민 제안 전체 마켓 보기
                </Link>
                <Link
                  href="/prediction/create"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition"
                >
                  + 직접 예측 제안하기
                </Link>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
