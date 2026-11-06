import { createClient } from "../../lib/supabase/server";
import { FadeIn } from "../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid, type SortOption } from "./components/ClientPredictionGamesGrid";
import { getAggregatedPrizePool } from "../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./components/prediction-game-mapper";
import { DomainContextHeader } from "../../shared/ui/components/layout/DomainContextHeader";
import {
  PredictionType,
  GameStatus,
} from "../../bounded-contexts/prediction/domain/value-objects/prediction-types";

// 10초 캐싱 (ISR) 적용으로 초기 로딩 및 클릭 전환 체감 속도 극대화
export const revalidate = 10;

interface PageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function PredictionPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const filterParam = resolvedSearchParams?.filter;

  const initialSort: SortOption =
    filterParam === "hot"
      ? "hot"
      : filterParam === "high-pool"
        ? "prize_pool"
        : filterParam === "closing"
          ? "closing_soon"
          : "latest";

  // 1단계 병렬 요청: 유저 인증, MoneyWave 상금풀, 활성 게임 목록을 동시에 fetch
  const [userResult, platformTotalPool, recentGamesResult] = await Promise.all([
    supabase.auth.getUser(),
    getAggregatedPrizePool(supabase),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const user = userResult.data?.user ?? null;
  const recentGameRows = (recentGamesResult.data ?? []) as PredictionGameRow[];

  // 2단계 병렬 요청: 게임별 실시간 상금풀 매핑 및 유저의 활성 베팅 목록을 동시에 fetch
  const [recentGameRowsWithPools, userPredictionsResult] = await Promise.all([
    attachHourlyGamePoolsToRows(supabase, recentGameRows),
    user
      ? supabase
          .schema("prediction")
          .from("predictions")
          .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
          .eq("user_id", user.id)
          .eq("is_active", true)
      : Promise.resolve({ data: [] }),
  ]);

  let mappedGames = recentGameRowsWithPools.map(mapPredictionGameRowToCardModel);
  const userPredictions = (userPredictionsResult.data || []) as Array<{
    prediction_id: string;
    game_id: string;
    bet_amount: number;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  }>;

  const fallbackGames = [
    {
      id: "game-sample-crypto-1",
      slug: "crypto-bitcoin-100k-usd",
      title: "🪙 비트코인, 이번 주 $120,000 신고점 경신할까?",
      description:
        "글로벌 가상자산 현물 ETF 자금 유입 기조 속 $120,000 사상 최고가 도달 여부 예측입니다.",
      predictionType: PredictionType.BINARY,
      category: "INVEST",
      options: [
        { id: "opt-yes", text: "돌파 (YES)", currentOdds: 0.74 },
        { id: "opt-no", text: "미달 (NO)", currentOdds: 0.26 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 50000,
      currentParticipants: 4120,
      status: GameStatus.ACTIVE,
      totalStake: 210000,
      gameImportanceScore: 99,
      allocatedPrizePool: 80000,
      createdAt: new Date(),
    },
    {
      id: "game-sample-sports-1",
      slug: "sports-son-goal-score",
      title: "⚽ 손흥민, 이번 주말 리그 경기에서 득점할까?",
      description:
        "주전 공격수 출전이 확정된 주말 프리미어리그 핵심 라운드 손흥민 선수 득점 여부 예측입니다.",
      predictionType: PredictionType.BINARY,
      category: "SPORTS",
      options: [
        { id: "opt-yes", text: "득점 성공 (YES)", currentOdds: 0.65 },
        { id: "opt-no", text: "무득점 (NO)", currentOdds: 0.35 },
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      settlementTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      minimumStake: 100,
      maximumStake: 10000,
      currentParticipants: 2890,
      status: GameStatus.ACTIVE,
      totalStake: 95000,
      gameImportanceScore: 96,
      allocatedPrizePool: 30000,
      createdAt: new Date(),
    },
  ];

  if (mappedGames.length === 0) {
    mappedGames = fallbackGames;
  }

  const dataSources = [
    { name: "Alpha Vantage", desc: "실시간 주가" },
    { name: "DART", desc: "기업 실적 공시" },
    { name: "KOSIS", desc: "국가 통계" },
    { name: "KOBIS·닐슨", desc: "문화·시청률" },
    { name: "중앙선관위", desc: "공식 선거·의안" },
  ];

  const headerTitle =
    filterParam === "hot"
      ? "🔥 인기·핫이슈 예측 마켓"
      : filterParam === "high-pool"
        ? "💰 고액 상금풀 예측 마켓"
        : filterParam === "closing"
          ? "⏰ 마감 임박 예측 마켓"
          : "🎯 전체 예측 마켓";

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <FadeIn>
          <DomainContextHeader
            domain="prediction"
            title={headerTitle}
            subtitle="무위험 참여 자산(PMP)으로 미래 이슈를 예측하고, 적중 시 MoneyWave 상금풀에서 PMC를 획득하세요"
            metrics={[
              {
                label: "MoneyWave 상금풀",
                value: Math.round(platformTotalPool || 66461),
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
              depthLevel={1}
              category="all"
              initialPool={platformTotalPool}
            />
          </div>

          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath="/prediction"
            showCategoryFilter={false}
            showSortToolbar={true}
            initialSort={initialSort}
          />
        </FadeIn>
      </div>
    </div>
  );
}
