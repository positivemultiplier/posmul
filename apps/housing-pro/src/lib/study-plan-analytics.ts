import {
  type MatrixCellLog,
  type StudySubjectNode,
  type StudyTopicNode,
  type TimetableSlotEntry,
  type TimetableSlotLog,
  getTimetableSlotActual,
  getTimetableSlotPlan,
} from "@/data/study-textbooks";

/** 현재 활성화된 책·과목·단원 기준으로 타임테이블 예상(plan) 슬롯 표시 여부를 판별 */
export function isPlanSlotVisibleForBooks(
  plan: TimetableSlotEntry | null,
  activeBookIds?: string[],
  activeTopicIds?: Set<string>
): boolean {
  if (!plan) return false;
  if (plan.bookId && activeBookIds && !activeBookIds.includes(plan.bookId)) {
    return false;
  }
  if (plan.topicId && activeTopicIds && !activeTopicIds.has(plan.topicId)) {
    return false;
  }
  return true;
}

export interface TopicPlanActualItem {
  topicId: string;
  subject: StudySubjectNode;
  unitTitle: string;
  topic: StudyTopicNode;
  color: string;
  cell?: MatrixCellLog;
  planMinutes: number;
  actualMinutes: number;
  gapMinutes: number;
  matchedMinutes: number;
}

export interface DayPlanActualSummary {
  dateISO: string;
  planMinutes: number;
  actualMinutes: number;
  gapMinutes: number;
  achievementPct: number;
  planSlotCount: number;
  actualSlotCount: number;
  matchedSlotCount: number;
  slotMatchPct: number;
  items: TopicPlanActualItem[];
}

export interface SubjectPlanActualRow {
  subject: StudySubjectNode;
  planMinutes: number;
  actualMinutes: number;
  gapMinutes: number;
  achievementPct: number;
  topicCount: number;
}

export interface PeriodPlanActualGapSummary {
  totalPlanMinutes: number;
  totalActualMinutes: number;
  totalGapMinutes: number;
  achievementPct: number;
  totalPlanSlots: number;
  totalActualSlots: number;
  matchedSlots: number;
  slotMatchPct: number;
  dailyRows: Array<{
    dateISO: string;
    planMinutes: number;
    actualMinutes: number;
    gapMinutes: number;
    achievementPct: number;
    planSlots: number;
    matchedSlots: number;
  }>;
  subjectRows: SubjectPlanActualRow[];
  shortfallTopics: Array<TopicPlanActualItem & { dateISO: string }>;
}

