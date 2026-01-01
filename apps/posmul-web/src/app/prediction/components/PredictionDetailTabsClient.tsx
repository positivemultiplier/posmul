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

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              {game.category}
            </span>
            <span className="text-slate-400 text-xs">{new Date(game.endTime).toLocaleDateString()} 마감</span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-400 hover:text-white"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="w-3 h-3 mr-1" /> 공유
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">{game.title}</h1>
          {game.description && <p className="text-slate-400 max-w-3xl mb-6">{game.description}</p>}

          {/* Game Stats Bar */}
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium">누적 상금 풀</div>
                <div className="text-white font-bold text-lg leading-none mt-0.5">
                  {game.prizePool.toLocaleString()} <span className="text-xs font-normal text-purple-400">PMC</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium">총 거래량</div>
                <div className="text-white font-bold text-lg leading-none mt-0.5">
                  {game.totalVolume.toLocaleString()} <span className="text-xs font-normal text-slate-500">PMP</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                <Info className="w-4 h-4" /> {/* Fallback icon if Users not imported, but wait, let's fix imports */}
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium">참여자</div>
                <div className="text-white font-bold text-lg leading-none mt-0.5">
                  {game.participantCount.toLocaleString()}
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
            {/* Main Chart */}
            <Card className="p-6 border-white/5 bg-slate-900/50 hover:border-white/10 transition-colors">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">실시간 확률 트렌드</h3>
              </div>
              <ProbabilityLineChart
                data={probabilityData}
                lines={chartLines}
                isDarkMode={true}
              />
            </Card>

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

          {/* Right Column (Sticky Betting) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-2 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/10 space-y-4">
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
                    <div className="h-px bg-white/10 my-4" />
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
