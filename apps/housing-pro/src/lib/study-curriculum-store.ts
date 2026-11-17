"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TEXTBOOK_CATALOG,
  type TextbookCatalogItem,
  type StudySubjectNode,
  type MatrixCellLog,
  type StudyTodoItem,
  type TimetableSlotLog,
  addDaysISO,
  computeLogicalTodayISO,
  findTopicMetaInSubjects,
} from "@/data/study-textbooks";
import {
  fetchStudyMatrixSyncAction,
  type ChapterProgressSummary,
} from "@/app/actions/exam-study.actions";
import { syncPlannerStateToDbAction } from "@/app/actions/auth-profile.actions";
import { useStudyAuth } from "@/components/auth/study-auth-provider";

const STORAGE_KEY = "housing_pro_curriculum_v5";
const LEGACY_STORAGE_KEY = "housing_pro_curriculum_v4";
const SYNC_EVENT = "housing-pro-curriculum-sync";

export interface CustomBookItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  coverColor: string;
}

export interface SubjectOverrideItem {
  title?: string;
  shortTitle?: string;
  color?: string;
  examStage?: "1차" | "2차";
}

export interface CurriculumPersistedState {
  activeBookId: string;
  /** 다중 선택된 교재 ID 목록 */
  activeBookIds?: string[];
  /** 사용자 추가 커스텀 교재 목록 */
  customBooks?: CustomBookItem[];
  /** 사용자 추가 커스텀 과목 목록 */
  customSubjects?: StudySubjectNode[];
  /** 과목별 이름/색상/차수 커스텀 오버라이드 */
  subjectOverrides?: Record<string, SubjectOverrideItem>;
  /** 보관함에 넣은 과목 ID 목록 */
  archivedSubjectIds?: string[];
  /** 날짜 변경 기준 시각 (0~6시, 기본 4시) */
  dayResetHour?: number;
  /** 날짜별 타임테이블 슬롯 기록 (YYYY-MM-DD -> slotKey -> TimetableSlotLog) */
  timetablesByDate?: Record<string, Record<string, TimetableSlotLog>>;
  examDate: string;
  /** bookId -> matrixLogs (`topicId::YYYY-MM-DD` -> MatrixCellLog) */
  logsByBook: Record<string, Record<string, MatrixCellLog>>;
  /** bookId -> customTopics (`unitId` -> topics[]) */
  customTopicsByBook: Record<
    string,
    Record<
      string,
      Array<{
        id: string;
        title: string;
        defaultKeyword: string;
        estimatedMinutes: number;
      }>
    >
  >;
  /** bookId -> todos */
  todosByBook: Record<string, StudyTodoItem[]>;
  /** 접힌 과목 ID 목록 */
  collapsedSubjectIds: string[];
}

export function makeMatrixKey(topicId: string, dateISO: string): string {
  return `${topicId}::${dateISO}`;
}

function buildSeedLogs(book: TextbookCatalogItem, todayISO: string): Record<string, MatrixCellLog> {
  const logs: Record<string, MatrixCellLog> = {};
  for (const seed of book.seedOffsets) {
    const dateISO = addDaysISO(todayISO, seed.dayOffset);
    logs[makeMatrixKey(seed.topicId, dateISO)] = {
      keyword: seed.keyword,
      status: seed.status,
      minutes: seed.minutes,
      updatedAt: dateISO,
    };
  }
  return logs;
}

function buildSeedTodos(book: TextbookCatalogItem, todayISO: string): StudyTodoItem[] {
  return book.seedTodos.map((t, index) => ({
    id: `seed-todo-${book.id}-${index}`,
    title: t.title,
    subjectTitle: t.subjectTitle,
    subjectColor: t.subjectColor,
    topicId: t.topicId,
    dueDate: addDaysISO(todayISO, t.dayOffset),
    completed: t.completed,
  }));
}

function createDefaultState(todayISO: string): CurriculumPersistedState {
  const defaultBook = TEXTBOOK_CATALOG[0];
  return {
    activeBookId: defaultBook.id,
    activeBookIds: [defaultBook.id],
    customBooks: [],
    customSubjects: [],
    subjectOverrides: {},
    archivedSubjectIds: [],
    dayResetHour: 4,
    timetablesByDate: {},
    examDate: defaultBook.defaultExamDate,
    logsByBook: {
      [defaultBook.id]: buildSeedLogs(defaultBook, todayISO),
    },
    customTopicsByBook: {},
    todosByBook: {
      [defaultBook.id]: buildSeedTodos(defaultBook, todayISO),
    },
    collapsedSubjectIds: [],
  };
}