/** 분 단위를 가독성 높은 한국어 시간 문자열로 변환 (예: 95 -> "1시간 35분") */
export function formatMinutesKo(minutes: number): string {
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** +/- 부호를 포함한 Gap 문자열 반환 (예: -25 -> "-25분", 30 -> "+30분") */
export function formatGapMinutesKo(gapMinutes: number): string {
  const rounded = Math.round(gapMinutes);
  if (rounded === 0) return "0분";
  const sign = rounded > 0 ? "+" : "-";
  return `${sign}${formatMinutesKo(rounded)}`;
}

/** 특정 날짜의 단원별·타임테이블별 계획(예상) vs 실행(타이머) 요약 계산 */
export function computeDayPlanActualSummary(params: {
  dateISO: string;
  subjects: StudySubjectNode[];
  matrixLogs: Record<string, MatrixCellLog>;
  daySlots: Record<string, TimetableSlotLog>;
  activeBookIds?: string[];
}): DayPlanActualSummary {
  const { dateISO, subjects, matrixLogs, daySlots, activeBookIds } = params;

  const activeTopicIds = new Set<string>();
  for (const s of subjects) {
    for (const u of s.units) {
      for (const t of u.topics) {
        activeTopicIds.add(t.id);
      }
    }
  }

  const ttPlanByTopic = new Map<string, number>();
  const ttActualByTopic = new Map<string, number>();
  const ttMatchedByTopic = new Map<string, number>();

  let planSlotCount = 0;
  let actualSlotCount = 0;
  let matchedSlotCount = 0;
  let customPlanMinutes = 0;
  let customActualMinutes = 0;

  for (const slot of Object.values(daySlots)) {
    const rawPlan = getTimetableSlotPlan(slot);
    const plan = isPlanSlotVisibleForBooks(rawPlan, activeBookIds, activeTopicIds)
      ? rawPlan
      : null;
    const actual = getTimetableSlotActual(slot);

    if (plan) {
      planSlotCount += 1;
      if (plan.topicId) {
        ttPlanByTopic.set(plan.topicId, (ttPlanByTopic.get(plan.topicId) ?? 0) + 10);
      } else {
        customPlanMinutes += 10;
      }
    }

    if (actual) {
      actualSlotCount += 1;
      if (actual.topicId) {
        ttActualByTopic.set(actual.topicId, (ttActualByTopic.get(actual.topicId) ?? 0) + 10);
      } else {
        customActualMinutes += 10;
      }
    }

    if (plan && actual) {
      const isMatched =
        plan.topicId && actual.topicId
          ? plan.topicId === actual.topicId
          : plan.color === actual.color;
      if (isMatched) {
        matchedSlotCount += 1;
        if (plan.topicId) {
          ttMatchedByTopic.set(
            plan.topicId,
            (ttMatchedByTopic.get(plan.topicId) ?? 0) + 10
          );
        }
      }
    }
  }

  const items: TopicPlanActualItem[] = [];
  const seenTopics = new Set<string>();
  let totalTopicPlanMinutes = 0;
  let totalTopicActualMinutes = 0;

  for (const subject of subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const cell = matrixLogs[`${topic.id}::${dateISO}`];
        const ttPlanMin = ttPlanByTopic.get(topic.id) ?? 0;
        const ttActualMin = ttActualByTopic.get(topic.id) ?? 0;
        const ttMatchedMin = ttMatchedByTopic.get(topic.id) ?? 0;

        if (!cell && ttPlanMin === 0 && ttActualMin === 0) continue;
        seenTopics.add(topic.id);

        // 계획 시간: 타임테이블 예상 슬롯 우선, 없으면 매트릭스 셀 계획 분
        const cellPlanMin = cell
          ? cell.minutes !== undefined
            ? cell.minutes
            : topic.estimatedMinutes
          : 0;
        const planMinutes = ttPlanMin > 0 ? ttPlanMin : cellPlanMin;

        // 실행 시간: 타이머 누적 actualMinutes(1분 단위) 우선, 없으면 타임테이블 실행 슬롯 분
        const actualMinutes =
          cell?.actualMinutes !== undefined ? cell.actualMinutes : ttActualMin;

        totalTopicPlanMinutes += planMinutes;
        totalTopicActualMinutes += actualMinutes;

        items.push({
          topicId: topic.id,
          subject,
          unitTitle: unit.title,
          topic,
          color: cell?.customColor || subject.color,
          cell,
          planMinutes,
          actualMinutes,
          gapMinutes: actualMinutes - planMinutes,
          matchedMinutes: ttMatchedMin,
        });
      }
    }
  }

  // 실행(actual)은 타이머로 실제 공부한 시간이므로 비활성 단원 기록도 일별 실제 공부시간에 보존
  for (const [topicId, min] of ttActualByTopic.entries()) {
    if (!seenTopics.has(topicId)) totalTopicActualMinutes += min;
  }

  const planMinutes = totalTopicPlanMinutes + customPlanMinutes;
  const actualMinutes = totalTopicActualMinutes + customActualMinutes;
  const gapMinutes = actualMinutes - planMinutes;
  const achievementPct =
    planMinutes > 0 ? Math.round((actualMinutes / planMinutes) * 100) : 0;
  const slotMatchPct =
    planSlotCount > 0 ? Math.round((matchedSlotCount / planSlotCount) * 100) : 0;

  return {
    dateISO,
    planMinutes,
    actualMinutes,
    gapMinutes,
    achievementPct,
    planSlotCount,
    actualSlotCount,
    matchedSlotCount,
    slotMatchPct,
    items,
  };
}

