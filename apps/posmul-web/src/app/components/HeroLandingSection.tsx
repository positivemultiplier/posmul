"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  MessageSquareText,
  Pause,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface HeroLandingSectionProps {
  totalPool: number;
  totalUsers: number;
}

interface StoryAct {
  id: number;
  code: string;
  tag: string;
  titleLine1: string;
  highlight: string;
  titleLine2: string;
  description: string;
  formula: string;
  accentHex: string;
  glowClass: string;
  badgeClass: string;
  highlightClass: string;
  progressClass: string;
  nodeLabel: string;
  nodeSub: string;
}

const STORY_ACTS: StoryAct[] = [
  {
    id: 0,
    code: "ACT 01",
    tag: "선택과 훈련 · ORIGIN",
    titleLine1: "오늘의 당신은 과거 수많은",
    highlight: "선택의 합",
    titleLine2: "입니다.",
    description:
      "합리적 선택은 타고나는 재능이 아니라 매일 훈련되는 근육입니다. PosMul은 세상의 흐름을 읽고 올바른 곳에 가치를 흘려보내는 의사결정 훈련장입니다.",
    formula: "PAST CHOICES ➔ DAILY TRAINING ➔ BETTER FUTURE",
    accentHex: "#38bdf8",
    glowClass: "from-sky-500/25 via-indigo-500/15 to-transparent",
    badgeClass: "bg-sky-500/15 border-sky-400/40 text-sky-300",
    highlightClass:
      "from-sky-300 via-cyan-200 to-blue-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.45)]",
    progressClass: "bg-gradient-to-r from-sky-400 to-cyan-300",
    nodeLabel: "의사결정 훈련",
    nodeSub: "Choice & Calibration",
  },
  {
    id: 1,
    code: "ACT 02",
    tag: "시간과 참여 · PMP",
    titleLine1: "돈이 아닌 시간과 참여로",
    highlight: "PMP 연료",
    titleLine2: "를 모읍니다.",
    description:
      "지갑을 열지 않아도 됩니다. 포럼에서 뉴스를 읽고 소신 있는 의견을 나누며, 참여형 콘텐츠를 경험하는 것만으로 무위험 활동 포인트 PMP가 차곡차곡 쌓입니다.",
    formula: "FORUM · CONSUME ➔ +PMP (ZERO RISK)",
    accentHex: "#10b981",
    glowClass: "from-emerald-500/25 via-teal-500/15 to-transparent",
    badgeClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300",
    highlightClass:
      "from-emerald-300 via-teal-200 to-green-400 drop-shadow-[0_0_24px_rgba(16,185,129,0.45)]",
    progressClass: "bg-gradient-to-r from-emerald-400 to-teal-300",
    nodeLabel: "광장 · 참여",
    nodeSub: "PMP 적립 (+Zero Risk)",
  },
  {
    id: 2,
    code: "ACT 03",
    tag: "집단지성 예측 · PMC",
    titleLine1: "근거로 미래를 맞힐 때만",
    highlight: "황금 PMC",
    titleLine2: "가 탄생합니다.",
    description:
      "예측은 도박이 아닌 사실 판단 훈련입니다. 양쪽 근거를 살피고 공인 오라클이 검증하는 이슈에 적중할 때, MoneyWave 상금풀에서 오직 실력으로 PMC를 획득합니다.",
    formula: "PMP + EVIDENCE ➔ ORACLE WIN ➔ GOLDEN PMC",
    accentHex: "#f59e0b",
    glowClass: "from-amber-500/25 via-orange-500/15 to-transparent",
    badgeClass: "bg-amber-500/15 border-amber-400/40 text-amber-300",
    highlightClass:
      "from-amber-200 via-yellow-300 to-orange-400 drop-shadow-[0_0_24px_rgba(245,158,11,0.45)]",
    progressClass: "bg-gradient-to-r from-amber-400 to-yellow-300",
    nodeLabel: "예측 · MoneyWave",
    nodeSub: "오라클 적중 ➔ PMC",
  },
  {
    id: 3,
    code: "ACT 04",
    tag: "선한 영향력의 승수 · SOCIAL",
    titleLine1: "당신의 안목이 세상을 바꾸는",
    highlight: "긍정승수(×)",
    titleLine2: "로 번집니다.",
    description:
      "실력으로 얻은 PMC를 원하는 공익 기관과 지역 프로젝트에 직접 기부합니다. 개인의 합리적 선택이 투명하고 즐거운 나눔을 거쳐 측정 가능한 사회적 가치로 증폭됩니다.",
    formula: "PMC ➔ DIRECT DONATION ➔ POSITIVE MULTIPLIER (×N)",
    accentHex: "#a855f7",
    glowClass: "from-purple-500/25 via-fuchsia-500/15 to-transparent",
    badgeClass: "bg-purple-500/15 border-purple-400/40 text-purple-300",
    highlightClass:
      "from-purple-300 via-fuchsia-200 to-pink-400 drop-shadow-[0_0_24px_rgba(168,85,247,0.45)]",
    progressClass: "bg-gradient-to-r from-purple-400 to-fuchsia-400",
    nodeLabel: "직접 기부 · 명예",
    nodeSub: "Social Value ×N",
  },
];

