"use client";

import React from "react";
import { Badge, Card } from "../../../../shared/ui/components/base";
import { GameStatus, PredictionType } from "../../domain/value-objects/prediction-types";

interface PredictionGameOption {
  id: string;
  text: string;
  currentOdds: number;
}

interface PredictionGame {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category?: string;
  predictionType: PredictionType;
  options: PredictionGameOption[];
  startTime: string | Date;
  endTime: string | Date;
  settlementTime: string | Date;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
  currentParticipants: number;
  status: GameStatus;
  totalStake: number;
  gameImportanceScore: number;
  allocatedPrizePool: number;
  createdAt: string | Date;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

interface PredictionGameCardProps {
  game: PredictionGame;
  userId?: string;
  myPrediction?: UserPrediction;
  className?: string;
  onBetClick?: (game: any) => void;
  onDetailsClick?: (game: any) => void;
}

export function PredictionGameCard({
  game,
  myPrediction,
  className,
  onBetClick,
  onDetailsClick,
}: PredictionGameCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.floor(amount || 0));
  };

  const calculateTimeRemaining = (endTime: Date | string) => {
    const end = typeof endTime === "string" ? new Date(endTime) : endTime;
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "마감됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 ${hours}시간 남음`;
    return `${hours}시간 남음`;
  };

  const getPredictionTypeIcon = (type: PredictionType) => {
    switch (type) {
      case PredictionType.BINARY:
        return "⚡";
      case PredictionType.WIN_DRAW_LOSE:
        return "🥊";
      case PredictionType.RANKING:
        return "📈";
      default:
        return "🎯";
    }
  };

  const getPredictionTypeLabel = (type: PredictionType) => {
    switch (type) {
      case PredictionType.BINARY:
        return "Yes/No";
      case PredictionType.WIN_DRAW_LOSE:
        return "승무패";
      case PredictionType.RANKING:
        return "다중선택";
      default:
        return "예측";
    }
  };

  // Binary 타입 옵션 렌더링 (폴리마켓 스타일 버튼)
  const renderBinaryOptions = () => {
    const opt0 = game.options[0];
    const opt1 = game.options[1];
    if (!opt0 || !opt1) return null;

    const prob0 = Math.round((opt0.currentOdds || 0.5) * 100);
    const prob1 = Math.max(0, 100 - prob0);
    const odds0 = opt0.currentOdds > 0 ? (1 / opt0.currentOdds).toFixed(2) : "2.00";
    const odds1 = (1 - opt0.currentOdds) > 0 ? (1 / (1 - opt0.currentOdds)).toFixed(2) : "2.00";

    return (
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-xl border border-blue-900/40 bg-blue-950/20 group-hover:border-blue-500/50 group-hover:bg-blue-950/40 transition-all flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-200 truncate mb-1" title={opt0.text}>
            {opt0.text}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-blue-400 text-sm">{prob0}%</span>
            <span className="text-slate-400 font-semibold">{odds0}x</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 group-hover:border-rose-500/50 group-hover:bg-rose-950/40 transition-all flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-200 truncate mb-1" title={opt1.text}>
            {opt1.text}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-rose-400 text-sm">{prob1}%</span>
            <span className="text-slate-400 font-semibold">{odds1}x</span>
          </div>
        </div>
      </div>
    );
  };

  // WDL 타입 옵션 렌더링
  const renderWDLOptions = () => (
    <div className="grid grid-cols-3 gap-1.5 pt-1">
      {game.options.map((option) => (
        <div
          key={option.id}
          className="p-2 rounded-xl border border-slate-800/80 bg-slate-950/60 group-hover:border-slate-700 transition-all text-center flex flex-col justify-between"
        >
          <div className="text-[11px] font-bold text-slate-300 truncate mb-1" title={option.text}>
            {option.text}
          </div>
          <div className="flex items-center justify-between text-[11px] px-0.5">
            <span className="font-extrabold text-emerald-400">
              {Math.round((option.currentOdds || 0.33) * 100)}%
            </span>
            <span className="text-slate-500 text-[10px]">
              {(1 / (option.currentOdds || 0.33)).toFixed(1)}x
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // Ranking / 다중 옵션 렌더링
  const renderRankingOptions = () => (
    <div className="space-y-1.5 pt-1">
      {game.options.slice(0, 2).map((option, idx) => (
        <div
          key={option.id}
          className="flex items-center justify-between p-2 rounded-xl border border-slate-800/80 bg-slate-950/50 group-hover:border-slate-700 text-xs"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <span className="text-slate-300 truncate font-medium">{option.text}</span>
          </div>
          <span className="font-extrabold text-blue-400 shrink-0">
            {Math.round((option.currentOdds || 0.5) * 100)}%
          </span>
        </div>
      ))}
      {game.options.length > 2 && (
        <div className="text-center text-[10px] font-semibold text-slate-500">
          +{game.options.length - 2}개 선택지 더보기
        </div>
      )}
    </div>
  );

  const renderOptions = () => {
    switch (game.predictionType) {
      case PredictionType.BINARY:
        return renderBinaryOptions();
      case PredictionType.WIN_DRAW_LOSE:
        return renderWDLOptions();
      case PredictionType.RANKING:
        return renderRankingOptions();
      default:
        return renderBinaryOptions();
    }
  };

  const isClosed = game.status === GameStatus.ENDED || (game.status as string) === "CLOSED";
  const poolAmount = game.allocatedPrizePool || game.totalStake || 0;
  const opt0 = game.options[0];
  const opt0Odds = opt0?.currentOdds || 0.5;
  const opt0Prob = Math.min(100, Math.max(5, Math.round(opt0Odds * 100)));

  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
        myPrediction
          ? "border-purple-500/60 bg-gradient-to-b from-purple-950/20 via-slate-900/90 to-slate-950 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/30"
          : "border-slate-800/80 bg-slate-900/70 hover:bg-slate-900/95 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10"
      } ${className ?? ""}`}
    >
      {/* Top Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* 내 참여 뱃지 */}
      {myPrediction && (
        <div className="absolute top-3.5 right-3.5 z-10">
          <Badge className="bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 shadow-md">
            💜 참여 완료 ({formatCurrency(myPrediction.bet_amount || 0)} PMP)
          </Badge>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50 flex items-center gap-1">
              <span>{getPredictionTypeIcon(game.predictionType)}</span>
              <span>{getPredictionTypeLabel(game.predictionType)}</span>
            </span>
            {isClosed ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                마감됨
              </span>
            ) : (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                참여 가능
              </span>
            )}
          </div>

          {!myPrediction && (
            <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-800/30">
              ⏳ {calculateTimeRemaining(game.endTime)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-[14px] text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug min-h-[40px]">
          {game.title}
        </h3>

        {/* Polymarket Style Split Probability Bar (Binary일 때) */}
        {game.predictionType === PredictionType.BINARY && game.options.length >= 2 && (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-blue-400 truncate max-w-[48%]">
                {opt0?.text || "Yes"} {opt0Prob}%
              </span>
              <span className="text-rose-400 truncate max-w-[48%] text-right">
                {game.options[1]?.text || "No"} {100 - opt0Prob}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-l-full transition-all duration-500"
                style={{ width: `${opt0Prob}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-full transition-all duration-500"
                style={{ width: `${100 - opt0Prob}%` }}
              />
            </div>
          </div>
        )}

        {/* Options Chips Section */}
        {renderOptions()}

        {/* Pool & Participant Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1 text-amber-400 font-extrabold">
            <span>💎 Pool: {formatCurrency(poolAmount)} PMC</span>
          </div>
          <div className="text-slate-400 font-medium">
            {game.currentParticipants > 0
              ? `👥 ${game.currentParticipants.toLocaleString()}명 참여`
              : "✨ 첫 참여자 도전"}
          </div>
        </div>

        {/* Card Footer: 마켓 바로가기 CTA */}
        <div className="pt-1 flex items-center justify-between text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
          <span className="text-[10px] font-medium text-slate-500">
            최소 {formatCurrency(game.minimumStake)} PMP부터 참여 가능
          </span>
          <span className="flex items-center gap-1 font-bold text-[11px] text-blue-400 group-hover:translate-x-0.5 transition-transform">
            <span>예측 참여하기</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