/** 기간(날짜 배열) 전체에 대한 일별/과목별/단원별 계획 vs 실행 Gap 상세 집계 */
export function computePeriodPlanActualGap(params: {
  dateISOs: string[];
  subjects: StudySubjectNode[];
  matrixLogs: Record<string, MatrixCellLog>;
  timetablesByDate: Record<string, Record<string, TimetableSlotLog>>;
  activeBookIds?: string[];
}): PeriodPlanActualGapSummary {
  const { dateISOs, subjects, matrixLogs, timetablesByDate, activeBookIds } = params;

  let totalPlanMinutes = 0;
  let totalActualMinutes = 0;
  let totalPlanSlots = 0;
  let totalActualSlots = 0;
  let matchedSlots = 0;

  const subjectAcc = new Map<
    string,
    { subject: StudySubjectNode; planMinutes: number; actualMinutes: number; topicIds: Set<string> }
  >();
  for (const s of subjects) {
    subjectAcc.set(s.id, {
      subject: s,
      planMinutes: 0,
      actualMinutes: 0,
      topicIds: new Set<string>(),
    });
  }

  const dailyRows: PeriodPlanActualGapSummary["dailyRows"] = [];
  const shortfallTopics: Array<TopicPlanActualItem & { dateISO: string }> = [];

  for (const dateISO of dateISOs) {
    const daySummary = computeDayPlanActualSummary({
      dateISO,
      subjects,
      matrixLogs,
      daySlots: timetablesByDate[dateISO] || {},
      activeBookIds,
    });

    totalPlanMinutes += daySummary.planMinutes;
    totalActualMinutes += daySummary.actualMinutes;
    totalPlanSlots += daySummary.planSlotCount;
    totalActualSlots += daySummary.actualSlotCount;
    matchedSlots += daySummary.matchedSlotCount;

    dailyRows.push({
      dateISO,
      planMinutes: daySummary.planMinutes,
      actualMinutes: daySummary.actualMinutes,
      gapMinutes: daySummary.gapMinutes,
      achievementPct: daySummary.achievementPct,
      planSlots: daySummary.planSlotCount,
      matchedSlots: daySummary.matchedSlotCount,
    });

    for (const item of daySummary.items) {
      const acc = subjectAcc.get(item.subject.id);
      if (acc) {
        acc.planMinutes += item.planMinutes;
        acc.actualMinutes += item.actualMinutes;
        acc.topicIds.add(item.topicId);
      }
      if (item.planMinutes > 0 && item.gapMinutes < 0) {
        shortfallTopics.push({ ...item, dateISO });
      }
    }
  }

  const subjectRows: SubjectPlanActualRow[] = Array.from(subjectAcc.values()).map((acc) => {
    const gap = acc.actualMinutes - acc.planMinutes;
    return {
      subject: acc.subject,
      planMinutes: acc.planMinutes,
      actualMinutes: acc.actualMinutes,
      gapMinutes: gap,
      achievementPct:
        acc.planMinutes > 0 ? Math.round((acc.actualMinutes / acc.planMinutes) * 100) : 0,
      topicCount: acc.topicIds.size,
    };
  });

  shortfallTopics.sort((a, b) => a.gapMinutes - b.gapMinutes);

  const totalGapMinutes = totalActualMinutes - totalPlanMinutes;
  const achievementPct =
    totalPlanMinutes > 0 ? Math.round((totalActualMinutes / totalPlanMinutes) * 100) : 0;
  const slotMatchPct =
    totalPlanSlots > 0 ? Math.round((matchedSlots / totalPlanSlots) * 100) : 0;

  return {
    totalPlanMinutes,
    totalActualMinutes,
    totalGapMinutes,
    achievementPct,
    totalPlanSlots,
    totalActualSlots,
    matchedSlots,
    slotMatchPct,
    dailyRows,
    subjectRows,
    shortfallTopics,
  };
}

export interface TimeBandSummary {
  id: string;
  label: string;
  rangeLabel: string;
  planMinutes: number;
  actualMinutes: number;
  matchedMinutes: number;
  achievementPct: number;
}

export interface StudyRhythmSummary {
  timeBands: TimeBandSummary[];
  goldenBand: TimeBandSummary | null;
  subjectShareRows: Array<{
    subject: StudySubjectNode;
    actualMinutes: number;
    planMinutes: number;
    sharePct: number;
  }>;
  underStudiedSubjects: StudySubjectNode[];
  streakDays: number;
}

const TIME_BAND_SPECS: Array<{
  id: string;
  label: string;
  rangeLabel: string;
  hours: number[];
}> = [
  { id: "dawn", label: "새벽", rangeLabel: "05~08시", hours: [5, 6, 7, 8] },
  { id: "morning", label: "오전", rangeLabel: "09~11시", hours: [9, 10, 11] },
  { id: "afternoon", label: "낮", rangeLabel: "12~16시", hours: [12, 13, 14, 15, 16] },
  { id: "evening", label: "저녁", rangeLabel: "17~20시", hours: [17, 18, 19, 20] },
  { id: "night", label: "심야", rangeLabel: "21~24시", hours: [21, 22, 23, 0, 1, 2, 3, 4] },
];

/**
 * 시간대별 집중 골든타임 · 과목 편식 · 연속 실행 스트릭 계산 (로컬 0ms)
 */
