"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { addDaysISO, getTimetableSlotActual } from "@/data/study-textbooks";
import { formatCompactMinutes, getMutedSubjectColor } from "@/lib/study-theme";

type StatsPeriod = "day" | "week" | "month" | "all";

const PERIOD_OPTIONS: ReadonlyArray<{ id: StatsPeriod; label: string; days: number }> = [
  { id: "day", label: "일간", days: 1 },
  { id: "week", label: "주간", days: 7 },
  { id: "month", label: "월간", days: 30 },
  { id: "all", label: "전체", days: 3650 },
];

export default function StudyStatsPage() {
  const { todayISO, subjects, matrixLogs, timetablesByDate } = useStudyCurriculum();
  const { dailyGoalMinutes } = useGlobalUx();
  const [period, setPeriod] = useState<StatsPeriod>("week");

  const periodDays = PERIOD_OPTIONS.find((p) => p.id === period)?.days ?? 7;

  // 기간 내 날짜 집합 (전체 제외)
  const allowedDates = useMemo(() => {
    if (period === "all") return null;
    const set = new Set<string>();
    for (let i = 0; i < periodDays; i += 1) {
      set.add(addDaysISO(todayISO, -i));
    }
    return set;
  }, [period, periodDays, todayISO]);

  // 일자별 순공시간 맵 (연속 학습일 및 기간 합계 산출용)
  const minutesByDate = useMemo(() => {
    const map = new Map<string, number>();

    for (const [dateISO, slots] of Object.entries(timetablesByDate)) {
      let slotMin = 0;
      for (const s of Object.values(slots)) {
        if (getTimetableSlotActual(s)) slotMin += 10;
      }
      if (slotMin > 0) map.set(dateISO, (map.get(dateISO) ?? 0) + slotMin);
    }

    for (const [key, log] of Object.entries(matrixLogs)) {
      const sep = key.indexOf("::");
      if (sep <= 0) continue;
      const dateISO = key.slice(sep + 2);
      const mins =
        log.actualMinutes !== undefined
          ? log.actualMinutes
          : log.status === "done" || log.status === "partial"
            ? log.minutes ?? 0
            : 0;
      if (mins > 0) {
        map.set(dateISO, Math.max(map.get(dateISO) ?? 0, mins));
      }
    }
    return map;
  }, [timetablesByDate, matrixLogs]);

  // 연속 학습일 계산
  const streakDays = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 365; i += 1) {
      const iso = addDaysISO(todayISO, -i);
      if ((minutesByDate.get(iso) ?? 0) > 0) {
        streak += 1;
      } else if (i === 0) {
        // 오늘 아직 시작 전이면 어제부터 체크
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [minutesByDate, todayISO]);

  // 과목별 기간 순공시간 & 단원별 누적 회독/학습량 집계
  const { subjectBreakdown, totalMinutes, weakTopics } = useMemo(() => {
    const topicToSubject = new Map<
      string,
      { subjectId: string; subjectTitle: string; color: string; topicTitle: string }
    >();
    const subjMinMap = new Map<string, number>();
    const topicRoundsMap = new Map<string, number>();
    const topicMinutesMap = new Map<string, number>();

    subjects.forEach((subj, idx) => {
      const color = getMutedSubjectColor(subj.title, subj.color, idx);
      subjMinMap.set(subj.id, 0);
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          topicToSubject.set(topic.id, {
            subjectId: subj.id,
            subjectTitle: subj.shortTitle || subj.title,
            color,
            topicTitle: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
          });
        }
      }
    });

    // 타임테이블 실제 순공 반영
    for (const [dateISO, slots] of Object.entries(timetablesByDate)) {
      if (allowedDates && !allowedDates.has(dateISO)) continue;
      for (const slot of Object.values(slots)) {
        const actual = getTimetableSlotActual(slot);
        if (!actual?.topicId) continue;
        const meta = topicToSubject.get(actual.topicId);
        if (meta) {
          subjMinMap.set(meta.subjectId, (subjMinMap.get(meta.subjectId) ?? 0) + 10);
          topicMinutesMap.set(actual.topicId, (topicMinutesMap.get(actual.topicId) ?? 0) + 10);
        }
      }
    }

    // 매트릭스 로그 반영
    for (const [key, log] of Object.entries(matrixLogs)) {
      const sep = key.indexOf("::");
      if (sep <= 0) continue;
      const topicId = key.slice(0, sep);
      const dateISO = key.slice(sep + 2);
      if (log.status === "done") {
        topicRoundsMap.set(topicId, (topicRoundsMap.get(topicId) ?? 0) + 1);
      }
      if (allowedDates && !allowedDates.has(dateISO)) continue;
      const meta = topicToSubject.get(topicId);
      if (!meta) continue;
      const mins =
        log.actualMinutes !== undefined
          ? log.actualMinutes
          : log.status === "done" || log.status === "partial"
            ? log.minutes ?? 0
            : 0;
      if (mins > 0 && (topicMinutesMap.get(topicId) ?? 0) === 0) {
        subjMinMap.set(meta.subjectId, (subjMinMap.get(meta.subjectId) ?? 0) + mins);
        topicMinutesMap.set(topicId, (topicMinutesMap.get(topicId) ?? 0) + mins);
      }
    }

    const breakdown = subjects.map((subj, idx) => ({
      id: subj.id,
      title: subj.shortTitle || subj.title,
      color: getMutedSubjectColor(subj.title, subj.color, idx),
      minutes: subjMinMap.get(subj.id) ?? 0,
    }));

    const sumMin = breakdown.reduce((acc, s) => acc + s.minutes, 0);

    // 취약 단원 TOP 5 (회독 수 적은 순 -> 학습시간 적은 순)
    const allTopics = Array.from(topicToSubject.entries()).map(([topicId, meta]) => ({
      topicId,
      subjectTitle: meta.subjectTitle,
      color: meta.color,
      topicTitle: meta.topicTitle,
      rounds: topicRoundsMap.get(topicId) ?? 0,
      minutes: topicMinutesMap.get(topicId) ?? 0,
    }));

    allTopics.sort((a, b) => a.rounds - b.rounds || a.minutes - b.minutes);

    return {
      subjectBreakdown: breakdown,
      totalMinutes: sumMin,
      weakTopics: allTopics.slice(0, 5),
    };
  }, [subjects, timetablesByDate, matrixLogs, allowedDates]);

  // 목표 달성률
  const targetTotalMinutes =
    period === "all"
      ? Math.max(dailyGoalMinutes, minutesByDate.size * dailyGoalMinutes)
      : dailyGoalMinutes * periodDays;
  const achievementPct =
    targetTotalMinutes > 0
      ? Math.min(100, Math.round((totalMinutes / targetTotalMinutes) * 100))
      : 0;

  // 과목 편식 경고 분석
  const imbalanceWarning = useMemo(() => {
    if (totalMinutes < 30 || subjectBreakdown.length < 2) return null;
    const top = [...subjectBreakdown].sort((a, b) => b.minutes - a.minutes)[0];
    const zeroSubjects = subjectBreakdown.filter((s) => s.minutes === 0);
    if (top && top.minutes / totalMinutes >= 0.55) {
      const pct = Math.round((top.minutes / totalMinutes) * 100);
      return `${top.title} 비중이 ${pct}%로 편중되었습니다.${
        zeroSubjects.length > 0 ? ` (${zeroSubjects[0].title} 미학습)` : ""
      }`;
    }
    if (zeroSubjects.length > 0) {
      return `선택 기간에 학습 기록이 없는 과목: ${zeroSubjects.map((s) => s.title).join(", ")}`;
    }
    return null;
  }, [subjectBreakdown, totalMinutes]);

  // 순수 SVG 도넛 차트 계산
  const donutSegments = useMemo(() => {
    const r = 42;
    const circumference = 2 * Math.PI * r;
    if (totalMinutes <= 0) return { r, circumference, arcs: [] };
    let offset = 0;
    const arcs = subjectBreakdown
      .filter((s) => s.minutes > 0)
      .map((s) => {
        const ratio = s.minutes / totalMinutes;
        const length = ratio * circumference;
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
  }, [subjectBreakdown, totalMinutes]);

  return (
    <MobileAppShell>
      {/* 단일 기간 필터 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] bg-[var(--hp-bg)]">
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`py-1.5 rounded-md text-xs font-medium transition ${
                period === opt.id
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                  : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-7">
        {/* ① 핵심 3숫자 */}
        <section className="grid grid-cols-3 gap-2">
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
            <div className="text-[11px] text-[var(--hp-text-3)]">순공 시간</div>
            <div className="mt-1.5 text-lg font-medium hp-tabular">
              {formatCompactMinutes(totalMinutes)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
            <div className="text-[11px] text-[var(--hp-text-3)]">목표 달성</div>
            <div className="mt-1.5 text-lg font-medium hp-tabular">{achievementPct}%</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
            <div className="text-[11px] text-[var(--hp-text-3)]">연속 학습</div>
            <div className="mt-1.5 text-lg font-medium hp-tabular">{streakDays}일</div>
          </div>
        </section>

        {/* ② 순수 SVG 과목 밸런스 + 편식 경고 */}
        <section className="space-y-3">
          <h2 className="text-xs font-medium text-[var(--hp-text-2)]">과목 밸런스</h2>

          <div className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center gap-5">
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

            <ul className="flex-1 space-y-2 min-w-0">
              {subjectBreakdown.map((s) => {
                const pct =
                  totalMinutes > 0 ? Math.round((s.minutes / totalMinutes) * 100) : 0;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate text-[var(--hp-text)]">{s.title}</span>
                    </span>
                    <span className="hp-tabular text-[var(--hp-text-2)] shrink-0">
                      {formatCompactMinutes(s.minutes)} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {imbalanceWarning && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] flex items-start gap-2 text-xs text-[var(--hp-text-2)]">
              <AlertCircle className="w-4 h-4 stroke-[1.5] text-[var(--hp-warn)] shrink-0 mt-0.5" />
              <span>{imbalanceWarning}</span>
            </div>
          )}
        </section>

        {/* ③ 취약 단원 TOP 5 -> 문제/복습 직행 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-[var(--hp-text-2)]">취약 단원 TOP 5</h2>
            <span className="text-[11px] text-[var(--hp-text-3)]">회독·학습 부족 순</span>
          </div>

          <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
            {weakTopics.map((item) => (
              <li
                key={item.topicId}
                className="py-3 flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0">
                  <div className="text-sm text-[var(--hp-text)] truncate">{item.topicTitle}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--hp-text-3)] hp-tabular">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.subjectTitle}</span>
                    <span>·</span>
                    <span>{item.rounds}회독</span>
                  </div>
                </div>

                <Link
                  href="/study/solve"
                  className="px-2.5 py-1 rounded-md border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0 transition"
                >
                  <span>문제</span>
                  <ArrowRight className="w-3 h-3 stroke-[1.5]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MobileAppShell>
  );
}
