"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * 1~5회독 단계별 색상 및 학습 메타데이터
 * 안쪽(1회독: 기초 뼈대) -> 바깥쪽(5회독: 전 범위 완주)으로 확장되는 컬러 스펙트럼
 */
export interface MasteryTierMeta {
  tier: 1 | 2 | 3 | 4 | 5;
  shortLabel: string;
  title: string;
  coveragePct: number;
  description: string;
  color: string;
  glowColor: string;
  trackColor: string;
  badgeBgClass: string;
  badgeTextClass: string;
  borderClass: string;
}

export const MASTERY_TIER_META: readonly MasteryTierMeta[] = [
  {
    tier: 1,
    shortLabel: "1R",
    title: "1회독 · 기초 뼈대",
    coveragePct: 20,
    description: "핵심 기출 20% 골격 확립",
    color: "#38BDF8", // 스카이 블루
    glowColor: "rgba(56, 189, 248, 0.55)",
    trackColor: "rgba(56, 189, 248, 0.14)",
    badgeBgClass: "bg-sky-500/15",
    badgeTextClass: "text-sky-300",
    borderClass: "border-sky-500/40",
  },
  {
    tier: 2,
    shortLabel: "2R",
    title: "2회독 · 필수 조문",
    coveragePct: 40,
    description: "빈출 기한·수치 40% 확장",
    color: "#10B981", // 에메랄드
    glowColor: "rgba(16, 185, 129, 0.55)",
    trackColor: "rgba(16, 185, 129, 0.14)",
    badgeBgClass: "bg-emerald-500/15",
    badgeTextClass: "text-emerald-300",
    borderClass: "border-emerald-500/40",
  },
  {
    tier: 3,
    shortLabel: "3R",
    title: "3회독 · 응용 실전",
    coveragePct: 60,
    description: "법령 간 비교·응용 60% 돌파",
    color: "#FF5A36", // 열품타 시그니처 오렌지
    glowColor: "rgba(255, 90, 54, 0.6)",
    trackColor: "rgba(255, 90, 54, 0.15)",
    badgeBgClass: "bg-[#FF5A36]/15",
    badgeTextClass: "text-[#FF7A59]",
    borderClass: "border-[#FF5A36]/45",
  },
  {
    tier: 4,
    shortLabel: "4R",
    title: "4회독 · 판례 함정",
    coveragePct: 80,
    description: "예외 단서·유권해석 80% 방어",
    color: "#A855F7", // 퍼플
    glowColor: "rgba(168, 85, 247, 0.55)",
    trackColor: "rgba(168, 85, 247, 0.14)",
    badgeBgClass: "bg-purple-500/15",
    badgeTextClass: "text-purple-300",
    borderClass: "border-purple-500/40",
  },
  {
    tier: 5,
    shortLabel: "5R",
    title: "5회독 · 100% 완주",
    coveragePct: 100,
    description: "지엽·고난도 선지 완전 정복",
    color: "#FBBF24", // 골드
    glowColor: "rgba(251, 191, 36, 0.65)",
    trackColor: "rgba(251, 191, 36, 0.14)",
    badgeBgClass: "bg-amber-500/15",
    badgeTextClass: "text-amber-300",
    borderClass: "border-amber-500/45",
  },
] as const;

export interface ChapterMasterySummary {
  /** 1~5회독 평균 달성률 (0~100) */
  averagePct: number;
  /** 100% 완료된 회독 수 (0~5) */
  completedRounds: number;
  /** 현재 학습이 진행 중이거나 다음에 집중할 회독 (1~5) */
  activeTier: number;
  /** 소수점 1자리 등가 회독 수 (예: 3.0R) */
  equivalentRounds: number;
}

/**
 * 단원별 1~5회독 달성률 배열에서 요약 지표를 계산합니다.
 */
export function calculateChapterMasterySummary(
  tierProgress: readonly [number, number, number, number, number]
): ChapterMasterySummary {
  const sum = tierProgress.reduce((acc, v) => acc + v, 0);
  const averagePct = Math.round(sum / 5);
  const completedRounds = tierProgress.filter((v) => v >= 100).length;
  const equivalentRounds = Number((sum / 100).toFixed(1));

  // 아직 100%가 아닌 가장 낮은 회독을 현재 집중 회독으로 판별
  const firstIncompleteIdx = tierProgress.findIndex((v) => v < 100);
  const activeTier = firstIncompleteIdx === -1 ? 5 : firstIncompleteIdx + 1;

  return {
    averagePct,
    completedRounds,
    activeTier,
    equivalentRounds,
  };
}