const ACT_DURATION_MS = 5000;

// SVG 플라이휠 4대 노드 좌표 (viewBox: 0 0 560 440, 중심: 280, 220)
const FLYWHEEL_NODES = [
  {
    actIndex: 1,
    x: 112,
    y: 96,
    badge: "STEP 01",
    title: "광장 · 참여",
    sub: "+PMP 획득",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.14)",
  },
  {
    actIndex: 0,
    x: 448,
    y: 96,
    badge: "STEP 02",
    title: "집단지성 예측",
    sub: "사실·확률 훈련",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  {
    actIndex: 2,
    x: 448,
    y: 344,
    badge: "STEP 03",
    title: "MoneyWave",
    sub: "적중 시 황금 PMC",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.14)",
  },
  {
    actIndex: 3,
    x: 112,
    y: 344,
    badge: "STEP 04",
    title: "직접 기부 · 명예",
    sub: "사회적 가치 ×N",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.14)",
  },
] as const;

// 4개 노드를 잇는 순환 에너지 파이프라인 경로
const FLYWHEEL_PATHS = [
  {
    id: "pipe-pmp-to-predict",
    d: "M 164 96 C 235 56, 325 56, 396 96",
    color: "#10b981",
    activeOnActs: [0, 1],
    dur: "3.2s",
  },
  {
    id: "pipe-predict-to-pmc",
    d: "M 456 138 C 494 190, 494 250, 456 302",
    color: "#38bdf8",
    activeOnActs: [0, 2],
    dur: "3.0s",
  },
  {
    id: "pipe-pmc-to-donate",
    d: "M 396 344 C 325 384, 235 384, 164 344",
    color: "#f59e0b",
    activeOnActs: [2, 3],
    dur: "3.2s",
  },
  {
    id: "pipe-donate-to-forum",
    d: "M 104 302 C 66 250, 66 190, 104 138",
    color: "#a855f7",
    activeOnActs: [3, 1],
    dur: "3.4s",
  },
] as const;

