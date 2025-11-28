import { createClient } from "../../../../lib/supabase/server";
import { TrendingUp, Users, Activity, Coins } from "lucide-react";

interface EconomyStatsData {
  total_pmp_issued: number;
  total_pmc_held: number;
  active_prediction_games: number;
  participating_users: number;
}

export default async function EconomyStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_economy_stats');

  if (error) {
    console.error('Error fetching economy stats:', error);
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-3xl font-bold text-gray-500 mb-2">-</div>
            <div className="text-gray-600">로딩 중...</div>
          </div>
        ))}
      </div>
    );
  }

  const stats = data as EconomyStatsData;

  const statItems = [
    {
      icon: Coins,
      value: stats.total_pmp_issued?.toLocaleString() || 0,
      label: "총 PMP 발행량",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: TrendingUp,
      value: stats.total_pmc_held?.toLocaleString() || 0,
      label: "총 PMC 보유량",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      icon: Activity,
      value: stats.active_prediction_games?.toLocaleString() || 0,
      label: "활성 예측 게임",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: Users,
      value: stats.participating_users?.toLocaleString() || 0,
      label: "참여 사용자",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`group relative overflow-hidden p-6 bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300`}
          >
            {/* Icon */}
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Value */}
            <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.value}
            </div>

            {/* Label */}
            <div className="text-sm text-gray-400">{stat.label}</div>

            {/* Hover Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          </div>
        );
      })}
    </div>
  );
}