function readStoredState(todayISO: string): CurriculumPersistedState {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return createDefaultState(todayISO);
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 구식 v2 목차에서 사용자가 설정한 시험일(examDate)만 있으면 승계
      const fallback = createDefaultState(todayISO);
      const legacyRaw = globalThis.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw) as { examDate?: string };
          if (legacyParsed.examDate) {
            fallback.examDate = legacyParsed.examDate;
          }
        } catch {
          // ignore
        }
      }
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<CurriculumPersistedState>;
    const fallback = createDefaultState(todayISO);
    const customBooks = Array.isArray(parsed.customBooks) ? parsed.customBooks : [];
    const allBookIds = new Set([
      ...TEXTBOOK_CATALOG.map((b) => b.id),
      ...customBooks.map((b) => b.id),
    ]);
    const validBookId = parsed.activeBookId && allBookIds.has(parsed.activeBookId)
      ? parsed.activeBookId
      : fallback.activeBookId;
    const rawActiveBookIds = Array.isArray(parsed.activeBookIds)
      ? parsed.activeBookIds.filter((id) => allBookIds.has(id))
      : [];
    const activeBookIds =
      rawActiveBookIds.length > 0 ? rawActiveBookIds : [validBookId];

    return {
      activeBookId: validBookId,
      activeBookIds,
      customBooks,
      customSubjects: Array.isArray(parsed.customSubjects) ? parsed.customSubjects : [],
      subjectOverrides: parsed.subjectOverrides || {},
      archivedSubjectIds: Array.isArray(parsed.archivedSubjectIds)
        ? parsed.archivedSubjectIds
        : [],
      dayResetHour:
        typeof parsed.dayResetHour === "number" &&
        parsed.dayResetHour >= 0 &&
        parsed.dayResetHour <= 6
          ? parsed.dayResetHour
          : 4,
      timetablesByDate: parsed.timetablesByDate || {},
      examDate: parsed.examDate || fallback.examDate,
      logsByBook: parsed.logsByBook || fallback.logsByBook,
      customTopicsByBook: parsed.customTopicsByBook || {},
      todosByBook: parsed.todosByBook || fallback.todosByBook,
      collapsedSubjectIds: Array.isArray(parsed.collapsedSubjectIds)
        ? parsed.collapsedSubjectIds
        : [],
    };
  } catch {
    return createDefaultState(todayISO);
  }
}

function persistState(next: CurriculumPersistedState): void {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    globalThis.dispatchEvent(new globalThis.Event(SYNC_EVENT));
  } catch {
    // 스토리지 용량 초과 등 예외 무시
  }
}

/**
 * 교재 선택 -> 목차 자동 주입 -> 플래너 매트릭스 · 타이머 · 통계 · 할일 · 달력을 하나로 동기화하는 훅
 */
