"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroLandingSectionProps {
  totalPool: number;
  totalUsers: number;
}

type FocusMode = "harmony" | "prediction" | "donation";

interface ModeMeta {
  id: FocusMode;
  eyebrow: string;
  headlineTop: string;
  headlineAccent: string;
  subline: string;
  accentGradient: string;
}

const MODE_CONTENT: Record<FocusMode, ModeMeta> = {
  harmony: {
    id: "harmony",
    eyebrow: "POSMUL  ·  RATIONAL DECISION STUDIO",
    headlineTop: "혼돈에서 기준을 세우고,",
    headlineAccent: "선호로 가치를 나누다.",
    subline:
      "지하의 사행성을 주류의 지성으로, 불투명한 후원을 투명한 자원배분으로. 정답이 있는 예측과 정답이 없는 기부, 두 축의 합리적 의사결정 훈련장.",
    accentGradient: "from-sky-200 via-white to-violet-200",
  },
  prediction: {
    id: "prediction",
    eyebrow: "AXIS 01  ·  정답이 있는 문제 (PREDICTION)",
    headlineTop: "편향과 역선택을 걷어내고,",
    headlineAccent: "확률로 나만의 기준을 세우다.",
    subline:
      "예측은 왜 사행성에 갇혀 있어야 할까요? 편향되지 않은 정보와 확률적 사고로 흩어진 소음을 하나의 진실로 수렴시키는 훈련입니다.",
    accentGradient: "from-cyan-200 via-sky-300 to-blue-200",
  },
  donation: {
    id: "donation",
    eyebrow: "AXIS 02  ·  정답이 없는 문제 (DONATION)",
    headlineTop: "닫힌 정기후원을 열어젖히고,",
    headlineAccent: "선호로 희소한 자원을 배분하다.",
    subline:
      "기부는 왜 불투명하고 획일적이어야 할까요? 콩도르세·보르다 투표처럼 나의 선호를 투명하게 반영해, 다양한 곳에 가치를 흘려보내는 훈련입니다.",
    accentGradient: "from-violet-200 via-fuchsia-200 to-amber-200",
  },
};

interface FlowParticle {
  t: number; // 0 (좌측 혼돈) -> 0.5 (중앙 수렴 프리즘) -> 1 (우측 다채로운 확산)
  speed: number;
  lane: number; // -1 ~ 1
  branch: number; // 우측 확산 갈래 (0..4)
  size: number;
  phase: number;
  alpha: number;
}

const DISPERSION_PALETTE = [
  { r: 192, g: 132, b: 252 }, // violet-400
  { r: 244, g: 114, b: 182 }, // pink-400
  { r: 251, g: 191, b: 36 }, // amber-400
  { r: 52, g: 211, b: 153 }, // emerald-400
  { r: 129, g: 140, b: 248 }, // indigo-400
];

