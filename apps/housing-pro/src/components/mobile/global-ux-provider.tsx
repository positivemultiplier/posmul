"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { KnowledgeTrailTarget } from "@/components/study/concept-linked-text";
import { ConceptTrailDrawer } from "@/components/study/concept-trail-drawer";
import { GlobalSpotlightSearch } from "@/components/mobile/global-spotlight-search";
import { GroupFocusOverlay } from "@/components/study/timer/GroupFocusOverlay";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { flattenTopics } from "@/data/study-textbooks";
import { getMutedSubjectColor } from "@/lib/study-theme";

const FONT_SCALE_STORAGE_KEY = "housing_pro_large_font_v1";
const THEME_STORAGE_KEY = "housing_pro_theme_v1";
const DAILY_GOAL_STORAGE_KEY = "housing_pro_daily_goal_min_v1";
const RECENT_CONCEPTS_STORAGE_KEY = "housing_pro_recent_concepts_v1";

export type StudyThemeMode = "dark" | "light";

export interface QuickTimerState {
  active: boolean;
  paused: boolean;
  overlayOpen: boolean;
  topicId: string;
  topicTitle: string;
  subjectTitle: string;
  subjectColor: string;
  elapsedSeconds: number;
  startedAtMs: number;
}

export interface StartTimerPayload {
  id: string;
  title: string;
  subjectTitle: string;
  subjectColor?: string;
}

interface GlobalUxContextValue {
  /** 다크(기본) / 라이트 테마 */
  theme: StudyThemeMode;
  toggleTheme: () => void;
  /** 일일 순공 목표(분) */
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (minutes: number) => void;
  /** 가독성 큰 글씨 모드 (112.5%) */
  largeFont: boolean;
  toggleLargeFont: () => void;
  /** 전역 1초 개념·기출 검색 모달 */
  isSpotlightOpen: boolean;
  openSpotlight: (initialQuery?: string) => void;
  closeSpotlight: () => void;
  /** 어느 화면에서든 개념 드릴다운 드로어 열기 */
  openConceptTrail: (target: KnowledgeTrailTarget) => void;
  /** 최근 열어본 개념 ID 목록 */
  recentConceptIds: string[];
  /** 전역 집중 타이머 (실행 즉시 그룹 우선 풀스크린 오버레이 표시) */
  quickTimer: QuickTimerState;
  startQuickTimer: (topic?: StartTimerPayload) => void;
  openTimerOverlay: () => void;
  minimizeTimerOverlay: () => void;
  toggleQuickTimerPause: () => void;
  stopAndSaveQuickTimer: () => { savedSeconds: number; topicTitle: string };
}

const GlobalUxContext = createContext<GlobalUxContextValue | null>(null);

const INITIAL_TIMER: QuickTimerState = {
  active: false,
  paused: false,
  overlayOpen: false,
  topicId: "",
  topicTitle: "",
  subjectTitle: "",
  subjectColor: "#4F7CAC",
  elapsedSeconds: 0,
  startedAtMs: 0,
};

