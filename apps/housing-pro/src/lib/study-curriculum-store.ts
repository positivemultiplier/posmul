"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  TEXTBOOK_CATALOG,
  DEFAULT_SUBJECT_CATEGORIES,
  type TextbookCatalogItem,
  type StudySubjectNode,
  type MatrixCellLog,
  type StudyTodoItem,
  type TimetableSlotLog,
  addDaysISO,
  computeLogicalTodayISO,
  findTopicMetaInSubjects,
  getTimetableSlotPlan,
  getTimetableSlotActual,
  setTimetableSlotLayer,
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
  isbn?: string;
  author?: string;
  publisher?: string;
  coverImageUrl?: string;
}

export interface CustomBookSubjectInput {
  title: string;
  color?: string;
  examStage?: "1차" | "2차";
  category?: string;
  units: Array<{
    title: string;
    topics: Array<{
      title: string;
      defaultKeyword?: string;
      estimatedMinutes?: number;
    }>;
  }>;
}

export interface SubjectOverrideItem {
  title?: string;
  shortTitle?: string;
  color?: string;
  examStage?: "1차" | "2차";
  category?: string;
}

export interface CurriculumPersistedState {
  activeBookId: string;
  /** 다중 선택된 교재 ID 목록 */
  activeBookIds?: string[];
  /** 사용자 추가 커스텀 교재 목록 */
  customBooks?: CustomBookItem[];
  /** 사용자 추가 커스텀 과목 목록 */
  customSubjects?: StudySubjectNode[];
  /** 사용자 확장 커스텀 분류 목록 */
  customCategories?: string[];
  /** 과목별 이름/색상/차수/분류 커스텀 오버라이드 */
  subjectOverrides?: Record<string, SubjectOverrideItem>;
  /** 보관함에 넣은 과목 ID 목록 */
  archivedSubjectIds?: string[];
  /** 플래너에서 뺀(숨긴) 개별 단원 ID 목록 */
  hiddenTopicIds?: string[];
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
    customCategories: [],
    subjectOverrides: {},
    archivedSubjectIds: [],
    hiddenTopicIds: [],
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
    const activeBookIds = Array.isArray(parsed.activeBookIds)
      ? parsed.activeBookIds.filter((id) => allBookIds.has(id))
      : [validBookId];

    return {
      activeBookId: validBookId,
      activeBookIds,
      customBooks,
      customSubjects: Array.isArray(parsed.customSubjects) ? parsed.customSubjects : [],
      customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
      subjectOverrides: parsed.subjectOverrides || {},
      archivedSubjectIds: Array.isArray(parsed.archivedSubjectIds)
        ? parsed.archivedSubjectIds
        : [],
      hiddenTopicIds: Array.isArray(parsed.hiddenTopicIds) ? parsed.hiddenTopicIds : [],
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

function persistState(
  next: CurriculumPersistedState,
  sourceInstanceId?: string
): void {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    queueMicrotask(() => {
      if (typeof globalThis !== "undefined" && "dispatchEvent" in globalThis) {
        globalThis.dispatchEvent(
          new globalThis.CustomEvent(SYNC_EVENT, {
            detail: { sourceInstanceId },
          })
        );
      }
    });
  } catch {
    // 스토리지 용량 초과 등 예외 무시
  }
}

/** 날짜별·슬롯별 타임테이블 깊은 병합 (로컬 우선, plan/actual 레이어 모두 보존) */
function mergeTimetableMaps(
  remoteMap?: Record<string, Record<string, TimetableSlotLog>>,
  localMap?: Record<string, Record<string, TimetableSlotLog>>
): Record<string, Record<string, TimetableSlotLog>> {
  const merged: Record<string, Record<string, TimetableSlotLog>> = {};
  const allDates = new Set([
    ...Object.keys(remoteMap || {}),
    ...Object.keys(localMap || {}),
  ]);

  for (const dateISO of allDates) {
    const rDay = remoteMap?.[dateISO] || {};
    const lDay = localMap?.[dateISO] || {};
    const allSlots = new Set([...Object.keys(rDay), ...Object.keys(lDay)]);
    const mergedDay: Record<string, TimetableSlotLog> = {};

    for (const slotKey of allSlots) {
      const rSlot = rDay[slotKey];
      const lSlot = lDay[slotKey];
      if (!rSlot) {
        mergedDay[slotKey] = lSlot;
      } else if (!lSlot) {
        mergedDay[slotKey] = rSlot;
      } else {
        const plan = getTimetableSlotPlan(lSlot) || getTimetableSlotPlan(rSlot);
        const actual = getTimetableSlotActual(lSlot) || getTimetableSlotActual(rSlot);
        const primary = actual || plan || lSlot;
        mergedDay[slotKey] = {
          color: primary.color,
          label: primary.label,
          ...(primary.topicId ? { topicId: primary.topicId } : {}),
          ...(plan ? { plan } : {}),
          ...(actual ? { actual } : {}),
        };
      }
    }

    merged[dateISO] = mergedDay;
  }

  return merged;
}

/** 슬롯 색상을 과목/단원 커스텀 색상과 동기화 (plan/actual 레이어 포함) */
function recolorSlotByTopicSet(
  slot: TimetableSlotLog,
  topicIds: Set<string>,
  nextColor: string
): TimetableSlotLog {
  const matchTopLevel = Boolean(slot.topicId && topicIds.has(slot.topicId));
  const matchPlan = Boolean(slot.plan?.topicId && topicIds.has(slot.plan.topicId));
  const matchActual = Boolean(slot.actual?.topicId && topicIds.has(slot.actual.topicId));
  if (!matchTopLevel && !matchPlan && !matchActual) return slot;

  return {
    ...slot,
    color: matchTopLevel || matchActual || matchPlan ? nextColor : slot.color,
    ...(slot.plan
      ? { plan: matchPlan ? { ...slot.plan, color: nextColor } : slot.plan }
      : {}),
    ...(slot.actual
      ? { actual: matchActual ? { ...slot.actual, color: nextColor } : slot.actual }
      : {}),
  };
}

/** 날짜 타임테이블에서 topicId별 plan / actual 슬롯 개수 집계 */
function countLayerSlotsByTopic(
  dayMap: Record<string, TimetableSlotLog>,
  layer: "plan" | "actual"
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slot of Object.values(dayMap)) {
    const entry = layer === "plan" ? getTimetableSlotPlan(slot) : getTimetableSlotActual(slot);
    if (entry?.topicId) {
      counts.set(entry.topicId, (counts.get(entry.topicId) ?? 0) + 1);
    }
  }
  return counts;
}

