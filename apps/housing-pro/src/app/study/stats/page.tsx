"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { addDaysISO } from "@/data/study-textbooks";
import {
  computeStudyStreakDays,
  getSubjectSecondsInPeriod,
  getTopicCompletedRoundCount,
  getTotalSecondsInPeriod,
} from "@/lib/study-metrics";
import {
  fetchStudyAnalyticsAction,
  type StudyAnalyticsResult,
} from "@/app/actions/exam-study.actions";
import { formatCompactMinutes, getMutedSubjectColor } from "@/lib/study-theme";

type StatsPeriod = "day" | "week" | "month" | "all";

const PERIOD_OPTIONS: ReadonlyArray<{ id: StatsPeriod; label: string; days: number }> = [
  { id: "day", label: "일간", days: 1 },
  { id: "week", label: "주간", days: 7 },
  { id: "month", label: "월간", days: 30 },
  { id: "all", label: "전체", days: 3650 },
];

export default function StudyStatsPage() {
  const { effectiveOwnerKey } = useStudyAuth();
  const { todayISO, subjects, studySessions, roundsByTopic } = useStudyCurriculum();
  const { dailyGoalMinutes } = useGlobalUx();

  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [analytics, setAnalytics] = useState<StudyAnalyticsResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchStudyAnalyticsAction(effectiveOwnerKey)
      .then((res) => {
        if (!cancelled && res.success) setAnalytics(res);
      })
      .catch(() => {
        // 기출 통계 미연결 환경 무시
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveOwnerKey]);

  const periodDays = PERIOD_OPTIONS.find((p) => p.id === period)?.days ?? 7;

  const allowedDates = useMemo(() => {
    if (period === "all") return null;
    const set = new Set<string>();
    for (let i = 0; i < periodDays; i += 1) {
      set.add(addDaysISO(todayISO, -i));
    }
    return set;
  }, [period, periodDays, todayISO]);

  // 순공시간 SSOT: studySessions 단일 집계 (회독 체크/10분 블록 뻥튀기 0%)
  const totalSeconds = useMemo(
    () => getTotalSecondsInPeriod(studySessions, allowedDates),
    [studySessions, allowedDates]
  );
  const totalMinutes = Math.floor(totalSeconds / 60);

  const streakDays = useMemo(
    () => computeStudyStreakDays(studySessions, todayISO),
    [studySessions, todayISO]
  );

  const subjectSecondsMap = useMemo(
    () => getSubjectSecondsInPeriod(studySessions, subjects, allowedDates),
    [studySessions, subjects, allowedDates]
  );

  const subjectBreakdown = useMemo(() => {
    return subjects.map((subj, idx) => ({
      id: subj.id,
      title: subj.shortTitle || subj.title,
      color: getMutedSubjectColor(subj.title, subj.color, idx),
      seconds: subjectSecondsMap.get(subj.id) ?? 0,
      minutes: Math.floor((subjectSecondsMap.get(subj.id) ?? 0) / 60),
    }));
  }, [subjects, subjectSecondsMap]);

  // 전체 회독 달성률 & 취약 단원 TOP 5 (재복습 필요 + 회독 부족 + 기출 정답률 반영)
  const { roundAchievePct, weakTopics } = useMemo(() => {
    const topicAccuracyByCode = new Map<string, { accuracyPct: number | null; solved: number }>();
    for (const t of analytics?.topics || []) {
      topicAccuracyByCode.set(t.chapterCode, {
        accuracyPct: t.accuracyPct,
        solved: t.solvedCount,
      });
    }

    let targetUnits = 0;
    let achievedUnits = 0;
    const rows: Array<{
      topicId: string;
      chapterCode?: string;
      subjectTitle: string;
      color: string;
      topicTitle: string;
      rounds: number;
      needsReview: boolean;
      accuracyPct: number | null;
      solvedCount: number;
    }> = [];

    subjects.forEach((subj, idx) => {
      const color = getMutedSubjectColor(subj.title, subj.color, idx);
      const targetR = subj.targetRounds ?? 3;
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          const recs = roundsByTopic[topic.id] || [];
          const rounds = getTopicCompletedRoundCount(roundsByTopic, topic.id);
          const needsReview = recs.some((r) => r.status === "review");
          targetUnits += targetR;
          achievedUnits += Math.min(targetR, rounds);

          const examMeta = topic.chapterCode
            ? topicAccuracyByCode.get(topic.chapterCode)
            : undefined;

          rows.push({
            topicId: topic.id,
            chapterCode: topic.chapterCode,
            subjectTitle: subj.shortTitle || subj.title,
            color,
            topicTitle: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
            rounds,
            needsReview,
            accuracyPct: examMeta?.accuracyPct ?? null,
            solvedCount: examMeta?.solved ?? 0,
          });
        }
      }
    });

    // 우선순위: 재복습 표시(review) > 기출 정답률 낮은 순 > 회독 수 적은 순
    rows.sort((a, b) => {
      if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
      const aAcc = a.accuracyPct ?? 101;
      const bAcc = b.accuracyPct ?? 101;
      if (aAcc !== bAcc) return aAcc - bAcc;
      return a.rounds - b.rounds;
    });

    return {
      roundAchievePct: targetUnits > 0 ? Math.round((achievedUnits / targetUnits) * 100) : 0,
      weakTopics: rows.slice(0, 5),
    };
  }, [subjects, roundsByTopic, analytics]);

  // 목표 달성률
  const activeDatesCount = useMemo(() => {
    const set = new Set(studySessions.map((s) => s.dateISO));
    return Math.max(1, set.size);
  }, [studySessions]);

  const targetTotalSeconds =
    (period === "all" ? activeDatesCount * dailyGoalMinutes : dailyGoalMinutes * periodDays) * 60;
  const achievementPct =
    targetTotalSeconds > 0
      ? Math.min(100, Math.round((totalSeconds / targetTotalSeconds) * 100))
      : 0;

  // 과목 편식 경고
  const imbalanceWarning = useMemo(() => {
    if (totalSeconds < 1800 || subjectBreakdown.length < 2) return null;
    const top = [...subjectBreakdown].sort((a, b) => b.seconds - a.seconds)[0];
    const zeroSubjects = subjectBreakdown.filter((s) => s.seconds === 0);
    if (top && top.seconds / totalSeconds >= 0.55) {
      const pct = Math.round((top.seconds / totalSeconds) * 100);
      return `${top.title} 비중이 ${pct}%로 편중되었습니다.${
        zeroSubjects.length > 0 ? ` (${zeroSubjects[0].title} 미학습)` : ""
      }`;
    }
    if (zeroSubjects.length > 0) {
      return `선택 기간 미학습 과목: ${zeroSubjects.map((s) => s.title).join(", ")}`;
    }
    return null;
  }, [subjectBreakdown, totalSeconds]);

  // 순수 SVG 도넛 차트
  const donutSegments = useMemo(() => {
    const r = 42;
    const circumference = 2 * Math.PI * r;
    if (totalSeconds <= 0) return { r, circumference, arcs: [] };
    let offset = 0;
    const arcs = subjectBreakdown
      .filter((s) => s.seconds > 0)
      .map((s) => {
        const ratio = s.seconds / totalSeconds;
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
  }, [subjectBreakdown, totalSeconds]);

  const overallSolved = analytics?.overall.totalSolved ?? 0;
  const overallTotalQ = analytics?.overall.totalQuestions ?? 0;
  const overallAccuracy = analytics?.overall.accuracyPct ?? null;

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
        {/* ① 핵심 3숫자 (실제 타이머 순공 SSOT) */}
        <section className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
              <div className="text-[11px] text-[var(--hp-text-3)]">순공 시간</div>
              <div className="mt-1.5 text-lg font-medium hp-tabular">
                {totalSeconds > 0 && totalMinutes === 0
                  ? `${totalSeconds}s`
                  : formatCompactMinutes(totalMinutes)}
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
          </div>

          {/* 기출 풀이 · 정답률 & 회독 달성률 요약 바 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--hp-text-3)]">기출 정답률</span>
              <span className="hp-tabular font-medium">
                {overallAccuracy !== null ? `${overallAccuracy}%` : "-"}
                <span className="text-[10.5px] text-[var(--hp-text-3)] ml-1">
                  ({overallSolved}/{overallTotalQ || 1400})
                </span>
              </span>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--hp-text-3)]">전체 회독률</span>
              <span className="hp-tabular font-medium">{roundAchievePct}%</span>
            </div>
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
                  totalSeconds > 0 ? Math.round((s.seconds / totalSeconds) * 100) : 0;
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
                      {s.seconds > 0 && s.minutes === 0
                        ? `${s.seconds}s`
                        : formatCompactMinutes(s.minutes)}{" "}
                      · {pct}%
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

        {/* ③ 취약 단원 TOP 5 -> 해당 단원 기출 세트 직행 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-[var(--hp-text-2)]">취약 단원 TOP 5</h2>
            <span className="text-[11px] text-[var(--hp-text-3)]">재복습·정답률·회독 기준</span>
          </div>

          <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
            {weakTopics.map((item) => {
              const targetHref = item.chapterCode
                ? `/study/solve?chapter=${encodeURIComponent(item.chapterCode)}`
                : "/study/solve";
              return (
                <li
                  key={item.topicId}
                  className="py-3 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--hp-text)] truncate">{item.topicTitle}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--hp-text-3)] hp-tabular flex-wrap">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.subjectTitle}</span>
                      <span>·</span>
                      <span>{item.rounds}회독</span>
                      {item.needsReview && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--hp-warn)]">재복습 필요</span>
                        </>
                      )}
                      {item.accuracyPct !== null && (
                        <>
                          <span>·</span>
                          <span>정답률 {item.accuracyPct}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={targetHref}
                    className="px-2.5 py-1 rounded-md border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 shrink-0 transition"
                  >
                    <span>문제</span>
                    <ArrowRight className="w-3 h-3 stroke-[1.5]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </MobileAppShell>
  );
}
