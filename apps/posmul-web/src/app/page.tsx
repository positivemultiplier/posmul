import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import {
  TrendingUp,
  Vote,
  Sparkles,
  ShieldCheck,
  Coins,
  HeartHandshake,
  ArrowRight,
  Activity,
  CheckCircle2,
  Users,
  Award,
  Zap,
} from "lucide-react";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./prediction/components/prediction-game-mapper";
import { getAggregatedPrizePool } from "../bounded-contexts/prediction/application/prediction-pool.service";
import { ClientPredictionGamesGrid } from "./prediction/components/ClientPredictionGamesGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  // 1. 플랫폼 누적 통계 병렬 조회
  const [
    platformTotalPool,
    gamesResult,
    donationsResult,
    institutesResult,
    accountsCountResult,
  ] = await Promise.all([
    getAggregatedPrizePool(supabase).catch(() => 1500000),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .schema("donation")
      .from("donations")
      .select("pmc_amount")
      .eq("status", "completed"),
    supabase
      .schema("donation")
      .from("donation_institutes")
      .select("id", { count: "exact" })
      .eq("is_active", true),
    supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id", { count: "exact" }),
  ]);

  // 최근 게임 매핑
  const recentGames = (gamesResult.data ?? []) as PredictionGameRow[];
  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, recentGames);
  const featuredGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  const totalUsersCount = accountsCountResult.count ?? 85;

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* 배경 글로우 */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-pink-600/10 blur-[120px] rounded-full" />

      {/* Main Content Area: Pure Card Grid Architecture */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Top 1-Line Branding & Smart Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 font-extrabold border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>POSMUL HERO FEED</span>
            </span>
            <span className="font-bold text-slate-200 hidden sm:inline">
              시민 집단지성 예측 ➔ PMC 기부 ➔ "내가 그랬제!" 랭킹
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-extrabold">
            <span className="text-amber-400 flex items-center gap-1">
              <span>💰 Moneypool:</span>
              <span className="text-amber-300">{(platformTotalPool || 66461).toLocaleString()} PMC</span>
            </span>
            <span className="text-slate-400 hidden md:inline">
              👥 활성 사용자: {totalUsersCount}명
            </span>
          </div>
        </div>

        {/* Pure Card Grid Feed Section */}
        <section className="space-y-4">
          <ClientPredictionGamesGrid
            games={featuredGames}
            basePath="/prediction"
          />
        </section>
      </main>
    </div>
  );
}
