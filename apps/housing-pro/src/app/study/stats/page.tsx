"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { addDaysISO } from "@/data/study-textbooks";
import {
  computeStudyStreakDays,
  getSubjectSecondsInPeriod,
  getTopicCompletedRoundCount,
  getTopicSecondsInPeriod,
  getTotalSecondsInPeriod,
} from "@/lib/study-metrics";
import {
  buildDailyStackedSeries,
  buildForgettingCurveAlerts,
  buildHeatmap91Days,
  buildHourlyFocusProfile,
  buildPlanVsActualMetrics,
} from "@/lib/study-stats-analytics";
import {
  fetchStudyAnalyticsAction,
  type StudyAnalyticsResult,
} from "@/app/actions/exam-study.actions";
import { getMutedSubjectColor, getMutedTopicColor } from "@/lib/study-theme";
import {
  TimeHabitStatsView,
  type SubjectDrilldownRow,
} from "@/components/study/stats/TimeHabitStatsView";
import { PassRoiStatsView } from "@/components/study/stats/PassRoiStatsView";
import { RoundMemoryStatsView } from "@/components/study/stats/RoundMemoryStatsView";

type StatsPeriod = "day" | "week" | "month" | "all";
type StatsViewTab = "time" | "roi" | "memory";

const PERIOD_OPTIONS: ReadonlyArray<{ id: StatsPeriod; label: string; days: number }> = [
  { id: "day", label: "일간", days: 1 },
  { id: "week", label: "주간", days: 7 },
  { id: "month", label: "월간", days: 30 },
  { id: "all", label: "전체", days: 3650 },
];

