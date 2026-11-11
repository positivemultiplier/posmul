"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Coins, Sparkles, Timer, Zap } from "lucide-react";

import {
  TOP_NECK_Y,
  computeHourglassMetrics,
  getKstHourSecondsLeft,
  type HourglassMetrics,
} from "./hourglass-metrics";

export type { HourglassMetrics };
export { computeHourglassMetrics };

interface MoneyWaveHourglassCardProps {
  totalPrizePool?: number;
}

const FALLING_DROPS = [
  { id: 1, xOffset: 0, delay: "0s", duration: "0.72s", radius: 1.55 },
  { id: 2, xOffset: -0.9, delay: "0.14s", duration: "0.78s", radius: 1.15 },
  { id: 3, xOffset: 0.9, delay: "0.29s", duration: "0.68s", radius: 1.3 },
  { id: 4, xOffset: -0.4, delay: "0.43s", duration: "0.76s", radius: 1.45 },
  { id: 5, xOffset: 0.5, delay: "0.57s", duration: "0.7s", radius: 1.1 },
  { id: 6, xOffset: 0, delay: "0.66s", duration: "0.74s", radius: 1.35 },
];

const GOLD_GLITTERS = [
  { id: 1, dx: -11, dy: 8, r: 1.1, delay: "0s" },
  { id: 2, dx: 9, dy: 7, r: 1.25, delay: "0.4s" },
  { id: 3, dx: -5, dy: 4.5, r: 0.95, delay: "0.8s" },
  { id: 4, dx: 4, dy: 11, r: 1.3, delay: "1.1s" },
  { id: 5, dx: -15, dy: 12, r: 1.0, delay: "1.5s" },
  { id: 6, dx: 14, dy: 11.5, r: 1.15, delay: "0.6s" },
];

const SPLASH_SPARKS = [
  { id: 1, tx: "-5.5px", ty: "-6px", delay: "0s" },
  { id: 2, tx: "5.5px", ty: "-5.5px", delay: "0.18s" },
  { id: 3, tx: "-3.5px", ty: "-8px", delay: "0.36s" },
  { id: 4, tx: "3.5px", ty: "-7.5px", delay: "0.54s" },
];

