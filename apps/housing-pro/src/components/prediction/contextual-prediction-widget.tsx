"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Scale,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Coins,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  HOUSING_PREDICTION_GAMES,
  HousingPredictionGame,
} from "@/data/mock-housing-predictions";
import { participateHousingPredictionAction } from "@/app/actions/prediction-widget.actions";

interface ContextualPredictionWidgetProps {
  userPmpBalance?: number;
  onBalanceChange?: (newBalance: number) => void;
  userId?: string;
}

export function ContextualPredictionWidget({
  userPmpBalance = 1000,
  onBalanceChange,
  userId = "user-demo-housing-1",
}: ContextualPredictionWidgetProps) {
  const [selectedGameId, setSelectedGameId] = useState<string>(
    HOUSING_PREDICTION_GAMES[0].id
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    HOUSING_PREDICTION_GAMES[0].options[0].id
  );
  const [stakedAmount, setStakedAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const currentGame =
    HOUSING_PREDICTION_GAMES.find((g) => g.id === selectedGameId) ||
    HOUSING_PREDICTION_GAMES[0];

  const currentOption =
    currentGame.options.find((o) => o.id === selectedOptionId) ||
    currentGame.options[0];

  const handleGameChange = (gameId: string) => {
    setSelectedGameId(gameId);
    const targetGame =
      HOUSING_PREDICTION_GAMES.find((g) => g.id === gameId) ||
      HOUSING_PREDICTION_GAMES[0];
    setSelectedOptionId(targetGame.options[0].id);
    setResultMsg(null);
  };

  const handleParticipate = async () => {
    setIsLoading(true);
    setResultMsg(null);

    try {
      const res = await participateHousingPredictionAction({
        userId,
        gameId: currentGame.id,
        optionId: selectedOptionId,
        pmpAmount: stakedAmount,
      });

      setResultMsg(res.message);

      if (res.success && res.newPmpBalance !== undefined && onBalanceChange) {
        onBalanceChange(res.newPmpBalance);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const expectedPmc = Math.round(stakedAmount * (currentOption?.multiplier || 1.5));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-[#101728] to-indigo-950/40 border border-indigo-500/30 p-5 space-y-4 shadow-xl text-xs">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xs">
                주택관리사 상시 예측 마켓
              </span>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300">
                PosMul 연동
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400">
              학습으로 모은 PMP로 참여하고 오직 적중 시에만 PMC 획득
            </p>
          </div>
        </div>

        <a
          href="http://localhost:3000/prediction"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
        >
          <span>본진 마켓 ↗</span>
        </a>
      </div>

      {/* 게임 선택 탭 */}
      <div className="flex gap-1.5 overflow-x-auto p-1 bg-slate-900/90 rounded-xl text-[11px] font-bold">
        {HOUSING_PREDICTION_GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameChange(game.id)}
            className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
              selectedGameId === game.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {game.categoryLabel}
          </button>
        ))}
      </div>

      {/* 현재 게임 본문 */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10.5px] text-slate-400">
            <span>마감: {currentGame.dueDate}</span>
            <span className="text-amber-300 font-bold">
              총 상금풀 {currentGame.totalPoolPmc.toLocaleString()} PMC
            </span>
          </div>
          <h4 className="font-extrabold text-white text-xs leading-snug">
            {currentGame.title}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {currentGame.description}
          </p>
        </div>

        {/* 옵션 퍼센티지 게이지 바 */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">
              {currentGame.options[0].label} ({currentGame.options[0].probabilityPct}%)
            </span>
            <span className="text-rose-400 font-bold">
              {currentGame.options[1].label} ({currentGame.options[1].probabilityPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${currentGame.options[0].probabilityPct}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all"
              style={{ width: `${currentGame.options[1].probabilityPct}%` }}
            />
          </div>
        </div>

        {/* 옵션 라디오 선택기 */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {currentGame.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOptionId(opt.id)}
              className={`p-2.5 rounded-xl text-left transition border ${
                selectedOptionId === opt.id
                  ? "bg-indigo-950/70 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                  : "bg-slate-900/60 border-white/[0.05] text-slate-400 hover:border-white/[0.15]"
              }`}
            >
              <div className="font-extrabold text-[11px]">{opt.label}</div>
              <div className="text-[10px] text-amber-300 font-mono font-bold pt-0.5">
                예상 {opt.multiplier}x 리워드
              </div>
            </button>
          ))}
        </div>

        {/* PMP 참여 금액 선택 */}
        <div className="space-y-2 pt-1 border-t border-white/[0.05]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold">참여 PMP 설정:</span>
            <span className="text-slate-400 font-mono">
              보유: {userPmpBalance.toLocaleString()} PMP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[50, 100, 200, 300].map((amt) => (
              <button
                key={amt}
                onClick={() => setStakedAmount(amt)}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition ${
                  stakedAmount === amt
                    ? "bg-sky-500 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {amt} PMP
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-lg">
            <span className="text-slate-400">예측 적중 시 예상 획득:</span>
            <span className="font-black text-amber-300">
              +{expectedPmc.toLocaleString()} PMC
            </span>
          </div>

          <button
            onClick={handleParticipate}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span>예측 참여 처리 중...</span>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-white" />
                <span>{stakedAmount} PMP로 예측 참여하기</span>
              </>
            )}
          </button>
        </div>

        {/* 결과 피드백 */}
        {resultMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{resultMsg}</span>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 flex items-center justify-between">
        <span>📜 오라클: {currentGame.oracleSource}</span>
        <a
          href={`http://localhost:3000/prediction/${currentGame.slug}/analysis`}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400 hover:underline flex items-center gap-0.5"
        >
          <span>심층 분석실</span>
          <ChevronRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}

