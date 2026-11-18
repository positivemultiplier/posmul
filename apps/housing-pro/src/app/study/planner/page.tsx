"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  MoreVertical,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Palette,
  SlidersHorizontal,
  Eraser,
  Paintbrush,
  MousePointerClick,
  Check,
  Tag,
  Library,
  BarChart3,
  Timer,
  GripVertical,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import {
  CurriculumAddModal,
  type CurriculumAddStep,
} from "@/components/study/curriculum-add-modal";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import {
  computeDayPlanActualSummary,
  computePeriodPlanActualGap,
  formatMinutesKo,
  formatGapMinutesKo,
  isPlanSlotVisibleForBooks,
} from "@/lib/study-plan-analytics";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  addDaysISO,
  diffDaysISO,
  getHoursFromReset,
  getRoundColorStyle,
  getTimetableSlotActual,
  getTimetableSlotPlan,
  setTimetableSlotLayer,
  type MatrixCellLog,
  type MatrixCellStatus,
  type StudySubjectNode,
  type StudyTopicNode,
  type TimetableSlotLog,
} from "@/data/study-textbooks";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type MatrixDragMode = "tap" | "plan" | "done" | "erase";

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
  customColor?: string;
}

interface EditingSubjectFormState {
  subjectId: string;
  title: string;
  category: string;
  color: string;
  firstUnitId?: string;
  newTopicTitle: string;
}

interface EditingTopicFormState {
  topicId: string;
  subjectTitle: string;
  subjectColor: string;
  title: string;
  defaultKeyword: string;
  estimatedMinutes: number;
  color: string; // "" 이면 과목 기본색 사용
}

interface ScheduleTopicItem {
  key: string;
  dateISO: string;
  subject: StudySubjectNode;
  unitTitle: string;
  topic: StudyTopicNode;
  cell: MatrixCellLog;
}

function getMondayStartWeekDates(anchorISO: string): string[] {
  const [y, m, d] = anchorISO.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const day = dt.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mondayISO = addDaysISO(anchorISO, diffToMon);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i));
}

function formatShortMMDDWithDay(dateISO: string, todayISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const wd = WEEKDAY_KO[dt.getDay()];
  const base = `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}(${wd})`;
  if (dateISO === todayISO) return `오늘 · ${base}`;
  if (dateISO === addDaysISO(todayISO, 1)) return `내일 · ${base}`;
  return base;
}