export function MoneyWaveWaterfallCard({
  totalPrizePool = 22817,
}: MoneyWaveHourglassCardProps) {
  const uid = useId().replace(/:/g, "");
  // SSR/클라이언트 초기 렌더 일치를 위해 고정 시드(0% 경과 -> 35% 시작점)로 시작 후 마운트 시 KST 시계 동기화
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const [poolAmount, setPoolAmount] = useState(() => Math.round(totalPrizePool));
  const [lastTickDelta, setLastTickDelta] = useState<number | null>(null);
  const [isHourFlipping, setIsHourFlipping] = useState(false);

  // 상위 prop 갱신 반영
  useEffect(() => {
    setPoolAmount(Math.round(totalPrizePool));
  }, [totalPrizePool]);

  // 1. 실제 KST 정각 기준 카운트다운 동기화
  useEffect(() => {
    setSecondsLeft(getKstHourSecondsLeft());

    const timer = setInterval(() => {
      const next = getKstHourSecondsLeft();
      setSecondsLeft((prev) => {
        if (next > prev + 3000) {
          // 정각 리셋 시 모래시계 180도 회전 연출
          setIsHourFlipping(true);
          setTimeout(() => setIsHourFlipping(false), 900);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. 실시간 유입 펄스 (+PMC 플로팅 피드백 & 목 광채 펄스)
  useEffect(() => {
    const sparkInterval = setInterval(() => {
      const delta = Math.floor(Math.random() * 6 + 3);
      setPoolAmount((prev) => prev + delta);
      setLastTickDelta(delta);
    }, 1500);

    return () => clearInterval(sparkInterval);
  }, []);

  const elapsedRatio = Math.max(0, Math.min(1, (3600 - secondsLeft) / 3600));
  const metrics = useMemo(
    () => computeHourglassMetrics(elapsedRatio),
    [elapsedRatio]
  );

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 상단 수면: 좌우 파도 + 중앙 목(x=50)으로 빨려 내려가는 깔때기 오목 곡선
  const topSurfaceLeftY = metrics.topSurfaceY - 1.5;
  const topSurfaceDipY = Math.min(TOP_NECK_Y - 1.5, metrics.topSurfaceY + 3.4);
  const topLiquidPath = `M22 ${topSurfaceLeftY} Q36 ${topSurfaceLeftY - 1.8} 44 ${metrics.topSurfaceY} Q50 ${topSurfaceDipY} 56 ${metrics.topSurfaceY} Q64 ${topSurfaceLeftY + 1.8} 78 ${topSurfaceLeftY} L78 66 L22 66 Z`;

  // 하단 황금: 착시 없는 큐빅 원뿔 봉우리(pilePeakY) + 두툼한 바닥 베이스(pileShoulderY)
  const bottomGoldPath = `M22 118 L22 ${metrics.pileShoulderY} C36 ${metrics.pileShoulderY}, 43 ${metrics.pilePeakY}, 50 ${metrics.pilePeakY} C57 ${metrics.pilePeakY}, 64 ${metrics.pileShoulderY}, 78 ${metrics.pileShoulderY} L78 118 Z`;
  const bottomRimPath = `M28 ${metrics.pileShoulderY + 1} C38 ${metrics.pileShoulderY + 0.5}, 44 ${metrics.pilePeakY + 0.6}, 50 ${metrics.pilePeakY + 0.6} C56 ${metrics.pilePeakY + 0.6}, 62 ${metrics.pileShoulderY + 0.5}, 72 ${metrics.pileShoulderY + 1}`;

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#111625] via-[#0d121f] to-[#070a12] border border-amber-500/35 p-4 overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.14)]">
      {/* 컴포넌트 전용 60fps SVG/CSS 물리 낙하 애니메이션 */}
      <style>{`
        @keyframes mwStreamFlow-${uid} {
          0% { stroke-dashoffset: 16; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes mwSandDrop-${uid} {
          0% {
            transform: translateY(0px) scale(0.75);
            opacity: 0;
            fill: #7dd3fc;
          }
          18% {
            opacity: 1;
            fill: #fef08a;
          }
          82% {
            opacity: 1;
            fill: #f59e0b;
          }
          100% {
            transform: translateY(var(--mw-drop-y, 32px)) scale(1.05);
            opacity: 0;
            fill: #fde047;
          }
        }
        @keyframes mwSplash-${uid} {
          0% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.95;
          }
          65% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--mw-tx, 4px), var(--mw-ty, -6px)) scale(0.35);
            opacity: 0;
          }
        }
        @keyframes mwRipple-${uid} {
          0% {
            rx: 2;
            ry: 0.8;
            opacity: 0.85;
          }
          100% {
            rx: 12;
            ry: 3.2;
            opacity: 0;
          }
        }
        @keyframes mwWaveSway-${uid} {
          0%, 100% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
        }
        @keyframes mwGlitter-${uid} {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes mwDeltaFloat-${uid} {
          0% { opacity: 0; transform: translateY(4px); }
          25% { opacity: 1; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>

      {/* 배경 은은한 황금빛 오라 */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 상단 헤더 & 타이머 */}
      <div className="flex items-center justify-between mb-3 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-tight flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>MoneyWave 황금 모래시계</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-500/40 shadow-inner">
          <Timer className="w-3 h-3 text-amber-400 animate-pulse" />
          <span className="text-xs font-black font-mono text-amber-300">
            {formatTimer(secondsLeft)}
          </span>
        </div>
      </div>

      {/* 메인 비주얼 영역: 황금 모래시계 + 수치 */}
      <div className="grid grid-cols-12 gap-3 items-center z-10 relative my-1">
        {/* 좌측: 3단 중력 낙하 & 황금 적층 SVG 모래시계 */}
        <div className="col-span-5 flex justify-center items-center py-1">
          <div
            className={`relative w-24 h-32 flex items-center justify-center transition-transform duration-700 ${
              isHourFlipping ? "rotate-180" : "rotate-0"
            }`}
          >
            <svg
              viewBox="0 0 100 130"
              className="w-full h-full drop-shadow-[0_4px_18px_rgba(245,158,11,0.38)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`goldFrame-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>

                <linearGradient id={`glassBorder-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.78)" />
                  <stop offset="50%" stopColor="rgba(245, 158, 11, 0.92)" />
                  <stop offset="100%" stopColor="rgba(251, 191, 36, 0.78)" />
                </linearGradient>

                <linearGradient id={`pmpWater-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="45%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id={`goldStream-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="28%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>

                <linearGradient id={`goldSand-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#92400e" />
                  <stop offset="40%" stopColor="#d97706" />
                  <stop offset="80%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>

                <clipPath id={`topClip-${uid}`}>
                  <path d="M28 14 C28 42, 47 54, 48.6 63 L51.4 63 C53 54, 72 42, 72 14 Z" />
                </clipPath>

                <clipPath id={`bottomClip-${uid}`}>
                  <path d="M28 116 C28 88, 47 76, 48.6 67 L51.4 67 C53 76, 72 88, 72 116 Z" />
                </clipPath>
              </defs>

              {/* 모래시계 외곽 유리 본체 */}
              <path
                d="M26 12 C26 42, 45 55, 48 64 C48 66, 48 66, 48 66 C45 75, 26 88, 26 118 L74 118 C74 88, 55 75, 52 66 C52 66, 52 66, 52 64 C55 55, 74 42, 74 12 Z"
                fill="rgba(15, 23, 42, 0.72)"
                stroke={`url(#glassBorder-${uid})`}
                strokeWidth="2.5"
              />

              {/* 상단 챔버 미세 수위 눈금 (줄어듦 체감 대비선) */}
              <line x1="33" y1="26" x2="38" y2="26" stroke="rgba(148,163,184,0.35)" strokeWidth="0.9" />
              <line x1="36" y1="38" x2="41" y2="38" stroke="rgba(148,163,184,0.35)" strokeWidth="0.9" />
              <line x1="41" y1="50" x2="45" y2="50" stroke="rgba(148,163,184,0.35)" strokeWidth="0.9" />

              {/* [상단 챔버] 파란 PMP 유체 + 깔때기 소용돌이(Vortex) */}
              <g clipPath={`url(#topClip-${uid})`}>
                <g
                  style={{
                    animation: `mwWaveSway-${uid} 2.8s ease-in-out infinite`,
                  }}
                >
                  <path
                    d={topLiquidPath}
                    fill={`url(#pmpWater-${uid})`}
                    opacity="0.92"
                    className="transition-all duration-700"
                  />
                </g>
                {/* 수면 상단 찰랑임 하이라이트 */}
                <path
                  d={`M25 ${topSurfaceLeftY} Q50 ${topSurfaceDipY} 75 ${topSurfaceLeftY}`}
                  stroke="#e0f2fe"
                  strokeWidth="1.2"
                  strokeOpacity="0.75"
                  fill="none"
                />
                {/* 중앙 목으로 빨려 들어가는 소용돌이 라인 */}
                <line
                  x1="50"
                  y1={Math.min(TOP_NECK_Y - 2, metrics.topSurfaceY + 2)}
                  x2="50"
                  y2={TOP_NECK_Y}
                  stroke="#e0f2fe"
                  strokeWidth="1.6"
                  strokeDasharray="3 3"
                  style={{
                    animation: `mwStreamFlow-${uid} 0.45s linear infinite`,
                  }}
                />
              </g>

              {/* [하단 챔버] 35%부터 시작해 차오르는 황금 피라미드 + 결정 반짝임 */}
              <g clipPath={`url(#bottomClip-${uid})`}>
                {/* 본체 황금 더미 (실제 높이 pilePeakY까지 묵직하게 적층) */}
                <path
                  d={bottomGoldPath}
                  fill={`url(#goldSand-${uid})`}
                  className="transition-all duration-700"
                />

                {/* 봉우리 능선 밝은 금빛 윤곽 */}
                <path
                  d={bottomRimPath}
                  stroke="#fef08a"
                  strokeWidth="1.5"
                  strokeOpacity="0.9"
                  fill="none"
                  className="transition-all duration-700"
                />

                {/* 입체 음영 레이어 (앞면 겹침 효과) */}
                <path
                  d={`M28 117 C38 ${metrics.pileShoulderY + 4}, 45 ${metrics.pilePeakY + 3}, 50 ${metrics.pilePeakY + 2} C55 ${metrics.pilePeakY + 3}, 62 ${metrics.pileShoulderY + 5}, 72 117 Z`}
                  fill="#b45309"
                  opacity="0.32"
                  className="transition-all duration-700"
                />

                {/* 쌓인 황금 표면 반짝이는 금가루/금화 글리터 */}
                {GOLD_GLITTERS.map((g) => {
                  const gx = 50 + g.dx;
                  const gy = Math.min(114, metrics.pilePeakY + g.dy);
                  return (
                    <circle
                      key={g.id}
                      cx={gx}
                      cy={gy}
                      r={g.r}
                      fill="#fef9c3"
                      style={{
                        transformOrigin: `${gx}px ${gy}px`,
                        animation: `mwGlitter-${uid} 1.8s ease-in-out ${g.delay} infinite`,
                      }}
                    />
                  );
                })}

                {/* 물줄기 착지 지점 황금 파문 (Ripple) */}
                <ellipse
                  cx="50"
                  cy={metrics.pilePeakY + 0.5}
                  rx="4"
                  ry="1.2"
                  stroke="#fef08a"
                  strokeWidth="1"
                  fill="none"
                  style={{
                    animation: `mwRipple-${uid} 0.9s ease-out infinite`,
                  }}
                />
              </g>

              {/* [중앙 목 -> 봉우리 꼭대기] 2중 낙하 스트림 + 중력 가속 방울 */}
              <line
                x1="50"
                y1={TOP_NECK_Y}
                x2="50"
                y2={metrics.pilePeakY + 1}
                stroke="rgba(251, 191, 36, 0.35)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="50"
                y1={TOP_NECK_Y}
                x2="50"
                y2={metrics.pilePeakY + 1}
                stroke={`url(#goldStream-${uid})`}
                strokeWidth="1.9"
                strokeDasharray="4 4"
                strokeLinecap="round"
                style={{
                  animation: `mwStreamFlow-${uid} 0.32s linear infinite`,
                }}
              />

              {/* 중력 가속으로 떨어지는 개별 모래/황금 방울 6개 */}
              {FALLING_DROPS.map((drop) => (
                <circle
                  key={drop.id}
                  cx={50 + drop.xOffset}
                  cy={TOP_NECK_Y}
                  r={drop.radius}
                  style={
                    {
                      "--mw-drop-y": `${metrics.dropDistance}px`,
                      animation: `mwSandDrop-${uid} ${drop.duration} cubic-bezier(0.55, 0.05, 0.88, 0.45) ${drop.delay} infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}

              {/* 봉우리 꼭대기에 부딪혀 양옆으로 튀는 금가루 4개 */}
              {SPLASH_SPARKS.map((sp) => (
                <circle
                  key={sp.id}
                  cx="50"
                  cy={metrics.pilePeakY}
                  r="1.15"
                  fill="#fef08a"
                  style={
                    {
                      "--mw-tx": sp.tx,
                      "--mw-ty": sp.ty,
                      animation: `mwSplash-${uid} 0.75s ease-out ${sp.delay} infinite`,
                    } as React.CSSProperties
                  }
                />
              ))}

              {/* 목 중심부 PMP -> PMC 변환 코어 글로우 */}
              <circle
                cx="50"
                cy="64.5"
                r="2.6"
                fill="#fef08a"
                className="drop-shadow-[0_0_8px_#f59e0b]"
              />

              {/* 상하단 황금 프레임 받침대 (유리 위에 깔끔히 마감) */}
              <rect x="18" y="4" width="64" height="6" rx="3" fill={`url(#goldFrame-${uid})`} />
              <rect x="22" y="10" width="56" height="3" rx="1.5" fill="#f59e0b" />
              <rect x="18" y="120" width="64" height="6" rx="3" fill={`url(#goldFrame-${uid})`} />
              <rect x="22" y="117" width="56" height="3" rx="1.5" fill="#f59e0b" />

              {/* 유리 외벽 글로시 하이라이트 */}
              <path
                d="M30 18 C30 38, 42 48, 46 56"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M30 112 C30 92, 42 82, 46 74"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 우측: 핵심 데이터 및 실시간 유입 피드백 */}
        <div className="col-span-7 pl-1">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">
              실시간 MoneyWave 상금풀
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 relative">
              <span className="text-2xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
                {poolAmount.toLocaleString()}
              </span>
              <span className="text-xs font-black text-amber-400">PMC</span>
              {lastTickDelta !== null && (
                <span
                  key={`${poolAmount}-${lastTickDelta}`}
                  className="text-[10px] font-extrabold text-amber-200 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-400/30"
                  style={{
                    animation: `mwDeltaFloat-${uid} 1.3s ease-out forwards`,
                  }}
                >
                  +{lastTickDelta}
                </span>
              )}
            </div>
          </div>

          {/* 1시간 충전 진행률 바 (35% 기초 황금 풀부터 100%까지 차오름) */}
          <div className="mb-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
              <span>Wave 충전율</span>
              <span className="text-amber-300 font-mono">
                {metrics.displayPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 border border-amber-500/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-yellow-300 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                style={{ width: `${metrics.displayPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>참여 가속 2.0x</span>
            </span>
          </div>
        </div>
      </div>

      {/* 하단 캡션 */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-sky-300 font-bold">PMP 참여</span>
          <span>➔</span>
          <span className="text-amber-300 font-bold flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            황금 PMC 환전
          </span>
        </div>
        <span className="text-[9.5px] text-slate-400 font-medium">1시간 주기 자동 분배</span>
      </div>
    </div>
  );
}
