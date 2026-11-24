"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Play, Users } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { getSavedPersonaMode } from "@/lib/pro-workspace-store";
import { getTimetableSlotActual } from "@/data/study-textbooks";
import {
  formatClockHHMMSS,
  formatCompactMinutes,
  getMutedSubjectColor,
} from "@/lib/study-theme";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  return `${m}월 ${d}일 (${WEEKDAY_KO[dt.getDay()]})`;
}

export default function SimpleTimerHomePage() {
  const router = useRouter();
  const { todayISO, subjects, matrixLogs, timetablesByDate } = useStudyCurriculum();
  const { joinedRooms, rooms, activeRoomId } = useStudyGroupsStore();
  const { dailyGoalMinutes, quickTimer, startQuickTimer, openTimerOverlay } = useGlobalUx();

  // 기존 소장 Pro 사용자가 루트 진입 시 Pro 워크스페이스 자동 복귀
  useEffect(() => {
    if (getSavedPersonaMode() === "pro") {
      router.replace("/pro");
    }
  }, [router]);

  // 과목별 오늘 순공시간(분) 계산
  const subjectStats = useMemo(() => {
    const todaySlots = timetablesByDate[todayISO] || {};
    const slotMinByTopic = new Map<string, number>();
    for (const slot of Object.values(todaySlots)) {
      const actual = getTimetableSlotActual(slot);
      if (actual?.topicId) {
        slotMinByTopic.set(actual.topicId, (slotMinByTopic.get(actual.topicId) ?? 0) + 10);
      }
    }

    return subjects.map((subj, idx) => {
      let totalMinutes = 0;
      let firstTopicId = subj.id;
      let firstTopicTitle = subj.title;
      let foundFirst = false;

      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          if (!foundFirst) {
            firstTopicId = topic.id;
            firstTopicTitle = topic.title;
            foundFirst = true;
          }
          const log = matrixLogs[makeMatrixKey(topic.id, todayISO)];
          const slotMin = slotMinByTopic.get(topic.id) ?? 0;
          const loggedMin =
            log?.actualMinutes !== undefined
              ? log.actualMinutes
              : log && (log.status === "done" || log.status === "partial") && log.minutes
                ? log.minutes
                : 0;
          totalMinutes += Math.max(loggedMin, slotMin);
        }
      }

      const color = getMutedSubjectColor(subj.title, subj.color, idx);
      return {
        id: subj.id,
        title: subj.title,
        shortTitle: subj.shortTitle || subj.title,
        examStage: subj.examStage,
        color,
        minutes: totalMinutes,
        defaultTopicId: firstTopicId,
        defaultTopicTitle: firstTopicTitle,
      };
    });
  }, [subjects, matrixLogs, timetablesByDate, todayISO]);

  const totalTodaySeconds = useMemo(() => {
    const baseMin = subjectStats.reduce((sum, s) => sum + s.minutes, 0);
    return baseMin * 60 + (quickTimer.active ? quickTimer.elapsedSeconds : 0);
  }, [subjectStats, quickTimer.active, quickTimer.elapsedSeconds]);

  const goalPct = useMemo(() => {
    const goalSec = Math.max(60, dailyGoalMinutes * 60);
    return Math.min(100, Math.round((totalTodaySeconds / goalSec) * 100));
  }, [totalTodaySeconds, dailyGoalMinutes]);

  const activeGroup = useMemo(() => {
    const found = joinedRooms.find((r) => r.id === activeRoomId);
    return found || joinedRooms[0] || rooms[0] || null;
  }, [joinedRooms, rooms, activeRoomId]);

  const groupStudyingCount = useMemo(() => {
    if (!activeGroup) return 0;
    const membersActive = activeGroup.members.filter((m) => m.isStudying).length;
    return activeGroup.onlineCountOverride && membersActive > 0
      ? activeGroup.onlineCountOverride
      : membersActive;
  }, [activeGroup]);

  const handleStartSubject = (item: (typeof subjectStats)[number]) => {
    if (quickTimer.active && quickTimer.subjectTitle === item.shortTitle) {
      openTimerOverlay();
      return;
    }
    startQuickTimer({
      id: item.defaultTopicId,
      title: item.defaultTopicTitle,
      subjectTitle: item.shortTitle,
      subjectColor: item.color,
    });
  };

  return (
    <MobileAppShell>
      <div className="flex-1 flex flex-col">
        {/* ① 상단 오늘 총 순공시간 히어로 (극강 심플) */}
        <section className="px-6 pt-8 pb-7 border-b border-[var(--hp-border)] flex flex-col items-center text-center">
          <div className="text-xs text-[var(--hp-text-2)]">
            {formatKoreanDate(todayISO)} · 05:00 기준
          </div>

          <div className="mt-3 text-[52px] leading-none font-extralight tracking-tight hp-tabular">
            {formatClockHHMMSS(totalTodaySeconds)}
          </div>

          {/* 목표 대비 미니멀 헤어라인 프로그레스 */}
          <div className="mt-5 w-full max-w-[260px] space-y-1.5">
            <div className="h-[3px] w-full rounded-full bg-[var(--hp-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--hp-accent)] transition-all duration-300"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-3)] hp-tabular">
              <span>목표 {formatCompactMinutes(dailyGoalMinutes)}</span>
              <span>{goalPct}%</span>
            </div>
          </div>

          {quickTimer.active && (
            <button
              type="button"
              onClick={openTimerOverlay}
              className="mt-5 px-4 py-2 rounded-full bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium flex items-center gap-2 hover:opacity-90 transition"
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: quickTimer.subjectColor }}
              />
              <span>진행 중인 스터디 그룹 화면 열기</span>
            </button>
          )}
        </section>

        {/* ② 과목별 원탭 시작 리스트 */}
        <section className="px-5 py-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-[var(--hp-text-3)]">과목 선택 후 즉시 시작</h2>
            <span className="text-[11px] text-[var(--hp-text-3)]">실행 시 그룹 화면 노출</span>
          </div>

          <ul className="divide-y divide-[var(--hp-border)]">
            {subjectStats.map((item) => {
              const isRunningThis =
                quickTimer.active && quickTimer.subjectTitle === item.shortTitle;
              const liveSec =
                item.minutes * 60 + (isRunningThis ? quickTimer.elapsedSeconds : 0);

              return (
                <li key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartSubject(item)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left group"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--hp-text)] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
                        {item.examStage}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm hp-tabular text-[var(--hp-text-2)]">
                      {formatClockHHMMSS(liveSec)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartSubject(item)}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
                        isRunningThis
                          ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                          : "border-[var(--hp-border-strong)] text-[var(--hp-text)] hover:bg-[var(--hp-surface)]"
                      }`}
                      aria-label={`${item.title} 타이머 시작`}
                    >
                      <Play className="w-3.5 h-3.5 stroke-[1.75] translate-x-[0.5px]" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ③ 하단 1줄 스터디 그룹 요약 바 */}
        {activeGroup && (
          <section className="px-5 pb-4">
            <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const first = subjectStats[0];
                  if (first) handleStartSubject(first);
                }}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
                <Users className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[var(--hp-text)] truncate">
                    {activeGroup.title}
                  </div>
                  <div className="text-[11px] text-[var(--hp-text-2)] mt-0.5 hp-tabular">
                    현재 {groupStudyingCount}명 집중 중 · 탭하여 그룹 합류
                  </div>
                </div>
              </button>

              <Link
                href="/study/more?tab=group"
                className="p-1.5 rounded-lg hover:bg-[var(--hp-surface-2)] text-[var(--hp-text-3)] hover:text-[var(--hp-text)] transition shrink-0"
                aria-label="스터디 그룹 관리"
              >
                <ChevronRight className="w-4 h-4 stroke-[1.5]" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </MobileAppShell>
  );
}
