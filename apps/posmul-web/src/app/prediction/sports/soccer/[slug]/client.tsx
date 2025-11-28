/**
 * Soccer Prediction Detail Client Component
 *
 * PredictionDetailView + PredictionChartView 컴포넌트를 결합한
 * 그래프가 포함된 고급 상세페이지 클라이언트 컴포넌트
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
"use client";

import { useState, useTransition } from "react";
import { PredictionDetailView } from "../../../../../bounded-contexts/prediction/presentation/components/PredictionDetailView";
import { PredictionChartView } from "../../../../../bounded-contexts/prediction/presentation/components/charts/PredictionChartView";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../shared/ui/components/base";
import { placeBet, withdrawBet } from "./actions";

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
  endTime: string; // ISO 문자열로 전달받음
  settlementTime: string; // ISO 문자열로 전달받음
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

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
  activeClass: string;
}

const tabs: TabItem[] = [
  { id: "prediction", label: "예측 참여", icon: "🎯", activeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500" },
  { id: "charts", label: "실시간 분석", icon: "📊", activeClass: "bg-blue-500/20 text-blue-300 border-blue-500" },
  { id: "info", label: "상세 정보", icon: "ℹ️", activeClass: "bg-purple-500/20 text-purple-300 border-purple-500" },
];

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

  // ISO 문자열을 Date 객체로 변환하여 PredictionDetailView에 전달
  const gameWithDates = {
    ...game,
    endTime: new Date(game.endTime),
    settlementTime: new Date(game.settlementTime),
  };

  // 실제 베팅 처리 핸들러
  const handleParticipate = async (optionId: string, amount: number) => {
    setBetResult(null);
    
    startTransition(async () => {
      const result = await placeBet({
        gameId: game.id,
        optionId,
        stakeAmount: amount,
      });

      setBetResult({ success: result.success, message: result.message });

      if (result.success && result.newBalance !== undefined) {
        setBalance(prev => ({ ...prev, pmp: result.newBalance! }));
        // 베팅 내역에 새 베팅 추가
        setBets(prev => [{
          betId: result.predictionId || '',
          selectedOption: optionId,
          betAmount: amount,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    });
  };

  // 베팅 철회 핸들러
  const handleWithdraw = async (betId: string) => {
    if (!confirm("정말로 이 베팅을 철회하시겠습니까? 베팅 금액은 전액 환불됩니다.")) {
      return;
    }

    setWithdrawingBetId(betId);
    setBetResult(null);

    const result = await withdrawBet(betId, slug);

    setBetResult({ success: result.success, message: result.message });

    if (result.success) {
      // 베팅 내역에서 해당 베팅 제거
      setBets(prev => prev.filter(bet => bet.betId !== betId));
      // 잔액 업데이트
      if (result.newBalance !== undefined) {
        setBalance(prev => ({ ...prev, pmp: result.newBalance! }));
      }
    }

    setWithdrawingBetId(null);
  };

  // 차트 데이터 생성 (실제로는 API에서 가져옴)
  const generateChartData = () => {
    const probabilityData = game.predictionType === "binary"
      ? [
          { time: '09:00', optionA: 45, optionB: 55 },
          { time: '10:00', optionA: 48, optionB: 52 },
          { time: '11:00', optionA: 52, optionB: 48 },
          { time: '12:00', optionA: 58, optionB: 42 },
          { time: '13:00', optionA: 62, optionB: 38 },
          { time: '14:00', optionA: 55, optionB: 45 },
          { time: '15:00', optionA: 60, optionB: 40 },
        ]
      : game.options.map((opt, idx) => ({
          time: `T${idx + 1}`,
          probability: opt.probability * 100,
          confidence: 0.8 + Math.random() * 0.15,
        }));

    const bettingData = game.options.map((opt, idx) => ({
      option: opt.label,
      amount: opt.volume,
      percentage: Math.round(opt.probability * 100),
      color: idx === 0 ? '#3b82f6' : idx === 1 ? '#ef4444' : idx === 2 ? '#10b981' : '#f59e0b',
    }));

    return { probabilityData, bettingData };
  };

  const { probabilityData, bettingData } = generateChartData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* 상단 헤더 */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-2">
            prediction / sports / soccer / {slug}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{game.title}</h1>
          <p className="text-slate-300">{game.description}</p>
        </div>

        {/* 커스텀 탭 네비게이션 */}
        <div className="space-y-6">
          {/* 탭 버튼들 */}
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? tab.activeClass
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 베팅 결과 알림 */}
          {betResult && (
            <div className={`p-4 rounded-lg border ${
              betResult.success 
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200" 
                : "bg-red-500/20 border-red-500/50 text-red-200"
            }`}>
              <div className="flex items-center gap-2">
                <span>{betResult.success ? "✅" : "❌"}</span>
                <span>{betResult.message}</span>
              </div>
            </div>
          )}

          {/* 로딩 상태 */}
          {isPending && (
            <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                <span>베팅 처리 중...</span>
              </div>
            </div>
          )}

          {/* 예측 참여 탭 */}
          {activeTab === "prediction" && (
            <div className="space-y-6 animate-fadeIn">
              <PredictionDetailView
                game={gameWithDates}
                userBalance={balance}
                onParticipate={handleParticipate}
              />
            </div>
          )}

          {/* 실시간 분석 차트 탭 */}
          {activeTab === "charts" && (
            <div className="space-y-6 animate-fadeIn">
              <PredictionChartView
                gameId={game.id}
                predictionType={game.predictionType === "binary" ? "BINARY" : "MULTIPLE_CHOICE"}
                probabilityData={probabilityData}
                bettingData={bettingData}
              />
            </div>
          )}

          {/* 상세 정보 탭 */}
          {activeTab === "info" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 내 베팅 내역 카드 */}
                {bets.length > 0 && (
                  <Card className="bg-slate-900/60 border-slate-700 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <span>📝</span>
                        내 베팅 내역 ({bets.length}건)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bets.map((bet) => {
                          const option = game.options.find(o => o.id === bet.selectedOption);
                          const canWithdraw = game.status === "ACTIVE" && bet.status === "PENDING";
                          const isWithdrawing = withdrawingBetId === bet.betId;
                          
                          return (
                            <div key={bet.betId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  bet.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                                  bet.status === 'WON' ? 'bg-emerald-500/20 text-emerald-300' :
                                  bet.status === 'LOST' ? 'bg-red-500/20 text-red-300' :
                                  'bg-slate-500/20 text-slate-300'
                                }`}>
                                  {bet.status === 'PENDING' ? '대기중' :
                                   bet.status === 'WON' ? '승리' :
                                   bet.status === 'LOST' ? '패배' : bet.status}
                                </span>
                                <span className="text-white font-medium">{option?.label || bet.selectedOption}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-emerald-400 font-semibold">{bet.betAmount.toLocaleString()} PMP</p>
                                  <p className="text-xs text-slate-400">
                                    {new Date(bet.createdAt).toLocaleString('ko-KR')}
                                  </p>
                                </div>
                                {canWithdraw && (
                                  <button
                                    onClick={() => handleWithdraw(bet.betId)}
                                    disabled={isWithdrawing}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                      isWithdrawing
                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50'
                                    }`}
                                  >
                                    {isWithdrawing ? (
                                      <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                        처리중
                                      </span>
                                    ) : (
                                      '철회'
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 게임 정보 카드 */}
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>⚽</span>
                      게임 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">카테고리</span>
                      <span className="font-medium">{game.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">예측 타입</span>
                      <span className="font-medium">
                        {game.predictionType === "binary" && "이진 예측"}
                        {game.predictionType === "wdl" && "승무패 예측"}
                        {game.predictionType === "ranking" && "순위 예측"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">상태</span>
                      <span className={`font-medium ${game.status === "ACTIVE" ? "text-emerald-400" : "text-orange-400"}`}>
                        {game.status === "ACTIVE" ? "진행중" : game.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">총 거래량</span>
                      <span className="font-medium">{game.totalVolume.toLocaleString()} PMP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">참여자</span>
                      <span className="font-medium">{game.participantCount.toLocaleString()}명</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 베팅 규칙 카드 */}
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>📋</span>
                      베팅 규칙
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">최소 베팅</span>
                      <span className="font-medium">{game.minimumStake.toLocaleString()} PMP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">최대 베팅</span>
                      <span className="font-medium">{game.maximumStake.toLocaleString()} PMP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">상금 풀</span>
                      <span className="font-medium text-yellow-400">{game.prizePool.toLocaleString()} PMC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">마감 시간</span>
                      <span className="font-medium">
                        {new Date(game.endTime).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">정산 시간</span>
                      <span className="font-medium">
                        {new Date(game.settlementTime).toLocaleString("ko-KR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 생성자 정보 카드 */}
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>👤</span>
                      생성자 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-2xl">
                        {game.creator.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{game.creator.name}</p>
                        <p className="text-sm text-slate-400">
                          평점: ⭐ {game.creator.reputation.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agency Theory 정보 카드 */}
                <Card className="bg-slate-900/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>🏛️</span>
                      Agency Theory 적용
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 space-y-2">
                    <p className="text-sm">• 정보 비대칭 해결을 통한 민주적 의사결정</p>
                    <p className="text-sm">• 전문가와 일반 사용자의 예측 비교</p>
                    <p className="text-sm">• 집단 지성 활용한 정확도 향상</p>
                    <p className="text-sm">• 투명한 보상 시스템</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
