"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HeroLandingSectionProps {
  totalPredictions: number;
  totalDonationAmount: number;
  totalUsers: number;
}

type FocusMode = "harmony" | "prediction" | "donation";

interface ModeMeta {
  id: FocusMode;
  eyebrow: string;
  headlineTop: string;
  headlineAccent: string;
  line1: string;
  line2: string;
  accentGradient: string;
  dotColor: string;
}

const MODE_CONTENT: Record<FocusMode, ModeMeta> = {
  harmony: {
    id: "harmony",
    eyebrow: "POSMUL  ·  합리적 의사결정 훈련장",
    headlineTop: "혼돈 속에서 기준을 세우고,",
    headlineAccent: "선호로 가치를 나누다.",
    line1: "예측을 지하의 사행성에서 주류의 지성으로,",
    line2: "기부를 불투명한 후원에서 투명한 자원배분으로 바꿉니다.",
    accentGradient: "from-sky-200 via-white to-violet-200",
    dotColor: "#38bdf8",
  },
  prediction: {
    id: "prediction",
    eyebrow: "정답이 있는 문제  ·  예측",
    headlineTop: "다양한 정보 속에서",
    headlineAccent: "나만의 기준을 세우다.",
    line1: "세상의 정보는 다양한 출처만큼 저마다의 편향을 품고 있습니다.",
    line2: "여러 정보를 확률로 가려내 역선택을 넘고, 나만의 판단 기준을 훈련합니다.",
    accentGradient: "from-cyan-200 via-sky-300 to-blue-200",
    dotColor: "#38bdf8",
  },
  donation: {
    id: "donation",
    eyebrow: "정답이 없는 문제  ·  기부",
    headlineTop: "닫힌 정기후원을 넘어",
    headlineAccent: "선호로 자원을 배분하다.",
    line1: "정답이 없는 가치의 문제에는 다양한 방식과 투명한 신뢰가 필요합니다.",
    line2: "콩도르세·보르다 선호 투표로, 희소한 자원을 필요한 곳에 투명하게 배분합니다.",
    accentGradient: "from-violet-200 via-fuchsia-200 to-amber-200",
    dotColor: "#c084fc",
  },
};

interface FlowParticle {
  t: number; // 0 (좌측 다양한 정보) -> 0.5 (중앙 수렴 프리즘) -> 1 (우측 다채로운 확산)
  speed: number;
  lane: number;
  branch: number;
  size: number;
  phase: number;
  alpha: number;
}

const DISPERSION_PALETTE = [
  { r: 192, g: 132, b: 252 }, // violet
  { r: 244, g: 114, b: 182 }, // pink
  { r: 251, g: 191, b: 36 }, // amber
  { r: 52, g: 211, b: 153 }, // emerald
  { r: 129, g: 140, b: 248 }, // indigo
];

/**
 * 60fps 실시간 제너레이티브 빛의 흐름 캔버스
 * - 좌측 -> 중앙: 다양한 색과 결을 지닌 정보 입자들이 하나의 명확한 기준으로 수렴 (정답이 있는 문제 · 예측)
 * - 중앙 -> 우측: 정제된 빛이 다채로운 스펙트럼으로 투명하게 확산·배분 (정답이 없는 문제 · 기부)
 */
