"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, Timer, Zap, Coins } from "lucide-react";

interface MoneyWaveHourglassCardProps {
  totalPrizePool?: number;
}

export function MoneyWaveWaterfallCard({
  totalPrizePool = 22817,
}: MoneyWaveHourglassCardProps) {
  // 1시간 기준 (3600초) - 초기값은 2340초(약 39분 남음)
  const [secondsLeft, setSecondsLeft] = useState(2340);
  const [poolAmount, setPoolAmount] = useState(totalPrizePool);
  const [activeSpark, setActiveSpark] = useState(false);

  // 1시간 경과율 계산 (0% -> 100%)
  const elapsedSeconds = 3600 - secondsLeft;
  const progressRatio = Math.min(Math.max(elapsedSeconds / 3600, 0.15), 0.95);

  // 1. 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // 정각 도달 시 리셋 (다음 1시간 회차 시작)
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 실시간 모래알 낙하 및 상금 미세 누적 인터랙션 루프
  useEffect(() => {
    const sparkInterval = setInterval(() => {
      setActiveSpark((prev) => !prev);
      // 시민 참여에 의해 상금 풀이 조금씩 상승
      setPoolAmount((prev) => prev + Math.floor(Math.random() * 7 + 2));
    }, 1200);

    return () => clearInterval(sparkInterval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 모래알 파티클 (위에서 떨어지는 PMP 모래알)
  const fallingParticles = useMemo(
    () => [
      { id: 1, left: "48%", delay: "0s", duration: "1.1s" },
      { id: 2, left: "51%", delay: "0.35s", duration: "1.25s" },
      { id: 3, left: "49.5%", delay: "0.7s", duration: "0.95s" },
    ],
    []
  );

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#111625] via-[#0d121f] to-[#070a12] border border-amber-500/30 p-4 overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.12)]">
      {/* 배경 은은한 황금빛 오라 */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ⏳ 상단 헤더 & 타이머 */}
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

        {/* 1시간 Wave 카운트다운 타이머 */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-500/40 shadow-inner">
          <Timer className="w-3 h-3 text-amber-400 animate-pulse" />
          <span className="text-xs font-black font-mono text-amber-300">
            {formatTimer(secondsLeft)}
          </span>
        </div>
      </div>

      {/* ⏳ 메인 비주얼 영역: 황금 모래시계 일러스트 + 수치 */}
      <div className="grid grid-cols-12 gap-3 items-center z-10 relative my-1">
        {/* 좌측: SVG 황금 모래시계 비주얼 (PMP 은빛 모래 -> 목 통과 -> PMC 황금 언덕) */}
        <div className="col-span-5 flex justify-center items-center py-1">
          <div className="relative w-24 h-32 flex items-center justify-center">
            <svg
              viewBox="0 0 100 130"
              className="w-full h-full drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 모래시계 상하 받침대 (우아한 금빛 프레임) */}
              <rect x="18" y="4" width="64" height="6" rx="3" fill="url(#goldFrameGrad)" />
              <rect x="22" y="10" width="56" height="3" rx="1.5" fill="#f59e0b" />
              <rect x="18" y="120" width="64" height="6" rx="3" fill="url(#goldFrameGrad)" />
              <rect x="22" y="117" width="56" height="3" rx="1.5" fill="#f59e0b" />

              {/* 모래시계 외곽 유리 글래스 (Hourglass Body) */}
              <path
                d="M26 12 C26 42, 45 55, 48 64 C48 66, 48 66, 48 66 C45 75, 26 88, 26 118 L74 118 C74 88, 55 75, 52 66 C52 66, 52 66, 52 64 C55 55, 74 42, 74 12 Z"
                fill="rgba(15, 23, 42, 0.65)"
                stroke="url(#glassBorderGrad)"
                strokeWidth="2.5"
              />

              {/* 내부 유리 반사광 하이라이트 (Glossy Shine) */}
              <path
                d="M30 18 C30 38, 42 48, 46 56"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M30 112 C30 92, 42 82, 46 74"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* [상단 챔버] PMP 은빛/청백빛 모래 (점점 비워짐) */}
              <clipPath id="topSandClip">
                <path d="M28 14 C28 42, 47 54, 49 63 L51 63 C53 54, 72 42, 72 14 Z" />
              </clipPath>
              <g clipPath="url(#topSandClip)">
                {/* 남아있는 PMP 모래 수면 (위에서부터 조금씩 내려옴) */}
                <path
                  d={`M24 ${20 + progressRatio * 32} Q50 ${24 + progressRatio * 32} 76 ${20 + progressRatio * 32} L76 70 L24 70 Z`}
                  fill="url(#pmpSandGrad)"
                  opacity="0.85"
                />
                {/* PMP 모래 반짝임 입자 */}
                <circle cx="44" cy="36" r="1" fill="#e0f2fe" opacity="0.8" />
                <circle cx="56" cy="42" r="1.2" fill="#bae6fd" opacity="0.9" />
                <circle cx="50" cy="48" r="0.8" fill="#ffffff" opacity="0.7" />
              </g>

              {/* [중앙 목] PMP -> PMC 황금 변환점 (Transformation Sparkle) */}
              {/* 떨어지는 황금 모래 줄기 */}
              <line
                x1="50"
                y1="64"
                x2="50"
                y2="114"
                stroke="url(#goldStreamGrad)"
                strokeWidth="2.2"
                strokeDasharray="3 2"
                className="animate-pulse"
              />

              {/* 목 중심부의 빛나는 변환 섬광 (Transformation Core) */}
              <circle
                cx="50"
                cy="65"
                r={activeSpark ? 3.5 : 2.5}
                fill="#fef08a"
                className="transition-all duration-300 drop-shadow-[0_0_8px_#f59e0b]"
              />

              {/* [하단 챔버] 쌓여 올라가는 찬란한 황금 언덕 (PMC Dune & Coins) */}
              <clipPath id="bottomSandClip">
                <path d="M28 116 C28 88, 47 76, 49 67 L51 67 C53 76, 72 88, 72 116 Z" />
              </clipPath>
              <g clipPath="url(#bottomSandClip)">
                {/* 1시간 경과율에 비례하여 높게 차오르는 황금 모래 피라미드 */}
                {/* 기준 Y: 바닥 118 -> 최대 높이 72까지 점진적 상승 */}
                <path
                  d={`M24 118 Q50 ${118 - progressRatio * 42} 76 118 Z`}
                  fill="url(#goldSandGrad)"
                />
                {/* 황금 모래 표면 찰랑임 / 질감 레이어 */}
                <path
                  d={`M32 118 Q50 ${116 - progressRatio * 38} 68 118 Z`}
                  fill="#fef08a"
                  opacity="0.45"
                />

                {/* 황금 모래 언덕 위로 떨어져 튀는 금빛 파티클 */}
                <circle cx="50" cy={118 - progressRatio * 40} r="1.5" fill="#ffffff" />
                <circle cx="47" cy={117 - progressRatio * 36} r="1" fill="#fde047" />
                <circle cx="53" cy={117 - progressRatio * 36} r="1" fill="#fde047" />
              </g>

              {/* 그라데이션 정의 */}
              <defs>
                {/* 금빛 프레임 */}
                <linearGradient id="goldFrameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>

                {/* 유리 테두리 */}
                <linearGradient id="glassBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.7)" />
                  <stop offset="48%" stopColor="rgba(245, 158, 11, 0.9)" />
                  <stop offset="100%" stopColor="rgba(251, 191, 36, 0.7)" />
                </linearGradient>

                {/* 상단 PMP 은빛/하늘빛 모래 */}
                <linearGradient id="pmpSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>

                {/* 목을 통과해 떨어지는 황금 줄기 */}
                <linearGradient id="goldStreamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="25%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>

                {/* 하단 쌓이는 황금 모래풀 */}
                <linearGradient id="goldSandGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
              </defs>
            </svg>

            {/* 변환 스파크 애니메이션 파티클 */}
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <span className="animate-ping absolute -top-1 -left-1 w-3 h-3 rounded-full bg-amber-400 opacity-60" />
            </div>
          </div>
        </div>

        {/* 우측: 핵심 데이터 및 PMP -> PMC 변환 스토리 텍스트 */}
        <div className="col-span-7 pl-1">
          <div className="mb-2">
            <span className="text-[11px] font-bold text-slate-400 block leading-tight">
              실시간 MoneyWave 상금풀
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
                {poolAmount.toLocaleString()}
              </span>
              <span className="text-xs font-black text-amber-400">PMC</span>
            </div>
          </div>

          {/* 1시간 충전 진행률 바 */}
          <div className="mb-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
              <span>Wave 충전율</span>
              <span className="text-amber-300 font-mono">
                {Math.round(progressRatio * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 border border-amber-500/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-yellow-300 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>

          {/* 부스트 상태 배지 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>참여 가속 2.0x</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 하단 캡션: PosMul 가치 변환 헌장 요약 */}
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
