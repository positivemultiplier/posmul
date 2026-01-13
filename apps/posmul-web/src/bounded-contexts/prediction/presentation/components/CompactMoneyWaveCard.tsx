"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Zap, Activity, Users, Gamepad2 } from "lucide-react";
import { SlotMachine } from "./MoneyWave/SlotMachine";
import { twMerge } from "tailwind-merge";

import { useWaveCalculation } from "@/shared/ui/components/layout/MoneyWave/useWaveCalculation";

// Depth와 Category 타입 정의
// Depth 1: 예측 메인, Depth 2: 카테고리, Depth 3: 종목, Depth 4: 리그, Depth 5: 개별 게임
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
  league?: string; // Depth 4: 리그 (EPL, K-League 등)
  gameId?: string; // Depth 5: 개별 게임 ID
  initialPool?: number; // Server-side EBIT Pool (Optional fallback/initial data)
}

// Wave 타입 정보
const WAVE_TYPES = {
  1: { label: "EBIT 발행", color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
  2: { label: "재분배", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  3: { label: "기업가 투자", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
} as const;

// 현재 Wave 번호 계산 (1-24)
const getCurrentWaveNumber = (): number => {
  return new Date().getHours() + 1;
};

// Wave 타입 계산 (1, 2, 3 순환)
const getWaveType = (waveNumber: number): 1 | 2 | 3 => {
  return (((waveNumber - 1) % 3) + 1) as 1 | 2 | 3;
};

export function CompactMoneyWaveCard({
  className = "",
  depthLevel = 0,
  category = "all",
  subcategory,
  league,
  gameId,
  initialPool
}: CompactMoneyWaveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveNumber, setWaveNumber] = useState<number>(1);

  // 클라이언트에서만 Wave 번호 계산 (하이드레이션 에러 방지)
  useEffect(() => {
    setWaveNumber(getCurrentWaveNumber());
    const interval = setInterval(() => {
      setWaveNumber(getCurrentWaveNumber());
    }, 60000); // 1분마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // Hook handles data fetching and reveal logic
  const {
    waveAmount,
    progressRatio: progressAdjusted,
    isSpinning,
    participantCount,
    activeGames
  } = useWaveCalculation({
    domain: 'prediction',
    category,
    gameId
  });

  const totalPool = waveAmount;
  const progressPercent = Math.round(progressAdjusted * 100);
  const waveType = getWaveType(waveNumber);
  const waveTypeInfo = WAVE_TYPES[waveType];

  // MoneyWave Breakdown (확장 시 표시)
  const waveBreakdown = {
    wave1: Math.floor(totalPool * 0.6), // 60% EBIT
    wave2: Math.floor(totalPool * 0.3), // 30% PMC Redistribution
    wave3: Math.floor(totalPool * 0.1)  // 10% Entrepreneur
  };

  return (
    <div className={twMerge("w-full mb-6", className)}>
      <div
        className={twMerge(
          "relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer shadow-lg group",
          isExpanded ? "border-green-500/50 bg-slate-900/95" : "border-slate-800/50 bg-slate-900/90 hover:border-green-500/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 배경 이미지 & 그라데이션 오버레이 */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: "url('/images/money-wave-bg.png')" }}
          />
          <div className={twMerge(
            "absolute inset-0 bg-gradient-to-r transition-opacity duration-300",
            "from-slate-900/90 via-slate-900/80 to-slate-900/90",
            isExpanded ? "opacity-95" : "opacity-80 group-hover:opacity-70"
          )} />
          <div className={twMerge(
            "absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-300",
            "from-green-600 via-emerald-600 to-teal-600",
            isExpanded ? "opacity-20" : "group-hover:opacity-15"
          )} />
        </div>

        {/* 상단 프로그레스 바 (데코레이션) */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800/50">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative p-4">
          {/* 메인 헤더 (항상 보임) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 아이콘 + 뱃지 */}
              <div className="flex items-center gap-2">
                <div className="text-2xl animate-pulse">🌊</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {/* SlotMachine 적용: 에메랄드 색상, 텍스트 큼직하게 */}
                    <SlotMachine
                      value={totalPool}
                      isSpinning={isSpinning}
                      progressRatio={progressAdjusted}
                      showMeta
                      className="text-xl md:text-2xl text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                    />
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                      <Activity className="w-3 h-3 text-green-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-green-400 whitespace-nowrap">실시간 적립 중</span>
                    </div>
                  </div>

                  {/* Wave 정보 라인 - 개선된 표시 */}
                  <div className="flex items-center gap-2 mt-1">
                    {/* Wave 번호 + 타입 */}
                    <span className={`text-sm font-bold ${waveTypeInfo.color}`}>
                      Wave {waveNumber}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${waveTypeInfo.bgColor} ${waveTypeInfo.color} border ${waveTypeInfo.borderColor}`}>
                      {waveTypeInfo.label}
                    </span>

                    {/* 구분선 */}
                    <span className="text-slate-600">|</span>

                    {/* 게임 수 */}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Gamepad2 className="w-3 h-3" />
                      <span className="text-white font-medium">{activeGames}</span>
                      <span>게임</span>
                    </span>

                    {/* 참여자 수 */}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      <span className="text-white font-medium">{participantCount.toLocaleString()}</span>
                      <span>명</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 진행률 표시 - 명확하게 */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-slate-500">진행률</span>
                <span className="text-lg font-bold text-green-400">{progressPercent}%</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {/* Depth 5: Game ID, Depth 4: League, Depth 3: Subcategory, Depth 2: Category */}
                  {gameId
                    ? `GAME`
                    : league
                      ? league.toUpperCase()
                      : subcategory
                        ? subcategory.toUpperCase()
                        : category === "all"
                          ? "전체"
                          : category === "user_proposed"
                            ? "USER"
                            : category.toUpperCase()
                  }
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  LIVE
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          {/* 확장 영역 (애니메이션) */}
          <div
            className={twMerge(
              "grid transition-all duration-300 ease-out overflow-hidden",
              isExpanded ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-slate-800/50" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0">
              {/* 3단계 Wave Breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <Zap className="w-3 h-3 text-green-500/30" />
                  </div>
                  <div className="text-[10px] text-green-400/80 mb-1">Wave1 (60%)</div>
                  <SlotMachine
                    value={waveBreakdown.wave1}
                    isSpinning={isSpinning}
                    progressRatio={progressAdjusted}
                    className="text-sm font-bold text-green-400"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">EBIT 기반</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center relative overflow-hidden">
                  <div className="text-[10px] text-blue-400/80 mb-1">Wave2 (30%)</div>
                  <SlotMachine
                    value={waveBreakdown.wave2}
                    isSpinning={isSpinning}
                    progressRatio={progressAdjusted}
                    className="text-sm font-bold text-blue-400"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">PMC 재분배</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-center relative overflow-hidden">
                  <div className="text-[10px] text-purple-400/80 mb-1">Wave3 (10%)</div>
                  <SlotMachine
                    value={waveBreakdown.wave3}
                    isSpinning={isSpinning}
                    progressRatio={progressAdjusted}
                    className="text-sm font-bold text-purple-400"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">기업가 풀</div>
                </div>
              </div>

              {/* 진행 상태 및 네트워크 효과 */}
              <div className="flex items-end justify-between text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between mb-1">
                    <span>오늘 진행률</span>
                    <span className="text-green-400">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-slate-700">
                  <div className="mb-0.5">네트워크 효과 <span className="text-white font-bold">1.40x</span></div>
                  <div>시간당 <span className="text-white">1.4억원</span></div>
                </div>
              </div>

              {/* TODO 주석 */}
              <div className="mt-3 text-[10px] text-slate-600 text-center">
                * 사회적 학습(Social Learning) 기반 동적 가중치 적용 예정
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
