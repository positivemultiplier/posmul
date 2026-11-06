import { createClient } from "../../../../lib/supabase/server";
import { FadeIn } from "../../../../shared/ui/components/animations";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  params: Promise<{
    subcategory: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const ECONOMY_SUBCATEGORY_CONFIG = {
  stocks: {
    key: "stocks",
    title: "📈 주식 예측 마켓",
    subtitle: "코스피, 나스닥, 글로벌 주요 종목의 일일 등락을 예측하고 PMC를 획득하세요",
    dataSources: ["Alpha Vantage (실시간)", "한국거래소 (KRX)"],
    emptyMessage: "현재 등록된 주식 예측 게임이 준비 중입니다. 곧 새로운 종목이 등록됩니다.",
  },
  earnings: {
    key: "earnings",
    title: "💰 기업 실적 예측 마켓",
    subtitle: "국내외 주요 기업들의 분기 실적 공시(DART/SEC) 지표를 예측하세요",
    dataSources: ["DART (전자공시)", "SEC EDGAR"],
    emptyMessage: "현재 등록된 기업 실적 예측 게임이 준비 중입니다. 실적 발표 시즌에 맞춰 등록됩니다.",
  },
  indicators: {
    key: "indicators",
    title: "📊 거시경제 지표 예측 마켓",
    subtitle: "기준금리(한국은행/Fed), 물가상승률(CPI), 경제성장률 등 거시 지표 흐름을 예측하세요",
    dataSources: ["KOSIS (국가통계포털)", "FRED (미 연준)"],
    emptyMessage: "현재 등록된 거시경제 지표 예측 게임이 준비 중입니다. 곧 업데이트됩니다.",
  },
  crypto: {
    key: "crypto",
    title: "₿ 암호화폐 예측 마켓",
    subtitle: "비트코인, 이더리움 및 주요 가상자산의 가격 흐름과 주요 지표를 예측하세요",
    dataSources: ["CoinGecko", "Binance API"],
    emptyMessage: "현재 등록된 암호화폐 예측 게임이 준비 중입니다. 곧 업데이트됩니다.",
  },
} as const;

type EconomySubcategoryKey = keyof typeof ECONOMY_SUBCATEGORY_CONFIG;

export default async function PredictionEconomySubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const config = ECONOMY_SUBCATEGORY_CONFIG[subcategory as EconomySubcategoryKey];

  // 화이트리스트에 없는 서브카테고리는 404 처리
  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  // 1단계 병렬 쿼리: 유저 세션, 서브카테고리 상금풀, 해당 서브카테고리 게임 fetch
  const [userResult, subcategoryPool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "ECONOMY", subcategory),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "ECONOMY")
      .eq("subcategory", subcategory)
      .in("status", ["ACTIVE", "DRAFT"])
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const user = userResult.data?.user ?? null;
  const games = (gamesResult.data ?? []) as PredictionGameRow[];
  const gameIds = games.map((g) => g.game_id);

  // 2단계 병렬 쿼리: 실시간 상금풀 매핑 및 유저의 활성 예측 fetch
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

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          {/* PosMul 통일 디자인 시스템 헤더 (DomainContextHeader) */}
          <DomainContextHeader
            domain="prediction"
            title={config.title}
            subtitle={config.subtitle}
            metrics={[
              {
                label: "상금풀",
                value: subcategoryPool || 12000,
                unit: "PMC",
              },
              {
                label: "진행 중 게임",
                value: visibleGames.length,
                unit: "개",
              },
            ]}
          >
            {/* 검증 데이터 소스 배지 */}
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
          </DomainContextHeader>

          {/* 머니웨이브 상금풀 현황 위젯 */}
          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={3}
              category="economy"
              subcategory={subcategory}
              initialPool={subcategoryPool}
            />
          </div>

          {/* 게임 피드 (정렬 툴바 + 카드 목록) */}
          {visibleGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={visibleGames.map(mapPredictionGameRowToCardModel)}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath={`/prediction/economy/${subcategory}`}
              showCategoryFilter={false}
              showSortToolbar={true}
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="text-5xl">📊</div>
              <h3 className="text-lg font-bold text-white">
                {config.title.replace(" 마켓", "")} 준비 중
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {config.emptyMessage}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/prediction/economy"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  ← 경제 전체 마켓 보기
                </Link>
                <Link
                  href="/prediction"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition"
                >
                  전체 예측 마켓 둘러보기
                </Link>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
