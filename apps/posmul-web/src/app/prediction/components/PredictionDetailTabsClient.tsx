"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { BarChart2, Info, Trophy, TrendingUp, PieChart, Share2 } from "lucide-react";
import { placeBet, withdrawBet } from "../sports/soccer/[slug]/actions";
import { SoccerLeagueStickyHeaderClient } from "./soccer/SoccerLeagueStickyHeaderClient";
import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { UserPositionCard } from "../../../bounded-contexts/prediction/presentation/components/UserPositionCard";
import { PredictionDetailView, type PredictionDetailViewHandle } from "../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { OrderBookWidget } from "../../../bounded-contexts/prediction/presentation/components/OrderBookWidget";
import { PredictionComments } from "../../../bounded-contexts/prediction/presentation/components/PredictionComments";
import { SharePredictionModal } from "../../../bounded-contexts/prediction/presentation/components/SharePredictionModal";
import { ProbabilityLineChart } from "../../../bounded-contexts/prediction/presentation/components/charts/ProbabilityLineChart";
import { BettingDistributionChart } from "../../../bounded-contexts/prediction/presentation/components/charts/BettingDistributionChart";
import { usePredictionRealtimeStats } from "../../../bounded-contexts/prediction/presentation/hooks/use-prediction-realtime-stats";
import { Card, Button } from "../../../shared/ui/components/base";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/ui/components/base/Dialog";

type TabType = "analysis" | "info";

type MoneyWaveCategory = "sports" | "politics" | "entertainment" | "economy" | "all";

type PredictionOption = {
  id: string;
  label: string;
  probability: number;
  odds: number;
  volume: number;
  change24h: number;
};

type PredictionGameDetail = {
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
  createdAt: string;
  creator: {
    name: string;
    reputation: number;
    avatar: string;
  };
  prizePool: number;
  minimumStake: number;
  maximumStake: number;
};

type Props = {
  game: PredictionGameDetail;
  userBalance: { pmp: number; pmc: number };
  userBets: Array<{
    betId: string;
    selectedOption: string;
    betAmount: number;
    status: string;
    createdAt: string;
  }>;
  initialChartData: Array<{ time: string;[key: string]: string | number }>;
  moneyWave: {
    category: MoneyWaveCategory;
    subcategory: string;
    league: string;
  };
};

import { useRouter } from "next/navigation";  // Import useRouter

// ... existing imports ...

