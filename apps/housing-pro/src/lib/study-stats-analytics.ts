import {
  addDaysISO,
  diffDaysISO,
  getTimetableSlotActual,
  getTimetableSlotPlan,
  type StudySessionLog,
  type StudySubjectNode,
  type StudyTodoItem,
  type TimetableSlotLog,
  type TopicRoundRecord,
} from "@/data/study-textbooks";
import { resolveSessionSubjectId } from "@/lib/study-metrics";
import { getMutedSubjectColor, getMutedTopicColor } from "@/lib/study-theme";

export interface DailyStackedBarPoint {
  dateISO: string;
  label: string;
  totalSeconds: number;
  segments: Array<{ subjectId: string; title: string; color: string; seconds: number }>;
}

/** 최근 N일(7일 또는 14일/30일) 일별 과목 스택 막대 데이터 생성 */
export function buildDailyStackedSeries(
  sessions: StudySessionLog[],
  subjects: StudySubjectNode[],
  todayISO: string,
  days: number
): DailyStackedBarPoint[] {
  const safeDays = Math.max(1, Math.min(30, days));
  const subjMeta = new Map(
    subjects.map((s, idx) => [
      s.id,
      {
        title: s.shortTitle || s.title,
        color: getMutedSubjectColor(s.title, s.color, idx),
      },
    ])
  );

  const byDateAndSubj = new Map<string, Map<string, number>>();
  for (const sess of sessions) {
    if (sess.seconds <= 0) continue;
    const subjId = resolveSessionSubjectId(sess, subjects) || "other";
    let inner = byDateAndSubj.get(sess.dateISO);
    if (!inner) {
      inner = new Map<string, number>();
      byDateAndSubj.set(sess.dateISO, inner);
    }
    inner.set(subjId, (inner.get(subjId) ?? 0) + sess.seconds);
  }

  const points: DailyStackedBarPoint[] = [];
  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const iso = addDaysISO(todayISO, -i);
    const parts = iso.split("-");
    const label = safeDays <= 7 ? `${Number(parts[1])}/${Number(parts[2])}` : `${Number(parts[2])}`;
    const inner = byDateAndSubj.get(iso);
    const segments: DailyStackedBarPoint["segments"] = [];
    let totalSeconds = 0;

    if (inner) {
      for (const [subjId, sec] of inner.entries()) {
        const meta = subjMeta.get(subjId) || { title: "기타", color: "#6E6E77" };
        segments.push({ subjectId: subjId, title: meta.title, color: meta.color, seconds: sec });
        totalSeconds += sec;
      }
    }
    points.push({ dateISO: iso, label, totalSeconds, segments });
  }
  return points;
}

export interface HourlyFocusProfile {
  hours: number[]; // 길이 24, 각 시간대 누적 초
  peakHour: number | null;
  chronotypeLabel: string;
  avgSessionMinutes: number;
  maxSessionMinutes: number;
  sessionCount: number;
}

/** 24시간 골든타임 집중 분포 및 세션 몰입 지표 */
export function buildHourlyFocusProfile(
  sessions: StudySessionLog[],
  allowedDates: Set<string> | null
): HourlyFocusProfile {
  const hours = Array.from({ length: 24 }, () => 0);
  let totalSec = 0;
  let maxSec = 0;
  let count = 0;

  for (const s of sessions) {
    if (s.seconds <= 0) continue;
    if (allowedDates && !allowedDates.has(s.dateISO)) continue;
    const dt = new Date(s.startedAtMs || Date.now());
    const h = dt.getHours();
    if (h >= 0 && h < 24) {
      hours[h] += s.seconds;
    }
    totalSec += s.seconds;
    if (s.seconds > maxSec) maxSec = s.seconds;
    count += 1;
  }

  let peakHour: number | null = null;
  let peakVal = 0;
  hours.forEach((v, h) => {
    if (v > peakVal) {
      peakVal = v;
      peakHour = h;
    }
  });

  let chronotypeLabel = "데이터 수집 중";
  if (peakHour !== null) {
    if (peakHour >= 5 && peakHour < 12) chronotypeLabel = "오전 집중형";
    else if (peakHour >= 12 && peakHour < 18) chronotypeLabel = "오후 집중형";
    else if (peakHour >= 18 && peakHour < 23) chronotypeLabel = "저녁 집중형";
    else chronotypeLabel = "심야 몰입형";
  }

  return {
    hours,
    peakHour,
    chronotypeLabel,
    avgSessionMinutes: count > 0 ? Math.round(totalSec / count / 60) : 0,
    maxSessionMinutes: Math.round(maxSec / 60),
    sessionCount: count,
  };
}

