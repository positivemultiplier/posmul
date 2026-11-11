"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "../../HomeClientComponents";
import {
  PredictionGameCard,
  resolveGameVisualMeta,
  splitTitlePrefix,
} from "../../../bounded-contexts/prediction/presentation/components/PredictionGameCard";
import { MoneyWaveWaterfallCard } from "../../../bounded-contexts/prediction/presentation/components/MoneyWaveWaterfallCard";
import {
  PredictionType,
  GameStatus,
} from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import {
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Search,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

export interface PredictionGame {
  id: string;
  slug: string;
  href?: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  category?: string;
  subcategory?: string;
  dataSource?: string;
  options: Array<{
    id: string;
    text: string;
    currentOdds: number;
  }>;
  startTime: string | Date;
  endTime: string | Date;
  settlementTime: string | Date;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
  currentParticipants: number;
  status: GameStatus;
  totalStake: number;
  gameImportanceScore: number;
  allocatedPrizePool: number;
  createdAt: string | Date;
}

export interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

export type SortOption = "latest" | "prize_pool" | "closing_soon" | "hot";

export interface ClientPredictionGamesGridProps {
  games: PredictionGame[];
  userId?: string;
  userPredictions?: UserPrediction[];
  basePath?: string;
  /** 대분류 카테고리 칩 표시 여부 */
  showCategoryFilter?: boolean;
  /** 정렬 툴바(최신순, 상금순, 마감임박) 표시 여부 */
  showSortToolbar?: boolean;
  /** 초기 정렬 옵션 (URL 쿼리 연동용) */
  initialSort?: SortOption;
  /** 서브마켓 필터 슬롯 */
  extraFilters?: React.ReactNode;
}

interface CategoryChipItem {
  id: string;
  label: string;
  aliases: string[];
}

const CATEGORY_CHIPS: CategoryChipItem[] = [
  { id: "ALL", label: "전체 (All)", aliases: ["ALL"] },
  { id: "ECONOMY", label: "경제 · 금융", aliases: ["ECONOMY"] },
  { id: "ENTERTAINMENT", label: "K-콘텐츠 · 엔터", aliases: ["ENTERTAINMENT", "CULTURE"] },
  { id: "POLITICS", label: "정치 · 입법", aliases: ["POLITICS"] },
  { id: "SPORTS", label: "스포츠", aliases: ["SPORTS"] },
  { id: "INVEST", label: "소비 · 트렌드", aliases: ["INVEST", "CONSUME"] },
];

const matchesCategory = (gameCategory: string | undefined, chipId: string): boolean => {
  if (chipId === "ALL") return true;
  const cat = gameCategory?.toUpperCase() || "";
  const chip = CATEGORY_CHIPS.find((c) => c.id === chipId);
  if (!chip) return false;
  return chip.aliases.includes(cat);
};

/**
 * 스포트라이트 마켓용 결정론적 시계열 다중 확률 곡선 SVG 좌표 생성 (Binary / WDL / Ranking 공용)
 */
function buildSpotlightChartPaths(
  gameId: string,
  targetPcts: number[],
  colors: string[]
) {
  const seed =
    gameId.charCodeAt(0) * 13 +
    gameId.charCodeAt(Math.floor(gameId.length / 2)) * 7 +
    gameId.charCodeAt(gameId.length - 1) * 19;

  // 차트 높이 180px (0% = 165, 90% = 20)
  const pctToY = (pct: number) => {
    const clamped = Math.max(2, Math.min(88, pct));
    return Math.round(165 - (clamped / 90) * 145);
  };

  const toStepCurve = (pts: number[][]) =>
    pts
      .map(([x, y], idx) => {
        if (idx === 0) return `M ${x} ${y}`;
        const [prevX, prevY] = pts[idx - 1];
        const midX = Math.round((prevX + x) / 2);
        return `C ${midX} ${prevY}, ${midX} ${y}, ${x} ${y}`;
      })
      .join(" ");

  const xCoords = [0, 95, 140, 225, 290, 365, 430, 485];

  const series = targetPcts.map((targetPct, sIdx) => {
    const localSeed = seed + sIdx * 29;
    const baseStart = Math.max(8, Math.min(82, targetPct + ((localSeed % 17) - 8)));
    const p1 = Math.max(6, Math.min(84, baseStart + (((localSeed * 3) % 13) - 6)));
    const p2 = Math.max(6, Math.min(84, Math.round((p1 + targetPct) / 2) + ((localSeed % 11) - 5)));
    const p3 = Math.max(6, Math.min(85, Math.round((p2 + targetPct * 2) / 3) + ((localSeed % 7) - 3)));

    const seriesPcts = [
      baseStart,
      Math.max(5, Math.min(85, baseStart + (sIdx % 2 === 0 ? 3 : -2))),
      p1,
      Math.max(5, Math.min(85, p1 + (sIdx % 2 === 0 ? -3 : 3))),
      p2,
      p3,
      Math.max(5, Math.min(85, Math.round((p3 + targetPct) / 2))),
      targetPct,
    ];

    const pts = xCoords.map((x, idx) => [x, pctToY(seriesPcts[idx])]);
    return {
      path: toStepCurve(pts),
      last: pts[pts.length - 1],
      color: colors[sIdx] || "#38bdf8",
    };
  });

  return series;
}

export function ClientPredictionGamesGrid({
  games,
  userId,
  userPredictions = [],
  basePath = "/prediction",
  showCategoryFilter = false,
  showSortToolbar = true,
  initialSort = "latest",
  extraFilters,
}: ClientPredictionGamesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

  useEffect(() => {
    setSortBy(initialSort);
  }, [initialSort]);

  const getPredictionForGame = (gameId: string): UserPrediction | undefined => {
    return userPredictions.find((p) => p.game_id === gameId && p.is_active);
  };

  // 1단계: 카테고리 + 검색어 필터링
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const catMatch = !showCategoryFilter || matchesCategory(game.category, selectedCategory);
      if (!catMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        game.title.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        (game.subcategory || "").toLowerCase().includes(q)
      );
    });
  }, [games, showCategoryFilter, selectedCategory, searchQuery]);

  // 2단계: 정렬 적용
  const sortedGames = useMemo(() => {
    const list = [...filteredGames];
    if (sortBy === "prize_pool") {
      return list.sort((a, b) => (b.allocatedPrizePool || 0) - (a.allocatedPrizePool || 0));
    }
    if (sortBy === "hot") {
      return list.sort(
        (a, b) =>
          (b.currentParticipants || 0) * 100 +
          (b.allocatedPrizePool || 0) -
          ((a.currentParticipants || 0) * 100 + (a.allocatedPrizePool || 0))
      );
    }
    if (sortBy === "closing_soon") {
      const now = Date.now();
      return list.sort((a, b) => {
        const timeA = new Date(a.endTime).getTime();
        const timeB = new Date(b.endTime).getTime();
        if (timeA < now && timeB >= now) return 1;
        if (timeB < now && timeA >= now) return -1;
        return timeA - timeB;
      });
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredGames, sortBy]);

  // 스포트라이트 후보 (상금풀 + 중요도 기준 상위 5개)
  const spotlightCandidates = useMemo(() => {
    const base = filteredGames.length > 0 ? filteredGames : games;
    return [...base]
      .sort(
        (a, b) =>
          (b.allocatedPrizePool || 0) +
          (b.gameImportanceScore || 1) * 300 -
          ((a.allocatedPrizePool || 0) + (a.gameImportanceScore || 1) * 300)
      )
      .slice(0, 5);
  }, [filteredGames, games]);

  const safeSpotlightIdx =
    spotlightCandidates.length > 0 ? spotlightIndex % spotlightCandidates.length : 0;
  const featuredGame = spotlightCandidates[safeSpotlightIdx];
  const prevSpotlightGame =
    spotlightCandidates.length > 1
      ? spotlightCandidates[
          (safeSpotlightIdx - 1 + spotlightCandidates.length) % spotlightCandidates.length
        ]
      : undefined;
  const nextSpotlightGame =
    spotlightCandidates.length > 1
      ? spotlightCandidates[(safeSpotlightIdx + 1) % spotlightCandidates.length]
      : undefined;

  // 우측 Hot topics TOP 5
  const hotTopics = useMemo(() => {
    const base = games.length > 0 ? games : [];
    return [...base]
      .sort(
        (a, b) =>
          (b.allocatedPrizePool || 0) +
          (b.currentParticipants || 0) * 80 -
          ((a.allocatedPrizePool || 0) + (a.currentParticipants || 0) * 80)
      )
      .slice(0, 5);
  }, [games]);

  const totalActivePrizePool = useMemo(() => {
    return games.reduce((acc, g) => acc + Math.round(g.allocatedPrizePool || 1200), 0);
  }, [games]);

  return (
    <div className="space-y-8">
      {/* =====================================================================
          상단 2-Column 비대칭 대시보드 (Polymarket Featured Spotlight + Hot Topics)
         ===================================================================== */}
      {featuredGame && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 좌측 (8 cols): Featured Market Spotlight */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {(() => {
              const meta = resolveGameVisualMeta(
                featuredGame.title,
                featuredGame.category,
                featuredGame.subcategory
              );
              const { prefixTag, cleanTitle } = splitTitlePrefix(featuredGame.title);
              const isBinary =
                featuredGame.predictionType === PredictionType.BINARY ||
                featuredGame.options.length <= 2;
              const isWdl =
                featuredGame.predictionType === PredictionType.WIN_DRAW_LOSE &&
                featuredGame.options.length === 3;
              const isRanking = !isBinary && !isWdl;

              const rawOptions =
                featuredGame.options.length > 0
                  ? featuredGame.options
                  : [
                      { id: "yes", text: "예 (Yes)", currentOdds: 0.68 },
                      { id: "no", text: "아니오 (No)", currentOdds: 0.32 },
                    ];

              const orderedOptions = isRanking
                ? [...rawOptions].sort((a, b) => (b.currentOdds || 0) - (a.currentOdds || 0))
                : rawOptions;

              const topOptions = orderedOptions.slice(0, isBinary ? 2 : 3);
              const seriesColors = isWdl
                ? ["#10b981", "#f59e0b", "#f43f5e"]
                : isRanking
                ? ["#38bdf8", "#f59e0b", "#a78bfa"]
                : ["#38bdf8", "#f59e0b"];

              const pcts = topOptions.map((opt, idx) => {
                if (typeof opt.currentOdds === "number" && opt.currentOdds > 0) {
                  return Math.round(opt.currentOdds * 100);
                }
                if (isBinary && idx === 1 && topOptions[0]) {
                  return Math.max(1, 100 - Math.round((topOptions[0].currentOdds || 0.6) * 100));
                }
                return Math.round(100 / Math.max(2, orderedOptions.length));
              });

              const chartSeries = buildSpotlightChartPaths(
                featuredGame.id,
                pcts,
                seriesColors
              );
              const targetHref = featuredGame.href ?? `${basePath}/${featuredGame.slug}`;
              const descFirstLine =
                featuredGame.description.split("\n")[0] ||
                "공인 기관 실시간 데이터를 기반으로 자동 정산되는 핵심 예측 의제입니다.";

              return (
                <div className="rounded-2xl bg-[#121621] border border-white/[0.08] p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
                  {/* 스포트라이트 상단 헤더 */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <Link href={targetHref} className="flex items-center gap-3.5 group">
                      <div
                        className={`w-12 h-12 rounded-xl ${meta.bgClass} border ${meta.borderClass} flex flex-col items-center justify-center shrink-0 shadow-md`}
                      >
                        <span className={meta.textClass}>{meta.symbol}</span>
                        {meta.subLabel && (
                          <span className="text-[9px] font-bold text-white/85 leading-none mt-0.5">
                            {meta.subLabel}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-sky-400 font-bold mb-0.5">
                          <span>{prefixTag || meta.categoryLabel}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 font-medium">{meta.sourceLabel}</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors leading-snug">
                          {cleanTitle}
                        </h2>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                      <Link
                        href={targetHref}
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/[0.06] text-slate-400 hover:text-white transition"
                        title="마켓 상세 보기"
                      >
                        <Share2 className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/[0.06] text-slate-400 hover:text-amber-300 transition"
                        title="관심 마켓 북마크"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 스포트라이트 본문: 좌측(선택지 확률 + 학습 맥락) / 우측(실시간 다중 확률 차트) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
                    {/* 좌측 5 cols: 옵션 리스트 & 뉴스/데이터 학습 브리핑 */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {topOptions.map((opt, idx) => {
                          const pct = pcts[idx] ?? 0;
                          const colorDot = seriesColors[idx] || "#38bdf8";
                          return (
                            <Link
                              key={opt.id || idx}
                              href={targetHref}
                              className="flex items-center justify-between py-1.5 border-b border-white/[0.06] hover:border-sky-400/40 transition-colors group/opt"
                            >
                              <span className="flex items-center gap-2 text-sm font-medium text-slate-200 group-hover/opt:text-white truncate pr-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: colorDot }}
                                />
                                {isRanking && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/[0.06] text-sky-300 shrink-0">
                                    {idx + 1}위
                                  </span>
                                )}
                                <span className="truncate">{opt.text}</span>
                              </span>
                              <span className="text-xl font-black text-white tracking-tight shrink-0">
                                {pct}%
                              </span>
                            </Link>
                          );
                        })}
                        {isRanking && orderedOptions.length > 3 && (
                          <div className="text-[11px] font-semibold text-slate-400 text-right pt-0.5">
                            외 +{orderedOptions.length - 3}개 후보 경쟁 중
                          </div>
                        )}
                      </div>

                      {/* PosMul 학습 브리핑 박스 (레퍼런스의 Reuters 뉴스 맥락 영역) */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.05] space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{meta.sourceLabel} · 학습 브리핑</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                          {descFirstLine}
                        </p>
                      </div>

                      {/* 하단 볼륨 & 즉시 참여 CTA */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-xs font-extrabold text-amber-300">
                            💰 {Math.round(featuredGame.allocatedPrizePool || 1800).toLocaleString()} PMC Pool
                          </div>
                          <div className="text-[11px] text-slate-400">
                            참여자 {featuredGame.currentParticipants.toLocaleString()}명 · 최소{" "}
                            {featuredGame.minimumStake.toLocaleString()} PMP
                          </div>
                        </div>
                        <Link
                          href={targetHref}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-lg shadow-sky-500/20"
                        >
                          예측 참여 →
                        </Link>
                      </div>
                    </div>

                    {/* 우측 7 cols: 실시간 컨센서스 확률 추이 라인 차트 */}
                    <div className="md:col-span-7 flex flex-col justify-between bg-[#0d1018] rounded-xl p-4 border border-white/[0.05]">
                      {/* 상단 차트 범례 */}
                      <div className="flex flex-wrap items-center gap-3 text-xs mb-2">
                        {topOptions.map((opt, idx) => (
                          <span
                            key={opt.id || idx}
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              idx === 0 ? "text-slate-100" : "text-slate-400"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: seriesColors[idx] || "#38bdf8" }}
                            />
                            <span className="truncate max-w-[125px]">{opt.text}</span>
                            <strong className={idx === 0 ? "text-white" : "text-slate-200"}>
                              {pcts[idx] ?? 0}%
                            </strong>
                          </span>
                        ))}
                      </div>

                      {/* SVG 시계열 차트 */}
                      <div className="relative h-[175px] w-full">
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 530 180"
                          preserveAspectRatio="none"
                        >
                          {/* 수평 그리드 점선 & 우측 Y축 퍼센트 라벨 */}
                          {[
                            { y: 20, label: "80%" },
                            { y: 56, label: "60%" },
                            { y: 92, label: "40%" },
                            { y: 128, label: "20%" },
                            { y: 165, label: "0%" },
                          ].map((row) => (
                            <g key={row.label}>
                              <line
                                x1="0"
                                y1={row.y}
                                x2="485"
                                y2={row.y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                              <text
                                x="495"
                                y={row.y + 4}
                                fill="#64748b"
                                fontSize="10"
                                fontWeight="600"
                              >
                                {row.label}
                              </text>
                            </g>
                          ))}

                          {/* 하위 옵션 라인부터 순차 렌더링 후 1번 메인 라인 최상단 */}
                          {[...chartSeries]
                            .map((s, originalIdx) => ({ ...s, originalIdx }))
                            .reverse()
                            .map((s) => (
                              <g key={s.originalIdx}>
                                <path
                                  d={s.path}
                                  fill="none"
                                  stroke={s.color}
                                  strokeWidth={s.originalIdx === 0 ? "2.5" : "2"}
                                  strokeOpacity={s.originalIdx === 0 ? "1" : "0.82"}
                                />
                                {s.originalIdx === 0 && (
                                  <circle
                                    cx={s.last[0]}
                                    cy={s.last[1]}
                                    r="9"
                                    fill={s.color}
                                    fillOpacity="0.2"
                                  />
                                )}
                                <circle
                                  cx={s.last[0]}
                                  cy={s.last[1]}
                                  r={s.originalIdx === 0 ? "4.5" : "3.8"}
                                  fill={s.color}
                                />
                              </g>
                            ))}
                        </svg>
                      </div>

                      {/* 하단 X축 & 브랜드 표기 */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/[0.05]">
                        <div className="flex items-center gap-6">
                          <span>3일 전</span>
                          <span>2일 전</span>
                          <span>어제</span>
                          <span className="text-sky-400 font-semibold">오늘 (LIVE)</span>
                        </div>
                        <span className="font-semibold text-slate-400">
                          🌊 PosMul Collective Intelligence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 스포트라이트 하단 캐러셀 컨트롤 바 (< 이전 의제 | 다음 의제 >) */}
            {spotlightCandidates.length > 1 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  {spotlightCandidates.map((cand, idx) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => setSpotlightIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === safeSpotlightIdx
                          ? "w-6 bg-sky-400"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      aria-label={`대표 마켓 ${idx + 1}번 보기`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {prevSpotlightGame && (
                    <button
                      type="button"
                      onClick={() =>
                        setSpotlightIndex(
                          (safeSpotlightIdx - 1 + spotlightCandidates.length) %
                            spotlightCandidates.length
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121621] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-300 transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                      <span className="max-w-[120px] truncate">
                        {splitTitlePrefix(prevSpotlightGame.title).prefixTag ||
                          splitTitlePrefix(prevSpotlightGame.title).cleanTitle}
                      </span>
                    </button>
                  )}
                  {nextSpotlightGame && (
                    <button
                      type="button"
                      onClick={() =>
                        setSpotlightIndex((safeSpotlightIdx + 1) % spotlightCandidates.length)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121621] hover:bg-slate-800 border border-white/[0.08] text-xs font-semibold text-slate-300 transition"
                    >
                      <span className="max-w-[120px] truncate">
                        {splitTitlePrefix(nextSpotlightGame.title).prefixTag ||
                          splitTitlePrefix(nextSpotlightGame.title).cleanTitle}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 우측 (4 cols): 실시간 폭포수 MoneyWave 카드 + Hot Topics TOP 5 */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-3.5">
            {/* 상단: 일정 시간마다 물폭포가 쏟아져 차오르는 실시간 MoneyWave 풀 카드 */}
            <MoneyWaveWaterfallCard totalPrizePool={totalActivePrizePool} />

            {/* 하단 Hot topics TOP 5 랭킹 보드 */}
            <div className="rounded-2xl bg-[#121621] border border-white/[0.08] p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                  <span>Hot topics</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
                  <span>실시간 상금 급상승</span>
                </span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {hotTopics.map((topic, idx) => {
                  const { prefixTag, cleanTitle } = splitTitlePrefix(topic.title);
                  const topicHref = topic.href ?? `${basePath}/${topic.slug}`;
                  return (
                    <Link
                      key={topic.id}
                      href={topicHref}
                      className="flex items-center justify-between py-2 group hover:bg-white/[0.02] px-1 rounded-lg transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-xs font-black text-slate-500 w-3">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">
                          {prefixTag ? `[${prefixTag}] ` : ""}
                          {cleanTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-extrabold text-slate-300">
                          {Math.round(topic.allocatedPrizePool || 1200).toLocaleString()} PMC
                        </span>
                        <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-500/40" />
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          하단 All Markets 헤더 + 검색창 + 카테고리/정렬 필터 툴바
         ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-white tracking-tight">
              All markets
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
              {sortedGames.length}
            </span>
            {extraFilters}
          </div>

          {/* 우측 검색창 + 정렬 툴바 + AI 생성 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="마켓·종목·지표 검색..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#121621] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 w-44 sm:w-52"
              />
            </div>

            {showSortToolbar && (
              <div className="flex items-center bg-[#121621] p-0.5 rounded-xl border border-white/[0.08] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSortBy("latest")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    sortBy === "latest"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  최신순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("hot")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    sortBy === "hot"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>인기순</span>
                  <span className="text-[10px]">🔥</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("prize_pool")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    sortBy === "prize_pool"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>상금순</span>
                  <span className="text-[10px]">💰</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("closing_soon")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    sortBy === "closing_soon"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>마감임박</span>
                  <span className="text-[10px]">⏰</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  const btn = document.getElementById("ai-ingest-btn");
                  if (btn) btn.innerText = "⏳ 생성 중...";
                  const res = await fetch("/api/cron/feed-ingest");
                  const data = await res.json();
                  if (data.success) {
                    window.location.reload();
                  } else {
                    alert("생성 중 오류 발생: " + (data.error || "알 수 없음"));
                  }
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "알 수 없는 오류";
                  alert("요청 실패: " + message);
                } finally {
                  const btn = document.getElementById("ai-ingest-btn");
                  if (btn) btn.innerText = "✨ AI 의제 생성";
                }
              }}
              id="ai-ingest-btn"
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ AI 의제 생성</span>
            </button>
          </div>
        </div>

        {/* 카테고리 칩 바 (All markets 필터 표시 시) */}
        {showCategoryFilter && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_CHIPS.map((chip) => {
              const count =
                chip.id === "ALL"
                  ? games.length
                  : games.filter((g) => matchesCategory(g.category, chip.id)).length;
              const isSelected = selectedCategory === chip.id;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(chip.id);
                    setSpotlightIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "bg-white text-slate-950 shadow-sm"
                      : "bg-[#121621] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-white/[0.07]"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] font-extrabold ${
                      isSelected ? "text-slate-700" : "text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 카드 그리드 (3열 Polymarket 넉넉한 와이드 스타일) */}
        {sortedGames.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-[#121621] rounded-2xl border border-white/[0.06]">
            <p className="text-sm font-semibold">조건에 맞는 예측 마켓이 없습니다.</p>
            <p className="text-xs text-slate-500 mt-1">
              다른 카테고리를 선택하거나 검색어를 초기화해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {sortedGames.map((game, index) => {
              const myPrediction = getPredictionForGame(game.id);

              const safeGame = {
                ...game,
                id: game.id,
                startTime: new Date(game.startTime),
                endTime: new Date(game.endTime),
                settlementTime: new Date(game.settlementTime),
                createdAt: new Date(game.createdAt),
              };

              return (
                <FadeIn key={game.slug || game.id} delay={Math.min(index * 0.03, 0.25)}>
                  <Link
                    href={game.href ?? `${basePath}/${game.slug}`}
                    prefetch={true}
                    className="block"
                  >
                    <PredictionGameCard
                      game={safeGame}
                      userId={userId}
                      myPrediction={myPrediction}
                    />
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
