"use client";

import { useEffect, useState } from "react";
import { Waves, Sparkles, Timer, Zap } from "lucide-react";

interface MoneyWaveWaterfallCardProps {
  totalPrizePool?: number;
}

export function MoneyWaveWaterfallCard({
  totalPrizePool = 22817,
}: MoneyWaveWaterfallCardProps) {
  const [fillPercent, setFillPercent] = useState(68);
  const [isPouring, setIsPouring] = useState(false);
  const [poolAmount, setPoolAmount] = useState(totalPrizePool);
  const [secondsLeft, setSecondsLeft] = useState(2292); // 약 38분

  // 1. 카운트다운 타이머 (초 단위)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 주기적으로 물폭포(Waterfall)가 콸콸 쏟아지며 풀이 차오르는 애니메이션 루프 (매 5.5초마다 폭포 쏟아짐)
  useEffect(() => {
    const cycle = setInterval(() => {
      setIsPouring(true);
      // 폭포가 쏟아지며 풀과 상금이 상승
      setTimeout(() => {
        setFillPercent((prev) => (prev >= 92 ? 55 : prev + 6));
        setPoolAmount((prev) => prev + Math.floor(Math.random() * 45 + 15));
      }, 1000);

      // 폭포 잠시 잦아듦
      setTimeout(() => {
        setIsPouring(false);
      }, 2600);
    }, 5500);

    return () => clearInterval(cycle);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#131b2e] via-[#0f1526] to-[#0a0e1a] border border-cyan-500/30 p-4 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.12)]">
      {/* 🌊 상단 헤더 & 라이브 배지 */}
      <div className="flex items-center justify-between mb-2 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200 flex items-center gap-1.5 tracking-tight">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>MoneyWave 실시간 폭포수 풀</span>
          </span>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-inner">
          <Zap className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400" />
          <span>부스트 ON</span>
        </span>
      </div>

      {/* 🌊 중앙 누적 상금 디스플레이 */}
      <div className="z-10 relative flex items-baseline justify-between mt-1 mb-2">
        <div>
          <span className="text-[11px] font-bold text-slate-400 block leading-tight">
            현재 마켓 누적 상금
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
              {poolAmount.toLocaleString()}
            </span>
            <span className="text-xs font-black text-cyan-300">PMC</span>
          </div>
        </div>

        {/* 타이머 */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
            <Timer className="w-3 h-3 text-amber-400" />
            <span>다음 Wave 분배</span>
          </span>
          <span className="text-xs font-black font-mono text-amber-300">
            {formatTimer(secondsLeft)}
          </span>
        </div>
      </div>

      {/* 🌊 폭포수 & 풀 충전 인터랙티브 비주얼 컨테이너 (Water Tank) */}
      <div className="relative h-14 w-full rounded-xl bg-slate-950/80 border border-cyan-500/20 overflow-hidden my-2 shadow-inner">
        {/* 떨어지는 물폭포 줄기 (Waterfall Streams) */}
        <div
          className={`absolute top-0 inset-x-0 h-full flex justify-around pointer-events-none z-10 transition-opacity duration-300 ${
            isPouring ? "opacity-100" : "opacity-25"
          }`}
        >
          {/* 3줄기의 빛나는 폭포수 */}
          <div className="w-1.5 h-full bg-gradient-to-b from-cyan-300 via-sky-400 to-transparent animate-pulse filter blur-[0.5px]" />
          <div className="w-2.5 h-full bg-gradient-to-b from-cyan-200 via-blue-400 to-transparent animate-bounce filter blur-[0.3px]" />
          <div className="w-1 h-full bg-gradient-to-b from-sky-300 via-cyan-400 to-transparent animate-pulse" />
        </div>

        {/* 물폭포 낙하 충격 거품/파동 (Splash ripples) */}
        {isPouring && (
          <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center items-center pointer-events-none">
            <div className="w-20 h-2 bg-cyan-300/40 rounded-full animate-ping filter blur-sm" />
            <Sparkles className="w-4 h-4 text-cyan-200 animate-spin absolute" />
          </div>
        )}

        {/* 차오르는 수면 (Water Level with Waves) */}
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-600/70 via-sky-500/50 to-cyan-400/40 transition-all duration-1000 ease-out"
          style={{ height: `${fillPercent}%` }}
        >
          {/* 수면 출렁임 라인 */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-200 via-white to-cyan-300 opacity-90 animate-pulse shadow-[0_0_8px_#38bdf8]" />
        </div>

        {/* 수조 내부 실시간 게이지 라벨 */}
        <div className="absolute inset-0 z-20 flex items-center justify-between px-3 text-[11px] font-bold">
          <span className="text-white/90 drop-shadow flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            <span>풀 충전율</span>
          </span>
          <span className="font-mono font-black text-cyan-200 text-xs bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-400/30 shadow">
            {fillPercent}%
          </span>
        </div>
      </div>

      {/* 🌊 하단 액션 매칭 가이드 */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300 z-10 relative">
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>예측 참여 시 <strong className="text-amber-300">+매칭 보너스</strong> 즉시 누적</span>
        </span>
        <span className="font-extrabold text-cyan-300 text-[10px]">
          최대 2.5x 증폭
        </span>
      </div>
    </div>
  );
}
