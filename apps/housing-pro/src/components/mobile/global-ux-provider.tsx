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
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { flattenTopics } from "@/data/study-textbooks";

const FONT_SCALE_STORAGE_KEY = "housing_pro_large_font_v1";
const RECENT_CONCEPTS_STORAGE_KEY = "housing_pro_recent_concepts_v1";

export interface QuickTimerState {
  active: boolean;
  paused: boolean;
  topicId: string;
  topicTitle: string;
  subjectTitle: string;
  elapsedSeconds: number;
}

interface GlobalUxContextValue {
  /** 가독성 큰 글씨 모드 (112.5%) */
  largeFont: boolean;
  toggleLargeFont: () => void;
  /** 전역 1초 개념·암기법 검색 모달 */
  isSpotlightOpen: boolean;
  openSpotlight: (initialQuery?: string) => void;
  closeSpotlight: () => void;
  /** 어느 화면에서든 꼬리물기 지식 그래프 드로어 열기 */
  openConceptTrail: (target: KnowledgeTrailTarget) => void;
  /** 최근 열어본 개념 ID 목록 */
  recentConceptIds: string[];
  /** 전역 미니 타이머 (실물 책 공부 중 어느 탭 이동해도 상단 유지!) */
  quickTimer: QuickTimerState;
  startQuickTimer: (topic?: { id: string; title: string; subjectTitle: string }) => void;
  toggleQuickTimerPause: () => void;
  stopAndSaveQuickTimer: () => { savedSeconds: number; topicTitle: string };
}

const GlobalUxContext = createContext<GlobalUxContextValue | null>(null);

const INITIAL_TIMER: QuickTimerState = {
  active: false,
  paused: false,
  topicId: "",
  topicTitle: "",
  subjectTitle: "",
  elapsedSeconds: 0,
};

export function GlobalUxProvider({ children }: { children: ReactNode }) {
  const { subjects, recordStudySession } = useStudyCurriculum();

  const [largeFont, setLargeFont] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightInitialQuery, setSpotlightInitialQuery] = useState("");
  const [activeTrailTarget, setActiveTrailTarget] = useState<KnowledgeTrailTarget | null>(null);
  const [recentConceptIds, setRecentConceptIds] = useState<string[]>([]);
  const [quickTimer, setQuickTimer] = useState<QuickTimerState>(INITIAL_TIMER);

  // 저장된 글자 크기 및 최근 본 개념 복원
  useEffect(() => {
    try {
      const savedFont = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (savedFont === "1") {
        setLargeFont(true);
        document.documentElement.classList.add("hp-font-lg");
      }
      const savedRecent = window.localStorage.getItem(RECENT_CONCEPTS_STORAGE_KEY);
      if (savedRecent) {
        const parsed = JSON.parse(savedRecent);
        if (Array.isArray(parsed)) {
          setRecentConceptIds(parsed.filter((x): x is string => typeof x === "string").slice(0, 8));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // 전역 미니 타이머 1초 틱
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

  const toggleLargeFont = useCallback(() => {
    setLargeFont((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
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
          // ignore
        }
        return next;
      });
    }
  }, []);

  const startQuickTimer = useCallback(
    (topic?: { id: string; title: string; subjectTitle: string }) => {
      if (topic) {
        setQuickTimer({
          active: true,
          paused: false,
          topicId: topic.id,
          topicTitle: topic.title,
          subjectTitle: topic.subjectTitle,
          elapsedSeconds: 0,
        });
        return;
      }

      const flattened = flattenTopics(subjects);
      const first = flattened[0];
      setQuickTimer({
        active: true,
        paused: false,
        topicId: first?.topic.id || "quick-study",
        topicTitle: first?.topic.title || "주택관리사 2차 집중 학습",
        subjectTitle: first?.subject.title || "실물 교재 연동",
        elapsedSeconds: 0,
      });
    },
    [subjects]
  );

  const toggleQuickTimerPause = useCallback(() => {
    setQuickTimer((prev) => (prev.active ? { ...prev, paused: !prev.paused } : prev));
  }, []);

  const stopAndSaveQuickTimer = useCallback(() => {
    const savedSeconds = quickTimer.elapsedSeconds;
    const topicTitle = quickTimer.topicTitle;
    if (quickTimer.active && savedSeconds >= 5 && quickTimer.topicId) {
      recordStudySession(quickTimer.topicId, savedSeconds);
    }
    setQuickTimer(INITIAL_TIMER);
    return { savedSeconds, topicTitle };
  }, [quickTimer, recordStudySession]);

  const value = useMemo<GlobalUxContextValue>(
    () => ({
      largeFont,
      toggleLargeFont,
      isSpotlightOpen,
      openSpotlight,
      closeSpotlight,
      openConceptTrail,
      recentConceptIds,
      quickTimer,
      startQuickTimer,
      toggleQuickTimerPause,
      stopAndSaveQuickTimer,
    }),
    [
      largeFont,
      toggleLargeFont,
      isSpotlightOpen,
      openSpotlight,
      closeSpotlight,
      openConceptTrail,
      recentConceptIds,
      quickTimer,
      startQuickTimer,
      toggleQuickTimerPause,
      stopAndSaveQuickTimer,
    ]
  );

  return (
    <GlobalUxContext.Provider value={value}>
      {children}

      {/* 전역 1초 Spotlight 개념·대조축 검색 모달 */}
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

      {/* 전역 꼬리물기 드릴다운 드로어 (Spotlight에서 선택한 개념 즉시 탐색) */}
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