export default function StudyStatsPage() {
  const { effectiveOwnerKey } = useStudyAuth();
  const {
    todayISO,
    subjects,
    todos,
    studySessions,
    roundsByTopic,
    timetablesByDate,
    addTodo,
  } = useStudyCurriculum();
  const { dailyGoalMinutes } = useGlobalUx();

  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [viewTab, setViewTab] = useState<StatsViewTab>("time");
  const [analytics, setAnalytics] = useState<StudyAnalyticsResult | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingAnalytics(true);
    void fetchStudyAnalyticsAction(effectiveOwnerKey)
      .then((res) => {
        if (!cancelled && res.success) setAnalytics(res);
      })
      .catch(() => {
        // 기출 통계 미연결 환경 무시
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalytics(false);
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

  // 순공시간 SSOT 지표들
  const totalSeconds = useMemo(
    () => getTotalSecondsInPeriod(studySessions, allowedDates),
    [studySessions, allowedDates]
  );
  const streakDays = useMemo(
    () => computeStudyStreakDays(studySessions, todayISO),
    [studySessions, todayISO]
  );
  const subjectSecondsMap = useMemo(
    () => getSubjectSecondsInPeriod(studySessions, subjects, allowedDates),
    [studySessions, subjects, allowedDates]
  );
  const topicSecondsMap = useMemo(
    () => getTopicSecondsInPeriod(studySessions, allowedDates),
    [studySessions, allowedDates]
  );

  // 고급 시각화 데이터 계산
  const dailySeries = useMemo(
    () =>
      buildDailyStackedSeries(
        studySessions,
        subjects,
        todayISO,
        period === "month" || period === "all" ? 14 : 7
      ),
    [studySessions, subjects, todayISO, period]
  );
  const hourlyProfile = useMemo(
    () => buildHourlyFocusProfile(studySessions, allowedDates),
    [studySessions, allowedDates]
  );
  const heatmap91 = useMemo(
    () => buildHeatmap91Days(studySessions, todayISO, dailyGoalMinutes),
    [studySessions, todayISO, dailyGoalMinutes]
  );
  const alignment = useMemo(
    () => buildPlanVsActualMetrics(timetablesByDate, todos, allowedDates),
    [timetablesByDate, todos, allowedDates]
  );
  const forgettingAlerts = useMemo(
    () => buildForgettingCurveAlerts(subjects, roundsByTopic, todayISO),
    [subjects, roundsByTopic, todayISO]
  );

  const topicAccuracyByCode = useMemo(() => {
    const map = new Map<string, { accuracyPct: number | null; solved: number }>();
    for (const t of analytics?.topics || []) {
      map.set(t.chapterCode, { accuracyPct: t.accuracyPct, solved: t.solvedCount });
    }
    return map;
  }, [analytics]);

  const subjectBreakdown = useMemo<SubjectDrilldownRow[]>(() => {
    return subjects.map((subj, idx) => {
      const subjSec = subjectSecondsMap.get(subj.id) ?? 0;
      const flatTopics = subj.units.flatMap((u) => u.topics).map((topic, tIdx) => {
        const tSec = topicSecondsMap.get(topic.id) ?? 0;
        const examMeta = topic.chapterCode ? topicAccuracyByCode.get(topic.chapterCode) : undefined;
        return {
          id: topic.id,
          chapterCode: topic.chapterCode,
          title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
          color: getMutedTopicColor(topic.color, tIdx),
          seconds: tSec,
          minutes: Math.floor(tSec / 60),
          rounds: getTopicCompletedRoundCount(roundsByTopic, topic.id),
          accuracyPct: examMeta?.accuracyPct ?? null,
        };
      });

      return {
        id: subj.id,
        title: subj.shortTitle || subj.title,
        fullTitle: subj.title,
        color: getMutedSubjectColor(subj.title, subj.color, idx),
        seconds: subjSec,
        minutes: Math.floor(subjSec / 60),
        topics: flatTopics,
      };
    });
  }, [subjects, subjectSecondsMap, topicSecondsMap, topicAccuracyByCode, roundsByTopic]);

  const { roundAchievePct, weakTopics } = useMemo(() => {
    let targetUnits = 0;
    let achievedUnits = 0;
    const rows: Array<{
      topicId: string;
      chapterCode?: string;
      subjectId: string;
      subjectTitle: string;
      color: string;
      topicTitle: string;
      rounds: number;
      needsReview: boolean;
      accuracyPct: number | null;
    }> = [];

    subjects.forEach((subj) => {
      const targetR = subj.targetRounds ?? 3;
      const flatTopics = subj.units.flatMap((u) => u.topics);
      flatTopics.forEach((topic, tIdx) => {
        const recs = roundsByTopic[topic.id] || [];
        const rounds = getTopicCompletedRoundCount(roundsByTopic, topic.id);
        const needsReview = recs.some((r) => r.status === "review");
        targetUnits += targetR;
        achievedUnits += Math.min(targetR, rounds);
        const examMeta = topic.chapterCode ? topicAccuracyByCode.get(topic.chapterCode) : undefined;
        rows.push({
          topicId: topic.id,
          chapterCode: topic.chapterCode,
          subjectId: subj.id,
          subjectTitle: subj.shortTitle || subj.title,
          color: getMutedTopicColor(topic.color, tIdx),
          topicTitle: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
          rounds,
          needsReview,
          accuracyPct: examMeta?.accuracyPct ?? null,
        });
      });
    });

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
  }, [subjects, roundsByTopic, topicAccuracyByCode]);

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

  return (
    <MobileAppShell>
      {/* 상단 고정: 기간 필터 + 3대 분석 뷰 탭 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] bg-[var(--hp-bg)] space-y-2.5">
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          {(
            [
              { id: "time", label: "시간 · 습관" },
              { id: "roi", label: "합격 · ROI" },
              { id: "memory", label: "회독 · 망각" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewTab(tab.id)}
              className={`py-1.5 rounded-md text-xs font-medium transition ${
                viewTab === tab.id
                  ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                  : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {viewTab === "time" && (
          <div className="grid grid-cols-4 gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`py-1 rounded-md text-[11px] border transition ${
                  period === opt.id
                    ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                    : "border-transparent text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-5">
        {viewTab === "time" && (
          <TimeHabitStatsView
            totalSeconds={totalSeconds}
            achievementPct={achievementPct}
            streakDays={streakDays}
            dailyGoalMinutes={dailyGoalMinutes}
            dailySeries={dailySeries}
            hourlyProfile={hourlyProfile}
            heatmap91={heatmap91}
            alignment={alignment}
            subjectBreakdown={subjectBreakdown}
            imbalanceWarning={imbalanceWarning}
          />
        )}

        {viewTab === "roi" && (
          <PassRoiStatsView analytics={analytics} loading={loadingAnalytics} />
        )}

        {viewTab === "memory" && (
          <RoundMemoryStatsView
            subjects={subjects}
            roundsByTopic={roundsByTopic}
            roundAchievePct={roundAchievePct}
            forgettingAlerts={forgettingAlerts}
            weakTopics={weakTopics}
            onAddTodo={(params) =>
              addTodo({
                title: params.title,
                subjectId: params.subjectId,
                subjectTitle: params.subjectTitle,
                subjectColor: params.subjectColor,
                topicId: params.topicId,
                dueDate: todayISO,
              })
            }
          />
        )}
      </div>
    </MobileAppShell>
  );
}
