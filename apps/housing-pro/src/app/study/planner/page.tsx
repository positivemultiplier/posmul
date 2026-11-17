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
  CalendarPlus,
  ListTodo,
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
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  addDaysISO,
  diffDaysISO,
  getHoursFromReset,
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
  examStage: "1차" | "2차";
  color: string;
  firstUnitId?: string;
  newTopicTitle: string;
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
  const day = dt.getDay(); // 0=일, 1=월 ...
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
    matrixLogs,
    timetablesByDate,
    setTimetableSlots,
    chapterTotals,
    collapsedSubjectIds,
    toggleBookActive,
    addCustomBook,
    deleteCustomBook,
    addCustomSubject,
    updateSubjectCustomization,
    archiveSubject,
    restoreSubject,
    deleteSubject,
    addCustomTopic,
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
  const [showCompletedInDay, setShowCompletedInDay] = useState<boolean>(false);
  const prevTodayRef = useRef<string>(todayISO);

  const [stageFilter, setStageFilter] = useState<"ALL" | "1차" | "2차">("ALL");
  const [windowStartOffset, setWindowStartOffset] = useState<number>(-12);
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [selectedPaletteTopicId, setSelectedPaletteTopicId] = useState<string | null>(null);
  const [quickAddTopicId, setQuickAddTopicId] = useState<string>("");

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

  // 과목 · 다중 교재 편집 모달 (첨부 이미지 UI 반영)
  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);
  const [openMenuSubjectId, setOpenMenuSubjectId] = useState<string | null>(null);
  const [editingSubjectForm, setEditingSubjectForm] =
    useState<EditingSubjectFormState | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState<boolean>(false);
  const [newSubjTitle, setNewSubjTitle] = useState<string>("");
  const [newSubjStage, setNewSubjStage] = useState<"1차" | "2차">("2차");
  const [newSubjColor, setNewSubjColor] = useState<string>(CUSTOM_SUBJECT_COLOR_PALETTE[0]);
  const [newSubjTopicsText, setNewSubjTopicsText] = useState<string>("");

  const [isAddingBook, setIsAddingBook] = useState<boolean>(false);
  const [newBookTitle, setNewBookTitle] = useState<string>("");
  const [newBookBadge, setNewBookBadge] = useState<string>("");
  const [newBookColor, setNewBookColor] = useState<string>("#FF5A36");

  // todayISO가 날짜 변경 기준 시각 변경 등으로 갱신될 때, 기존 오늘을 보고 있던 경우 동적 동기화
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
      if (params.get("tab") === "diary") {
        setViewMode("diary");
      }
      if (params.get("scope") === "week") {
        setDiaryScope("week");
      }
    }
  }, []);

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

  // 차수 필터링된 활성 과목 목록
  const visibleSubjects = useMemo(() => {
    if (stageFilter === "ALL") return subjects;
    return subjects.filter((s) => s.examStage === stageFilter);
  }, [subjects, stageFilter]);

  // 모든 활성 단원 플랫 리스트 (빠른 계획 추가용)
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

  // 전체 목차 매트릭스의 셀 맵 추출 (일정표 1일/1주일 공용 소스)
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

  // 오늘 기준 계획 건수 (헤더 배지용)
  const todayPlannedCount = useMemo(
    () =>
      allScheduleItems.filter(
        (i) =>
          i.dateISO === todayISO &&
          (i.cell.status === "plan" || i.cell.status === "partial")
      ).length,
    [allScheduleItems, todayISO]
  );

  // 선택된 1일(`selectedDiaryDate`)에 해당하는 항목만 필터링
  const selectedDayItems = useMemo(
    () => allScheduleItems.filter((i) => i.dateISO === selectedDiaryDate),
    [allScheduleItems, selectedDiaryDate]
  );

  const selectedDayPlannedItems = useMemo(
    () =>
      selectedDayItems.filter(
        (i) => i.cell.status === "plan" || i.cell.status === "partial"
      ),
    [selectedDayItems]
  );

  const selectedDayDoneItems = useMemo(
    () => selectedDayItems.filter((i) => i.cell.status === "done"),
    [selectedDayItems]
  );

  const visibleDayCards = showCompletedInDay
    ? selectedDayItems
    : selectedDayPlannedItems;

  const selectedDayTotalGoalMinutes = useMemo(
    () =>
      selectedDayPlannedItems.reduce(
        (sum, item) => sum + (item.cell.minutes ?? item.topic.estimatedMinutes),
        0
      ),
    [selectedDayPlannedItems]
  );

  // 1주간 일정표 날짜 (월 ~ 일)
  const weekDates = useMemo(
    () => getMondayStartWeekDates(selectedDiaryDate),
    [selectedDiaryDate]
  );

  const weekSummary = useMemo(() => {
    const weekSet = new Set(weekDates);
    const items = allScheduleItems.filter((i) => weekSet.has(i.dateISO));
    const planned = items.filter(
      (i) => i.cell.status === "plan" || i.cell.status === "partial"
    );
    const done = items.filter((i) => i.cell.status === "done");
    const totalGoalMinutes = planned.reduce(
      (sum, i) => sum + (i.cell.minutes ?? i.topic.estimatedMinutes),
      0
    );
    return {
      plannedCount: planned.length,
      doneCount: done.length,
      totalGoalMinutes,
    };
  }, [allScheduleItems, weekDates]);

  // 날짜별 타임테이블 데이터 & 동적 시간축 (dayResetHour 반영)
  const dayTimetableGrid: Record<string, TimetableSlotLog> = useMemo(
    () => timetablesByDate[selectedDiaryDate] || {},
    [timetablesByDate, selectedDiaryDate]
  );

  const timetableHours = useMemo(
    () => getHoursFromReset(dayResetHour),
    [dayResetHour]
  );

  const totalDiaryMinutes = useMemo(
    () => Object.keys(dayTimetableGrid).length * 10,
    [dayTimetableGrid]
  );

  // 타임테이블 팔레트: 선택된 날짜의 학습계획 단원만 노출
  const plannedTopicPalette = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      topicId: string;
      subject: StudySubjectNode;
      topic: StudyTopicNode;
      color: string;
    }> = [];
    for (const item of selectedDayPlannedItems) {
      if (seen.has(item.topic.id)) continue;
      seen.add(item.topic.id);
      list.push({
        topicId: item.topic.id,
        subject: item.subject,
        topic: item.topic,
        color: item.cell.customColor || item.subject.color,
      });
    }
    return list;
  }, [selectedDayPlannedItems]);

  const activePaletteItem = useMemo(() => {
    if (plannedTopicPalette.length === 0) return null;
    return (
      plannedTopicPalette.find((p) => p.topicId === selectedPaletteTopicId) ||
      plannedTopicPalette[0]
    );
  }, [plannedTopicPalette, selectedPaletteTopicId]);

  const activeTimetableBrush = useMemo(() => {
    if (useCustomTimetableColor) {
      return {
        color: timetableBrushColor,
        label: activePaletteItem?.topic.title || "커스텀 집중",
        topicId: activePaletteItem?.topicId,
      };
    }
    if (activePaletteItem) {
      return {
        color: activePaletteItem.color,
        label: activePaletteItem.topic.title,
        topicId: activePaletteItem.topicId,
      };
    }
    return {
      color: timetableBrushColor,
      label: "직접 계획",
      topicId: undefined,
    };
  }, [useCustomTimetableColor, timetableBrushColor, activePaletteItem]);

  // 매트릭스 토픽 ID -> 메타 빠른 조회 맵 (드래그 벌크 커밋용)
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

  // 타임테이블 슬롯 드래그 적용
  const applyTimetableSlotAction = useCallback(
    (slotKey: string, action: "paint" | "erase") => {
      setTimetableSlots(selectedDiaryDate, (prev) => {
        const copy = { ...prev };
        if (action === "erase") {
          delete copy[slotKey];
        } else {
          copy[slotKey] = {
            color: activeTimetableBrush.color,
            label: activeTimetableBrush.label,
            topicId: activeTimetableBrush.topicId,
          };
        }
        return copy;
      });
    },
    [selectedDiaryDate, setTimetableSlots, activeTimetableBrush]
  );

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
      customColor: existing?.customColor,
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

  const handleMoveScheduleItemDate = (item: ScheduleTopicItem, newDateISO: string) => {
    if (!newDateISO || newDateISO === item.dateISO) return;
    deleteMatrixCell(item.topic.id, item.dateISO);
    upsertMatrixCell(item.topic.id, newDateISO, {
      ...item.cell,
    });
  };

  const handleAdjustItemMinutes = (item: ScheduleTopicItem, nextMinutes: number) => {
    const clamped = Math.max(10, Math.min(360, nextMinutes));
    upsertMatrixCell(item.topic.id, item.dateISO, {
      ...item.cell,
      minutes: clamped,
    });
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
  };

  const handleOpenEditSubject = (subj: StudySubjectNode) => {
    setOpenMenuSubjectId(null);
    setEditingSubjectForm({
      subjectId: subj.id,
      title: subj.title,
      examStage: subj.examStage,
      color: subj.color,
      firstUnitId: subj.units[0]?.id,
      newTopicTitle: "",
    });
  };

  const handleSaveSubjectForm = () => {
    if (!editingSubjectForm) return;
    updateSubjectCustomization(editingSubjectForm.subjectId, {
      title: editingSubjectForm.title.trim() || undefined,
      examStage: editingSubjectForm.examStage,
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

  const handleCreateCustomSubject = () => {
    if (!newSubjTitle.trim()) return;
    const topics = newSubjTopicsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    addCustomSubject({
      title: newSubjTitle.trim(),
      examStage: newSubjStage,
      color: newSubjColor,
      topicTitles: topics,
    });
    setNewSubjTitle("");
    setNewSubjTopicsText("");
    setIsAddingSubject(false);
  };

  const handleCreateCustomBook = () => {
    if (!newBookTitle.trim()) return;
    addCustomBook({
      title: newBookTitle.trim(),
      badge: newBookBadge.trim() || newBookTitle.trim().slice(0, 6),
      coverColor: newBookColor,
      firstSubjectTitle: newBookTitle.trim(),
    });
    setNewBookTitle("");
    setNewBookBadge("");
    setIsAddingBook(false);
  };

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

            {/* 적용 중인 다중 교재 + 커스텀 편집 모달 오픈 버튼 */}
            <div className="mt-1 flex items-center gap-2 max-w-full">
              <button
                type="button"
                onClick={() => setIsManagerModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300 hover:text-white transition min-w-0"
              >
                <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  {activeBooks.map((b) => b.badge).join(" + ")} ({activeBooks.length}권)
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[9.5px] text-[#FF7A59] font-black flex items-center gap-0.5 shrink-0">
                  <SlidersHorizontal className="w-2.5 h-2.5" />
                  <span>과목·교재 편집</span>
                </span>
              </button>
            </div>
          </div>

          {/* 목차 매트릭스 / 일정표 전환 */}
          <div className="flex items-center bg-[#0D0D11] p-0.5 rounded-xl border border-white/[0.08] text-[10px] font-black shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                viewMode === "matrix" ? "bg-[#FF5A36] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              목차 매트릭스
            </button>
            <button
              type="button"
              onClick={() => setViewMode("diary")}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                viewMode === "diary" ? "bg-[#FF5A36] text-white" : "text-slate-400 hover:text-white"
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

        {viewMode === "matrix" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* 1차/2차 필터 & 일괄 접기/펴기 */}
            <div className="flex items-center gap-1">
              {(["ALL", "1차", "2차"] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                    stageFilter === stage
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
          <div className="px-4 py-2 bg-[#131318] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
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

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
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

            {/* 색상 커스텀 브러시 팔레트 */}
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
                className="w-5 h-5 rounded-full border border-white/30 overflow-hidden cursor-pointer flex items-center justify-center bg-[#1A1A22]"
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
                  <th className="sticky left-0 z-40 w-[166px] sm:w-[238px] min-w-[166px] sm:min-w-[238px] bg-[#181820] border-b border-r border-white/[0.12] px-2.5 py-2 align-bottom">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-300">
                      <span>차수 · 과목 · 목차</span>
                      <span className="text-slate-500 font-mono">누적</span>
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
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* 플래너 일정표: 1일(오늘 기준) / 1주간 탭 + 동적 날짜·시간 + 드래그 타임테이블 */
        /* ========================================================== */
        <div className="px-4 py-4 space-y-4">
          {/* 일정표 상단 컨트롤: 1일/1주간 탭 + 날짜 변경 기준 시각 + 날짜 네비게이터 */}
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

              {/* 날짜 변경 기준 (Day Reset Hour) 설정 */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                <span className="text-slate-400">날짜변경 기준</span>
                <select
                  value={dayResetHour}
                  onChange={(e) => setDayResetHour(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[10.5px] font-mono font-black text-amber-300 focus:outline-none focus:border-[#FF5A36]"
                  title="하루가 시작되는 기준 시각 (예: 04시 기준 시 새벽 3시는 전날로 집계)"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 날짜 / 주간 이동 바 */}
            {diaryScope === "day" ? (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryDate(addDaysISO(selectedDiaryDate, -1))}
                    className="p-1.5 rounded-lg bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white"
                    title="이전 날짜"
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
                    title="다음 날짜"
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

                <div className="text-right text-[10px] font-mono">
                  <div className="text-white font-black">
                    {formatShortMMDDWithDay(selectedDiaryDate, todayISO)}
                  </div>
                  <div className="text-sky-300 font-bold">
                    목표 {selectedDayTotalGoalMinutes}분 · 배분 {totalDiaryMinutes}분
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
                    title="이전 주"
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
                    title="다음 주"
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
                    주간 계획 {weekSummary.plannedCount}건 · {weekSummary.totalGoalMinutes}분
                  </div>
                  <div className="text-emerald-300 font-bold">
                    완료 {weekSummary.doneCount}건
                  </div>
                </div>
              </div>
            )}
          </div>

          {diaryScope === "day" ? (
            <>
              {/* 선택된 날짜(1일 기준) 계획 요약 & 빠른 단원 계획 추가 */}
              <div className="p-3 rounded-2xl bg-[#16161C] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-white">
                    <ListTodo className="w-4 h-4 text-[#FF5A36]" />
                    <span>
                      {selectedDiaryDate === todayISO ? "오늘" : selectedDiaryDate} 학습계획 (
                      {selectedDayPlannedItems.length}건)
                    </span>
                  </div>
                  {selectedDayDoneItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCompletedInDay((prev) => !prev)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-black text-emerald-300"
                    >
                      {showCompletedInDay
                        ? `완료 ${selectedDayDoneItems.length}건 숨기기`
                        : `완료 ${selectedDayDoneItems.length}건 보기`}
                    </button>
                  )}
                </div>

                {/* 이 날짜에 단원 계획 바로 추가 */}
                {allActiveTopicEntries.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={quickAddTopicId}
                      onChange={(e) => setQuickAddTopicId(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[10.5px] font-bold text-white"
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
                      className="px-2.5 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10.5px] font-black shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>이날 계획 추가</span>
                    </button>
                  </div>
                )}
              </div>

              {visibleDayCards.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#1A1A21] border border-dashed border-white/[0.14] text-center space-y-3">
                  <CalendarPlus className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white">
                      {selectedDiaryDate}에 등록된 학습계획이 없습니다.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      목차 매트릭스에서 학습계획으로 선택하거나, 위에서 단원을 골라{" "}
                      <strong>이날 계획 추가</strong>를 눌러주세요.
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
                <div className="space-y-2">
                  {visibleDayCards.map((item) => {
                    const isPartial = item.cell.status === "partial";
                    const isDone = item.cell.status === "done";
                    const estMinutes = item.cell.minutes ?? item.topic.estimatedMinutes;
                    const itemColor = item.cell.customColor || item.subject.color;

                    return (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9.5px] font-black text-white"
                                style={{ backgroundColor: itemColor }}
                              >
                                {item.subject.examStage} · {item.subject.shortTitle}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                                  isDone
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : isPartial
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                      : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                }`}
                              >
                                {isDone ? "✓ 완료" : isPartial ? "◐ 진행중" : "학습계획"} ·{" "}
                                {item.cell.keyword}
                              </span>

                              {/* 셀 커스텀 색상 직접 변경 */}
                              <label
                                className="w-4 h-4 rounded-full border border-white/30 cursor-pointer relative overflow-hidden shrink-0"
                                style={{ backgroundColor: itemColor }}
                                title="색상 커스텀 변경"
                              >
                                <input
                                  type="color"
                                  value={itemColor}
                                  onChange={(e) =>
                                    upsertMatrixCell(item.topic.id, item.dateISO, {
                                      ...item.cell,
                                      customColor: e.target.value,
                                    })
                                  }
                                  className="opacity-0 absolute inset-0 cursor-pointer"
                                />
                              </label>
                            </div>

                            <div className="text-xs font-black text-white flex items-center gap-1 truncate">
                              {item.topic.topicNo && (
                                <span
                                  className="font-mono shrink-0"
                                  style={{ color: itemColor }}
                                >
                                  {item.topic.topicNo}.
                                </span>
                              )}
                              <span className="truncate">{item.topic.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.unitTitle}
                            </div>
                          </div>
                        </div>

                        {/* 날짜 이동 & 목표 시간 동적 조절 바 */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.06] text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">날짜:</span>
                            <input
                              type="date"
                              value={item.dateISO}
                              onChange={(e) => handleMoveScheduleItemDate(item, e.target.value)}
                              className="px-1.5 py-0.5 rounded bg-[#101015] border border-white/[0.1] font-mono text-white text-[10px]"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustItemMinutes(item, estMinutes - 10)}
                              className="px-1.5 py-0.5 rounded bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white font-mono"
                            >
                              -10m
                            </button>
                            <span className="px-2 py-0.5 rounded bg-[#101015] font-mono font-black text-amber-300">
                              {estMinutes}분
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustItemMinutes(item, estMinutes + 10)}
                              className="px-1.5 py-0.5 rounded bg-[#101015] border border-white/[0.08] text-slate-300 hover:text-white font-mono"
                            >
                              +10m
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
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
                                estMinutes,
                                item.cell.customColor
                              )
                            }
                            className="py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[10px] font-black transition"
                          >
                            내일이월
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              upsertMatrixCell(item.topic.id, item.dateISO, {
                                ...item.cell,
                                status: "done",
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
              )}

              {/* 선택된 날짜 전용 10분 단위 타임테이블 (드래그 연속 색칠 + 색상 커스텀 + 동적 시작시각) */}
              <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                    <span>
                      {selectedDiaryDate === todayISO ? "오늘" : selectedDiaryDate.slice(5)} 타임테이블 (드래그 연속 입력)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#FF7A59]">
                    {String(Math.floor(totalDiaryMinutes / 60)).padStart(2, "0")}H{" "}
                    {String(totalDiaryMinutes % 60).padStart(2, "0")}M
                  </span>
                </div>

                {/* 브러시 선택: 선택 날짜 계획 단원 + 커스텀 색상 */}
                <div className="space-y-2">
                  {plannedTopicPalette.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plannedTopicPalette.map((p) => {
                        const isSelected =
                          !useCustomTimetableColor && activePaletteItem?.topicId === p.topicId;
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
                                : "bg-[#111116] text-slate-300 border-white/[0.08] hover:border-white/25"
                            }`}
                            style={isSelected ? { backgroundColor: p.color } : undefined}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: isSelected ? "#FFFFFF" : p.color }}
                            />
                            <span className="truncate max-w-[150px]">
                              {p.topic.topicNo ? `${p.topic.topicNo}. ` : ""}
                              {p.topic.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 커스텀 브러시 색상 팔레트 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Palette className="w-3 h-3 text-amber-300" />
                      <span>브러시 색:</span>
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
                        title={`브러시 색 ${hex}`}
                      />
                    ))}
                    <label
                      className="px-2 py-0.5 rounded-md bg-[#111116] border border-white/[0.1] text-[9.5px] font-bold text-slate-300 cursor-pointer flex items-center gap-1 relative"
                      title="직접 색상 선택"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: timetableBrushColor }}
                      />
                      <span>커스텀</span>
                      <input
                        type="color"
                        value={timetableBrushColor}
                        onChange={(e) => {
                          setTimetableBrushColor(e.target.value);
                          setUseCustomTimetableColor(true);
                        }}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                    </label>
                    <span className="text-[9.5px] text-slate-500 ml-auto">
                      누른 채 드래그=연속 색칠/지움
                    </span>
                  </div>
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

                <div
                  className="space-y-1 select-none touch-none"
                  onTouchMove={(e) => {
                    if (!ttDragAction) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    const el = globalThis.document.elementFromPoint(
                      touch.clientX,
                      touch.clientY
                    );
                    const btn = el?.closest("[data-tt-slot]") as HTMLElement | null;
                    const slotKey = btn?.dataset.ttSlot;
                    if (slotKey) {
                      applyTimetableSlotAction(slotKey, ttDragAction);
                    }
                  }}
                >
                  {timetableHours.map((hour) => (
                    <div key={hour} className="grid grid-cols-[36px_1fr] gap-2 items-center">
                      <div className="font-mono text-[10.5px] font-bold text-slate-400 text-center">
                        {String(hour).padStart(2, "0")}
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {[0, 1, 2, 3, 4, 5].map((slot) => {
                          const key = `${hour}-${slot}`;
                          const cell = dayTimetableGrid[key];
                          return (
                            <button
                              key={slot}
                              type="button"
                              data-tt-slot={key}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                const isSamePaint =
                                  cell && cell.color === activeTimetableBrush.color;
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
                              title={cell ? cell.label : activeTimetableBrush.label}
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
          ) : (
            /* ========================================================== */
            /* 1주간 일정표 (월 ~ 일 7일 카드 뷰) */
            /* ========================================================== */
            <div className="space-y-2.5">
              {weekDates.map((dateISO) => {
                const dayItems = allScheduleItems.filter((i) => i.dateISO === dateISO);
                const plannedItems = dayItems.filter(
                  (i) => i.cell.status === "plan" || i.cell.status === "partial"
                );
                const doneCount = dayItems.filter((i) => i.cell.status === "done").length;
                const dayGoalMin = plannedItems.reduce(
                  (s, i) => s + (i.cell.minutes ?? i.topic.estimatedMinutes),
                  0
                );
                const isToday = dateISO === todayISO;

                return (
                  <div
                    key={dateISO}
                    className={`p-3.5 rounded-2xl border space-y-2.5 ${
                      isToday
                        ? "bg-[#1E191B] border-[#FF5A36]/50"
                        : "bg-[#1A1A21] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-black ${
                            isToday ? "text-[#FF7A59]" : "text-white"
                          }`}
                        >
                          {formatShortMMDDWithDay(dateISO, todayISO)}
                        </span>
                        <span className="text-[10px] font-mono text-sky-300 font-bold">
                          계획 {plannedItems.length}건 ({dayGoalMin}분)
                        </span>
                        {doneCount > 0 && (
                          <span className="text-[10px] font-mono text-emerald-300 font-bold">
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
                        className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-[#FF5A36] text-[10px] font-black text-slate-200 hover:text-white flex items-center gap-1 transition"
                      >
                        <span>1일표 열기</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {plannedItems.length === 0 ? (
                      <div className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl bg-[#111116] border border-white/[0.05]">
                        <span className="text-[10.5px] text-slate-500">
                          예정된 학습계획이 없습니다.
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
                      <div className="space-y-1.5">
                        {plannedItems.map((item) => {
                          const itemColor = item.cell.customColor || item.subject.color;
                          const estMin = item.cell.minutes ?? item.topic.estimatedMinutes;
                          return (
                            <div
                              key={item.key}
                              className="px-2.5 py-2 rounded-xl bg-[#111116] border border-white/[0.06] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: itemColor }}
                                />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-extrabold text-white truncate">
                                    {item.topic.topicNo ? `${item.topic.topicNo}. ` : ""}
                                    {item.topic.title}
                                  </div>
                                  <div className="text-[9.5px] text-slate-400">
                                    {item.subject.shortTitle} · {item.cell.keyword} ·{" "}
                                    {estMin}분
                                  </div>
                                </div>
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
                                  className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[9.5px] font-black"
                                >
                                  완료
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteMatrixCell(item.topic.id, item.dateISO)
                                  }
                                  className="p-1 rounded-lg text-slate-500 hover:text-rose-300"
                                  title="계획 해제"
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

            {/* 1. 다중 교재 선택 & 커스텀 교재 추가 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>적용 교재 다중 선택 ({activeBookIds.length}권 선택됨)</span>
                <button
                  type="button"
                  onClick={() => setIsAddingBook((prev) => !prev)}
                  className="text-[#FF7A59] font-black flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>새 교재 추가</span>
                </button>
              </div>

              {isAddingBook && (
                <div className="p-3 rounded-2xl bg-[#16161D] border border-[#FF5A36]/40 space-y-2">
                  <input
                    type="text"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    placeholder="교재명 (예: 2026 동형 모의고사 문제집)"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newBookBadge}
                      onChange={(e) => setNewBookBadge(e.target.value)}
                      placeholder="짧은 배지 (예: 동형모고)"
                      className="px-3 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#0E0E12] border border-white/[0.1]">
                      <span className="text-[10px] text-slate-400">색상</span>
                      <input
                        type="color"
                        value={newBookColor}
                        onChange={(e) => setNewBookColor(e.target.value)}
                        className="w-6 h-6 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingBook(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-[10.5px] font-bold text-slate-300"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCustomBook}
                      className="px-3 py-1.5 rounded-xl bg-[#FF5A36] text-[10.5px] font-black text-white"
                    >
                      교재 추가 &amp; 적용
                    </button>
                  </div>
                </div>
              )}

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
                          title="커스텀 교재 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 첨부 이미지 스타일: 활성 과목 다크 카드 리스트 */}
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
                          {subj.examStage} · {subj.bookBadge || "기본"} ·{" "}
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
                      aria-label={`${subj.title} 메뉴`}
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

              {/* + 과목추가 버튼 행 */}
              <button
                type="button"
                onClick={() => setIsAddingSubject((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition"
              >
                <span className="w-6 h-6 rounded-full bg-white/[0.12] text-white flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold text-white">과목추가</span>
              </button>
            </div>

            {/* 새 과목 추가 인라인 폼 */}
            {isAddingSubject && (
              <div className="p-3.5 rounded-2xl bg-[#181822] border border-[#FF5A36]/45 space-y-2.5">
                <div className="text-xs font-black text-white">새 커스텀 과목 추가</div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="text"
                    value={newSubjTitle}
                    onChange={(e) => setNewSubjTitle(e.target.value)}
                    placeholder="과목명 (예: 핵심 기출 오답노트)"
                    className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                  />
                  <select
                    value={newSubjStage}
                    onChange={(e) =>
                      setNewSubjStage(e.target.value as "1차" | "2차")
                    }
                    className="px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
                  >
                    <option value="1차">1차</option>
                    <option value="2차">2차</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={newSubjTopicsText}
                  onChange={(e) => setNewSubjTopicsText(e.target.value)}
                  placeholder="초기 단원 (쉼표 구분, 예: 1회차, 2회차, 최종암기)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">색상:</span>
                  {CUSTOM_SUBJECT_COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewSubjColor(hex)}
                      className={`w-4 h-4 rounded-full border ${
                        newSubjColor === hex
                          ? "border-white scale-110 ring-1 ring-white"
                          : "border-white/20"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newSubjColor}
                    onChange={(e) => setNewSubjColor(e.target.value)}
                    className="w-6 h-5 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingSubject(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomSubject}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                  >
                    과목 생성
                  </button>
                </div>
              </div>
            )}

            {/* 선택 과목 수정(이름/색상/단원 추가) 인라인 패널 */}
            {editingSubjectForm && (
              <div className="p-3.5 rounded-2xl bg-[#1B1B25] border border-sky-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">과목 정보 · 색상 수정</span>
                  <button
                    type="button"
                    onClick={() => setEditingSubjectForm(null)}
                    className="text-slate-400 hover:text-white"
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
                    className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
                  />
                  <select
                    value={editingSubjectForm.examStage}
                    onChange={(e) =>
                      setEditingSubjectForm({
                        ...editingSubjectForm,
                        examStage: e.target.value as "1차" | "2차",
                      })
                    }
                    className="px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
                  >
                    <option value="1차">1차</option>
                    <option value="2차">2차</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">색상:</span>
                  {CUSTOM_SUBJECT_COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        setEditingSubjectForm({ ...editingSubjectForm, color: hex })
                      }
                      className={`w-4 h-4 rounded-full border ${
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
                    className="w-6 h-5 bg-transparent cursor-pointer"
                  />
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
                    placeholder="이 과목에 새 단원 추가 (선택 입력)"
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                  />
                )}
                <button
                  type="button"
                  onClick={handleSaveSubjectForm}
                  className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black"
                >
                  변경 사항 저장
                </button>
              </div>
            )}

            {/* 3. 첨부 이미지 하단: 보관함 N */}
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
                    진행중 상태는 순공시간에만 합산되며, 단원을 최종 <strong>완료</strong> 처리할 때만 1회독(+1R)으로 집계됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 셀 커스텀 색상 선택 */}
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
                title="직접 색상 지정"
              />
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
  matrixLogs: Record<string, MatrixCellLog>;
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
}

function SubjectRowsGroup({
  subject,
  isCollapsed,
  subjectTopicCount,
  subjectTotalDone,
  dateColumns,
  matrixLogs,
  chapterTotals,
  dragMode,
  dragKeySet,
  getTopicDoneCount,
  getSubjectDaySummary,
  onToggleCollapse,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
}: SubjectRowsGroupProps) {
  return (
    <>
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

        {dateColumns.map((col) => {
          const summary = getSubjectDaySummary(subject, col.dateISO);
          const hasDone = summary.doneCount > 0;
          const hasPartial = summary.partialCount > 0;
          const hasPlan = summary.planCount > 0;

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
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0 ${
                        doneCount === 0
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

                {dateColumns.map((col) => {
                  const mKey = makeMatrixKey(topic.id, col.dateISO);
                  const cell = matrixLogs[mKey];
                  const isDragSelected = dragKeySet.has(mKey);
                  const resolvedColor = cell?.customColor || subject.color;

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
                                ? "text-white font-black shadow-sm hover:brightness-110"
                                : cell.status === "partial"
                                  ? "border border-amber-400 font-bold hover:brightness-110"
                                  : "border border-dashed font-bold hover:brightness-110"
                              : "hover:bg-white/[0.08] text-transparent hover:text-slate-500"
                        }`}
                        style={
                          !isDragSelected && cell
                            ? cell.status === "done"
                              ? { backgroundColor: resolvedColor }
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