export interface MasteryConcentricRingsProps {
  /** 1~5회독 각각의 달성률 (0~100) */
  tierProgress: readonly [number, number, number, number, number];
  /** 크기 프리셋: mini(과목 리스트), card(단원 카드), hero(전체 조감도) */
  variant?: "mini" | "card" | "hero";
  /** 커스텀 픽셀 크기 (미지정 시 variant 기본값 사용) */
  size?: number;
  /** 현재 포커스/선택된 회독 (1~5) */
  selectedTier?: number | null;
  /** 개별 링 클릭 콜백 (지정 시 링 터치로 회독 선택 가능) */
  onSelectTier?: (tier: number) => void;
  /** 중앙에 표시할 커스텀 콘텐츠 */
  centerContent?: ReactNode;
  /** 중앙에 기본 요약 수치 표시 여부 (mini에서는 기본 false) */
  showCenterText?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

const VARIANT_DEFAULTS = {
  mini: {
    size: 42,
    radii: [18, 35, 52, 69, 86] as const,
    strokeWidth: 12,
  },
  card: {
    size: 92,
    radii: [32, 46, 60, 74, 88] as const,
    strokeWidth: 10,
  },
  hero: {
    size: 192,
    radii: [32, 46, 60, 74, 88] as const,
    strokeWidth: 10,
  },
} as const;

/**
 * 1~5회독 누적 숙련도를 5겹 동심원 아크로 시각화하는 그래픽 컴포넌트
 * 안쪽(1회독)에서 바깥쪽(5회독)으로 지식이 겹겹이 쌓이는 형태를 직관적으로 표현합니다.
 */
export function MasteryConcentricRings({
  tierProgress,
  variant = "card",
  size,
  selectedTier = null,
  onSelectTier,
  centerContent,
  showCenterText,
  className = "",
}: MasteryConcentricRingsProps) {
  const uid = useId();
  const preset = VARIANT_DEFAULTS[variant];
  const pixelSize = size ?? preset.size;
  const shouldShowCenter = showCenterText ?? variant !== "mini";
  const summary = calculateChapterMasterySummary(tierProgress);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      role="img"
      aria-label={`1~5회독 동심원 달성률: ${tierProgress
        .map((pct, i) => `${i + 1}회독 ${pct}%`)
        .join(", ")}`}
    >
      <svg
        viewBox="0 0 200 200"
        width={pixelSize}
        height={pixelSize}
        className="overflow-visible -rotate-90"
      >
        <defs>
          {MASTERY_TIER_META.map((meta) => (
            <filter
              key={meta.tier}
              id={`${uid}-glow-${meta.tier}`}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={meta.color}
                floodOpacity="0.65"
              />
            </filter>
          ))}
        </defs>

        {MASTERY_TIER_META.map((meta, idx) => {
          const r = preset.radii[idx];
          const circumference = 2 * Math.PI * r;
          const rawPct = tierProgress[idx] ?? 0;
          const clampedPct = Math.max(0, Math.min(100, rawPct));
          const dashOffset = circumference * (1 - clampedPct / 100);

          const isSelected = selectedTier === meta.tier;
          const hasSelection = selectedTier !== null && selectedTier !== undefined;
          const isDimmed = hasSelection && !isSelected;
          const isComplete = clampedPct >= 100;

          return (
            <g
              key={meta.tier}
              onClick={onSelectTier ? () => onSelectTier(meta.tier) : undefined}
              className={onSelectTier ? "cursor-pointer" : undefined}
              style={{
                opacity: isDimmed ? 0.35 : 1,
                transition: "opacity 200ms ease",
              }}
            >
              {/* 배경 트랙 링 */}
              <circle
                cx={100}
                cy={100}
                r={r}
                fill="none"
                stroke={meta.trackColor}
                strokeWidth={preset.strokeWidth}
              />

              {/* 선택 포커스 외곽 하이라이트 (선택 시 강조) */}
              {isSelected && (
                <circle
                  cx={100}
                  cy={100}
                  r={r}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity={0.35}
                  strokeWidth={preset.strokeWidth + 3}
                />
              )}

              {/* 실제 회독 진행 아크 */}
              {clampedPct > 0 && (
                <motion.circle
                  cx={100}
                  cy={100}
                  r={r}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={preset.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{
                    duration: 0.75,
                    delay: idx * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  filter={
                    isComplete || isSelected ? `url(#${uid}-glow-${meta.tier})` : undefined
                  }
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 중앙 요약 레이블 */}
      {shouldShowCenter && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {centerContent ??
            (variant === "hero" ? (
              <>
                <span className="text-[10px] font-bold text-slate-400 leading-none">
                  종합 완주
                </span>
                <span className="font-mono text-xl font-black text-white leading-tight mt-0.5">
                  {summary.averagePct}%
                </span>
                <span className="text-[9.5px] font-extrabold text-[#FF7A59] leading-none mt-0.5">
                  {summary.equivalentRounds}R / 5R
                </span>
              </>
            ) : (
              <span className="font-mono text-[10px] font-black text-white leading-none">
                {summary.averagePct}%
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