export function HeroLandingSection({ totalPool, totalUsers }: HeroLandingSectionProps) {
  const [activeAct, setActiveAct] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const timer = setInterval(() => {
      setActiveAct((prev) => (prev + 1) % STORY_ACTS.length);
    }, ACT_DURATION_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered]);

  const currentAct = STORY_ACTS[activeAct];

  const scrollToMarkets = () => {
    const el = document.getElementById("featured-prediction-markets");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-3xl bg-[#090d18] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.65)] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10"
    >
      {/* 배경 미세 도트 그리드 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 현재 챕터에 맞춰 호흡하는 동적 오로라 글로우 */}
      <motion.div
        key={`aura-${currentAct.id}`}
        initial={{ opacity: 0.2, scale: 0.92 }}
        animate={{ opacity: 0.9, scale: 1.04 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className={`pointer-events-none absolute -top-24 -right-20 w-[460px] h-[460px] rounded-full bg-gradient-to-br ${currentAct.glowClass} blur-3xl`}
      />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-[360px] h-[360px] rounded-full bg-indigo-600/10 blur-3xl" />

      {/* 메인 2-Column 시네마틱 그리드 */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        {/* ==================== 좌측 (6 cols): 철학 스토리텔링 & CTA ==================== */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          {/* 상단 브랜드 배지 + 자동재생 컨트롤 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-slate-200 text-[11px] font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse shrink-0" />
              <span>Positive Multiplier · 긍정승수 플랫폼</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] text-[11px] font-semibold text-slate-300 transition"
              title={isPlaying ? "모션 스토리 일시정지" : "모션 스토리 재생"}
            >
              {isPlaying && !isHovered ? (
                <Pause className="w-3 h-3 text-sky-400" />
              ) : (
                <Play className="w-3 h-3 text-emerald-400" />
              )}
              <span>
                {isPlaying && !isHovered
                  ? "AUTO"
                  : isHovered && isPlaying
                    ? "PAUSED"
                    : "MANUAL"}
              </span>
            </button>
          </div>

          {/* 4막 챕터 타임라인 프로그레스 바 */}
          <div className="grid grid-cols-4 gap-2">
            {STORY_ACTS.map((act, idx) => {
              const isActive = idx === activeAct;
              const isPast = idx < activeAct;
              return (
                <button
                  key={act.code}
                  type="button"
                  onClick={() => setActiveAct(idx)}
                  className="group text-left space-y-1.5 focus:outline-none"
                >
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    {isActive ? (
                      <motion.div
                        key={`prog-${act.id}-${isPlaying}-${isHovered}`}
                        initial={{ width: "0%" }}
                        animate={{
                          width: isPlaying && !isHovered ? "100%" : "65%",
                        }}
                        transition={{
                          duration: isPlaying && !isHovered ? ACT_DURATION_MS / 1000 : 0.35,
                          ease: "linear",
                        }}
                        className={`h-full rounded-full ${act.progressClass}`}
                      />
                    ) : (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPast
                            ? "w-full bg-white/30"
                            : "w-0 group-hover:w-1/2 bg-white/20"
                        }`}
                      />
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold tracking-tight truncate transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    {act.code} · {act.nodeLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 챕터별 키네틱 타이포그래피 본문 */}
          <div className="min-h-[215px] sm:min-h-[225px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAct.id}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold tracking-wide ${currentAct.badgeClass}`}
                >
                  <span>{currentAct.code}</span>
                  <span className="opacity-50">|</span>
                  <span>{currentAct.tag}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-black text-white leading-[1.24] tracking-tight break-keep">
                  <span className="block">{currentAct.titleLine1}</span>
                  <span className="inline-flex items-baseline flex-wrap gap-x-1.5">
                    <span
                      className={`bg-gradient-to-r bg-clip-text text-transparent ${currentAct.highlightClass}`}
                    >
                      {currentAct.highlight}
                    </span>
                    <span>{currentAct.titleLine2}</span>
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed break-keep max-w-xl">
                  {currentAct.description}
                </p>

                {/* 철학 수식 칩 */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] font-mono text-[11px] font-bold text-slate-300">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: currentAct.accentHex }}
                  />
                  <span>{currentAct.formula}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 핵심 액션 버튼 (CTA) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={scrollToMarkets}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-[0_10px_30px_rgba(37,99,235,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>예측 훈련 시작하기</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <Link
              href="/forum"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all"
            >
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>광장에서 PMP 모으기</span>
            </Link>

            <Link
              href="/donation"
              className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-200 font-bold text-xs sm:text-sm transition-all"
            >
              <HeartHandshake className="w-4 h-4 text-purple-300 shrink-0" />
              <span>가치 기부</span>
            </Link>
          </div>

          {/* 실시간 플랫폼 라이브 현황 */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-white/[0.07] text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span>실시간 MoneyWave 상금풀</span>
              <strong className="text-amber-300 font-black font-mono">
                {Math.round(totalPool).toLocaleString()} PMC
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>참여 시민</span>
              <strong className="text-white font-black font-mono">
                {totalUsers.toLocaleString()}명
              </strong>
            </div>
          </div>
        </div>

        {/* ==================== 우측 (6 cols): 60fps PosMul 철학 플라이휠 모션그래픽 ==================== */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0d1324]/95 via-[#0a0f1d]/95 to-[#070a13]/95 border border-white/[0.09] p-3 sm:p-4 shadow-inner overflow-hidden">
            {/* 상단 HUD 헤더 */}
            <div className="flex items-center justify-between px-2 pb-2 text-[10.5px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full transition-colors duration-500"
                  style={{ backgroundColor: currentAct.accentHex }}
                />
                <span className="font-bold text-slate-200">
                  POSMUL VALUE FLYWHEEL
                </span>
              </div>
              <span className="text-slate-500">노드를 클릭해 철학 탐색</span>
            </div>

            {/* 인터랙티브 벡터 모션그래픽 SVG 캔버스 */}
            <div className="relative w-full aspect-[560/430]">
              <svg
                viewBox="0 0 560 440"
                className="w-full h-full select-none overflow-visible"
                role="img"
                aria-label="PosMul 긍정승수 순환 철학 모션그래픽"
              >
                <defs>
                  {/* 중앙 글로우 그라데이션 */}
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop
                      offset="0%"
                      stopColor={currentAct.accentHex}
                      stopOpacity="0.42"
                    />
                    <stop
                      offset="55%"
                      stopColor={currentAct.accentHex}
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="100%"
                      stopColor={currentAct.accentHex}
                      stopOpacity="0"
                    />
                  </radialGradient>

                  <linearGradient
                    id="coreRingGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="33%" stopColor="#38bdf8" />
                    <stop offset="66%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>

                  <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 배경 외곽 궤도 원 */}
                <circle
                  cx="280"
                  cy="220"
                  r="175"
                  fill="none"
                  stroke="rgba(148,163,184,0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="280"
                  cy="220"
                  r="116"
                  fill="none"
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="1"
                />

                {/* 중앙 배경 호흡 글로우 */}
                <circle cx="280" cy="220" r="118" fill="url(#coreGlow)" />

                {/* ACT 04(승수 확산) 및 전체 순환 시 중앙에서 퍼지는 긍정승수 파문 */}
                {[0, 1, 2].map((waveIdx) => (
                  <motion.circle
                    key={`ripple-${waveIdx}-${currentAct.id}`}
                    cx="280"
                    cy="220"
                    fill="none"
                    stroke={currentAct.accentHex}
                    strokeWidth={activeAct === 3 ? "2" : "1.2"}
                    initial={{ r: 54, opacity: 0.55 }}
                    animate={{
                      r: activeAct === 3 ? 170 : 128,
                      opacity: 0,
                    }}
                    transition={{
                      duration: activeAct === 3 ? 2.6 : 3.4,
                      repeat: Infinity,
                      delay: waveIdx * 0.9,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* 4개 노드 <-> 중앙 코어를 연결하는 미세 방사선 */}
                {FLYWHEEL_NODES.map((node) => {
                  const isFocused = node.actIndex === activeAct;
                  return (
                    <line
                      key={`spoke-${node.badge}`}
                      x1={node.x}
                      y1={node.y}
                      x2={280}
                      y2={220}
                      stroke={isFocused ? node.color : "rgba(148,163,184,0.12)"}
                      strokeWidth={isFocused ? "2" : "1"}
                      strokeDasharray={isFocused ? "4 4" : "2 6"}
                      strokeOpacity={isFocused ? 0.75 : 0.6}
                    />
                  );
                })}

                {/* 순환 에너지 파이프라인 + 실시간 이동 광점 입자 */}
                {FLYWHEEL_PATHS.map((pipe) => {
                  const isPipeHot = (pipe.activeOnActs as readonly number[]).includes(
                    activeAct
                  );
                  return (
                    <g key={pipe.id}>
                      {/* 베이스 궤적 */}
                      <path
                        id={pipe.id}
                        d={pipe.d}
                        fill="none"
                        stroke={pipe.color}
                        strokeWidth={isPipeHot ? "3" : "1.6"}
                        strokeOpacity={isPipeHot ? "0.55" : "0.2"}
                        strokeLinecap="round"
                      />
                      {/* 흐르는 대시 스트림 */}
                      <motion.path
                        d={pipe.d}
                        fill="none"
                        stroke={pipe.color}
                        strokeWidth={isPipeHot ? "2.4" : "1.2"}
                        strokeDasharray="8 16"
                        strokeOpacity={isPipeHot ? "0.95" : "0.35"}
                        animate={{ strokeDashoffset: [48, 0] }}
                        transition={{
                          duration: isPipeHot ? 1.4 : 2.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      {/* 파이프를 타고 흐르는 빛나는 에너지 입자 2개 */}
                      <circle
                        r={isPipeHot ? "4.6" : "3"}
                        fill={pipe.color}
                        filter="url(#softGlow)"
                      >
                        <animateMotion
                          dur={pipe.dur}
                          repeatCount="indefinite"
                          path={pipe.d}
                        />
                      </circle>
                      <circle
                        r={isPipeHot ? "2.8" : "2"}
                        fill="#ffffff"
                        opacity={isPipeHot ? "0.9" : "0.45"}
                      >
                        <animateMotion
                          dur={pipe.dur}
                          begin="1.5s"
                          repeatCount="indefinite"
                          path={pipe.d}
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* 중앙 PosMul 멀티플라이어 코어 (이중 회전 링) */}
                <g transform="translate(280, 220)">
                  <motion.circle
                    r="66"
                    fill="none"
                    stroke="url(#coreRingGrad)"
                    strokeWidth="2.2"
                    strokeDasharray="24 12 8 12"
                    style={{ transformOrigin: "0px 0px" }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 18,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <motion.circle
                    r="54"
                    fill="#0b1020"
                    stroke={currentAct.accentHex}
                    strokeWidth="2"
                    strokeOpacity="0.85"
                    style={{ transformOrigin: "0px 0px" }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* 중앙 심볼 및 동적 배수 표시 */}
                  <text
                    y="-12"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontWeight="800"
                    letterSpacing="1.8"
                  >
                    POSMUL
                  </text>
                  <text
                    y="10"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="20"
                    fontWeight="900"
                    letterSpacing="-0.5"
                  >
                    {activeAct === 0
                      ? "CHOICE"
                      : activeAct === 1
                        ? "+PMP"
                        : activeAct === 2
                          ? "→ PMC"
                          : "× SOCIAL"}
                  </text>
                  <text
                    y="27"
                    textAnchor="middle"
                    fill={currentAct.accentHex}
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    {activeAct === 0
                      ? "의사결정 훈련"
                      : activeAct === 1
                        ? "무위험 참여 연료"
                        : activeAct === 2
                          ? "오라클 적중 보상"
                          : "긍정승수 확산"}
                  </text>
                </g>

                {/* 4개의 인터랙티브 도메인 노드 카드 */}
                {FLYWHEEL_NODES.map((node) => {
                  const isFocused = node.actIndex === activeAct;
                  return (
                    <g
                      key={node.badge}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setActiveAct(node.actIndex)}
                      className="cursor-pointer"
                    >
                      {/* 활성 포커스 외곽 링 */}
                      {isFocused && (
                        <motion.rect
                          x="-78"
                          y="-42"
                          width="156"
                          height="84"
                          rx="18"
                          fill="none"
                          stroke={node.color}
                          strokeWidth="2"
                          style={{ transformOrigin: "0px 0px" }}
                          initial={{ opacity: 0.4, scale: 0.96 }}
                          animate={{ opacity: [0.4, 0.95, 0.4], scale: [1, 1.03, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}

                      {/* 노드 카드 바디 */}
                      <rect
                        x="-74"
                        y="-38"
                        width="148"
                        height="76"
                        rx="16"
                        fill={isFocused ? "#11192e" : "#0c1222"}
                        stroke={isFocused ? node.color : "rgba(255,255,255,0.1)"}
                        strokeWidth={isFocused ? "1.8" : "1"}
                      />

                      {/* 상단 미니 필 */}
                      <rect
                        x="-62"
                        y="-28"
                        width="50"
                        height="16"
                        rx="8"
                        fill={node.bg}
                      />
                      <text
                        x="-37"
                        y="-17"
                        textAnchor="middle"
                        fill={node.color}
                        fontSize="8.5"
                        fontWeight="800"
                      >
                        {node.badge}
                      </text>

                      {/* 상태 점 */}
                      <circle
                        cx="58"
                        cy="-20"
                        r={isFocused ? "4" : "3"}
                        fill={node.color}
                        opacity={isFocused ? "1" : "0.45"}
                      />

                      {/* 노드 타이틀 */}
                      <text
                        x="-62"
                        y="6"
                        fill="#ffffff"
                        fontSize="13"
                        fontWeight="900"
                      >
                        {node.title}
                      </text>

                      {/* 노드 서브 */}
                      <text
                        x="-62"
                        y="24"
                        fill={isFocused ? node.color : "#94a3b8"}
                        fontSize="10.5"
                        fontWeight="700"
                      >
                        {node.sub}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 하단 4원칙 미니 요약 바 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-white/[0.06]">
              {[
                {
                  act: 1,
                  icon: MessageSquareText,
                  label: "포럼·참여",
                  value: "PMP 적립",
                  tone: "text-emerald-300",
                },
                {
                  act: 0,
                  icon: Target,
                  label: "예측 훈련",
                  value: "근거·확률",
                  tone: "text-sky-300",
                },
                {
                  act: 2,
                  icon: Zap,
                  label: "오라클 적중",
                  value: "PMC 전환",
                  tone: "text-amber-300",
                },
                {
                  act: 3,
                  icon: HeartHandshake,
                  label: "직접 기부",
                  value: "가치 증폭",
                  tone: "text-purple-300",
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeAct === item.act;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveAct(item.act)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-white/[0.07] border-white/[0.18]"
                        : "bg-slate-950/50 border-white/[0.04] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.tone}`} />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.label}
                      </div>
                      <div className={`text-[11px] font-extrabold truncate ${item.tone}`}>
                        {item.value}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
