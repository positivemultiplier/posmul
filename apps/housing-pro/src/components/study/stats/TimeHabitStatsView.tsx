"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import type {
  DailyStackedBarPoint,
  HeatmapCell,
  HourlyFocusProfile,
  PlanActualAlignment,
} from "@/lib/study-stats-analytics";
import { formatCompactMinutes } from "@/lib/study-theme";

export interface SubjectDrilldownRow {
  id: string;
  title: string;
  fullTitle: string;
  color: string;
  seconds: number;
  minutes: number;
  topics: Array<{
    id: string;
    chapterCode?: string;
    title: string;
    color: string;
    seconds: number;
    minutes: number;
    rounds: number;
    accuracyPct: number | null;
  }>;
}

interface TimeHabitStatsViewProps {
  totalSeconds: number;
  achievementPct: number;
  streakDays: number;
  dailyGoalMinutes: number;
  dailySeries: DailyStackedBarPoint[];
  hourlyProfile: HourlyFocusProfile;
  heatmap91: { cells: HeatmapCell[]; longestStreak: number; activeDays91: number };
  alignment: PlanActualAlignment;
  subjectBreakdown: SubjectDrilldownRow[];
  imbalanceWarning: string | null;
}

function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  if (sec > 0 && m === 0) return `${sec}s`;
  return formatCompactMinutes(m);
}

const HEATMAP_OPACITIES = [0.06, 0.25, 0.48, 0.74, 1] as const;

