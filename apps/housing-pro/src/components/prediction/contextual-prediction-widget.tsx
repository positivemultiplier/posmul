"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, ExternalLink, TrendingUp } from "lucide-react";
import { HOUSING_PREDICTION_GAMES } from "@/data/mock-housing-predictions";
import { participateHousingPredictionAction } from "@/app/actions/prediction-widget.actions";

interface ContextualPredictionWidgetProps {
  userPmpBalance?: number;
  onBalanceChange?: (newBalance: number) => void;
  userId?: string;
}

export function ContextualPredictionWidget({
  userPmpBalance = 0,
  onBalanceChange,
  userId,
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
  const posmulWebUrl = process.env.NEXT_PUBLIC_POSMUL_WEB_URL || "https://posmul.com";

  return (
    <section className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] p-4 space-y-4 text-xs text-[var(--hp-text)]">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--hp-border)] pb-3">
        <div>
          <div className="text-sm font-medium">주택관리사 예측 마켓</div>
          <p className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
            학습 PMP로 참여 · 적중 시 PosMul 지갑에 PMC 지급
          </p>
        </div>
        <a
          href={`${posmulWebUrl}/prediction`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0"
        >
          <span>본진 마켓</span>
          <ExternalLink className="w-3 h-3 stroke-[1.5]" />
        </a>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {HOUSING_PREDICTION_GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => handleGameChange(game.id)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap border transition ${
              selectedGameId === game.id
                ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                : "bg-[var(--hp-bg)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
            }`}
          >
            {game.categoryLabel}
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-[var(--hp-bg)] border border-[var(--hp-border)] space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] hp-tabular text-[var(--hp-text-3)]">
            <span>마감 {currentGame.dueDate}</span>
            <span>풀 {currentGame.totalPoolPmc.toLocaleString()} PMC</span>
          </div>
          <h4 className="font-medium text-sm leading-snug text-[var(--hp-text)]">
            {currentGame.title}
          </h4>
          <p className="text-[11px] text-[var(--hp-text-2)] leading-relaxed">
            {currentGame.description}
          </p>
        </div>

        {/* 확률 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] hp-tabular text-[var(--hp-text-2)]">
            <span>
              {currentGame.options[0].label} {currentGame.options[0].probabilityPct}%
            </span>
            <span>
              {currentGame.options[1].label} {currentGame.options[1].probabilityPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--hp-surface-2)] overflow-hidden flex">
            <div
              className="bg-[#5B8C73] h-full"
              style={{ width: `${currentGame.options[0].probabilityPct}%` }}
            />
            <div
              className="bg-[#C97B63] h-full"
              style={{ width: `${currentGame.options[1].probabilityPct}%` }}
            />
          </div>
        </div>

        {/* 옵션 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {currentGame.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedOptionId(opt.id)}
              className={`p-2.5 rounded-lg text-left border transition ${
                selectedOptionId === opt.id
                  ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)]"
                  : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
              }`}
            >
              <div className="font-medium text-xs">{opt.label}</div>
              <div className="text-[10.5px] hp-tabular text-[var(--hp-text-3)] mt-0.5">
                예상 {opt.multiplier}x
              </div>
            </button>
          ))}
        </div>

        {/* 참여 PMP 설정 */}
        <div className="space-y-2 pt-2 border-t border-[var(--hp-border)]">
          <div className="flex items-center justify-between text-[11px] hp-tabular">
            <span className="text-[var(--hp-text-2)]">참여 PMP</span>
            <span className="text-[var(--hp-text-3)]">
              보유 {userPmpBalance.toLocaleString()} PMP
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[50, 100, 200, 300].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setStakedAmount(amt)}
                className={`py-1.5 rounded-md text-[11px] hp-tabular border transition ${
                  stakedAmount === amt
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                    : "border-[var(--hp-border)] text-[var(--hp-text-2)]"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] hp-tabular py-1">
            <span className="text-[var(--hp-text-3)]">적중 시 예상</span>
            <span className="font-medium text-[var(--hp-text)]">
              +{expectedPmc.toLocaleString()} PMC
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleParticipate()}
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition"
          >
            <TrendingUp className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>{isLoading ? "처리 중..." : `${stakedAmount} PMP 예측 참여`}</span>
          </button>
        </div>

        {resultMsg && (
          <div className="p-2.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text)] flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5] text-[var(--hp-success)] shrink-0 mt-0.5" />
            <span>{resultMsg}</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-[var(--hp-text-3)] flex items-center justify-between">
        <span className="truncate">오라클: {currentGame.oracleSource}</span>
        <a
          href={`${posmulWebUrl}/prediction/${currentGame.slug}/analysis`}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5 shrink-0"
        >
          <span>분석</span>
          <ChevronRight className="w-3 h-3 stroke-[1.5]" />
        </a>
      </div>
    </section>
  );
}