export function GlobalUxProvider({ children }: { children: ReactNode }) {
  const { subjects, recordStudySession } = useStudyCurriculum();

  const [theme, setTheme] = useState<StudyThemeMode>("dark");
  const [dailyGoalMinutes, setDailyGoalMinutesState] = useState<number>(360);
  const [largeFont, setLargeFont] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightInitialQuery, setSpotlightInitialQuery] = useState("");
  const [activeTrailTarget, setActiveTrailTarget] = useState<KnowledgeTrailTarget | null>(null);
  const [recentConceptIds, setRecentConceptIds] = useState<string[]>([]);
  const [quickTimer, setQuickTimer] = useState<QuickTimerState>(INITIAL_TIMER);

  // 저장된 테마·글자 크기·일일 목표·최근 개념 복원
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light") {
        setTheme("light");
        document.documentElement.classList.add("hp-theme-light");
      } else {
        document.documentElement.classList.remove("hp-theme-light");
      }

      const savedGoal = Number(window.localStorage.getItem(DAILY_GOAL_STORAGE_KEY));
      if (Number.isFinite(savedGoal) && savedGoal >= 60 && savedGoal <= 960) {
        setDailyGoalMinutesState(Math.round(savedGoal));
      }

      const savedFont = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (savedFont === "1") {
        setLargeFont(true);
        document.documentElement.classList.add("hp-font-lg");
      }

      const savedRecent = window.localStorage.getItem(RECENT_CONCEPTS_STORAGE_KEY);
      if (savedRecent) {
        const parsed = JSON.parse(savedRecent);
        if (Array.isArray(parsed)) {
          setRecentConceptIds(
            parsed.filter((x): x is string => typeof x === "string").slice(0, 8)
          );
        }
      }
    } catch {
      // 브라우저 스토리지 접근 불가 환경 무시
    }
  }, []);

  // 전역 집중 타이머 1초 틱
  useEffect(() => {
    if (!quickTimer.active || quickTimer.paused) return;
    const id = window.setInterval(() => {
      setQuickTimer((prev) =>
        prev.active && !prev.paused
          ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }
          : prev
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [quickTimer.active, quickTimer.paused]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: StudyThemeMode = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // 스토리지 쓰기 실패 무시
      }
      if (next === "light") {
        document.documentElement.classList.add("hp-theme-light");
      } else {
        document.documentElement.classList.remove("hp-theme-light");
      }
      return next;
    });
  }, []);

  const setDailyGoalMinutes = useCallback((minutes: number) => {
    const clamped = Math.max(60, Math.min(960, Math.round(minutes)));
    setDailyGoalMinutesState(clamped);
    try {
      window.localStorage.setItem(DAILY_GOAL_STORAGE_KEY, String(clamped));
    } catch {
      // 스토리지 쓰기 실패 무시
    }
  }, []);

  const toggleLargeFont = useCallback(() => {
    setLargeFont((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // 스토리지 쓰기 실패 무시
      }
      if (next) {
        document.documentElement.classList.add("hp-font-lg");
      } else {
        document.documentElement.classList.remove("hp-font-lg");
      }
      return next;
    });
  }, []);

  const openSpotlight = useCallback((initialQuery = "") => {
    setSpotlightInitialQuery(initialQuery);
    setIsSpotlightOpen(true);
  }, []);

  const closeSpotlight = useCallback(() => {
    setIsSpotlightOpen(false);
  }, []);

  const openConceptTrail = useCallback((target: KnowledgeTrailTarget) => {
    setActiveTrailTarget(target);
    if (target.kind === "concept") {
      setRecentConceptIds((prev) => {
        const next = [target.conceptId, ...prev.filter((id) => id !== target.conceptId)].slice(
          0,
          8
        );
        try {
          window.localStorage.setItem(RECENT_CONCEPTS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // 스토리지 쓰기 실패 무시
        }
        return next;
      });
    }
  }, []);

  const startQuickTimer = useCallback(
    (topic?: StartTimerPayload) => {
      const nowMs = Date.now();
      if (topic) {
        setQuickTimer({
          active: true,
          paused: false,
          overlayOpen: true,
          topicId: topic.id,
          topicTitle: topic.title,
          subjectTitle: topic.subjectTitle,
          subjectColor: getMutedSubjectColor(topic.subjectTitle, topic.subjectColor),
          elapsedSeconds: 0,
          startedAtMs: nowMs,
        });
        return;
      }

      const flattened = flattenTopics(subjects);
      const first = flattened[0];
      const fallbackSubjTitle = first?.subject.title || "민법";
      setQuickTimer({
        active: true,
        paused: false,
        overlayOpen: true,
        topicId: first?.topic.id || "quick-study",
        topicTitle: first?.topic.title || "집중 학습",
        subjectTitle: fallbackSubjTitle,
        subjectColor: getMutedSubjectColor(fallbackSubjTitle, first?.subject.color),
        elapsedSeconds: 0,
        startedAtMs: nowMs,
      });
    },
    [subjects]
  );

  const openTimerOverlay = useCallback(() => {
    setQuickTimer((prev) => (prev.active ? { ...prev, overlayOpen: true } : prev));
  }, []);

  const minimizeTimerOverlay = useCallback(() => {
    setQuickTimer((prev) => (prev.active ? { ...prev, overlayOpen: false } : prev));
  }, []);

  const toggleQuickTimerPause = useCallback(() => {
    setQuickTimer((prev) => (prev.active ? { ...prev, paused: !prev.paused } : prev));
  }, []);

  const stopAndSaveQuickTimer = useCallback(() => {
    const savedSeconds = quickTimer.elapsedSeconds;
    const topicTitle = quickTimer.topicTitle;
    if (quickTimer.active && savedSeconds >= 5 && quickTimer.topicId) {
      recordStudySession(
        quickTimer.topicId,
        savedSeconds,
        undefined,
        "done",
        quickTimer.startedAtMs || undefined
      );
    }
    setQuickTimer(INITIAL_TIMER);
    return { savedSeconds, topicTitle };
  }, [quickTimer, recordStudySession]);

  const value = useMemo<GlobalUxContextValue>(
    () => ({
      theme,
      toggleTheme,
      dailyGoalMinutes,
      setDailyGoalMinutes,
      largeFont,
      toggleLargeFont,
      isSpotlightOpen,
      openSpotlight,
      closeSpotlight,
      openConceptTrail,
      recentConceptIds,
      quickTimer,
      startQuickTimer,
      openTimerOverlay,
      minimizeTimerOverlay,
      toggleQuickTimerPause,
      stopAndSaveQuickTimer,
    }),
    [
      theme,
      toggleTheme,
      dailyGoalMinutes,
      setDailyGoalMinutes,
      largeFont,
      toggleLargeFont,
      isSpotlightOpen,
      openSpotlight,
      closeSpotlight,
      openConceptTrail,
      recentConceptIds,
      quickTimer,
      startQuickTimer,
      openTimerOverlay,
      minimizeTimerOverlay,
      toggleQuickTimerPause,
      stopAndSaveQuickTimer,
    ]
  );

  return (
    <GlobalUxContext.Provider value={value}>
      {children}

      {/* 전역 집중 타이머 오버레이 (실행 즉시 그룹 우선 노출 · 개인 집중 1탭 전환) */}
      <GroupFocusOverlay
        timer={quickTimer}
        onMinimize={minimizeTimerOverlay}
        onTogglePause={toggleQuickTimerPause}
        onStopAndSave={stopAndSaveQuickTimer}
      />

      {/* 전역 1초 Spotlight 개념·기출 검색 모달 */}
      <GlobalSpotlightSearch
        open={isSpotlightOpen}
        initialQuery={spotlightInitialQuery}
        recentConceptIds={recentConceptIds}
        onClose={closeSpotlight}
        onSelectTarget={(target) => {
          setIsSpotlightOpen(false);
          openConceptTrail(target);
        }}
      />

      {/* 전역 꼬리물기 드릴다운 드로어 */}
      <ConceptTrailDrawer
        initialTarget={activeTrailTarget}
        onClose={() => setActiveTrailTarget(null)}
      />
    </GlobalUxContext.Provider>
  );
}

export function useGlobalUx() {
  const ctx = useContext(GlobalUxContext);
  if (!ctx) {
    throw new Error("useGlobalUx must be used within GlobalUxProvider");
  }
  return ctx;
}