export function TimeHabitStatsView({
  totalSeconds,
  achievementPct,
  streakDays,
  dailyGoalMinutes,
  dailySeries,
  hourlyProfile,
  heatmap91,
  alignment,
  subjectBreakdown,
  imbalanceWarning,
}: TimeHabitStatsViewProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  const goalSec = Math.max(1800, dailyGoalMinutes * 60);
  const maxBarSec = useMemo(() => {
    const maxData = dailySeries.reduce((m, d) => Math.max(m, d.totalSeconds), 0);
    return Math.max(goalSec, maxData, 3600);
  }, [dailySeries, goalSec]);

  const avgDailySec = useMemo(() => {
    if (dailySeries.length === 0) return 0;
    const sum = dailySeries.reduce((acc, d) => acc + d.totalSeconds, 0);
    return Math.round(sum / dailySeries.length);
  }, [dailySeries]);

  const donutSegments = useMemo(() => {
    const r = 42;
    const circumference = 2 * Math.PI * r;
    if (totalSeconds <= 0) return { r, circumference, arcs: [] };
    let offset = 0;
    const arcs = subjectBreakdown
      .filter((s) => s.seconds > 0)
      .map((s) => {
        const length = (s.seconds / totalSeconds) * circumference;
        const arc = {
          id: s.id,
          color: s.color,
          dasharray: `${length} ${circumference - length}`,
          dashoffset: -offset,
        };
        offset += length;
        return arc;
      });
    return { r, circumference, arcs };
  }, [subjectBreakdown, totalSeconds]);

  const maxHourSec = useMemo(
    () => Math.max(60, ...hourlyProfile.hours),
    [hourlyProfile.hours]
  );

  const selectedDay =
    selectedDayIdx !== null && dailySeries[selectedDayIdx]
      ? dailySeries[selectedDayIdx]
      : null;

  // 2중 원형 링 (계획 실행률 + 할 일 완료율)
  const outerR = 36;
  const innerR = 25;
  const outerC = 2 * Math.PI * outerR;
  const innerC = 2 * Math.PI * innerR;

  return (
    <div className="space-y-6">
      {/* ① 핵심 4지표 */}
      <section className="grid grid-cols-2 gap-2">
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          <div className="text-[11px] text-[var(--hp-text-3)]">순공 시간</div>
          <div className="mt-1 text-xl font-medium hp-tabular">{fmtSec(totalSeconds)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          <div className="text-[11px] text-[var(--hp-text-3)]">목표 달성률</div>
          <div className="mt-1 text-xl font-medium hp-tabular">{achievementPct}%</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          <div className="text-[11px] text-[var(--hp-text-3)]">연속 학습</div>
          <div className="mt-1 text-xl font-medium hp-tabular">
            {streakDays}일
            <span className="text-[11px] text-[var(--hp-text-3)] font-normal ml-1.5">
              최장 {heatmap91.longestStreak}일
            </span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          <div className="text-[11px] text-[var(--hp-text-3)]">1회 평균 몰입</div>
          <div className="mt-1 text-xl font-medium hp-tabular">
            {hourlyProfile.avgSessionMinutes}m
            <span className="text-[11px] text-[var(--hp-text-3)] font-normal ml-1.5">
              최장 {hourlyProfile.maxSessionMinutes}m
            </span>
          </div>
        </div>
      </section>

      {/* ② 일별 과목 스택 바 + 목표선 SVG */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">
            일별 순공 추이 ({dailySeries.length}일)
          </span>
          <span className="text-[11px] hp-tabular text-[var(--hp-text-3)]">
            일평균 {fmtSec(avgDailySec)} · 목표 {formatCompactMinutes(dailyGoalMinutes)}
          </span>
        </div>

        <svg viewBox="0 0 320 130" className="w-full h-36 overflow-visible">
          {/* 일일 목표선 (점선) */}
          {(() => {
            const goalY = 108 - (goalSec / maxBarSec) * 94;
            const avgY = 108 - (avgDailySec / maxBarSec) * 94;
            return (
              <>
                <line
                  x1="0"
                  x2="320"
                  y1={goalY}
                  y2={goalY}
                  stroke="var(--hp-text-3)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
                {avgDailySec > 0 && (
                  <line
                    x1="0"
                    x2="320"
                    y1={avgY}
                    y2={avgY}
                    stroke="#4F7CAC"
                    strokeWidth="0.9"
                    opacity="0.85"
                  />
                )}
              </>
            );
          })()}

          {dailySeries.map((pt, i) => {
            const slotW = 320 / Math.max(1, dailySeries.length);
            const barW = Math.min(20, Math.max(5, slotW * 0.56));
            const x = i * slotW + (slotW - barW) / 2;
            const isSelected = selectedDayIdx === i;
            let cursorY = 108;

            return (
              <g
                key={pt.dateISO}
                onClick={() => setSelectedDayIdx(isSelected ? null : i)}
                className="cursor-pointer"
              >
                {/* 클릭 영역 */}
                <rect x={i * slotW} y="8" width={slotW} height="104" fill="transparent" />
                {pt.totalSeconds === 0 ? (
                  <rect
                    x={x}
                    y="105"
                    width={barW}
                    height="3"
                    rx="1.5"
                    fill="var(--hp-surface-2)"
                  />
                ) : (
                  pt.segments.map((seg, si) => {
                    const segH = Math.max(2, (seg.seconds / maxBarSec) * 94);
                    cursorY -= segH;
                    return (
                      <rect
                        key={`${seg.subjectId}-${si}`}
                        x={x}
                        y={cursorY}
                        width={barW}
                        height={segH}
                        rx="1.5"
                        fill={seg.color}
                        opacity={selectedDayIdx === null || isSelected ? 0.95 : 0.4}
                      />
                    );
                  })
                )}

                {(dailySeries.length <= 7 || i % 3 === 0 || i === dailySeries.length - 1) && (
                  <text
                    x={i * slotW + slotW / 2}
                    y="124"
                    textAnchor="middle"
                    fontSize="8.5"
                    fill={isSelected ? "var(--hp-text)" : "var(--hp-text-3)"}
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {selectedDay && (
          <div className="pt-2 border-t border-[var(--hp-border)] flex items-center justify-between gap-2 text-[11px] hp-tabular">
            <span className="text-[var(--hp-text)] font-medium">
              {selectedDay.dateISO} · 총 {fmtSec(selectedDay.totalSeconds)}
            </span>
            <span className="text-[var(--hp-text-2)] truncate">
              {selectedDay.segments.length > 0
                ? selectedDay.segments.map((s) => `${s.title} ${fmtSec(s.seconds)}`).join(" · ")
                : "기록 없음"}
            </span>
          </div>
        )}
      </section>

      {/* ③ 과목 밸런스 도넛 + 탭 시 단원 드릴다운 */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">과목 밸런스</span>
          <span className="text-[11px] text-[var(--hp-text-3)]">과목 탭 시 단원별 상세</span>
        </div>

        <div className="flex items-center gap-5">
          <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={donutSegments.r}
              fill="none"
              stroke="var(--hp-surface-2)"
              strokeWidth="9"
            />
            {donutSegments.arcs.map((arc) => (
              <circle
                key={arc.id}
                cx="50"
                cy="50"
                r={donutSegments.r}
                fill="none"
                stroke={arc.color}
                strokeWidth="9"
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
              />
            ))}
          </svg>

          <ul className="flex-1 space-y-1.5 min-w-0">
            {subjectBreakdown.map((s) => {
              const pct = totalSeconds > 0 ? Math.round((s.seconds / totalSeconds) * 100) : 0;
              const isOpen = expandedSubjectId === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedSubjectId(isOpen ? null : s.id)}
                    className="w-full py-1 flex items-center justify-between gap-2 text-xs hover:opacity-80 text-left"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                      )}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate text-[var(--hp-text)]">{s.title}</span>
                    </span>
                    <span className="hp-tabular text-[var(--hp-text-2)] shrink-0">
                      {fmtSec(s.seconds)} · {pct}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {expandedSubjectId &&
          (() => {
            const target = subjectBreakdown.find((s) => s.id === expandedSubjectId);
            if (!target) return null;
            return (
              <div className="pt-3 border-t border-[var(--hp-border)] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-2)]">
                  <span className="font-medium">{target.fullTitle} 단원별 상세</span>
                  <span className="hp-tabular text-[var(--hp-text-3)]">
                    {target.topics.length}단원
                  </span>
                </div>
                <ul className="divide-y divide-[var(--hp-border)]">
                  {target.topics.map((t) => {
                    const share =
                      target.seconds > 0 ? Math.round((t.seconds / target.seconds) * 100) : 0;
                    return (
                      <li key={t.id} className="py-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            <span className="truncate text-[var(--hp-text)]">{t.title}</span>
                          </span>
                          <span className="hp-tabular text-[11px] text-[var(--hp-text-2)] shrink-0">
                            {fmtSec(t.seconds)} · {t.rounds}R
                            {t.accuracyPct !== null ? ` · ${t.accuracyPct}%` : ""}
                          </span>
                        </div>
                        {share > 0 && (
                          <div className="h-[2px] w-full rounded-full bg-[var(--hp-bg)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${share}%`, backgroundColor: t.color }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}

        {imbalanceWarning && (
          <div className="pt-2 border-t border-[var(--hp-border)] flex items-start gap-2 text-xs text-[var(--hp-text-2)]">
            <AlertCircle className="w-4 h-4 stroke-[1.5] text-[var(--hp-warn)] shrink-0 mt-0.5" />
            <span>{imbalanceWarning}</span>
          </div>
        )}
      </section>

      {/* ④ 24시간 골든타임 집중 분포 SVG */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">24시간 골든타임 집중 분포</span>
          <span className="text-[11px] hp-tabular text-[var(--hp-text-2)]">
            {hourlyProfile.chronotypeLabel}
            {hourlyProfile.peakHour !== null
              ? ` · 피크 ${String(hourlyProfile.peakHour).padStart(2, "0")}시`
              : ""}
          </span>
        </div>

        <svg viewBox="0 0 288 76" className="w-full h-20">
          {hourlyProfile.hours.map((sec, h) => {
            const barH = sec > 0 ? Math.max(4, (sec / maxHourSec) * 54) : 2;
            const isPeak = hourlyProfile.peakHour === h && sec > 0;
            return (
              <g key={h}>
                <rect
                  x={h * 12 + 2}
                  y={58 - barH}
                  width="8"
                  height={barH}
                  rx="2"
                  fill={isPeak ? "var(--hp-accent)" : sec > 0 ? "#4F7CAC" : "var(--hp-surface-2)"}
                />
                {h % 6 === 0 && (
                  <text
                    x={h * 12 + 6}
                    y="72"
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--hp-text-3)"
                  >
                    {String(h).padStart(2, "0")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </section>

      {/* ⑤ 계획 vs 실행 2중 원형 링 SVG */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
          <circle cx="50" cy="50" r={outerR} fill="none" stroke="var(--hp-surface-2)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={outerR}
            fill="none"
            stroke="#5B8C73"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(alignment.todoCompletionPct / 100) * outerC} ${outerC}`}
          />
          <circle cx="50" cy="50" r={innerR} fill="none" stroke="var(--hp-surface-2)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={innerR}
            fill="none"
            stroke="#4F7CAC"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(alignment.timelineMatchPct / 100) * innerC} ${innerC}`}
          />
        </svg>

        <div className="flex-1 space-y-2 text-xs">
          <div className="font-medium text-[var(--hp-text)]">계획 대비 실행 일치율</div>
          <div className="flex items-center justify-between text-[11px] hp-tabular">
            <span className="flex items-center gap-1.5 text-[var(--hp-text-2)]">
              <span className="w-2 h-2 rounded-full bg-[#5B8C73]" />
              <span>할 일 완료율</span>
            </span>
            <span className="text-[var(--hp-text)]">
              {alignment.todoCompletionPct}% ({alignment.completedTodos}/{alignment.totalTodos})
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] hp-tabular">
            <span className="flex items-center gap-1.5 text-[var(--hp-text-2)]">
              <span className="w-2 h-2 rounded-full bg-[#4F7CAC]" />
              <span>타임라인 실행률</span>
            </span>
            <span className="text-[var(--hp-text)]">
              {alignment.timelineMatchPct}% ({alignment.matchedActualBlocks}/{alignment.plannedBlocks}칸)
            </span>
          </div>
        </div>
      </section>

      {/* ⑥ 91일(13주) 학습 잔디 히트맵 SVG */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">최근 91일 학습 잔디</span>
          <span className="text-[11px] hp-tabular text-[var(--hp-text-3)]">
            출석 {heatmap91.activeDays91}/91일 · 최장 {heatmap91.longestStreak}일 연속
          </span>
        </div>

        <svg viewBox="0 0 260 112" className="w-full h-28">
          {heatmap91.cells.map((cell, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            return (
              <rect
                key={cell.dateISO}
                x={col * 20 + 2}
                y={row * 16 + 2}
                width="14"
                height="12"
                rx="2.5"
                fill={cell.level === 0 ? "var(--hp-surface-2)" : "#5B8C73"}
                opacity={cell.level === 0 ? 1 : HEATMAP_OPACITIES[cell.level]}
              >
                <title>
                  {cell.dateISO}: {fmtSec(cell.seconds)}
                </title>
              </rect>
            );
          })}
        </svg>
      </section>
    </div>
  );
}
