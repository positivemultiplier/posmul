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
  BookOpen,
  ShieldCheck,
  LogIn,
  LogOut,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  formatDateISO,
  flattenTopics,
  getRoundColorStyle,
  type MatrixCellStatus,
} from "@/data/study-textbooks";

type MoreViewMode = "todo" | "calendar" | "group" | "tools";

export default function StudyMoreHubPage() {
  const { isLoggedIn, profile, pmpBalance, pmcBalance, signOut } = useStudyAuth();
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

  // 날짜별 매트릭스 로그 맵 (달력 점/상세용 — 커스텀 색상 및 회독 농도 연동)
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
            <span>학습도구</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* PosMul 계정 연동 상태 요약 바 */}
        <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] flex items-center justify-between gap-2">
          {isLoggedIn ? (
            <>
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{profile.displayName} (PosMul 연동)</span>
                </div>
                <div className="text-[10.5px] font-mono text-amber-300">
                  {pmpBalance.toLocaleString()} PMP · {pmcBalance.toLocaleString()} PMC
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-950/50 text-[10.5px] font-bold text-slate-300 hover:text-rose-300 flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3 h-3" />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <>
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-black text-white">게스트 모드 (임시 브라우저 저장)</div>
                <div className="text-[10.5px] text-slate-400">
                  로그인 시 PosMul 지갑과 모든 학습 기록이 영구 동기화됩니다.
                </div>
              </div>
              <Link
                href="/auth/login?next=/study/more"
                className="px-3 py-1.5 rounded-xl bg-[#FF5A36] text-white text-[11px] font-black flex items-center gap-1 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인</span>
              </Link>
            </>
          )}
        </div>

        {/* 1. 할일 뷰 */}
        {activeView === "todo" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">내 오늘 학습 할일</div>
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
                  {selectedDateLogs.map((log, i) => {
                    const shade = getRoundColorStyle(
                      log.subjectColor,
                      Math.max(1, log.doneRounds)
                    );
                    return (
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 그룹 뷰 */}
        {activeView === "group" && (
          <YptGroupGrid myStudySeconds={13338} myConeEmoji="🦉" />
        )}

        {/* 4. 학습 도구 뷰 (단원 개념학습 · 20제 문제풀이 · 3초 O/X · AI 스캔) */}
        {activeView === "tools" && (
          <div className="space-y-3">
            <Link
              href="/study/books"
              className="p-4 rounded-2xl bg-gradient-to-r from-[#1A212B] to-[#1A1A21] border border-sky-500/45 hover:border-sky-400 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">69단원 개념·기출 학습센터</div>
                  <div className="text-[11px] text-slate-300">
                    교재 없이 앱에서 핵심 이론·암기수치·조문 O/X 즉시 학습
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </Link>

            <Link
              href="/study/solve"
              className="p-4 rounded-2xl bg-gradient-to-r from-[#241917] to-[#1A1A21] border border-[#FF5A36]/50 hover:border-[#FF5A36] flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/20 text-[#FF7A59] flex items-center justify-center">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">기출 1,400제 · 20제 실전풀이</div>
                  <div className="text-[11px] text-slate-300">
                    선지별 함정·법령 해설 제공 &amp; PosMul 계정 실시간 저장
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FF7A59]" />
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
                  <div className="text-xs font-black text-white">3초 컷 1줄 O/X 덱 (전범위 개방)</div>
                  <div className="text-[11px] text-slate-400">
                    교재 시리얼 없이 5,880선지 전 범위 및 약점 복습 (+PMP)
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/scan"
              className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] hover:border-[#FF5A36] flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">종이책 AI 비전 스캔 (선택)</div>
                  <div className="text-[11px] text-slate-400">
                    종이 시험지 보유 시 O·★·X 손글씨 마킹 자동 인식
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
