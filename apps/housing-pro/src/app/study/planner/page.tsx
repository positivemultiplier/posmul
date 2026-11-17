"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  Play,
  ChevronsDownUp,
  ChevronsUpDown,
  X,
  FileCheck2,
  ArrowRight,
  CalendarPlus,
  ListTodo,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import {
  addDaysISO,
  diffDaysISO,
  type MatrixCellLog,
  type MatrixCellStatus,
  type StudySubjectNode,
  type StudyTopicNode,
} from "@/data/study-textbooks";

// 열품타 하루 표준 24시간 (05시 ~ 익일 04시) — 보조 일일 타임테이블용
const YPT_HOURS = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4,
];

interface TimetableBlock {
  color: string;
  label: string;
}

function createInitialTimetableGrid(): Record<string, TimetableBlock> {
  return {};
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

interface EditingCellState {
  subject: StudySubjectNode;
  unitTitle: string;
  topic: StudyTopicNode;
  dateISO: string;
  status: MatrixCellStatus;
  keyword: string;
  minutes: number;
  planSpanDays: 1 | 2 | 3;
  carryOverTomorrow: boolean;
}

export default function StudyPlannerMatrixPage() {
  const {
    todayISO,
    examDate,
    activeBook,
    subjects,
    matrixLogs,
    chapterTotals,
    collapsedSubjectIds,
    upsertMatrixCell,
    deleteMatrixCell,
    scheduleMultiDayPlan,
    carryOverTopicToNextDay,
    toggleSubjectCollapse,
    setAllSubjectsCollapsed,
  } = useStudyCurriculum();

  const [viewMode, setViewMode] = useState<"matrix" | "diary">("matrix");
  const [stageFilter, setStageFilter] = useState<"ALL" | "1차" | "2차">("ALL");
  const [windowStartOffset, setWindowStartOffset] = useState<number>(-12); // 오늘 기준 -12일 ~ +5일 (18일치)
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [selectedPaletteTopicId, setSelectedPaletteTopicId] = useState<string | null>(null);

  // 보조: 일일 타임테이블 상태
  const [timetableGrid, setTimetableGrid] = useState<Record<string, TimetableBlock>>(
    () => createInitialTimetableGrid()
  );

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      if (params.get("tab") === "diary") {
        setViewMode("diary");
      }
    }
  }, []);

  // 시험일까지 남은 일수 (D-Day)
  const dDayToExam = useMemo(() => diffDaysISO(todayISO, examDate), [todayISO, examDate]);

  // 매트릭스 가로 날짜 열 (18일 윈도우)
  const dateColumns = useMemo(() => {
    const cols: Array<{
      dateISO: string;
      mmdd: string;
      weekday: string;
      dayOfWeek: number;
      dDayLabel: string;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    for (let i = 0; i < 18; i++) {
      const offset = windowStartOffset + i;
      const dateISO = addDaysISO(todayISO, offset);
      const [y, m, d] = dateISO.split("-").map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      const dayOfWeek = dt.getDay();
      const dRemaining = diffDaysISO(dateISO, examDate);
      const dDayLabel =
        dRemaining === 0 ? "D-DAY" : dRemaining > 0 ? `D-${dRemaining}` : `D+${Math.abs(dRemaining)}`;

      cols.push({
        dateISO,
        mmdd: `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`,
        weekday: WEEKDAY_KO[dayOfWeek],
        dayOfWeek,
        dDayLabel,
        isToday: dateISO === todayISO,
        isFuture: dateISO > todayISO,
      });
    }
    return cols;
  }, [todayISO, examDate, windowStartOffset]);

  // 차수 필터링된 과목 목록
  const visibleSubjects = useMemo(() => {
    if (stageFilter === "ALL") return subjects;
    return subjects.filter((s) => s.examStage === stageFilter);
  }, [subjects, stageFilter]);

  // 전체 목차 수 및 누적 완료 통계
  const summaryStats = useMemo(() => {
    let totalTopics = 0;
    let coveredTopics = 0;
    let totalDoneCells = 0;
    let totalPartialCells = 0;
    let totalPlanCells = 0;

    for (const subj of visibleSubjects) {
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          totalTopics += 1;
          let topicDoneCount = 0;
          for (const [key, cell] of Object.entries(matrixLogs)) {
            if (key.startsWith(`${topic.id}::`)) {
              if (cell.status === "done") {
                topicDoneCount += 1;
                totalDoneCells += 1;
              } else if (cell.status === "partial") {
                totalPartialCells += 1;
              } else {
                totalPlanCells += 1;
              }
            }
          }
          if (topicDoneCount > 0) coveredTopics += 1;
        }
      }
    }

    return {
      totalTopics,
      coveredTopics,
      totalDoneCells,
      totalPartialCells,
      totalPlanCells,
      coveragePct: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0,
    };
  }, [visibleSubjects, matrixLogs]);

  // 목차 매트릭스에서 '학습계획(plan)' 또는 '진행중(partial)'으로 선택된 항목만 추출 (일정표 전용)
  const plannedScheduleItems = useMemo(() => {
    const items: Array<{
      key: string;
      dateISO: string;
      subject: StudySubjectNode;
      unitTitle: string;
      topic: StudyTopicNode;
      cell: MatrixCellLog;
    }> = [];

    for (const subject of subjects) {
      for (const unit of subject.units) {
        for (const topic of unit.topics) {
          const prefix = `${topic.id}::`;
          for (const [key, cell] of Object.entries(matrixLogs)) {
            if (
              key.startsWith(prefix) &&
              (cell.status === "plan" || cell.status === "partial")
            ) {
              const dateISO = key.slice(prefix.length);
              items.push({
                key,
                dateISO,
                subject,
                unitTitle: unit.title,
                topic,
                cell,
              });
            }
          }
        }
      }
    }

    return items.sort((a, b) => {
      if (a.dateISO !== b.dateISO) return a.dateISO.localeCompare(b.dateISO);
      return (a.topic.globalOrder ?? 999) - (b.topic.globalOrder ?? 999);
    });
  }, [subjects, matrixLogs]);

  // 타임테이블 팔레트용: 학습계획으로 선택된 고유 단원 목록
  const plannedTopicPalette = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      topicId: string;
      subject: StudySubjectNode;
      topic: StudyTopicNode;
    }> = [];
    for (const item of plannedScheduleItems) {
      if (seen.has(item.topic.id)) continue;
      seen.add(item.topic.id);
      list.push({
        topicId: item.topic.id,
        subject: item.subject,
        topic: item.topic,
      });
    }
    return list;
  }, [plannedScheduleItems]);

  const activePaletteItem = useMemo(() => {
    if (plannedTopicPalette.length === 0) return null;
    return (
      plannedTopicPalette.find((p) => p.topicId === selectedPaletteTopicId) ||
      plannedTopicPalette[0]
    );
  }, [plannedTopicPalette, selectedPaletteTopicId]);

  // 목차별 누적 회독(완료 셀 수) 계산
  const getTopicDoneCount = (topicId: string) => {
    let count = 0;
    for (const [key, cell] of Object.entries(matrixLogs)) {
      if (key.startsWith(`${topicId}::`) && cell.status === "done") {
        count += 1;
      }
    }
    return count;
  };

  // 과목이 접혔을 때 날짜별 요약(완료 수 / 진행중 수 / 계획 수) 계산
  const getSubjectDaySummary = (subject: StudySubjectNode, dateISO: string) => {
    let doneCount = 0;
    let partialCount = 0;
    let planCount = 0;
    let firstKeyword = "";

    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        const cell = matrixLogs[makeMatrixKey(topic.id, dateISO)];
        if (cell) {
          if (cell.status === "done") {
            doneCount += 1;
            if (!firstKeyword) firstKeyword = cell.keyword;
          } else if (cell.status === "partial") {
            partialCount += 1;
            if (!firstKeyword) firstKeyword = cell.keyword;
          } else {
            planCount += 1;
            if (!firstKeyword) firstKeyword = cell.keyword;
          }
        }
      }
    }
    return { doneCount, partialCount, planCount, firstKeyword };
  };

  const allCollapsed =
    visibleSubjects.length > 0 &&
    visibleSubjects.every((s) => collapsedSubjectIds.includes(s.id));

  const openCellEditor = (
    subject: StudySubjectNode,
    unitTitle: string,
    topic: StudyTopicNode,
    dateISO: string
  ) => {
    const existing = matrixLogs[makeMatrixKey(topic.id, dateISO)];
    const defaultStatus: MatrixCellStatus = dateISO > todayISO ? "plan" : "done";
    setEditingCell({
      subject,
      unitTitle,
      topic,
      dateISO,
      status: existing?.status ?? defaultStatus,
      keyword: existing?.keyword ?? topic.defaultKeyword,
      minutes: existing?.minutes ?? topic.estimatedMinutes,
      planSpanDays: 1,
      carryOverTomorrow: true,
    });
  };

  const handleSaveEditingCell = () => {
    if (!editingCell) return;
    const cleanKeyword = editingCell.keyword.trim() || editingCell.topic.defaultKeyword;

    if (editingCell.status === "plan") {
      scheduleMultiDayPlan(
        editingCell.topic.id,
        editingCell.dateISO,
        editingCell.planSpanDays,
        cleanKeyword,
        editingCell.minutes
      );
    } else if (editingCell.status === "partial" && editingCell.carryOverTomorrow) {
      carryOverTopicToNextDay(
        editingCell.topic.id,
        editingCell.dateISO,
        cleanKeyword,
        editingCell.minutes
      );
    } else {
      upsertMatrixCell(editingCell.topic.id, editingCell.dateISO, {
        status: editingCell.status,
        keyword: cleanKeyword,
        minutes: editingCell.minutes,
      });
    }
    setEditingCell(null);
  };

  const handleDeleteEditingCell = () => {
    if (!editingCell) return;
    deleteMatrixCell(editingCell.topic.id, editingCell.dateISO);
    setEditingCell(null);
  };

  // 타임테이블 총 순공시간
  const totalDiaryMinutes = useMemo(
    () => Object.keys(timetableGrid).length * 10,
    [timetableGrid]
  );

  return (
    <MobileAppShell>
      {/* 상단 플래너 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
              <h1 className="text-sm font-black text-white truncate">
                전 범위 회독 플래너
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/40 font-mono text-[10px] font-black text-[#FF7A59] shrink-0">
                {dDayToExam >= 0 ? `D-${dDayToExam}` : `D+${Math.abs(dDayToExam)}`}
              </span>
            </div>

            {/* 적용 중인 교재 칩 -> 클릭 시 교재 탭 이동 */}
            <Link
              href="/study/books"
              className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300 hover:text-white transition max-w-full"
            >
              <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{activeBook.title}</span>
              <span className="text-[9.5px] text-[#FF7A59] underline shrink-0">교재변경</span>
            </Link>
          </div>

          {/* 매트릭스 / 일정표 전환 */}
          <div className="flex items-center bg-[#0D0D11] p-0.5 rounded-xl border border-white/[0.08] text-[10px] font-black shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`px-2.5 py-1.5 rounded-lg transition ${viewMode === "matrix" ? "bg-[#FF5A36] text-white" : "text-slate-400 hover:text-white"
                }`}
            >
              목차 매트릭스
            </button>
            <button
              type="button"
              onClick={() => setViewMode("diary")}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${viewMode === "diary" ? "bg-[#FF5A36] text-white" : "text-slate-400 hover:text-white"
                }`}
            >
              <span>일정표</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  viewMode === "diary"
                    ? "bg-white/20 text-white"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {plannedScheduleItems.length}
              </span>
            </button>
          </div>
        </div>

        {viewMode === "matrix" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* 1차/2차 필터 & 일괄 접기/펴기 */}
            <div className="flex items-center gap-1">
              {(["ALL", "1차", "2차"] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${stageFilter === stage
                    ? "bg-white text-slate-950 border-white"
                    : "bg-[#0E0E12] text-slate-400 border-white/[0.08] hover:text-white"
                    }`}
                >
                  {stage === "ALL" ? "전체" : stage}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setAllSubjectsCollapsed(!allCollapsed)}
                className="ml-1 px-2 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition"
              >
                {allCollapsed ? (
                  <>
                    <ChevronsUpDown className="w-3 h-3 text-[#FF7A59]" />
                    <span>모두 펴기</span>
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="w-3 h-3 text-slate-400" />
                    <span>모두 접기</span>
                  </>
                )}
              </button>
            </div>

            {/* 날짜 윈도우 이동 */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev - 7)}
                className="p-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="이전 7일"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset(-12)}
                className="px-2 py-1 rounded-lg bg-[#0E0E12] border border-[#FF5A36]/40 text-[#FF7A59] hover:bg-[#FF5A36]/15"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev + 7)}
                className="p-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="다음 7일"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {viewMode === "matrix" ? (
        <div className="flex-1 flex flex-col">
          {/* 상단 요약 바 & 범례 */}
          <div className="px-4 py-2.5 bg-[#131318] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <div className="flex items-center gap-3 font-bold">
              <span className="text-slate-300">
                범위 커버{" "}
                <strong className="font-mono text-white">
                  {summaryStats.coveredTopics}/{summaryStats.totalTopics}
                </strong>
                <span className="text-[#FF7A59] font-mono ml-1">({summaryStats.coveragePct}%)</span>
              </span>
              <span className="text-slate-400">
                완료 <strong className="text-emerald-300 font-mono">{summaryStats.totalDoneCells}</strong> · 진행중{" "}
                <strong className="text-amber-300 font-mono">{summaryStats.totalPartialCells}</strong> · 계획{" "}
                <strong className="text-sky-300 font-mono">{summaryStats.totalPlanCells}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                기출DB 자동연동
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FF5A36]" />
                <span>완료(1R)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border border-amber-400 bg-amber-500/30" />
                <span>진행중</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#FF5A36] bg-[#FF5A36]/20" />
                <span>계획</span>
              </span>
              <span className="text-slate-500">셀 탭=입력</span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* 엑셀 스타일 계층 목차 × D-Day 날짜 타임라인 매트릭스 */}
          {/* ========================================================== */}
          <div className="flex-1 overflow-x-auto bg-[#0D0D11]">
            <table className="border-collapse w-max min-w-full text-left select-none">
              {/* 상단 D-Day + 날짜 고정 헤더 */}
              <thead className="sticky top-0 z-30 bg-[#16161D]">
                <tr>
                  <th className="sticky left-0 z-40 w-[166px] sm:w-[238px] min-w-[166px] sm:min-w-[238px] bg-[#181820] border-b border-r border-white/[0.12] px-2.5 py-2 align-bottom">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-300">
                      <span>차수 · 과목 · 목차</span>
                      <span className="text-slate-500 font-mono">누적</span>
                    </div>
                  </th>
                  {dateColumns.map((col) => (
                    <th
                      key={col.dateISO}
                      className={`w-[58px] min-w-[58px] border-b border-r border-white/[0.08] px-1 py-1.5 text-center align-middle ${col.isToday
                        ? "bg-[#FF5A36]/20 border-x-[#FF5A36]/60"
                        : col.isFuture
                          ? "bg-[#13131A]"
                          : "bg-[#16161D]"
                        }`}
                    >
                      <div
                        className={`text-[9px] font-mono font-black leading-none ${col.isToday ? "text-[#FF7A59]" : "text-slate-400"
                          }`}
                      >
                        {col.dDayLabel}
                      </div>
                      <div
                        className={`text-[10px] font-mono font-bold mt-1 leading-none ${col.isToday
                          ? "text-white"
                          : col.dayOfWeek === 0
                            ? "text-rose-400"
                            : col.dayOfWeek === 6
                              ? "text-sky-400"
                              : "text-slate-300"
                          }`}
                      >
                        {col.mmdd}
                      </div>
                      <div className="text-[8.5px] text-slate-500 mt-0.5 leading-none">
                        {col.isToday ? "오늘" : col.weekday}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleSubjects.map((subject) => {
                  const isCollapsed = collapsedSubjectIds.includes(subject.id);
                  const subjectTopicCount = subject.units.reduce(
                    (acc, u) => acc + u.topics.length,
                    0
                  );
                  const subjectTotalDone = subject.units.reduce(
                    (acc, u) =>
                      acc +
                      u.topics.reduce((tAcc, t) => tAcc + getTopicDoneCount(t.id), 0),
                    0
                  );

                  return (
                    <SubjectRowsGroup
                      key={subject.id}
                      subject={subject}
                      isCollapsed={isCollapsed}
                      subjectTopicCount={subjectTopicCount}
                      subjectTotalDone={subjectTotalDone}
                      dateColumns={dateColumns}
                      matrixLogs={matrixLogs}
                      chapterTotals={chapterTotals}
                      getTopicDoneCount={getTopicDoneCount}
                      getSubjectDaySummary={getSubjectDaySummary}
                      onToggleCollapse={() => toggleSubjectCollapse(subject.id)}
                      onCellClick={openCellEditor}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* 플래너 일정표: 목차 매트릭스에서 '학습계획'으로 선택한 단원만 노출 */
        /* ========================================================== */
        <div className="px-4 py-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <ListTodo className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span>학습계획 일정표</span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                목차 매트릭스에서 <strong className="text-sky-300">학습계획</strong> 또는{" "}
                <strong className="text-amber-300">진행중</strong>으로 선택한 단원만 표시됩니다.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 font-mono text-[11px] font-black text-sky-300 shrink-0">
              {plannedScheduleItems.length}건 예정
            </span>
          </div>

          {plannedScheduleItems.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#1A1A21] border border-dashed border-white/[0.14] text-center space-y-3">
              <CalendarPlus className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-black text-white">
                  목차 매트릭스에서 학습계획으로 선택한 단원이 없습니다.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  목차 매트릭스에서 날짜 셀을 탭해 <strong>학습 계획(1~3일 분할)</strong>을 지정하면
                  이곳 일정표와 홈 타이머에 자동으로 노출됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-black transition"
              >
                <span>목차 매트릭스에서 계획 선택하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {/* 선택된 학습계획 단원 일정 카드 목록 */}
              <div className="space-y-2">
                {plannedScheduleItems.map((item) => {
                  const isToday = item.dateISO === todayISO;
                  const isTomorrow = item.dateISO === addDaysISO(todayISO, 1);
                  const isOverdue = item.dateISO < todayISO;
                  const [y, m, d] = item.dateISO.split("-").map(Number);
                  const dt = new Date(y, (m || 1) - 1, d || 1);
                  const weekdayLabel = WEEKDAY_KO[dt.getDay()];
                  const dateLabel = isToday
                    ? "오늘"
                    : isTomorrow
                      ? "내일"
                      : `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}(${weekdayLabel})`;
                  const isPartial = item.cell.status === "partial";
                  const estMinutes = item.cell.minutes ?? item.topic.estimatedMinutes;

                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-black ${
                                isToday
                                  ? "bg-[#FF5A36]/20 text-[#FF7A59] border border-[#FF5A36]/40"
                                  : isOverdue
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                    : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                              }`}
                            >
                              {dateLabel}
                              {isOverdue ? " · 지연" : ""}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[9.5px] font-black text-white"
                              style={{ backgroundColor: item.subject.color }}
                            >
                              {item.subject.examStage} · {item.subject.shortTitle}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                                isPartial
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-white/[0.06] text-slate-300"
                              }`}
                            >
                              {isPartial ? "◐ 진행중" : "학습계획"} · {item.cell.keyword}
                            </span>
                          </div>

                          <div className="text-xs font-black text-white flex items-center gap-1 truncate">
                            {item.topic.topicNo && (
                              <span
                                className="font-mono shrink-0"
                                style={{ color: item.subject.color }}
                              >
                                {item.topic.topicNo}.
                              </span>
                            )}
                            <span className="truncate">{item.topic.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.unitTitle} · 목표 {estMinutes}분
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        <Link
                          href={`/?topic=${item.topic.id}`}
                          className="py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10px] font-black flex items-center justify-center gap-1 transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>타이머</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            carryOverTopicToNextDay(
                              item.topic.id,
                              item.dateISO,
                              item.cell.keyword,
                              estMinutes
                            )
                          }
                          className="py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[10px] font-black transition"
                          title="당일은 진행중으로 남기고 내일 날짜로 이어서 학습계획 이월"
                        >
                          내일이월
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            upsertMatrixCell(item.topic.id, item.dateISO, {
                              status: "done",
                              keyword: item.cell.keyword,
                              minutes: estMinutes,
                            })
                          }
                          className="py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[10px] font-black transition"
                        >
                          완료(1R)
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMatrixCell(item.topic.id, item.dateISO)}
                          className="py-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-950/60 border border-white/[0.08] text-slate-300 hover:text-rose-300 text-[10px] font-bold transition"
                        >
                          해제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 선택된 학습계획 단원 전용 일일 10분 타임테이블 */}
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                    <span>계획 단원 시간 배분표 (10분 단위)</span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#FF7A59]">
                    {String(Math.floor(totalDiaryMinutes / 60)).padStart(2, "0")}H{" "}
                    {String(totalDiaryMinutes % 60).padStart(2, "0")}M
                  </span>
                </div>

                {/* 학습계획 단원 팔레트 (계획된 단원만 노출) */}
                <div className="flex flex-wrap gap-1.5">
                  {plannedTopicPalette.map((p) => {
                    const isSelected = activePaletteItem?.topicId === p.topicId;
                    return (
                      <button
                        key={p.topicId}
                        type="button"
                        onClick={() => setSelectedPaletteTopicId(p.topicId)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 transition ${
                          isSelected
                            ? "text-white border-white shadow"
                            : "bg-[#111116] text-slate-300 border-white/[0.08] hover:border-white/25"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: p.subject.color }
                            : undefined
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: isSelected ? "#FFFFFF" : p.subject.color,
                          }}
                        />
                        <span className="truncate max-w-[160px]">
                          {p.topic.topicNo ? `${p.topic.topicNo}. ` : ""}
                          {p.topic.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-[36px_1fr] gap-2 items-center text-[10px] font-mono font-bold text-slate-500 pb-1 border-b border-white/[0.06]">
                  <div className="text-center">시</div>
                  <div className="grid grid-cols-6 gap-1 text-center">
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                    <span>60</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {YPT_HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-[36px_1fr] gap-2 items-center">
                      <div className="font-mono text-[10.5px] font-bold text-slate-400 text-center">
                        {String(hour).padStart(2, "0")}
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {[0, 1, 2, 3, 4, 5].map((slot) => {
                          const key = `${hour}-${slot}`;
                          const cell = timetableGrid[key];
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => {
                                if (!activePaletteItem) return;
                                setTimetableGrid((prev) => {
                                  const copy = { ...prev };
                                  if (copy[key]) delete copy[key];
                                  else
                                    copy[key] = {
                                      color: activePaletteItem.subject.color,
                                      label: activePaletteItem.topic.title,
                                    };
                                  return copy;
                                });
                              }}
                              title={cell ? cell.label : activePaletteItem?.topic.title}
                              className={`h-4 rounded-[3px] transition ${
                                cell
                                  ? "opacity-95 hover:opacity-100"
                                  : "bg-[#111115] border border-white/[0.04] hover:border-white/[0.15]"
                              }`}
                              style={cell ? { backgroundColor: cell.color } : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 매트릭스 셀 편집 바텀시트 / 모달 */}
      {/* ========================================================== */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-[420px] rounded-3xl bg-[#181820] border border-white/[0.12] p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                    style={{ backgroundColor: editingCell.subject.color }}
                  >
                    {editingCell.subject.examStage} · {editingCell.subject.shortTitle}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {editingCell.dateISO}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white truncate">
                  {editingCell.unitTitle} &gt; {editingCell.topic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="p-1.5 rounded-full bg-white/[0.06] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 상태 선택: 완료 vs 진행중(부분) vs 계획 */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, status: "done" })}
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${editingCell.status === "done"
                    ? "text-white border-white/40 shadow-md"
                    : "bg-[#111116] text-slate-400 border-white/[0.06]"
                    }`}
                  style={
                    editingCell.status === "done"
                      ? { backgroundColor: editingCell.subject.color }
                      : undefined
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>완료 (1R)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, status: "partial" })}
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${editingCell.status === "partial"
                    ? "bg-amber-500/20 text-amber-200 border-amber-400"
                    : "bg-[#111116] text-slate-400 border-white/[0.06]"
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>진행중(분할)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, status: "plan" })}
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${editingCell.status === "plan"
                    ? "bg-sky-500/20 text-sky-200 border-sky-400 border-dashed"
                    : "bg-[#111116] text-slate-400 border-white/[0.06]"
                    }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>학습 계획</span>
                </button>
              </div>

              {editingCell.status === "plan" && (
                <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/25 space-y-1.5">
                  <div className="text-[10.5px] font-bold text-sky-200 flex items-center justify-between">
                    <span>며칠 동안 나누어 학습할까요? (다일 계획 분할)</span>
                    <span className="font-mono text-[10px] text-sky-300">
                      {editingCell.planSpanDays}일 연속
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([1, 2, 3] as const).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setEditingCell({ ...editingCell, planSpanDays: days })}
                        className={`py-1.5 rounded-lg text-[10.5px] font-black border transition ${
                          editingCell.planSpanDays === days
                            ? "bg-sky-500 text-white border-sky-400"
                            : "bg-[#101015] text-slate-300 border-white/[0.08] hover:border-sky-500/40"
                        }`}
                      >
                        {days === 1 ? "1일 완성" : `${days}일 연속 분할`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editingCell.status === "partial" && (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/25 space-y-1.5">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-[10.5px] font-bold text-amber-200">
                      내일({addDaysISO(editingCell.dateISO, 1)})에 &apos;이어서학습&apos; 계획 자동 배치
                    </span>
                    <input
                      type="checkbox"
                      checked={editingCell.carryOverTomorrow}
                      onChange={(e) =>
                        setEditingCell({ ...editingCell, carryOverTomorrow: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-400 rounded"
                    />
                  </label>
                  <p className="text-[9.5px] text-amber-200/75 leading-snug">
                    진행중 상태는 순공시간에만 합산되며, 단원을 최종 <strong>완료</strong> 처리할 때만 1회독(+1R)으로 집계됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 셀 키워드 입력 + 퀵 칩 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">
                셀 표시 키워드 (한눈에 볼 요약 단어)
              </label>
              <input
                type="text"
                maxLength={14}
                value={editingCell.keyword}
                onChange={(e) =>
                  setEditingCell({ ...editingCell, keyword: e.target.value })
                }
                placeholder="예: 간선시설, p.48, O/X"
                className="w-full px-3 py-2.5 rounded-xl bg-[#101015] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  editingCell.topic.defaultKeyword,
                  "기본회독",
                  "기출풀이",
                  "O/X오답",
                  "암기점검",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditingCell({ ...editingCell, keyword: preset })}
                    className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-[10px] font-bold text-slate-300"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 학습 시간 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-300">학습 시간</span>
              <div className="flex items-center gap-1">
                {[20, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setEditingCell({ ...editingCell, minutes: min })}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold transition ${editingCell.minutes === min
                      ? "bg-[#FF5A36] text-white"
                      : "bg-[#101015] text-slate-400 border border-white/[0.06]"
                      }`}
                  >
                    {min}분
                  </button>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteEditingCell}
                className="px-3 py-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 hover:bg-rose-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>비우기</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEditingCell}
                className="py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-xs transition"
              >
                매트릭스에 저장
              </button>
            </div>

            <div className="space-y-1.5">
              {editingCell.topic.chapterCode && (
                <Link
                  href={`/study/solve?chapter=${editingCell.topic.chapterCode}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1.5 border border-emerald-500/35 transition"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>이 단원 기출 20제 바로 풀기</span>
                </Link>
              )}
              <Link
                href={`/?topic=${editingCell.topic.id}`}
                className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-white/[0.06]"
              >
                <Play className="w-3 h-3 text-[#FF5A36] fill-[#FF5A36]" />
                <span>이 목차로 지금 집중 타이머 바로 시작</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
}

interface SubjectRowsGroupProps {
  subject: StudySubjectNode;
  isCollapsed: boolean;
  subjectTopicCount: number;
  subjectTotalDone: number;
  dateColumns: Array<{ dateISO: string; isToday: boolean }>;
  matrixLogs: Record<string, { keyword: string; status: MatrixCellStatus; minutes?: number }>;
  chapterTotals: Record<string, { solvedCount: number; correctCount: number }>;
  getTopicDoneCount: (topicId: string) => number;
  getSubjectDaySummary: (
    subject: StudySubjectNode,
    dateISO: string
  ) => { doneCount: number; partialCount: number; planCount: number; firstKeyword: string };
  onToggleCollapse: () => void;
  onCellClick: (
    subject: StudySubjectNode,
    unitTitle: string,
    topic: StudyTopicNode,
    dateISO: string
  ) => void;
}

function SubjectRowsGroup({
  subject,
  isCollapsed,
  subjectTopicCount,
  subjectTotalDone,
  dateColumns,
  matrixLogs,
  chapterTotals,
  getTopicDoneCount,
  getSubjectDaySummary,
  onToggleCollapse,
  onCellClick,
}: SubjectRowsGroupProps) {
  return (
    <>
      {/* 과목 그룹 헤더 행 (접기/펴기 버튼 + 접힘 시 날짜별 요약 셀) */}
      <tr className="border-b border-white/[0.1]">
        <td
          className="sticky left-0 z-20 border-r border-white/[0.12] px-2 py-2 bg-[#16161F]"
          style={{ boxShadow: `inset 4px 0 0 ${subject.color}` }}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between gap-1.5 text-left group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white shrink-0" />
              )}
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shrink-0"
                style={{ backgroundColor: subject.color }}
              >
                {subject.examStage}
              </span>
              <span className="text-[11px] font-black text-white truncate group-hover:underline">
                {subject.title}
              </span>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-slate-400 shrink-0">
              {isCollapsed ? `${subjectTopicCount}목차 · ` : ""}
              <strong style={{ color: subject.color }}>{subjectTotalDone}R</strong>
            </span>
          </button>
        </td>

        {/* 접힌 상태에서는 과목 헤더 줄에 날짜별 압축 요약 표시, 펼친 상태에서는 은은한 과목 밴드 */}
        {dateColumns.map((col) => {
          const summary = getSubjectDaySummary(subject, col.dateISO);
          const hasDone = summary.doneCount > 0;
          const hasPartial = summary.partialCount > 0;
          const hasPlan = summary.planCount > 0;

          return (
            <td
              key={col.dateISO}
              className={`border-r border-white/[0.06] px-0.5 py-1 text-center align-middle ${col.isToday ? "bg-[#FF5A36]/[0.06]" : "bg-[#13131A]"
                }`}
            >
              {isCollapsed ? (
                hasDone ? (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-full py-1 rounded text-[9px] font-black text-white truncate px-0.5"
                    style={{ backgroundColor: subject.color }}
                    title={`${subject.title} (${col.dateISO}): ${summary.doneCount}개 완료`}
                  >
                    {summary.doneCount > 1 ? `${summary.doneCount}건` : summary.firstKeyword}
                  </button>
                ) : hasPartial ? (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-full py-1 rounded border border-amber-400 text-[9px] font-bold text-amber-200 bg-amber-500/20 truncate px-0.5"
                    title={`${subject.title} (${col.dateISO}): ${summary.partialCount}개 진행중`}
                  >
                    ◐진행{summary.partialCount}
                  </button>
                ) : hasPlan ? (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-full py-1 rounded border border-dashed text-[9px] font-bold truncate px-0.5"
                    style={{
                      borderColor: subject.color,
                      color: subject.color,
                      backgroundColor: `${subject.color}1F`,
                    }}
                  >
                    계획{summary.planCount}
                  </button>
                ) : (
                  <span className="text-[9px] text-slate-700">·</span>
                )
              ) : (
                <div
                  className="h-2 w-full rounded-sm opacity-25"
                  style={{ backgroundColor: subject.color }}
                />
              )}
            </td>
          );
        })}
      </tr>

      {/* 펼쳐진 상태: 대단원(편제) + 49개 세부 목차 행 렌더링 */}
      {!isCollapsed &&
        subject.units.map((unit) =>
          unit.topics.map((topic, tIdx) => {
            const doneCount = getTopicDoneCount(topic.id);
            const chapterStat = topic.chapterCode ? chapterTotals[topic.chapterCode] : undefined;
            const solvedCount = chapterStat?.solvedCount ?? 0;

            return (
              <tr
                key={topic.id}
                className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
              >
                {/* 좌측 고정 목차명 */}
                <td
                  className="sticky left-0 z-10 bg-[#111116] border-r border-white/[0.12] px-2.5 py-1.5"
                  style={{ boxShadow: `inset 4px 0 0 ${subject.color}88` }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      {tIdx === 0 && (
                        <div className="text-[8.5px] font-extrabold text-slate-500 truncate leading-tight mb-0.5">
                          {unit.title}
                        </div>
                      )}
                      <div className="flex items-center gap-1 min-w-0">
                        {topic.topicNo && (
                          <span
                            className="text-[9.5px] font-mono font-black shrink-0"
                            style={{ color: subject.color }}
                          >
                            {topic.topicNo}.
                          </span>
                        )}
                        <span className="text-[10.5px] font-bold text-slate-200 truncate leading-tight">
                          {topic.title}
                        </span>
                      </div>
                      {typeof topic.questionCount === "number" && (
                        <div className="text-[8.5px] font-mono text-slate-400 leading-tight mt-0.5">
                          <span className={solvedCount > 0 ? "text-emerald-300 font-bold" : ""}>
                            {solvedCount}
                          </span>
                          <span>/{topic.questionCount}제</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0 ${doneCount === 0
                        ? "bg-white/[0.04] text-slate-600"
                        : "text-white"
                        }`}
                      style={
                        doneCount > 0
                          ? { backgroundColor: `${subject.color}33`, color: subject.color }
                          : undefined
                      }
                    >
                      {doneCount}R
                    </span>
                  </div>
                </td>

                {/* 날짜별 교차 셀 */}
                {dateColumns.map((col) => {
                  const cell = matrixLogs[makeMatrixKey(topic.id, col.dateISO)];

                  return (
                    <td
                      key={col.dateISO}
                      className={`border-r border-white/[0.05] p-0.5 text-center align-middle ${col.isToday ? "bg-[#FF5A36]/[0.07]" : ""
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onCellClick(subject, unit.title, topic, col.dateISO)
                        }
                        className={`w-full h-7 rounded-[4px] px-0.5 text-[9px] leading-tight flex items-center justify-center truncate transition ${cell
                          ? cell.status === "done"
                            ? "text-white font-black shadow-sm hover:brightness-110"
                            : cell.status === "partial"
                              ? "border border-amber-400 font-bold hover:brightness-110"
                              : "border border-dashed font-bold hover:brightness-110"
                          : "hover:bg-white/[0.08] text-transparent hover:text-slate-500"
                          }`}
                        style={
                          cell
                            ? cell.status === "done"
                              ? { backgroundColor: subject.color }
                              : cell.status === "partial"
                                ? {
                                  backgroundColor: `${subject.color}42`,
                                  color: "#FDE68A",
                                }
                                : {
                                  borderColor: subject.color,
                                  backgroundColor: `${subject.color}24`,
                                  color: "#E2E8F0",
                                }
                            : undefined
                        }
                        title={
                          cell
                            ? `${topic.title} (${col.dateISO}): ${cell.keyword} (${
                                cell.status === "done"
                                  ? "완료"
                                  : cell.status === "partial"
                                    ? "진행중(이월)"
                                    : "계획"
                              })`
                            : `${topic.title} (${col.dateISO}) 탭하여 기록/계획`
                        }
                      >
                        {cell
                          ? cell.status === "partial"
                            ? `◐${cell.keyword}`
                            : cell.keyword
                          : "+"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
    </>
  );
}
