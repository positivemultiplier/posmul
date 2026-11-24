import {
  addDaysISO,
  type StudySessionLog,
  type StudySubjectNode,
  type TopicRoundRecord,
} from "@/data/study-textbooks";

/**
 * 과목 식별자 매칭 (subjectId 우선, 구버전 호환을 위해 제목 매칭 폴백)
 */
export function resolveSessionSubjectId(
  session: Pick<StudySessionLog, "subjectId" | "subjectTitle">,
  subjects: StudySubjectNode[]
): string | null {
  if (session.subjectId && subjects.some((s) => s.id === session.subjectId)) {
    return session.subjectId;
  }
  const cleanTitle = (session.subjectTitle || "").trim();
  if (!cleanTitle) return null;
  const matched = subjects.find(
    (s) =>
      s.title === cleanTitle ||
      s.shortTitle === cleanTitle ||
      s.title.includes(cleanTitle) ||
      cleanTitle.includes(s.shortTitle || s.title)
  );
  return matched?.id ?? null;
}

/** 특정 날짜의 실제 순공시간 총합(초) — 오직 타이머 세션(SSOT)만 집계 */
export function getStudySecondsForDate(
  sessions: StudySessionLog[],
  dateISO: string
): number {
  let total = 0;
  for (const s of sessions) {
    if (s.dateISO === dateISO && s.seconds > 0) {
      total += s.seconds;
    }
  }
  return total;
}

/** 특정 날짜의 과목별 순공시간 맵(초) — 자유 할 일(todo) 포함 누락 0건 */
export function getSubjectSecondsForDate(
  sessions: StudySessionLog[],
  subjects: StudySubjectNode[],
  dateISO: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const subj of subjects) map.set(subj.id, 0);

  for (const s of sessions) {
    if (s.dateISO !== dateISO || s.seconds <= 0) continue;
    const subjId = resolveSessionSubjectId(s, subjects);
    if (subjId) {
      map.set(subjId, (map.get(subjId) ?? 0) + s.seconds);
    }
  }
  return map;
}

/** 기간 내 과목별 순공시간 맵(초) */
export function getSubjectSecondsInPeriod(
  sessions: StudySessionLog[],
  subjects: StudySubjectNode[],
  allowedDates: Set<string> | null
): Map<string, number> {
  const map = new Map<string, number>();
  for (const subj of subjects) map.set(subj.id, 0);

  for (const s of sessions) {
    if (s.seconds <= 0) continue;
    if (allowedDates && !allowedDates.has(s.dateISO)) continue;
    const subjId = resolveSessionSubjectId(s, subjects);
    if (subjId) {
      map.set(subjId, (map.get(subjId) ?? 0) + s.seconds);
    }
  }
  return map;
}

/** 기간 내 총 순공시간(초) */
export function getTotalSecondsInPeriod(
  sessions: StudySessionLog[],
  allowedDates: Set<string> | null
): number {
  let total = 0;
  for (const s of sessions) {
    if (s.seconds <= 0) continue;
    if (allowedDates && !allowedDates.has(s.dateISO)) continue;
    total += s.seconds;
  }
  return total;
}

/** 특정 날짜의 단원별 순공시간 맵(초) */
export function getTopicSecondsForDate(
  sessions: StudySessionLog[],
  dateISO: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.dateISO !== dateISO || s.seconds <= 0 || !s.topicId) continue;
    map.set(s.topicId, (map.get(s.topicId) ?? 0) + s.seconds);
  }
  return map;
}

/** 기간 내 단원별 순공시간 맵(초) */
export function getTopicSecondsInPeriod(
  sessions: StudySessionLog[],
  allowedDates: Set<string> | null
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.seconds <= 0 || !s.topicId) continue;
    if (allowedDates && !allowedDates.has(s.dateISO)) continue;
    map.set(s.topicId, (map.get(s.topicId) ?? 0) + s.seconds);
  }
  return map;
}

/** 특정 할 일(todo)에 누적된 순공시간(초) */
export function getTodoLoggedSeconds(
  sessions: StudySessionLog[],
  todoId: string,
  fallbackSeconds = 0
): number {
  let sum = 0;
  for (const s of sessions) {
    if (s.todoId === todoId && s.seconds > 0) {
      sum += s.seconds;
    }
  }
  return Math.max(sum, fallbackSeconds);
}

/** 연속 학습일 계산 (실제 순공 세션이 1초 이상 있는 날 기준) */
export function computeStudyStreakDays(
  sessions: StudySessionLog[],
  todayISO: string
): number {
  const activeDates = new Set<string>();
  for (const s of sessions) {
    if (s.seconds > 0) activeDates.add(s.dateISO);
  }
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const iso = addDaysISO(todayISO, -i);
    if (activeDates.has(iso)) {
      streak += 1;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** 단원의 완료 회독 수 계산 (done + review 모두 회독 진행으로 카운트) */
export function getTopicCompletedRoundCount(
  roundsByTopic: Record<string, TopicRoundRecord[]>,
  topicId: string
): number {
  return (roundsByTopic[topicId] || []).length;
}

/** 단원의 가장 최근 회독 날짜 반환 */
export function getTopicLastRoundDate(
  roundsByTopic: Record<string, TopicRoundRecord[]>,
  topicId: string
): string | null {
  const list = roundsByTopic[topicId] || [];
  if (list.length === 0) return null;
  let latest = list[0].dateISO;
  for (const r of list) {
    if (r.dateISO > latest) latest = r.dateISO;
  }
  return latest;
}
