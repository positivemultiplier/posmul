import { createClient } from "../../lib/supabase/server";
import { ClientPredictionGamesGrid, type SortOption } from "./components/ClientPredictionGamesGrid";
import { getCachedActivePredictionFeed } from "./components/prediction-public-cache";
import { getCachedEffectiveFeatureFlags } from "../../shared/lib/feature-flags/feature-flags.server";
import {
  PredictionType,
  GameStatus,
} from "../../bounded-contexts/prediction/domain/value-objects/prediction-types";

// 최신 DB 게임 및 실시간 MoneyWave 상금풀 (공개 피드는 15초 서버 캐시, 개인 베팅만 경량 조회)
export const dynamic = "force-dynamic";

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

  // 1단계 병렬: 15초 캐시된 공개 마켓 피드 + 60초 캐시된 기능 플래그 + 현재 유저 세션 확인
  const [cachedFeed, featureFlagsData, userResult] = await Promise.all([
    getCachedActivePredictionFeed(),
    getCachedEffectiveFeatureFlags(),
    supabase.auth.getUser(),
  ]);

  const flags = featureFlagsData.effectiveMap;
  const user = userResult.data?.user ?? null;
  const { platformTotalPool } = cachedFeed;
  // Admin에서 OFF 처리한 카테고리 게임은 메인 피드에서 즉시 숨김
  let mappedGames = cachedFeed.mappedGames.filter((g) => {
    const cat = (g.category ?? "").toUpperCase();
    if (cat === "ECONOMY" && flags["prediction.cat.economy"] === false) return false;
    if (cat === "SPORTS" && flags["prediction.cat.sports"] === false) return false;
    if (cat === "ENTERTAINMENT" && flags["prediction.cat.entertainment"] === false) return false;
    if (cat === "POLITICS" && flags["prediction.cat.politics"] === false) return false;
    return true;
  });

  // 2단계: 로그인 유저일 때만 개인 활성 참여 내역 단 1쿼리 조회
  const userPredictionsResult = user
    ? await supabase
        .schema("prediction")
        .from("predictions")
        .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
    : { data: [] };

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
      title: "비트코인, 이번 주 $120,000 신고점 경신할까?",
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
      title: "손흥민, 이번 주말 리그 경기에서 득점할까?",
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

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">
        <ClientPredictionGamesGrid
          games={mappedGames}
          userId={user?.id}
          userPredictions={userPredictions}
          basePath="/prediction"
          showCategoryFilter={false}
          showSortToolbar={true}
          initialSort={initialSort}
          platformTotalPool={platformTotalPool}
        />
      </div>
    </div>
  );
}
