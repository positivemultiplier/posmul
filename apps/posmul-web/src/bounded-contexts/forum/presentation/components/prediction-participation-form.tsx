/**
 * Prediction Participation Form Component
 * 예측 게임 참여 폼 (배팅)
 */
"use client";

import { useState, useCallback } from "react";
import { StatCategory } from "../../domain/value-objects/forum-value-objects";

/**
 * 예측 게임 정보
 */
export interface PredictionGameInfo {
  id: string;
  title: string;
  description: string;
  statCategory: StatCategory;
  regionName: string;
  targetPeriod: string;
  rangeMin: number;
  rangeMax: number;
  rangeStep: number;
  unit: string;
  minBetPmp: number;
  maxBetPmp: number;
  deadline: Date;
  participantCount: number;
  totalBetPmp: number;
}

interface PredictionParticipationFormProps {
  game: PredictionGameInfo;
  userPmpBalance: number;
  onSubmit: (prediction: number, betAmount: number) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

/**
 * 통계 카테고리 설정
 */
const STAT_CONFIG: Record<StatCategory, { icon: string; color: string }> = {
  [StatCategory.BIRTH]: { icon: "👶", color: "text-pink-600" },
  [StatCategory.DEATH]: { icon: "🕯️", color: "text-gray-600" },
  [StatCategory.MARRIAGE]: { icon: "💍", color: "text-red-500" },
  [StatCategory.DIVORCE]: { icon: "💔", color: "text-purple-600" },
  [StatCategory.MIGRATION_IN]: { icon: "🏠", color: "text-green-600" },
  [StatCategory.MIGRATION_OUT]: { icon: "🚚", color: "text-orange-600" },
  [StatCategory.EMPLOYMENT]: { icon: "💼", color: "text-blue-600" },
  [StatCategory.UNEMPLOYMENT]: { icon: "📉", color: "text-red-600" },
  [StatCategory.LABOR_FORCE]: { icon: "👷", color: "text-indigo-600" },
  [StatCategory.CPI]: { icon: "📊", color: "text-amber-600" },
  [StatCategory.POPULATION]: { icon: "👥", color: "text-teal-600" },
};

export function PredictionParticipationForm({
  game,
  userPmpBalance,
  onSubmit,
  onCancel,
}: PredictionParticipationFormProps) {
  const [prediction, setPrediction] = useState<number>(
    Math.floor((game.rangeMin + game.rangeMax) / 2 / game.rangeStep) * game.rangeStep
  );
  const [betAmount, setBetAmount] = useState<number>(game.minBetPmp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = STAT_CONFIG[game.statCategory];

  // 예측값 옵션 생성
  const predictionOptions: number[] = [];
  for (let v = game.rangeMin; v <= game.rangeMax; v += game.rangeStep) {
    predictionOptions.push(v);
  }

  // 배팅 금액 옵션 생성
  const betOptions = [
    game.minBetPmp,
    Math.floor((game.minBetPmp + game.maxBetPmp) / 4),
    Math.floor((game.minBetPmp + game.maxBetPmp) / 2),
    Math.floor(((game.minBetPmp + game.maxBetPmp) * 3) / 4),
    game.maxBetPmp,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v <= userPmpBalance);

  const handleSubmit = useCallback(async () => {
    if (betAmount > userPmpBalance) {
      setError("PMP 잔액이 부족합니다.");
      return;
    }

    if (prediction < game.rangeMin || prediction > game.rangeMax) {
      setError("유효한 예측값을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await onSubmit(prediction, betAmount);

    if (!result.success) {
      setError(result.error || "참여에 실패했습니다.");
    }

    setIsSubmitting(false);
  }, [prediction, betAmount, userPmpBalance, game, onSubmit]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{config.icon}</span>
          <span className="font-semibold">{game.regionName}</span>
        </div>
        <h2 className="text-lg font-bold">{game.title}</h2>
        <p className="text-green-100 text-sm mt-1">{game.targetPeriod}</p>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-6">
        {/* Current Stats */}
        <div className="flex justify-between text-sm bg-gray-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-gray-500">참여자</div>
            <div className="font-bold text-gray-900">{game.participantCount}명</div>
          </div>
          <div className="text-center border-x border-gray-200 px-4">
            <div className="text-gray-500">총 배팅</div>
            <div className="font-bold text-green-600">{game.totalBetPmp.toLocaleString()} PMP</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">내 잔액</div>
            <div className="font-bold text-gray-900">{userPmpBalance.toLocaleString()} PMP</div>
          </div>
        </div>

        {/* Prediction Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예측값 선택
          </label>
          <div className="relative">
            <select
              value={prediction}
              onChange={(e) => setPrediction(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {predictionOptions.map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString()} {game.unit}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            범위: {game.rangeMin.toLocaleString()} ~ {game.rangeMax.toLocaleString()} {game.unit} ({game.rangeStep}{game.unit} 단위)
          </p>
        </div>

        {/* Bet Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            배팅 금액 (PMP)
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {betOptions.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setBetAmount(amount)}
                className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                  betAmount === amount
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={game.minBetPmp}
            max={Math.min(game.maxBetPmp, userPmpBalance)}
            step={10}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{game.minBetPmp} PMP</span>
            <span className="font-medium text-green-600">{betAmount} PMP</span>
            <span>{Math.min(game.maxBetPmp, userPmpBalance)} PMP</span>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">예측 요약</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">예측값:</span>
              <span className="font-bold text-green-900">
                {prediction.toLocaleString()} {game.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">배팅 금액:</span>
              <span className="font-bold text-green-900">{betAmount.toLocaleString()} PMP</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-200">
              <span className="text-green-700">예상 최대 보상:</span>
              <span className="font-bold text-green-900">
                ~{(betAmount * 2).toLocaleString()} PMP
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || betAmount > userPmpBalance}
            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                참여 중...
              </span>
            ) : (
              "예측 참여하기"
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center">
          참여 후에는 취소할 수 없습니다. 신중하게 선택해주세요.
        </p>
      </div>
    </div>
  );
}
