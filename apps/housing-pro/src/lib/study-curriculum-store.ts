"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TEXTBOOK_CATALOG,
  type TextbookCatalogItem,
  type StudySubjectNode,
  type MatrixCellLog,
  type StudyTodoItem,
  formatDateISO,
  addDaysISO,
  findTopicMetaInSubjects,
} from "@/data/study-textbooks";
import {
  fetchStudyMatrixSyncAction,
  type ChapterProgressSummary,
} from "@/app/actions/exam-study.actions";

const STORAGE_KEY = "housing_pro_curriculum_v4";
const LEGACY_STORAGE_KEY = "housing_pro_curriculum_v3";
const CLIENT_KEY_STORAGE = "housing_pro_client_key";
const SYNC_EVENT = "housing-pro-curriculum-sync";

export interface CurriculumPersistedState {
  activeBookId: string;
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
    const validBookId = TEXTBOOK_CATALOG.some((b) => b.id === parsed.activeBookId)
      ? (parsed.activeBookId as string)
      : fallback.activeBookId;
    return {
      activeBookId: validBookId,
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
  const todayISO = useMemo(() => formatDateISO(new Date()), []);
  const [state, setState] = useState<CurriculumPersistedState>(() =>
    createDefaultState(todayISO)
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [dbMatrixCells, setDbMatrixCells] = useState<Record<string, MatrixCellLog>>({});
  const [chapterTotals, setChapterTotals] = useState<Record<string, ChapterProgressSummary>>({});

  const refreshDbSync = useCallback(async () => {
    if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
    const clientKey = globalThis.localStorage.getItem(CLIENT_KEY_STORAGE);
    if (!clientKey) return;
    const res = await fetchStudyMatrixSyncAction(clientKey);
    if (res.success) {
      setDbMatrixCells(res.matrixCells);
      setChapterTotals(res.chapterTotals);
    }
  }, []);

  useEffect(() => {
    setState(readStoredState(todayISO));
    setIsHydrated(true);
    refreshDbSync();

    const handleSync = () => {
      setState(readStoredState(todayISO));
      refreshDbSync();
    };
    const handleFocus = () => {
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
  }, [todayISO, refreshDbSync]);

  const updateState = useCallback(
    (updater: (prev: CurriculumPersistedState) => CurriculumPersistedState) => {
      setState((prev) => {
        const next = updater(prev);
        persistState(next);
        return next;
      });
    },
    []
  );

  const activeBook = useMemo(
    () =>
      TEXTBOOK_CATALOG.find((b) => b.id === state.activeBookId) || TEXTBOOK_CATALOG[0],
    [state.activeBookId]
  );

  /** 선택된 교재의 기본 목차 + 사용자 커스텀 목차 병합 */
  const subjects: StudySubjectNode[] = useMemo(() => {
    const customMap = state.customTopicsByBook[activeBook.id] || {};
    return activeBook.subjects.map((subject) => ({
      ...subject,
      units: subject.units.map((unit) => {
        const extra = customMap[unit.id] || [];
        return extra.length > 0
          ? { ...unit, topics: [...unit.topics, ...extra] }
          : unit;
      }),
    }));
  }, [activeBook, state.customTopicsByBook]);

  const matrixLogs: Record<string, MatrixCellLog> = useMemo(() => {
    const manualLogs =
      state.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO);
    return {
      ...dbMatrixCells,
      ...manualLogs,
    };
  }, [activeBook, state.logsByBook, todayISO, dbMatrixCells]);

  const todos: StudyTodoItem[] = useMemo(() => {
    return (
      state.todosByBook[activeBook.id] ?? buildSeedTodos(activeBook, todayISO)
    );
  }, [activeBook, state.todosByBook, todayISO]);

  /** 교재 선택: 해당 교재의 목차·초기 기록·할일 자동 활성화 */
  const selectTextbook = useCallback(
    (bookId: string) => {
      const targetBook = TEXTBOOK_CATALOG.find((b) => b.id === bookId);
      if (!targetBook) return;

      updateState((prev) => ({
        ...prev,
        activeBookId: targetBook.id,
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
      }));
    },
    [todayISO, updateState]
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

  /** 매트릭스 셀 삭제 */
  const deleteMatrixCell = useCallback(
    (topicId: string, dateISO: string) => {
      updateState((prev) => {
        const bookLogs = {
          ...(prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO)),
        };
        delete bookLogs[makeMatrixKey(topicId, dateISO)];
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

  /** 타이머 완료 시 오늘 날짜 매트릭스 셀에 자동 색칠 및 시간 누적 */
  const recordStudySession = useCallback(
    (topicId: string, elapsedSeconds: number, customKeyword?: string) => {
      const addedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const meta = findTopicMetaInSubjects(subjects, topicId);

      updateState((prev) => {
        const bookLogs =
          prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO);
        const key = makeMatrixKey(topicId, todayISO);
        const existing = bookLogs[key];

        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [activeBook.id]: {
              ...bookLogs,
              [key]: {
                keyword:
                  customKeyword?.trim() ||
                  existing?.keyword ||
                  meta?.topic.defaultKeyword ||
                  "집중학습",
                status: "done",
                minutes: (existing?.minutes || 0) + addedMinutes,
                updatedAt: todayISO,
              },
            },
          },
        };
      });
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
    (unitId: string, title: string, defaultKeyword: string) => {
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
                  estimatedMinutes: 30,
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
    examDate: state.examDate,
    setExamDate,
    activeBook,
    catalog: TEXTBOOK_CATALOG,
    subjects,
    matrixLogs,
    chapterTotals,
    refreshDbSync,
    todos,
    collapsedSubjectIds: state.collapsedSubjectIds,
    selectTextbook,
    upsertMatrixCell,
    deleteMatrixCell,
    recordStudySession,
    toggleSubjectCollapse,
    setAllSubjectsCollapsed,
    addCustomTopic,
    toggleTodo,
    addTodo,
    deleteTodo,
  };
}
