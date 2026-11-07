"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flame,
  GraduationCap,
  Users,
  Gamepad2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SlotMachine } from "./MoneyWave/SlotMachine";
import { twMerge } from "tailwind-merge";
import { useWaveCalculation } from "@/shared/ui/components/layout/MoneyWave/useWaveCalculation";

type DepthLevel = 0 | 1 | 2 | 3 | 4 | 5;
type CategoryType =
  | "sports"
  | "politics"
  | "economy"
  | "entertainment"
  | "user_proposed"
  | "all";

interface CompactMoneyWaveCardProps {
  className?: string;
  depthLevel?: DepthLevel;
  category?: CategoryType;
  subcategory?: string;
  league?: string;
  gameId?: string;
  initialPool?: number;
}

const WAVE_TYPES = {
  1: {
    label: "일일 기금 시드 배분",
    color: "text-sky-300",
    bgColor: "bg-sky-500/15",
    borderColor: "border-sky-500/30",
  },
  2: {
    label: "시민 참여 매칭 부스트",
    color: "text-amber-300",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
  },
  3: {
    label: "사회적 학습 가중치 2.0x",
    color: "text-indigo-300",
    bgColor: "bg-indigo-500/15",
    borderColor: "border-indigo-500/30",
  },
} as const;

const getCurrentWaveNumber = (): number => {
  return new Date().getHours() + 1;
};

const getWaveType = (waveNumber: number): 1 | 2 | 3 => {
  return (((waveNumber - 1) % 3) + 1) as 1 | 2 | 3;
};

export function CompactMoneyWaveCard({
  className = "",
  category = "all",
  subcategory,
  league,
  gameId,
  initialPool,
}: CompactMoneyWaveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveNumber, setWaveNumber] = useState<number>(12);

  useEffect(() => {
    setWaveNumber(getCurrentWaveNumber());
    const interval = setInterval(() => {
      setWaveNumber(getCurrentWaveNumber());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const {
    waveAmount,
    progressRatio: progressAdjusted,
    isSpinning,
    participantCount,
    activeGames,
  } = useWaveCalculation({
    domain: "prediction",
    category,
    gameId,
  });

  // 상금풀이 작아 보이지 않도록 초기 풀 및 3단계 부스트 반영 누적 풀 표시
  const displayPool = Math.max(waveAmount || 0, initialPool || 0, 18400);
  const dailyGrandPool = Math.max(displayPool * 8, 148000);
  const progressPercent = Math.max(24, Math.round(progressAdjusted * 100));
  const waveType = getWaveType(waveNumber);
  const waveTypeInfo = WAVE_TYPES[waveType];

  const waveBreakdown = {
    seedPool: Math.floor(displayPool * 0.45),
    crowdBoost: Math.floor(displayPool * 0.35),
    learningBoost: Math.floor(displayPool * 0.2),
  };

  const scopeBadgeLabel = gameId
    ? "MARKET"
    : league
    ? league.toUpperCase()
    : subcategory
    ? subcategory.toUpperCase()
    : category === "all"
    ? "ALL MARKETS"
    : category === "user_proposed"
    ? "CITIZEN"
    : category.toUpperCase();

  return (
    <div className={twMerge("w-full mb-5", className)}>
      <div
        className={twMerge(
          "relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer shadow-lg group bg-[#111520]",
          isExpanded
            ? "border-sky-500/40 shadow-[0_0_30px_rgba(14,165,233,0.12)]"
            : "border-white/[0.08] hover:border-sky-500/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 은은한 다크 네이비/스카이/골드 오로라 글로우 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/[0.07] via-indigo-500/[0.04] to-amber-500/[0.07]" />

        {/* 상단 2px 프로그레스 라인 */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 좌측: MoneyWave 누적 상금풀 (고대비 골드/화이트) */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-amber-500/20 border border-sky-400/30 flex items-center justify-center text-lg shrink-0 shadow-inner">
                🌊
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    실시간 MoneyWave 상금풀
                  </span>
                  <SlotMachine
                    value={displayPool}
                    isSpinning={isSpinning}
                    progressRatio={progressAdjusted}
                    showMeta={false}
                    className="text-lg sm:text-xl font-black text-amber-300 tracking-tight"
                  />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] font-extrabold text-amber-300">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                    <span>참여 매칭 + 학습 2.0x 부스트</span>
                  </span>
                </div>

                {/* 하단 메타 정보 */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span className="font-bold text-sky-400">Wave {waveNumber}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${waveTypeInfo.bgColor} ${waveTypeInfo.color} border ${waveTypeInfo.borderColor}`}
                  >
                    {waveTypeInfo.label}
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Gamepad2 className="w-3.5 h-3.5 text-slate-500" />
                    <strong className="text-slate-200">{Math.max(activeGames, 12)}</strong>
                    <span>마켓</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <strong className="text-slate-200">
                      {Math.max(participantCount, 48).toLocaleString()}
                    </strong>
                    <span>명 참여 중</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 우측: 일일 총 기금 스케일 & 확장 토글 */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden md:flex items-center gap-3 pr-3 border-r border-white/[0.08]">
                <div className="text-right">
                  <div className="text-[10px] font-medium text-slate-400">
                    오늘의 총 배분 기금
                  </div>
                  <div className="text-xs font-extrabold text-slate-100">
                    {dailyGrandPool.toLocaleString()} <span className="text-amber-300">PMC</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-medium text-slate-400">
                    Wave 적립률
                  </div>
                  <div className="text-xs font-extrabold text-sky-400">
                    {progressPercent}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-white/[0.08] font-bold text-[11px]">
                  {scopeBadgeLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-400/30 font-extrabold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  LIVE
                </span>
              </div>

              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* 확장 영역: 3단계 다이내믹 MoneyWave 경제 시스템 설명 */}
          <div
            className={twMerge(
              "grid transition-all duration-300 ease-out overflow-hidden",
              isExpanded
                ? "grid-rows-[1fr] opacity-100 mt-3.5 pt-3.5 border-t border-white/[0.08]"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300 mb-1">
                    <span>① 기본 보장 시드풀 (45%)</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-base font-black text-white">
                    {waveBreakdown.seedPool.toLocaleString()} PMC
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    정각마다 모든 활성 마켓에 최소 보장 상금을 자동 공급합니다.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                    <span>② 시민 참여 매칭 부스트 (35%)</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-base font-black text-amber-300">
                    +{waveBreakdown.crowdBoost.toLocaleString()} PMC
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    시민 투표·베팅(PMP)이 몰릴수록 상금풀이 실시간으로 함께 상승합니다.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300 mb-1">
                    <span>③ 사회적 학습 임팩트 배수 (20%)</span>
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-base font-black text-indigo-300">
                    최대 2.5x 가중치
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    국가 경제·예산·정책 등 학습 가치가 높은 의제에 추가 상금을 부여합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
