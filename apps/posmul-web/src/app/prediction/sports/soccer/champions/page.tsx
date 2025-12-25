/**
 * Champions League Fixed Page
 * Depth 4: League Level
 */
import { createClient } from "../../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../../components/ClientPredictionGamesGrid";
import { PredictionType, GameStatus } from "../../../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import Link from "next/link";
import { getAggregatedPrizePool } from "../../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { ArrowLeft } from "lucide-react";

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export default async function ChampionsLeaguePage() {
  const supabase = await createClient();
  const LEAGUE = "champions";

  const { data: { user } } = await supabase.auth.getUser();
  const leaguePool = await getAggregatedPrizePool(supabase, "SPORTS", "soccer");

  const query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .in("status", ["ACTIVE", "DRAFT"])
    .or("metadata->>sport.eq.soccer,tags.cs.{soccer}")
    .or(`metadata->>league.eq.${LEAGUE},tags.cs.{${LEAGUE}}`)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data, error } = await query;
  if (error) {
    void error;
  }
  const games = data ?? [];

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
    if (predictions) userPredictions = predictions as UserPrediction[];
  }

  const mappedGames = games.map((game) => ({
    id: game.game_id,
    slug: game.slug || game.game_id,
    title: game.title,
    description: game.description,
    predictionType: game.prediction_type?.toUpperCase() || PredictionType.BINARY,
    options: game.game_options || [],
    startTime: game.registration_start,
    endTime: game.registration_end,
    settlementTime: game.settlement_date,
    minimumStake: game.min_bet_amount || 100,
    maximumStake: game.max_bet_amount || 10000,
    maxParticipants: game.max_participants,
    currentParticipants: 0,
    status: game.status || GameStatus.ACTIVE,
    totalStake: 0,
    gameImportanceScore: game.difficulty || 1.0,
    allocatedPrizePool: game.allocated_prize_pool || 0,
    createdAt: game.created_at,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <Link href="/prediction/sports/soccer" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /><span>축구 예측으로 돌아가기</span>
          </Link>
        </FadeIn>

        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">🇪🇺 UEFA 챔피언스리그</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">유럽 최고의 클럽 대회, 챔피언스리그 경기 결과를 예측하고 PMC 상금을 획득하세요!<br />유럽 최강팀들의 치열한 경쟁을 예측해보세요!</p>
          </div>
        </FadeIn>

        <div className="mb-12">
          <HoverLift><CompactMoneyWaveCard depthLevel={4} category="sports" subcategory="soccer" league="champions" initialPool={leaguePool} /></HoverLift>
        </div>

        <FadeIn delay={0.3}>
          <ClientPredictionGamesGrid games={mappedGames} userId={user?.id} userPredictions={userPredictions} basePath="/prediction/sports/soccer/champions" />
        </FadeIn>
      </div>
    </div>
  );
}
