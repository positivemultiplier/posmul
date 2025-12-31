import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { FadeIn } from "../HomeClientComponents";
import { Activity, Vote, Film, Store, TrendingUp, Target } from "lucide-react";
import { ClientPredictionGamesGrid } from "./components/ClientPredictionGamesGrid";
import { CompactMoneyWaveCard } from "../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../bounded-contexts/prediction/application/prediction-pool.service";
import {
  attachHourlyGamePoolsToRows,
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

  const totalActiveGames = (games?.length || 0);

  const categories = [
    {
      href: "/prediction/sports",
      icon: Activity,
      emoji: "⚽",
      title: "스포츠",
      count: categoryCounts.SPORTS,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-900/50 to-slate-900",
      image: "/images/cards/prediction-sports.png",
    },
    {
      href: "/prediction/politics",
      icon: Vote,
      emoji: "🗳️",
      title: "정치",
      count: categoryCounts.POLITICS,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-900/50 to-slate-900",
      image: "/images/cards/prediction-politics.png",
    },
    {
      href: "/prediction/consume",
      icon: Store,
      emoji: "💳",
      title: "소비",
      count: categoryCounts.INVEST,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-900/50 to-slate-900",
      image: "/images/cards/prediction_consume.png",
    },
    {
      href: "/prediction/entertainment",
      icon: Film,
      emoji: "🎭",
      title: "엔터테인먼트",
      count: categoryCounts.ENTERTAINMENT,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-900/50 to-slate-900",
      image: "/images/cards/prediction_entertainment.png",
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

  const recentGameRows = (recentGames ?? []) as PredictionGameRow[];
  const recentGameRowsWithPools = await attachHourlyGamePoolsToRows(supabase, recentGameRows);
  const mappedGames = recentGameRowsWithPools.map(mapPredictionGameRowToCardModel);

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
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-white">
      {/* Header - Forum 스타일 */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-indigo-950/80 border-b border-indigo-800/50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                🎯 Prediction
              </h1>
              <p className="text-sm text-indigo-400/70">예측 게임 · PMP 배팅</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">진행 중</p>
              <p className="text-xl font-bold text-indigo-400">
                <span className="text-2xl">{totalActiveGames}</span>
                <span className="text-sm ml-1">게임</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <FadeIn>
          <CompactMoneyWaveCard depthLevel={1} initialPool={platformTotalPool} />
        </FadeIn>

        {/* Category Grid - Forum 카드 스타일 */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            카테고리별 예측
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <FadeIn key={category.href}>
                  <Link href={category.href}>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-800 hover:border-indigo-400/50 transition-all cursor-pointer group">
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-r ${category.bgColor} opacity-80`} />

                      <div className="absolute inset-0 p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors drop-shadow-md">
                            {category.emoji} {category.title}
                          </h3>
                          <p className="text-sm text-slate-300 font-medium">
                            {category.count}개 게임
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Recent Games */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            최근 게임
          </h2>
          <ClientPredictionGamesGrid
            games={mappedGames}
            userId={user?.id}
            userPredictions={userPredictions}
          />
        </section>
      </main>
    </div>
  );
}
