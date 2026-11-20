import {
  diffDaysISO,
  type MatrixCellLog,
  type StudySubjectNode,
  type StudyTopicNode,
} from "@/data/study-textbooks";

export type ForgettingUrgency = "OVERDUE" | "DUE_TODAY" | "SOON" | "STABLE";

export interface ForgettingRemindItem {
  topicId: string;
  subject: StudySubjectNode;
  unitTitle: string;
  topic: StudyTopicNode;
  doneRounds: number;
  lastDoneISO: string;
  daysSinceLast: number;
  recommendedIntervalDays: number;
  /** 에빙하우스 추정 현재 기억 잔존율 (0~100%) */
  retentionPct: number;
  urgency: ForgettingUrgency;
  urgencyLabel: string;
  alreadyPlannedToday: boolean;
}

/** 회독 횟수별 에빙하우스 복습 골든타임 (1일 · 3일 · 7일 · 14일 · 30일) */
export function getEbbinghausIntervalDays(doneRounds: number): number {
  if (doneRounds <= 1) return 1;
  if (doneRounds === 2) return 3;
  if (doneRounds === 3) return 7;
  if (doneRounds === 4) return 14;
  return 30;
}

/** 회독 횟수별 기억 안정도 S (일 단위) -> R(t) = exp(-t / S) */
function getMemoryStabilityDays(doneRounds: number): number {
  if (doneRounds <= 1) return 2.0;
  if (doneRounds === 2) return 5.2;
  if (doneRounds === 3) return 11.5;
  if (doneRounds === 4) return 22.0;
  return 45.0;
}

/** 현재 기억 잔존율 추정 (0~100%) */
export function estimateRetentionPct(daysSinceLast: number, doneRounds: number): number {
  if (daysSinceLast <= 0) return 98;
  const stability = getMemoryStabilityDays(doneRounds);
  const raw = Math.exp(-daysSinceLast / stability) * 100;
  return Math.max(8, Math.min(98, Math.round(raw)));
}

/**
 * 사용자의 회독 매트릭스 로그에서 에빙하우스 망각곡선 기반 오늘의 복습 리마인드 목록을 산출합니다.
 */
export function computeForgettingCurveReminders(params: {
  todayISO: string;
  subjects: StudySubjectNode[];
  matrixLogs: Record<string, MatrixCellLog>;
  maxItems?: number;
}): {
  urgentItems: ForgettingRemindItem[];
  allTrackedCount: number;
  overdueCount: number;
  dueTodayCount: number;
} {
  const { todayISO, subjects, matrixLogs, maxItems = 5 } = params;
  const tracked: ForgettingRemindItem[] = [];

  for (const subject of subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const prefix = `${topic.id}::`;
        let doneRounds = 0;
        let lastDoneISO = "";
        let alreadyPlannedToday = false;

        for (const [key, cell] of Object.entries(matrixLogs)) {
          if (!key.startsWith(prefix)) continue;
          const dateISO = key.slice(prefix.length);
          if (dateISO === todayISO && (cell.status === "plan" || cell.status === "partial")) {
            alreadyPlannedToday = true;
          }
          if (cell.status === "done" || cell.status === "partial") {
            doneRounds += 1;
            if (!lastDoneISO || dateISO > lastDoneISO) {
              lastDoneISO = dateISO;
            }
          }
        }

        if (doneRounds === 0 || !lastDoneISO) continue;

        const daysSinceLast = Math.max(0, diffDaysISO(lastDoneISO, todayISO));
        const recommendedIntervalDays = getEbbinghausIntervalDays(doneRounds);
        const retentionPct = estimateRetentionPct(daysSinceLast, doneRounds);

        let urgency: ForgettingUrgency = "STABLE";
        let urgencyLabel = `${recommendedIntervalDays - daysSinceLast}일 뒤 복습`;

        if (daysSinceLast > recommendedIntervalDays) {
          urgency = "OVERDUE";
          urgencyLabel = `골든타임 +${daysSinceLast - recommendedIntervalDays}일 초과`;
        } else if (daysSinceLast === recommendedIntervalDays) {
          urgency = "DUE_TODAY";
          urgencyLabel = `오늘 딱 ${recommendedIntervalDays}일차 복습!`;
        } else if (recommendedIntervalDays - daysSinceLast === 1) {
          urgency = "SOON";
          urgencyLabel = `내일(${recommendedIntervalDays}일차) 복습 예정`;
        }

        tracked.push({
          topicId: topic.id,
          subject,
          unitTitle: unit.title,
          topic,
          doneRounds,
          lastDoneISO,
          daysSinceLast,
          recommendedIntervalDays,
          retentionPct,
          urgency,
          urgencyLabel,
          alreadyPlannedToday,
        });
      }
    }
  }

  // 정렬: OVERDUE -> DUE_TODAY -> SOON -> STABLE, 동일 등급 내에서는 잔존율 낮은 순
  const rankMap: Record<ForgettingUrgency, number> = {
    OVERDUE: 0,
    DUE_TODAY: 1,
    SOON: 2,
    STABLE: 3,
  };

  tracked.sort((a, b) => {
    if (rankMap[a.urgency] !== rankMap[b.urgency]) {
      return rankMap[a.urgency] - rankMap[b.urgency];
    }
    return a.retentionPct - b.retentionPct;
  });

  const overdueCount = tracked.filter((i) => i.urgency === "OVERDUE").length;
  const dueTodayCount = tracked.filter((i) => i.urgency === "DUE_TODAY").length;
  const urgentItems = tracked
    .filter((i) => i.urgency === "OVERDUE" || i.urgency === "DUE_TODAY" || i.urgency === "SOON")
    .slice(0, maxItems);

  return {
    urgentItems,
    allTrackedCount: tracked.length,
    overdueCount,
    dueTodayCount,
  };
}
