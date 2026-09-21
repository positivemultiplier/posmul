/**
 * Universal Prediction Game Detail Client Component
 * 모든 예측 카드의 클릭에 대응하는 범용 상세페이지 클라이언트 컴포넌트
 */
"use client";

import { useState, useTransition } from "react";
import { ProbabilityLineChart } from "@/bounded-contexts/prediction/presentation/components/charts/ProbabilityLineChart";
import { BettingDistributionChart } from "@/bounded-contexts/prediction/presentation/components/charts/BettingDistributionChart";
import { ParticipantTimelineChart } from "@/bounded-contexts/prediction/presentation/components/charts/ParticipantTimelineChart";
import { CompactMoneyWaveCard } from "@/bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { PredictionComments } from "@/bounded-contexts/prediction/presentation/components/PredictionComments";
import { placeBet } from "../sports/soccer/[slug]/actions";
import { FadeIn } from "@/shared/ui/components/animations";
import { Users, BarChart2, Info, ArrowLeft, Trophy, Calendar, Clock, Activity, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";
import { Card } from "@/shared/ui/components/base";

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

interface UniversalPredictionDetailClientProps {
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

export function UniversalPredictionDetailClient({
  game,
  userBalance,
  userBets,
  slug,
}: UniversalPredictionDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState(userBalance);
  const [bets, setBets] = useState(userBets);
  const [selectedOption, setSelectedOption] = useState<string>(game.options[0]?.id || "");
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake || 100);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handlePlaceBet = async () => {
    if (!selectedOption) return;
    setFeedbackMsg(null);
    startTransition(async () => {
      try {
        const result = await placeBet({ gameId: game.id, optionId: selectedOption, stakeAmount });
        if (result.success && result.newBalance !== undefined) {
          setBalance({ ...balance, pmp: result.newBalance });
          setFeedbackMsg("🎉 베팅/투표에 성공적으로 참여하였습니다!");
          setBets([
            ...bets,
            {
              betId: `bet-${Date.now()}`,
              selectedOption,
              betAmount: stakeAmount,
              status: "ACTIVE",
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          setFeedbackMsg(result.error || "베팅 참여에 실패하였습니다.");
        }
      } catch (err: any) {
        setFeedbackMsg(err.message || "오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/prediction" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>예측 피드로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50 font-bold">
              {game.category}
            </span>
            <span className="text-amber-400 font-bold">
              💰 내 PMP: {balance.pmp.toLocaleString()} PMP
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Game Title & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>{game.creator.avatar} {game.creator.name}</span>
            <span>•</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              마감: {new Date(game.endTime).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {game.title}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Main 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Polymarket Charts & Tabs (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Realtime Probability Chart */}
            <Card className="p-5 bg-slate-900/80 border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>실시간 시계열 확률 차트 (Polymarket Style)</span>
                </h3>
                <span className="text-xs text-blue-400 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  LIVE
                </span>
              </div>
              <div className="h-64 w-full overflow-hidden flex flex-col justify-end">
                <ProbabilityLineChart
                  data={[
                    { time: "00:00", [game.options[0]?.label || "찬성"]: 50, [game.options[1]?.label || "반대"]: 50 },
                    { time: "06:00", [game.options[0]?.label || "찬성"]: 55, [game.options[1]?.label || "반대"]: 45 },
                    { time: "12:00", [game.options[0]?.label || "찬성"]: 62, [game.options[1]?.label || "반대"]: 38 },
                    { time: "18:00", [game.options[0]?.label || "찬성"]: 65, [game.options[1]?.label || "반대"]: 35 },
                  ]}
                  isDarkMode={true}
                />
              </div>
            </Card>

            {/* Tab navigation */}
            <div className="border-b border-slate-800 flex gap-4 text-sm font-bold">
              <button
                onClick={() => setActiveTab("analysis")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "analysis" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 데이터 분석
              </button>
              <button
                onClick={() => setActiveTab("my_bets")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === "my_bets" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                💜 내 참여 내역 ({bets.length})
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "analysis" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-purple-400" />
                    <span>베팅 금액 분포</span>
                  </h4>
                  <div className="h-44">
                    <BettingDistributionChart
                      data={game.options.map((opt, i) => ({
                        option: opt.label,
                        amount: opt.volume || 10000,
                        percentage: Math.round((opt.probability || 0.5) * 100),
                        color: ["#2797FF", "#EF4444", "#FDC503", "#10B981"][i % 4],
                      }))}
                      isDarkMode={true}
                    />
                  </div>
                </Card>
                <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>시민 참여 추이</span>
                  </h4>
                  <div className="h-44">
                    <ParticipantTimelineChart
                      data={[
                        { time: "월", count: 120 },
                        { time: "화", count: 280 },
                        { time: "수", count: 450 },
                        { time: "목", count: 710 },
                        { time: "금", count: game.participantCount || 1248 },
                      ]}
                      isDarkMode={true}
                    />
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "my_bets" && (
              <Card className="p-4 bg-slate-900/60 border-slate-800">
                {bets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">아직 이 게임에 베팅 참여 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {bets.map((b) => (
                      <div key={b.betId} className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div>
                          <span className="font-bold text-blue-300">{b.selectedOption}</span>
                          <div className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleString('ko-KR')}</div>
                        </div>
                        <span className="font-extrabold text-amber-300">{b.betAmount.toLocaleString()} PMP</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Comments & Forum Section */}
            <Card className="p-5 bg-slate-900/70 border-slate-800 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>💬 예측 이슈 시민 토론장</span>
                <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  댓글 작성 시 +10 PMP
                </span>
              </h3>
              <PredictionComments
                gameId={game.id}
                predictionType={game.predictionType}
                options={game.options.map((opt) => ({ id: opt.id, label: opt.label }))}
              />
            </Card>
          </div>

          {/* Right Column: Betting & Trade Panel (1 col) */}
          <div className="space-y-5">
            <Card className="p-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>🎯 예측 참여 패널</span>
                </span>
                <span className="text-xs font-bold text-amber-400">
                  💎 상금 팟: {game.prizePool.toLocaleString()} PMC
                </span>
              </div>

              {/* Option Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">옵션 선택</label>
                <div className="grid grid-cols-1 gap-2">
                  {game.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                          isSelected
                            ? "bg-blue-950/80 border-blue-500 text-white ring-1 ring-blue-400/50"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div className="text-[10px] text-slate-400">배당률 {(opt.odds || 2.0).toFixed(2)}x</div>
                        </div>
                        <span className="text-xs font-black text-blue-400">
                          {((opt.probability || 0.5) * 100).toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stake Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <label className="text-slate-300">참여 PMP 설정</label>
                  <span className="text-slate-400">잔액: {balance.pmp.toLocaleString()} PMP</span>
                </div>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  min={game.minimumStake}
                  max={game.maximumStake}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setStakeAmount(amt)}
                    className="flex-1 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-700"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Feedback Message */}
              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  feedbackMsg.includes("성공") ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300" : "bg-rose-950/60 border border-rose-800 text-rose-300"
                }`}>
                  {feedbackMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handlePlaceBet}
                disabled={isPending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-blue-500/20 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
              >
                {isPending ? "참여 처리 중..." : "🎯 예측 참여하기"}
              </button>
            </Card>

            {/* Moneypool Widget Card */}
            <CompactMoneyWaveCard depthLevel={1} initialPool={game.prizePool} />
          </div>
        </div>
      </main>
    </div>
  );
}