export default function StudyPlannerMatrixPage() {
  const {
    todayISO,
    dayResetHour,
    setDayResetHour,
    examDate,
    activeBooks,
    activeBookIds,
    catalog,
    subjects,
    archivedSubjects,
    hiddenTopicIds,
    categories,
    addCustomCategory,
    matrixLogs,
    timetablesByDate,
    setTimetableSlots,
    chapterTotals,
    collapsedSubjectIds,
    toggleBookActive,
    removeBookFromPlanner,
    addCustomBook,
    replaceCustomBookStructure,
    deleteCustomBook,
    addCustomSubject,
    updateSubjectCustomization,
    updateTopicCustomization,
    archiveSubject,
    restoreSubject,
    deleteSubject,
    addCustomTopic,
    addCustomTopicsBulk,
    deleteCustomTopic,
    hideTopic,
    restoreHiddenTopic,
    upsertMatrixCell,
    upsertMatrixCellsBulk,
    deleteMatrixCell,
    deleteMatrixCellsBulk,
    scheduleMultiDayPlan,
    carryOverTopicToNextDay,
    toggleSubjectCollapse,
    setAllSubjectsCollapsed,
  } = useStudyCurriculum();

  const [viewMode, setViewMode] = useState<"matrix" | "diary">("matrix");
  const [diaryScope, setDiaryScope] = useState<"day" | "week">("day");
  const [selectedDiaryDate, setSelectedDiaryDate] = useState<string>(todayISO);
  const [showAllTimetableHours, setShowAllTimetableHours] = useState<boolean>(false);
  const [showWeekDailyDetails, setShowWeekDailyDetails] = useState<boolean>(false);
  const prevTodayRef = useRef<string>(todayISO);

  // ③ 확장형 분류(Category) 필터
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // ② 오늘을 첫 기준 열(offset = 0)로 시작
  const [windowStartOffset, setWindowStartOffset] = useState<number>(0);
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [selectedPaletteTopicId, setSelectedPaletteTopicId] = useState<string | null>(null);
  const [quickAddTopicId, setQuickAddTopicId] = useState<string>("");

  // ③ 책 표지 선택 팝오버 / 상세 액션 / 하단 보관함 접기 토글
  const [selectedShelfBookId, setSelectedShelfBookId] = useState<string | null>(null);
  const [showMatrixArchiveBar, setShowMatrixArchiveBar] = useState<boolean>(false);

  // 계층형 책 · 과목 · 단원 추가 모달 (수동 생성 + 드래그&드롭 목차 구조 통합)
  const [addModalState, setAddModalState] = useState<{
    open: boolean;
    step: CurriculumAddStep;
    bookId?: string;
    subjectId?: string;
  }>({ open: false, step: "book" });

  const openAddModal = useCallback(
    (step: CurriculumAddStep, bookId?: string, subjectId?: string) => {
      setAddModalState({
        open: true,
        step,
        bookId: bookId || selectedShelfBookId || activeBooks[0]?.id || catalog[0]?.id,
        subjectId,
      });
    },
    [selectedShelfBookId, activeBooks, catalog]
  );

  // 드래그 연속 입력 & 커스텀 색상 브러시 상태 (매트릭스)
  const [dragMode, setDragMode] = useState<MatrixDragMode>("tap");
  const [brushColor, setBrushColor] = useState<string | null>(null);
  const [isMatrixDragging, setIsMatrixDragging] = useState<boolean>(false);
  const [dragSelectedKeys, setDragSelectedKeys] = useState<string[]>([]);
  const dragSelectedRef = useRef<string[]>([]);

  // 타임테이블 드래그 & 커스텀 색상 상태
  const [timetableBrushColor, setTimetableBrushColor] = useState<string>("#FF5A36");
  const [useCustomTimetableColor, setUseCustomTimetableColor] = useState<boolean>(false);
  const [ttDragAction, setTtDragAction] = useState<"paint" | "erase" | null>(null);

  // 과목 · 다중 교재 편집 모달
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [openMenuSubjectId, setOpenMenuSubjectId] = useState<string | null>(null);
  const [editingSubjectForm, setEditingSubjectForm] =
    useState<EditingSubjectFormState | null>(null);
  const [editingTopicForm, setEditingTopicForm] =
    useState<EditingTopicFormState | null>(null);

  // todayISO 동적 동기화
  useEffect(() => {
    if (prevTodayRef.current !== todayISO) {
      if (selectedDiaryDate === prevTodayRef.current) {
        setSelectedDiaryDate(todayISO);
      }
      prevTodayRef.current = todayISO;
    }
  }, [todayISO, selectedDiaryDate]);

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      if (params.get("tab") === "diary") setViewMode("diary");
      if (params.get("scope") === "week") setDiaryScope("week");
    }
  }, []);

  const dDayToExam = useMemo(() => diffDaysISO(todayISO, examDate), [todayISO, examDate]);

  // 매트릭스 가로 날짜 열 (18일 윈도우, 기본 오늘 기준 0 ~ +17일)
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

  // 활성 과목들에서 쓰이는 분류 목록 (필터 바 노출용)
  const usedCategories = useMemo(() => {
    const set = new Set<string>();
    for (const s of subjects) {
      set.add(s.category || (s.examStage === "1차" ? "주택관리사 1차" : "주택관리사 2차"));
    }
    return Array.from(set);
  }, [subjects]);

  // 분류 필터링된 활성 과목 목록
  const visibleSubjects = useMemo(() => {
    if (categoryFilter === "ALL") return subjects;
    return subjects.filter(
      (s) =>
        (s.category || (s.examStage === "1차" ? "주택관리사 1차" : "주택관리사 2차")) ===
        categoryFilter
    );
  }, [subjects, categoryFilter]);

  // 모든 활성 단원 플랫 리스트
  const allActiveTopicEntries = useMemo(() => {
    const list: Array<{ subject: StudySubjectNode; unitTitle: string; topic: StudyTopicNode }> = [];
    for (const s of subjects) {
      for (const u of s.units) {
        for (const t of u.topics) {
          list.push({ subject: s, unitTitle: u.title, topic: t });
        }
      }
    }
    return list;
  }, [subjects]);

  useEffect(() => {
    if (allActiveTopicEntries.length > 0 && !quickAddTopicId) {
      setQuickAddTopicId(allActiveTopicEntries[0].topic.id);
    }
  }, [allActiveTopicEntries, quickAddTopicId]);

  // 단원별 완료 셀들의 날짜순 회독 차수 계산 (1R -> 2R -> 3R ... 회독 농도용)
  const topicDoneOrderMap = useMemo(() => {
    const byTopic = new Map<string, Array<{ key: string; dateISO: string }>>();
    for (const [key, cell] of Object.entries(matrixLogs)) {
      if (cell.status !== "done") continue;
      const sepIdx = key.indexOf("::");
      if (sepIdx <= 0) continue;
      const topicId = key.slice(0, sepIdx);
      const dateISO = key.slice(sepIdx + 2);
      const arr = byTopic.get(topicId) || [];
      arr.push({ key, dateISO });
      byTopic.set(topicId, arr);
    }
    const orderMap = new Map<string, number>();
    for (const arr of byTopic.values()) {
      arr.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      arr.forEach((entry, idx) => {
        orderMap.set(entry.key, idx + 1);
      });
    }
    return orderMap;
  }, [matrixLogs]);

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

  // 전체 목차 매트릭스 항목 추출 (일정표 1일/1주일 공용 소스)
  const allScheduleItems = useMemo(() => {
    const items: ScheduleTopicItem[] = [];
    for (const subject of subjects) {
      for (const unit of subject.units) {
        for (const topic of unit.topics) {
          const prefix = `${topic.id}::`;
          for (const [key, cell] of Object.entries(matrixLogs)) {
            if (key.startsWith(prefix)) {
              items.push({
                key,
                dateISO: key.slice(prefix.length),
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

  const todayPlannedCount = useMemo(
    () =>
      allScheduleItems.filter(
        (i) =>
          i.dateISO === todayISO &&
          (i.cell.status === "plan" || i.cell.status === "partial")
      ).length,
    [allScheduleItems, todayISO]
  );

  const selectedDayItems = useMemo(
    () => allScheduleItems.filter((i) => i.dateISO === selectedDiaryDate),
    [allScheduleItems, selectedDiaryDate]
  );

  const weekDates = useMemo(
    () => getMondayStartWeekDates(selectedDiaryDate),
    [selectedDiaryDate]
  );

  const activeTopicIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const entry of allActiveTopicEntries) {
      set.add(entry.topic.id);
    }
    return set;
  }, [allActiveTopicEntries]);

  const weekPlanActualGap = useMemo(
    () =>
      computePeriodPlanActualGap({
        dateISOs: weekDates,
        subjects,
        matrixLogs,
        timetablesByDate,
        activeBookIds,
      }),
    [weekDates, subjects, matrixLogs, timetablesByDate, activeBookIds]
  );

  const weekSummary = useMemo(() => {
    const weekSet = new Set(weekDates);
    const items = allScheduleItems.filter((i) => weekSet.has(i.dateISO));
    const planned = items.filter(
      (i) => i.cell.status === "plan" || i.cell.status === "partial"
    );
    const done = items.filter((i) => i.cell.status === "done");
    return {
      plannedCount: planned.length,
      doneCount: done.length,
      totalGoalMinutes: weekPlanActualGap.totalPlanMinutes,
      totalActualMinutes: weekPlanActualGap.totalActualMinutes,
    };
  }, [allScheduleItems, weekDates, weekPlanActualGap]);

  const dayTimetableGrid: Record<string, TimetableSlotLog> = useMemo(
    () => timetablesByDate[selectedDiaryDate] || {},
    [timetablesByDate, selectedDiaryDate]
  );

  const timetableHours = useMemo(
    () => getHoursFromReset(dayResetHour),
    [dayResetHour]
  );

  /** 1일 일정표 표시 시간대 (핵심 06~23시 + 기록된 시간 자동 포함 / 전체 24h 토글) */
  const visibleDayHours = useMemo(() => {
    if (showAllTimetableHours) return timetableHours;
    return timetableHours.filter((h) => {
      if (h >= 6 && h <= 23) return true;
      return [0, 1, 2, 3, 4, 5].some((slot) => Boolean(dayTimetableGrid[`${h}-${slot}`]));
    });
  }, [showAllTimetableHours, timetableHours, dayTimetableGrid]);

  /** 1주 일정표 표시 시간대 (핵심 06~23시 + 주간 기록 있는 시간 자동 포함 / 전체 24h 토글) */
  const visibleWeekHours = useMemo(() => {
    if (showAllTimetableHours) return timetableHours;
    return timetableHours.filter((h) => {
      if (h >= 6 && h <= 23) return true;
      return weekDates.some((dISO) => {
        const dayGrid = timetablesByDate[dISO] || {};
        return [0, 1, 2, 3, 4, 5].some((slot) => Boolean(dayGrid[`${h}-${slot}`]));
      });
    });
  }, [showAllTimetableHours, timetableHours, weekDates, timetablesByDate]);

  const topicMetaMap = useMemo(() => {
    const map = new Map<
      string,
      { subject: StudySubjectNode; unitTitle: string; topic: StudyTopicNode }
    >();
    for (const entry of allActiveTopicEntries) {
      map.set(entry.topic.id, entry);
    }
    return map;
  }, [allActiveTopicEntries]);

  /** 1일 예상(plan) vs 타이머 실행(actual) 통합 요약 */
  const dayPlanActualSummary = useMemo(
    () =>
      computeDayPlanActualSummary({
        dateISO: selectedDiaryDate,
        subjects,
        matrixLogs,
        daySlots: dayTimetableGrid,
        activeBookIds,
      }),
    [selectedDiaryDate, subjects, matrixLogs, dayTimetableGrid, activeBookIds]
  );

  const timetableStats = useMemo(() => {
    const planByTopic = new Map<string, number>();
    const actualByTopic = new Map<string, number>();
    for (const item of dayPlanActualSummary.items) {
      planByTopic.set(item.topicId, item.planMinutes);
      actualByTopic.set(item.topicId, item.actualMinutes);
    }
    return {
      planSlotsCount: dayPlanActualSummary.planSlotCount,
      actualSlotsCount: dayPlanActualSummary.actualSlotCount,
      matchedSlotsCount: dayPlanActualSummary.matchedSlotCount,
      planMinutes: dayPlanActualSummary.planMinutes,
      actualMinutes: dayPlanActualSummary.actualMinutes,
      gapMinutes: dayPlanActualSummary.gapMinutes,
      timeAchievementPct: dayPlanActualSummary.achievementPct,
      slotMatchPct: dayPlanActualSummary.slotMatchPct,
      planByTopic,
      actualByTopic,
    };
  }, [dayPlanActualSummary]);

  const plannedTopicPalette = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      topicId: string;
      subject: StudySubjectNode;
      topic: StudyTopicNode;
      color: string;
      cell?: MatrixCellLog;
      plannedMin: number;
      actualMin: number;
      matchedMin: number;
    }> = [];

    for (const item of dayPlanActualSummary.items) {
      seen.add(item.topicId);
      list.push({
        topicId: item.topicId,
        subject: item.subject,
        topic: item.topic,
        color: item.color,
        cell: item.cell,
        plannedMin: item.planMinutes,
        actualMin: item.actualMinutes,
        matchedMin: item.matchedMinutes,
      });
    }

    for (const slot of Object.values(dayTimetableGrid)) {
      const rawPlan = getTimetableSlotPlan(slot);
      const visiblePlan = isPlanSlotVisibleForBooks(rawPlan, activeBookIds, activeTopicIdSet)
        ? rawPlan
        : null;
      for (const entry of [visiblePlan, getTimetableSlotActual(slot)]) {
        if (!entry?.topicId || seen.has(entry.topicId)) continue;
        const meta = topicMetaMap.get(entry.topicId);
        if (!meta) continue;
        seen.add(entry.topicId);
        list.push({
          topicId: entry.topicId,
          subject: meta.subject,
          topic: meta.topic,
          color: entry.color || meta.topic.color || meta.subject.color,
          plannedMin: timetableStats.planByTopic.get(entry.topicId) ?? 0,
          actualMin: timetableStats.actualByTopic.get(entry.topicId) ?? 0,
          matchedMin: 0,
        });
      }
    }

    return list;
  }, [
    dayPlanActualSummary.items,
    dayTimetableGrid,
    timetableStats,
    topicMetaMap,
    activeBookIds,
    activeTopicIdSet,
  ]);

  const activePaletteItem = useMemo(() => {
    if (plannedTopicPalette.length === 0) return null;
    return (
      plannedTopicPalette.find((p) => p.topicId === selectedPaletteTopicId) ||
      plannedTopicPalette[0]
    );
  }, [plannedTopicPalette, selectedPaletteTopicId]);

  const activeTimetableBrush = useMemo(() => {
    const fallbackBookId = selectedShelfBookId || activeBooks[0]?.id;
    if (useCustomTimetableColor) {
      return {
        color: timetableBrushColor,
        label: activePaletteItem?.topic.title || "커스텀 집중",
        topicId: activePaletteItem?.topicId,
        bookId: activePaletteItem?.subject.bookId || fallbackBookId,
      };
    }
    if (activePaletteItem) {
      return {
        color: activePaletteItem.color,
        label: activePaletteItem.topic.title,
        topicId: activePaletteItem.topicId,
        bookId: activePaletteItem.subject.bookId || fallbackBookId,
      };
    }
    return {
      color: timetableBrushColor,
      label: "직접 계획",
      topicId: undefined,
      bookId: fallbackBookId,
    };
  }, [
    useCustomTimetableColor,
    timetableBrushColor,
    activePaletteItem,
    selectedShelfBookId,
    activeBooks,
  ]);

  // 매트릭스 드래그 시작/연장/커밋
  const startMatrixDrag = useCallback((cellKey: string) => {
    setIsMatrixDragging(true);
    dragSelectedRef.current = [cellKey];
    setDragSelectedKeys([cellKey]);
  }, []);

  const extendMatrixDrag = useCallback((cellKey: string) => {
    if (!dragSelectedRef.current.includes(cellKey)) {
      const next = [...dragSelectedRef.current, cellKey];
      dragSelectedRef.current = next;
      setDragSelectedKeys(next);
    }
  }, []);

  const commitMatrixDrag = useCallback(() => {
    if (!isMatrixDragging) return;
    const keys = dragSelectedRef.current;
    setIsMatrixDragging(false);
    dragSelectedRef.current = [];
    setDragSelectedKeys([]);

    if (keys.length === 0 || dragMode === "tap") return;

    if (dragMode === "erase") {
      const parsed = keys
        .map((k) => {
          const [topicId, dateISO] = k.split("::");
          return topicId && dateISO ? { topicId, dateISO } : null;
        })
        .filter((v): v is { topicId: string; dateISO: string } => v !== null);
      deleteMatrixCellsBulk(parsed);
      return;
    }

    const entries: Array<{ topicId: string; dateISO: string; cell: MatrixCellLog }> = [];
    for (const k of keys) {
      const [topicId, dateISO] = k.split("::");
      if (!topicId || !dateISO) continue;
      const meta = topicMetaMap.get(topicId);
      const existing = matrixLogs[k];
      entries.push({
        topicId,
        dateISO,
        cell: {
          status: dragMode === "done" ? "done" : "plan",
          keyword:
            existing?.keyword || meta?.topic.defaultKeyword || "집중학습",
          minutes: existing?.minutes ?? meta?.topic.estimatedMinutes ?? 30,
          ...(brushColor
            ? { customColor: brushColor }
            : existing?.customColor
              ? { customColor: existing.customColor }
              : {}),
        },
      });
    }
    upsertMatrixCellsBulk(entries);
  }, [
    isMatrixDragging,
    dragMode,
    deleteMatrixCellsBulk,
    topicMetaMap,
    matrixLogs,
    brushColor,
    upsertMatrixCellsBulk,
  ]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isMatrixDragging) commitMatrixDrag();
      if (ttDragAction) setTtDragAction(null);
    };
    globalThis.addEventListener("pointerup", handleGlobalPointerUp);
    globalThis.addEventListener("touchend", handleGlobalPointerUp);
    globalThis.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      globalThis.removeEventListener("pointerup", handleGlobalPointerUp);
      globalThis.removeEventListener("touchend", handleGlobalPointerUp);
      globalThis.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [isMatrixDragging, commitMatrixDrag, ttDragAction]);

  const dragKeySet = useMemo(() => new Set(dragSelectedKeys), [dragSelectedKeys]);

  const applyTimetableSlotAction = useCallback(
    (slotKey: string, action: "paint" | "erase") => {
      setTimetableSlots(selectedDiaryDate, (prev) => {
        const copy = { ...prev };
        const updatedSlot = setTimetableSlotLayer(
          copy[slotKey],
          "plan",
          action === "erase"
            ? null
            : {
                color: activeTimetableBrush.color,
                label: activeTimetableBrush.label,
                ...(activeTimetableBrush.topicId
                  ? { topicId: activeTimetableBrush.topicId }
                  : {}),
                ...(activeTimetableBrush.bookId
                  ? { bookId: activeTimetableBrush.bookId }
                  : {}),
              }
        );
        if (updatedSlot) {
          copy[slotKey] = updatedSlot;
        } else {
          delete copy[slotKey];
        }
        return copy;
      });
    },
    [selectedDiaryDate, setTimetableSlots, activeTimetableBrush]
  );

  /** 선택된 날짜의 예상(plan) 타임테이블 슬롯 일괄 비우기 (타이머 실행 기록은 보존) */
  const handleClearDayPlanSlots = useCallback(() => {
    setTimetableSlots(selectedDiaryDate, (prev) => {
      const next: Record<string, TimetableSlotLog> = {};
      for (const [sKey, sVal] of Object.entries(prev)) {
        const updated = setTimetableSlotLayer(sVal, "plan", null);
        if (updated) {
          next[sKey] = updated;
        }
      }
      return next;
    });
  }, [selectedDiaryDate, setTimetableSlots]);

  const getTopicDoneCount = (topicId: string) => {
    let count = 0;
    for (const [key, cell] of Object.entries(matrixLogs)) {
      if (key.startsWith(`${topicId}::`) && cell.status === "done") {
        count += 1;
      }
    }
    return count;
  };

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
      customColor: existing?.customColor || topic.color,
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
        editingCell.minutes,
        editingCell.customColor
      );
    } else if (editingCell.status === "partial" && editingCell.carryOverTomorrow) {
      carryOverTopicToNextDay(
        editingCell.topic.id,
        editingCell.dateISO,
        cleanKeyword,
        editingCell.minutes,
        editingCell.customColor
      );
    } else {
      upsertMatrixCell(editingCell.topic.id, editingCell.dateISO, {
        status: editingCell.status,
        keyword: cleanKeyword,
        minutes: editingCell.minutes,
        ...(editingCell.customColor ? { customColor: editingCell.customColor } : {}),
      });
    }
    setEditingCell(null);
  };

  const handleDeleteEditingCell = () => {
    if (!editingCell) return;
    deleteMatrixCell(editingCell.topic.id, editingCell.dateISO);
    setEditingCell(null);
  };

  const handleQuickAddPlanForDate = (targetDateISO: string, topicId: string) => {
    const meta = topicMetaMap.get(topicId);
    if (!meta) return;
    upsertMatrixCell(topicId, targetDateISO, {
      status: "plan",
      keyword: meta.topic.defaultKeyword,
      minutes: meta.topic.estimatedMinutes,
      ...(brushColor ? { customColor: brushColor } : {}),
    });
    if (targetDateISO === selectedDiaryDate) {
      setSelectedPaletteTopicId(topicId);
    }
  };

  const handleOpenEditSubject = (subj: StudySubjectNode) => {
    setOpenMenuSubjectId(null);
    setEditingSubjectForm({
      subjectId: subj.id,
      title: subj.title,
      category:
        subj.category ||
        (subj.examStage === "1차" ? "주택관리사 1차" : "주택관리사 2차"),
      color: subj.color,
      firstUnitId: subj.units[0]?.id,
      newTopicTitle: "",
    });
  };

  const handleSaveSubjectForm = () => {
    if (!editingSubjectForm) return;
    const isFirstStage = editingSubjectForm.category.includes("1차");
    updateSubjectCustomization(editingSubjectForm.subjectId, {
      title: editingSubjectForm.title.trim() || undefined,
      category: editingSubjectForm.category,
      examStage: isFirstStage ? "1차" : "2차",
      color: editingSubjectForm.color,
    });
    if (editingSubjectForm.firstUnitId && editingSubjectForm.newTopicTitle.trim()) {
      addCustomTopic(
        editingSubjectForm.firstUnitId,
        editingSubjectForm.newTopicTitle.trim(),
        editingSubjectForm.newTopicTitle.trim().slice(0, 6)
      );
    }
    setEditingSubjectForm(null);
  };

  const handleOpenEditTopic = (subj: StudySubjectNode, topic: StudyTopicNode) => {
    setEditingTopicForm({
      topicId: topic.id,
      subjectTitle: subj.title,
      subjectColor: subj.color,
      title: topic.title,
      defaultKeyword: topic.defaultKeyword,
      estimatedMinutes: topic.estimatedMinutes,
      color: topic.color || "",
    });
  };

  const handleSaveTopicForm = () => {
    if (!editingTopicForm) return;
    updateTopicCustomization(editingTopicForm.topicId, {
      title: editingTopicForm.title.trim() || undefined,
      defaultKeyword: editingTopicForm.defaultKeyword.trim() || undefined,
      estimatedMinutes: Math.max(5, Math.min(240, editingTopicForm.estimatedMinutes || 30)),
      color: editingTopicForm.color,
    });
    setEditingTopicForm(null);
  };

  const handleAddCategorySubmit = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    addCustomCategory(trimmed);
    setCategoryFilter(trimmed);
    setNewCategoryName("");
    setIsAddingCategory(false);
  };

  const inactiveShelfBooks = useMemo(
    () => catalog.filter((b) => !activeBookIds.includes(b.id)),
    [catalog, activeBookIds]
  );

  const selectedShelfBook = useMemo(
    () =>
      selectedShelfBookId
        ? catalog.find((b) => b.id === selectedShelfBookId) || null
        : null,
    [catalog, selectedShelfBookId]
  );

  return (
    <MobileAppShell>
      {/* 상단 플래너 헤더 (③ 회독플래너 + 책 표지 가로 나열 + 확장 분류) */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
            <h1 className="text-sm font-black text-white truncate">회독플래너</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/40 font-mono text-[10px] font-black text-[#FF7A59] shrink-0">
              {dDayToExam >= 0 ? `D-${dDayToExam}` : `D+${Math.abs(dDayToExam)}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsManagerModalOpen(true)}
              className="px-2 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[10px] font-black text-slate-200 flex items-center gap-1 transition"
            >
              <SlidersHorizontal className="w-3 h-3 text-[#FF7A59]" />
              <span>과목·교재 편집</span>
            </button>

            <div className="flex items-center bg-[#0D0D11] p-0.5 rounded-xl border border-white/[0.08] text-[10px] font-black">
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  viewMode === "matrix"
                    ? "bg-[#FF5A36] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                목차 매트릭스
              </button>
              <button
                type="button"
                onClick={() => setViewMode("diary")}
                className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  viewMode === "diary"
                    ? "bg-[#FF5A36] text-white"
                    : "text-slate-400 hover:text-white"
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
                  {todayPlannedCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ③ 책 표지(Book Cover) 이미지 가로 나열 책장 (활성 책만 표시, 우상단 ✕로 즉시 빼기) */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1 no-scrollbar">
          {activeBooks.map((book) => {
            const isSelectedShelf = selectedShelfBookId === book.id;
            const topicCount = book.subjects.reduce(
              (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
              0
            );

            return (
              <div
                key={book.id}
                className={`relative shrink-0 rounded-xl overflow-hidden border transition cursor-pointer select-none flex ${
                  book.coverImageUrl ? "w-[156px]" : "w-[116px]"
                } ${
                  isSelectedShelf
                    ? "ring-2 ring-white border-white"
                    : "border-[#FF5A36]/70 shadow-lg"
                }`}
                style={{
                  background: `linear-gradient(145deg, ${book.coverColor}33 0%, #121218 85%)`,
                }}
                onClick={() => {
                  setSelectedShelfBookId(isSelectedShelf ? null : book.id);
                }}
                title={`${book.title} (클릭: 편집 · ✕ 버튼: 플래너에서 빼기)`}
              >
                {/* 책등 입체 바 */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 z-10"
                  style={{ backgroundColor: book.coverColor }}
                />

                <div className="pl-2.5 pr-1.5 py-2 flex items-center gap-2 w-full min-w-0">
                  {book.coverImageUrl && (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded-md border border-white/20 shadow-md shrink-0 bg-[#0D0D11]"
                    />
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="px-1.5 py-0.2 rounded text-[8.5px] font-black text-white truncate max-w-[64px]"
                        style={{ backgroundColor: book.coverColor }}
                      >
                        {book.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookFromPlanner(book.id);
                          if (selectedShelfBookId === book.id) {
                            setSelectedShelfBookId(null);
                          }
                        }}
                        className="w-4 h-4 rounded-full bg-black/50 hover:bg-rose-500 text-slate-200 hover:text-white flex items-center justify-center transition shrink-0"
                        title={`${book.title} 플래너에서 빼기 (기록 보존)`}
                        aria-label={`${book.title} 빼기`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="text-[10px] font-black text-white line-clamp-2 leading-tight min-h-[24px]">
                      {book.title}
                    </div>
                    <div className="text-[8.5px] font-mono text-slate-300 flex items-center justify-between">
                      <span>{topicCount}단원</span>
                      <span className="text-emerald-300">적용중</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeBooks.length === 0 && (
            <div className="shrink-0 px-3 py-2 rounded-xl bg-[#111116] border border-white/[0.08] flex items-center text-[10.5px] text-slate-400">
              선택된 책이 없습니다. 책을 추가하거나 서재에서 꺼내세요.
            </div>
          )}

          {/* 책 표지 끝: + 책 추가 미니 표지 카드 */}
          <button
            type="button"
            onClick={() => openAddModal("book")}
            className="shrink-0 w-[84px] rounded-xl border border-dashed border-white/[0.2] hover:border-[#FF5A36] bg-[#111116] hover:bg-[#191922] p-2 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition"
          >
            <Plus className="w-4 h-4 text-[#FF7A59]" />
            <span className="text-[10px] font-black">책 추가</span>
          </button>

          {/* 서재(빼둔 책) 빠른 꺼내기 카드 */}
          {inactiveShelfBooks.length > 0 && (
            <button
              type="button"
              onClick={() => setIsManagerModalOpen(true)}
              className="shrink-0 w-[88px] rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 p-2 flex flex-col items-center justify-center gap-1 text-amber-200 transition"
              title="서재에 빼둔 책 다시 넣기"
            >
              <Library className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-black">
                서재 ({inactiveShelfBooks.length})
              </span>
            </button>
          )}
        </div>

        {/* 책 표지 클릭 시 나타나는 빠른 책 관리 액션 바 */}
        {selectedShelfBook && (
          <div className="p-2.5 rounded-xl bg-[#111117] border border-white/[0.1] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedShelfBook.coverColor }}
              />
              <span className="font-black text-white truncate">
                {selectedShelfBook.title}
              </span>
              <span className="text-[9.5px] text-emerald-300 shrink-0">
                (빼도 기록 보존)
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => openAddModal("subject", selectedShelfBook.id)}
                className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 font-black"
              >
                + 과목 추가
              </button>
              <button
                type="button"
                onClick={() => openAddModal("topic", selectedShelfBook.id)}
                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 font-black"
              >
                + 단원 추가
              </button>
              {selectedShelfBook.id.startsWith("custom-book-") && (
                <button
                  type="button"
                  onClick={() => openAddModal("organize", selectedShelfBook.id)}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 font-black"
                >
                  목차 구조잡기
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsManagerModalOpen(true);
                  setSelectedShelfBookId(null);
                }}
                className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold"
              >
                상세 편집
              </button>
              <button
                type="button"
                onClick={() => {
                  removeBookFromPlanner(selectedShelfBook.id);
                  setSelectedShelfBookId(null);
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 font-black"
              >
                서재로 빼기(데이터유지)
              </button>
              <button
                type="button"
                onClick={() => setSelectedShelfBookId(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {viewMode === "matrix" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* ③ 확장형 분류(Category) 필터 & 모두 접기/펴기 */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                  categoryFilter === "ALL"
                    ? "bg-white text-slate-950 border-white"
                    : "bg-[#0E0E12] text-slate-400 border-white/[0.08] hover:text-white"
                }`}
              >
                전체
              </button>
              {usedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                    categoryFilter === cat
                      ? "bg-white text-slate-950 border-white"
                      : "bg-[#0E0E12] text-slate-400 border-white/[0.08] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsAddingCategory((prev) => !prev)}
                className="px-2 py-1 rounded-lg bg-[#0E0E12] border border-dashed border-white/[0.15] text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-0.5"
                title="새 분류 추가"
              >
                <Tag className="w-3 h-3 text-[#FF7A59]" />
                <span>+분류</span>
              </button>

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

            {/* ② 오늘 기준 날짜 윈도우 이동 */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev - 7)}
                className="px-1.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="7일 전"
              >
                -7일
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev - 1)}
                className="p-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="1일 전"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset(0)}
                className={`px-2 py-1 rounded-lg border font-black ${
                  windowStartOffset === 0
                    ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                    : "bg-[#0E0E12] border-[#FF5A36]/40 text-[#FF7A59]"
                }`}
                title="오늘 날짜가 첫 번째 열에 오도록 이동"
              >
                오늘 시작
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset(-3)}
                className={`px-2 py-1 rounded-lg border font-bold ${
                  windowStartOffset === -3
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-[#0E0E12] border-white/[0.08] text-slate-400 hover:text-white"
                }`}
                title="최근 3일과 앞으로 14일 함께 보기"
              >
                오늘 중심
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev + 1)}
                className="p-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="1일 후"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setWindowStartOffset((prev) => prev + 7)}
                className="px-1.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-slate-300 hover:text-white"
                title="7일 후"
              >
                +7일
              </button>
            </div>
          </div>
        )}

        {/* 새 분류 추가 인라인 바 */}
        {isAddingCategory && viewMode === "matrix" && (
          <div className="p-2 rounded-xl bg-[#0E0E14] border border-[#FF5A36]/40 flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategorySubmit();
              }}
              placeholder="새 분류 입력 (예: 영어, 수학, 과학, 컴퓨터)"
              className="flex-1 px-2.5 py-1 rounded-lg bg-[#16161E] border border-white/[0.1] text-[11px] text-white"
            />
            <button
              type="button"
              onClick={handleAddCategorySubmit}
              className="px-3 py-1 rounded-lg bg-[#FF5A36] text-white text-[10.5px] font-black"
            >
              분류 추가
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {viewMode === "matrix" ? (
        <div className="flex-1 flex flex-col">
          {/* 상단 요약 바 & 회독 농도(Shade) 범례 */}
          <div className="px-4 py-2 bg-[#131318] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <div className="flex items-center gap-3 font-bold">
              <span className="text-slate-300">
                범위 커버{" "}
                <strong className="font-mono text-white">
                  {summaryStats.coveredTopics}/{summaryStats.totalTopics}
                </strong>
                <span className="text-[#FF7A59] font-mono ml-1">
                  ({summaryStats.coveragePct}%)
                </span>
              </span>
              <span className="text-slate-400">
                완료 <strong className="text-emerald-300 font-mono">{summaryStats.totalDoneCells}</strong> · 진행중{" "}
                <strong className="text-amber-300 font-mono">{summaryStats.totalPartialCells}</strong> · 계획{" "}
                <strong className="text-sky-300 font-mono">{summaryStats.totalPlanCells}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold flex-wrap">
              <span className="flex items-center gap-1" title="회독이 쌓일수록 색이 진해집니다">
                <span>회독농도</span>
                {[1, 2, 3, 4, 5].map((r) => {
                  const st = getRoundColorStyle("#FF5A36", r);
                  return (
                    <span
                      key={r}
                      className="w-3 h-3 rounded-sm inline-flex items-center justify-center text-[7px] font-mono text-white"
                      style={{
                        backgroundColor: st.backgroundColor,
                        border: `1px solid ${st.borderColor}`,
                      }}
                    >
                      {r}
                    </span>
                  );
                })}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border border-amber-400 bg-amber-500/30" />
                <span>진행중</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#FF5A36] bg-[#FF5A36]/20" />
                <span>계획</span>
              </span>
            </div>
          </div>

          {/* 드래그 연속 입력 & 색상 커스텀 브러시 바 */}
          <div className="px-4 py-2 bg-[#101015] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { id: "tap" as const, label: "탭 편집", icon: MousePointerClick },
                  { id: "plan" as const, label: "드래그 계획", icon: Paintbrush },
                  { id: "done" as const, label: "드래그 완료", icon: CheckCircle2 },
                  { id: "erase" as const, label: "드래그 지움", icon: Eraser },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                const active = dragMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDragMode(m.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 transition ${
                      active
                        ? m.id === "erase"
                          ? "bg-rose-500/20 border-rose-400 text-rose-200"
                          : "bg-[#FF5A36] border-[#FF5A36] text-white shadow"
                        : "bg-[#17171E] border-white/[0.08] text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-300" />
                <span>색상:</span>
              </span>
              <button
                type="button"
                onClick={() => setBrushColor(null)}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-black border ${
                  brushColor === null
                    ? "bg-white text-slate-950 border-white"
                    : "bg-[#17171E] text-slate-400 border-white/[0.1]"
                }`}
              >
                과목색
              </button>
              {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 6).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setBrushColor(hex)}
                  className={`w-4 h-4 rounded-full border transition ${
                    brushColor === hex
                      ? "border-white scale-110 ring-1 ring-white"
                      : "border-white/20 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`색상 ${hex}`}
                />
              ))}
              <label
                className="w-5 h-5 rounded-full border border-white/30 overflow-hidden cursor-pointer flex items-center justify-center bg-[#1A1A22] relative"
                title="직접 색상 지정"
              >
                <input
                  type="color"
                  value={brushColor || "#FF5A36"}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer opacity-0 absolute"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    background:
                      brushColor ||
                      "conic-gradient(#FF5A36, #F59E0B, #10B981, #3B82F6, #A855F7, #FF5A36)",
                  }}
                />
              </label>
            </div>
          </div>

          {/* ========================================================== */}
          {/* 엑셀 스타일 계층 목차 × D-Day 날짜 타임라인 매트릭스 */}
          {/* ========================================================== */}
          <div
            className="flex-1 overflow-x-auto bg-[#0D0D11]"
            onTouchMove={(e) => {
              if (!isMatrixDragging || dragMode === "tap") return;
              const touch = e.touches[0];
              if (!touch) return;
              const targetEl = globalThis.document.elementFromPoint(
                touch.clientX,
                touch.clientY
              );
              const cellBtn = targetEl?.closest("[data-matrix-key]") as HTMLElement | null;
              const matrixKey = cellBtn?.dataset.matrixKey;
              if (matrixKey) {
                extendMatrixDrag(matrixKey);
              }
            }}
          >
            <table className="border-collapse w-max min-w-full text-left select-none">
              <thead className="sticky top-0 z-30 bg-[#16161D]">
                <tr>
                  <th className="sticky left-0 z-40 w-[186px] sm:w-[258px] min-w-[186px] sm:min-w-[258px] bg-[#181820] border-b border-r border-white/[0.12] px-2.5 py-2 align-bottom">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-300">
                      <span>분류 · 책/과목 · 단원</span>
                      <span className="text-slate-500 font-mono">회독</span>
                    </div>
                  </th>
                  {dateColumns.map((col) => (
                    <th
                      key={col.dateISO}
                      className={`w-[58px] min-w-[58px] border-b border-r border-white/[0.08] px-1 py-1.5 text-center align-middle ${
                        col.isToday
                          ? "bg-[#FF5A36]/20 border-x-[#FF5A36]/60"
                          : col.isFuture
                            ? "bg-[#13131A]"
                            : "bg-[#16161D]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDiaryDate(col.dateISO);
                          setDiaryScope("day");
                          setViewMode("diary");
                        }}
                        className="w-full hover:opacity-80 transition"
                        title={`${col.dateISO} 1일 일정표 열기`}
                      >
                        <div
                          className={`text-[9px] font-mono font-black leading-none ${
                            col.isToday ? "text-[#FF7A59]" : "text-slate-400"
                          }`}
                        >
                          {col.dDayLabel}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold mt-1 leading-none ${
                            col.isToday
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
                      </button>
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
                      topicDoneOrderMap={topicDoneOrderMap}
                      chapterTotals={chapterTotals}
                      dragMode={dragMode}
                      dragKeySet={dragKeySet}
                      getTopicDoneCount={getTopicDoneCount}
                      getSubjectDaySummary={getSubjectDaySummary}
                      onToggleCollapse={() => toggleSubjectCollapse(subject.id)}
                      onCellClick={openCellEditor}
                      onCellPointerDown={startMatrixDrag}
                      onCellPointerEnter={(key) => {
                        if (isMatrixDragging) extendMatrixDrag(key);
                      }}
                      onAddInlineTopic={(unitId, title, keyword) =>
                        addCustomTopic(unitId, title, keyword)
                      }
                      onDeleteCustomTopic={(unitId, topicId) =>
                        deleteCustomTopic(unitId, topicId)
                      }
                      onEditSubject={() => handleOpenEditSubject(subject)}
                      onEditTopic={(topic) => handleOpenEditTopic(subject, topic)}
                      onArchiveSubject={() => archiveSubject(subject.id)}
                      onHideTopic={(topicId) => hideTopic(topicId)}
                    />
                  );
                })}

              </tbody>
            </table>
          </div>

          {/* ① 매트릭스 하단 심플 액션 바 (가로 스크롤 바깥 고정 · 보관함 기본 접힘) */}
          <div className="border-t border-white/[0.08] bg-[#111117] px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => openAddModal("book")}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 text-[11px] font-black text-[#FF8A70] flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>책 추가</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddModal("subject")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-bold text-slate-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3 text-sky-400" />
                  <span>과목</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddModal("topic")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-bold text-slate-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>단원</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAddModal("organize")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.08] hover:border-amber-500/35 text-[11px] font-bold text-amber-200/90 flex items-center gap-1 transition"
                  title="드래그 & 드롭으로 과목·대단원·단원 구조 잡기"
                >
                  <GripVertical className="w-3 h-3 text-amber-300" />
                  <span>구조잡기</span>
                </button>
              </div>

              {(inactiveShelfBooks.length > 0 ||
                archivedSubjects.length > 0 ||
                hiddenTopicIds.length > 0) && (
                <button
                  type="button"
                  onClick={() => setShowMatrixArchiveBar((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[10.5px] font-bold text-slate-300 flex items-center gap-1 transition shrink-0"
                >
                  <Library className="w-3 h-3 text-amber-300" />
                  <span>
                    보관함 (
                    {inactiveShelfBooks.length +
                      archivedSubjects.length +
                      hiddenTopicIds.length}
                    )
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      showMatrixArchiveBar ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {showMatrixArchiveBar &&
              (inactiveShelfBooks.length > 0 ||
                archivedSubjects.length > 0 ||
                hiddenTopicIds.length > 0) && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  {inactiveShelfBooks.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">
                        빼둔 책
                      </span>
                      {inactiveShelfBooks.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => toggleBookActive(book.id)}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-bold text-slate-300 flex items-center gap-1 transition"
                        >
                          <Plus className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="max-w-[110px] truncate">{book.badge}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {archivedSubjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">
                        빼둔 과목
                      </span>
                      {archivedSubjects.map((subj) => (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => restoreSubject(subj.id)}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-bold text-slate-300 flex items-center gap-1 transition"
                          title="클릭하여 다시 꺼내기"
                        >
                          <ArchiveRestore className="w-2.5 h-2.5 text-sky-300" />
                          <span>{subj.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {hiddenTopicIds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">
                        숨긴 단원
                      </span>
                      <button
                        type="button"
                        onClick={() => restoreHiddenTopic()}
                        className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-[10px] font-bold text-amber-200 flex items-center gap-1 transition"
                      >
                        <ArchiveRestore className="w-2.5 h-2.5" />
                        <span>{hiddenTopicIds.length}개 전체 복원</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* 플래너 일정표: 1일(예상|실행 나란히) / 1주간(시각화 Table) */
        /* ========================================================== */
        <div className="px-4 py-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center bg-[#0D0D11] p-0.5 rounded-xl border border-white/[0.08] text-[10.5px] font-black">
                <button
                  type="button"
                  onClick={() => setDiaryScope("day")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    diaryScope === "day"
                      ? "bg-[#FF5A36] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1일 일정표
                </button>
                <button
                  type="button"
                  onClick={() => setDiaryScope("week")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    diaryScope === "week"
                      ? "bg-[#FF5A36] text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1주간 일정표
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllTimetableHours((prev) => !prev)}
                  className="px-2 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[10px] font-bold text-slate-300 hover:text-white transition"
                >
                  {showAllTimetableHours ? "핵심시간(06~23)" : "전체 24h"}
                </button>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                  <span className="text-slate-400 hidden sm:inline">기준</span>
                  <select
                    value={dayResetHour}
                    onChange={(e) => setDayResetHour(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[10.5px] font-mono font-black text-amber-300 focus:outline-none focus:border-[#FF5A36]"
                    title="날짜 변경 기준 시각"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {diaryScope === "day" ? (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(addDaysISO(selectedDiaryDate, -1))}
                    className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="date"
                    value={selectedDiaryDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDiaryDate(e.target.value);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#101015] border border-white/[0.1] text-[11px] font-mono font-black text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(addDaysISO(selectedDiaryDate, 1))}
                    className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(todayISO)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                      selectedDiaryDate === todayISO
                        ? "bg-[#FF5A36]/20 border-[#FF5A36]/50 text-[#FF7A59]"
                        : "bg-[#101015] border-white/[0.08] text-slate-300 hover:text-white"
                    }`}
                  >
                    오늘
                  </button>
                </div>

                <div className="text-right text-[10px] font-mono shrink-0 whitespace-nowrap">
                  <div className="text-white font-black">
                    {formatShortMMDDWithDay(selectedDiaryDate, todayISO)}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 font-bold">
                    <span className="text-sky-300">
                      예상 {formatMinutesKo(timetableStats.planMinutes)}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[#FF7A59]">
                      실행 {formatMinutesKo(timetableStats.actualMinutes)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(addDaysISO(selectedDiaryDate, -7))}
                    className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 rounded-lg bg-[#101015] border border-white/[0.1] text-[11px] font-mono font-black text-white">
                    {weekDates[0].slice(5).replace("-", "/")} ~{" "}
                    {weekDates[6].slice(5).replace("-", "/")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(addDaysISO(selectedDiaryDate, 7))}
                    className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(todayISO)}
                    className="px-2 py-1 rounded-lg bg-[#101015] border border-[#FF5A36]/40 text-[10px] font-black text-[#FF7A59]"
                  >
                    이번 주
                  </button>
                </div>

                <div className="text-right text-[10px] font-mono">
                  <div className="text-sky-300 font-black">
                    주간 예상 {formatMinutesKo(weekSummary.totalGoalMinutes)}
                  </div>
                  <div className="text-[#FF7A59] font-bold">
                    타이머 실행 {formatMinutesKo(weekSummary.totalActualMinutes)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {diaryScope === "day" ? (
            <div className="space-y-3">
              {/* 슬림 1줄 단원 계획 추가 바 */}
              {allActiveTopicEntries.length > 0 && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#16161C] border border-white/[0.06]">
                  <select
                    value={quickAddTopicId}
                    onChange={(e) => setQuickAddTopicId(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#0E0E12] border border-white/[0.1] text-[10.5px] font-bold text-white"
                  >
                    {allActiveTopicEntries.map(({ subject, topic }) => (
                      <option key={topic.id} value={topic.id}>
                        [{subject.shortTitle}] {topic.topicNo ? `${topic.topicNo}. ` : ""}
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAddPlanForDate(selectedDiaryDate, quickAddTopicId)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10.5px] font-black shrink-0 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>계획 추가</span>
                  </button>
                </div>
              )}

              {/* 1일 시각화 일정표 Table: 10분 단위 X축(10~60분) × Y축(시), 한 칸에 [예상 | 실행] 동시 표시 */}
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Calendar className="w-4 h-4 text-[#FF5A36]" />
                      <span>
                        {selectedDiaryDate === todayISO ? "오늘" : selectedDiaryDate.slice(5)} 1일 시각화 일정표
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      한 칸의 왼쪽은 예상 계획(드래그 입력), 오른쪽은 타이머 실행 시간이 채워집니다.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleClearDayPlanSlots}
                      className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-rose-950/60 border border-white/[0.08] text-[10px] font-bold text-slate-300 hover:text-rose-200 flex items-center gap-1 transition"
                      title="오늘 예상 계획 슬롯만 비우기 (타이머 실행 기록은 보존)"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>예상 비우기</span>
                    </button>
                    <Link
                      href="/study/stats?tab=gap"
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/35 text-[10px] font-black text-sky-200 hover:bg-sky-500/25 flex items-center gap-1 transition"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Gap 수치</span>
                    </Link>
                  </div>
                </div>

                {/* 예상 계획 브러시 선택 바 (드래그용) */}
                <div className="space-y-2 p-2.5 rounded-xl bg-[#121218] border border-white/[0.06]">
                  {plannedTopicPalette.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {plannedTopicPalette.map((p) => {
                        const isSelected =
                          !useCustomTimetableColor &&
                          activePaletteItem?.topicId === p.topicId;
                        return (
                          <button
                            key={p.topicId}
                            type="button"
                            onClick={() => {
                              setUseCustomTimetableColor(false);
                              setSelectedPaletteTopicId(p.topicId);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1.5 transition ${
                              isSelected
                                ? "text-white border-white shadow"
                                : "bg-[#181820] text-slate-300 border-white/[0.08] hover:border-white/25"
                            }`}
                            style={isSelected ? { backgroundColor: p.color } : undefined}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: isSelected ? "#FFFFFF" : p.color }}
                            />
                            <span className="truncate max-w-[120px]">
                              {p.topic.topicNo ? `${p.topic.topicNo}. ` : ""}
                              {p.topic.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-400">
                      위에서 단원을 추가하거나{" "}
                      <button
                        type="button"
                        onClick={() => setViewMode("matrix")}
                        className="text-[#FF7A59] font-black underline"
                      >
                        목차 매트릭스
                      </button>
                      에서 계획을 잡으면 단원 색으로 일정표를 칠할 수 있습니다.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Palette className="w-3 h-3 text-amber-300" />
                      <span>직접 색:</span>
                    </span>
                    {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 7).map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setTimetableBrushColor(hex);
                          setUseCustomTimetableColor(true);
                        }}
                        className={`w-4 h-4 rounded-full border transition ${
                          useCustomTimetableColor && timetableBrushColor === hex
                            ? "border-white scale-110 ring-1 ring-white"
                            : "border-white/20 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* 범례 */}
                <div className="flex flex-wrap items-center gap-3 px-2.5 py-1.5 rounded-xl bg-[#121218] border border-white/[0.06] text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span className="w-3 h-3 rounded-sm bg-sky-400/55 border border-sky-300/80 inline-block" />
                    <span>칸 왼쪽: 예상 계획</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#FF7A59]">
                    <span className="w-3 h-3 rounded-sm bg-[#FF5A36] inline-block" />
                    <span>칸 오른쪽: 타이머 실행</span>
                  </span>
                  <span className="text-emerald-300 ml-auto text-[9.5px]">
                    초록 테두리 = 계획 적중
                  </span>
                </div>

                {/* 1일 통합 시각화 Table: Y축(시) × X축(10분~60분), 한 칸에 [예상 | 실행] */}
                <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#101015]">
                  <div className="grid grid-cols-[36px_repeat(6,minmax(0,1fr))] gap-1 px-2 py-2 bg-[#16161E] border-b border-white/[0.08] text-[9.5px] font-mono font-black text-slate-300">
                    <div className="text-center text-slate-400">시</div>
                    {[10, 20, 30, 40, 50, 60].map((minLabel) => (
                      <div key={minLabel} className="text-center">
                        {minLabel}분
                      </div>
                    ))}
                  </div>

                  <div
                    className="divide-y divide-white/[0.04] select-none"
                    onTouchMove={(e) => {
                      if (!ttDragAction) return;
                      const touch = e.touches[0];
                      if (!touch) return;
                      const el = globalThis.document.elementFromPoint(
                        touch.clientX,
                        touch.clientY
                      );
                      const btn = el?.closest("[data-tt-plan-slot]") as HTMLElement | null;
                      const slotKey = btn?.dataset.ttPlanSlot;
                      if (slotKey) {
                        applyTimetableSlotAction(slotKey, ttDragAction);
                      }
                    }}
                  >
                    {visibleDayHours.map((hour) => (
                      <div
                        key={hour}
                        className="grid grid-cols-[36px_repeat(6,minmax(0,1fr))] gap-1 px-2 py-1 items-center"
                      >
                        <div className="font-mono text-[10px] font-bold text-slate-400 text-center bg-[#13131A] rounded py-1 border border-white/[0.04]">
                          {String(hour).padStart(2, "0")}
                        </div>

                        {[0, 1, 2, 3, 4, 5].map((slot) => {
                          const key = `${hour}-${slot}`;
                          const cell = dayTimetableGrid[key];
                          const rawPlan = getTimetableSlotPlan(cell);
                          const planEntry = isPlanSlotVisibleForBooks(
                            rawPlan,
                            activeBookIds,
                            activeTopicIdSet
                          )
                            ? rawPlan
                            : null;
                          const actualEntry = getTimetableSlotActual(cell);
                          const isMatched = Boolean(
                            planEntry &&
                              actualEntry &&
                              (planEntry.topicId && actualEntry.topicId
                                ? planEntry.topicId === actualEntry.topicId
                                : planEntry.color === actualEntry.color)
                          );
                          const rangeLabel = `${String(hour).padStart(2, "0")}:${String(
                            slot * 10
                          ).padStart(2, "0")}~${String(slot * 10 + 10).padStart(2, "0")}`;

                          return (
                            <button
                              key={slot}
                              type="button"
                              data-tt-plan-slot={key}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                const isSamePaint =
                                  planEntry &&
                                  planEntry.color === activeTimetableBrush.color &&
                                  planEntry.topicId === activeTimetableBrush.topicId;
                                const action: "paint" | "erase" = isSamePaint
                                  ? "erase"
                                  : "paint";
                                setTtDragAction(action);
                                applyTimetableSlotAction(key, action);
                              }}
                              onPointerEnter={() => {
                                if (ttDragAction) {
                                  applyTimetableSlotAction(key, ttDragAction);
                                }
                              }}
                              title={`${rangeLabel} · 예상: ${
                                planEntry?.label || "없음"
                              } / 타이머 실행: ${actualEntry?.label || "없음"}`}
                              className={`h-6 rounded-[4px] bg-[#16161D] overflow-hidden grid grid-cols-2 gap-[1px] p-[1px] touch-none transition ${
                                isMatched
                                  ? "ring-1 ring-emerald-400/90"
                                  : "border border-white/[0.06] hover:border-sky-400/50"
                              }`}
                            >
                              {/* 칸 왼쪽: 예상 계획 */}
                              <span className="h-full rounded-[2px] bg-white/[0.02] overflow-hidden flex">
                                {planEntry && (
                                  <span
                                    className="w-full h-full rounded-[2px]"
                                    style={{
                                      backgroundColor: `${planEntry.color}99`,
                                      borderTop: `1.5px solid ${planEntry.color}`,
                                    }}
                                  />
                                )}
                              </span>

                              {/* 칸 오른쪽: 타이머 실행 */}
                              <span className="h-full rounded-[2px] bg-white/[0.02] overflow-hidden flex">
                                {actualEntry && (
                                  <span
                                    className="w-full h-full rounded-[2px]"
                                    style={{ backgroundColor: actualEntry.color }}
                                  />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1주간 시각화 Table: 월~일 × 시간 (좌:예상 | 우:타이머실행) */}
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-white">
                      <Calendar className="w-4 h-4 text-[#FF5A36]" />
                      <span>1주간 시각화 일정표 (예상 | 타이머 실행)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      각 칸의 왼쪽은 예상 계획, 오른쪽은 타이머 실행 기록입니다. 날짜·칸을 누르면 1일표로 열립니다.
                    </p>
                  </div>
                  <Link
                    href="/study/stats?tab=gap"
                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/35 text-[10px] font-black text-sky-200 hover:bg-sky-500/25 flex items-center gap-1 transition"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>주간 Gap 수치</span>
                  </Link>
                </div>

                {/* 범례 */}
                <div className="flex flex-wrap items-center gap-3 px-2.5 py-1.5 rounded-xl bg-[#121218] border border-white/[0.06] text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span className="w-3 h-3 rounded-sm bg-sky-400/50 border border-sky-300/70 inline-block" />
                    <span>칸 왼쪽: 예상 계획</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#FF7A59]">
                    <span className="w-3 h-3 rounded-sm bg-[#FF5A36] inline-block" />
                    <span>칸 오른쪽: 타이머 실행</span>
                  </span>
                  <span className="text-slate-400 ml-auto font-mono">
                    Gap:{" "}
                    <strong
                      className={
                        weekPlanActualGap.totalGapMinutes >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }
                    >
                      {formatGapMinutesKo(weekPlanActualGap.totalGapMinutes)}
                    </strong>
                  </span>
                </div>

                {/* 주간 시간표 시각화 Table */}
                <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#101015]">
                  <table className="w-full min-w-[350px] border-collapse table-fixed">
                    <thead>
                      <tr className="bg-[#16161E] border-b border-white/[0.08]">
                        <th className="w-[34px] py-2 text-[9.5px] font-mono font-bold text-slate-400 text-center border-r border-white/[0.06]">
                          시
                        </th>
                        {weekDates.map((dateISO) => {
                          const [y, m, d] = dateISO.split("-").map(Number);
                          const dt = new Date(y, (m || 1) - 1, d || 1);
                          const wd = WEEKDAY_KO[dt.getDay()];
                          const isToday = dateISO === todayISO;
                          return (
                            <th
                              key={dateISO}
                              className={`py-1.5 px-0.5 text-center border-r last:border-r-0 border-white/[0.06] ${
                                isToday ? "bg-[#FF5A36]/15" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDiaryDate(dateISO);
                                  setDiaryScope("day");
                                }}
                                className="w-full flex flex-col items-center hover:opacity-80 transition"
                                title={`${dateISO} 1일 일정표 열기`}
                              >
                                <span
                                  className={`text-[10px] font-black ${
                                    isToday
                                      ? "text-[#FF7A59]"
                                      : dt.getDay() === 0
                                        ? "text-rose-300"
                                        : dt.getDay() === 6
                                          ? "text-sky-300"
                                          : "text-white"
                                  }`}
                                >
                                  {wd}
                                </span>
                                <span className="text-[8.5px] font-mono text-slate-400">
                                  {m}/{d}
                                </span>
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.04]">
                      {visibleWeekHours.map((hour) => (
                        <tr key={hour}>
                          <td className="py-1 text-center font-mono text-[9.5px] font-bold text-slate-400 border-r border-white/[0.06] bg-[#13131A]">
                            {String(hour).padStart(2, "0")}
                          </td>
                          {weekDates.map((dateISO) => {
                            const dayGrid = timetablesByDate[dateISO] || {};
                            let planCount = 0;
                            let actualCount = 0;
                            let planColor: string | null = null;
                            let actualColor: string | null = null;
                            const planLabels = new Set<string>();
                            const actualLabels = new Set<string>();

                            for (let s = 0; s < 6; s += 1) {
                              const slot = dayGrid[`${hour}-${s}`];
                              const rawP = getTimetableSlotPlan(slot);
                              const p = isPlanSlotVisibleForBooks(
                                rawP,
                                activeBookIds,
                                activeTopicIdSet
                              )
                                ? rawP
                                : null;
                              const a = getTimetableSlotActual(slot);
                              if (p) {
                                planCount += 1;
                                if (!planColor) planColor = p.color;
                                if (p.label) planLabels.add(p.label);
                              }
                              if (a) {
                                actualCount += 1;
                                if (!actualColor) actualColor = a.color;
                                if (a.label) actualLabels.add(a.label);
                              }
                            }

                            const isToday = dateISO === todayISO;
                            const tooltipText = `${dateISO.slice(5)} ${String(hour).padStart(
                              2,
                              "0"
                            )}시 · 예상 ${planCount * 10}분${
                              planLabels.size > 0
                                ? `(${Array.from(planLabels).join(", ")})`
                                : ""
                            } / 타이머 ${actualCount * 10}분${
                              actualLabels.size > 0
                                ? `(${Array.from(actualLabels).join(", ")})`
                                : ""
                            }`;

                            return (
                              <td
                                key={dateISO}
                                className={`p-[2px] border-r last:border-r-0 border-white/[0.05] ${
                                  isToday ? "bg-[#FF5A36]/[0.04]" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDiaryDate(dateISO);
                                    setDiaryScope("day");
                                  }}
                                  title={tooltipText}
                                  className="w-full h-6 rounded-[4px] bg-[#16161D] border border-white/[0.04] hover:border-white/25 overflow-hidden grid grid-cols-2 gap-[1px] p-[1px] transition"
                                >
                                  {/* 셀 왼쪽 절반: 예상 계획 */}
                                  <span
                                    className="h-full rounded-[2px] flex items-end justify-center overflow-hidden bg-white/[0.02]"
                                  >
                                    {planCount > 0 && planColor && (
                                      <span
                                        className="w-full rounded-[2px]"
                                        style={{
                                          height: `${Math.max(25, Math.round((planCount / 6) * 100))}%`,
                                          backgroundColor: `${planColor}99`,
                                          borderTop: `1px solid ${planColor}`,
                                        }}
                                      />
                                    )}
                                  </span>
                                  {/* 셀 오른쪽 절반: 타이머 실행 */}
                                  <span
                                    className="h-full rounded-[2px] flex items-end justify-center overflow-hidden bg-white/[0.02]"
                                  >
                                    {actualCount > 0 && actualColor && (
                                      <span
                                        className="w-full rounded-[2px]"
                                        style={{
                                          height: `${Math.max(25, Math.round((actualCount / 6) * 100))}%`,
                                          backgroundColor: actualColor,
                                        }}
                                      />
                                    )}
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>

                    {/* 하단 요일별 예상/실행 총합 요약 행 */}
                    <tfoot>
                      <tr className="bg-[#16161E] border-t border-white/[0.1]">
                        <td className="py-1.5 text-center text-[9px] font-black text-slate-400 border-r border-white/[0.06]">
                          합계
                        </td>
                        {weekPlanActualGap.dailyRows.map((row) => (
                          <td
                            key={row.dateISO}
                            className="py-1 px-0.5 text-center font-mono text-[8.5px] border-r last:border-r-0 border-white/[0.06]"
                          >
                            <div className="text-sky-300 font-bold">
                              예{row.planMinutes}m
                            </div>
                            <div className="text-[#FF7A59] font-black">
                              실{row.actualMinutes}m
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 요일별 단원 계획 빠른 체크 & 추가 (접이식) */}
              <div className="rounded-2xl bg-[#1A1A21] border border-white/[0.08] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowWeekDailyDetails((prev) => !prev)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-black text-white hover:bg-white/[0.03] transition"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>요일별 단원 목록 보기 / 빠른 추가 ({weekSummary.plannedCount}건 예정)</span>
                  </span>
                  {showWeekDailyDetails ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showWeekDailyDetails && (
                  <div className="px-3 pb-3 space-y-2 border-t border-white/[0.06] pt-2.5">
                    {weekDates.map((dateISO) => {
                      const dayItems = allScheduleItems.filter((i) => i.dateISO === dateISO);
                      const plannedItems = dayItems.filter(
                        (i) => i.cell.status === "plan" || i.cell.status === "partial"
                      );
                      const doneCount = dayItems.filter(
                        (i) => i.cell.status === "done"
                      ).length;
                      const dayRow = weekPlanActualGap.dailyRows.find(
                        (r) => r.dateISO === dateISO
                      );
                      const isToday = dateISO === todayISO;

                      return (
                        <div
                          key={dateISO}
                          className={`p-3 rounded-xl border space-y-2 ${
                            isToday
                              ? "bg-[#1E191B] border-[#FF5A36]/50"
                              : "bg-[#121218] border-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-mono font-black ${
                                  isToday ? "text-[#FF7A59]" : "text-white"
                                }`}
                              >
                                {formatShortMMDDWithDay(dateISO, todayISO)}
                              </span>
                              <span className="text-[9.5px] font-mono text-sky-300 font-bold">
                                예 {dayRow?.planMinutes ?? 0}분 · 실{" "}
                                {dayRow?.actualMinutes ?? 0}분
                              </span>
                              {doneCount > 0 && (
                                <span className="text-[9.5px] font-mono text-emerald-300 font-bold">
                                  · 완료 {doneCount}건
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDiaryDate(dateISO);
                                setDiaryScope("day");
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-[#FF5A36] text-[9.5px] font-black text-slate-200 hover:text-white flex items-center gap-1 transition"
                            >
                              <span>1일표</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {plannedItems.length === 0 ? (
                            <div className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-[#0D0D12] border border-white/[0.04]">
                              <span className="text-[10px] text-slate-500">
                                예정된 단원이 없습니다.
                              </span>
                              {allActiveTopicEntries.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickAddPlanForDate(dateISO, quickAddTopicId)
                                  }
                                  className="text-[10px] font-black text-[#FF7A59] hover:underline flex items-center gap-0.5"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>빠른 추가</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {plannedItems.map((item) => {
                                const itemColor =
                                  item.cell.customColor || item.subject.color;
                                const estMin =
                                  item.cell.minutes ?? item.topic.estimatedMinutes;
                                return (
                                  <div
                                    key={item.key}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#0D0D12] border border-white/[0.05] flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: itemColor }}
                                      />
                                      <span className="text-[10.5px] font-extrabold text-white truncate">
                                        {item.topic.topicNo
                                          ? `${item.topic.topicNo}. `
                                          : ""}
                                        {item.topic.title}
                                      </span>
                                      <span className="text-[9.5px] text-slate-400 font-mono shrink-0">
                                        {estMin}m
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          upsertMatrixCell(item.topic.id, item.dateISO, {
                                            ...item.cell,
                                            status: "done",
                                          })
                                        }
                                        className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-black"
                                      >
                                        완료
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteMatrixCell(item.topic.id, item.dateISO)
                                        }
                                        className="p-0.5 rounded text-slate-500 hover:text-rose-300"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 첨부 이미지 스타일: 과목 · 다중 교재 편집 & 보관함 모달 */}
      {/* ========================================================== */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-[440px] max-h-[88vh] overflow-y-auto rounded-3xl bg-[#0D0D11] border border-white/[0.12] p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManagerModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-black text-white">과목 · 교재 편집</h2>
              </div>
              <Link
                href="/study/books"
                className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
              >
                교재 센터 →
              </Link>
            </div>

            {/* 1. 다중 교재 선택 & 커스텀 교재 추가 (책 빼도 데이터 보존) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>적용 책 선택 ({activeBookIds.length}권 · 빼도 기록 보존)</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsManagerModalOpen(false);
                    openAddModal("book");
                  }}
                  className="text-[#FF7A59] font-black flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>새 책 추가</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {catalog.map((book) => {
                  const isActive = activeBookIds.includes(book.id);
                  const isCustomBook = book.id.startsWith("custom-book-");
                  return (
                    <div
                      key={book.id}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                        isActive
                          ? "bg-[#1B1922] border-[#FF5A36]/50"
                          : "bg-[#14141A] border-white/[0.06]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleBookActive(book.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                              : "border-slate-500"
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3" />}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shrink-0"
                          style={{ backgroundColor: book.coverColor }}
                        >
                          {book.badge}
                        </span>
                        <span className="text-[11px] font-bold text-white truncate">
                          {book.title}
                        </span>
                      </button>
                      {isCustomBook && (
                        <button
                          type="button"
                          onClick={() => deleteCustomBook(book.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                          title="책 완전 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 활성 과목 다크 카드 리스트 */}
            <div className="rounded-2xl bg-[#18181D] border border-white/[0.06] divide-y divide-white/[0.05] overflow-visible">
              {subjects.map((subj) => {
                const isMenuOpen = openMenuSubjectId === subj.id;
                return (
                  <div
                    key={subj.id}
                    className="relative px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: subj.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">
                          {subj.title}
                        </div>
                        <div className="text-[9.5px] text-slate-400 truncate">
                          {subj.category || subj.examStage} · {subj.bookBadge || "기본"} ·{" "}
                          {subj.units.reduce((acc, u) => acc + u.topics.length, 0)}단원
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuSubjectId(isMenuOpen ? null : subj.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-4 top-10 z-50 w-44 rounded-2xl bg-[#22222A] border border-white/[0.12] py-1.5 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(subj)}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/[0.06] flex items-center gap-2.5"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          <span>수정</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSubject(subj.id);
                            setOpenMenuSubjectId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-300 hover:bg-white/[0.06] flex items-center gap-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>삭제</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            archiveSubject(subj.id);
                            setOpenMenuSubjectId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/[0.06] flex items-center gap-2.5"
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-400" />
                          <span>보관함에 넣기</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsManagerModalOpen(false);
                  openAddModal("subject");
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition"
              >
                <span className="w-6 h-6 rounded-full bg-white/[0.12] text-white flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold text-white">과목추가 (책 연결)</span>
              </button>
            </div>

            {/* 3. 보관함 N */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-black text-slate-300 px-1">
                보관함 {archivedSubjects.length}
              </div>

              <div className="rounded-2xl bg-[#16161B] border border-white/[0.06] divide-y divide-white/[0.05]">
                {archivedSubjects.length === 0 ? (
                  <div className="px-4 py-4 text-[11px] text-slate-500 text-center">
                    보관함에 넣은 과목이 없습니다.
                  </div>
                ) : (
                  archivedSubjects.map((subj) => {
                    const isMenuOpen = openMenuSubjectId === subj.id;
                    return (
                      <div
                        key={subj.id}
                        className="relative px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full opacity-60 shrink-0"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="text-xs font-bold text-slate-300 truncate">
                            {subj.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuSubjectId(isMenuOpen ? null : subj.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 top-10 z-50 w-44 rounded-2xl bg-[#22222A] border border-white/[0.12] py-1.5 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                restoreSubject(subj.id);
                                setOpenMenuSubjectId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-300 hover:bg-white/[0.06] flex items-center gap-2.5"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                              <span>보관함에서 꺼내기</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSubject(subj)}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/[0.06] flex items-center gap-2.5"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                              <span>수정</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteSubject(subj.id);
                                setOpenMenuSubjectId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-300 hover:bg-white/[0.06] flex items-center gap-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>삭제</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
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
                    style={{
                      backgroundColor: editingCell.customColor || editingCell.subject.color,
                    }}
                  >
                    {editingCell.subject.category || editingCell.subject.examStage} ·{" "}
                    {editingCell.subject.shortTitle}
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

            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, status: "done" })}
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${
                    editingCell.status === "done"
                      ? "text-white border-white/40 shadow-md"
                      : "bg-[#111116] text-slate-400 border-white/[0.06]"
                  }`}
                  style={
                    editingCell.status === "done"
                      ? {
                          backgroundColor:
                            editingCell.customColor || editingCell.subject.color,
                        }
                      : undefined
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>완료 (1R)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, status: "partial" })}
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${
                    editingCell.status === "partial"
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
                  className={`py-2.5 px-1.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1 transition ${
                    editingCell.status === "plan"
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
                    진행중 상태는 순공시간에만 합산되며, 단원을 최종 <strong>완료</strong> 처리할 때만 회독(+1R)이 진해집니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-300 mr-1">셀 색상</span>
              <button
                type="button"
                onClick={() =>
                  setEditingCell({ ...editingCell, customColor: undefined })
                }
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  !editingCell.customColor
                    ? "bg-white text-slate-950 border-white"
                    : "bg-[#101015] text-slate-400 border-white/[0.1]"
                }`}
              >
                과목기본
              </button>
              {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 7).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setEditingCell({ ...editingCell, customColor: hex })}
                  className={`w-4 h-4 rounded-full border ${
                    editingCell.customColor === hex
                      ? "border-white scale-110 ring-1 ring-white"
                      : "border-white/25"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                type="color"
                value={editingCell.customColor || editingCell.subject.color}
                onChange={(e) =>
                  setEditingCell({ ...editingCell, customColor: e.target.value })
                }
                className="w-6 h-5 bg-transparent cursor-pointer"
              />
            </div>

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

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-300">학습 시간</span>
              <div className="flex items-center gap-1">
                {[20, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setEditingCell({ ...editingCell, minutes: min })}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold transition ${
                      editingCell.minutes === min
                        ? "bg-[#FF5A36] text-white"
                        : "bg-[#101015] text-slate-400 border border-white/[0.06]"
                    }`}
                  >
                    {min}분
                  </button>
                ))}
              </div>
            </div>

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

      <CurriculumAddModal
        isOpen={addModalState.open}
        initialStep={addModalState.step}
        initialBookId={addModalState.bookId}
        initialSubjectId={addModalState.subjectId}
        onClose={() => setAddModalState((prev) => ({ ...prev, open: false }))}
        catalog={catalog}
        subjects={subjects}
        categories={categories}
        onAddBook={addCustomBook}
        onAddSubject={addCustomSubject}
        onAddTopicsBulk={addCustomTopicsBulk}
        onReplaceBookStructure={replaceCustomBookStructure}
      />

      {/* 독립 과목 수정 모달 (매트릭스 칸 & 과목관리 공용) */}
      {editingSubjectForm && (
        <div
          className="fixed inset-0 z-[65] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setEditingSubjectForm(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-3xl bg-[#181820] border border-sky-500/40 p-5 space-y-3.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-sky-400" />
                <span>과목 정보 · 분류 · 색상 수정</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingSubjectForm(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                type="text"
                value={editingSubjectForm.title}
                onChange={(e) =>
                  setEditingSubjectForm({
                    ...editingSubjectForm,
                    title: e.target.value,
                  })
                }
                placeholder="과목명"
                className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
              />
              <select
                value={editingSubjectForm.category}
                onChange={(e) =>
                  setEditingSubjectForm({
                    ...editingSubjectForm,
                    category: e.target.value,
                  })
                }
                className="px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400">
                과목 기본 색상 (일정표·매트릭스 동시 반영)
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CUSTOM_SUBJECT_COLOR_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() =>
                      setEditingSubjectForm({ ...editingSubjectForm, color: hex })
                    }
                    className={`w-5 h-5 rounded-full border ${
                      editingSubjectForm.color === hex
                        ? "border-white scale-110 ring-1 ring-white"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <input
                  type="color"
                  value={editingSubjectForm.color}
                  onChange={(e) =>
                    setEditingSubjectForm({
                      ...editingSubjectForm,
                      color: e.target.value,
                    })
                  }
                  className="w-7 h-5 bg-transparent cursor-pointer"
                />
              </div>
            </div>
            {editingSubjectForm.firstUnitId && (
              <input
                type="text"
                value={editingSubjectForm.newTopicTitle}
                onChange={(e) =>
                  setEditingSubjectForm({
                    ...editingSubjectForm,
                    newTopicTitle: e.target.value,
                  })
                }
                placeholder="이 과목에 새 단원 바로 추가 (선택 입력)"
                className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
              />
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingSubjectForm(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveSubjectForm}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black"
              >
                과목 수정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 단원별 수정 & 개별 컬러 조정 모달 */}
      {editingTopicForm && (
        <div
          className="fixed inset-0 z-[65] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
          onClick={() => setEditingTopicForm(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-3xl bg-[#181820] border border-[#FF5A36]/45 p-5 space-y-3.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 truncate">
                  {editingTopicForm.subjectTitle}
                </div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Pencil className="w-3.5 h-3.5 text-[#FF7A59]" />
                  <span>단원 이름 · 예상분 · 개별 컬러 수정</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTopicForm(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={editingTopicForm.title}
                onChange={(e) =>
                  setEditingTopicForm({ ...editingTopicForm, title: e.target.value })
                }
                placeholder="단원명"
                className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editingTopicForm.defaultKeyword}
                  onChange={(e) =>
                    setEditingTopicForm({
                      ...editingTopicForm,
                      defaultKeyword: e.target.value,
                    })
                  }
                  placeholder="짧은 키워드"
                  className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs">
                  <span className="text-slate-400 text-[10.5px] shrink-0">예상</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    value={editingTopicForm.estimatedMinutes}
                    onChange={(e) =>
                      setEditingTopicForm({
                        ...editingTopicForm,
                        estimatedMinutes: Number(e.target.value) || 30,
                      })
                    }
                    className="w-full bg-transparent text-right font-mono font-bold text-white focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10.5px] shrink-0">분</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400">
                  단원 개별 컬러 (일정표·매트릭스 구분용)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTopicForm({ ...editingTopicForm, color: "" })
                  }
                  className={`font-black ${
                    editingTopicForm.color === ""
                      ? "text-emerald-300"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  과목색({editingTopicForm.subjectColor}) 따르기
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CUSTOM_SUBJECT_COLOR_PALETTE.map((hex) => {
                  const selected = editingTopicForm.color === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        setEditingTopicForm({ ...editingTopicForm, color: hex })
                      }
                      className={`w-5 h-5 rounded-full border ${
                        selected
                          ? "border-white scale-110 ring-1 ring-white"
                          : "border-white/20"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
                <input
                  type="color"
                  value={editingTopicForm.color || editingTopicForm.subjectColor}
                  onChange={(e) =>
                    setEditingTopicForm({
                      ...editingTopicForm,
                      color: e.target.value,
                    })
                  }
                  className="w-7 h-5 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingTopicForm(null)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveTopicForm}
                className="flex-1 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-black"
              >
                단원 수정 저장
              </button>
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
  matrixLogs: Record<string, MatrixCellLog>;
  topicDoneOrderMap: Map<string, number>;
  chapterTotals: Record<string, { solvedCount: number; correctCount: number }>;
  dragMode: MatrixDragMode;
  dragKeySet: Set<string>;
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
  onCellPointerDown: (matrixKey: string) => void;
  onCellPointerEnter: (matrixKey: string) => void;
  onAddInlineTopic: (unitId: string, title: string, keyword: string) => void;
  onDeleteCustomTopic: (unitId: string, topicId: string) => void;
  onEditSubject: () => void;
  onEditTopic: (topic: StudyTopicNode) => void;
  onArchiveSubject: () => void;
  onHideTopic: (topicId: string) => void;
}

function SubjectRowsGroup({
  subject,
  isCollapsed,
  subjectTopicCount,
  subjectTotalDone,
  dateColumns,
  matrixLogs,
  topicDoneOrderMap,
  chapterTotals,
  dragMode,
  dragKeySet,
  getTopicDoneCount,
  getSubjectDaySummary,
  onToggleCollapse,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  onAddInlineTopic,
  onDeleteCustomTopic,
  onEditSubject,
  onEditTopic,
  onArchiveSubject,
  onHideTopic,
}: SubjectRowsGroupProps) {
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const defaultUnitId = subject.units[0]?.id;

  const submitInlineTopic = () => {
    if (!defaultUnitId || !newTitle.trim()) return;
    onAddInlineTopic(defaultUnitId, newTitle.trim(), newKeyword.trim());
    setNewTitle("");
    setNewKeyword("");
    setIsAddingTopic(false);
  };

  return (
    <>
      <tr className="border-b border-white/[0.1]">
        <td
          className="sticky left-0 z-20 border-r border-white/[0.12] px-2 py-2 bg-[#16161F]"
          style={{ boxShadow: `inset 4px 0 0 ${subject.color}` }}
        >
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex items-center gap-1.5 min-w-0 flex-1 text-left group"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white shrink-0" />
              )}
              <span
                className="px-1.5 py-0.5 rounded text-[8.5px] font-black text-white shrink-0 max-w-[66px] truncate"
                style={{ backgroundColor: subject.color }}
                title={subject.category || subject.examStage}
              >
                {subject.category || subject.examStage}
              </span>
              <span className="text-[11px] font-black text-white truncate group-hover:underline">
                {subject.title}
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onEditSubject}
                className="px-1.5 py-0.5 rounded bg-white/[0.07] hover:bg-sky-500 text-[9px] font-black text-slate-200 hover:text-white flex items-center gap-0.5 transition"
                title={`${subject.title} 과목명·색상 수정`}
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>수정</span>
              </button>
              <button
                type="button"
                onClick={onArchiveSubject}
                className="p-0.5 rounded bg-white/[0.06] hover:bg-rose-500/80 text-slate-400 hover:text-white transition"
                title={`${subject.title} 이 자리에서 빼기 (보관함에 보존)`}
                aria-label={`${subject.title} 빼기`}
              >
                <X className="w-3 h-3" />
              </button>
              <span className="text-[9.5px] font-mono font-bold text-slate-400">
                {isCollapsed ? `${subjectTopicCount}·` : ""}
                <strong style={{ color: subject.color }}>{subjectTotalDone}R</strong>
              </span>
            </div>
          </div>
        </td>

        {dateColumns.map((col) => {
          const summary = getSubjectDaySummary(subject, col.dateISO);
          const hasDone = summary.doneCount > 0;
          const hasPartial = summary.partialCount > 0;
          const hasPlan = summary.planCount > 0;
          const doneShade = getRoundColorStyle(subject.color, Math.min(5, summary.doneCount));

          return (
            <td
              key={col.dateISO}
              className={`border-r border-white/[0.06] px-0.5 py-1 text-center align-middle ${
                col.isToday ? "bg-[#FF5A36]/[0.06]" : "bg-[#13131A]"
              }`}
            >
              {isCollapsed ? (
                hasDone ? (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-full py-1 rounded text-[9px] font-black truncate px-0.5"
                    style={{
                      backgroundColor: doneShade.backgroundColor,
                      border: `1px solid ${doneShade.borderColor}`,
                      color: doneShade.textColor,
                    }}
                    title={`${subject.title} (${col.dateISO}): ${summary.doneCount}개 완료`}
                  >
                    {summary.doneCount > 1 ? `${summary.doneCount}건` : summary.firstKeyword}
                  </button>
                ) : hasPartial ? (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-full py-1 rounded border border-amber-400 text-[9px] font-bold text-amber-200 bg-amber-500/20 truncate px-0.5"
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

      {/* ① 책/과목 내부 + 단원 인라인 입력 행 */}
      {isAddingTopic && defaultUnitId && (
        <tr className="border-b border-[#FF5A36]/30 bg-[#181822]">
          <td
            colSpan={dateColumns.length + 1}
            className="px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-1.5 max-w-lg">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitInlineTopic();
                }}
                placeholder={`${subject.title} 새 단원명 (예: 2단원 기출오답)`}
                className="flex-1 min-w-[160px] px-2.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[11px] text-white"
              />
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="키워드"
                className="w-24 px-2 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[11px] text-white"
              />
              <button
                type="button"
                onClick={submitInlineTopic}
                className="px-2.5 py-1 rounded-lg bg-[#FF5A36] text-white text-[10.5px] font-black"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTopic(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      )}

      {!isCollapsed && subjectTopicCount === 0 && !isAddingTopic && defaultUnitId && (
        <tr className="border-b border-white/[0.06] bg-[#121218]">
          <td
            colSpan={dateColumns.length + 1}
            className="px-4 py-2 text-[10.5px] text-slate-400"
          >
            <span>아직 등록된 단원이 없습니다. </span>
            <button
              type="button"
              onClick={() => setIsAddingTopic(true)}
              className="text-[#FF7A59] font-black hover:underline ml-1"
            >
              + 이 과목에 첫 단원 추가하기
            </button>
          </td>
        </tr>
      )}

      {!isCollapsed &&
        subject.units.map((unit) =>
          unit.topics.map((topic, tIdx) => {
            const doneCount = getTopicDoneCount(topic.id);
            const topicColor = topic.color || subject.color;
            const roundBadgeShade = getRoundColorStyle(topicColor, doneCount);
            const chapterStat = topic.chapterCode ? chapterTotals[topic.chapterCode] : undefined;
            const solvedCount = chapterStat?.solvedCount ?? 0;
            const isCustomTopic = topic.id.startsWith("custom-topic-");

            return (
              <tr
                key={topic.id}
                className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
              >
                <td
                  className="sticky left-0 z-10 bg-[#111116] border-r border-white/[0.12] px-2.5 py-1.5"
                  style={{ boxShadow: `inset 4px 0 0 ${topicColor}` }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      {tIdx === 0 && (
                        <div className="text-[8.5px] font-extrabold text-slate-500 truncate leading-tight mb-0.5">
                          {unit.title}
                        </div>
                      )}
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: topicColor }}
                        />
                        {topic.topicNo && (
                          <span
                            className="text-[9.5px] font-mono font-black shrink-0"
                            style={{ color: topicColor }}
                          >
                            {topic.topicNo}.
                          </span>
                        )}
                        <span className="text-[10.5px] font-bold text-slate-200 truncate leading-tight">
                          {topic.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditTopic(topic)}
                          className="p-0.5 text-slate-500 hover:text-sky-300 shrink-0 transition"
                          title="단원 이름·예상분·컬러 수정"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            isCustomTopic
                              ? onDeleteCustomTopic(unit.id, topic.id)
                              : onHideTopic(topic.id)
                          }
                          className="text-slate-600 hover:text-rose-400 shrink-0"
                          title={
                            isCustomTopic
                              ? "커스텀 단원 삭제"
                              : "이 단원 플래너에서 빼기 (언제든 복원 가능)"
                          }
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
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
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0"
                      style={{
                        backgroundColor: roundBadgeShade.backgroundColor,
                        border: `1px solid ${roundBadgeShade.borderColor}`,
                        color: roundBadgeShade.textColor,
                        boxShadow: roundBadgeShade.boxShadow,
                      }}
                      title={`누적 ${doneCount}회독 (회독이 쌓일수록 진해짐)`}
                    >
                      {doneCount}R
                    </span>
                  </div>
                </td>

                {dateColumns.map((col) => {
                  const mKey = makeMatrixKey(topic.id, col.dateISO);
                  const cell = matrixLogs[mKey];
                  const isDragSelected = dragKeySet.has(mKey);
                  const resolvedColor = cell?.customColor || topicColor;
                  const cellRound = topicDoneOrderMap.get(mKey) || 1;
                  const doneShade = getRoundColorStyle(resolvedColor, cellRound);

                  return (
                    <td
                      key={col.dateISO}
                      className={`border-r border-white/[0.05] p-0.5 text-center align-middle ${
                        col.isToday ? "bg-[#FF5A36]/[0.07]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        data-matrix-key={mKey}
                        onClick={() => {
                          if (dragMode === "tap") {
                            onCellClick(subject, unit.title, topic, col.dateISO);
                          }
                        }}
                        onPointerDown={(e) => {
                          if (dragMode === "tap") return;
                          e.preventDefault();
                          onCellPointerDown(mKey);
                        }}
                        onPointerEnter={() => {
                          if (dragMode !== "tap") {
                            onCellPointerEnter(mKey);
                          }
                        }}
                        className={`w-full h-7 rounded-[4px] px-0.5 text-[9px] leading-tight flex items-center justify-center truncate transition ${
                          dragMode !== "tap" ? "touch-none" : ""
                        } ${
                          isDragSelected
                            ? "ring-2 ring-white bg-[#FF5A36]/40 text-white font-black"
                            : cell
                              ? cell.status === "done"
                                ? "font-black hover:brightness-110"
                                : cell.status === "partial"
                                  ? "border border-amber-400 font-bold hover:brightness-110"
                                  : "border border-dashed font-bold hover:brightness-110"
                              : "hover:bg-white/[0.08] text-transparent hover:text-slate-500"
                        }`}
                        style={
                          !isDragSelected && cell
                            ? cell.status === "done"
                              ? {
                                  backgroundColor: doneShade.backgroundColor,
                                  border: `1px solid ${doneShade.borderColor}`,
                                  color: doneShade.textColor,
                                  boxShadow: doneShade.boxShadow,
                                }
                              : cell.status === "partial"
                                ? {
                                    backgroundColor: `${resolvedColor}42`,
                                    color: "#FDE68A",
                                  }
                                : {
                                    borderColor: resolvedColor,
                                    backgroundColor: `${resolvedColor}24`,
                                    color: "#E2E8F0",
                                  }
                            : undefined
                        }
                        title={
                          cell
                            ? `${topic.title} (${col.dateISO}): ${cell.keyword} (${
                                cell.status === "done"
                                  ? `${cellRound}회독 완료`
                                  : cell.status === "partial"
                                    ? "진행중(이월)"
                                    : "계획"
                              })`
                            : `${topic.title} (${col.dateISO}) 탭하여 기록/계획`
                        }
                      >
                        {cell
                          ? cell.status === "done"
                            ? `${cellRound}R ${cell.keyword}`
                            : cell.status === "partial"
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

      {/* 펼쳐진 상태에서 하단 + 단원 추가 버튼 행 */}
      {!isCollapsed && defaultUnitId && (
        <tr className="border-b border-white/[0.08] bg-[#101016]">
          <td colSpan={dateColumns.length + 1} className="px-3 py-1">
            <button
              type="button"
              onClick={() => setIsAddingTopic((prev) => !prev)}
              className="text-[10px] font-bold text-slate-400 hover:text-[#FF7A59] flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>{subject.title}에 단원 추가</span>
            </button>
          </td>
        </tr>
      )}
    </>
  );
}