export interface HeatmapCell {
  dateISO: string;
  seconds: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/** 최근 91일(13주) 학습 잔디 히트맵 + 최장 스트릭 */
export function buildHeatmap91Days(
  sessions: StudySessionLog[],
  todayISO: string,
  dailyGoalMinutes: number
): { cells: HeatmapCell[]; longestStreak: number; activeDays91: number } {
  const secByDate = new Map<string, number>();
  for (const s of sessions) {
    if (s.seconds > 0) {
      secByDate.set(s.dateISO, (secByDate.get(s.dateISO) ?? 0) + s.seconds);
    }
  }

  const goalSec = Math.max(1800, dailyGoalMinutes * 60);
  const cells: HeatmapCell[] = [];
  let longestStreak = 0;
  let running = 0;
  let activeDays91 = 0;

  for (let i = 90; i >= 0; i -= 1) {
    const iso = addDaysISO(todayISO, -i);
    const sec = secByDate.get(iso) ?? 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (sec > 0) {
      activeDays91 += 1;
      running += 1;
      if (running > longestStreak) longestStreak = running;
      const ratio = sec / goalSec;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.65) level = 3;
      else if (ratio >= 0.3) level = 2;
      else level = 1;
    } else {
      running = 0;
    }
    cells.push({ dateISO: iso, seconds: sec, level });
  }

  return { cells, longestStreak, activeDays91 };
}

export interface PlanActualAlignment {
  plannedBlocks: number;
  matchedActualBlocks: number;
  timelineMatchPct: number;
  totalTodos: number;
  completedTodos: number;
  todoCompletionPct: number;
}

/** 계획(10분 타임라인·할 일) 대비 실행 일치율 */
export function buildPlanVsActualMetrics(
  timetablesByDate: Record<string, Record<string, TimetableSlotLog>>,
  todos: StudyTodoItem[],
  allowedDates: Set<string> | null
): PlanActualAlignment {
  let plannedBlocks = 0;
  let matchedActualBlocks = 0;

  for (const [dateISO, daySlots] of Object.entries(timetablesByDate)) {
    if (allowedDates && !allowedDates.has(dateISO)) continue;
    for (const slot of Object.values(daySlots)) {
      const hasPlan = Boolean(getTimetableSlotPlan(slot));
      const hasActual = Boolean(getTimetableSlotActual(slot));
      if (hasPlan) {
        plannedBlocks += 1;
        if (hasActual) matchedActualBlocks += 1;
      }
    }
  }

  const filteredTodos = todos.filter((t) => !allowedDates || allowedDates.has(t.dueDate));
  const completedTodos = filteredTodos.filter((t) => t.completed).length;

  return {
    plannedBlocks,
    matchedActualBlocks,
    timelineMatchPct:
      plannedBlocks > 0 ? Math.round((matchedActualBlocks / plannedBlocks) * 100) : 0,
    totalTodos: filteredTodos.length,
    completedTodos,
    todoCompletionPct:
      filteredTodos.length > 0 ? Math.round((completedTodos / filteredTodos.length) * 100) : 0,
  };
}

export interface ForgettingAlertItem {
  topicId: string;
  chapterCode?: string;
  subjectId: string;
  subjectTitle: string;
  topicTitle: string;
  topicColor: string;
  rounds: number;
  daysSinceLast: number;
  retentionPct: number;
  needsReviewFlag: boolean;
}

/**
 * 에빙하우스 망각곡선 기반 기억 잔존율 추정:
 * - 회독 수(rounds)가 많을수록 기억 반감기가 길어짐 (안정성 S = 3 * 1.8^(rounds-1)일)
 * - 잔존율 R = exp(-daysSinceLast / S) * 100
 */
export function buildForgettingCurveAlerts(
  subjects: StudySubjectNode[],
  roundsByTopic: Record<string, TopicRoundRecord[]>,
  todayISO: string
): ForgettingAlertItem[] {
  const alerts: ForgettingAlertItem[] = [];

  for (const subj of subjects) {
    const flatTopics = subj.units.flatMap((u) => u.topics);
    flatTopics.forEach((topic, tIdx) => {
      const recs = roundsByTopic[topic.id] || [];
      if (recs.length === 0) return;

      let latestISO = recs[0].dateISO;
      let needsReviewFlag = false;
      for (const r of recs) {
        if (r.dateISO > latestISO) latestISO = r.dateISO;
        if (r.status === "review") needsReviewFlag = true;
      }

      const daysSinceLast = Math.max(0, diffDaysISO(latestISO, todayISO));
      const stabilityDays = 3 * Math.pow(1.8, Math.max(0, recs.length - 1));
      const rawRetention = Math.exp(-daysSinceLast / stabilityDays) * 100;
      const retentionPct = Math.max(
        5,
        Math.min(100, Math.round(needsReviewFlag ? rawRetention * 0.72 : rawRetention))
      );

      alerts.push({
        topicId: topic.id,
        chapterCode: topic.chapterCode,
        subjectId: subj.id,
        subjectTitle: subj.shortTitle || subj.title,
        topicTitle: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
        topicColor: getMutedTopicColor(topic.color, tIdx),
        rounds: recs.length,
        daysSinceLast,
        retentionPct,
        needsReviewFlag,
      });
    });
  }

  // 잔존율 낮은 순 (복습 시급한 단원 최우선)
  alerts.sort((a, b) => a.retentionPct - b.retentionPct || b.daysSinceLast - a.daysSinceLast);
  return alerts;
}