/**
 * 60fps 실시간 제너레이티브 빛의 흐름 캔버스
 * - 좌측(t: 0 -> 0.5): 흩어진 노이즈/편향 입자들이 유체 궤적을 따라 중앙 진실의 초점으로 우아하게 수렴 (예측 · 정답 O)
 * - 중앙(t: 0.5): 빛이 프리즘 광환을 통과하며 정제·전환
 * - 우측(t: 0.5 -> 1.0): 순수한 빛이 5갈래 프리즘 스펙트럼 리본으로 아름답게 확산·배분 (기부 · 정답 X)
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

    // 145개의 미세 빛 입자 생성
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

    // 은은한 배경 별빛 입자
    const dustCount = 46;
    const dust = Array.from({ length: dustCount }, () => ({
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

    // 부드러운 포커스 가중치 보간
    let leftBoost = 1;
    let rightBoost = 1;
    let time = 0;

    // 특정 t(0..1)와 lane/branch에 따른 예술적 유체 좌표 계산
    const evalFlowPosition = (
      t: number,
      lane: number,
      branch: number,
      phase: number,
      now: number,
      cx: number,
      cy: number
    ) => {
      const x = t * width;
      const spreadY = height * 0.44;

      if (t <= 0.5) {
        // 좌측 -> 중앙: 혼돈에서 하나의 기준점으로 수렴하는 3차 감쇠 곡선
        const u = t / 0.5; // 0 -> 1
        const envelope = Math.pow(1 - u, 1.85);
        const wave =
          Math.sin(u * Math.PI * 2.4 + phase + now * 0.9) *
          height *
          0.065 *
          envelope;
        const y = cy + lane * spreadY * envelope + wave;
        return { x, y, u };
      } else {
        // 중앙 -> 우측: 5갈래 조화로운 프리즘 리본으로 우아하게 확산
        const v = (t - 0.5) / 0.5; // 0 -> 1
        const branchOffset = (branch - 2) / 2; // -1, -0.5, 0, 0.5, 1
        const easeOut = 1 - Math.pow(1 - v, 2.2);
        const harmonic =
          Math.sin(v * Math.PI * 1.8 + branch * 0.9 - now * 0.85) *
          height *
          0.032 *
          v;
        const microJitter = lane * height * 0.045 * easeOut;
        const y =
          cy + branchOffset * (height * 0.36) * easeOut + harmonic + microJitter;
        return { x, y, u: v };
      }
    };

    const render = () => {
      time += prefersReducedMotion ? 0.002 : 0.012;

      // 모드별 광량 부드럽게 전환
      const targetLeft =
        focusRef.current === "prediction"
          ? 1.35
          : focusRef.current === "donation"
            ? 0.42
            : 1.0;
      const targetRight =
        focusRef.current === "donation"
          ? 1.35
          : focusRef.current === "prediction"
            ? 0.42
            : 1.0;
      leftBoost += (targetLeft - leftBoost) * 0.055;
      rightBoost += (targetRight - rightBoost) * 0.055;

      // 캔버스 클리어 (깊은 심연 배경)
      ctx.clearRect(0, 0, width, height);

      // 프리즘 초점(우측으로 약간 치우친 황금비율, 데스크톱에서 텍스트와 절묘하게 조화)
      const isWide = width >= 768;
      const cx = isWide ? width * 0.56 : width * 0.5;
      const cy = isWide ? height * 0.5 : height * 0.48;

      // 마우스 위치에 따른 미세 패럴랙스
      const pxOffset = pointerRef.current.active
        ? (pointerRef.current.x - 0.5) * 26
        : 0;
      const pyOffset = pointerRef.current.active
        ? (pointerRef.current.y - 0.5) * 18
        : 0;

      // 1. 깊은 앰비언트 네뷸라 광원 (좌: 사파이어 블루 / 중: 순백 에메랄드 / 우: 바이올렛-골드)
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
        width * 0.18 + pxOffset * 0.4,
        cy - height * 0.06 + pyOffset * 0.4,
        Math.max(width, height) * 0.46,
        `rgba(56, 189, 248, ${(0.16 * leftBoost).toFixed(3)})`,
        "rgba(56, 189, 248, 0)"
      );
      drawNebula(
        cx + pxOffset * 0.6,
        cy + pyOffset * 0.6,
        Math.max(width, height) * 0.34,
        "rgba(165, 243, 252, 0.13)",
        "rgba(16, 185, 129, 0)"
      );
      drawNebula(
        width * 0.86 + pxOffset * 0.45,
        cy + height * 0.05 + pyOffset * 0.45,
        Math.max(width, height) * 0.48,
        `rgba(168, 85, 247, ${(0.18 * rightBoost).toFixed(3)})`,
        "rgba(245, 158, 11, 0)"
      );

      // 2. 미세 별빛 배경
      for (const d of dust) {
        const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.4 + d.phase));
        ctx.fillStyle = `rgba(226, 232, 240, ${(twinkle * 0.38).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. 좌측 실크 수렴 리본 (혼돈 -> 하나의 기준으로 모아지는 유려한 선)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const leftLanes = [-0.85, -0.48, -0.18, 0.18, 0.48, 0.85];
      leftLanes.forEach((ln, idx) => {
        ctx.beginPath();
        const steps = 42;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps; // 0..1
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

      // 4. 우측 프리즘 확산 실크 리본 (하나의 순수한 빛 -> 5갈래 다채로운 가치 스펙트럼)
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

      // 5. 중앙 프리즘 특이점 광환 (호흡하는 빛의 고리)
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

      // 중앙 유리 프리즘 광원
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

      // 6. 실시간 빛 입자 (수렴 -> 프리즘 통과 -> 스펙트럼 확산)
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            p.lane = (Math.random() * 2 - 1) * (0.45 + Math.random() * 0.55);
          }
        }

        // x를 cx 기준으로 비선형 매핑해 프리즘 중심과 정확히 일치시킴
        const pos = evalFlowPosition(p.t, p.lane, p.branch, p.phase, time, cx, cy);
        const mappedX =
          p.t <= 0.5
            ? (p.t / 0.5) * cx
            : cx + ((p.t - 0.5) / 0.5) * (width - cx);
        const mappedY = pos.y + pyOffset * 0.2 * (p.t <= 0.5 ? 1 - p.t * 2 : (p.t - 0.5) * 2);

        // 가장자리 페이드인/페이드아웃
        const edgeFade = Math.min(p.t * 8, (1 - p.t) * 6, 1);

        let r = 56;
        let g = 189;
        let b = 248;
        let boost = leftBoost;

        if (p.t < 0.22) {
          // 좌측 초반: 편향의 잔상(로즈)에서 시안으로 정제되는 컬러 보간
          const mix = p.t / 0.22;
          r = Math.round(244 * (1 - mix) + 56 * mix);
          g = Math.round(114 * (1 - mix) + 189 * mix);
          b = Math.round(182 * (1 - mix) + 248 * mix);
          boost = leftBoost;
        } else if (p.t <= 0.5) {
          // 중앙으로 수렴하며 순백 시안으로 밝아짐
          const mix = (p.t - 0.22) / 0.28;
          r = Math.round(56 * (1 - mix) + 235 * mix);
          g = Math.round(189 * (1 - mix) + 250 * mix);
          b = Math.round(248 * (1 - mix) + 255 * mix);
          boost = leftBoost;
        } else {
          // 우측 확산: 각 프리즘 갈래의 고유 스펙트럼 색으로 개화
          const col = DISPERSION_PALETTE[p.branch];
          const mix = Math.min(1, (p.t - 0.5) / 0.18);
          r = Math.round(255 * (1 - mix) + col.r * mix);
          g = Math.round(255 * (1 - mix) + col.g * mix);
          b = Math.round(255 * (1 - mix) + col.b * mix);
          boost = rightBoost;
        }

        const finalAlpha = Math.min(1, p.alpha * edgeFade * boost);

        // 은은한 글로우 헤일로
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(finalAlpha * 0.24).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mappedX, mappedY, p.size * 3.1, 0, Math.PI * 2);
        ctx.fill();

        // 코어 별빛 점
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

export function HeroLandingSection({ totalPool, totalUsers }: HeroLandingSectionProps) {
  const [focusMode, setFocusMode] = useState<FocusMode>("harmony");
  const current = MODE_CONTENT[focusMode];

  const scrollToMarkets = () => {
    const el = document.getElementById("featured-prediction-markets");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#060913] border border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.75)] min-h-[500px] sm:min-h-[540px] flex flex-col justify-between">
      {/* 1. 풀-블리드 60fps 제너레이티브 빛의 수렴·확산 모션그래픽 */}
      <GenerativeLightCanvas focusMode={focusMode} />

      {/* 2. 텍스트 가독성을 위한 은은한 좌측 비네팅 그라데이션 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060913]/88 via-[#060913]/45 to-[#060913]/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#060913]/90 to-transparent" />

      {/* 3. 시네마틱 미세 필름 그레인 텍스처 */}
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

      {/* ==================== 상단: 초미니멀 브랜드 시그니처 & 라이브 지표 ==================== */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 pt-6 sm:px-10 sm:pt-8">
        <div className="inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] font-bold tracking-[0.22em] text-slate-300/85 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
          <span>{current.eyebrow}</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-400/90 bg-white/[0.03] backdrop-blur-md border border-white/[0.07] rounded-full px-3.5 py-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>MoneyWave</span>
            <strong className="text-amber-200 font-bold">
              {Math.round(totalPool).toLocaleString()} PMC
            </strong>
          </span>
          <span className="text-white/15">|</span>
          <span>
            <strong className="text-slate-100 font-bold">
              {totalUsers.toLocaleString()}
            </strong>{" "}
            Citizens
          </span>
        </div>
      </div>

      {/* ==================== 중단: 시적 에디토리얼 타이포그래피 & 절제된 CTA ==================== */}
      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 max-w-2xl">
        <div className="min-h-[168px] sm:min-h-[184px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-[-0.03em] leading-[1.18] text-white break-keep">
                <span className="block text-slate-100/95">{current.headlineTop}</span>
                <span
                  className={`block mt-1 bg-gradient-to-r bg-clip-text text-transparent ${current.accentGradient}`}
                >
                  {current.headlineAccent}
                </span>
              </h1>

              <p className="text-xs sm:text-[15px] text-slate-300/85 leading-relaxed font-normal max-w-xl break-keep">
                {current.subline}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 절제된 2개 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-3 pt-5">
          <button
            type="button"
            onClick={scrollToMarkets}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-950 hover:bg-sky-50 font-black text-xs sm:text-sm shadow-[0_0_32px_rgba(255,255,255,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>예측 훈련 시작하기</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <Link
            href="/donation"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/[0.14] text-slate-100 font-bold text-xs sm:text-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>투명 기부 둘러보기</span>
          </Link>
        </div>
      </div>

      {/* ==================== 하단: 빛의 흐름과 연동되는 미니멀 글래스 아카이브 바 ==================== */}
      <div className="relative z-10 px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* 1. 예측 축 (수렴) */}
          <button
            type="button"
            onMouseEnter={() => setFocusMode("prediction")}
            onClick={() =>
              setFocusMode((prev) => (prev === "prediction" ? "harmony" : "prediction"))
            }
            className={`group text-left px-4 py-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
              focusMode === "prediction"
                ? "bg-sky-500/12 border-sky-400/45 shadow-[0_0_28px_rgba(56,189,248,0.16)]"
                : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-sky-300">
                01 · PREDICTION
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                정답이 있는 문제
              </span>
            </div>
            <div className="text-xs sm:text-[13px] font-extrabold text-white">
              역선택을 넘어, 확률로 기준을 세우다
            </div>
          </button>

          {/* 2. 중앙 균형 (전체 흐름) */}
          <button
            type="button"
            onMouseEnter={() => setFocusMode("harmony")}
            onClick={() => setFocusMode("harmony")}
            className={`group text-left px-4 py-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
              focusMode === "harmony"
                ? "bg-white/[0.08] border-white/[0.24] shadow-[0_0_28px_rgba(255,255,255,0.08)]"
                : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-300">
                POSMUL · EQUILIBRIUM
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                수렴 × 확산
              </span>
            </div>
            <div className="text-xs sm:text-[13px] font-extrabold text-white">
              지하의 사행성에서 주류의 지성으로
            </div>
          </button>

          {/* 3. 기부 축 (확산) */}
          <button
            type="button"
            onMouseEnter={() => setFocusMode("donation")}
            onClick={() =>
              setFocusMode((prev) => (prev === "donation" ? "harmony" : "donation"))
            }
            className={`group text-left px-4 py-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
              focusMode === "donation"
                ? "bg-violet-500/12 border-violet-400/45 shadow-[0_0_28px_rgba(168,85,247,0.16)]"
                : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-violet-300">
                02 · DONATION
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                정답이 없는 문제
              </span>
            </div>
            <div className="text-xs sm:text-[13px] font-extrabold text-white">
              선호 투표로 희소한 자원을 투명하게
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
