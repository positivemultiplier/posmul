"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Pause,
  Play,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

interface HeroLandingSectionProps {
  totalPool: number;
  totalUsers: number;
}

interface PhilosophyScene {
  id: number;
  code: string;
  shortLabel: string;
  badge: string;
  questionOrAxis: string;
  headlineTop: string;
  headlineHighlight: string;
  headlineBottom: string;
  body: string;
  keywords: string[];
  accentHex: string;
  auraClass: string;
  badgeClass: string;
  highlightClass: string;
  progressClass: string;
}

const SCENES: PhilosophyScene[] = [
  {
    id: 0,
    code: "01",
    shortLabel: "출발점 · 두 질문",
    badge: "WHY POSMUL · 우리의 시작점",
    questionOrAxis: "두 개의 불편한 질문에서 시작했습니다",
    headlineTop: "예측은 왜 지하경제에 갇히고,",
    headlineHighlight: "기부는 왜 신뢰를 잃었을까?",
    headlineBottom: "",
    body: "예측을 사행성에서 꺼내 주류경제로 끌어올릴 수는 없을까? 불투명한 정기후원 대신, 다양하고 투명한 기부로 신뢰를 되찾을 수는 없을까? PosMul은 이 질문에 대한 해답입니다.",
    keywords: ["사행성 탈피 · 주류경제 편입", "불투명 해소 · 다양한 기부"],
    accentHex: "#f43f5e",
    auraClass: "from-rose-500/20 via-amber-500/10 to-sky-500/15",
    badgeClass: "bg-rose-500/15 border-rose-400/40 text-rose-200",
    highlightClass:
      "from-amber-200 via-rose-300 to-sky-300 drop-shadow-[0_0_24px_rgba(244,63,94,0.35)]",
    progressClass: "bg-gradient-to-r from-rose-400 via-amber-400 to-sky-400",
  },
  {
    id: 1,
    code: "02",
    shortLabel: "축 1 · 예측 (정답 O)",
    badge: "AXIS 01 · 정답이 있는 문제",
    questionOrAxis: "역선택(Adverse Selection)을 돌파하는 훈련",
    headlineTop: "편향 없는 정보와 확률로,",
    headlineHighlight: "나만의 판단 기준",
    headlineBottom: "을 세우다.",
    body: "정답이 정해진 문제의 최대 적은 역선택과 확증편향입니다. 사행성이 아닌 확률적 사고와 균형 잡힌 정보 습득으로, 예측 게임을 통해 흔들리지 않는 자신만의 기준을 훈련합니다.",
    keywords: ["정답이 있는 문제", "역선택 해소", "확률 · 비편향 정보"],
    accentHex: "#38bdf8",
    auraClass: "from-sky-500/25 via-blue-600/15 to-cyan-500/10",
    badgeClass: "bg-sky-500/15 border-sky-400/40 text-sky-200",
    highlightClass:
      "from-sky-300 via-cyan-200 to-blue-400 drop-shadow-[0_0_26px_rgba(56,189,248,0.45)]",
    progressClass: "bg-gradient-to-r from-sky-400 to-cyan-300",
  },
  {
    id: 2,
    code: "03",
    shortLabel: "축 2 · 기부 (정답 X)",
    badge: "AXIS 02 · 정답이 없는 문제",
    questionOrAxis: "희소한 자원의 효율적 배분 훈련",
    headlineTop: "정답이 없는 가치의 영역,",
    headlineHighlight: "나의 선호로 자원을 배분",
    headlineBottom: "하다.",
    body: "정답이 없는 문제에는 획일적 정기후원이 아닌 집단적 선호가 필요합니다. 콩도르세·보르다 투표처럼 나의 선호를 투명하게 반영해, 희소한 자원을 가장 가치 있는 곳에 직접 배분합니다.",
    keywords: ["정답이 없는 문제", "콩도르세 · 보르다 투표", "투명한 자원 배분"],
    accentHex: "#a855f7",
    auraClass: "from-purple-500/25 via-fuchsia-500/15 to-amber-500/10",
    badgeClass: "bg-purple-500/15 border-purple-400/40 text-purple-200",
    highlightClass:
      "from-purple-300 via-fuchsia-200 to-amber-300 drop-shadow-[0_0_26px_rgba(168,85,247,0.45)]",
    progressClass: "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-amber-300",
  },
  {
    id: 3,
    code: "04",
    shortLabel: "PosMul · 의사결정 훈련장",
    badge: "POSMUL · 합리적 의사결정 훈련장",
    questionOrAxis: "사실을 보는 눈 × 가치를 나누는 힘",
    headlineTop: "예측과 기부, 두 축으로 완성하는",
    headlineHighlight: "합리적 의사결정 훈련장",
    headlineBottom: ".",
    body: "정답이 있는 문제에서 진실을 가려내고, 정답이 없는 문제에서 최선의 배분을 선택합니다. 두 축의 훈련이 맞물릴 때, 개인의 합리적 선택이 더 나은 사회의 긍정승수가 됩니다.",
    keywords: ["예측(사실 판단)", "기부(가치 배분)", "긍정승수 PosMul"],
    accentHex: "#10b981",
    auraClass: "from-sky-500/20 via-emerald-500/15 to-purple-500/20",
    badgeClass: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
    highlightClass:
      "from-sky-300 via-emerald-200 to-purple-300 drop-shadow-[0_0_26px_rgba(16,185,129,0.45)]",
    progressClass: "bg-gradient-to-r from-sky-400 via-emerald-400 to-purple-400",
  },
];

