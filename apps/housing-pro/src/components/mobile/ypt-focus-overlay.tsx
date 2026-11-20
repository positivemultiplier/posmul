"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  AudioWaveform,
  BookMarked,
  BookOpen,
  Calculator,
  Camera,
  CheckCircle2,
  Clock,
  EyeOff,
  Flame,
  Hourglass,
  LayoutGrid,
  Music,
  Paintbrush,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Sun,
  Table2,
  Timer,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { REAL_2026_EXAM_OX_CARDS } from "@/data/mock-exam-options";
import {
  TIMER_THEME_PRESETS,
  type TimerThemeId,
} from "@/data/study-timer-tools";
import type { StudySubjectNode, TimetableSlotEntry } from "@/data/study-textbooks";
import { StudyAmbientAudioEngine, type AmbientSoundTrack } from "@/lib/study-ambient-audio";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import {
  TimerToolModal,
  type ActiveTimerToolId,
  type MainTimeDisplayMode,
} from "@/components/mobile/timer-tool-panels";

interface YptFocusOverlayProps {
  isOpen: boolean;
  subjectTitle: string;
  subjectColor: string;
  coneEmoji: string;
  coneLevel: number;
  coneName?: string;
  dDayLabel?: string;
  subjectElapsedBaseSeconds?: number;
  todayTotalBaseSeconds?: number;
  myNickname?: string;
  subjects?: StudySubjectNode[];
  todaySlots?: Record<string, TimetableSlotEntry>;
  onSwitchTopic?: (topicId: string) => void;
  onConfirmValidTime: (
    elapsedSeconds: number,
    completionMode?: "done" | "partial",
    startedAtMs?: number
  ) => void;
  onCancel: () => void;
}

