/**
 * Soccer Prediction Detail Client Component
 *
 * Immersive Redesign applied (2025-12-30)
 * Hybrid Layout (Option C): Chart + Betting always visible, details in tabs.
 */
"use client";

import { useState, useTransition } from "react";
import { PredictionDetailView } from "../../../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";
// Import individual charts directly
import { ProbabilityLineChart } from "../../../../../bounded-contexts/prediction/presentation/components/charts/ProbabilityLineChart";
import { BettingDistributionChart } from "../../../../../bounded-contexts/prediction/presentation/components/charts/BettingDistributionChart";
import { ParticipantTimelineChart } from "../../../../../bounded-contexts/prediction/presentation/components/charts/ParticipantTimelineChart";

import { CompactMoneyWaveCard } from "../../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { placeBet, withdrawBet } from "./actions";
import { FadeIn } from "../../../../../shared/ui/components/animations";
import { Users, BarChart2, Info, ArrowLeft, Trophy, Calendar, Clock, Activity, TrendingUp, PieChart, History } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { Card } from "../../../../../shared/ui/components/base";

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
  minimumStake: number;
  maximumStake: number;
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

type TabType = "analysis" | "info" | "my_bets";

export function SoccerPredictionDetailClient({
  game,
  userBalance,
  userBets,
  slug,
}: SoccerPredictionDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);
  const [withdrawingBetId, setWithdrawingBetId] = useState<string | null>(null);

  // ISO string to Date conversion
  const gameWithDates = {
    ...game,
    endTime: new Date(game.endTime),
    settlementTime: new Date(game.settlementTime),
  };

  const handleParticipate = async (optionId: string, amount: number) => {
    console.log("[Client] handleParticipate called", { optionId, amount });
    startTransition(async () => {
      try {
        console.log("[Client] Invoking placeBet server action...");
        const result = await placeBet({ gameId: game.id, optionId, stakeAmount: amount });
        console.log("[Client] placeBet result:", result);
        if (result.success && result.newBalance !== undefined) {
          setBalance((prev) => ({ ...prev, pmp: result.newBalance! }));
          setBets((prev) => [{
            betId: result.predictionId || '',
            selectedOption: optionId,
            betAmount: amount,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          }, ...prev]);
        } else {
          alert(`참여 실패: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (e) {
        console.error("[Client] Error in handleParticipate:", e);
        alert("참여 중 오류가 발생했습니다.");
      }
    });
  };

  const handleWithdraw = async (betId: string) => {
    if (!confirm("정말로 이 베팅을 철회하시겠습니까? 베팅 금액은 전액 환불됩니다.")) return;
    setWithdrawingBetId(betId);
    const result = await withdrawBet(betId, slug);
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

    // Mock participant data
    const participantData = Array.from({ length: 7 }, (_, i) => ({
      time: `${9 + i}:00`,
      count: 20 + i * 12 + Math.floor(Math.random() * 5),
      newParticipants: Math.floor(Math.random() * 10) + 1
    }));

    return { probabilityData, bettingData, participantData };
  };

  const { probabilityData, bettingData, participantData } = generateChartData();

  // Chart Lines Helper
  const getChartLines = () => {
    if (game.predictionType === 'binary') {
      return [
        { dataKey: 'optionA', name: '승리/YES', color: '#3b82f6', strokeWidth: 3 },
        { dataKey: 'optionB', name: '패배/NO', color: '#ef4444', strokeWidth: 3 },
      ];
    }
    return undefined; // Use default
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">

      {/* Immersive Hero Header */}
      <div className="relative h-[240px] w-full overflow-hidden">
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
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
              {game.title}
            </h1>

            {/* Game Stats Bar */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-300">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-purple-200 text-xs font-medium">누적 상금 풀 (PMC)</div>
                  <div className="text-white font-bold text-lg leading-none mt-0.5">
                    {game.prizePool.toLocaleString()} <span className="text-xs font-normal text-purple-300">PMC</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-blue-200 text-xs font-medium">총 거래량 (PMP)</div>
                  <div className="text-white font-bold text-lg leading-none mt-0.5">
                    {game.totalVolume.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="p-1.5 bg-green-500/20 rounded-lg text-green-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-green-200 text-xs font-medium">참여자</div>
                  <div className="text-white font-bold text-lg leading-none mt-0.5">
                    {game.participantCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
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

        {/* Hybrid Layout: Chart + Betting Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Main Content (Chart + Tabs) */}
          <div className="lg:col-span-8 flex flex-col gap-6 order-2 lg:order-1">

            {/* Chart Section (Always Visible) */}
            <Card className="p-6 border-white/5 bg-slate-900/50 hover:border-white/10 transition-colors">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">실시간 확률 트렌드</h3>
              </div>
              <ProbabilityLineChart
                data={probabilityData}
                lines={getChartLines()}
                isDarkMode={true}
              />
            </Card>

            {/* Bottom Tabs Section */}
            <div className="mt-4">
              <div className="flex items-center border-b border-white/10 mb-6">
                {[
                  { id: "analysis", label: "상세 분석", icon: BarChart2 },
                  { id: "info", label: "규칙 & 정보", icon: Info },
                  { id: "my_bets", label: "내 활동", icon: History },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={twMerge(
                      "flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2",
                      activeTab === tab.id
                        ? "text-blue-400 border-blue-400"
                        : "text-slate-400 border-transparent hover:text-white"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <FadeIn key={activeTab}>
                {activeTab === "analysis" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6 border-white/5 bg-slate-900/50">
                        <div className="flex items-center space-x-2 mb-4">
                          <PieChart className="w-5 h-5 text-green-400" />
                          <h3 className="text-lg font-bold text-white">베팅 분포</h3>
                        </div>
                        <BettingDistributionChart data={bettingData} isDarkMode={true} />
                      </Card>
                      <Card className="p-6 border-white/5 bg-slate-900/50">
                        <div className="flex items-center space-x-2 mb-4">
                          <Users className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-bold text-white">참여자 추이</h3>
                        </div>
                        <ParticipantTimelineChart data={participantData} isDarkMode={true} />
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <InfoCard title="게임 규칙" icon={Calendar}>
                      <div className="space-y-4 text-slate-300">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>마감 시간</span>
                          <span className="text-white">{new Date(game.endTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span>정산 예정</span>
                          <span className="text-white">{new Date(game.settlementTime).toLocaleString()}</span>
                        </div>
                        <div className="pt-2">
                          <p className="mb-2">본 게임은 PMP를 사용하여 참여할 수 있습니다. 결과는 공식 경기 종료 후 1시간 이내에 정산됩니다.</p>
                        </div>
                      </div>
                    </InfoCard>
                    <InfoCard title="생성자 정보" icon={Users}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                          {game.creator.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-white">{game.creator.name}</div>
                          <div className="text-yellow-400 text-xs">⭐ Reputation: {game.creator.reputation}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                        {game.description}
                      </div>
                    </InfoCard>
                  </div>
                )}

                {activeTab === "my_bets" && (
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      내 베팅 내역
                    </h3>

                    {bets.length > 0 ? (
                      <div className="space-y-3">
                        {bets.map((bet) => (
                          <div key={bet.betId} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-2 h-12 rounded-full ${game.options.find(o => o.id === bet.selectedOption)?.label === '예' ? 'bg-blue-500' : 'bg-red-500' // Simple heuristic
                                }`} />
                              <div>
                                <div className="font-bold text-white text-lg">
                                  {game.options.find(o => o.id === bet.selectedOption)?.label || bet.selectedOption}
                                </div>
                                <div className="text-xs text-slate-400">{new Date(bet.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-400">{bet.betAmount.toLocaleString()} PMP</div>
                              <div className="text-xs text-slate-400 mb-1">{bet.status}</div>
                              {game.status === 'ACTIVE' && bet.status === 'PENDING' && (
                                <button
                                  onClick={() => handleWithdraw(bet.betId)}
                                  disabled={withdrawingBetId === bet.betId}
                                  className="text-xs text-red-400 hover:text-red-300 underline"
                                >
                                  {withdrawingBetId === bet.betId ? '처리중...' : '철회하기'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>아직 참여한 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </FadeIn>
            </div>
          </div>

          {/* Right (Deskop) / Bottom (Mobile) - Sticky Betting Panel */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-2 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/10">
                <PredictionDetailView
                  game={gameWithDates}
                  userBalance={balance}
                  onBetAction={handleParticipate}
                  isSubmitting={isPending}
                />
              </div>

              {/* Quick Balance for Context */}
              <div className="grid grid-cols-2 gap-3 px-2">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                  <div className="text-xs text-slate-500 mb-1">PMP Balance</div>
                  <div className="font-mono font-bold text-green-400">{balance.pmp.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 text-center">
                  <div className="text-xs text-slate-500 mb-1">Total Bet</div>
                  <div className="font-mono font-bold text-blue-400">
                    {bets.reduce((sum, b) => sum + (b.status === 'PENDING' ? b.betAmount : 0), 0).toLocaleString()}
                  </div>
                </div>
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
    <div className="bg-slate-800/40 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors h-full">
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

