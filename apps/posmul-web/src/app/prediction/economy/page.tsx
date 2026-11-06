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

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "ECONOMY")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(30);

  if (safeSubcategory) {
    query = query.eq("subcategory", safeSubcategory);
  }

  // 1단계 병렬 요청: 유저 인증, 경제 상금풀, 경제 게임 쿼리를 동시 실행
  const [userResult, economyPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "ECONOMY", safeSubcategory || undefined),
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

  const dataSources = [
    { name: "Alpha Vantage", desc: "실시간 글로벌 주가" },
    { name: "DART", desc: "기업 분기 실적" },
    { name: "KOSIS", desc: "국가 경제 지표" },
    { name: "CoinGecko", desc: "암호화폐 온체인" },
  ];

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          {/* PosMul 통일 디자인 시스템 헤더 (DomainContextHeader) */}
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
            {/* 검증 데이터 소스 안내 배지 (3row 중복 탭 제거 후 데이터 신뢰성 강조) */}
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

          {/* 머니웨이브 상금풀 현황 위젯 */}
          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="economy"
              initialPool={economyPool}
            />
          </div>

          {/* 게임 피드 (정렬 툴바 + 카드 목록) */}
          {visibleGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={visibleGames.map(mapPredictionGameRowToCardModel)}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath="/prediction/economy"
              showCategoryFilter={false}
              showSortToolbar={true}
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
