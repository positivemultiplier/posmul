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

const CONSUME_SUBCATEGORY_CONFIG = {
  time: {
    title: "⏰ TimeConsume 예측 마켓",
    subtitle: "시민의 시간 참여(광고 시청·설문 응답) 캠페인 목표 달성 여부를 예측하세요",
    dataSources: ["PosMul Major League 온체인 로그"],
  },
  money: {
    title: "💳 MoneyConsume 예측 마켓",
    subtitle: "소상공인·지역 상생 가맹점의 월간 소비 활성화 지표를 예측하세요",
    dataSources: ["PosMul Minor League 로컬 정산 데이터"],
  },
  cloud: {
    title: "☁️ CloudConsume 예측 마켓",
    subtitle: "공익·스타트업 크라우드 펀딩 프로젝트의 목표 달성률을 예측하세요",
    dataSources: ["PosMul Cloud Funding 스마트 에스크로"],
  },
} as const;

type ConsumeSubKey = keyof typeof CONSUME_SUBCATEGORY_CONFIG;

export default async function PredictionConsumeSubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const config = CONSUME_SUBCATEGORY_CONFIG[subcategory as ConsumeSubKey];

  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  const [userResult, pool, gamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase, "INVEST", subcategory),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("category", "INVEST")
      .eq("subcategory", subcategory)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title={config.title}
            subtitle={config.subtitle}
            metrics={[
              {
                label: "상금풀",
                value: pool || 12800,
                unit: "PMC",
              },
              {
                label: "진행 중 마켓",
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
              category="economy"
              subcategory={subcategory}
              initialPool={pool}
            />
          </div>

          {mappedGames.length > 0 ? (
            <ClientPredictionGamesGrid
              games={mappedGames}
              userId={user?.id}
              userPredictions={userPredictions}
              basePath={`/prediction/consume/${subcategory}`}
              showCategoryFilter={false}
              showSortToolbar={true}
            />
          ) : (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="text-5xl">💳</div>
              <h3 className="text-lg font-bold text-white">
                {config.title.replace(" 마켓", "")} 준비 중
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                신규 소비 캠페인 및 펀딩 프로젝트와 연동된 예측 게임이 곧 오픈됩니다.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/prediction/consume"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  ← 소비예측 전체 마켓 보기
                </Link>
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
