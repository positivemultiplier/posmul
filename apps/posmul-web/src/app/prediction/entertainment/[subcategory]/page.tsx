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

const ENTERTAINMENT_SUBCATEGORY_CONFIG = {
  movies: {
    dbValues: ["movie", "movies"],
    title: "🎬 영화·박스오피스 예측 마켓",
    subtitle: "주말 박스오피스 1위, 개봉 첫 주 누적 관객 수 및 흥행 기록을 예측하세요",
    dataSources: ["KOBIS (영화관입장권통합전산망)", "Box Office Mojo"],
  },
  movie: {
    dbValues: ["movie", "movies"],
    title: "🎬 영화·박스오피스 예측 마켓",
    subtitle: "주말 박스오피스 1위, 개봉 첫 주 누적 관객 수 및 흥행 기록을 예측하세요",
    dataSources: ["KOBIS (영화관입장권통합전산망)", "Box Office Mojo"],
  },
  dramas: {
    dbValues: ["drama", "dramas"],
    title: "📺 드라마·시청률 예측 마켓",
    subtitle: "주말·미니시리즈 최고 시청률 돌파 여부와 OTT 화제성 순위를 예측하세요",
    dataSources: ["닐슨코리아", "굿데이터코퍼레이션"],
  },
  drama: {
    dbValues: ["drama", "dramas"],
    title: "📺 드라마·시청률 예측 마켓",
    subtitle: "주말·미니시리즈 최고 시청률 돌파 여부와 OTT 화제성 순위를 예측하세요",
    dataSources: ["닐슨코리아", "굿데이터코퍼레이션"],
  },
  variety: {
    dbValues: ["variety", "show"],
    title: "🎤 예능·방송 예측 마켓",
    subtitle: "프라임타임 예능 시청률 1위 방송사 및 경연 프로그램 우승자를 예측하세요",
    dataSources: ["닐슨코리아", "방송사 공식 발표"],
  },
  music: {
    dbValues: ["music", "kpop"],
    title: "🎵 음악·K-POP 차트 예측 마켓",
    subtitle: "신규 발매 음원 주간 차트 TOP 10 진입 및 글로벌 빌보드 순위를 예측하세요",
    dataSources: ["써클차트 (Circle Chart)", "멜론·빌보드"],
  },
  awards: {
    dbValues: ["awards", "award"],
    title: "🏆 시상식 예측 마켓",
    subtitle: "국내외 주요 영화·드라마·음악 시상식 대상 및 주요 부문 수상자를 예측하세요",
    dataSources: ["공식 시상식 위원회 발표"],
  },
} as const;

type EntertainmentSubKey = keyof typeof ENTERTAINMENT_SUBCATEGORY_CONFIG;

export default async function PredictionEntertainmentSubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const config = ENTERTAINMENT_SUBCATEGORY_CONFIG[subcategory as EntertainmentSubKey];

  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  const [userResult, pool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "ENTERTAINMENT", subcategory),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "ENTERTAINMENT")
      .in("subcategory", [...config.dbValues])
      .in("status", ["ACTIVE", "DRAFT"])
      .order("created_at", { ascending: false })
      .limit(30),
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title={config.title}
            subtitle={config.subtitle}
            metrics={[
              {
                label: "상금풀",
                value: pool || 11500,
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

          <div className="mb-6">
            <CompactMoneyWaveCard
              depthLevel={3}
              category="entertainment"
              subcategory={subcategory}
              initialPool={pool}
            />
          </div>

          {mappedGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={mappedGames}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath={`/prediction/entertainment/${subcategory}`}
              showCategoryFilter={false}
              showSortToolbar={true}
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="text-5xl">🎬</div>
              <h3 className="text-lg font-bold text-white">
                {config.title.replace(" 마켓", "")} 준비 중
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                새로운 엔터테인먼트 예측 게임이 곧 업데이트됩니다.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/prediction/entertainment"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  ← 엔터테인먼트 전체 마켓 보기
                </Link>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
