"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Play, Plus, Users } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyGroupsStore } from "@/lib/study-groups-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { getSavedPersonaMode } from "@/lib/pro-workspace-store";
import type { StudyTodoItem, StudyTopicNode } from "@/data/study-textbooks";
import {
  getStudySecondsForDate,
  getSubjectSecondsForDate,
  getTodoLoggedSeconds,
  getTopicSecondsForDate,
} from "@/lib/study-metrics";
import {
  formatClockHHMMSS,
  formatCompactMinutes,
  getMutedSubjectColor,
  getMutedTopicColor,
} from "@/lib/study-theme";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  return `${m}월 ${d}일 (${WEEKDAY_KO[dt.getDay()]})`;
}

export default function SimpleTimerHomePage() {
  const router = useRouter();
  const { todayISO, subjects, todos, studySessions, toggleTodo } = useStudyCurriculum();
  const { joinedRooms, rooms, activeRoomId } = useStudyGroupsStore();
  const { dailyGoalMinutes, quickTimer, startQuickTimer, openTimerOverlay } = useGlobalUx();

  // 과목 펼침 상태 -> 소속 단원 목록(단원별 컬러·오늘 순공·원탭 시작) 표시
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (getSavedPersonaMode() === "pro") {
      router.replace("/pro");
    }
  }, [router]);

  const todayTodosBySubject = useMemo(() => {
    const map = new Map<string, StudyTodoItem[]>();
    const todayTodos = todos.filter((t) => t.dueDate === todayISO);

    for (const todo of todayTodos) {
      const matched =
        (todo.subjectId ? subjects.find((s) => s.id === todo.subjectId) : undefined) ||
        subjects.find(
          (s) =>
            s.title === todo.subjectTitle ||
            s.shortTitle === todo.subjectTitle ||
            s.title.includes(todo.subjectTitle) ||
            todo.subjectTitle.includes(s.shortTitle || s.title)
        );
      const key = matched?.id || subjects[0]?.id || "other";
      const list = map.get(key) || [];
      list.push(todo);
      map.set(key, list);
    }
    return map;
  }, [todos, todayISO, subjects]);

  const subjectSecondsMap = useMemo(
    () => getSubjectSecondsForDate(studySessions, subjects, todayISO),
    [studySessions, subjects, todayISO]
  );

  const topicSecondsMap = useMemo(
    () => getTopicSecondsForDate(studySessions, todayISO),
    [studySessions, todayISO]
  );

  const subjectRows = useMemo(() => {
    return subjects.map((subj, idx) => {
      const color = getMutedSubjectColor(subj.title, subj.color, idx);
      const baseSec = subjectSecondsMap.get(subj.id) ?? 0;
      const isRunningThis = quickTimer.active && quickTimer.subjectId === subj.id;
      const liveSec = baseSec + (isRunningThis ? quickTimer.elapsedSeconds : 0);
      const dayTodos = todayTodosBySubject.get(subj.id) || [];
      const flatTopics = subj.units.flatMap((u) => u.topics);

      return {
        id: subj.id,
        title: subj.title,
        shortTitle: subj.shortTitle || subj.title,
        categoryLabel: subj.category || subj.examStage,
        color,
        liveSeconds: liveSec,
        isRunning: isRunningThis,
        dayTodos,
        topics: flatTopics,
      };
    });
  }, [subjects, subjectSecondsMap, quickTimer, todayTodosBySubject]);

  const totalTodaySeconds = useMemo(() => {
    const baseSec = getStudySecondsForDate(studySessions, todayISO);
    return baseSec + (quickTimer.active ? quickTimer.elapsedSeconds : 0);
  }, [studySessions, todayISO, quickTimer.active, quickTimer.elapsedSeconds]);

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

  const handleStartSubject = (row: (typeof subjectRows)[number]) => {
    if (quickTimer.active && quickTimer.subjectId === row.id && !quickTimer.topicId) {
      openTimerOverlay();
      return;
    }
    const nextPendingTodo = row.dayTodos.find((t) => !t.completed);
    startQuickTimer({
      id: nextPendingTodo?.id || row.id,
      subjectId: row.id,
      subjectTitle: row.shortTitle,
      subjectColor: nextPendingTodo?.subjectColor || row.color,
      topicId: nextPendingTodo?.topicId,
      todoId: nextPendingTodo?.id,
      title: nextPendingTodo ? nextPendingTodo.title : `${row.shortTitle} 집중 학습`,
    });
  };

  const handleStartTopic = (
    row: (typeof subjectRows)[number],
    topic: StudyTopicNode,
    topicIdx: number
  ) => {
    if (quickTimer.active && quickTimer.topicId === topic.id) {
      openTimerOverlay();
      return;
    }
    const tColor = getMutedTopicColor(topic.color, topicIdx);
    startQuickTimer({
      id: topic.id,
      subjectId: row.id,
      subjectTitle: row.shortTitle,
      subjectColor: tColor,
      topicId: topic.id,
      title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
    });
  };

  const handleStartTodo = (row: (typeof subjectRows)[number], todo: StudyTodoItem) => {
    if (quickTimer.active && quickTimer.todoId === todo.id) {
      openTimerOverlay();
      return;
    }
    startQuickTimer({
      id: todo.id,
      subjectId: row.id,
      subjectTitle: row.shortTitle,
      subjectColor: todo.subjectColor || row.color,
      topicId: todo.topicId,
      todoId: todo.id,
      title: todo.title,
    });
  };

  const totalTodayTodos = todos.filter((t) => t.dueDate === todayISO).length;

  return (
    <MobileAppShell>
      <div className="flex-1 flex flex-col">
        {/* ① 상단 오늘 총 순공시간 히어로 */}
        <section className="px-6 pt-8 pb-7 border-b border-[var(--hp-border)] flex flex-col items-center text-center">
          <div className="text-xs text-[var(--hp-text-2)]">
            {formatKoreanDate(todayISO)} · 05:00 기준
          </div>

          <div className="mt-3 text-[52px] leading-none font-extralight tracking-tight hp-tabular">
            {formatClockHHMMSS(totalTodaySeconds)}
          </div>

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

        {/* ② 과목 · 단원별 타이머 + 오늘 플래너 할 일 리스트 */}
        <section className="px-5 py-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-[var(--hp-text-3)]">
              과목 탭하여 단원 선택 · 오늘 계획 {totalTodayTodos}건
            </h2>
            <Link
              href="/study/planner"
              className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3 stroke-[1.75]" />
              <span>계획 추가</span>
            </Link>
          </div>

          <ul className="divide-y divide-[var(--hp-border)]">
            {subjectRows.map((row) => {
              const isExpanded = expandedSubjectId === row.id;
              return (
                <li key={row.id} className="py-3.5 space-y-2.5">
                  {/* 과목 메인 행 (좌측 탭 시 단원 펼침, 우측 ▶ 탭 시 즉시 시작) */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedSubjectId(isExpanded ? null : row.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
                      )}
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--hp-text)] truncate">
                          {row.title}
                        </div>
                        <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
                          {row.topics.length}단원
                          {row.dayTodos.length > 0 ? ` · 오늘 할 일 ${row.dayTodos.length}건` : ""}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm hp-tabular text-[var(--hp-text-2)]">
                        {formatClockHHMMSS(row.liveSeconds)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartSubject(row)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
                          row.isRunning
                            ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                            : "border-[var(--hp-border-strong)] text-[var(--hp-text)] hover:bg-[var(--hp-surface)]"
                        }`}
                        aria-label={`${row.title} 타이머 시작`}
                      >
                        <Play className="w-3.5 h-3.5 stroke-[1.75] translate-x-[0.5px]" />
                      </button>
                    </div>
                  </div>

                  {/* 오늘 플래너 할 일 (항상 노출) */}
                  {row.dayTodos.length > 0 && (
                    <ul className="pl-5 space-y-1.5">
                      {row.dayTodos.map((todo) => {
                        const isTodoRunning = quickTimer.active && quickTimer.todoId === todo.id;
                        const loggedSec =
                          getTodoLoggedSeconds(studySessions, todo.id, todo.loggedSeconds ?? 0) +
                          (isTodoRunning ? quickTimer.elapsedSeconds : 0);

                        return (
                          <li
                            key={todo.id}
                            className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTodo(todo.id)}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                  todo.completed
                                    ? "bg-[var(--hp-accent)] border-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                                    : "border-[var(--hp-border-strong)]"
                                }`}
                              >
                                {todo.completed && <Check className="w-2.5 h-2.5 stroke-[2.2]" />}
                              </span>
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: todo.subjectColor || row.color }}
                              />
                              <span
                                className={`text-xs truncate ${
                                  todo.completed
                                    ? "line-through text-[var(--hp-text-3)]"
                                    : "text-[var(--hp-text)]"
                                }`}
                              >
                                {todo.title}
                              </span>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              {loggedSec > 0 && (
                                <span className="text-[10.5px] hp-tabular text-[var(--hp-text-3)]">
                                  {loggedSec >= 60
                                    ? formatCompactMinutes(Math.floor(loggedSec / 60))
                                    : `${loggedSec}s`}
                                </span>
                              )}
                              {!todo.completed && (
                                <button
                                  type="button"
                                  onClick={() => handleStartTodo(row, todo)}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                                    isTodoRunning
                                      ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                                      : "border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[var(--hp-text-2)]"
                                  }`}
                                  aria-label={`${todo.title} 타이머 시작`}
                                >
                                  <Play className="w-2.5 h-2.5 stroke-[2] translate-x-[0.5px]" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* 펼침: 과목 소속 단원별 타이머 (각 단원 고유 색상 + 오늘 단원 순공) */}
                  {isExpanded && row.topics.length > 0 && (
                    <ul className="pl-5 pt-1 space-y-1">
                      {row.topics.map((topic, tIdx) => {
                        const tColor = getMutedTopicColor(topic.color, tIdx);
                        const isTopicRunning =
                          quickTimer.active && quickTimer.topicId === topic.id;
                        const tSec =
                          (topicSecondsMap.get(topic.id) ?? 0) +
                          (isTopicRunning ? quickTimer.elapsedSeconds : 0);

                        return (
                          <li
                            key={topic.id}
                            className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] transition"
                          >
                            <button
                              type="button"
                              onClick={() => handleStartTopic(row, topic, tIdx)}
                              className="flex items-start gap-2 min-w-0 flex-1 text-left"
                            >
                              <span
                                className="w-2 h-2 rounded-full mt-1 shrink-0"
                                style={{ backgroundColor: tColor }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs text-[var(--hp-text)] truncate">
                                  {topic.topicNo ? `${topic.topicNo}. ` : ""}
                                  {topic.title}
                                </div>
                                {topic.subItems && topic.subItems.length > 0 && (
                                  <div className="text-[10px] text-[var(--hp-text-3)] truncate mt-0.5">
                                    {topic.subItems.join(" · ")}
                                  </div>
                                )}
                              </div>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] hp-tabular text-[var(--hp-text-3)]">
                                {formatClockHHMMSS(tSec)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartTopic(row, topic, tIdx)}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                                  isTopicRunning
                                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent"
                                    : "border-[var(--hp-border)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                                }`}
                                aria-label={`${topic.title} 타이머 시작`}
                              >
                                <Play className="w-2.5 h-2.5 stroke-[2] translate-x-[0.5px]" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
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
                  const first = subjectRows[0];
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
