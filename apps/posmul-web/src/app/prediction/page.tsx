import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { FadeIn } from "../HomeClientComponents";
import { Activity, Vote, Film, Store } from "lucide-react";
import { ClientPredictionGamesGrid } from "./components/ClientPredictionGamesGrid";
import { CompactMoneyWaveCard } from "../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./components/prediction-game-mapper";

export default async function PredictionPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get platform total prize pool
  const platformTotalPool = await getAggregatedPrizePool(supabase);

  // Get game counts by category
  const { data: games } = await supabase
    .schema('prediction')
    .from('prediction_games')
    .select('category, status')
    .eq('status', 'ACTIVE');

  const categoryCounts = {
    SPORTS: games?.filter(g => g.category === 'SPORTS').length || 0,
    POLITICS: games?.filter(g => g.category === 'POLITICS').length || 0,
    INVEST: games?.filter(g => g.category === 'INVEST').length || 0,
    ENTERTAINMENT: games?.filter(g => g.category === 'ENTERTAINMENT').length || 0,
  };

  const categories = [
    {
      href: "/prediction/sports",
      icon: Activity,
      emoji: "⚽",
      title: "스포츠",
      count: categoryCounts.SPORTS,
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-400",
    },
    {
      href: "/prediction/politics",
      icon: Vote,
      emoji: "🗳️",
      title: "정치",
      count: categoryCounts.POLITICS,
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-400",
    },
    {
      href: "/prediction/consume",
      icon: Store,
      emoji: "💳",
      title: "소비",
      count: categoryCounts.INVEST,
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-400",
    },
    {
      href: "/prediction/entertainment",
      icon: Film,
      emoji: "🎭",
      title: "엔터테인먼트",
      count: categoryCounts.ENTERTAINMENT,
      gradient: "from-orange-500/10 to-red-500/10",
      iconColor: "text-orange-400",
    },
  ];

  // Get recent active games with all required fields
  const { data: recentGames } = await supabase
    .schema('prediction')
    .from('prediction_games')
    .select("*")
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(6);

  const mappedGames = ((recentGames ?? []) as PredictionGameRow[]).map(
    mapPredictionGameRowToCardModel
  );

  // Get user's active predictions if logged in
  let userPredictions: Array<{
    prediction_id: string;
    game_id: string;
    bet_amount: number | null;
    is_active: boolean;
    prediction_data: Record<string, unknown> | null;
  }> = [];

  if (user) {
    const { data: predictions } = await supabase
      .schema('prediction')
      .from('predictions')
      .select('prediction_id, game_id, bet_amount, is_active, prediction_data')
      .eq('user_id', user.id)
      .eq('is_active', true);

    userPredictions = predictions || [];
  }

  return (
    <div className="bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] min-h-screen text-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <FadeIn>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎯 예측 게임
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              AI 시대 직접민주주의를 위한 예측 게임 플랫폼
            </p>
          </div>
        </FadeIn>

        {/* MoneyWave 상금풀 현황 (Level 0: 전체) */}
        <FadeIn delay={0.2}>
          <div className="mb-8">
            <CompactMoneyWaveCard depthLevel={1} initialPool={platformTotalPool} />
          </div>
        </FadeIn>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <FadeIn key={category.href} delay={index * 0.1}>
                <Link href={category.href}>
                  <div className={`p-6 bg-gradient-to-br ${category.gradient} backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-pointer`}>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-4 mx-auto">
                      <Icon className={`w-6 h-6 ${category.iconColor}`} />
                    </div>
                    <h3 className="font-semibold text-lg text-center mb-2">{category.title}</h3>
                    <div className="text-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {category.count}
                      </span>
                      <span className="text-sm text-gray-400 ml-1">개</span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Recent Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <h2 className="text-3xl font-bold mb-8 text-center">최근 게임</h2>
        </FadeIn>

        <ClientPredictionGamesGrid
          games={mappedGames}
          userId={user?.id}
          userPredictions={userPredictions}
        />
      </section>
    </div>
  );
}