export function computeStudyRhythmAnalytics(params: {
  dateISOs: string[];
  todayISO: string;
  subjects: StudySubjectNode[];
  matrixLogs: Record<string, MatrixCellLog>;
  timetablesByDate: Record<string, Record<string, TimetableSlotLog>>;
  activeBookIds?: string[];
}): StudyRhythmSummary {
  const { dateISOs, todayISO, subjects, matrixLogs, timetablesByDate, activeBookIds } = params;

  const activeTopicIds = new Set<string>();
  for (const s of subjects) {
    for (const u of s.units) {
      for (const t of u.topics) {
        activeTopicIds.add(t.id);
      }
    }
  }

  const bandMap = new Map<string, TimeBandSummary>(
    TIME_BAND_SPECS.map((b) => [
      b.id,
      {
        id: b.id,
        label: b.label,
        rangeLabel: b.rangeLabel,
        planMinutes: 0,
        actualMinutes: 0,
        matchedMinutes: 0,
        achievementPct: 0,
      },
    ])
  );

  const hourToBandId = new Map<number, string>();
  for (const spec of TIME_BAND_SPECS) {
    for (const h of spec.hours) hourToBandId.set(h, spec.id);
  }

  for (const dateISO of dateISOs) {
    const daySlots = timetablesByDate[dateISO] || {};
    for (const [slotKey, rawSlot] of Object.entries(daySlots)) {
      const hourPart = Number(slotKey.split("-")[0]);
      if (Number.isNaN(hourPart)) continue;
      const bandId = hourToBandId.get(hourPart) || "night";
      const band = bandMap.get(bandId);
      if (!band) continue;

      const rawPlan = getTimetableSlotPlan(rawSlot);
      const plan = isPlanSlotVisibleForBooks(rawPlan, activeBookIds, activeTopicIds)
        ? rawPlan
        : null;
      const actual = getTimetableSlotActual(rawSlot);

      if (plan) band.planMinutes += 10;
      if (actual) band.actualMinutes += 10;
      if (plan && actual) {
        const matched =
          plan.topicId && actual.topicId
            ? plan.topicId === actual.topicId
            : plan.color === actual.color;
        if (matched) band.matchedMinutes += 10;
      }
    }
  }

  const timeBands = Array.from(bandMap.values()).map((b) => ({
    ...b,
    achievementPct:
      b.planMinutes > 0
        ? Math.round((b.actualMinutes / b.planMinutes) * 100)
        : b.actualMinutes > 0
          ? 100
          : 0,
  }));

  const activeBands = timeBands.filter((b) => b.actualMinutes > 0);
  const goldenBand =
    activeBands.length > 0
      ? [...activeBands].sort((a, b) => b.actualMinutes - a.actualMinutes)[0]
      : null;

  // 과목 편식 분석
  const periodGap = computePeriodPlanActualGap({
    dateISOs,
    subjects,
    matrixLogs,
    timetablesByDate,
    activeBookIds,
  });
  const totalSubjectActual = periodGap.subjectRows.reduce(
    (sum, r) => sum + r.actualMinutes,
    0
  );
  const subjectShareRows = periodGap.subjectRows
    .map((r) => ({
      subject: r.subject,
      actualMinutes: r.actualMinutes,
      planMinutes: r.planMinutes,
      sharePct:
        totalSubjectActual > 0
          ? Math.round((r.actualMinutes / totalSubjectActual) * 100)
          : 0,
    }))
    .sort((a, b) => b.actualMinutes - a.actualMinutes);

  const underStudiedSubjects = subjectShareRows
    .filter((r) => r.actualMinutes === 0 || (totalSubjectActual >= 60 && r.sharePct < 10))
    .map((r) => r.subject);

  // 오늘 기준 연속 실행 일수 계산 (최근 dateISOs 내역 기준)
  const descDates = [...dateISOs].filter((d) => d <= todayISO).sort((a, b) => b.localeCompare(a));
  let streakDays = 0;
  for (const d of descDates) {
    const dayRow = periodGap.dailyRows.find((r) => r.dateISO === d);
    const hasDoneMatrix = Object.entries(matrixLogs).some(
      ([k, v]) => k.endsWith(`::${d}`) && (v.status === "done" || (v.actualMinutes ?? 0) > 0)
    );
    if ((dayRow && dayRow.actualMinutes > 0) || hasDoneMatrix) {
      streakDays += 1;
    } else if (d !== todayISO) {
      break;
    }
  }

  return {
    timeBands,
    goldenBand,
    subjectShareRows,
    underStudiedSubjects,
    streakDays,
  };
}
