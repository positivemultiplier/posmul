/**
 * Soccer Prediction Detail Client Component
 *
 * PredictionDetailView + PredictionChartView 컴포넌트를 결합한
 * 그래프가 포함된 고급 상세페이지 클라이언트 컴포넌트
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
/**
 * Soccer Prediction Detail Client Component
 *
 * Immersive Redesign applied (2025-12-24)
 */
"use client";

import { useState, useTransition, useEffect } from "react";
import { PredictionDetailView } from "../../../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { PredictionChartView } from "../../../../../bounded-contexts/prediction/presentation/components/charts/PredictionChartView";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../shared/ui/components/base";
import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { placeBet, withdrawBet } from "./actions";
import { FadeIn } from "../../../../../shared/ui/components/animations";
import { Users, BarChart2, Info, ArrowLeft, Trophy, Calendar, Clock, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

interface PredictionOption {
  id: string;
  label: string;
  probability: number;
  odds: number;
  volume: number;
  change24h: number;
}

interface PredictionGameDetail {
  id: string;
  title: string;
  description: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: PredictionOption[];
  totalVolume: number;
  participantCount: number;
  endTime: string;
  settlementTime: string;
  status: "ACTIVE" | "ENDED" | "SETTLED";
  category: string;
  creator: {
    name: string;
    reputation: number;
    avatar: string;
  };
  prizePool: number;
  minimumStake: number;
  maximumStake: number;
}

interface SoccerPredictionDetailClientProps {
  game: PredictionGameDetail;
  userBalance: {
    pmp: number;
    pmc: number;
  };
  userBets: Array<{
    betId: string;
    selectedOption: string;
    betAmount: number;
    status: string;
    createdAt: string;
  }>;
  slug: string;
}

type TabType = "prediction" | "charts" | "info";

export function SoccerPredictionDetailClient({
  game,
  userBalance,
  userBets,
  slug,
}: SoccerPredictionDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("prediction");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);
  const [betResult, setBetResult] = useState<{ success: boolean; message: string } | null>(null);
  const [withdrawingBetId, setWithdrawingBetId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for sticky header effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ISO string to Date conversion
  const gameWithDates = {
    ...game,
    endTime: new Date(game.endTime),
    settlementTime: new Date(game.settlementTime),
  };

  const handleParticipate = async (optionId: string, amount: number) => {
    setBetResult(null);
    startTransition(async () => {
      const result = await placeBet({ gameId: game.id, optionId, stakeAmount: amount });
      setBetResult({ success: result.success, message: result.message });
      if (result.success && result.newBalance !== undefined) {
        setBalance((prev) => ({ ...prev, pmp: result.newBalance! }));
        setBets((prev) => [{
          betId: result.predictionId || '',
          selectedOption: optionId,
          betAmount: amount,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    });
  };

  const handleWithdraw = async (betId: string) => {
    if (!confirm("정말로 이 베팅을 철회하시겠습니까? 베팅 금액은 전액 환불됩니다.")) return;
    setWithdrawingBetId(betId);
    setBetResult(null);
    const result = await withdrawBet(betId, slug);
    setBetResult({ success: result.success, message: result.message });
    if (result.success) {
      setBets((prev) => prev.filter((bet) => bet.betId !== betId));
      if (result.newBalance !== undefined) {
        setBalance((prev) => ({ ...prev, pmp: result.newBalance! }));
      }
    }
    setWithdrawingBetId(null);
  };

  // Dummy Chart Data Generation
  const generateChartData = () => {
    const probabilityData = game.predictionType === "binary"
      ? Array.from({ length: 7 }, (_, i) => ({
        time: `${9 + i}:00`,
        optionA: 45 + Math.random() * 10,
        optionB: 55 - Math.random() * 10
      }))
      : game.options.map((opt, idx) => ({
        time: `T${idx + 1}`,
        probability: opt.probability * 100,
        confidence: 0.8 + Math.random() * 0.15,
      }));

    const bettingData = game.options.map((opt, idx) => ({
      option: opt.label,
      amount: opt.volume,
      percentage: Math.round(opt.probability * 100),
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][idx % 5],
    }));

    return { probabilityData, bettingData };
  };

  const { probabilityData, bettingData } = generateChartData();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">

      {/* Immersive Hero Header */}
      <div className="relative h-[300px] w-full overflow-hidden">
        {/* Background Gradient & Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-950/80 to-slate-950 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=2546&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm scale-110" />

        {/* Navigation & Breadcrumb */}
        <div className="relative z-20 container mx-auto px-4 pt-6">
          <Link href="/prediction/sports/soccer" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-6">
            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">돌아가기</span>
          </Link>

          {/* Game Title Area */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                {game.category.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${game.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}>
                {game.status === 'ACTIVE' ? 'LIVE NOW' : game.status}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(game.endTime).toLocaleDateString()} 마감
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight drop-shadow-lg">
              {game.title}
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl line-clamp-2">
              {game.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-30 pb-20">

        {/* Sticky MoneyWave Card (Depth 5: Individual Game) */}
        <div className="sticky top-4 z-40 mb-8 backdrop-blur-md bg-slate-950/50 pt-2 rounded-xl">
          <CompactMoneyWaveCard
            depthLevel={5}
            category="sports"
            subcategory="soccer"
            gameId={game.id}
            initialPool={game.prizePool}
            className="shadow-2xl border border-slate-700/50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Custom Tabs */}
            <div className="flex items-center p-1.5 bg-slate-900/80 backdrop-blur rounded-xl border border-white/5 w-full sm:w-fit">
              {[
                { id: "prediction", label: "예측하기", icon: Trophy },
                { id: "charts", label: "차트분석", icon: BarChart2 },
                { id: "info", label: "정보", icon: Info },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={twMerge(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-lg shadow-white/10 ring-1 ring-white/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "prediction" && (
                <FadeIn>
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <PredictionDetailView
                      game={gameWithDates}
                      userBalance={balance}
                      onParticipate={handleParticipate}
                    />
                  </div>
                </FadeIn>
              )}

              {activeTab === "charts" && (
                <FadeIn>
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <PredictionChartView
                      gameId={game.id}
                      predictionType={game.predictionType === "binary" ? "BINARY" : "MULTIPLE_CHOICE"}
                      probabilityData={probabilityData}
                      bettingData={bettingData}
                    />
                  </div>
                </FadeIn>
              )}

              {activeTab === "info" && (
                <FadeIn>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard title="게임 규칙" icon={Calendar}>
                      <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex justify-between">
                          <span>참여 마감</span>
                          <span className="text-white font-medium">{new Date(game.endTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>결과 정산</span>
                          <span className="text-white font-medium">{new Date(game.settlementTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>최소 베팅</span>
                          <span className="text-white font-medium">{game.minimumStake.toLocaleString()} PMP</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between">
                          <span className="text-yellow-400">총 상금 풀</span>
                          <span className="text-yellow-400 font-bold text-lg">{game.prizePool.toLocaleString()} PMC</span>
                        </div>
                      </div>
                    </InfoCard>
                    <InfoCard title="생성자" icon={Users}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                          {game.creator.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{game.creator.name}</div>
                          <div className="text-yellow-400 text-sm">⭐ Reputation Score: {game.creator.reputation}</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400 leading-relaxed">
                        이 생성자는 최근 10개의 게임 중 9개를 성공적으로 정산했습니다. 높은 신뢰도를 가진 사용자입니다.
                      </div>
                    </InfoCard>
                  </div>
                </FadeIn>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">

            {/* User Status Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                내 활동
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">보유 자산</div>
                    <div className="text-green-400 font-bold">{balance.pmp.toLocaleString()} PMP</div>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">총 베팅</div>
                    <div className="text-blue-400 font-bold">
                      {bets.reduce((sum, b) => sum + (b.status !== 'CANCELLED' ? b.betAmount : 0), 0).toLocaleString()} PMP
                    </div>
                  </div>
                </div>

                {bets.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">최근 베팅</div>
                    {bets.slice(0, 3).map((bet) => (
                      <div key={bet.betId} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {game.options.find(o => o.id === bet.selectedOption)?.label || 'Option'}
                          </div>
                          <div className="text-xs text-slate-400">{new Date(bet.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">{bet.betAmount.toLocaleString()}</div>
                          {game.status === 'ACTIVE' && bet.status === 'PENDING' && (
                            <button
                              onClick={() => handleWithdraw(bet.betId)}
                              disabled={withdrawingBetId === bet.betId}
                              className="text-[10px] text-red-400 hover:text-red-300 underline mt-0.5"
                            >
                              {withdrawingBetId === bet.betId ? '처리중...' : '철회'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500">
                    아직 참여 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Ticker (Mock) */}
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5">
              <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Market Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">👤</div>
                    <div className="flex-1">
                      <span className="text-slate-300">Someone bet </span>
                      <span className="text-green-400 font-bold">{Math.floor(Math.random() * 5000 + 1000).toLocaleString()} PMP</span>
                    </div>
                    <div className="text-slate-500">Just now</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Helper Component for Info Cards
function InfoCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
          <Icon className="w-4 h-4" />
        </div>
        {title}
      </h3>
      {children}
    </div>
  );
}