export function useStudyCurriculum() {
  const { isLoggedIn, effectiveOwnerKey, profile } = useStudyAuth();
  const initialTodayISO = useMemo(() => computeLogicalTodayISO(4), []);
  const [state, setState] = useState<CurriculumPersistedState>(() =>
    createDefaultState(initialTodayISO)
  );
  const [minuteTick, setMinuteTick] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dbMatrixCells, setDbMatrixCells] = useState<Record<string, MatrixCellLog>>({});
  const [chapterTotals, setChapterTotals] = useState<Record<string, ChapterProgressSummary>>({});

  const dayResetHour = state.dayResetHour ?? 4;
  const todayISO = useMemo(
    () => computeLogicalTodayISO(dayResetHour, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayResetHour, minuteTick]
  );

  // 1분 주기로 시각을 체크하여 날짜 변경 기준 시각 경과 시 todayISO 동적 갱신
  useEffect(() => {
    const id = globalThis.setInterval(() => {
      setMinuteTick((prev) => prev + 1);
    }, 60_000);
    return () => globalThis.clearInterval(id);
  }, []);

  const refreshDbSync = useCallback(async () => {
    const syncKey = effectiveOwnerKey;
    if (!syncKey) return;
    const res = await fetchStudyMatrixSyncAction(syncKey);
    if (res.success) {
      setDbMatrixCells(res.matrixCells);
      setChapterTotals(res.chapterTotals);
    }
  }, [effectiveOwnerKey]);

  // 로그인 시 서버 study_user_profiles 의 planner_state / examDate 병합
  useEffect(() => {
    if (!isLoggedIn || !profile.userId) return;
    const remote = profile.plannerState as Partial<CurriculumPersistedState> | undefined;
    if (!remote && !profile.examDate) return;

    setState((prev) => {
      const mergedLogs: Record<string, Record<string, MatrixCellLog>> = {
        ...prev.logsByBook,
      };
      if (remote?.logsByBook) {
        for (const [bId, cells] of Object.entries(remote.logsByBook)) {
          mergedLogs[bId] = { ...(cells || {}), ...(mergedLogs[bId] || {}) };
        }
      }
      const next: CurriculumPersistedState = {
        ...prev,
        activeBookIds:
          prev.activeBookIds && prev.activeBookIds.length > 0
            ? prev.activeBookIds
            : remote?.activeBookIds,
        customBooks:
          (prev.customBooks?.length ?? 0) > 0 ? prev.customBooks : remote?.customBooks,
        customSubjects:
          (prev.customSubjects?.length ?? 0) > 0
            ? prev.customSubjects
            : remote?.customSubjects,
        subjectOverrides: {
          ...(remote?.subjectOverrides || {}),
          ...(prev.subjectOverrides || {}),
        },
        archivedSubjectIds: Array.from(
          new Set([
            ...(remote?.archivedSubjectIds || []),
            ...(prev.archivedSubjectIds || []),
          ])
        ),
        dayResetHour: prev.dayResetHour ?? remote?.dayResetHour ?? 4,
        timetablesByDate: {
          ...(remote?.timetablesByDate || {}),
          ...(prev.timetablesByDate || {}),
        },
        examDate: profile.examDate || remote?.examDate || prev.examDate,
        logsByBook: mergedLogs,
        todosByBook: remote?.todosByBook
          ? { ...remote.todosByBook, ...prev.todosByBook }
          : prev.todosByBook,
        customTopicsByBook: remote?.customTopicsByBook
          ? { ...remote.customTopicsByBook, ...prev.customTopicsByBook }
          : prev.customTopicsByBook,
      };
      persistState(next);
      return next;
    });
  }, [isLoggedIn, profile.userId, profile.examDate, profile.plannerState]);

  useEffect(() => {
    setState(readStoredState(initialTodayISO));
    setIsHydrated(true);
    refreshDbSync();

    const handleSync = () => {
      setState(readStoredState(initialTodayISO));
      refreshDbSync();
    };
    const handleFocus = () => {
      setMinuteTick((prev) => prev + 1);
      refreshDbSync();
    };

    if (typeof globalThis !== "undefined" && "addEventListener" in globalThis) {
      globalThis.addEventListener(SYNC_EVENT, handleSync);
      globalThis.addEventListener("focus", handleFocus);
      return () => {
        globalThis.removeEventListener(SYNC_EVENT, handleSync);
        globalThis.removeEventListener("focus", handleFocus);
      };
    }
    return undefined;
  }, [initialTodayISO, refreshDbSync]);

  const updateState = useCallback(
    (
      updater: (prev: CurriculumPersistedState) => CurriculumPersistedState,
      addedFocusSeconds = 0
    ) => {
      setState((prev) => {
        const next = updater(prev);
        persistState(next);
        if (isLoggedIn) {
          void syncPlannerStateToDbAction({
            examDate: next.examDate,
            activeTrack: "app_only_69",
            addedFocusSeconds,
            plannerState: next as unknown as Record<string, unknown>,
          });
        }
        return next;
      });
    },
    [isLoggedIn]
  );

  const allCatalogBooks: TextbookCatalogItem[] = useMemo(() => {
    const customAsCatalog: TextbookCatalogItem[] = (state.customBooks || []).map((cb) => ({
      id: cb.id,
      title: cb.title,
      subtitle: cb.subtitle || "사용자 커스텀 교재 · 자유 목차 구성",
      author: "내 커스텀",
      edition: "커스텀 교재",
      badge: cb.badge || cb.title.slice(0, 6),
      coverColor: cb.coverColor || "#FF5A36",
      requiresSerial: false,
      defaultExamDate: state.examDate || "2026-12-12",
      subjects: (state.customSubjects || []).filter((s) => s.bookId === cb.id),
      seedOffsets: [],
      seedTodos: [],
    }));
    return [...TEXTBOOK_CATALOG, ...customAsCatalog];
  }, [state.customBooks, state.customSubjects, state.examDate]);

  const activeBookIds = useMemo(() => {
    const validSet = new Set(allCatalogBooks.map((b) => b.id));
    const filtered = (state.activeBookIds || []).filter((id) => validSet.has(id));
    if (filtered.length > 0) return filtered;
    return [validSet.has(state.activeBookId) ? state.activeBookId : TEXTBOOK_CATALOG[0].id];
  }, [allCatalogBooks, state.activeBookIds, state.activeBookId]);

  const activeBooks = useMemo(
    () => allCatalogBooks.filter((b) => activeBookIds.includes(b.id)),
    [allCatalogBooks, activeBookIds]
  );

  const activeBook = useMemo(
    () =>
      allCatalogBooks.find((b) => b.id === state.activeBookId) ||
      activeBooks[0] ||
      TEXTBOOK_CATALOG[0],
    [allCatalogBooks, state.activeBookId, activeBooks]
  );

  /** 선택된 모든 교재 + 사용자 커스텀 과목 + 이름/색상 오버라이드 + 커스텀 목차 병합 */
  const allMergedSubjects: StudySubjectNode[] = useMemo(() => {
    const seenIds = new Set<string>();
    const rawSubjects: StudySubjectNode[] = [];

    for (const book of activeBooks) {
      for (const subj of book.subjects) {
        if (seenIds.has(subj.id)) continue;
        seenIds.add(subj.id);
        rawSubjects.push({
          ...subj,
          bookId: subj.bookId ?? book.id,
          bookTitle: subj.bookTitle ?? book.title,
          bookBadge: subj.bookBadge ?? book.badge,
        });
      }
    }

    for (const customSubj of state.customSubjects || []) {
      if (seenIds.has(customSubj.id)) continue;
      if (customSubj.bookId && !activeBookIds.includes(customSubj.bookId)) continue;
      seenIds.add(customSubj.id);
      const linkedBook = customSubj.bookId
        ? allCatalogBooks.find((b) => b.id === customSubj.bookId)
        : undefined;
      rawSubjects.push({
        ...customSubj,
        bookTitle: customSubj.bookTitle ?? linkedBook?.title ?? "커스텀 과목",
        bookBadge: customSubj.bookBadge ?? linkedBook?.badge ?? "커스텀",
        isCustom: true,
      });
    }

    // 활성화된 교재들의 커스텀 토픽 맵 통합
    const mergedUnitTopics: Record<
      string,
      Array<{
        id: string;
        title: string;
        defaultKeyword: string;
        estimatedMinutes: number;
      }>
    > = {};
    for (const bookId of Object.keys(state.customTopicsByBook)) {
      const unitMap = state.customTopicsByBook[bookId] || {};
      for (const [unitId, list] of Object.entries(unitMap)) {
        if (!mergedUnitTopics[unitId]) mergedUnitTopics[unitId] = [];
        for (const item of list) {
          if (!mergedUnitTopics[unitId].some((t) => t.id === item.id)) {
            mergedUnitTopics[unitId].push(item);
          }
        }
      }
    }

    const overrides = state.subjectOverrides || {};
    const archivedSet = new Set(state.archivedSubjectIds || []);

    return rawSubjects.map((subject) => {
      const ov = overrides[subject.id];
      return {
        ...subject,
        title: ov?.title ?? subject.title,
        shortTitle: ov?.shortTitle ?? (ov?.title ? ov.title.slice(0, 6) : subject.shortTitle),
        color: ov?.color ?? subject.color,
        examStage: ov?.examStage ?? subject.examStage,
        isArchived: archivedSet.has(subject.id),
        units: subject.units.map((unit) => {
          const extra = mergedUnitTopics[unit.id] || [];
          return extra.length > 0
            ? { ...unit, topics: [...unit.topics, ...extra] }
            : unit;
        }),
      };
    });
  }, [
    activeBooks,
    activeBookIds,
    allCatalogBooks,
    state.customSubjects,
    state.customTopicsByBook,
    state.subjectOverrides,
    state.archivedSubjectIds,
  ]);

  /** 보관함 제외 활성 과목 목록 */
  const subjects: StudySubjectNode[] = useMemo(
    () => allMergedSubjects.filter((s) => !s.isArchived),
    [allMergedSubjects]
  );

  /** 보관함에 들어간 과목 목록 */
  const archivedSubjects: StudySubjectNode[] = useMemo(
    () => allMergedSubjects.filter((s) => Boolean(s.isArchived)),
    [allMergedSubjects]
  );

  const matrixLogs: Record<string, MatrixCellLog> = useMemo(() => {
    const merged: Record<string, MatrixCellLog> = { ...dbMatrixCells };
    for (const book of activeBooks) {
      if (book.id === activeBook.id) continue;
      const logs = state.logsByBook[book.id] ?? buildSeedLogs(book, todayISO);
      Object.assign(merged, logs);
    }
    const primaryLogs =
      state.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO);
    Object.assign(merged, primaryLogs);
    return merged;
  }, [activeBooks, activeBook, state.logsByBook, todayISO, dbMatrixCells]);

  const todos: StudyTodoItem[] = useMemo(() => {
    return (
      state.todosByBook[activeBook.id] ?? buildSeedTodos(activeBook, todayISO)
    );
  }, [activeBook, state.todosByBook, todayISO]);

  const timetablesByDate: Record<string, Record<string, TimetableSlotLog>> = useMemo(
    () => state.timetablesByDate || {},
    [state.timetablesByDate]
  );

  /** 단일 교재 선택 (기본 호환용 — activeBookIds에 포함 및 기본 교재 전환) */
  const selectTextbook = useCallback(
    (bookId: string) => {
      const targetBook = allCatalogBooks.find((b) => b.id === bookId);
      if (!targetBook) return;

      updateState((prev) => {
        const prevIds = prev.activeBookIds || [prev.activeBookId];
        const nextIds = prevIds.includes(targetBook.id)
          ? prevIds
          : [...prevIds, targetBook.id];
        return {
          ...prev,
          activeBookId: targetBook.id,
          activeBookIds: nextIds,
          examDate: prev.examDate || targetBook.defaultExamDate,
          logsByBook: {
            ...prev.logsByBook,
            [targetBook.id]:
              prev.logsByBook[targetBook.id] ?? buildSeedLogs(targetBook, todayISO),
          },
          todosByBook: {
            ...prev.todosByBook,
            [targetBook.id]:
              prev.todosByBook[targetBook.id] ?? buildSeedTodos(targetBook, todayISO),
          },
          collapsedSubjectIds: [],
        };
      });
    },
    [allCatalogBooks, todayISO, updateState]
  );

  /** 다중 교재 활성/비활성 토글 (최소 1권 유지) */
  const toggleBookActive = useCallback(
    (bookId: string) => {
      const targetBook = allCatalogBooks.find((b) => b.id === bookId);
      if (!targetBook) return;

      updateState((prev) => {
        const prevIds =
          prev.activeBookIds && prev.activeBookIds.length > 0
            ? prev.activeBookIds
            : [prev.activeBookId];
        const exists = prevIds.includes(bookId);
        if (exists && prevIds.length <= 1) {
          return prev;
        }
        const nextIds = exists
          ? prevIds.filter((id) => id !== bookId)
          : [...prevIds, bookId];
        const nextPrimaryId =
          prev.activeBookId === bookId && exists ? nextIds[0] : prev.activeBookId || nextIds[0];

        return {
          ...prev,
          activeBookId: nextPrimaryId,
          activeBookIds: nextIds,
          logsByBook: {
            ...prev.logsByBook,
            [bookId]: prev.logsByBook[bookId] ?? buildSeedLogs(targetBook, todayISO),
          },
          todosByBook: {
            ...prev.todosByBook,
            [bookId]: prev.todosByBook[bookId] ?? buildSeedTodos(targetBook, todayISO),
          },
        };
      });
    },
    [allCatalogBooks, todayISO, updateState]
  );

  /** 사용자 커스텀 교재 추가 (초기 과목 1개 자동 연결) */
  const addCustomBook = useCallback(
    (params: {
      title: string;
      subtitle?: string;
      badge?: string;
      coverColor: string;
      firstSubjectTitle?: string;
      examStage?: "1차" | "2차";
    }) => {
      const trimmedTitle = params.title.trim();
      if (!trimmedTitle) return;
      const now = Date.now();
      const bookId = `custom-book-${now}`;
      const subjId = `custom-subj-${now}`;
      const unitId = `custom-unit-${now}`;
      const topicId = `custom-top-${now}`;
      const subjTitle = (params.firstSubjectTitle || trimmedTitle).trim();

      const newBook: CustomBookItem = {
        id: bookId,
        title: trimmedTitle,
        subtitle: params.subtitle?.trim() || "사용자 커스텀 교재 · 자유 목차",
        badge: params.badge?.trim() || trimmedTitle.slice(0, 6),
        coverColor: params.coverColor || "#FF5A36",
      };

      const initialSubject: StudySubjectNode = {
        id: subjId,
        examStage: params.examStage || "2차",
        title: subjTitle,
        shortTitle: subjTitle.slice(0, 6),
        color: params.coverColor || "#FF5A36",
        bookId,
        bookTitle: trimmedTitle,
        bookBadge: newBook.badge,
        isCustom: true,
        units: [
          {
            id: unitId,
            unitNo: "Ⅰ",
            title: "기본 편제",
            topics: [
              {
                id: topicId,
                topicNo: "01",
                title: `${subjTitle} 1단원`,
                defaultKeyword: subjTitle.slice(0, 5),
                estimatedMinutes: 40,
              },
            ],
          },
        ],
      };

      updateState((prev) => {
        const prevIds =
          prev.activeBookIds && prev.activeBookIds.length > 0
            ? prev.activeBookIds
            : [prev.activeBookId];
        return {
          ...prev,
          activeBookIds: [...prevIds, bookId],
          customBooks: [...(prev.customBooks || []), newBook],
          customSubjects: [...(prev.customSubjects || []), initialSubject],
          logsByBook: {
            ...prev.logsByBook,
            [bookId]: {},
          },
          todosByBook: {
            ...prev.todosByBook,
            [bookId]: [],
          },
        };
      });
    },
    [updateState]
  );

  /** 커스텀 교재 삭제 */
  const deleteCustomBook = useCallback(
    (bookId: string) => {
      updateState((prev) => {
        const nextCustomBooks = (prev.customBooks || []).filter((b) => b.id !== bookId);
        const nextCustomSubjects = (prev.customSubjects || []).filter(
          (s) => s.bookId !== bookId
        );
        const prevIds = prev.activeBookIds || [prev.activeBookId];
        const remainingIds = prevIds.filter((id) => id !== bookId);
        const fallbackId = remainingIds[0] || TEXTBOOK_CATALOG[0].id;
        return {
          ...prev,
          activeBookId: prev.activeBookId === bookId ? fallbackId : prev.activeBookId,
          activeBookIds: remainingIds.length > 0 ? remainingIds : [fallbackId],
          customBooks: nextCustomBooks,
          customSubjects: nextCustomSubjects,
        };
      });
    },
    [updateState]
  );

  /** 새 커스텀 과목 추가 */
  const addCustomSubject = useCallback(
    (params: {
      title: string;
      examStage?: "1차" | "2차";
      color: string;
      bookId?: string;
      unitTitle?: string;
      topicTitles?: string[];
    }) => {
      const trimmed = params.title.trim();
      if (!trimmed) return;
      const now = Date.now();
      const subjId = `custom-subj-${now}`;
      const unitId = `custom-unit-${now}`;
      const rawTopics = (params.topicTitles || []).map((t) => t.trim()).filter(Boolean);
      const topicNames = rawTopics.length > 0 ? rawTopics : [`${trimmed} 핵심학습`];

      const linkedBook = params.bookId
        ? allCatalogBooks.find((b) => b.id === params.bookId)
        : undefined;

      const newSubject: StudySubjectNode = {
        id: subjId,
        examStage: params.examStage || "2차",
        title: trimmed,
        shortTitle: trimmed.slice(0, 6),
        color: params.color || "#FF5A36",
        bookId: params.bookId,
        bookTitle: linkedBook?.title,
        bookBadge: linkedBook?.badge,
        isCustom: true,
        units: [
          {
            id: unitId,
            unitNo: "Ⅰ",
            title: params.unitTitle?.trim() || "커스텀 목차",
            topics: topicNames.map((tTitle, idx) => ({
              id: `custom-topic-${now}-${idx}`,
              topicNo: String(idx + 1).padStart(2, "0"),
              title: tTitle,
              defaultKeyword: tTitle.slice(0, 6),
              estimatedMinutes: 35,
            })),
          },
        ],
      };

      updateState((prev) => ({
        ...prev,
        customSubjects: [...(prev.customSubjects || []), newSubject],
      }));
    },
    [allCatalogBooks, updateState]
  );

  /** 과목 이름/차수/색상 수정 */
  const updateSubjectCustomization = useCallback(
    (subjectId: string, patch: SubjectOverrideItem) => {
      updateState((prev) => {
        const nextCustomSubjects = (prev.customSubjects || []).map((subj) => {
          if (subj.id !== subjectId) return subj;
          const nextTitle = patch.title?.trim() || subj.title;
          return {
            ...subj,
            title: nextTitle,
            shortTitle: patch.shortTitle?.trim() || nextTitle.slice(0, 6),
            color: patch.color || subj.color,
            examStage: patch.examStage || subj.examStage,
          };
        });
        const prevOv = prev.subjectOverrides?.[subjectId] || {};
        const nextTitle = patch.title?.trim() || prevOv.title;
        return {
          ...prev,
          customSubjects: nextCustomSubjects,
          subjectOverrides: {
            ...(prev.subjectOverrides || {}),
            [subjectId]: {
              ...prevOv,
              ...patch,
              ...(nextTitle ? { title: nextTitle } : {}),
            },
          },
        };
      });
    },
    [updateState]
  );

  /** 과목 보관함에 넣기 */
  const archiveSubject = useCallback(
    (subjectId: string) => {
      updateState((prev) => {
        const current = prev.archivedSubjectIds || [];
        if (current.includes(subjectId)) return prev;
        return {
          ...prev,
          archivedSubjectIds: [...current, subjectId],
        };
      });
    },
    [updateState]
  );

  /** 과목 보관함에서 복원하기 */
  const restoreSubject = useCallback(
    (subjectId: string) => {
      updateState((prev) => ({
        ...prev,
        archivedSubjectIds: (prev.archivedSubjectIds || []).filter((id) => id !== subjectId),
      }));
    },
    [updateState]
  );

  /** 과목 삭제 (커스텀 과목은 완전 삭제, 내장 과목은 보관함 이동) */
  const deleteSubject = useCallback(
    (subjectId: string) => {
      updateState((prev) => {
        const isCustom = (prev.customSubjects || []).some((s) => s.id === subjectId);
        if (isCustom) {
          const nextOverrides = { ...(prev.subjectOverrides || {}) };
          delete nextOverrides[subjectId];
          return {
            ...prev,
            customSubjects: (prev.customSubjects || []).filter((s) => s.id !== subjectId),
            archivedSubjectIds: (prev.archivedSubjectIds || []).filter(
              (id) => id !== subjectId
            ),
            subjectOverrides: nextOverrides,
          };
        }
        const currentArchived = prev.archivedSubjectIds || [];
        return {
          ...prev,
          archivedSubjectIds: currentArchived.includes(subjectId)
            ? currentArchived
            : [...currentArchived, subjectId],
        };
      });
    },
    [updateState]
  );

  /** 날짜 변경 기준 시각 설정 (0~6시) */
  const setDayResetHour = useCallback(
    (hour: number) => {
      const clamped = Math.max(0, Math.min(6, Math.floor(hour)));
      updateState((prev) => ({
        ...prev,
        dayResetHour: clamped,
      }));
    },
    [updateState]
  );

  /** 날짜별 타임테이블 슬롯 일괄 업데이트 */
  const setTimetableSlots = useCallback(
    (
      dateISO: string,
      updater: (prev: Record<string, TimetableSlotLog>) => Record<string, TimetableSlotLog>
    ) => {
      updateState((prev) => {
        const prevMap = prev.timetablesByDate || {};
        const currentDay = prevMap[dateISO] || {};
        const nextDay = updater(currentDay);
        return {
          ...prev,
          timetablesByDate: {
            ...prevMap,
            [dateISO]: nextDay,
          },
        };
      });
    },
    [updateState]
  );

  /** 시험일(D-Day) 변경 */
  const setExamDate = useCallback(
    (examDate: string) => {
      updateState((prev) => ({ ...prev, examDate }));
    },
    [updateState]
  );

  /** 매트릭스 셀 등록/수정 */
  const upsertMatrixCell = useCallback(
    (topicId: string, dateISO: string, cell: MatrixCellLog) => {
      updateState((prev) => {
        const bookLogs =
          prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO);
        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: {
              ...bookLogs,
              [makeMatrixKey(topicId, dateISO)]: {
                ...cell,
                updatedAt: todayISO,
              },
            },
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 매트릭스 셀 다건 벌크 등록/수정 (드래그 연속 입력용) */
  const upsertMatrixCellsBulk = useCallback(
    (entries: Array<{ topicId: string; dateISO: string; cell: MatrixCellLog }>) => {
      if (entries.length === 0) return;
      updateState((prev) => {
        const bookLogs = {
          ...(prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO)),
        };
        for (const entry of entries) {
          bookLogs[makeMatrixKey(entry.topicId, entry.dateISO)] = {
            ...entry.cell,
            updatedAt: todayISO,
          };
        }
        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: bookLogs,
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 매트릭스 셀 삭제 (활성 교재 버킷 전체에서 제거) */
  const deleteMatrixCell = useCallback(
    (topicId: string, dateISO: string) => {
      const targetKey = makeMatrixKey(topicId, dateISO);
      updateState((prev) => {
        const nextLogsByBook = { ...prev.logsByBook };
        for (const bId of new Set([activeBook.id, ...(prev.activeBookIds || [])])) {
          const copy = { ...(nextLogsByBook[bId] || {}) };
          delete copy[targetKey];
          nextLogsByBook[bId] = copy;
        }
        return {
          ...prev,
          logsByBook: nextLogsByBook,
        };
      });
    },
    [activeBook.id, updateState]
  );

  /** 매트릭스 셀 다건 벌크 삭제 (드래그 연속 지우기용) */
  const deleteMatrixCellsBulk = useCallback(
    (keys: Array<{ topicId: string; dateISO: string }>) => {
      if (keys.length === 0) return;
      updateState((prev) => {
        const nextLogsByBook = { ...prev.logsByBook };
        for (const bId of new Set([activeBook.id, ...(prev.activeBookIds || [])])) {
          const copy = { ...(nextLogsByBook[bId] || {}) };
          for (const k of keys) {
            delete copy[makeMatrixKey(k.topicId, k.dateISO)];
          }
          nextLogsByBook[bId] = copy;
        }
        return {
          ...prev,
          logsByBook: nextLogsByBook,
        };
      });
    },
    [activeBook.id, updateState]
  );

  /** 다일(1~3일) 연속 분할 학습계획 일괄 배치 */
  const scheduleMultiDayPlan = useCallback(
    (
      topicId: string,
      startDateISO: string,
      spanDays: 1 | 2 | 3,
      baseKeyword: string,
      minutesPerDay: number,
      customColor?: string
    ) => {
      const cleanKeyword = baseKeyword.trim() || "학습계획";
      updateState((prev) => {
        const bookLogs = {
          ...(prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO)),
        };

        for (let i = 0; i < spanDays; i += 1) {
          const targetDate = addDaysISO(startDateISO, i);
          const key = makeMatrixKey(topicId, targetDate);
          const prefix = spanDays > 1 ? `${i + 1}/${spanDays} ` : "";
          bookLogs[key] = {
            keyword: `${prefix}${cleanKeyword}`.slice(0, 14),
            status: "plan",
            minutes: minutesPerDay,
            updatedAt: todayISO,
            ...(customColor ? { customColor } : {}),
          };
        }

        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: bookLogs,
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 당일 부분학습(진행중) 기록 후 다음날 이어하기 학습계획 자동 이월 */
  const carryOverTopicToNextDay = useCallback(
    (
      topicId: string,
      dateISO: string,
      keyword: string,
      todayMinutes: number,
      customColor?: string
    ) => {
      const nextDateISO = addDaysISO(dateISO, 1);
      const cleanKeyword = keyword.trim() || "진행중";

      updateState((prev) => {
        const bookLogs = {
          ...(prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO)),
        };
        const currentKey = makeMatrixKey(topicId, dateISO);
        const nextKey = makeMatrixKey(topicId, nextDateISO);
        const resolvedColor = customColor || bookLogs[currentKey]?.customColor;

        bookLogs[currentKey] = {
          keyword: cleanKeyword.slice(0, 14),
          status: "partial",
          minutes: todayMinutes,
          updatedAt: todayISO,
          ...(resolvedColor ? { customColor: resolvedColor } : {}),
        };

        const existingNext = bookLogs[nextKey];
        if (!existingNext || existingNext.status !== "done") {
          bookLogs[nextKey] = {
            keyword: existingNext?.keyword || "이어서학습",
            status: "plan",
            minutes: existingNext?.minutes ?? todayMinutes,
            updatedAt: todayISO,
            ...(resolvedColor ? { customColor: resolvedColor } : {}),
          };
        }

        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: bookLogs,
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 타이머 완료 시 오늘 날짜 매트릭스 셀에 자동 색칠(완료 또는 진행중+내일이월) 및 시간 누적 */
  const recordStudySession = useCallback(
    (
      topicId: string,
      elapsedSeconds: number,
      customKeyword?: string,
      completionMode: "done" | "partial" = "done"
    ) => {
      const addedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const meta = findTopicMetaInSubjects(subjects, topicId);

      updateState((prev) => {
        const bookLogs = {
          ...(prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO)),
        };
        const key = makeMatrixKey(topicId, todayISO);
        const existing = bookLogs[key];

        bookLogs[key] = {
          keyword:
            customKeyword?.trim() ||
            existing?.keyword ||
            meta?.topic.defaultKeyword ||
            (completionMode === "partial" ? "진행중" : "집중학습"),
          status: completionMode,
          minutes: (existing?.minutes || 0) + addedMinutes,
          updatedAt: todayISO,
          ...(existing?.customColor ? { customColor: existing.customColor } : {}),
        };

        if (completionMode === "partial") {
          const tomorrowISO = addDaysISO(todayISO, 1);
          const tomorrowKey = makeMatrixKey(topicId, tomorrowISO);
          const existingTomorrow = bookLogs[tomorrowKey];
          if (!existingTomorrow || existingTomorrow.status !== "done") {
            bookLogs[tomorrowKey] = {
              keyword: existingTomorrow?.keyword || "이어서학습",
              status: "plan",
              minutes: existingTomorrow?.minutes ?? meta?.topic.estimatedMinutes ?? 30,
              updatedAt: todayISO,
              ...(existing?.customColor ? { customColor: existing.customColor } : {}),
            };
          }
        }

        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: bookLogs,
          },
        };
      }, Math.max(0, Math.round(elapsedSeconds)));
    },
    [activeBook, subjects, todayISO, updateState]
  );

  /** 과목 접기/펴기 토글 */
  const toggleSubjectCollapse = useCallback(
    (subjectId: string) => {
      updateState((prev) => {
        const exists = prev.collapsedSubjectIds.includes(subjectId);
        return {
          ...prev,
          collapsedSubjectIds: exists
            ? prev.collapsedSubjectIds.filter((id) => id !== subjectId)
            : [...prev.collapsedSubjectIds, subjectId],
        };
      });
    },
    [updateState]
  );

  /** 전체 과목 일괄 접기 또는 일괄 펼치기 */
  const setAllSubjectsCollapsed = useCallback(
    (collapse: boolean) => {
      updateState((prev) => ({
        ...prev,
        collapsedSubjectIds: collapse ? subjects.map((s) => s.id) : [],
      }));
    },
    [subjects, updateState]
  );

  /** 커스텀 목차 추가 */
  const addCustomTopic = useCallback(
    (unitId: string, title: string, defaultKeyword: string, estimatedMinutes = 30) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      updateState((prev) => {
        const bookCustom = prev.customTopicsByBook[activeBook.id] || {};
        const unitExtra = bookCustom[unitId] || [];
        return {
          ...prev,
          customTopicsByBook: {
            ...prev.customTopicsByBook,
            [activeBook.id]: {
              ...bookCustom,
              [unitId]: [
                ...unitExtra,
                {
                  id: `custom-topic-${Date.now()}`,
                  title: trimmed,
                  defaultKeyword: defaultKeyword.trim() || trimmed.slice(0, 6),
                  estimatedMinutes,
                },
              ],
            },
          },
        };
      });
    },
    [activeBook.id, updateState]
  );

  /** 할일 토글 */
  const toggleTodo = useCallback(
    (todoId: string) => {
      updateState((prev) => {
        const current =
          prev.todosByBook[activeBook.id] ?? buildSeedTodos(activeBook, todayISO);
        return {
          ...prev,
          todosByBook: {
            ...prev.todosByBook,
            [activeBook.id]: current.map((t) =>
              t.id === todoId ? { ...t, completed: !t.completed } : t
            ),
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 할일 추가 */
  const addTodo = useCallback(
    (params: {
      title: string;
      subjectTitle: string;
      subjectColor: string;
      topicId?: string;
      dueDate?: string;
    }) => {
      const trimmed = params.title.trim();
      if (!trimmed) return;
      updateState((prev) => {
        const current =
          prev.todosByBook[activeBook.id] ?? buildSeedTodos(activeBook, todayISO);
        return {
          ...prev,
          todosByBook: {
            ...prev.todosByBook,
            [activeBook.id]: [
              {
                id: `todo-${Date.now()}`,
                title: trimmed,
                subjectTitle: params.subjectTitle,
                subjectColor: params.subjectColor,
                topicId: params.topicId,
                dueDate: params.dueDate || todayISO,
                completed: false,
              },
              ...current,
            ],
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  /** 할일 삭제 */
  const deleteTodo = useCallback(
    (todoId: string) => {
      updateState((prev) => {
        const current =
          prev.todosByBook[activeBook.id] ?? buildSeedTodos(activeBook, todayISO);
        return {
          ...prev,
          todosByBook: {
            ...prev.todosByBook,
            [activeBook.id]: current.filter((t) => t.id !== todoId),
          },
        };
      });
    },
    [activeBook, todayISO, updateState]
  );

  return {
    isHydrated,
    todayISO,
    dayResetHour,
    setDayResetHour,
    examDate: state.examDate,
    setExamDate,
    activeBook,
    activeBooks,
    activeBookIds,
    catalog: allCatalogBooks,
    subjects,
    archivedSubjects,
    matrixLogs,
    timetablesByDate,
    setTimetableSlots,
    chapterTotals,
    refreshDbSync,
    todos,
    collapsedSubjectIds: state.collapsedSubjectIds,
    selectTextbook,
    toggleBookActive,
    addCustomBook,
    deleteCustomBook,
    addCustomSubject,
    updateSubjectCustomization,
    archiveSubject,
    restoreSubject,
    deleteSubject,
    upsertMatrixCell,
    upsertMatrixCellsBulk,
    deleteMatrixCell,
    deleteMatrixCellsBulk,
    scheduleMultiDayPlan,
    carryOverTopicToNextDay,
    recordStudySession,
    toggleSubjectCollapse,
    setAllSubjectsCollapsed,
    addCustomTopic,
    toggleTodo,
    addTodo,
    deleteTodo,
  };
}