/** 다중 교재 환경에서 셀 키가 속한 교재 버킷 탐색 */
function resolveBookIdForCell(
  logsByBook: Record<string, Record<string, MatrixCellLog>>,
  fallbackBookId: string,
  activeIds: string[] | undefined,
  cellKey: string
): string {
  for (const bId of [fallbackBookId, ...(activeIds || [])]) {
    if (logsByBook[bId]?.[cellKey]) return bId;
  }
  return fallbackBookId;
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

  const instanceIdRef = useRef<string>(
    `curr-${Math.random().toString(36).slice(2, 10)}`
  );
  const isSelfPersistingRef = useRef<boolean>(false);
  const hasMergedRemoteRef = useRef<string | null>(null);

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

  // 1. 로컬스토리지 우선 로드 (hydration 완료 후 서버 병합 허용)
  useEffect(() => {
    setState(readStoredState(initialTodayISO));
    setIsHydrated(true);
    refreshDbSync();

    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<{ sourceInstanceId?: string }>).detail;
      if (
        isSelfPersistingRef.current ||
        detail?.sourceInstanceId === instanceIdRef.current
      ) {
        isSelfPersistingRef.current = false;
        return;
      }
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

  // 2. 로그인 시 서버 study_user_profiles 의 planner_state / examDate 병합 (hydration 이후 사용자당 1회)
  useEffect(() => {
    if (!isHydrated || !isLoggedIn || !profile.userId) return;
    if (hasMergedRemoteRef.current === profile.userId) return;
    const remote = profile.plannerState as Partial<CurriculumPersistedState> | undefined;
    if (!remote && !profile.examDate) return;

    hasMergedRemoteRef.current = profile.userId;
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
        activeBookIds: Array.isArray(prev.activeBookIds)
          ? prev.activeBookIds
          : remote?.activeBookIds,
        customBooks:
          (prev.customBooks?.length ?? 0) > 0 ? prev.customBooks : remote?.customBooks,
        customSubjects:
          (prev.customSubjects?.length ?? 0) > 0
            ? prev.customSubjects
            : remote?.customSubjects,
        customCategories: Array.from(
          new Set([
            ...(remote?.customCategories || []),
            ...(prev.customCategories || []),
          ])
        ),
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
        hiddenTopicIds: Array.from(
          new Set([
            ...(remote?.hiddenTopicIds || []),
            ...(prev.hiddenTopicIds || []),
          ])
        ),
        dayResetHour: prev.dayResetHour ?? remote?.dayResetHour ?? 4,
        timetablesByDate: mergeTimetableMaps(
          remote?.timetablesByDate,
          prev.timetablesByDate
        ),
        examDate: profile.examDate || remote?.examDate || prev.examDate,
        logsByBook: mergedLogs,
        todosByBook: remote?.todosByBook
          ? { ...remote.todosByBook, ...prev.todosByBook }
          : prev.todosByBook,
        customTopicsByBook: remote?.customTopicsByBook
          ? { ...remote.customTopicsByBook, ...prev.customTopicsByBook }
          : prev.customTopicsByBook,
      };
      isSelfPersistingRef.current = true;
      persistState(next, instanceIdRef.current);
      return next;
    });
  }, [isHydrated, isLoggedIn, profile.userId, profile.examDate, profile.plannerState]);

  const updateState = useCallback(
    (
      updater: (prev: CurriculumPersistedState) => CurriculumPersistedState,
      addedFocusSeconds = 0
    ) => {
      setState((prev) => {
        const next = updater(prev);
        isSelfPersistingRef.current = true;
        persistState(next, instanceIdRef.current);
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
    const customAsCatalog: TextbookCatalogItem[] = (state.customBooks || []).map((cb) => {
      const bookTopicMap = state.customTopicsByBook[cb.id] || {};
      const bookSubjects = (state.customSubjects || [])
        .filter((s) => s.bookId === cb.id)
        .map((s) => ({
          ...s,
          units: s.units.map((u) => {
            const extra = bookTopicMap[u.id] || [];
            return extra.length > 0 ? { ...u, topics: [...u.topics, ...extra] } : u;
          }),
        }));
      return {
        id: cb.id,
        title: cb.title,
        subtitle: cb.subtitle || "사용자 커스텀 교재 · 자유 목차 구성",
        author: cb.author || "내 커스텀",
        edition: cb.publisher || "커스텀 교재",
        badge: cb.badge || cb.title.slice(0, 6),
        coverColor: cb.coverColor || "#FF5A36",
        ...(cb.isbn ? { isbn: cb.isbn } : {}),
        ...(cb.publisher ? { publisher: cb.publisher } : {}),
        ...(cb.coverImageUrl ? { coverImageUrl: cb.coverImageUrl } : {}),
        requiresSerial: false,
        defaultExamDate: state.examDate || "2026-12-12",
        subjects: bookSubjects,
        seedOffsets: [],
        seedTodos: [],
      };
    });
    return [...TEXTBOOK_CATALOG, ...customAsCatalog];
  }, [state.customBooks, state.customSubjects, state.customTopicsByBook, state.examDate]);

  const activeBookIds = useMemo(() => {
    const validSet = new Set(allCatalogBooks.map((b) => b.id));
    if (Array.isArray(state.activeBookIds)) {
      return state.activeBookIds.filter((id) => validSet.has(id));
    }
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
    const hiddenTopicSet = new Set(state.hiddenTopicIds || []);

    return rawSubjects.map((subject) => {
      const ov = overrides[subject.id];
      const resolvedStage = ov?.examStage ?? subject.examStage;
      const defaultCategory =
        resolvedStage === "1차" ? "주택관리사 1차" : "주택관리사 2차";
      return {
        ...subject,
        title: ov?.title ?? subject.title,
        shortTitle: ov?.shortTitle ?? (ov?.title ? ov.title.slice(0, 6) : subject.shortTitle),
        color: ov?.color ?? subject.color,
        examStage: resolvedStage,
        category: ov?.category ?? subject.category ?? defaultCategory,
        isArchived: archivedSet.has(subject.id),
        units: subject.units.map((unit) => {
          const extra = mergedUnitTopics[unit.id] || [];
          const combined = extra.length > 0 ? [...unit.topics, ...extra] : unit.topics;
          return {
            ...unit,
            topics: combined.filter((t) => !hiddenTopicSet.has(t.id)),
          };
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
    state.hiddenTopicIds,
  ]);

  /** 확장형 분류 목록 (기본 프리셋 + 사용자 커스텀 분류 + 사용 중 분류) */
  const categories: string[] = useMemo(() => {
    const set = new Set<string>([
      ...DEFAULT_SUBJECT_CATEGORIES,
      ...(state.customCategories || []),
    ]);
    for (const s of allMergedSubjects) {
      if (s.category) set.add(s.category);
    }
    return Array.from(set);
  }, [state.customCategories, allMergedSubjects]);

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

  /** 다중 교재 활성/비활성 토글 (0권까지 모두 해제 가능, 데이터는 영구 보존) */
  const toggleBookActive = useCallback(
    (bookId: string) => {
      const targetBook = allCatalogBooks.find((b) => b.id === bookId);
      if (!targetBook) return;

      updateState((prev) => {
        const prevIds = prev.activeBookIds ?? [prev.activeBookId];
        const exists = prevIds.includes(bookId);
        const nextIds = exists
          ? prevIds.filter((id) => id !== bookId)
          : [...prevIds, bookId];
        const nextPrimaryId =
          prev.activeBookId === bookId && exists
            ? nextIds[0] || prev.activeBookId
            : prev.activeBookId || nextIds[0] || bookId;

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

  /** 플래너에서 책 즉시 빼기 (기록·커스텀 단원 데이터는 서재에 100% 보존) */
  const removeBookFromPlanner = useCallback(
    (bookId: string) => {
      updateState((prev) => {
        const prevIds = prev.activeBookIds ?? [prev.activeBookId];
        const nextIds = prevIds.filter((id) => id !== bookId);
        return {
          ...prev,
          activeBookId:
            prev.activeBookId === bookId
              ? nextIds[0] || prev.activeBookId
              : prev.activeBookId,
          activeBookIds: nextIds,
        };
      });
    },
    [updateState]
  );

  /** 사용자 커스텀 교재 추가 (ISBN/표지 메타데이터 및 파싱된 과목·목차 지원) */
  const addCustomBook = useCallback(
    (params: {
      title: string;
      subtitle?: string;
      badge?: string;
      coverColor: string;
      isbn?: string;
      author?: string;
      publisher?: string;
      coverImageUrl?: string;
      firstSubjectTitle?: string;
      examStage?: "1차" | "2차";
      category?: string;
      subjects?: CustomBookSubjectInput[];
    }): string => {
      const trimmedTitle = params.title.trim();
      if (!trimmedTitle) return "";
      const now = Date.now();
      const bookId = `custom-book-${now}`;
      const stage = params.examStage || "2차";
      const category =
        params.category?.trim() ||
        (stage === "1차" ? "주택관리사 1차" : "주택관리사 2차");

      const newBook: CustomBookItem = {
        id: bookId,
        title: trimmedTitle,
        subtitle:
          params.subtitle?.trim() ||
          [params.author, params.publisher].filter(Boolean).join(" · ") ||
          "사용자 커스텀 교재 · 자유 목차",
        badge: params.badge?.trim() || trimmedTitle.slice(0, 6),
        coverColor: params.coverColor || "#FF5A36",
        ...(params.isbn?.trim() ? { isbn: params.isbn.trim() } : {}),
        ...(params.author?.trim() ? { author: params.author.trim() } : {}),
        ...(params.publisher?.trim() ? { publisher: params.publisher.trim() } : {}),
        ...(params.coverImageUrl?.trim()
          ? { coverImageUrl: params.coverImageUrl.trim() }
          : {}),
      };

      const createdSubjects: StudySubjectNode[] = [];
      if (params.subjects && params.subjects.length > 0) {
        params.subjects.forEach((subjInput, sIdx) => {
          const cleanSubjTitle = subjInput.title.trim();
          if (!cleanSubjTitle) return;
          const subjId = `custom-subj-${now}-${sIdx}`;
          const subjStage = subjInput.examStage || stage;
          const subjCategory = subjInput.category?.trim() || category;
          const subjColor = subjInput.color || params.coverColor || "#FF5A36";
          const units =
            subjInput.units.length > 0
              ? subjInput.units
              : [{ title: "기본 목차", topics: [] }];

          createdSubjects.push({
            id: subjId,
            examStage: subjStage,
            category: subjCategory,
            title: cleanSubjTitle,
            shortTitle: cleanSubjTitle.slice(0, 6),
            color: subjColor,
            bookId,
            bookTitle: trimmedTitle,
            bookBadge: newBook.badge,
            isCustom: true,
            units: units.map((u, uIdx) => ({
              id: `custom-unit-${now}-${sIdx}-${uIdx}`,
              unitNo: String(uIdx + 1),
              title: u.title.trim() || "기본 편제",
              topics: u.topics
                .filter((t) => t.title.trim().length > 0)
                .map((t, tIdx) => ({
                  id: `custom-top-${now}-${sIdx}-${uIdx}-${tIdx}`,
                  topicNo: String(tIdx + 1).padStart(2, "0"),
                  title: t.title.trim(),
                  defaultKeyword:
                    t.defaultKeyword?.trim() || t.title.trim().slice(0, 6),
                  estimatedMinutes: t.estimatedMinutes ?? 35,
                })),
            })),
          });
        });
      } else if (
        params.firstSubjectTitle &&
        params.firstSubjectTitle.trim() &&
        params.firstSubjectTitle.trim() !== trimmedTitle
      ) {
        const cleanSubjTitle = params.firstSubjectTitle.trim();
        createdSubjects.push({
          id: `custom-subj-${now}`,
          examStage: stage,
          category,
          title: cleanSubjTitle,
          shortTitle: cleanSubjTitle.slice(0, 6),
          color: params.coverColor || "#FF5A36",
          bookId,
          bookTitle: trimmedTitle,
          bookBadge: newBook.badge,
          isCustom: true,
          units: [
            {
              id: `custom-unit-${now}`,
              unitNo: "Ⅰ",
              title: "기본 목차",
              topics: [],
            },
          ],
        });
      }

      updateState((prev) => {
        const prevIds = prev.activeBookIds ?? [prev.activeBookId];
        return {
          ...prev,
          activeBookIds: prevIds.includes(bookId) ? prevIds : [...prevIds, bookId],
          customBooks: [...(prev.customBooks || []), newBook],
          customSubjects: [...(prev.customSubjects || []), ...createdSubjects],
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

      return bookId;
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

  /** 새 커스텀 분류 추가 */
  const addCustomCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateState((prev) => {
        const current = prev.customCategories || [];
        if (
          current.includes(trimmed) ||
          (DEFAULT_SUBJECT_CATEGORIES as readonly string[]).includes(trimmed)
        ) {
          return prev;
        }
        return {
          ...prev,
          customCategories: [...current, trimmed],
        };
      });
    },
    [updateState]
  );

  /** 새 커스텀 과목 추가 (반드시 소속 교재 bookId와 연결, 책이 비활성이면 자동 활성화) */
  const addCustomSubject = useCallback(
    (params: {
      title: string;
      examStage?: "1차" | "2차";
      category?: string;
      color: string;
      bookId?: string;
      unitTitle?: string;
      topicTitles?: string[];
    }): { subjectId: string; unitId: string } | null => {
      const trimmed = params.title.trim();
      if (!trimmed) return null;
      const now = Date.now();
      const subjId = `custom-subj-${now}`;
      const unitId = `custom-unit-${now}`;
      const topicNames = (params.topicTitles || []).map((t) => t.trim()).filter(Boolean);

      const resolvedBookId = params.bookId || activeBook.id;
      const linkedBook = allCatalogBooks.find((b) => b.id === resolvedBookId);
      const stage = params.examStage || "2차";
      const category =
        params.category?.trim() ||
        (stage === "1차" ? "주택관리사 1차" : "주택관리사 2차");

      const newSubject: StudySubjectNode = {
        id: subjId,
        examStage: stage,
        category,
        title: trimmed,
        shortTitle: trimmed.slice(0, 6),
        color: params.color || "#FF5A36",
        bookId: resolvedBookId,
        bookTitle: linkedBook?.title,
        bookBadge: linkedBook?.badge,
        isCustom: true,
        units: [
          {
            id: unitId,
            unitNo: "Ⅰ",
            title: params.unitTitle?.trim() || "기본 목차",
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

      updateState((prev) => {
        const prevIds = prev.activeBookIds ?? [prev.activeBookId];
        const nextIds =
          resolvedBookId && !prevIds.includes(resolvedBookId)
            ? [...prevIds, resolvedBookId]
            : prevIds;
        return {
          ...prev,
          activeBookIds: nextIds,
          customSubjects: [...(prev.customSubjects || []), newSubject],
        };
      });

      return { subjectId: subjId, unitId };
    },
    [activeBook.id, allCatalogBooks, updateState]
  );

  /** 과목 이름/차수/분류/색상 수정 (타임테이블 슬롯 색상 자동 동기화) */
  const updateSubjectCustomization = useCallback(
    (subjectId: string, patch: SubjectOverrideItem) => {
      const targetSubject = allMergedSubjects.find((s) => s.id === subjectId);
      const subjectTopicIds = new Set<string>();
      if (targetSubject) {
        for (const u of targetSubject.units) {
          for (const t of u.topics) subjectTopicIds.add(t.id);
        }
      }

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
            category: patch.category?.trim() || subj.category,
          };
        });
        const prevOv = prev.subjectOverrides?.[subjectId] || {};
        const nextTitle = patch.title?.trim() || prevOv.title;

        // 색상 변경 시 타임테이블에 이미 칠해진 해당 과목 단원 슬롯 색상도 동기화
        let nextTimetables = prev.timetablesByDate;
        if (patch.color && subjectTopicIds.size > 0 && prev.timetablesByDate) {
          const updatedMap: Record<string, Record<string, TimetableSlotLog>> = {};
          for (const [dISO, slots] of Object.entries(prev.timetablesByDate)) {
            const nextDay: Record<string, TimetableSlotLog> = {};
            for (const [sKey, sVal] of Object.entries(slots)) {
              nextDay[sKey] = recolorSlotByTopicSet(sVal, subjectTopicIds, patch.color);
            }
            updatedMap[dISO] = nextDay;
          }
          nextTimetables = updatedMap;
        }

        return {
          ...prev,
          customSubjects: nextCustomSubjects,
          timetablesByDate: nextTimetables,
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
    [allMergedSubjects, updateState]
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

  /** 날짜별 타임테이블 슬롯 일괄 업데이트 (plan/actual 슬롯 변동 시 단원 예상/실행 시간 자동 연동) */
  const setTimetableSlots = useCallback(
    (
      dateISO: string,
      updater: (prev: Record<string, TimetableSlotLog>) => Record<string, TimetableSlotLog>
    ) => {
      updateState((prev) => {
        const prevMap = prev.timetablesByDate || {};
        const currentDay = prevMap[dateISO] || {};
        const nextDay = updater(currentDay);

        const prevPlanCounts = countLayerSlotsByTopic(currentDay, "plan");
        const nextPlanCounts = countLayerSlotsByTopic(nextDay, "plan");
        const prevActualCounts = countLayerSlotsByTopic(currentDay, "actual");
        const nextActualCounts = countLayerSlotsByTopic(nextDay, "actual");

        const affectedTopicIds = new Set<string>([
          ...prevPlanCounts.keys(),
          ...nextPlanCounts.keys(),
          ...prevActualCounts.keys(),
          ...nextActualCounts.keys(),
        ]);

        let nextLogsByBook = prev.logsByBook;
        for (const topicId of affectedTopicIds) {
          const prevP = prevPlanCounts.get(topicId) ?? 0;
          const nextP = nextPlanCounts.get(topicId) ?? 0;
          const prevA = prevActualCounts.get(topicId) ?? 0;
          const nextA = nextActualCounts.get(topicId) ?? 0;
          if (prevP === nextP && prevA === nextA) continue;

          const cellKey = makeMatrixKey(topicId, dateISO);
          const targetBookId = resolveBookIdForCell(
            nextLogsByBook,
            activeBook.id,
            prev.activeBookIds,
            cellKey
          );
          const bookLogs = {
            ...(nextLogsByBook[targetBookId] ??
              (targetBookId === activeBook.id ? buildSeedLogs(activeBook, todayISO) : {})),
          };
          const existing = bookLogs[cellKey];
          const meta = findTopicMetaInSubjects(subjects, topicId);

          if (!existing && nextP === 0 && nextA === 0) continue;

          bookLogs[cellKey] = {
            keyword: existing?.keyword || meta?.topic.defaultKeyword || "학습계획",
            status: existing?.status || "plan",
            minutes: prevP !== nextP ? nextP * 10 : existing?.minutes ?? meta?.topic.estimatedMinutes ?? 30,
            ...(prevA !== nextA
              ? { actualMinutes: nextA * 10 }
              : existing?.actualMinutes !== undefined
                ? { actualMinutes: existing.actualMinutes }
                : {}),
            updatedAt: todayISO,
            ...(existing?.customColor ? { customColor: existing.customColor } : {}),
          };

          nextLogsByBook = {
            ...nextLogsByBook,
            [targetBookId]: bookLogs,
          };
        }

        return {
          ...prev,
          logsByBook: nextLogsByBook,
          timetablesByDate: {
            ...prevMap,
            [dateISO]: nextDay,
          },
        };
      });
    },
    [activeBook, subjects, todayISO, updateState]
  );

  /** 시험일(D-Day) 변경 */
  const setExamDate = useCallback(
    (examDate: string) => {
      updateState((prev) => ({ ...prev, examDate }));
    },
    [updateState]
  );

  /** 매트릭스 셀 등록/수정 (customColor 변경 시 해당 날짜 타임테이블 슬롯 색상도 동기화) */
  const upsertMatrixCell = useCallback(
    (topicId: string, dateISO: string, cell: MatrixCellLog) => {
      updateState((prev) => {
        const bookLogs =
          prev.logsByBook[activeBook.id] ?? buildSeedLogs(activeBook, todayISO);
        let nextTimetables = prev.timetablesByDate;
        if (cell.customColor && prev.timetablesByDate?.[dateISO]) {
          const daySlots = prev.timetablesByDate[dateISO];
          const targetSet = new Set([topicId]);
          const nextDaySlots: Record<string, TimetableSlotLog> = {};
          for (const [sKey, sVal] of Object.entries(daySlots)) {
            nextDaySlots[sKey] = recolorSlotByTopicSet(sVal, targetSet, cell.customColor);
          }
          nextTimetables = {
            ...prev.timetablesByDate,
            [dateISO]: nextDaySlots,
          };
        }
        return {
          ...prev,
          timetablesByDate: nextTimetables,
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

        const existingCurrent = bookLogs[currentKey];
        bookLogs[currentKey] = {
          keyword: cleanKeyword.slice(0, 14),
          status: "partial",
          minutes: todayMinutes,
          ...(existingCurrent?.actualMinutes !== undefined
            ? { actualMinutes: existingCurrent.actualMinutes }
            : {}),
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

  /** 타이머 완료 시 오늘 날짜 매트릭스 셀에 실제 실행 시간(actualMinutes) 및 타임테이블 실행(actual) 슬롯 자동 기록 */
  const recordStudySession = useCallback(
    (
      topicId: string,
      elapsedSeconds: number,
      customKeyword?: string,
      completionMode: "done" | "partial" = "done",
      startedAtMs?: number
    ) => {
      const addedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const meta = findTopicMetaInSubjects(subjects, topicId);

      updateState((prev) => {
        const key = makeMatrixKey(topicId, todayISO);
        const targetBookId = resolveBookIdForCell(
          prev.logsByBook,
          activeBook.id,
          prev.activeBookIds,
          key
        );
        const bookLogs = {
          ...(prev.logsByBook[targetBookId] ??
            (targetBookId === activeBook.id ? buildSeedLogs(activeBook, todayISO) : {})),
        };
        const existing = bookLogs[key];
        const resolvedColor = existing?.customColor || meta?.subject.color || "#FF5A36";
        const resolvedLabel = meta?.topic.title || existing?.keyword || "집중학습";

        // 예상 시간(minutes)은 보존하고 실제 실행 시간(actualMinutes)만 누적
        bookLogs[key] = {
          keyword:
            customKeyword?.trim() ||
            existing?.keyword ||
            meta?.topic.defaultKeyword ||
            (completionMode === "partial" ? "진행중" : "집중학습"),
          status: completionMode,
          minutes: existing?.minutes ?? meta?.topic.estimatedMinutes ?? 30,
          actualMinutes: (existing?.actualMinutes ?? 0) + addedMinutes,
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

        // 타임테이블 actual 레이어에 시작 시각 ~ 종료 시각 10분 단위 자동 기록
        const endMs = Date.now();
        const startMs =
          typeof startedAtMs === "number" && startedAtMs > 0
            ? startedAtMs
            : endMs - Math.max(60, elapsedSeconds) * 1000;
        const startDt = new Date(startMs);
        let curHour = startDt.getHours();
        let curSlot = Math.floor(startDt.getMinutes() / 10);
        const slotCount = Math.max(1, Math.ceil(addedMinutes / 10));

        const prevTimetables = prev.timetablesByDate || {};
        const nextDaySlots: Record<string, TimetableSlotLog> = {
          ...(prevTimetables[todayISO] || {}),
        };

        for (let i = 0; i < slotCount; i += 1) {
          const sKey = `${curHour}-${curSlot}`;
          const updatedSlot = setTimetableSlotLayer(nextDaySlots[sKey], "actual", {
            color: resolvedColor,
            label: resolvedLabel,
            topicId,
            ...(meta?.subject.bookId || activeBook.id
              ? { bookId: meta?.subject.bookId || activeBook.id }
              : {}),
          });
          if (updatedSlot) {
            nextDaySlots[sKey] = updatedSlot;
          }
          curSlot += 1;
          if (curSlot >= 6) {
            curSlot = 0;
            curHour = (curHour + 1) % 24;
          }
        }

        return {
          ...prev,
          logsByBook: {
            ...prev.logsByBook,
            [targetBookId]: bookLogs,
          },
          timetablesByDate: {
            ...prevTimetables,
            [todayISO]: nextDaySlots,
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

  /** 커스텀 목차 일괄 추가 (unitId가 속한 교재에 정확히 귀속) */
  const addCustomTopicsBulk = useCallback(
    (unitId: string, titles: string[], estimatedMinutes = 30) => {
      const cleanList = titles.map((t) => t.trim()).filter(Boolean);
      if (cleanList.length === 0) return;

      const ownerSubject = allMergedSubjects.find((s) =>
        s.units.some((u) => u.id === unitId)
      );
      const targetBookId = ownerSubject?.bookId || activeBook.id;
      const now = Date.now();

      updateState((prev) => {
        const bookCustom = prev.customTopicsByBook[targetBookId] || {};
        const unitExtra = bookCustom[unitId] || [];
        const newEntries = cleanList.map((tTitle, idx) => ({
          id: `custom-topic-${now}-${idx}`,
          title: tTitle,
          defaultKeyword: tTitle.slice(0, 6),
          estimatedMinutes,
        }));
        return {
          ...prev,
          customTopicsByBook: {
            ...prev.customTopicsByBook,
            [targetBookId]: {
              ...bookCustom,
              [unitId]: [...unitExtra, ...newEntries],
            },
          },
        };
      });
    },
    [activeBook.id, allMergedSubjects, updateState]
  );

  /** 커스텀 목차 추가 */
  const addCustomTopic = useCallback(
    (unitId: string, title: string, defaultKeyword: string, estimatedMinutes = 30) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const ownerSubject = allMergedSubjects.find((s) =>
        s.units.some((u) => u.id === unitId)
      );
      const targetBookId = ownerSubject?.bookId || activeBook.id;
      updateState((prev) => {
        const bookCustom = prev.customTopicsByBook[targetBookId] || {};
        const unitExtra = bookCustom[unitId] || [];
        return {
          ...prev,
          customTopicsByBook: {
            ...prev.customTopicsByBook,
            [targetBookId]: {
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
    [activeBook.id, allMergedSubjects, updateState]
  );

  /** 개별 단원 플래너에서 빼기 (기록 유지, 언제든 복원 가능) */
  const hideTopic = useCallback(
    (topicId: string) => {
      updateState((prev) => {
        const current = prev.hiddenTopicIds || [];
        if (current.includes(topicId)) return prev;
        return {
          ...prev,
          hiddenTopicIds: [...current, topicId],
        };
      });
    },
    [updateState]
  );

  /** 빼둔 단원 일괄 또는 개별 복원 */
  const restoreHiddenTopic = useCallback(
    (topicId?: string) => {
      updateState((prev) => ({
        ...prev,
        hiddenTopicIds: topicId
          ? (prev.hiddenTopicIds || []).filter((id) => id !== topicId)
          : [],
      }));
    },
    [updateState]
  );

  /** 커스텀 목차 삭제 */
  const deleteCustomTopic = useCallback(
    (unitId: string, topicId: string) => {
      updateState((prev) => {
        const nextCustomTopicsByBook: CurriculumPersistedState["customTopicsByBook"] = {};
        for (const [bId, unitMap] of Object.entries(prev.customTopicsByBook)) {
          const list = unitMap[unitId];
          nextCustomTopicsByBook[bId] = list
            ? { ...unitMap, [unitId]: list.filter((t) => t.id !== topicId) }
            : unitMap;
        }
        const nextCustomSubjects = (prev.customSubjects || []).map((subj) => ({
          ...subj,
          units: subj.units.map((u) =>
            u.id === unitId
              ? { ...u, topics: u.topics.filter((t) => t.id !== topicId) }
              : u
          ),
        }));
        return {
          ...prev,
          customTopicsByBook: nextCustomTopicsByBook,
          customSubjects: nextCustomSubjects,
        };
      });
    },
    [updateState]
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
    hiddenTopicIds: state.hiddenTopicIds || [],
    categories,
    addCustomCategory,
    matrixLogs,
    timetablesByDate,
    setTimetableSlots,
    chapterTotals,
    refreshDbSync,
    todos,
    collapsedSubjectIds: state.collapsedSubjectIds,
    selectTextbook,
    toggleBookActive,
    removeBookFromPlanner,
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
    addCustomTopicsBulk,
    deleteCustomTopic,
    hideTopic,
    restoreHiddenTopic,
    toggleTodo,
    addTodo,
    deleteTodo,
  };
}
