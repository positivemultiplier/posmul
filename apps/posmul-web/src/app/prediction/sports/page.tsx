import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../components/ClientPredictionGamesGrid";
import { PredictionType, GameStatus } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";

interface PageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const SPORT_WHITELIST = [
  "soccer",
  "baseball",
  "basketball",
  "esports",
  "other",
] as const;

const normalizeSport = (sport?: string) => {
  if (!sport) return undefined;
  return SPORT_WHITELIST.includes(sport as (typeof SPORT_WHITELIST)[number])
    ? sport
    : undefined;
};

export default async function PredictionSportsPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const safeSport = normalizeSport(resolvedSearchParams?.sport);

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // Get active sports pool
  const sportsPool = await getAggregatedPrizePool(supabase, 'SPORTS', safeSport || undefined);

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "SPORTS")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (safeSport) {
    query = query.or(
      `metadata->>sport.eq.${safeSport},tags.cs.{${safeSport}}`
    );
  }

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error("PredictionSportsPage Supabase error", error.message);
  }
  const games = data ?? [];

  // 사용자의 예측 목록 조회
  let userPredictions: UserPrediction[] = [];
  if (user && games.length > 0) {
    const gameIds = games.map(g => g.game_id);
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("game_id", gameIds);

    userPredictions = predictions || [];
  }

  // 게임 ID로 사용자 예측 찾기
  const getUserPrediction = (gameId: string): UserPrediction | undefined => {
    return userPredictions.find(p => p.game_id === gameId);
  };

  const visibleGames = (() => {
    if (!safeSport || !games.length) {
      return games;
    }

    const filtered = games.filter((game) => {
      const metadata = (game.metadata ?? {}) as { sport?: string };
      const metadataMatch = metadata.sport === safeSport;
      const tagsMatch = Array.isArray(game.tags)
        ? game.tags.includes(safeSport)
        : false;
      return metadataMatch || tagsMatch;
    });

    return filtered.length ? filtered : games;
  })();

  const filters = [
    { label: "전체", value: undefined },
    { label: "축구", value: "soccer" },
    { label: "야구", value: "baseball" },
    { label: "농구", value: "basketball" },
    { label: "e스포츠", value: "esports" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-12">
            <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ⚽ 스포츠 예측
            </h1>
            <p className="text-xl text-gray-400">
              축구, 야구, 농구, e스포츠 경기 결과를 예측하고 PMC를 획득하세요
            </p>
          </div>

          {/* MoneyWave 상금풀 현황 (Depth 2: 스포츠 카테고리) */}
          <div className="mb-8">
            <CompactMoneyWaveCard
              depthLevel={2}
              category="sports"
              initialPool={sportsPool}
            />
          </div>

          <div className="mb-8 flex gap-4">
            {filters.map((filter) => (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/prediction/sports/${filter.value}`
                    : "/prediction/sports"
                }
                className={`px-4 py-2 rounded-lg border transition-all ${safeSport === filter.value
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400"
                  }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>


          <ClientPredictionGamesGrid
            games={(() => {
              // Visible Games를 도메인 모델로 매핑
              return visibleGames.map((game: any) => {
                const gameOptions = game.metadata?.options || [
                  { id: '1', text: '예', currentOdds: 0.5 },
                  { id: '2', text: '아니오', currentOdds: 0.5 }
                ];
                return {
                  id: game.id,
                  slug: game.slug || game.id,
                  title: game.title,
                  description: game.description,
                  predictionType: game.prediction_type?.toUpperCase() || PredictionType.BINARY,
                  options: gameOptions,
                  startTime: game.start_time,
                  endTime: game.end_time,
                  settlementTime: game.settlement_time,
                  minimumStake: game.minimum_stake || 100,
                  maximumStake: game.maximum_stake || 10000,
                  maxParticipants: game.max_participants,
                  currentParticipants: game.total_participants_count || 0,
                  status: game.status || GameStatus.ACTIVE,
                  totalStake: game.total_stake_amount || 0,
                  gameImportanceScore: game.game_importance_score || 1.0,
                  allocatedPrizePool: game.allocated_prize_pool || 0,
                  createdAt: game.created_at,
                };
              });
            })()}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={safeSport ? `/prediction/sports/${safeSport}` : '/prediction/sports/soccer'}
          />
        </FadeIn>
      </div>
    </div>
  );
}
