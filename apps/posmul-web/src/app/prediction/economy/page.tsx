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

interface PageProps {
  searchParams: Promise<{
    subcategory?: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const SUBCATEGORY_WHITELIST = [
  "stocks",
  "earnings",
  "indicators",
  "crypto",
] as const;

const normalizeSubcategory = (subcategory?: string) => {
  if (!subcategory) return undefined;
  return SUBCATEGORY_WHITELIST.includes(
    subcategory as (typeof SUBCATEGORY_WHITELIST)[number]
  )
    ? subcategory
    : undefined;
};

export default async function PredictionEconomyPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const safeSubcategory = normalizeSubcategory(resolvedSearchParams?.subcategory);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const economyPool = await getAggregatedPrizePool(
    supabase,
    "ECONOMY",
    safeSubcategory || undefined
  );

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "ECONOMY")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (safeSubcategory) {
    query = query.eq("subcategory", safeSubcategory);
  }

  const { data, error } = await query;
  if (error) {
    console.error("PredictionEconomyPage Supabase error", error.message);
  }
  const games = (data ?? []) as PredictionGameRow[];

  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, games);

  let userPredictions: UserPrediction[] = [];
  if (user && games.length > 0) {
    const gameIds = games.map((g) => g.game_id);
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("game_id", gameIds);

    userPredictions = predictions || [];
  }

  const visibleGames = gamesWithPools;

  const filters = [
    { label: "전체", value: undefined, icon: "📋" },
    { label: "주식", value: "stocks", icon: "📈" },
    { label: "기업 실적", value: "earnings", icon: "💰" },
    { label: "경제 지표", value: "indicators", icon: "📊" },
    { label: "암호화폐", value: "crypto", icon: "₿" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title="📈 경제 예측 마켓"
            subtitle="주식, 기업 실적, 거시경제 지표, 암호화폐 흐름을 예측하고 PMC를 획득하세요"
            metrics={[
              {
                label: "경제 상금풀",
                value: economyPool || 18400,
                unit: "PMC",
              },
              { label: "진행 중 게임", value: visibleGames.length, unit: "개" },
            ]}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {filters.map((filter) => (
                  <Link
                    key={filter.label}
                    href={
                      filter.value
                        ? `/prediction/economy/${filter.value}`
                        : "/prediction/economy"
                    }
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      safeSubcategory === filter.value
                        ? "bg-sky-500/20 border-sky-400/40 text-sky-200"
                        : "bg-slate-900/70 border-slate-800 hover:text-slate-200 text-slate-400"
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">📡 검증 데이터:</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> KOSIS
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> DART
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" /> Alpha Vantage
                </span>
              </div>
            </div>
          </DomainContextHeader>

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="economy"
              initialPool={economyPool}
            />
          </div>

          {visibleGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={visibleGames.map(mapPredictionGameRowToCardModel)}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath={
                safeSubcategory
                  ? `/prediction/economy/${safeSubcategory}`
                  : "/prediction/economy/stocks"
              }
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <div className="text-5xl mb-3">📈</div>
              <h3 className="text-lg font-bold text-white mb-1">
                경제 예측 게임 준비 중
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                곧 주식, 기업 실적, 경제 지표 예측 게임이 추가됩니다.
              </p>
              <Link
                href="/prediction"
                className="inline-block px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 transition"
              >
                전체 예측 마켓 보러가기 →
              </Link>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