export function PredictionDetailTabsClient({ game, userBalance, userBets, initialChartData, moneyWave }: Props) {

  const router = useRouter();
  const predictionViewRef = useRef<PredictionDetailViewHandle>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingBet, setPendingBet] = useState<{ optionId: string; amount: number } | null>(null);

  // 1. Initial trigger: Open confirmation dialog
  const handleBetRequest = async (optionId: string, amount: number) => {
    setPendingBet({ optionId, amount });
    setConfirmationOpen(true);
  };

  // 2. Confirmed Action: Execute betting
  const handleConfirmBet = async () => {
    if (!pendingBet) return;
    const { optionId, amount } = pendingBet;

    startTransition(async () => {
      try {
        const result = await placeBet({ gameId: game.id, optionId, stakeAmount: amount });
        if (result.success && result.newBalance !== undefined) {
          setBalance((prev) => ({ ...prev, pmp: result.newBalance! }));
          setBets((prev) => [{
            betId: result.predictionId || '',
            selectedOption: optionId,
            betAmount: amount,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          }, ...prev]);

          // Force server data refresh (Real-time feel)
          router.refresh();

          // Global Balance Sync (Custom Event)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('balanceUpdate'));
          }

        } else {
          alert(`참여 실패: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (e) {
        console.error("Error in handleParticipate:", e);
        alert("참여 중 오류가 발생했습니다.");
      } finally {
        setConfirmationOpen(false);
        setPendingBet(null);
      }
    });
  };

  const gameWithDates = useMemo(() => {
    return {
      ...game,
      endTime: new Date(game.endTime),
      settlementTime: new Date(game.settlementTime),
    };
  }, [game]);

  // stable reference for options to prevent re-render loop
  const memoizedOptions = useMemo(() =>
    game.options.map(opt => ({ id: opt.id, label: opt.label })),
    [game.options]
  );

  // Realtime 통계 구독 - 실시간 베팅 분포 데이터
  const { stats: realtimeStats, chartData: realtimeChartData, isConnected: isRealtimeConnected } = usePredictionRealtimeStats({
    gameId: game.id,
    options: memoizedOptions,
    enabled: true,
    initialData: initialChartData,
  });

  // 차트 데이터: Realtime 데이터가 있으면 사용, 없으면 옵션 기반 기본값
  const probabilityData = useMemo(() => {
    if (realtimeChartData.length > 0) {
      // Realtime 데이터를 차트 형식으로 변환
      return realtimeChartData.map((point) => {
        if (game.predictionType === "binary" && game.options.length >= 2) {
          return {
            time: point.time,
            optionA: point[game.options[0].id] ?? 50,
            optionB: point[game.options[1].id] ?? 50,
          };
        }
        return {
          time: point.time,
          ...Object.fromEntries(
            game.options.map(opt => [opt.id, point[opt.id] ?? Math.round(100 / game.options.length)])
          ),
        };
      });
    }

    // 기본값: 옵션 확률 기반 (생성 시점부터 현재까지의 시뮬레이션 데이터)
    return Array.from({ length: 12 }, (_, idx) => {
      const convergeFactor = idx / 11; // 0 (과거) -> 1 (현재)

      // 시간 라벨 생성: 게임 생성 시점 ~ 현재 시각 사이를 등분
      // createdAt이 유효하지 않으면 fallback을 사용하지만, 앞단에서 0으로 초기화했으므로 안전
      const createdAtTime = new Date(game.createdAt).getTime();
      const now = new Date().getTime();

      // createdAt이 현재보다 미래이거나 이상하면 보정
      const validCreatedAt = isNaN(createdAtTime) || createdAtTime > now ? now - (12 * 60 * 60 * 1000) : createdAtTime;

      const timePoint = validCreatedAt + (now - validCreatedAt) * convergeFactor;
      const timeLabel = new Date(timePoint).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const baseProb = 100 / game.options.length;

      // Binary 게임일 경우
      if (game.predictionType === 'binary' && game.options.length >= 2) {
        const currA = game.options[0].probability * 100;
        const currB = game.options[1].probability * 100;

        // 50%에서 현재 확률로 서서히 변화
        const simA = 50 + (currA - 50) * convergeFactor;
        const simB = 50 + (currB - 50) * convergeFactor;

        return {
          time: timeLabel,
          optionA: Math.round(simA),
          optionB: Math.round(simB),
        };
      }

      // 그 외 게임
      const entries = game.options.map(opt => {
        const currProb = opt.probability * 100;
        // 1/N에서 현재 확률로 변화
        const simProb = baseProb + (currProb - baseProb) * convergeFactor;
        return [opt.id, Math.round(simProb)];
      });

      return {
        time: timeLabel,
        ...Object.fromEntries(entries),
      };
    });
  }, [realtimeChartData, game]);

  const bettingData = useMemo(() => {
    return game.options.map((opt, idx) => ({
      option: opt.label,
      amount: opt.volume,
      percentage: Math.round(opt.probability * 100),
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][idx % 5],
    }));
  }, [game]);

  const chartLines = useMemo(() => {
    // Binary 게임은 optionA, optionB로 표준화
    if (game.predictionType === 'binary' && game.options.length >= 2) {
      return [
        { dataKey: 'optionA', name: game.options[0].label, color: '#3b82f6', strokeWidth: 3 }, // Blue
        { dataKey: 'optionB', name: game.options[1].label, color: '#ef4444', strokeWidth: 3 }, // Red
      ];
    }

    // 그 외 게임은 Option ID를 Key로 사용
    return game.options.map((opt, idx) => ({
      dataKey: opt.id,
      name: opt.label,
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][idx % 5],
      strokeWidth: 2,
    }));
  }, [game]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans">
      {moneyWave.subcategory === "soccer" ? (
        <SoccerLeagueStickyHeaderClient container="5xl" />
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Premium Hero Section */}
        <div className="relative mb-8 rounded-3xl overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-slate-900 -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent -z-10" />

          {/* Content */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 backdrop-blur-sm">
                {game.category}
              </span>
              <span className="text-slate-400 text-xs">{new Date(game.endTime).toLocaleDateString()} 마감</span>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full px-4"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 className="w-3 h-3 mr-1" /> 공유
                </Button>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              {game.title}
            </h1>
            {game.description && (
              <p className="text-slate-300/80 max-w-3xl mb-8 text-lg leading-relaxed">
                {game.description}
              </p>
            )}

            {/* Premium Stats Cards */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="group bg-white/5 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-medium">누적 상금 풀</div>
                  <div className="text-white font-bold text-xl leading-none mt-1">
                    {game.prizePool.toLocaleString()} <span className="text-sm font-normal text-purple-400">PMC</span>
                  </div>
                </div>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-medium">총 거래량</div>
                  <div className="text-white font-bold text-xl leading-none mt-1">
                    {game.totalVolume.toLocaleString()} <span className="text-sm font-normal text-slate-500">PMP</span>
                  </div>
                </div>
              </div>

              <div className="group bg-white/5 backdrop-blur-xl px-5 py-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-300">
                <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl text-green-400 group-hover:scale-110 transition-transform">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-medium">참여자</div>
                  <div className="text-white font-bold text-xl leading-none mt-1">
                    {game.participantCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MoneyWave */}
        <div className="mb-8 sticky top-4 z-30 bg-slate-950/80 backdrop-blur rounded-xl">
          <CompactMoneyWaveCard
            depthLevel={5}
            category={moneyWave.category}
            subcategory={moneyWave.subcategory}
            league={moneyWave.league}
            gameId={game.id}
            initialPool={game.prizePool}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column (Chart + Tabs) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Chart with Premium Glow */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <Card className="relative p-6 border-white/10 bg-slate-900/80 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 rounded-2xl">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">실시간 확률 트렌드</h3>
                  <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
                <ProbabilityLineChart
                  data={probabilityData}
                  lines={chartLines}
                  isDarkMode={true}
                />
              </Card>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <div className="flex items-center border-b border-white/10 mb-6">
                {[
                  { id: "analysis", label: "상세 분석", icon: BarChart2 },
                  { id: "info", label: "정보", icon: Info },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={
                      "flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 " +
                      (activeTab === tab.id
                        ? "text-blue-400 border-blue-400"
                        : "text-slate-400 border-transparent hover:text-white")
                    }
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px] space-y-8">
                {activeTab === "analysis" && (
                  <>
                    <Card className="p-6 border-white/5 bg-slate-900/50">
                      <div className="flex items-center space-x-2 mb-6">
                        <PieChart className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">베팅 분포</h3>
                      </div>
                      <BettingDistributionChart data={bettingData} isDarkMode={true} />
                    </Card>

                    {/* Live Comments Integration */}
                    <PredictionComments
                      gameId={game.id}
                      predictionType={game.predictionType}
                      options={game.options}
                    />
                  </>
                )}

                {activeTab === "info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
                      <div className="text-slate-400 text-xs mb-1">참여 마감</div>
                      <div className="font-semibold text-lg">{new Date(game.endTime).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
                      <div className="text-slate-400 text-xs mb-1">정산</div>
                      <div className="font-semibold text-lg">{new Date(game.settlementTime).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
                      <div className="text-slate-400 text-xs mb-1">최소 베팅</div>
                      <div className="font-semibold text-lg">{game.minimumStake.toLocaleString()} PMP</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
                      <div className="text-slate-400 text-xs mb-1">최대 베팅</div>
                      <div className="font-semibold text-lg">{game.maximumStake.toLocaleString()} PMP</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Sticky Betting) - Premium */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Premium Betting Panel with Glow */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
                <div className="relative bg-slate-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-3 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/10 space-y-4">
                  {/* Position Management (New) */}
                  {bets.length > 0 && (
                    <div className="px-2 pt-2">
                      <UserPositionCard
                        userBets={bets}
                        gameOptions={game.options}
                        onAddBetAction={(optionId) => {
                          predictionViewRef.current?.selectOption(optionId);
                        }}
                      />
                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />
                    </div>
                  )}

                  <PredictionDetailView
                    ref={predictionViewRef}
                    game={gameWithDates}
                    userBalance={balance}
                    onBetAction={handleBetRequest}
                    isSubmitting={isPending}
                  />
                </div>
              </div>

              {/* Order Book Widget Integration */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">오더북 (Order Book)</span>
                </div>
                <OrderBookWidget
                  currentPrice={game.options[0]?.probability || 0.5}
                  volume={game.totalVolume}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <SharePredictionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gameTitle={game.title}
        prediction={userBets.length > 0 ? game.options.find(o => o.id === userBets[0].selectedOption)?.label + " 승리" : undefined}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
      >
        <DialogContent className="sm:max-w-sm bg-[#1e1e2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">예측 확정</DialogTitle>
            <DialogDescription className="text-slate-400">
              베팅 내용을 확인해주세요.
            </DialogDescription>
          </DialogHeader>
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-blue-400 font-bold block text-lg mb-1">
              {pendingBet ? game.options.find(o => o.id === pendingBet.optionId)?.label : ""}
            </span>
            <span className="text-white font-bold">
              {pendingBet?.amount.toLocaleString()} PMP
            </span>
            를 베팅하시겠습니까?
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmationOpen(false)}
              className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmBet}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  처리중
                </>
              ) : (
                "확정하기"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