function GenerativeLightCanvas({ focusMode }: { focusMode: FocusMode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const focusRef = useRef<FocusMode>(focusMode);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });

  useEffect(() => {
    focusRef.current = focusMode;
  }, [focusMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;

    const particleCount = prefersReducedMotion ? 55 : 145;
    const particles: FlowParticle[] = Array.from({ length: particleCount }, (_, i) => ({
      t: Math.random(),
      speed: 0.00085 + Math.random() * 0.00145,
      lane: (Math.random() * 2 - 1) * (0.45 + Math.random() * 0.55),
      branch: i % DISPERSION_PALETTE.length,
      size: 1.05 + Math.random() * 2.1,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.35 + Math.random() * 0.65,
    }));

    const dust = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (e.clientX - rect.left) / Math.max(1, rect.width),
        y: (e.clientY - rect.top) / Math.max(1, rect.height),
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const parent = canvas.parentElement;
    parent?.addEventListener("mousemove", onPointerMove);
    parent?.addEventListener("mouseleave", onPointerLeave);

    let leftBoost = 1;
    let rightBoost = 1;
    let time = 0;

    const evalFlowPosition = (
      t: number,
      lane: number,
      branch: number,
      phase: number,
      now: number,
      cy: number
    ) => {
      const spreadY = height * 0.44;
      if (t <= 0.5) {
        const u = t / 0.5;
        const envelope = Math.pow(1 - u, 1.85);
        const wave =
          Math.sin(u * Math.PI * 2.4 + phase + now * 0.9) *
          height *
          0.065 *
          envelope;
        return cy + lane * spreadY * envelope + wave;
      }
      const v = (t - 0.5) / 0.5;
      const branchOffset = (branch - 2) / 2;
      const easeOut = 1 - Math.pow(1 - v, 2.2);
      const harmonic =
        Math.sin(v * Math.PI * 1.8 + branch * 0.9 - now * 0.85) *
        height *
        0.032 *
        v;
      const microJitter = lane * height * 0.045 * easeOut;
      return cy + branchOffset * (height * 0.36) * easeOut + harmonic + microJitter;
    };

    const render = () => {
      time += prefersReducedMotion ? 0.002 : 0.012;

      const targetLeft =
        focusRef.current === "prediction"
          ? 1.38
          : focusRef.current === "donation"
            ? 0.4
            : 1.0;
      const targetRight =
        focusRef.current === "donation"
          ? 1.38
          : focusRef.current === "prediction"
            ? 0.4
            : 1.0;
      leftBoost += (targetLeft - leftBoost) * 0.055;
      rightBoost += (targetRight - rightBoost) * 0.055;

      ctx.clearRect(0, 0, width, height);

      const isWide = width >= 768;
      const cx = isWide ? width * 0.58 : width * 0.5;
      const cy = isWide ? height * 0.5 : height * 0.48;

      const pxOffset = pointerRef.current.active
        ? (pointerRef.current.x - 0.5) * 24
        : 0;
      const pyOffset = pointerRef.current.active
        ? (pointerRef.current.y - 0.5) * 16
        : 0;

      const drawNebula = (
        nx: number,
        ny: number,
        nr: number,
        rgbaInner: string,
        rgbaOuter: string
      ) => {
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, rgbaInner);
        g.addColorStop(1, rgbaOuter);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fill();
      };

      drawNebula(
        width * 0.2 + pxOffset * 0.4,
        cy - height * 0.05 + pyOffset * 0.4,
        Math.max(width, height) * 0.46,
        `rgba(56, 189, 248, ${(0.16 * leftBoost).toFixed(3)})`,
        "rgba(56, 189, 248, 0)"
      );
      drawNebula(
        cx + pxOffset * 0.55,
        cy + pyOffset * 0.55,
        Math.max(width, height) * 0.34,
        "rgba(165, 243, 252, 0.13)",
        "rgba(16, 185, 129, 0)"
      );
      drawNebula(
        width * 0.87 + pxOffset * 0.45,
        cy + height * 0.05 + pyOffset * 0.45,
        Math.max(width, height) * 0.48,
        `rgba(168, 85, 247, ${(0.18 * rightBoost).toFixed(3)})`,
        "rgba(245, 158, 11, 0)"
      );

      for (const d of dust) {
        const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.4 + d.phase));
        ctx.fillStyle = `rgba(226, 232, 240, ${(twinkle * 0.36).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // 좌측 실크 수렴 리본
      const leftLanes = [-0.85, -0.48, -0.18, 0.18, 0.48, 0.85];
      leftLanes.forEach((ln, idx) => {
        ctx.beginPath();
        const steps = 42;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = u * cx;
          const env = Math.pow(1 - u, 1.85);
          const wave =
            Math.sin(u * Math.PI * 2.2 + idx * 0.85 + time * 0.85) *
            height *
            0.048 *
            env;
          const y = cy + ln * height * 0.4 * env + wave + pyOffset * 0.25 * env;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(0, cy, cx, cy);
        grad.addColorStop(0, `rgba(244, 63, 94, ${(0.03 * leftBoost).toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(56, 189, 248, ${(0.14 * leftBoost).toFixed(3)})`);
        grad.addColorStop(1, `rgba(224, 242, 254, ${(0.34 * leftBoost).toFixed(3)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = idx === 2 || idx === 3 ? 1.5 : 1.0;
        ctx.stroke();
      });

      // 우측 프리즘 확산 실크 리본
      DISPERSION_PALETTE.forEach((col, bIdx) => {
        ctx.beginPath();
        const steps = 44;
        const branchOffset = (bIdx - 2) / 2;
        for (let s = 0; s <= steps; s++) {
          const v = s / steps;
          const x = cx + v * (width - cx);
          const easeOut = 1 - Math.pow(1 - v, 2.2);
          const harmonic =
            Math.sin(v * Math.PI * 1.9 + bIdx * 0.9 - time * 0.85) *
            height *
            0.034 *
            v;
          const y =
            cy +
            branchOffset * (height * 0.37) * easeOut +
            harmonic +
            pyOffset * 0.3 * v;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(cx, cy, width, cy);
        grad.addColorStop(0, `rgba(255, 255, 255, ${(0.32 * rightBoost).toFixed(3)})`);
        grad.addColorStop(
          0.45,
          `rgba(${col.r}, ${col.g}, ${col.b}, ${(0.28 * rightBoost).toFixed(3)})`
        );
        grad.addColorStop(
          1,
          `rgba(${col.r}, ${col.g}, ${col.b}, ${(0.04 * rightBoost).toFixed(3)})`
        );
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.65;
        ctx.stroke();
      });

      // 중앙 프리즘 광환
      const pulse = 1 + Math.sin(time * 1.6) * 0.08;
      const coreX = cx + pxOffset * 0.15;
      const coreY = cy + pyOffset * 0.15;

      for (let ring = 0; ring < 3; ring++) {
        const ringPhase = (time * 0.35 + ring * 0.33) % 1;
        const r = 18 + ringPhase * 92;
        const op = (1 - ringPhase) * 0.24;
        ctx.strokeStyle = `rgba(186, 230, 253, ${op.toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(coreX, coreY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawNebula(
        coreX,
        coreY,
        46 * pulse,
        "rgba(255, 255, 255, 0.55)",
        "rgba(56, 189, 248, 0)"
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, 3.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 빛 입자 흐름
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            p.lane = (Math.random() * 2 - 1) * (0.45 + Math.random() * 0.55);
          }
        }

        const baseY = evalFlowPosition(p.t, p.lane, p.branch, p.phase, time, cy);
        const mappedX =
          p.t <= 0.5
            ? (p.t / 0.5) * cx
            : cx + ((p.t - 0.5) / 0.5) * (width - cx);
        const mappedY =
          baseY + pyOffset * 0.2 * (p.t <= 0.5 ? 1 - p.t * 2 : (p.t - 0.5) * 2);

        const edgeFade = Math.min(p.t * 8, (1 - p.t) * 6, 1);

        let r = 56;
        let g = 189;
        let b = 248;
        let boost = leftBoost;

        if (p.t < 0.22) {
          const mix = p.t / 0.22;
          r = Math.round(244 * (1 - mix) + 56 * mix);
          g = Math.round(114 * (1 - mix) + 189 * mix);
          b = Math.round(182 * (1 - mix) + 248 * mix);
          boost = leftBoost;
        } else if (p.t <= 0.5) {
          const mix = (p.t - 0.22) / 0.28;
          r = Math.round(56 * (1 - mix) + 235 * mix);
          g = Math.round(189 * (1 - mix) + 250 * mix);
          b = Math.round(248 * (1 - mix) + 255 * mix);
          boost = leftBoost;
        } else {
          const col = DISPERSION_PALETTE[p.branch];
          const mix = Math.min(1, (p.t - 0.5) / 0.18);
          r = Math.round(255 * (1 - mix) + col.r * mix);
          g = Math.round(255 * (1 - mix) + col.g * mix);
          b = Math.round(255 * (1 - mix) + col.b * mix);
          boost = rightBoost;
        }

        const finalAlpha = Math.min(1, p.alpha * edgeFade * boost);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(finalAlpha * 0.24).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mappedX, mappedY, p.size * 3.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mappedX, mappedY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      parent?.removeEventListener("mousemove", onPointerMove);
      parent?.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function HeroLandingSection({
  totalPredictions,
  totalDonationAmount,
  totalUsers,
}: HeroLandingSectionProps) {
  const [focusMode, setFocusMode] = useState<FocusMode>("harmony");
  const current = MODE_CONTENT[focusMode];

  return (
    <section
      onMouseLeave={() => setFocusMode("harmony")}
      className="relative overflow-hidden rounded-[28px] bg-[#060913] border border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.75)] min-h-[440px] sm:min-h-[490px] flex flex-col justify-between"
    >
      {/* 1. 풀-블리드 60fps 제너레이티브 빛의 수렴·확산 모션그래픽 */}
      <GenerativeLightCanvas focusMode={focusMode} />

      {/* 2. 텍스트 가독성을 지켜주는 부드러운 비네팅 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060913]/90 via-[#060913]/52 to-[#060913]/22" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#060913]/92 to-transparent" />

      {/* 3. 시네마틱 미세 필름 그레인 */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="posmulFilmGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#posmulFilmGrain)" />
      </svg>

      {/* ==================== 상단: 브랜드 시그니처 & 누적 기부금액 · 누적 사용자 ==================== */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 pt-6 sm:px-10 sm:pt-8">
        <div className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-bold tracking-[0.14em] text-slate-200/90">
          <span
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: current.dotColor,
              boxShadow: `0 0 12px ${current.dotColor}`,
            }}
          />
          <span>{current.eyebrow}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-300/90 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-full px-4 py-1.5">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-slate-400">누적 예측</span>
            <strong className="text-sky-200 font-extrabold font-mono">
              {totalPredictions.toLocaleString()}
            </strong>
          </span>
          <span className="text-white/15">|</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-slate-400">누적 기부</span>
            <strong className="text-violet-200 font-extrabold font-mono">
              {Math.round(totalDonationAmount).toLocaleString()}
            </strong>
          </span>
          <span className="text-white/15">|</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-400">누적 사용자</span>
            <strong className="text-white font-extrabold font-mono">
              {totalUsers.toLocaleString()}
            </strong>
          </span>
        </div>
      </div>

      {/* ==================== 중단: 여백과 가독성에 집중한 에디토리얼 카피 ==================== */}
      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 max-w-3xl">
        <div className="min-h-[160px] sm:min-h-[180px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-[-0.03em] leading-[1.2] text-white break-keep">
                <span className="block text-slate-100">{current.headlineTop}</span>
                <span
                  className={`block mt-1 bg-gradient-to-r bg-clip-text text-transparent ${current.accentGradient}`}
                >
                  {current.headlineAccent}
                </span>
              </h1>

              <div className="space-y-1.5 text-[13.5px] sm:text-[15px] text-slate-200/85 leading-[1.7] font-normal max-w-2xl break-keep">
                <p>{current.line1}</p>
                <p className="text-slate-300/85">{current.line2}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ==================== 하단: 정답이 있는 문제 vs 정답이 없는 문제 (2분할 글래스 바) ==================== */}
      <div className="relative z-10 px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. 정답이 있는 문제 · 예측 */}
          <button
            type="button"
            onMouseEnter={() => setFocusMode("prediction")}
            onClick={() =>
              setFocusMode((prev) => (prev === "prediction" ? "harmony" : "prediction"))
            }
            className={`group text-left px-5 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
              focusMode === "prediction"
                ? "bg-sky-500/14 border-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.18)]"
                : "bg-white/[0.035] border-white/[0.08] hover:bg-white/[0.07] hover:border-sky-400/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-sky-300 tracking-wide">
                정답이 있는 문제
              </span>
              <span className="text-[11px] font-bold text-sky-200/80 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/25">
                예측
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed break-keep">
              다양한 정보와 확률로 역선택을 넘어, 나만의 판단 기준을 세우는 훈련
            </p>
          </button>

          {/* 2. 정답이 없는 문제 · 기부 */}
          <button
            type="button"
            onMouseEnter={() => setFocusMode("donation")}
            onClick={() =>
              setFocusMode((prev) => (prev === "donation" ? "harmony" : "donation"))
            }
            className={`group text-left px-5 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
              focusMode === "donation"
                ? "bg-violet-500/14 border-violet-400/50 shadow-[0_0_30px_rgba(168,85,247,0.18)]"
                : "bg-white/[0.035] border-white/[0.08] hover:bg-white/[0.07] hover:border-violet-400/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold text-violet-300 tracking-wide">
                정답이 없는 문제
              </span>
              <span className="text-[11px] font-bold text-violet-200/80 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/25">
                기부
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed break-keep">
              선호 투표로 희소한 자원을 가장 필요한 곳에 투명하게 배분하는 훈련
            </p>
          </button>
        </div>
      </div>
    </section>
  );
}
