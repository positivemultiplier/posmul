/**
 * La Liga Fixed Page
 * Depth 4: League Level
 */
import { createClient } from "../../../../../lib/supabase/server";
import { FadeIn, HoverLift } from "../../../../../shared/ui/components/animations";
import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../../components/ClientPredictionGamesGrid";
import Link from "next/link";
import { getAggregatedPrizePool } from "../../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { ArrowLeft } from "lucide-react";
import {
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

export default async function LaLigaPage() {
  const supabase = await createClient();
  const LEAGUE = "laliga";

  const { data: { user } } = await supabase.auth.getUser();
  const leaguePool = await getAggregatedPrizePool(supabase, "SPORTS", "soccer");

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
  if (error) console.error("LaLigaPage error", error.message);
  const games = (data ?? []) as PredictionGameRow[];

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

  const mappedGames = games.map(mapPredictionGameRowToCardModel);

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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent mb-6">🇪🇸 라리가 (La Liga)</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">스페인 라리가 경기 결과를 예측하고 PMC 상금을 획득하세요.<br />레알 마드리드, 바르셀로나, 아틀레티코 마드리드의 경쟁을 예측해보세요!</p>
          </div>
        </FadeIn>

        <div className="mb-12">
          <HoverLift><CompactMoneyWaveCard depthLevel={4} category="sports" subcategory="soccer" league="laliga" initialPool={leaguePool} /></HoverLift>
        </div>

        <FadeIn delay={0.3}>
          <ClientPredictionGamesGrid games={mappedGames} userId={user?.id} userPredictions={userPredictions} basePath="/prediction/sports/soccer/laliga" />
        </FadeIn>
      </div>
    </div>
  );
}
