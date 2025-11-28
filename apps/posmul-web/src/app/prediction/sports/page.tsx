import { createClient } from "../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    sport?: string;
  }>;
}

interface UserPrediction {
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
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
      .select("game_id, bet_amount, is_active")
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

          <div className="mb-8 flex gap-4">
            {filters.map((filter) => (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/prediction/sports?sport=${filter.value}`
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleGames.length > 0 ? (
              visibleGames.map((game, index) => {
                const myPrediction = getUserPrediction(game.game_id);
                const isParticipated = !!myPrediction;
                
                return (
                <FadeIn key={game.slug ?? `${game.game_id}-${index}`} delay={index * 0.1}>
                  <HoverLift>
                    <Link href={`/prediction/sports/${(game.metadata as any)?.sport || 'other'}/${game.slug}`}>
                      <div className={`h-full rounded-2xl border bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-white/20 relative ${
                        isParticipated 
                          ? 'border-purple-500/50 border-l-4 border-l-purple-500' 
                          : 'border-white/10'
                      }`}>
                        {/* 참여 중 배지 */}
                        {isParticipated && (
                          <div className="absolute top-3 right-3">
                            <span className="rounded-full bg-purple-500 px-2 py-1 text-xs font-medium text-white">
                              🎯 참여 중
                            </span>
                          </div>
                        )}
                        
                        <div className="mb-4 flex items-center gap-2">
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                            스포츠
                          </span>
                          <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs text-green-300">
                            난이도 {game.difficulty}
                          </span>
                        </div>
                        <h3 className="mb-3 line-clamp-2 text-lg font-bold">
                          {game.title}
                        </h3>
                        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                          {game.description}
                        </p>
                        
                        {/* 내 베팅 정보 (참여한 경우) */}
                        {isParticipated && myPrediction && (
                          <div className="mb-3 rounded-lg bg-purple-500/10 border border-purple-500/20 p-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-purple-300">💜 내 베팅</span>
                              <span className="font-medium text-purple-200">
                                {(myPrediction.bet_amount || 0).toLocaleString()} PMP
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>최소 {game.min_bet_amount?.toLocaleString()} PMP</span>
                          <span className={`font-semibold ${isParticipated ? 'text-purple-400' : 'text-blue-400'}`}>
                            {isParticipated ? '상세보기 →' : '참여하기 →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </HoverLift>
                </FadeIn>
              )})
            ) : (
              <div className="col-span-3 py-12 text-center">
                <p className="text-gray-400">
                  진행 중인 스포츠 예측 게임이 없습니다.
                </p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
