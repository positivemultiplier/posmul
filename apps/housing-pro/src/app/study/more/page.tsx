"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  CalendarDays,
  Users,
  Camera,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { formatDateISO, flattenTopics } from "@/data/study-textbooks";

type MoreViewMode = "todo" | "calendar" | "group" | "tools";

export default function StudyMoreHubPage() {
  const {
    todayISO,
    activeBook,
    subjects,
    matrixLogs,
    todos,
    toggleTodo,
    addTodo,
    deleteTodo,
  } = useStudyCurriculum();

  const [activeView, setActiveView] = useState<MoreViewMode>("todo");

  // 할일 입력 상태
  const allTopics = useMemo(() => flattenTopics(subjects), [subjects]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoTopicId, setNewTodoTopicId] = useState<string>("");

  // 달력 상태
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // 0-indexed month
  });
  const [selectedCalDate, setSelectedCalDate] = useState<string>(todayISO);

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      const view = params.get("view");
      if (view === "todo" || view === "calendar" || view === "group" || view === "tools") {
        setActiveView(view);
      }
    }
  }, []);

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
      dueDate: todayISO,
    });
    setNewTodoTitle("");
  };

  // 날짜별 매트릭스 로그 맵 (달력 점/상세용)
  const logsByDate = useMemo(() => {
    const map: Record<
      string,
      Array<{
        topicTitle: string;
        subjectTitle: string;
        subjectColor: string;
        keyword: string;
        status: "done" | "plan";
        minutes: number;
      }>
    > = {};

    for (const [key, cell] of Object.entries(matrixLogs)) {
      const [topicId, dateISO] = key.split("::");
      const found = allTopics.find((t) => t.topic.id === topicId);
      if (!found || !dateISO) continue;
      if (!map[dateISO]) map[dateISO] = [];
      map[dateISO].push({
        topicTitle: found.topic.title,
        subjectTitle: found.subject.shortTitle,
        subjectColor: found.subject.color,
        keyword: cell.keyword,
        status: cell.status,
        minutes: cell.minutes || found.topic.estimatedMinutes,
      });
    }
    return map;
  }, [matrixLogs, allTopics]);

  // 월간 달력 그리드 생성
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
    <MobileAppShell>
      {/* 헤더 + 4개 허브 세그먼트 (할일 · 달력 · 그룹 · 학습도구) */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#FF5A36]" />
            <h1 className="text-sm font-black text-white">할일 · 달력 · 그룹 · 도구</h1>
          </div>
          <span className="text-[10.5px] font-bold text-slate-400 truncate max-w-[160px]">
            {activeBook.badge}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#0E0E12] border border-white/[0.06] text-[10.5px] font-black">
          <button
            type="button"
            onClick={() => setActiveView("todo")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition ${
              activeView === "todo"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>할일</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("calendar")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition ${
              activeView === "calendar"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>달력</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("group")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition ${
              activeView === "group"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>그룹</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("tools")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition ${
              activeView === "tools"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>스캔·OX</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 1. 할일 뷰 */}
        {activeView === "todo" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">교재 연동 오늘 할일</div>
                <div className="text-[10.5px] text-slate-400 mt-0.5">
                  완료 {completedTodoCount} / {todos.length}건
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
              {todos.map((todo) => (
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
              ))}
            </div>
          </div>
        )}

        {/* 2. 월간 달력 뷰 (매트릭스 기록과 100% 연동) */}
        {activeView === "calendar" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-black text-white font-mono">
                  {calendarMonth.year}.{String(calendarMonth.month + 1).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300"
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
                        {dayLogs.slice(0, 4).map((l, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              l.status === "plan" ? "opacity-45" : ""
                            }`}
                            style={{ backgroundColor: l.subjectColor }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택 날짜 상세 기록 */}
            <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-white font-mono">{selectedCalDate} 학습 내역</span>
                <Link
                  href="/study/planner"
                  className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
                >
                  매트릭스에서 편집
                </Link>
              </div>

              {selectedDateLogs.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-3 text-center">
                  이 날 기록되거나 계획된 목차가 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDateLogs.map((log, i) => (
                    <div
                      key={i}
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
                            키워드: {log.keyword} · {log.minutes}분
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          log.status === "done"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {log.status === "done" ? "완료" : "계획"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 그룹 뷰 */}
        {activeView === "group" && (
          <YptGroupGrid myStudySeconds={13338} myConeEmoji="🦉" />
        )}

        {/* 4. 학습 도구 뷰 (20제 지문체크 · 3초 O/X · AI 스캔) */}
        {activeView === "tools" && (
          <div className="space-y-3">
            <Link
              href="/study/solve"
              className="p-4 rounded-2xl bg-gradient-to-r from-[#241917] to-[#1A1A21] border border-[#FF5A36]/50 hover:border-[#FF5A36] flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/20 text-[#FF7A59] flex items-center justify-center">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">20제 문제·지문 O/★/X 체크</div>
                  <div className="text-[11px] text-slate-300">
                    1문제마다 즉시 저장 · 종이책 병행 & 이동중 빠른 복습
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FF7A59]" />
            </Link>

            <Link
              href="/scan"
              className="p-4 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/40 hover:border-[#FF5A36] flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">종이책 AI 비전 스캔</div>
                  <div className="text-[11px] text-slate-400">
                    시험지/교재 O·★·X 손글씨 마킹 자동 채점 (+40 PMP)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/study/ox"
              className="p-4 rounded-2xl bg-[#1A1A21] border border-sky-500/40 hover:border-sky-400 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">3초 컷 1줄 O/X 덱</div>
                  <div className="text-[11px] text-slate-400">
                    1~5회독 240선지 및 스캔 ★/X 약점 복습
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
