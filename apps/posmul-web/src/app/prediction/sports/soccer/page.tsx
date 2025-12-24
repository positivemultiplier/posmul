import { createClient } from "../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import { PredictionType, GameStatus } from "../../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import Link from "next/link"; // Link import 추가
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";

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
    // 축구 관련 태그나 메타데이터 필터링이 필요할 수 있음
    // 현재는 soccer 경로이므로 명시적으로 필터링하거나,
    // 태그 시스템이 있다면 .contains("tags", ["soccer"]) 등을 사용
    .in("status", ["ACTIVE", "DRAFT"]);

  // Soccer specific filtering strategy
  // 1. Check if 'category' column exists and equals 'SPORTS'
  // 2. Check metadata or tags for 'soccer'
  // For now, filtering by category 'SPORTS' and assuming checking tags/metadata is handled either here or by ensuring data integrity.
  // Adding explicit filter for demonstration if 'soccer' tag is used:
  query = query.or("metadata->>sport.eq.soccer,tags.cs.{soccer}");

  // League Filtering
  if (league) {
    // metadata->league or tags contains league
    query = query.or(`metadata->>league.eq.${league},tags.cs.{${league}}`);
  }


  // Sorting logic
  switch (sort) {
    case "prize_pool":
      query = query.order("allocated_prize_pool", { ascending: false });
      break;
    case "closing_soon":
      query = query.order("end_time", { ascending: true }); // 마감 임박 = end_time이 가까운 미래
      break;
    case "latest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.limit(20);

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error("SoccerPage Supabase error", error.message);
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

    if (predictions) {
      userPredictions = predictions as UserPrediction[];
    }
  }

  // 데이터 매핑
  const mappedGames = games.map((game) => {
    // JSON 파싱 (옵션)
    let gameOptions = [];
    try {
      if (typeof game.game_options === 'string') {
        gameOptions = JSON.parse(game.game_options);
      } else if (Array.isArray(game.game_options)) {
        // 이미 배열인 경우 (Supabase 클라이언트가 자동 변환했을 수 있음)
        // 하지만 DB 타입이 jsonb[] 또는 jsonb라면 확인 필요.
        // 보통 jsonb 컬럼은 객체나 배열로 반환됨.
        // 여기서는 포맷을 맞추기 위해 매핑
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gameOptions = game.game_options.map((opt: any) => ({
          id: opt.id,
          text: opt.label || opt.text, // label or text
          currentOdds: opt.currentOdds || 0.5 // default
        }));
      }
    } catch (e) {
      console.error("Failed to parse game options", e);
    }

    // 만약 파싱 실패했거나 형식이 안맞으면 기본값 처리 (방어 코드)
    if (!gameOptions || gameOptions.length === 0) {
      // 임시 더미 데이터 또는 빈 배열
      gameOptions = [
        { id: '1', text: 'Yes', currentOdds: 0.5 },
        { id: '2', text: 'No', currentOdds: 0.5 }
      ];
    }

    return {
      id: game.game_id,
      slug: game.slug || game.game_id, // slug가 없으면 id 사용
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
  }) || [];

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
