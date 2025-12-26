/**
 * Champions League Fixed Page
 * Depth 4: League Level
 */
import { createClient } from "../../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../../components/ClientPredictionGamesGrid";
import { SoccerLeagueStickyHeaderClient } from "../../../components/soccer/SoccerLeagueStickyHeaderClient";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "../../../components/prediction-game-mapper";

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

  const toFiniteNumber = (value: unknown): number | null => {
    const n = typeof value === "string" ? Number(value) : value;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  };

  const { data: { user } } = await supabase.auth.getUser();

  const query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("category", "SPORTS")
    .eq("subcategory", "soccer")
    .eq("league", LEAGUE)
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .limit(20);

  const { data, error } = await query;
  if (error) {
    void error;
  }
  const gameRows = (data ?? []) as PredictionGameRow[];
  const gameRowsWithPools = await attachHourlyGamePoolsToRows(supabase, gameRows);

  const leaguePool = Math.floor(
    gameRowsWithPools.reduce((sum, game) => {
      const v = toFiniteNumber(game.allocated_prize_pool);
      return v === null ? sum : sum + v;
    }, 0)
  );

  let userPredictions: UserPrediction[] = [];
  if (user && gameRows.length > 0) {
    const gameIds = gameRows.map((g) => g.game_id);
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("game_id", gameIds);
    if (predictions) userPredictions = predictions as UserPrediction[];
  }

  const mappedGames = gameRowsWithPools.map(mapPredictionGameRowToCardModel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <SoccerLeagueStickyHeaderClient />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