function formatColonTime(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function YptFocusOverlay({
  isOpen,
  subjectTitle,
  subjectColor,
  coneEmoji,
  coneLevel,
  coneName = "불꽃 열공 부엉이",
  dDayLabel = "D-Day",
  subjectElapsedBaseSeconds = 0,
  todayTotalBaseSeconds = 0,
  myNickname = "posmul",
  subjects = [],
  todaySlots = {},
  onSwitchTopic,
  onConfirmValidTime,
  onCancel,
}: YptFocusOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 개인 집중 타이머(기본 · 모바일 가독성 최우선) <-> 스터디그룹 열공방 전환
  const [displayMode, setDisplayMode] = useState<"focus" | "group">("focus");

  // 레퍼런스 1: 우상단 ⊞ 플로팅 기능 메뉴 & 하위 도구 모달
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTimerToolId>(null);

  // 타이머 설정: 스톱워치 vs 뽀모도로, 테마, 메인 시간 기준, 프라이버시, 화면 켜짐
  const [timerStyle, setTimerStyle] = useState<"stopwatch" | "pomodoro">("stopwatch");
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(25);
  const [themeId, setThemeId] = useState<TimerThemeId>("posmul-coral");
  const [mainTimeMode, setMainTimeMode] = useState<MainTimeDisplayMode>("session");
  const [hideOthers, setHideOthers] = useState<boolean>(false);
  const [keepScreenOn, setKeepScreenOn] = useState<boolean>(false);
  const [wakeLockSupported, setWakeLockSupported] = useState<boolean>(false);

  // 백색소음 / 집중 음악
  const [ambientTrack, setAmbientTrack] = useState<AmbientSoundTrack>("none");
  const [ambientVolume, setAmbientVolume] = useState<number>(0.55);
  const audioEngineRef = useRef<StudyAmbientAudioEngine | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  // 유효시간 확정 O/X 모달 상태
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [completionMode, setCompletionMode] = useState<"done" | "partial">("done");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const activeTheme =
    TIMER_THEME_PRESETS.find((t) => t.id === themeId) || TIMER_THEME_PRESETS[0];

  // 저장된 테마 복원 & WakeLock 지원 확인
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("housing_pro_timer_theme") as TimerThemeId | null;
    if (savedTheme && TIMER_THEME_PRESETS.some((t) => t.id === savedTheme)) {
      setThemeId(savedTheme);
    }
    setWakeLockSupported("wakeLock" in navigator);
  }, []);

  // WakeLock 관리 (항상 화면 켜짐)
  useEffect(() => {
    if (!isOpen || !keepScreenOn) {
      if (wakeLockRef.current) {
        void wakeLockRef.current.release().catch(() => undefined);
        wakeLockRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const nav = navigator as unknown as {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (nav.wakeLock) {
      void nav.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) {
            void sentinel.release().catch(() => undefined);
          } else {
            wakeLockRef.current = sentinel;
          }
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        void wakeLockRef.current.release().catch(() => undefined);
        wakeLockRef.current = null;
      }
    };
  }, [isOpen, keepScreenOn]);

  // 오디오 엔진 정리
  useEffect(() => {
    if (!isOpen && audioEngineRef.current) {
      audioEngineRef.current.stop();
      setAmbientTrack("none");
    }
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, [isOpen]);

  // 1초 타이머 구동 (일시정지·종료인증 모달 열렸을 때는 정지)
  useEffect(() => {
    if (!isOpen || isPaused || showVerifyModal) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaused, showVerifyModal]);

  // 열릴 때 세션 초기화 (모바일 집중 타이머를 기본으로 먼저 표시, 상단 토글로 그룹 열공방 1탭 전환)
  useEffect(() => {
    if (isOpen) {
      startedAtRef.current = Date.now();
      setDisplayMode("focus");
      setElapsedSeconds(0);
      setIsPaused(false);
      setIsMenuOpen(false);
      setActiveTool(null);
      setShowVerifyModal(false);
      setCompletionMode("done");
      setQuizIndex(0);
      setQuizCorrectCount(0);
      setQuizFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeAmbient = (track: AmbientSoundTrack, nextVol?: number) => {
    const vol = nextVol ?? ambientVolume;
    setAmbientVolume(vol);
    setAmbientTrack(track);
    if (!audioEngineRef.current) {
      audioEngineRef.current = new StudyAmbientAudioEngine();
    }
    if (track === "none") {
      audioEngineRef.current.stop();
    } else {
      audioEngineRef.current.play(track, vol);
    }
  };

  const handleChangeTheme = (id: TimerThemeId) => {
    setThemeId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("housing_pro_timer_theme", id);
    }
  };

  // 표시 시간 계산
  const subjectTotalLive = subjectElapsedBaseSeconds + elapsedSeconds;
  const todayTotalLive = todayTotalBaseSeconds + elapsedSeconds;

  const pomodoroTargetSec = pomodoroMinutes * 60;
  const pomodoroRemainSec = Math.max(0, pomodoroTargetSec - elapsedSeconds);

  const mainClockText =
    timerStyle === "pomodoro"
      ? formatColonTime(pomodoroRemainSec)
      : mainTimeMode === "todayTotal"
        ? formatColonTime(todayTotalLive)
        : mainTimeMode === "subjectToday"
          ? formatColonTime(subjectTotalLive)
          : formatColonTime(elapsedSeconds);

  const mainClockLabel =
    timerStyle === "pomodoro"
      ? `뽀모도로 ${pomodoroMinutes}분 집중`
      : mainTimeMode === "todayTotal"
        ? "오늘 총 집중"
        : mainTimeMode === "subjectToday"
          ? "과목 누적 집중"
          : isPaused
            ? "일시정지됨"
            : "현재 집중";

  const quickCards = REAL_2026_EXAM_OX_CARDS.slice(0, 3);
  const currentQuizCard = quickCards[quizIndex];

  const handleQuickQuizAnswer = (choice: boolean) => {
    if (!currentQuizCard || quizFeedback) return;
    const isRight = choice === currentQuizCard.isCorrectStatement;
    const nextCorrect = isRight ? quizCorrectCount + 1 : quizCorrectCount;

    if (isRight) {
      setQuizCorrectCount(nextCorrect);
      setQuizFeedback("✅ 정답! 핵심 함정을 정확히 파악했습니다.");
    } else {
      setQuizFeedback(`💡 ${currentQuizCard.trapCorrection}`);
    }

    setTimeout(() => {
      setQuizFeedback(null);
      if (quizIndex + 1 >= quickCards.length) {
        onConfirmValidTime(
          Math.max(elapsedSeconds, 60),
          completionMode,
          startedAtRef.current
        );
      } else {
        setQuizIndex((prev) => prev + 1);
      }
    }, 900);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] h-[100dvh] w-full ${activeTheme.bgClass} text-white flex flex-col justify-between overflow-hidden pt-safe pb-safe transition-colors duration-300`}
    >
      {/* 모바일 최적화 상단 바 (세그먼트 전환 · 도구 메뉴 · 취소) */}
      <header className="w-full max-w-[460px] mx-auto px-3.5 pt-2.5 pb-2 flex items-center justify-between gap-2 relative z-30 shrink-0 border-b border-white/[0.06]">
        {/* 좌측: 집중 타이머 / 그룹 열공방 1탭 전환 세그먼트 */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-white/[0.06] border border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode("focus")}
            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
              displayMode === "focus"
                ? "bg-[#FF5A36] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Timer className="w-3.5 h-3.5 shrink-0" />
            <span>집중</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("group")}
            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
              displayMode === "group"
                ? "bg-[#FF5A36] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            <span>열공방</span>
          </button>
        </div>

        {/* 중앙 상태 뱃지 (D-Day / 사운드) */}
        <div className="flex items-center gap-1.5 min-w-0 justify-center">
          <span className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-[11px] font-mono font-black text-slate-200 shrink-0">
            {dDayLabel}
          </span>
          {ambientTrack !== "none" && (
            <button
              type="button"
              onClick={() => setActiveTool("sound")}
              className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
              style={{
                borderColor: `${activeTheme.accentHex}66`,
                backgroundColor: `${activeTheme.accentHex}22`,
                color: activeTheme.accentHex,
              }}
              aria-label="배경 사운드 설정"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 우측 컨트롤: 기능메뉴(⊞) · 닫기(취소) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
              isMenuOpen
                ? "bg-[#FF5A36] text-white"
                : "bg-white/[0.06] text-slate-200 hover:text-white hover:bg-white/[0.12]"
            }`}
            title="기능 · 설정 메뉴 열기"
            aria-label="타이머 도구 메뉴"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] px-2.5 rounded-xl bg-white/[0.05] text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.1] transition"
            title="저장하지 않고 닫기"
          >
            취소
          </button>
        </div>

        {/* ========================================================== */}
        {/* 모바일 안전 팝오버: 우상단 기능/부가기능/설정 메뉴          */}
        {/* ========================================================== */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-3 top-14 z-50 w-[min(310px,calc(100vw-24px))] max-h-[72dvh] overflow-y-auto rounded-3xl bg-[#1C1C24]/98 backdrop-blur-xl border border-white/[0.14] p-4 shadow-2xl space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 주요기능 컬럼 */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 px-1">
                    주요기능
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("timeline");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                    <span>타임라인</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("dictionary");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <BookMarked className="w-3.5 h-3.5 text-[#FF7A59]" />
                    <span>법령사전</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerStyle("pomodoro");
                      setIsMenuOpen(false);
                      setActiveTool("theme");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <Hourglass className="w-3.5 h-3.5 text-amber-300" />
                    <span>타이머(뽀모)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerStyle("stopwatch");
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <Timer className="w-3.5 h-3.5 text-emerald-300" />
                    <span>스톱워치</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("calculator");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <Calculator className="w-3.5 h-3.5 text-sky-300" />
                    <span>계산기</span>
                  </button>
                </div>

                {/* 부가기능 컬럼 */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 px-1">
                    부가기능
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("books");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-300" />
                    <span>교재·단원</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("schedule");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                  >
                    <Table2 className="w-3.5 h-3.5 text-slate-300" />
                    <span>시간표</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleChangeAmbient(
                        ambientTrack === "lofi" ? "none" : "lofi",
                        ambientVolume
                      );
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between font-bold text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-pink-300" />
                      <span>집중 음악</span>
                    </span>
                    {ambientTrack === "lofi" && (
                      <span className="text-[9px] text-[#FF7A59]">ON</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTool("sound");
                    }}
                    className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between font-bold text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <AudioWaveform className="w-3.5 h-3.5 text-emerald-300" />
                      <span>백색소음</span>
                    </span>
                    {ambientTrack !== "none" && ambientTrack !== "lofi" && (
                      <span className="text-[9px] text-emerald-400">ON</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/[0.08] pt-2.5 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 px-1 mb-1">
                  설정
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTool("theme");
                  }}
                  className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                >
                  <Paintbrush className="w-3.5 h-3.5 text-amber-300" />
                  <span>테마</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKeepScreenOn((prev) => !prev)}
                  className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between font-bold text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Sun
                      className={`w-3.5 h-3.5 ${
                        keepScreenOn ? "text-amber-300" : "text-slate-400"
                      }`}
                    />
                    <span className={wakeLockSupported ? "text-white" : "text-slate-400"}>
                      항상 화면 켜짐
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      keepScreenOn ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {keepScreenOn ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHideOthers((prev) => !prev)}
                  className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between font-bold text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <EyeOff
                      className={`w-3.5 h-3.5 ${
                        hideOthers ? "text-[#FF7A59]" : "text-slate-400"
                      }`}
                    />
                    <span>다른 사람 가리기</span>
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      hideOthers ? "text-[#FF7A59]" : "text-slate-500"
                    }`}
                  >
                    {hideOthers ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setActiveTool("theme");
                  }}
                  className="w-full px-2 py-1.5 rounded-xl hover:bg-white/[0.08] flex items-center gap-2 font-bold text-white transition"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-300" />
                  <span>메인 시간 설정</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ========================================================== */}
      {/* 본문 1: 단독 전체 집중 화면 (모바일 360~460px 최적화)       */}
      {/* ========================================================== */}
      {displayMode === "focus" ? (
        <main className="flex-1 w-full max-w-[460px] mx-auto px-4 py-3 flex flex-col justify-between overflow-y-auto">
          <div className="my-auto w-full flex flex-col items-center text-center space-y-5 py-2">
            {/* 현재 공부 중인 과목·단원 칩 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] max-w-full">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: subjectColor }}
              />
              <span className="text-xs font-black text-white truncate">{subjectTitle}</span>
            </div>

            {/* 상단 메인 숫자 */}
            <div className="space-y-2 w-full">
              <div className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
                {!isPaused && (
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: activeTheme.accentHex }}
                  />
                )}
                <span>{mainClockLabel}</span>
              </div>

              <div className="font-mono text-[clamp(2.75rem,13vw,3.85rem)] leading-none font-black tracking-tight text-white tabular-nums">
                {mainClockText}
              </div>

              {/* 과목 누적 vs 오늘 누적 2열 서브 카운터 */}
              <div className="grid grid-cols-2 gap-3 pt-3 max-w-[320px] mx-auto">
                <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-0.5 min-w-0">
                  <div className="text-[11px] font-bold text-slate-400 truncate">
                    과목 누적
                  </div>
                  <div className="font-mono text-sm font-black text-slate-100 tabular-nums">
                    {formatColonTime(subjectTotalLive)}
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-0.5 min-w-0">
                  <div className="text-[11px] font-bold text-slate-400">오늘 총합</div>
                  <div className="font-mono text-sm font-black text-slate-100 tabular-nums">
                    {formatColonTime(todayTotalLive)}
                  </div>
                </div>
              </div>
            </div>

            {/* 중앙 Housing-Pro 시그니처 스터디콘 캐릭터 */}
            <div className="pt-1 flex flex-col items-center space-y-2">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-5xl sm:text-6xl border-2 transition-all ${
                    isPaused ? "opacity-55 grayscale" : "animate-pulse"
                  }`}
                  style={{
                    borderColor: isPaused ? "#334155" : activeTheme.accentHex,
                    background: `radial-gradient(circle, ${activeTheme.accentHex}24 0%, transparent 72%)`,
                    boxShadow: isPaused
                      ? "none"
                      : `0 0 42px ${activeTheme.accentHex}38`,
                  }}
                >
                  {coneEmoji}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-200">
                  <Flame
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: activeTheme.accentHex }}
                  />
                  <span>
                    Lv.{coneLevel} {coneName}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 px-2">
                종료 시 AI 스캔 또는 3초 O/X로 유효 집중시간이 기록됩니다
              </p>
            </div>
          </div>

          {/* 하단 엄지 존 액션 컨트롤 (최소 46px 터치 타겟) */}
          <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-3 pb-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="min-h-[48px] px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95"
              style={{
                backgroundColor: `${activeTheme.accentHex}25`,
                borderColor: `${activeTheme.accentHex}70`,
                color: "#FFFFFF",
              }}
            >
              <Square className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>공부 종료</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="w-16 h-16 rounded-full bg-white text-[#0A0A0D] hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xl transition shrink-0"
              title={isPaused ? "공부 재개" : "잠시 일시정지"}
              aria-label={isPaused ? "공부 재개" : "일시정지"}
            >
              {isPaused ? (
                <Play className="w-7 h-7 fill-current ml-0.5" />
              ) : (
                <Pause className="w-7 h-7 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTool("dictionary")}
              className="min-h-[48px] px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-black text-slate-100 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <BookMarked className="w-4 h-4 text-amber-300 shrink-0" />
              <span>법령사전</span>
            </button>
          </div>
        </main>
      ) : (
        /* ========================================================== */
        /* 본문 2: 그룹 열공방 모드 (모바일 2단 컴팩트 카드 + 3열 그리드) */
        /* ========================================================== */
        <main className="flex-1 w-full max-w-[460px] mx-auto px-3.5 pt-2.5 pb-4 overflow-y-auto space-y-3">
          {/* 상단 현재 집중 모바일 2단 카드 (360px에서도 겹침 0px!) */}
          <section
            className={`p-3.5 rounded-2xl ${activeTheme.cardBgClass} border border-white/[0.1] space-y-3`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: subjectColor }}
                  />
                  <span className="truncate">{subjectTitle}</span>
                </div>
                <div className="font-mono text-3xl font-black text-white tabular-nums tracking-tight leading-none pt-0.5">
                  {mainClockText}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-white/[0.04] px-2.5 py-1.5 rounded-xl border border-white/[0.08]">
                <span className="text-2xl leading-none">{coneEmoji}</span>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold">오늘 총합</div>
                  <div
                    className="font-mono text-xs font-black tabular-nums"
                    style={{ color: activeTheme.accentHex }}
                  >
                    {formatColonTime(todayTotalLive)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="min-h-[42px] rounded-xl bg-white text-[#0A0A0D] font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>공부 재개</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>일시정지</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowVerifyModal(true)}
                className="min-h-[42px] rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 active:scale-95 transition"
                style={{ backgroundColor: activeTheme.accentHex }}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>종료 · 인증</span>
              </button>
            </div>
          </section>

          {/* 3열(모바일)/4열 책상 열공 그리드 + 좌우 스와이프 + 출석부 + 랭킹 + 그룹개설/가입 + 채팅 */}
          <YptGroupGrid
            myStudySeconds={todayTotalLive}
            myConeEmoji={coneEmoji}
            myNickname={myNickname}
            currentSubjectLabel={subjectTitle}
            isMeStudying={!isPaused}
            hideOthers={hideOthers}
            accentHex={activeTheme.accentHex}
            isTimerRunning={!isPaused}
          />
        </main>
      )}

      {/* 우상단 ⊞ 메뉴에서 여는 인-타이머 도구 모달 */}
      <TimerToolModal
        activeTool={activeTool}
        onClose={() => setActiveTool(null)}
        subjects={subjects}
        currentSubjectTitle={subjectTitle}
        todaySlots={todaySlots}
        onSwitchTopic={onSwitchTopic}
        ambientTrack={ambientTrack}
        ambientVolume={ambientVolume}
        onChangeAmbient={handleChangeAmbient}
        themeId={themeId}
        onChangeTheme={handleChangeTheme}
        mainTimeMode={mainTimeMode}
        onChangeMainTimeMode={setMainTimeMode}
        timerStyle={timerStyle}
        pomodoroMinutes={pomodoroMinutes}
        onChangeTimerStyle={(style, mins) => {
          setTimerStyle(style);
          if (mins) setPomodoroMinutes(mins);
        }}
      />

      {/* 🛡️ 공회전 어뷰징 방지: 유효시간 확정 모달 */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-[420px] max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#18181E] border border-[#FF5A36]/40 p-5 pb-safe space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
                  <ShieldCheck className="w-3 h-3" />
                  <span>공회전 어뷰징 차단 인증</span>
                </span>
                <h3 className="text-base font-black text-white">
                  유효 집중 시간 인증하기
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              방금 공부한 <strong className="text-white">{subjectTitle}</strong>{" "}
              (<strong className="text-[#FF8A6B] font-mono">{formatColonTime(elapsedSeconds)}</strong>)의
              종이책을 AI 스캔(+40 PMP)하거나, <strong>3초 컷 O/X 3문제</strong>를 풀어 유효 공부 시간으로 확정하세요!
            </p>

            {/* 단원 완주 vs 진행중(내일 이어하기 이월) 선택 */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold text-slate-400">
                오늘 이 단원 진행 상태
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCompletionMode("done")}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-black transition ${
                    completionMode === "done"
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                      : "bg-[#121216] border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  단원 완료 (1R 완주)
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionMode("partial")}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-black transition ${
                    completionMode === "partial"
                      ? "bg-amber-500/20 border-amber-400 text-amber-200"
                      : "bg-[#121216] border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  진행중 (내일 이어하기)
                </button>
              </div>
            </div>

            {/* 즉석 3문항 퀴즈 카드 */}
            {currentQuizCard && (
              <div className="p-3.5 rounded-xl bg-[#121216] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#FF7A59]">
                    즉석 검증 퀴즈 ({quizIndex + 1} / {quickCards.length})
                  </span>
                  <span className="text-slate-400 font-mono">
                    {currentQuizCard.questionNumber}번 선지
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-relaxed">
                  &quot;{currentQuizCard.statement}&quot;
                </p>

                {quizFeedback ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                    {quizFeedback}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickQuizAnswer(false)}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-black text-xs flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>틀림 (X)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuizAnswer(true)}
                      className="py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>맞음 (O)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 외부 인증 바로가기 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/scan"
                className="py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>AI 스캔 (+40 PMP)</span>
              </Link>
              <Link
                href="/study/ox"
                className="py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>전체 O/X 덱</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