const SCENE_DURATION_MS = 6000;

/* ============================================================================
   SCENE 01 비주얼: 지하경제(사행성)의 상승 & 불투명 블랙박스(기부)의 투명한 개방
   ============================================================================ */
function SceneOriginMotion() {
  return (
    <svg
      viewBox="0 0 600 420"
      className="w-full h-full select-none overflow-visible"
      role="img"
      aria-label="예측의 주류경제 편입과 기부의 투명한 전환 모션그래픽"
    >
      <defs>
        <linearGradient id="undergroundFade" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="glassOpenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.22" />
        </linearGradient>
        <filter id="s1Glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 중앙 수직 분할선 (두 질문의 대칭 무대) */}
      <line
        x1="300"
        y1="36"
        x2="300"
        y2="386"
        stroke="rgba(148,163,184,0.16)"
        strokeDasharray="4 6"
      />

      {/* -------------------- LEFT: 지하경제(사행성) → 주류경제(지성) -------------------- */}
      <g>
        <rect
          x="28"
          y="36"
          width="246"
          height="348"
          rx="20"
          fill="url(#undergroundFade)"
          stroke="rgba(255,255,255,0.08)"
        />

        {/* 주류경제 수평 경계선 */}
        <line
          x1="44"
          y1="214"
          x2="258"
          y2="214"
          stroke="rgba(56,189,248,0.45)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <text x="52" y="204" fill="#38bdf8" fontSize="9.5" fontWeight="800">
          ▲ 주류경제 · 사회적 지성
        </text>
        <text x="52" y="232" fill="#fda4af" fontSize="9.5" fontWeight="700" opacity="0.85">
          ▼ 지하경제 · 사행성 프레임
        </text>

        {/* 하단: 갇혀 흔들리는 사행성 노이즈 블록 */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect
            x="64"
            y="264"
            width="174"
            height="72"
            rx="14"
            fill="rgba(244,63,94,0.12)"
            stroke="rgba(244,63,94,0.45)"
            strokeDasharray="5 4"
          />
          <text
            x="151"
            y="294"
            textAnchor="middle"
            fill="#fda4af"
            fontSize="12"
            fontWeight="900"
          >
            &ldquo;왜 도박·지하에만?&rdquo;
          </text>
          <text
            x="151"
            y="316"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="600"
          >
            사행성에 갇힌 예측의 잠재력
          </text>
        </motion.g>

        {/* 경계선을 뚫고 위로 상승하는 빛의 광선 3줄 */}
        {[110, 151, 192].map((lx, i) => (
          <g key={`rise-${lx}`}>
            <line
              x1={lx}
              y1="262"
              x2={lx}
              y2="146"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            <motion.circle
              cx={lx}
              r="4"
              fill="#38bdf8"
              filter="url(#s1Glow)"
              initial={{ cy: 262, opacity: 0 }}
              animate={{ cy: [262, 136], opacity: [0, 1, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.45,
                ease: "easeOut",
              }}
            />
          </g>
        ))}

        {/* 상단: 주류경제에서 빛나는 예측 코어 */}
        <motion.g
          initial={{ opacity: 0.7, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <rect
            x="56"
            y="66"
            width="190"
            height="74"
            rx="16"
            fill="#0d182d"
            stroke="#38bdf8"
            strokeWidth="1.8"
          />
          <text
            x="151"
            y="97"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
            fontWeight="900"
          >
            주류경제의 예측 훈련장
          </text>
          <text
            x="151"
            y="119"
            textAnchor="middle"
            fill="#7dd3fc"
            fontSize="10.5"
            fontWeight="700"
          >
            더 나은 사회를 만드는 판단 기준
          </text>
        </motion.g>
      </g>

      {/* -------------------- RIGHT: 불투명 블랙박스 → 투명하고 다양한 기부 -------------------- */}
      <g>
        <rect
          x="326"
          y="36"
          width="246"
          height="348"
          rx="20"
          fill="url(#glassOpenGrad)"
          stroke="rgba(255,255,255,0.08)"
        />

        {/* 상단: 닫혀 있던 불투명 정기후원 블랙박스 → 좌우로 열리며 해체 */}
        <text
          x="449"
          y="64"
          textAnchor="middle"
          fill="#c4b5fd"
          fontSize="9.5"
          fontWeight="800"
        >
          블랙박스 해체 · 신뢰 회복
        </text>

        {/* 좌측 문 열림 */}
        <motion.rect
          y="80"
          width="82"
          height="68"
          rx="12"
          fill="#1e2436"
          stroke="rgba(148,163,184,0.45)"
          strokeWidth="1.4"
          initial={{ x: 367 }}
          animate={{ x: [367, 344, 344, 367] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 우측 문 열림 */}
        <motion.rect
          y="80"
          width="82"
          height="68"
          rx="12"
          fill="#1e2436"
          stroke="rgba(148,163,184,0.45)"
          strokeWidth="1.4"
          initial={{ x: 449 }}
          animate={{ x: [449, 472, 472, 449] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 내부에서 드러나는 투명한 빛 코어 */}
        <motion.circle
          cx="449"
          cy="114"
          r="20"
          fill="#a855f7"
          filter="url(#s1Glow)"
          animate={{ opacity: [0.25, 0.95, 0.95, 0.25], scale: [0.8, 1.15, 1.15, 0.8] }}
          style={{ transformOrigin: "449px 114px" }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <text
          x="449"
          y="118"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="900"
        >
          투명
        </text>
        <text
          x="449"
          y="168"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontWeight="600"
        >
          &ldquo;왜 불투명한 정기후원만?&rdquo;
        </text>

        {/* 하나의 빛이 3갈래 다양한 기부 방식으로 분기 */}
        {[
          { x: 368, label: "기관 기부", color: "#c084fc" },
          { x: 449, label: "물품 · 현장", color: "#fbbf24" },
          { x: 530, label: "선호 투표", color: "#34d399" },
        ].map((branch, idx) => {
          const pathD = `M 449 182 C 449 230, ${branch.x} 230, ${branch.x} 276`;
          return (
            <g key={branch.label}>
              <path
                d={pathD}
                fill="none"
                stroke={branch.color}
                strokeWidth="2"
                strokeOpacity="0.55"
              />
              <circle r="3.6" fill={branch.color} filter="url(#s1Glow)">
                <animateMotion
                  dur="2.4s"
                  begin={`${idx * 0.4}s`}
                  repeatCount="indefinite"
                  path={pathD}
                />
              </circle>
              <rect
                x={branch.x - 35}
                y="278"
                width="70"
                height="58"
                rx="12"
                fill="#0f1526"
                stroke={branch.color}
                strokeWidth="1.4"
              />
              <text
                x={branch.x}
                y="305"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10.5"
                fontWeight="800"
              >
                {branch.label}
              </text>
              <text
                x={branch.x}
                y="322"
                textAnchor="middle"
                fill={branch.color}
                fontSize="9"
                fontWeight="700"
              >
                100% 공개
              </text>
            </g>
          );
        })}

        <text
          x="449"
          y="362"
          textAnchor="middle"
          fill="#e9d5ff"
          fontSize="10.5"
          fontWeight="800"
        >
          다양하고 신뢰받는 기부 생태계
        </text>
      </g>
    </svg>
  );
}

/* ============================================================================
   SCENE 02 비주얼: 축 1 — 정답이 있는 문제 (역선택·편향 노이즈 → 확률 곡선 수렴 → 정답 락온)
   ============================================================================ */
function ScenePredictionAxisMotion() {
  const noisyDots = [
    { x: 52, y: 112, c: "#f43f5e", d: 0 },
    { x: 74, y: 158, c: "#fb7185", d: 0.3 },
    { x: 46, y: 205, c: "#f59e0b", d: 0.6 },
    { x: 82, y: 248, c: "#f43f5e", d: 0.2 },
    { x: 56, y: 298, c: "#fb7185", d: 0.5 },
    { x: 96, y: 132, c: "#fbbf24", d: 0.4 },
    { x: 98, y: 274, c: "#f43f5e", d: 0.7 },
  ];

  // 넓은(편향·불확실) 분포 → 좁고 날카로운(훈련된 기준) 베이지안 확률 곡선
  const wideCurve =
    "M 235 316 C 285 316, 315 225, 378 225 C 440 225, 470 316, 520 316";
  const sharpCurve =
    "M 235 316 C 320 316, 350 98, 378 98 C 406 98, 436 316, 520 316";
  const sharpArea = `${sharpCurve} L 520 316 L 235 316 Z`;

  return (
    <svg
      viewBox="0 0 600 420"
      className="w-full h-full select-none overflow-visible"
      role="img"
      aria-label="정답이 있는 문제에서 역선택과 편향을 극복하고 확률적 기준을 세우는 모션그래픽"
    >
      <defs>
        <linearGradient id="bayesFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="prismGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
        </linearGradient>
        <filter id="s2Glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 상단 영역 라벨 */}
      <text x="82" y="54" textAnchor="middle" fill="#fda4af" fontSize="10.5" fontWeight="800">
        편향 · 역선택 노이즈
      </text>
      <text x="190" y="54" textAnchor="middle" fill="#7dd3fc" fontSize="10.5" fontWeight="800">
        비편향 정보 프리즘
      </text>
      <text x="392" y="54" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">
        확률 분포 수렴 · 나만의 기준
      </text>

      {/* 좌측: 흩어져 요동치는 편향/역선택 신호들 */}
      <rect
        x="24"
        y="74"
        width="116"
        height="278"
        rx="16"
        fill="rgba(244,63,94,0.06)"
        stroke="rgba(244,63,94,0.22)"
        strokeDasharray="4 4"
      />
      {noisyDots.map((dot, idx) => (
        <motion.g
          key={idx}
          animate={{
            x: [0, 8, -5, 0],
            y: [0, -7, 6, 0],
            opacity: [0.45, 0.95, 0.45],
          }}
          transition={{
            duration: 2.6 + (idx % 3) * 0.5,
            repeat: Infinity,
            delay: dot.d,
            ease: "easeInOut",
          }}
        >
          <circle cx={dot.x} cy={dot.y} r="4.5" fill={dot.c} />
        </motion.g>
      ))}
      <text x="82" y="336" textAnchor="middle" fill="#fda4af" fontSize="9.5" fontWeight="700">
        Adverse Selection
      </text>

      {/* 노이즈 → 정보 프리즘으로 진입하는 파동 */}
      {[130, 210, 286].map((sy, idx) => {
        const p = `M 122 ${sy} C 145 ${sy}, 152 210, 174 210`;
        return (
          <g key={sy}>
            <path d={p} fill="none" stroke="rgba(251,113,133,0.35)" strokeWidth="1.4" />
            <circle r="3" fill="#fb7185">
              <animateMotion
                dur="2.2s"
                begin={`${idx * 0.5}s`}
                repeatCount="indefinite"
                path={p}
              />
            </circle>
          </g>
        );
      })}

      {/* 중앙: 비편향 정보 검증 프리즘 (양쪽 균형 근거 필터) */}
      <rect
        x="174"
        y="84"
        width="32"
        height="258"
        rx="16"
        fill="url(#prismGrad)"
        stroke="#38bdf8"
        strokeWidth="1.6"
      />
      <motion.rect
        x="178"
        width="24"
        height="44"
        rx="12"
        fill="#38bdf8"
        opacity="0.45"
        animate={{ y: [96, 286, 96] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 우측: 확률적 사고 & 정답(Truth) 락온 차트 영역 */}
      <rect
        x="226"
        y="74"
        width="348"
        height="278"
        rx="18"
        fill="#0b1326"
        stroke="rgba(56,189,248,0.28)"
      />

      {/* 그리드 기준선 */}
      {[135, 195, 255, 316].map((gy) => (
        <line
          key={gy}
          x1="242"
          y1={gy}
          x2="556"
          y2={gy}
          stroke="rgba(148,163,184,0.09)"
          strokeDasharray="3 4"
        />
      ))}

      {/* 이전(훈련 전): 넓고 불확실한 분포 */}
      <path
        d={wideCurve}
        fill="none"
        stroke="rgba(148,163,184,0.35)"
        strokeWidth="1.8"
        strokeDasharray="5 5"
      />
      <text x="488" y="242" fill="#64748b" fontSize="9.5" fontWeight="700">
        훈련 전 (불확실)
      </text>

      {/* 훈련 후: 날카롭게 수렴하는 베이지안 확률 분포 */}
      <motion.path
        d={sharpArea}
        fill="url(#bayesFill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.35, 0.9, 0.65, 0.9] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d={sharpCurve}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        filter="url(#s2Glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      {/* 정답(Truth) 수직 기준선 & 락온 타겟 */}
      <line
        x1="378"
        y1="88"
        x2="378"
        y2="316"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <motion.circle
        cx="378"
        cy="98"
        r="16"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.8"
        style={{ transformOrigin: "378px 98px" }}
        animate={{ scale: [0.85, 1.35, 0.85], opacity: [0.9, 0.15, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="378" cy="98" r="5.5" fill="#ffffff" filter="url(#s2Glow)" />

      {/* 타겟 뱃지 */}
      <rect
        x="404"
        y="86"
        width="136"
        height="34"
        rx="10"
        fill="rgba(14,165,233,0.18)"
        stroke="#38bdf8"
      />
      <text x="472" y="102" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="900">
        TRUTH · 정답 수렴
      </text>
      <text x="472" y="114" textAnchor="middle" fill="#7dd3fc" fontSize="8.5" fontWeight="700">
        Calibration · 확률 기준 확립
      </text>

      {/* 하단 핵심 요약 캡션 */}
      <rect
        x="24"
        y="366"
        width="550"
        height="36"
        rx="12"
        fill="rgba(56,189,248,0.08)"
        stroke="rgba(56,189,248,0.25)"
      />
      <text
        x="299"
        y="388"
        textAnchor="middle"
        fill="#bae6fd"
        fontSize="11"
        fontWeight="800"
      >
        정답이 있는 문제 → 역선택 극복 · 비편향 정보 습득 · 나만의 확률 기준 훈련
      </text>
    </svg>
  );
}

/* ============================================================================
   SCENE 03 비주얼: 축 2 — 정답이 없는 문제 (희소 자원 → 콩도르세·보르다 선호 투표 → 투명 배분)
   ============================================================================ */
function SceneDonationAxisMotion() {
  const candidates = [
    {
      rank: "1순위",
      name: "아동 · 교육 지원",
      pct: "46%",
      barW: 122,
      y: 120,
      color: "#c084fc",
      destLabel: "직접 전달 완료",
    },
    {
      rank: "2순위",
      name: "지역 소상공인·물품",
      pct: "34%",
      barW: 92,
      y: 206,
      color: "#fbbf24",
      destLabel: "물품 매칭 공개",
    },
    {
      rank: "3순위",
      name: "기후 · 환경 프로젝트",
      pct: "20%",
      barW: 58,
      y: 292,
      color: "#34d399",
      destLabel: "원장 투명 검증",
    },
  ];

  return (
    <svg
      viewBox="0 0 600 420"
      className="w-full h-full select-none overflow-visible"
      role="img"
      aria-label="정답이 없는 문제에서 콩도르세 보르다 선호 투표로 희소 자원을 투명하게 배분하는 모션그래픽"
    >
      <defs>
        <linearGradient id="scarceGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="s3Glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 상단 영역 라벨 */}
      <text x="86" y="54" textAnchor="middle" fill="#fde047" fontSize="10.5" fontWeight="800">
        희소한 자원 (유한)
      </text>
      <text x="292" y="54" textAnchor="middle" fill="#d8b4fe" fontSize="10.5" fontWeight="800">
        콩도르세 · 보르다 선호 집계
      </text>
      <text x="502" y="54" textAnchor="middle" fill="#6ee7b7" fontSize="10.5" fontWeight="800">
        투명·다양한 자원 배분
      </text>

      {/* 좌측: 유한한 희소 자원 코어 */}
      <rect
        x="24"
        y="128"
        width="124"
        height="164"
        rx="18"
        fill="rgba(245,158,11,0.08)"
        stroke="rgba(245,158,11,0.4)"
      />
      <motion.circle
        cx="86"
        cy="196"
        r="34"
        fill="rgba(245,158,11,0.16)"
        stroke="url(#scarceGold)"
        strokeWidth="2.2"
        style={{ transformOrigin: "86px 196px" }}
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <text x="86" y="193" textAnchor="middle" fill="#fde047" fontSize="12" fontWeight="900">
        SCARCE
      </text>
      <text x="86" y="210" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800">
        희소 자원
      </text>
      <text x="86" y="268" textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="700">
        어디에 써야 최선일까?
      </text>

      {/* 중앙: 콩도르세·보르다 선호 투표 엔진 */}
      <rect
        x="188"
        y="74"
        width="208"
        height="276"
        rx="18"
        fill="#110f24"
        stroke="rgba(168,85,247,0.4)"
      />
      <text x="292" y="98" textAnchor="middle" fill="#e9d5ff" fontSize="10" fontWeight="800">
        Condorcet · Borda Preference
      </text>

      {candidates.map((cand, idx) => {
        const leftPipe = `M 148 210 C 166 210, 168 ${cand.y + 18}, 188 ${cand.y + 18}`;
        const rightPipe = `M 396 ${cand.y + 18} C 414 ${cand.y + 18}, 418 ${cand.y + 18}, 434 ${cand.y + 18}`;

        return (
          <g key={cand.name}>
            {/* 희소 자원 → 선호 엔진 파이프 */}
            <path d={leftPipe} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeOpacity="0.45" />
            <circle r="3.4" fill="#fde047" filter="url(#s3Glow)">
              <animateMotion
                dur="2.4s"
                begin={`${idx * 0.45}s`}
                repeatCount="indefinite"
                path={leftPipe}
              />
            </circle>

            {/* 선호 카드 행 */}
            <rect
              x="200"
              y={cand.y - 8}
              width="184"
              height="62"
              rx="12"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.08)"
            />
            <rect
              x="208"
              y={cand.y}
              width="36"
              height="16"
              rx="6"
              fill={cand.color}
              fillOpacity="0.2"
            />
            <text
              x="226"
              y={cand.y + 11}
              textAnchor="middle"
              fill={cand.color}
              fontSize="8.5"
              fontWeight="900"
            >
              {cand.rank}
            </text>
            <text
              x="252"
              y={cand.y + 12}
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="800"
            >
              {cand.name}
            </text>
            <text
              x="374"
              y={cand.y + 12}
              textAnchor="end"
              fill={cand.color}
              fontSize="10.5"
              fontWeight="900"
            >
              {cand.pct}
            </text>

            {/* 애니메이션 보르다 가중치 게이지 바 */}
            <rect
              x="208"
              y={cand.y + 28}
              width="166"
              height="10"
              rx="5"
              fill="rgba(255,255,255,0.07)"
            />
            <motion.rect
              x="208"
              y={cand.y + 28}
              height="10"
              rx="5"
              fill={cand.color}
              initial={{ width: 20 }}
              animate={{ width: [cand.barW * 0.72, cand.barW, cand.barW * 0.92, cand.barW] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                delay: idx * 0.25,
                ease: "easeInOut",
              }}
            />

            {/* 선호 엔진 → 투명 목적지 배분 파이프 */}
            <path d={rightPipe} fill="none" stroke={cand.color} strokeWidth="2.4" strokeOpacity="0.7" />
            <circle r="3.8" fill={cand.color} filter="url(#s3Glow)">
              <animateMotion
                dur="1.8s"
                begin={`${idx * 0.35}s`}
                repeatCount="indefinite"
                path={rightPipe}
              />
            </circle>

            {/* 우측: 투명 배분 결과 노드 */}
            <rect
              x="434"
              y={cand.y - 8}
              width="140"
              height="62"
              rx="14"
              fill="#0c1526"
              stroke={cand.color}
              strokeWidth="1.4"
            />
            <text
              x="448"
              y={cand.y + 15}
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="800"
            >
              ✓ {cand.destLabel}
            </text>
            <text
              x="448"
              y={cand.y + 34}
              fill={cand.color}
              fontSize="9.5"
              fontWeight="700"
            >
              선호 비중 {cand.pct} 배분
            </text>
          </g>
        );
      })}

      {/* 하단 핵심 요약 캡션 */}
      <rect
        x="24"
        y="366"
        width="550"
        height="36"
        rx="12"
        fill="rgba(168,85,247,0.1)"
        stroke="rgba(168,85,247,0.3)"
      />
      <text
        x="299"
        y="388"
        textAnchor="middle"
        fill="#e9d5ff"
        fontSize="11"
        fontWeight="800"
      >
        정답이 없는 문제 → 선호 투표(콩도르세·보르다) · 희소 자원의 효율·투명 배분 훈련
      </text>
    </svg>
  );
}

/* ============================================================================
   SCENE 04 비주얼: 두 축의 완성 — 예측(정답 O) × 기부(정답 X) = 합리적 의사결정 훈련장 PosMul
   ============================================================================ */
function SceneSynthesisMotion() {
  return (
    <svg
      viewBox="0 0 600 420"
      className="w-full h-full select-none overflow-visible"
      role="img"
      aria-label="예측과 기부 두 축이 결합해 합리적 의사결정 훈련장 PosMul을 완성하는 모션그래픽"
    >
      <defs>
        <linearGradient id="dualBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id="synthCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <filter id="s4Glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 중앙 배경 오라 및 긍정승수 파문 */}
      <circle cx="300" cy="204" r="135" fill="url(#synthCore)" />
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="300"
          cy="204"
          fill="none"
          stroke="url(#dualBeam)"
          strokeWidth="1.6"
          initial={{ r: 52, opacity: 0.6 }}
          animate={{ r: 178, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 좌측 축 (예측) ↔ 우측 축 (기부) 연결하는 이중 인피니티/균형 궤도 */}
      <path
        id="orbitTop"
        d="M 148 164 C 218 82, 382 82, 452 164"
        fill="none"
        stroke="url(#dualBeam)"
        strokeWidth="2.4"
        strokeOpacity="0.55"
      />
      <path
        id="orbitBottom"
        d="M 452 244 C 382 326, 218 326, 148 244"
        fill="none"
        stroke="url(#dualBeam)"
        strokeWidth="2.4"
        strokeOpacity="0.55"
      />

      {/* 궤도를 순환하는 에너지 광점 */}
      <circle r="4.5" fill="#38bdf8" filter="url(#s4Glow)">
        <animateMotion dur="3.4s" repeatCount="indefinite" path="M 148 164 C 218 82, 382 82, 452 164" />
      </circle>
      <circle r="4.5" fill="#c084fc" filter="url(#s4Glow)">
        <animateMotion dur="3.4s" repeatCount="indefinite" path="M 452 244 C 382 326, 218 326, 148 244" />
      </circle>

      {/* 수평 균형 빔 */}
      <line
        x1="176"
        y1="204"
        x2="424"
        y2="204"
        stroke="url(#dualBeam)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      />

      {/* 좌측 축 카드: 예측 (정답이 있는 문제) */}
      <g>
        <rect
          x="24"
          y="112"
          width="162"
          height="184"
          rx="20"
          fill="#0b152a"
          stroke="#38bdf8"
          strokeWidth="1.8"
        />
        <rect x="40" y="128" width="96" height="20" rx="10" fill="rgba(56,189,248,0.18)" />
        <text x="88" y="141" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="900">
          AXIS 1 · 정답 O
        </text>
        <text x="40" y="176" fill="#ffffff" fontSize="18" fontWeight="900">
          예측 훈련
        </text>
        <text x="40" y="200" fill="#bae6fd" fontSize="10.5" fontWeight="700">
          • 역선택 · 편향 돌파
        </text>
        <text x="40" y="220" fill="#bae6fd" fontSize="10.5" fontWeight="700">
          • 확률적 사고 습관화
        </text>
        <text x="40" y="240" fill="#bae6fd" fontSize="10.5" fontWeight="700">
          • 나만의 기준 수립
        </text>
        <text x="40" y="274" fill="#38bdf8" fontSize="9.5" fontWeight="800">
          지하 사행성 ➔ 주류 지성
        </text>
      </g>

      {/* 우측 축 카드: 기부 (정답이 없는 문제) */}
      <g>
        <rect
          x="414"
          y="112"
          width="162"
          height="184"
          rx="20"
          fill="#150e28"
          stroke="#a855f7"
          strokeWidth="1.8"
        />
        <rect x="430" y="128" width="96" height="20" rx="10" fill="rgba(168,85,247,0.2)" />
        <text x="478" y="141" textAnchor="middle" fill="#e9d5ff" fontSize="9.5" fontWeight="900">
          AXIS 2 · 정답 X
        </text>
        <text x="430" y="176" fill="#ffffff" fontSize="18" fontWeight="900">
          기부 훈련
        </text>
        <text x="430" y="200" fill="#e9d5ff" fontSize="10.5" fontWeight="700">
          • 콩도르세·보르다 투표
        </text>
        <text x="430" y="220" fill="#e9d5ff" fontSize="10.5" fontWeight="700">
          • 희소 자원 효율 배분
        </text>
        <text x="430" y="240" fill="#e9d5ff" fontSize="10.5" fontWeight="700">
          • 투명·다양한 나눔
        </text>
        <text x="430" y="274" fill="#c084fc" fontSize="9.5" fontWeight="800">
          불투명 후원 ➔ 신뢰 배분
        </text>
      </g>

      {/* 중앙 융합 코어: PosMul */}
      <g transform="translate(300, 204)">
        <motion.circle
          r="62"
          fill="none"
          stroke="url(#dualBeam)"
          strokeWidth="2.4"
          strokeDasharray="22 10 8 10"
          style={{ transformOrigin: "0px 0px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
        <circle r="52" fill="#09101f" stroke="#10b981" strokeWidth="2" />
        <text y="-10" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800" letterSpacing="1.6">
          POSITIVE MULTIPLIER
        </text>
        <text y="11" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900">
          PosMul
        </text>
        <text y="28" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="800">
          합리적 의사결정 훈련장
        </text>
      </g>

      {/* 하단 핵심 선언 */}
      <rect
        x="24"
        y="366"
        width="550"
        height="36"
        rx="12"
        fill="rgba(16,185,129,0.1)"
        stroke="rgba(16,185,129,0.3)"
      />
      <text
        x="299"
        y="388"
        textAnchor="middle"
        fill="#a7f3d0"
        fontSize="11"
        fontWeight="800"
      >
        사실을 꿰뚫는 예측 × 가치를 나누는 기부 = 더 나은 사회를 만드는 긍정승수
      </text>
    </svg>
  );
}

export function HeroLandingSection({ totalPool, totalUsers }: HeroLandingSectionProps) {
  const [activeScene, setActiveScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const timer = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENES.length);
    }, SCENE_DURATION_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered]);

  const current = SCENES[activeScene];

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
      className="relative overflow-hidden rounded-3xl bg-[#080c16] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.7)] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10"
    >
      {/* 배경 미세 그리드 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 장면별 호흡 오로라 광원 */}
      <motion.div
        key={`aura-${current.id}`}
        initial={{ opacity: 0.25, scale: 0.94 }}
        animate={{ opacity: 0.9, scale: 1.04 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`pointer-events-none absolute -top-28 -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-br ${current.auraClass} blur-3xl`}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        {/* ==================== 좌측 (5 cols): 철학 스토리 & 컨트롤 ==================== */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          {/* 상단 브랜드 태그 + 재생 제어 */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-slate-200 text-[11px] font-extrabold tracking-wide">
              <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>합리적 의사결정 훈련장 · PosMul</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] text-[10.5px] font-bold text-slate-300 transition cursor-pointer"
              title={isPlaying ? "자동 전환 일시정지" : "자동 전환 재생"}
            >
              {isPlaying && !isHovered ? (
                <Pause className="w-3 h-3 text-sky-400" />
              ) : (
                <Play className="w-3 h-3 text-emerald-400" />
              )}
              <span>
                {isPlaying && !isHovered ? "PLAYING" : isHovered && isPlaying ? "PAUSED" : "MANUAL"}
              </span>
            </button>
          </div>

          {/* 4-Scene 필름 타임라인 바 */}
          <div className="grid grid-cols-4 gap-2">
            {SCENES.map((scene, idx) => {
              const isActive = idx === activeScene;
              const isPast = idx < activeScene;
              return (
                <button
                  key={scene.code}
                  type="button"
                  onClick={() => setActiveScene(idx)}
                  className="group text-left space-y-1.5 focus:outline-none cursor-pointer"
                >
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    {isActive ? (
                      <motion.div
                        key={`bar-${scene.id}-${isPlaying}-${isHovered}`}
                        initial={{ width: "0%" }}
                        animate={{ width: isPlaying && !isHovered ? "100%" : "60%" }}
                        transition={{
                          duration: isPlaying && !isHovered ? SCENE_DURATION_MS / 1000 : 0.3,
                          ease: "linear",
                        }}
                        className={`h-full rounded-full ${scene.progressClass}`}
                      />
                    ) : (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPast ? "w-full bg-white/30" : "w-0 group-hover:w-1/2 bg-white/20"
                        }`}
                      />
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold truncate transition-colors ${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    {scene.shortLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 키네틱 스토리 본문 */}
          <div className="min-h-[245px] sm:min-h-[255px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3.5"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold tracking-wide ${current.badgeClass}`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{current.badge}</span>
                </div>

                <p className="text-xs font-bold text-slate-400 tracking-wide">
                  {current.questionOrAxis}
                </p>

                <h1 className="text-2xl sm:text-[29px] xl:text-[33px] font-black text-white leading-[1.26] tracking-tight break-keep">
                  <span className="block">{current.headlineTop}</span>
                  <span>
                    <span
                      className={`bg-gradient-to-r bg-clip-text text-transparent ${current.highlightClass}`}
                    >
                      {current.headlineHighlight}
                    </span>
                    {current.headlineBottom && <span>{current.headlineBottom}</span>}
                  </span>
                </h1>

                <p className="text-xs sm:text-[13.5px] text-slate-300/90 leading-relaxed break-keep">
                  {current.body}
                </p>

                {/* 핵심 키워드 칩 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {current.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/[0.08] text-[11px] font-bold text-slate-200"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: current.accentHex }}
                      />
                      {kw}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTA 버튼 */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={scrollToMarkets}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-[0_10px_28px_rgba(37,99,235,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Target className="w-4 h-4 shrink-0" />
              <span>예측 훈련 시작</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <Link
              href="/donation"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/35 text-purple-200 font-bold text-xs sm:text-sm transition-all"
            >
              <HeartHandshake className="w-4 h-4 text-purple-300 shrink-0" />
              <span>기부 배분 체험</span>
            </Link>

            <Link
              href="/forum"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all"
            >
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>광장</span>
            </Link>
          </div>

          {/* 하단 라이브 지표 */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-3 border-t border-white/[0.07] text-[11.5px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>MoneyWave 상금풀</span>
              <strong className="text-amber-300 font-black font-mono">
                {Math.round(totalPool).toLocaleString()} PMC
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>훈련 중인 시민</span>
              <strong className="text-white font-black font-mono">
                {totalUsers.toLocaleString()}명
              </strong>
            </div>
          </div>
        </div>

        {/* ==================== 우측 (7 cols): 장면별 전용 시네마틱 모션그래픽 캔버스 ==================== */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0d1426]/95 via-[#090e1c]/95 to-[#060912]/95 border border-white/[0.09] p-3 sm:p-4 shadow-2xl overflow-hidden">
            {/* 캔버스 상단 시네마 HUD */}
            <div className="flex items-center justify-between px-2 pb-2 text-[10.5px] font-mono">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: current.accentHex }}
                />
                <span className="font-bold text-slate-200 tracking-wider">
                  SCENE {current.code} / 04
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  — {current.shortLabel}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {SCENES.map((s, idx) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setActiveScene(idx)}
                    aria-label={`${s.shortLabel} 보기`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeScene
                        ? "w-5 bg-white"
                        : "w-1.5 bg-slate-600 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4개 장면 전용 모션그래픽 크로스페이드 스테이지 */}
            <div className="relative w-full aspect-[600/420]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`stage-${activeScene}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  {activeScene === 0 && <SceneOriginMotion />}
                  {activeScene === 1 && <ScenePredictionAxisMotion />}
                  {activeScene === 2 && <SceneDonationAxisMotion />}
                  {activeScene === 3 && <SceneSynthesisMotion />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
