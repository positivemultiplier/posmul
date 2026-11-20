"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import {
  flattenTopics,
  formatDateISO,
  getRoundColorStyle,
  type MatrixCellStatus,
} from "@/data/study-textbooks";

interface PlannerCalendarTodoViewProps {
  onJumpToMatrix?: () => void;
}

/**
 * 파워 J 플래너 내부의 [달력 · 할일] 통합 뷰
 * (기존 /study/more 에 흩어져 있던 월간 달력과 할일 체크리스트를 플래너로 단일화)
 */
export function PlannerCalendarTodoView({ onJumpToMatrix }: PlannerCalendarTodoViewProps) {
  const {
    todayISO,
    subjects,
    matrixLogs,
    todos,
    toggleTodo,
    addTodo,
    deleteTodo,
  } = useStudyCurriculum();

  const [subTab, setSubTab] = useState<"calendar" | "todo">("calendar");
  const allTopics = useMemo(() => flattenTopics(subjects), [subjects]);

  // 할일 입력 상태
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoTopicId, setNewTodoTopicId] = useState<string>("");

  // 월간 달력 상태
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = todayISO.split("-").map(Number);
    return { year: y || new Date().getFullYear(), month: (m || 1) - 1 };
  });
  const [selectedCalDate, setSelectedCalDate] = useState<string>(todayISO);

  useEffect(() => {
    if (allTopics.length > 0 && !newTodoTopicId) {
      setNewTodoTopicId(allTopics[0].topic.id);
    }
  }, [allTopics, newTodoTopicId]);

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;
    const matched = allTopics.find((t) => t.topic.id === newTodoTopicId) || allTopics[0];
    addTodo({
      title: newTodoTitle,
      subjectTitle: matched ? matched.subject.shortTitle : "일반",
      subjectColor: matched ? matched.subject.color : "#FF5A36",
      topicId: matched?.topic.id,
      dueDate: selectedCalDate || todayISO,
    });
    setNewTodoTitle("");
  };

  // 날짜별 매트릭스 로그 맵
  const logsByDate = useMemo(() => {
    const doneCountsByTopic = new Map<string, number>();
    for (const [k, cell] of Object.entries(matrixLogs)) {
      if (cell.status !== "done") continue;
      const tId = k.split("::")[0];
      if (tId) doneCountsByTopic.set(tId, (doneCountsByTopic.get(tId) || 0) + 1);
    }

    const map: Record<
      string,
      Array<{
        topicId: string;
        topicTitle: string;
        subjectTitle: string;
        subjectColor: string;
        keyword: string;
        status: MatrixCellStatus;
        minutes: number;
        doneRounds: number;
      }>
    > = {};

    for (const [key, cell] of Object.entries(matrixLogs)) {
      const [topicId, dateISO] = key.split("::");
      const found = allTopics.find((t) => t.topic.id === topicId);
      if (!found || !dateISO) continue;
      if (!map[dateISO]) map[dateISO] = [];
      map[dateISO].push({
        topicId,
        topicTitle: found.topic.title,
        subjectTitle: found.subject.shortTitle,
        subjectColor: cell.customColor || found.subject.color,
        keyword: cell.keyword,
        status: cell.status,
        minutes: cell.minutes || found.topic.estimatedMinutes,
        doneRounds: doneCountsByTopic.get(topicId) || 0,
      });
    }
    return map;
  }, [matrixLogs, allTopics]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();

    const cells: Array<{ dateISO: string; day: number } | null> = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calendarMonth.year, calendarMonth.month, d);
      cells.push({ dateISO: formatDateISO(dt), day: d });
    }
    return cells;
  }, [calendarMonth]);

  const shiftMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const dt = new Date(prev.year, prev.month + delta, 1);
      return { year: dt.getFullYear(), month: dt.getMonth() };
    });
  };

  const selectedDateLogs = logsByDate[selectedCalDate] || [];
  const completedTodoCount = todos.filter((t) => t.completed).length;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 내부 스위치: 월간 회독 달력 | 할일 체크리스트 */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0E0E12] border border-white/[0.06] text-[11px] font-black">
        <button
          type="button"
          onClick={() => setSubTab("calendar")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            subTab === "calendar"
              ? "bg-[#FF5A36] text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>월간 회독 달력</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("todo")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            subTab === "todo"
              ? "bg-[#FF5A36] text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>
            할일 체크 ({completedTodoCount}/{todos.length})
          </span>
        </button>
      </div>

      {subTab === "calendar" ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-black text-white font-mono">
                {calendarMonth.year}.{String(calendarMonth.month + 1).padStart(2, "0")}
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
              <span className="text-rose-400">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-sky-400">토</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-11" />;
                const dayLogs = logsByDate[cell.dateISO] || [];
                const isSelected = selectedCalDate === cell.dateISO;
                const isToday = cell.dateISO === todayISO;

                return (
                  <button
                    key={cell.dateISO}
                    type="button"
                    onClick={() => setSelectedCalDate(cell.dateISO)}
                    className={`h-11 rounded-xl border p-1 flex flex-col items-center justify-between transition ${
                      isSelected
                        ? "bg-[#FF5A36]/20 border-[#FF5A36]"
                        : isToday
                          ? "bg-white/[0.06] border-white/30"
                          : "bg-[#111116] border-white/[0.04] hover:border-white/[0.15]"
                    }`}
                  >
                    <span
                      className={`text-[10.5px] font-mono font-bold ${
                        isToday ? "text-[#FF7A59] font-black" : "text-slate-200"
                      }`}
                    >
                      {cell.day}
                    </span>
                    <div className="flex items-center gap-0.5 flex-wrap justify-center max-w-full overflow-hidden">
                      {dayLogs.slice(0, 4).map((l, i) => {
                        const shade = getRoundColorStyle(
                          l.subjectColor,
                          Math.max(1, l.doneRounds)
                        );
                        return (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              l.status === "plan"
                                ? "opacity-45"
                                : l.status === "partial"
                                  ? "opacity-75 ring-1 ring-amber-400"
                                  : ""
                            }`}
                            style={{
                              backgroundColor:
                                l.status === "done"
                                  ? shade.backgroundColor
                                  : l.subjectColor,
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택 날짜 상세 기록 */}
          <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-white font-mono">
                {selectedCalDate} 회독·계획 내역 ({selectedDateLogs.length}건)
              </span>
              {onJumpToMatrix && (
                <button
                  type="button"
                  onClick={onJumpToMatrix}
                  className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
                >
                  매트릭스에서 편집 →
                </button>
              )}
            </div>

            {selectedDateLogs.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-4 text-center">
                이 날 기록되거나 계획된 목차가 없습니다.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDateLogs.map((log, i) => {
                  const shade = getRoundColorStyle(
                    log.subjectColor,
                    Math.max(1, log.doneRounds)
                  );
                  return (
                    <div
                      key={`${log.topicId}-${i}`}
                      className="p-2.5 rounded-xl bg-[#111116] border border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-black text-white shrink-0"
                          style={{ backgroundColor: log.subjectColor }}
                        >
                          {log.subjectTitle}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">
                            {log.topicTitle}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {log.keyword} · {log.minutes}분
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                            log.status === "done"
                              ? ""
                              : log.status === "partial"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-sky-500/15 text-sky-300"
                          }`}
                          style={
                            log.status === "done"
                              ? {
                                  backgroundColor: shade.backgroundColor,
                                  border: `1px solid ${shade.borderColor}`,
                                  color: shade.textColor,
                                }
                              : undefined
                          }
                        >
                          {log.status === "done"
                            ? `${Math.max(1, log.doneRounds)}R 완료`
                            : log.status === "partial"
                              ? "진행중"
                              : "계획"}
                        </span>
                        <Link
                          href={`/?topic=${encodeURIComponent(log.topicId)}`}
                          className="p-1.5 rounded-lg bg-[#FF5A36]/20 hover:bg-[#FF5A36] text-[#FF7A59] hover:text-white transition"
                          title="이 단원 타이머 바로 시작"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 달성 요약 */}
          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-white">파워 J 학습 체크리스트</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">
                완료 {completedTodoCount} / {todos.length}건 (타이머 홈과 실시간 연동)
              </div>
            </div>
            <div className="font-mono text-sm font-black text-[#FF7A59]">
              {todos.length > 0 ? Math.round((completedTodoCount / todos.length) * 100) : 0}%
            </div>
          </div>

          {/* 새 할일 추가 */}
          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2">
            <select
              value={newTodoTopicId}
              onChange={(e) => setNewTodoTopicId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#101015] border border-white/[0.08] text-[11px] font-bold text-slate-200"
            >
              {allTopics.map(({ subject, topic }) => (
                <option key={topic.id} value={topic.id}>
                  [{subject.shortTitle}] {topic.title}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTodo();
                }}
                placeholder="오늘 끝낼 학습 목표 입력..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
              />
              <button
                type="button"
                onClick={handleAddTodo}
                className="px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-black flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </div>
          </div>

          {/* 할일 목록 */}
          <div className="space-y-2">
            {todos.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#1A1A21] border border-dashed border-white/[0.12] text-center text-xs text-slate-400">
                등록된 할일이 없습니다. 위에서 오늘 끝낼 목표를 추가해 보세요.
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                    todo.completed
                      ? "bg-[#141419] border-white/[0.04] opacity-70"
                      : "bg-[#1A1A21] border-white/[0.08]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className="flex items-start gap-2.5 text-left min-w-0 flex-1"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 space-y-1">
                      <div
                        className={`text-xs font-bold leading-snug ${
                          todo.completed ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {todo.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className="px-1.5 py-0.2 rounded font-black text-white"
                          style={{ backgroundColor: todo.subjectColor }}
                        >
                          {todo.subjectTitle}
                        </span>
                        <span className="font-mono text-slate-500">{todo.dueDate}</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
