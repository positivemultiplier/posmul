import { createClient } from "../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import Link from "next/link"; // Link import 추가
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../components/prediction-game-mapper";

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    league?: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

type CardModel = ReturnType<typeof mapPredictionGameRowToCardModel>;

const applyLeagueFilter = <Q extends { eq: (column: string, value: string) => Q }>(
  query: Q,
  league?: string
): Q => {
  return league ? query.eq("league", league) : query;
};

const applySort = <Q extends { order: (column: string, options: { ascending: boolean }) => Q }>(
  query: Q,
  sort: string
): Q => {
  if (sort === "closing_soon") {
    return query.order("registration_end", { ascending: true });
  }
  // "latest" / "prize_pool" / default
  return query.order("created_at", { ascending: false });
};

const fetchUserPredictions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
  games: PredictionGameRow[]
): Promise<UserPrediction[]> => {
  if (!userId || games.length === 0) return [];

  const gameIds = games.map((g) => g.game_id);
  const { data: predictions } = await supabase
    .schema("prediction")
    .from("predictions")
    .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("game_id", gameIds);

  return (predictions ?? []) as UserPrediction[];
};

const sortMappedGamesIfNeeded = (
  sort: string,
  mappedGames: CardModel[]
) => {
  if (sort !== "prize_pool") return mappedGames;
  return [...mappedGames].sort(
    (a, b) => b.allocatedPrizePool - a.allocatedPrizePool
  );
};

export default async function SoccerPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams?.sort || "latest"; // default sort
  const league = resolvedSearchParams?.league; // league filter

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // Get aggregated prize pool for SOCCER
  const soccerPool = await getAggregatedPrizePool(supabase, "SPORTS", "soccer");

  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "SPORTS")
    .eq("subcategory", "soccer")
    .in("status", ["ACTIVE", "DRAFT"]);

  // League Filtering
  query = applyLeagueFilter(query, league);

  // Sorting logic (DB 컬럼 의존 제거: prize_pool은 MoneyWave Truth를 붙인 뒤 로컬 정렬)
  query = applySort(query, sort);

  query = query.limit(20);

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error("SoccerPage Supabase error", error.message);
  }
  const games = (data ?? []) as PredictionGameRow[];

  // 사용자의 예측 목록 조회
  const userPredictions = await fetchUserPredictions(
    supabase,
    user?.id,
    games
  );

  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, games);

  const mappedGames = sortMappedGamesIfNeeded(
    sort,
    gamesWithPools.map(mapPredictionGameRowToCardModel)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
              ⚽ 축구 예측
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              전 세계 주요 축구 리그의 승패를 예측하고 PMC 상금을 획득하세요.
              <br />
              프리미어리그, 라리가, 분데스리가 등 다양한 리그가 준비되어 있습니다.
            </p>
          </FadeIn>
        </div>

        {/* MoneyWave Card (Depth 3: Soccer, Depth 4: League) */}
        <div className="mb-12">
          <HoverLift>
            <CompactMoneyWaveCard
              depthLevel={league ? 4 : 3}
              category="sports"
              subcategory="soccer"
              league={league}
              initialPool={soccerPool}
            />
          </HoverLift>
        </div>

        {/* League Navigation (Explicit Routing) */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max">
            {[
              { href: "/prediction/sports/soccer", label: "전체", isActive: !league },
              { href: "/prediction/sports/soccer/epl", label: "🇬🇧 EPL", isActive: false },
              { href: "/prediction/sports/soccer/laliga", label: "🇪🇸 라리가", isActive: false },
              { href: "/prediction/sports/soccer/bundesliga", label: "🇩🇪 분데스리가", isActive: false },
              { href: "/prediction/sports/soccer/seriea", label: "🇮🇹 세리에A", isActive: false },
              { href: "/prediction/sports/soccer/kleague", label: "🇰🇷 K-리그", isActive: false },
              { href: "/prediction/sports/soccer/champions", label: "🇪🇺 챔피언스리그", isActive: false },
            ].map((lg) => (
              <Link
                key={lg.href}
                href={lg.href}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${lg.isActive
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
              >
                {lg.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Filter & Sort Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
              전체 {mappedGames.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm border border-green-500/30">
              진행중
            </span>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <Link
              href="?sort=latest"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'latest'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              최신순
            </Link>
            <Link
              href="?sort=prize_pool"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'prize_pool'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              상금 높은순 💰
            </Link>
            <Link
              href="?sort=closing_soon"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'closing_soon'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              마감 임박 ⏰
            </Link>
          </div>
        </div>

        {/* Prediction Games Grid */}
        <ClientPredictionGamesGrid
          games={mappedGames}
          userId={user?.id}
          userPredictions={userPredictions}
          basePath="/prediction/sports/soccer"
        />
      </div>
    </div>
  );
}
