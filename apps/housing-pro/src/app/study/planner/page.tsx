"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { addDaysISO, type StudyTodoItem } from "@/data/study-textbooks";
import { getStudySecondsForDate } from "@/lib/study-metrics";
import { getMutedSubjectColor } from "@/lib/study-theme";
import { DailyTodoSection } from "@/components/study/planner/DailyTodoSection";
import { TenMinuteTimeline } from "@/components/study/planner/TenMinuteTimeline";
import { RoundRoadmapSection } from "@/components/study/planner/RoundRoadmapSection";

type PlannerViewTab = "daily" | "rounds";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function getWeekDates(anchorISO: string): Array<{ iso: string; dayNum: number; weekday: string }> {
  const [y, m, d] = anchorISO.split("-").map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  const day = dt.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mondayISO = addDaysISO(anchorISO, diffToMon);

  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(mondayISO, i);
    const [yy, mm, dd] = iso.split("-").map(Number);
    const cur = new Date(yy || 2026, (mm || 1) - 1, dd || 1);
    return {
      iso,
      dayNum: dd || 1,
      weekday: WEEKDAY_LABELS[cur.getDay()],
    };
  });
}

export default function StudyPlannerPage() {
  const {
    todayISO,
    subjects,
    todos,
    studySessions,
    roundsByTopic,
    chapterTotals,
    timetablesByDate,
    addTodo,
    toggleTodo,
    deleteTodo,
    setTimetableSlots,
    cycleTopicRound,
  } = useStudyCurriculum();
  const { startQuickTimer } = useGlobalUx();

  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const [activeTab, setActiveTab] = useState<PlannerViewTab>("daily");

  const weekDates = useMemo(() => getWeekDates(selectedDateISO), [selectedDateISO]);
  const yesterdayISO = useMemo(() => addDaysISO(selectedDateISO, -1), [selectedDateISO]);
  const daySlots = timetablesByDate[selectedDateISO] || {};

  const selectedDayStudySeconds = useMemo(
    () => getStudySecondsForDate(studySessions, selectedDateISO),
    [studySessions, selectedDateISO]
  );

  const monthLabel = useMemo(() => {
    const [y, m] = selectedDateISO.split("-");
    return `${y}년 ${Number(m)}월`;
  }, [selectedDateISO]);

  const handleStartTimerForTodo = (todo: StudyTodoItem) => {
    startQuickTimer({
      id: todo.id,
      subjectId: todo.subjectId,
      subjectTitle: todo.subjectTitle,
      subjectColor: getMutedSubjectColor(todo.subjectTitle, todo.subjectColor),
      topicId: todo.topicId,
      todoId: todo.id,
      title: todo.title,
    });
  };

  return (
    <MobileAppShell>
      {/* 상단 고정 주간 날짜 스트립 + 2탭 세그먼트 */}
      <div className="px-4 pt-3 pb-3 border-b border-[var(--hp-border)] space-y-3 bg-[var(--hp-bg)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDateISO(addDaysISO(selectedDateISO, -7))}
              className="w-7 h-7 rounded-md hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)]"
              aria-label="이전 주"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <span className="text-xs font-medium hp-tabular px-1">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setSelectedDateISO(addDaysISO(selectedDateISO, 7))}
              className="w-7 h-7 rounded-md hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)]"
              aria-label="다음 주"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>

          {selectedDateISO !== todayISO && (
            <button
              type="button"
              onClick={() => setSelectedDateISO(todayISO)}
              className="px-2.5 py-1 rounded-md border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
            >
              오늘
            </button>
          )}
        </div>

        {/* 7일 날짜 스트립 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((d) => {
            const isSelected = d.iso === selectedDateISO;
            const isToday = d.iso === todayISO;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDateISO(d.iso)}
                className={`py-2 rounded-lg flex flex-col items-center gap-0.5 transition ${
                  isSelected
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                    : "hover:bg-[var(--hp-surface)] text-[var(--hp-text-2)]"
                }`}
              >
                <span className="text-[10px] opacity-75">{d.weekday}</span>
                <span className="text-xs font-medium hp-tabular">{d.dayNum}</span>
                <span
                  className={`w-1 h-1 rounded-full ${
                    isToday
                      ? isSelected
                        ? "bg-[var(--hp-accent-fg)]"
                        : "bg-[var(--hp-accent)]"
                      : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* 일간 10분 | 회독표 2탭 */}
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)]">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "daily"
                ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
            }`}
          >
            일간 10분
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rounds")}
            className={`py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "rounds"
                ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
            }`}
          >
            회독표
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 py-5 space-y-8">
        {activeTab === "daily" ? (
          <>
            <DailyTodoSection
              selectedDateISO={selectedDateISO}
              yesterdayISO={yesterdayISO}
              subjects={subjects}
              todos={todos}
              studySessions={studySessions}
              onAddTodo={addTodo}
              onToggleTodo={toggleTodo}
              onDeleteTodo={deleteTodo}
              onStartTimerForTodo={handleStartTimerForTodo}
            />

            <TenMinuteTimeline
              selectedDateISO={selectedDateISO}
              subjects={subjects}
              daySlots={daySlots}
              actualStudySeconds={selectedDayStudySeconds}
              onUpdateSlots={setTimetableSlots}
            />
          </>
        ) : (
          <RoundRoadmapSection
            todayISO={todayISO}
            selectedDateISO={selectedDateISO}
            subjects={subjects}
            roundsByTopic={roundsByTopic}
            chapterTotals={chapterTotals}
            onCycleRound={cycleTopicRound}
            onAddTopicToToday={(params) =>
              addTodo({
                title: params.title,
                subjectId: params.subjectId,
                subjectTitle: params.subjectTitle,
                subjectColor: params.subjectColor,
                topicId: params.topicId,
                dueDate: selectedDateISO,
              })
            }
          />
        )}
      </div>
    </MobileAppShell>
  );
}
