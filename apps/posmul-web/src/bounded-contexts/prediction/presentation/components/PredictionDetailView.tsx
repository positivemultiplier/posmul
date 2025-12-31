"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "../../../../shared/ui/components/base";
import { Wallet, Info } from "lucide-react";

// Types
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
  minimumStake: number;
  maximumStake: number;
  status: "ACTIVE" | "ENDED" | "SETTLED";
}

interface PredictionDetailViewProps {
  game: PredictionGameDetail;
  userBalance: {
    pmp: number;
    pmc: number;
  };
  onBetAction?: (optionId: string, amount: number) => void;
  isSubmitting?: boolean;
}

export type PredictionDetailViewHandle = {
  selectOption: (optionId: string) => void;
};

export const PredictionDetailView = forwardRef<PredictionDetailViewHandle, PredictionDetailViewProps>(({
  game,
  userBalance,
  onBetAction,
  isSubmitting = false,
}, ref) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(game.minimumStake);
  const [expectedReturn, setExpectedReturn] = useState<number>(0);

  // Expose selectOption method to parent
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    selectOption: (optionId: string) => {
      setSelectedOption(optionId);
      // Wait for state update and render, then focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }));

  // Calculate expected return
  useEffect(() => {
    if (selectedOption && stakeAmount > 0) {
      const option = game.options.find((opt) => opt.id === selectedOption);
      if (option) {
        setExpectedReturn(stakeAmount * option.odds);
      }
    }
  }, [selectedOption, stakeAmount, game.options]);

  const renderOptionSelector = () => {
    if (game.predictionType === "binary") {
      return (
        <div className="grid grid-cols-2 gap-3">
          {game.options.map((option) => (
            <div
              key={option.id}
              className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center ${selectedOption === option.id
                ? option.id === 'yes' || option.id === 'option-0' // Simple heuristic for Yes/Blue
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-red-500 bg-red-500/10"
                : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="text-sm text-slate-400 mb-1">{option.label}</div>
              <div className={`text-2xl font-bold ${option.id === 'yes' || option.id === 'option-0' ? 'text-blue-400' : 'text-red-400'
                }`}>
                {(option.probability * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500">{option.odds.toFixed(2)}x</div>

              {selectedOption === option.id && (
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${option.id === 'yes' || option.id === 'option-0' ? 'bg-blue-500' : 'bg-red-500'
                    }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (game.predictionType === "wdl") {
      return (
        <div className="grid grid-cols-3 gap-2">
          {game.options.map((option) => (
            <div
              key={option.id}
              className={`p-3 border-2 rounded-xl cursor-pointer transition-all text-center flex flex-col justify-between h-24 ${selectedOption === option.id
                ? "border-green-500 bg-green-500/10"
                : "border-white/10 hover:border-white/30 bg-white/5"
                }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <div className="text-xs font-semibold text-slate-300">{option.label}</div>
              <div className="text-lg font-bold text-green-400">
                {(option.probability * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500">
                {option.odds.toFixed(2)}x
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (game.predictionType === "ranking") {
      return (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {game.options
            .sort((a, b) => b.probability - a.probability)
            .map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedOption === option.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-white/30 bg-white/5"
                  }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'
                    }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-200">{option.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-400">{(option.probability * 100).toFixed(1)}%</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {option.odds.toFixed(2)}x
                  </span>
                </div>
              </div>
            ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-lg flex items-center justify-between text-white">
          <span>{selectedOption ? '포지션 설정' : '포지션 선택'}</span>
          {userBalance && (
            <div className="flex items-center gap-2 text-xs font-normal px-3 py-1 bg-slate-800 rounded-full border border-white/10">
              <Wallet className="w-3 h-3 text-slate-400" />
              <span className="text-slate-300">보유:</span>
              <span className="text-green-400">{userBalance.pmp.toLocaleString()} PMP</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 space-y-6">
        {renderOptionSelector()}

        {/* Stake Input Area - Only valid if active */}
        {game.status === 'ACTIVE' ? (
          <div className={`transition-all duration-300 ${selectedOption ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
            {selectedOption && (
              <div className="space-y-6 pt-4 border-t border-white/10">
                {/* Stake Input Control */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-slate-300">
                      투자 금액
                    </label>
                    <span className="text-xs text-slate-400">
                      최소 {game.minimumStake.toLocaleString()} PMP
                    </span>
                  </div>

                  {/* Main Input & Slider Group */}
                  <div className="bg-slate-900 rounded-xl border border-white/10 p-4 space-y-4">
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="number"
                        value={stakeAmount || ''}
                        onChange={(e) => setStakeAmount(Math.min(userBalance.pmp, Math.max(0, Number(e.target.value))))}
                        className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none placeholder:text-slate-600"
                        placeholder="0"
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 font-medium">PMP</span>
                    </div>

                    {/* Slider */}
                    <div className="relative h-6 flex items-center">
                      <input
                        type="range"
                        min={game.minimumStake}
                        max={userBalance.pmp}
                        step={100}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                      />
                    </div>

                    {/* Percentage Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[0.25, 0.5, 0.75, 1].map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setStakeAmount(Math.floor(userBalance.pmp * ratio))}
                          className="text-xs py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5 active:bg-blue-500/20 active:border-blue-500/50"
                        >
                          {ratio === 1 ? 'MAX' : `${ratio * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Balance Impact Simulation */}
                  <div className="mt-2 flex justify-between px-1 text-xs text-slate-400">
                    <span>참여 후 잔액</span>
                    <span className={`font-medium ${userBalance.pmp - stakeAmount < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                      {(userBalance.pmp - stakeAmount).toLocaleString()} PMP
                    </span>
                  </div>
                </div>

                {/* Return Simulation */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">예상 수익</span>
                    <span className="text-lg font-bold text-green-400">
                      {expectedReturn.toLocaleString()} PMP
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">수익률</span>
                    <span className="text-green-500">
                      +{(expectedReturn > 0 && stakeAmount > 0 ? ((expectedReturn - stakeAmount) / stakeAmount * 100).toFixed(1) : 0)}%
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  className={`w-full py-6 text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${stakeAmount >= game.minimumStake && stakeAmount <= userBalance.pmp && !isSubmitting
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  onClick={() => selectedOption && onBetAction?.(selectedOption, stakeAmount)}
                  disabled={!selectedOption || stakeAmount < game.minimumStake || stakeAmount > userBalance.pmp || isSubmitting || !onBetAction}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      처리중...
                    </>
                  ) : stakeAmount > userBalance.pmp ? (
                    "잔액 부족"
                  ) : stakeAmount < game.minimumStake ? (
                    "최소 금액 미달"
                  ) : (
                    "예측 확정하기"
                  )}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  결과는 정산 시점의 배당률에 따라 달라질 수 있습니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-800/50 rounded-xl text-center text-slate-400 text-sm border border-white/5">
            이 게임은 현재 {game.status === 'ENDED' ? '종료되었습니다' : '정산되었습니다'}.
            <br />
            더 이상 참여할 수 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PredictionDetailView.displayName = "PredictionDetailView";

export default PredictionDetailView;
