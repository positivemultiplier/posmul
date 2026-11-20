"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Target,
  CheckCircle2,
  Circle,
  Zap,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Brain,
  TableProperties,
  ListChecks,
  CalendarPlus,
  ArrowRight,
  Camera,
  CheckSquare,
  GitCompareArrows,
  Plus,
  Sparkles,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptFocusOverlay } from "@/components/mobile/ypt-focus-overlay";
import { StudyConeStoreModal } from "@/components/study/study-cone-store-modal";
import { UserStudyConeItem, STUDY_CONE_CATALOG } from "@/data/mock-study-cones";
import { getUserStudyConesAction } from "@/app/actions/study-cone.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { fetchWeakOptionCountAction } from "@/app/actions/exam-study.actions";
import { computeForgettingCurveReminders } from "@/lib/forgetting-curve";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import {
  addDaysISO,
  diffDaysISO,
  findTopicMetaInSubjects,
  flattenTopics,
  getTimetableSlotActual,
  isOvernightExtensionHour,
  type MatrixCellStatus,
  type StudySubjectNode,
  type StudyTopicNode,
} from "@/data/study-textbooks";
import { getSavedPersonaMode, setSavedPersonaMode } from "@/lib/pro-workspace-store";

function formatHHMMSS(totalSec: number, spaced = false): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const parts = [h, m, s].map((v) => String(v).padStart(2, "0"));
  return spaced ? parts.join(" : ") : parts.join(":");
}

export default function HousingProStudentTimerPage() {
  const router = useRouter();
  const {
    isLoggedIn,
    profile,
    effectiveOwnerKey,
    pmpBalance,
    setLocalPmpBalance,
    adjustLocalPmpBalance,
  } = useStudyAuth();
  const {
    todayISO,
    examDate,
    activeBook,
    activeBooks,
    subjects,
    matrixLogs,
    timetablesByDate,
    todos,
    toggleTodo,
    addTodo,
    upsertMatrixCell,
    recordStudySession,
  } = useStudyCurriculum();

  const [timerPlanScope, setTimerPlanScope] = useState<"today" | "all">("today");
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const [quickStartTopicId, setQuickStartTopicId] = useState<string>("");
  const [quickTodoTitle, setQuickTodoTitle] = useState<string>("");
  const [weakOxCount, setWeakOxCount] = useState<number>(0);
  // 자정(00:00) ~ 04:59 새벽 연장 학습 구간 표시 여부 (SSR hydration 안전하게 마운트 후 체크)
  const [isOvernightWindow, setIsOvernightWindow] = useState<boolean>(false);

  useEffect(() => {
    const syncOvernight = () => {
      setIsOvernightWindow(isOvernightExtensionHour(new Date()));
    };
    syncOvernight();
    const id = globalThis.setInterval(syncOvernight, 60_000);
    return () => globalThis.clearInterval(id);
  }, []);

  // 보유 PMP (로그인 시 PosMul 원장 연동, 게스트 시 0)
  const [guestPmpBalance, setGuestPmpBalance] = useState<number>(0);
  const effectivePmpBalance = isLoggedIn ? pmpBalance : guestPmpBalance;

  // 스터디콘 상태
  const [equippedCone, setEquippedCone] = useState<UserStudyConeItem>({
    id: "cone-default-fire-owl",
    coneType: "FIRE_OWL",
    currentLevel: 2,
    totalFocusMinutes: 105,
    isEquipped: true,
    purchasedPriceKrw: 0,
    unlockedAt: "2026-11-01",
  });
  const [isConeModalOpen, setIsConeModalOpen] = useState(false);

  // 목차별 오늘 추가 집중 시간 (초) & 포커스 상태
  const [sessionExtraSeconds, setSessionExtraSeconds] = useState<Record<string, number>>({});
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null);
  const [lastCompletedTopic, setLastCompletedTopic] = useState<{
    title: string;
    chapterCode?: string;
    elapsedSeconds: number;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const allTopics = useMemo(() => flattenTopics(subjects), [subjects]);

  useEffect(() => {
    if (allTopics.length > 0 && !quickStartTopicId) {
      setQuickStartTopicId(allTopics[0].topic.id);
    }
  }, [allTopics, quickStartTopicId]);

  // 플래너 목차 매트릭스에서 '학습계획(plan)' 또는 '진행중(partial)' 단원 추출
  const plannedSubjects = useMemo(() => {
    const result: Array<{
      subject: StudySubjectNode;
      topicList: Array<{
        unitTitle: string;
        topic: StudyTopicNode;
        planEntries: Array<{
          dateISO: string;
          status: MatrixCellStatus;
          keyword: string;
          minutes?: number;
        }>;
      }>;
    }> = [];

    for (const subject of subjects) {
      const topicList: Array<{
        unitTitle: string;
        topic: StudyTopicNode;
        planEntries: Array<{
          dateISO: string;
          status: MatrixCellStatus;
          keyword: string;
          minutes?: number;
        }>;
      }> = [];

      for (const unit of subject.units) {
        for (const topic of unit.topics) {
          const prefix = `${topic.id}::`;
          const planEntries: Array<{
            dateISO: string;
            status: MatrixCellStatus;
            keyword: string;
            minutes?: number;
          }> = [];

          for (const [key, cell] of Object.entries(matrixLogs)) {
            if (
              key.startsWith(prefix) &&
              (cell.status === "plan" || cell.status === "partial")
            ) {
              planEntries.push({
                dateISO: key.slice(prefix.length),
                status: cell.status,
                keyword: cell.keyword,
                minutes: cell.minutes,
              });
            }
          }

          if (planEntries.length > 0) {
            planEntries.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
            topicList.push({ unitTitle: unit.title, topic, planEntries });
          }
        }
      }

      if (topicList.length > 0) {
        result.push({ subject, topicList });
      }
    }

    return result;
  }, [subjects, matrixLogs]);

  const totalPlannedTopics = useMemo(
    () => plannedSubjects.reduce((acc, s) => acc + s.topicList.length, 0),
    [plannedSubjects]
  );

  // 오늘(todayISO) 기준 학습계획 단원 필터링
  const todayPlannedSubjects = useMemo(() => {
    return plannedSubjects
      .map((item) => ({
        subject: item.subject,
        topicList: item.topicList.filter((t) =>
          t.planEntries.some((p) => p.dateISO === todayISO)
        ),
      }))
      .filter((item) => item.topicList.length > 0);
  }, [plannedSubjects, todayISO]);

  const totalTodayPlannedTopics = useMemo(
    () => todayPlannedSubjects.reduce((acc, s) => acc + s.topicList.length, 0),
    [todayPlannedSubjects]
  );

  // 오늘 계획된 총 예상 시간(초) — 파워 J 계획 대비 실행률 계산용
  const todayPlannedSeconds = useMemo(() => {
    let mins = 0;
    for (const s of todayPlannedSubjects) {
      for (const item of s.topicList) {
        const entry = item.planEntries.find((p) => p.dateISO === todayISO);
        mins += entry?.minutes ?? item.topic.estimatedMinutes;
      }
    }
    return mins * 60;
  }, [todayPlannedSubjects, todayISO]);

  const visibleTimerSubjects =
    timerPlanScope === "today" ? todayPlannedSubjects : plannedSubjects;

  useEffect(() => {
    if (visibleTimerSubjects.length > 0 && expandedSubjectIds.length === 0) {
      setExpandedSubjectIds(visibleTimerSubjects.map((p) => p.subject.id));
    }
  }, [visibleTimerSubjects, expandedSubjectIds.length]);

  // 초기 마운트: ?mode=pro 또는 ?topic= 처리 및 스터디콘 조회
  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      if (params.get("mode") === "pro") {
        setSavedPersonaMode("pro");
        router.replace("/pro");
        return;
      }
      if (!params.get("topic") && getSavedPersonaMode() === "pro") {
        router.replace("/pro");
        return;
      }
      const topicParam = params.get("topic");
      if (topicParam) {
        const found = findTopicMetaInSubjects(subjects, topicParam);
        if (found) {
          setExpandedSubjectIds((prev) =>
            prev.includes(found.subject.id) ? prev : [...prev, found.subject.id]
          );
          setFocusTopicId(topicParam);
        }
      }
    }

    void getUserStudyConesAction().then((res) => {
      if (res.equippedCone) {
        setEquippedCone(res.equippedCone);
      }
    });
  }, [router, subjects, profile.userId]);

  // 틀린 지문(약점 O/X) 대기 건수 초경량 조회
  useEffect(() => {
    if (!effectiveOwnerKey) return;
    void fetchWeakOptionCountAction(effectiveOwnerKey).then((cnt) => setWeakOxCount(cnt));
  }, [effectiveOwnerKey]);

  // 7단계 User Journey: 에빙하우스 망각곡선(1·3·7·14·30일) 자동 리마인드 산출
  const forgettingSummary = useMemo(
    () =>
      computeForgettingCurveReminders({
        todayISO,
        subjects,
        matrixLogs,
        maxItems: 4,
      }),
    [todayISO, subjects, matrixLogs]
  );

  const handleAddRemindToTodayPlan = (topicId: string, keyword: string, minutes: number) => {
    upsertMatrixCell(topicId, todayISO, {
      status: "plan",
      keyword: `망각복습·${keyword}`,
      minutes,
    });
    setToastMsg("🧠 망각곡선 복습 단원을 오늘 계획에 바로 추가했습니다!");
    globalThis.setTimeout(() => setToastMsg(null), 3500);
  };

  const subjectSecondsMap = useMemo(() => {
    const todaySlots = timetablesByDate[todayISO] || {};
    const actualSlotMinByTopic = new Map<string, number>();
    for (const slot of Object.values(todaySlots)) {
      const actual = getTimetableSlotActual(slot);
      if (actual?.topicId) {
        actualSlotMinByTopic.set(
          actual.topicId,
          (actualSlotMinByTopic.get(actual.topicId) ?? 0) + 10
        );
      }
    }

    const map: Record<string, number> = {};
    for (const subj of subjects) {
      let totalSec = 0;
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          const todayLog = matrixLogs[makeMatrixKey(topic.id, todayISO)];
          const slotMinutes = actualSlotMinByTopic.get(topic.id) ?? 0;
          let recordedMinutes = 0;

          if (todayLog?.actualMinutes !== undefined) {
            recordedMinutes = todayLog.actualMinutes;
          } else if (
            todayLog &&
            (todayLog.status === "done" || todayLog.status === "partial") &&
            todayLog.minutes
          ) {
            recordedMinutes = todayLog.minutes;
          }

          const effectiveMinutes = Math.max(recordedMinutes, slotMinutes);
          if (effectiveMinutes > 0) {
            totalSec += effectiveMinutes * 60;
          } else {
            totalSec += sessionExtraSeconds[topic.id] || 0;
          }
        }
      }
      map[subj.id] = totalSec;
    }
    return map;
  }, [subjects, matrixLogs, timetablesByDate, todayISO, sessionExtraSeconds]);

  // 실제 오늘 순공시간 (가짜 02:00:00 제거 — 0초면 00:00:00 정직 표시)
  const totalStudySeconds = useMemo(
    () => Object.values(subjectSecondsMap).reduce((acc, s) => acc + s, 0),
    [subjectSecondsMap]
  );

  const targetSeconds = todayPlannedSeconds > 0 ? todayPlannedSeconds : 14400; // 오늘 계획 합계 우선, 없으면 4시간 기준
  const goalPct =
    targetSeconds > 0 ? Math.min(100, Math.round((totalStudySeconds / targetSeconds) * 100)) : 0;
  const dDayToExam = useMemo(() => diffDaysISO(todayISO, examDate), [todayISO, examDate]);

  const currentConeSpec =
    STUDY_CONE_CATALOG.find((s) => s.coneType === equippedCone.coneType) ||
    STUDY_CONE_CATALOG[0];

  const activeFocusMeta = useMemo(
    () => (focusTopicId ? findTopicMetaInSubjects(subjects, focusTopicId) : null),
    [focusTopicId, subjects]
  );

  const toggleExpandSubject = (subjectId: string) => {
    setExpandedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleConfirmValidFocusTime = (
    elapsedSeconds: number,
    completionMode: "done" | "partial" = "done",
    startedAtMs?: number
  ) => {
    if (!focusTopicId) return;
    const completedMeta = findTopicMetaInSubjects(subjects, focusTopicId);
    setSessionExtraSeconds((prev) => ({
      ...prev,
      [focusTopicId]: (prev[focusTopicId] || 0) + elapsedSeconds,
    }));
    recordStudySession(focusTopicId, elapsedSeconds, undefined, completionMode, startedAtMs);

    if (completedMeta) {
      setLastCompletedTopic({
        title: completedMeta.topic.title,
        chapterCode: completedMeta.topic.chapterCode,
        elapsedSeconds,
      });
    }

    if (isLoggedIn) {
      void grantAppStudyPmpAction({ kind: "FOCUS" }).then((rewardRes) => {
        if (rewardRes.success && rewardRes.authenticated) {
          if (typeof rewardRes.newBalance === "number") {
            setLocalPmpBalance(rewardRes.newBalance);
          } else {
            adjustLocalPmpBalance(rewardRes.earnedPmp);
          }
        }
      });
      setToastMsg(
        completionMode === "partial"
          ? "부분학습 저장 완료! 내일 플래너로 자동 이월되었습니다 (+10 PMP)"
          : "집중 완료! 회독 매트릭스·시간표에 자동 반영되었습니다 (+10 PMP)"
      );
    } else {
      setGuestPmpBalance((prev) => prev + 10);
      setToastMsg(
        completionMode === "partial"
          ? "부분학습이 저장되고 내일 이어하기로 이월되었습니다."
          : "집중 완료! 로그인 시 PosMul 지갑과 모든 기기에 영구 저장됩니다."
      );
    }
    setFocusTopicId(null);
    globalThis.setTimeout(() => setToastMsg(null), 4500);
  };

  const handleQuickAddTodo = () => {
    if (!quickTodoTitle.trim()) return;
    const firstTopic = allTopics[0];
    addTodo({
      title: quickTodoTitle,
      subjectTitle: firstTopic ? firstTopic.subject.shortTitle : "오늘 목표",
      subjectColor: firstTopic ? firstTopic.subject.color : "#FF5A36",
      topicId: firstTopic?.topic.id,
      dueDate: todayISO,
    });
    setQuickTodoTitle("");
  };

  const incompleteTodoCount = todos.filter((t) => !t.completed).length;

  return (
    <MobileAppShell>
      {/* 슬림 컨텍스트 바 (AppBar와 중복 제거 — D-Day · 날짜 · PMP만 컴팩트 표시) */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#16161C]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 bg-[#FF5A36]/20 text-[#FF7A59] border border-[#FF5A36]/40">
            {dDayToExam >= 0 ? `D-${dDayToExam} 제29회` : `D+${Math.abs(dDayToExam)}`}
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-300 truncate">
            {todayISO}
          </span>
          {isOvernightWindow && (
            <span
              className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/35 text-[9.5px] font-bold text-indigo-200 shrink-0"
              title="05:00 리셋 전까지는 어제 시작된 학습일(24h)로 계속 합산됩니다."
            >
              새벽연장 · 05시 리셋
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/study/more?tab=wallet"
            className="px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-black text-amber-300 font-mono transition"
            title="PosMul 지갑 및 예측 마켓 보기"
          >
            {effectivePmpBalance.toLocaleString()} PMP
          </Link>
          <Link
            href="/study/more?tab=library"
            className="px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-bold text-slate-300 max-w-[130px] truncate"
            title="내 서재 관리"
          >
            {activeBooks.length > 1
              ? `${activeBook.badge} 외 ${activeBooks.length - 1}`
              : activeBook.badge}
          </Link>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 집중 세션 완료 직후 맥락형 다음 행동 브릿지 (Do → Train → PosMul) */}
      {lastCompletedTopic && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#241918] to-[#1A1A22] border border-[#FF5A36]/45 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-black text-white flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
              <span className="truncate">
                방금 끝낸 「{lastCompletedTopic.title}」 바로 복습할까요?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLastCompletedTopic(null)}
              className="text-[10px] text-slate-400 hover:text-white shrink-0"
            >
              닫기
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10.5px] font-black">
            <Link
              href={
                lastCompletedTopic.chapterCode
                  ? `/study/ox?chapter=${encodeURIComponent(lastCompletedTopic.chapterCode)}`
                  : "/study/ox"
              }
              className="py-1.5 px-2 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 text-center hover:bg-sky-500/30 transition"
            >
              ⚡ 3초 O/X
            </Link>
            <Link
              href={
                lastCompletedTopic.chapterCode
                  ? `/study/solve?chapter=${encodeURIComponent(lastCompletedTopic.chapterCode)}`
                  : "/study/solve"
              }
              className="py-1.5 px-2 rounded-xl bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF8A6B] text-center hover:bg-[#FF5A36]/30 transition"
            >
              📝 기출 20제
            </Link>
            <Link
              href={
                lastCompletedTopic.chapterCode
                  ? `/study/graph?chapter=${encodeURIComponent(lastCompletedTopic.chapterCode)}`
                  : "/study/graph"
              }
              className="py-1.5 px-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-center hover:bg-amber-500/25 transition"
            >
              🔗 지식맵
            </Link>
          </div>
        </div>
      )}

      {/* 파워 J 오늘 실행 대시보드 */}
      <div className="px-4 py-4 space-y-4">
        {/* 1. 오늘 순공시간 & 계획 대비 실행률 카드 */}
        <section className="rounded-3xl bg-gradient-to-b from-[#1D1D24] to-[#141419] border border-white/[0.08] p-5 text-center space-y-3 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-32 bg-[#FF5A36]/15 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsConeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121216] border border-[#FF5A36]/40 hover:border-[#FF5A36] transition shadow-md"
            >
              <span className="text-sm">{currentConeSpec.badgeEmoji}</span>
              <span className="text-[10.5px] font-black text-white">
                Lv.{equippedCone.currentLevel}{" "}
                <span className="text-[#FF7A59]">{currentConeSpec.name}</span>
              </span>
            </button>

            <Link
              href="/study/stats"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-bold text-slate-300"
            >
              <span>계획 대비 분석 →</span>
            </Link>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 tracking-wide">
              오늘 실제 순공시간 (플래너 · 시간표 자동 기록)
            </div>
            <div className="font-mono text-4xl sm:text-5xl font-black tracking-wider text-white tabular-nums">
              {formatHHMMSS(totalStudySeconds, true)}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-[#FF5A36]" />
                <span>
                  {todayPlannedSeconds > 0
                    ? `오늘 계획 목표 ${formatHHMMSS(todayPlannedSeconds)}`
                    : "일일 기본 목표 04:00:00"}
                </span>
              </span>
              <span className="text-[#FF7A59] font-black font-mono">{goalPct}% 달성</span>
            </div>
            <div className="h-2 rounded-full bg-[#0B0B0E] border border-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5A36] to-[#FF8008] transition-all duration-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* 1.5. 에빙하우스 망각곡선 오늘의 리마인드 (User Journey 6·7단계) */}
        <section className="p-3.5 rounded-2xl bg-[#181924] border border-violet-500/25 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-white min-w-0">
              <Brain className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="truncate">망각곡선 오늘의 리마인드</span>
              {(forgettingSummary.overdueCount > 0 || forgettingSummary.dueTodayCount > 0) && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-black shrink-0">
                  {forgettingSummary.overdueCount + forgettingSummary.dueTodayCount}건
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
              1·3·7·14·30일
            </span>
          </div>

          {/* 6단계 틀린 문제 O/X 망각 방어 배너 */}
          {weakOxCount > 0 && (
            <Link
              href="/study/ox?mode=weak"
              className="w-full p-2.5 rounded-xl bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 flex items-center justify-between gap-2 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#FF7A59] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">
                    틀린·헷갈린 지문 {weakOxCount}개 복습 대기중
                  </div>
                  <div className="text-[10.5px] text-orange-200/80 truncate">
                    지금 3초 O/X로 털어내면 약점이 정복(O)으로 승격됩니다
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FF8A70] shrink-0" />
            </Link>
          )}

          {forgettingSummary.urgentItems.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#11121A] border border-white/[0.06] text-[11.5px] text-slate-300 leading-relaxed">
              {forgettingSummary.allTrackedCount === 0 ? (
                <span>
                  오늘 첫 단원을 타이머로 완주하면, 에빙하우스 공식에 따라{" "}
                  <strong className="text-violet-300">내일(+1일) · 3일 · 7일 · 14일 · 30일</strong>{" "}
                  골든타임에 자동으로 복습 알림이 뜹니다.
                </span>
              ) : (
                <span>
                  🎉 현재 추적 중인 <strong className="text-emerald-300">{forgettingSummary.allTrackedCount}개 단원</strong> 모두 기억 안정권입니다!
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {forgettingSummary.urgentItems.map((item) => {
                const isCritical = item.urgency === "OVERDUE" || item.retentionPct <= 50;
                const barColor = isCritical
                  ? "bg-rose-500"
                  : item.urgency === "DUE_TODAY"
                    ? "bg-amber-400"
                    : "bg-sky-400";
                return (
                  <div
                    key={item.topicId}
                    className="p-3 rounded-xl bg-[#11121A] border border-white/[0.07] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                              item.urgency === "OVERDUE"
                                ? "bg-rose-500/20 text-rose-300"
                                : item.urgency === "DUE_TODAY"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-sky-500/15 text-sky-300"
                            }`}
                          >
                            {item.urgencyLabel}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {item.doneRounds}R 완료 · {item.daysSinceLast}일 경과
                          </span>
                        </div>
                        <div className="text-xs font-black text-white truncate">
                          [{item.subject.shortTitle}] {item.topic.title}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono font-black shrink-0 ${
                          isCritical ? "text-rose-300" : "text-amber-300"
                        }`}
                      >
                        기억 {item.retentionPct}%
                      </span>
                    </div>

                    {/* 기억 잔존율 미니 바 */}
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${item.retentionPct}%` }}
                      />
                    </div>

                    {/* 원클릭 복습 액션 3종 */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setFocusTopicId(item.topicId)}
                        className="min-h-[34px] px-2 rounded-lg bg-[#FF5A36]/20 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/40 text-[#FF9B82] text-[11px] font-black flex items-center justify-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>타이머</span>
                      </button>
                      <Link
                        href={
                          item.topic.chapterCode
                            ? `/study/graph?chapter=${encodeURIComponent(item.topic.chapterCode)}`
                            : "/study/graph"
                        }
                        className="min-h-[34px] px-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
                      >
                        <GitCompareArrows className="w-3 h-3" />
                        <span>지식맵</span>
                      </Link>
                      {item.alreadyPlannedToday ? (
                        <Link
                          href={
                            item.topic.chapterCode
                              ? `/study/ox?chapter=${encodeURIComponent(item.topic.chapterCode)}`
                              : "/study/ox"
                          }
                          className="min-h-[34px] px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>O/X</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRemindToTodayPlan(
                              item.topicId,
                              item.topic.defaultKeyword,
                              item.topic.estimatedMinutes
                            )
                          }
                          className="min-h-[34px] px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>오늘추가</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. 오늘 계획 목차 타이머 (파워 J 실행 큐) */}
        <section className="space-y-2.5">
          <div className="px-3 py-2 rounded-xl bg-[#1A1A21] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimerPlanScope("today")}
                className={`px-2.5 py-1 rounded-lg font-black transition ${
                  timerPlanScope === "today"
                    ? "bg-[#FF5A36] text-white"
                    : "bg-[#111116] text-slate-400 hover:text-white"
                }`}
              >
                오늘 계획 ({totalTodayPlannedTopics})
              </button>
              <button
                type="button"
                onClick={() => setTimerPlanScope("all")}
                className={`px-2.5 py-1 rounded-lg font-black transition ${
                  timerPlanScope === "all"
                    ? "bg-[#FF5A36] text-white"
                    : "bg-[#111116] text-slate-400 hover:text-white"
                }`}
              >
                전체 예정 ({totalPlannedTopics})
              </button>
            </div>
            <Link
              href="/study/planner"
              className="text-sky-300 hover:text-sky-200 font-black flex items-center gap-1 shrink-0"
            >
              <TableProperties className="w-3 h-3" />
              <span>계획 편집</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {visibleTimerSubjects.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#1A1A21] border border-dashed border-white/[0.14] space-y-3.5">
              <div className="text-center space-y-1">
                <CalendarPlus className="w-7 h-7 text-[#FF7A59] mx-auto" />
                <p className="text-xs font-black text-white">
                  {timerPlanScope === "today"
                    ? `오늘(${todayISO}) 예약된 계획 단원이 없습니다`
                    : "플래너에 예약된 학습계획이 없습니다"}
                </p>
                <p className="text-[11px] text-slate-400">
                  아래에서 단원을 골라 바로 타이머를 켜거나, 플래너에서 회독 계획을 세워 보세요.
                </p>
              </div>

              {/* 마찰 제로 퀵 스타트 바 */}
              {allTopics.length > 0 && (
                <div className="flex gap-1.5">
                  <select
                    value={quickStartTopicId}
                    onChange={(e) => setQuickStartTopicId(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-[#101015] border border-white/[0.1] text-[11px] font-bold text-slate-200"
                  >
                    {allTopics.map(({ subject, topic }) => (
                      <option key={topic.id} value={topic.id}>
                        [{subject.shortTitle}] {topic.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickStartTopicId) setFocusTopicId(quickStartTopicId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-black flex items-center gap-1 shrink-0 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>바로 시작</span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                {timerPlanScope === "today" && totalPlannedTopics > 0 && (
                  <button
                    type="button"
                    onClick={() => setTimerPlanScope("all")}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 text-[11px] font-black"
                  >
                    전체 예정 {totalPlannedTopics}개 보기
                  </button>
                )}
                <Link
                  href="/study/planner"
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 text-[11px] font-black flex items-center gap-1"
                >
                  <TableProperties className="w-3.5 h-3.5 text-[#FF7A59]" />
                  <span>회독 플래너에서 계획 잡기</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleTimerSubjects.map(({ subject, topicList }) => {
                const isExpanded = expandedSubjectIds.includes(subject.id);
                const subjSeconds = subjectSecondsMap[subject.id] || 0;

                return (
                  <div
                    key={subject.id}
                    className="rounded-2xl bg-[#1A1A21] border border-white/[0.06] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpandSubject(subject.id)}
                      className="w-full px-3.5 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-black text-white shrink-0"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.examStage}
                        </span>
                        <span className="text-xs font-black text-white truncate">
                          {subject.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          ({topicList.length})
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300 tabular-nums shrink-0">
                        {formatHHMMSS(subjSeconds)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-white/[0.05] bg-[#14141A]">
                        {topicList.map(({ unitTitle, topic, planEntries }) => {
                          const todayCell = matrixLogs[makeMatrixKey(topic.id, todayISO)];
                          const primaryPlan =
                            planEntries.find((p) => p.dateISO === todayISO) || planEntries[0];
                          const isTodayPlan = primaryPlan.dateISO === todayISO;
                          const isTomorrowPlan =
                            primaryPlan.dateISO === addDaysISO(todayISO, 1);
                          const dateBadgeLabel = isTodayPlan
                            ? "오늘 계획"
                            : isTomorrowPlan
                              ? "내일 계획"
                              : `${primaryPlan.dateISO.slice(5).replace("-", "/")} 계획`;

                          let doneRounds = 0;
                          for (const [k, v] of Object.entries(matrixLogs)) {
                            if (k.startsWith(`${topic.id}::`) && v.status === "done") {
                              doneRounds += 1;
                            }
                          }

                          return (
                            <div
                              key={topic.id}
                              className="px-3 py-2 rounded-xl bg-[#1A1A22] border border-white/[0.05] flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                      primaryPlan.status === "partial"
                                        ? "bg-amber-500/20 text-amber-300"
                                        : isTodayPlan
                                          ? "bg-[#FF5A36]/20 text-[#FF7A59]"
                                          : "bg-sky-500/15 text-sky-300"
                                    }`}
                                  >
                                    {primaryPlan.status === "partial"
                                      ? "◐ 진행중"
                                      : dateBadgeLabel}
                                  </span>
                                  <span className="text-[9.5px] font-bold text-slate-400 truncate">
                                    {unitTitle}
                                  </span>
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black"
                                    style={{
                                      backgroundColor: `${subject.color}25`,
                                      color: subject.color,
                                    }}
                                  >
                                    {doneRounds}R
                                  </span>
                                  {todayCell?.status === "done" && (
                                    <span className="text-[9px] font-black text-emerald-400">
                                      오늘완료
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11.5px] font-extrabold text-white truncate mt-0.5 flex items-center gap-1">
                                  {topic.topicNo && (
                                    <span
                                      className="font-mono text-[10.5px] font-black shrink-0"
                                      style={{ color: subject.color }}
                                    >
                                      {topic.topicNo}.
                                    </span>
                                  )}
                                  <span className="truncate">{topic.title}</span>
                                </div>
                                <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                                  {primaryPlan.keyword} ·{" "}
                                  {primaryPlan.minutes ?? topic.estimatedMinutes}분
                                  {planEntries.length > 1
                                    ? ` (외 ${planEntries.length - 1}일)`
                                    : ""}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setFocusTopicId(topic.id)}
                                className="w-8 h-8 rounded-full text-white flex items-center justify-center shadow-md hover:scale-105 transition shrink-0"
                                style={{ backgroundColor: subject.color }}
                                aria-label={`${topic.title} 집중 시작`}
                              >
                                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                              </button>
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
        </section>

        {/* 3. 오늘 할일 빠른 체크 (플래너 할일과 100% 실시간 연동) */}
        <section className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <CheckSquare className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>오늘 체크리스트</span>
              <span className="text-[10px] font-mono text-slate-400">
                남은 {incompleteTodoCount}건
              </span>
            </div>
            <Link
              href="/study/planner?view=calendar"
              className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
            >
              전체·달력 →
            </Link>
          </div>

          <div className="space-y-1.5">
            {todos.slice(0, 4).map((todo) => (
              <button
                key={todo.id}
                type="button"
                onClick={() => toggleTodo(todo.id)}
                className="w-full px-2.5 py-2 rounded-xl bg-[#121218] hover:bg-[#16161E] border border-white/[0.05] flex items-center gap-2 text-left transition"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span
                  className="px-1.5 py-0.2 rounded text-[9px] font-black text-white shrink-0"
                  style={{ backgroundColor: todo.subjectColor }}
                >
                  {todo.subjectTitle}
                </span>
                <span
                  className={`text-[11px] font-bold truncate flex-1 ${
                    todo.completed ? "line-through text-slate-500" : "text-slate-100"
                  }`}
                >
                  {todo.title}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 pt-0.5">
            <input
              type="text"
              value={quickTodoTitle}
              onChange={(e) => setQuickTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAddTodo();
              }}
              placeholder="오늘 할일 빠르게 추가..."
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-[#101015] border border-white/[0.08] text-[11px] text-white focus:outline-none focus:border-[#FF5A36]"
            />
            <button
              type="button"
              onClick={handleQuickAddTodo}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-[#FF5A36] text-white text-[11px] font-black flex items-center gap-1 transition shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>추가</span>
            </button>
          </div>
        </section>

        {/* 4. 틈새 학습 퀵 런처 (학습 탭 핵심 4종 직결) */}
        <section className="grid grid-cols-4 gap-1.5">
          <Link
            href="/study/ox?mode=weak"
            className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.07] hover:border-sky-400 flex flex-col items-center gap-1 text-center transition"
          >
            <Zap className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-black text-white">약점 O/X</span>
          </Link>
          <Link
            href="/study/solve"
            className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.07] hover:border-[#FF5A36] flex flex-col items-center gap-1 text-center transition"
          >
            <ListChecks className="w-4 h-4 text-[#FF7A59]" />
            <span className="text-[10px] font-black text-white">기출 20제</span>
          </Link>
          <Link
            href="/study/books"
            className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.07] hover:border-emerald-400 flex flex-col items-center gap-1 text-center transition"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-white">개념·매칭</span>
          </Link>
          <Link
            href="/scan"
            className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.07] hover:border-amber-400 flex flex-col items-center gap-1 text-center transition"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-white">AI 스캔</span>
          </Link>
        </section>
      </div>

      {/* 집중 타이머 오버레이 */}
      <YptFocusOverlay
        isOpen={Boolean(focusTopicId)}
        subjectTitle={
          activeFocusMeta
            ? `${activeFocusMeta.subject.shortTitle} · ${activeFocusMeta.topic.title}`
            : ""
        }
        subjectColor={activeFocusMeta?.subject.color || "#FF5A36"}
        coneEmoji={currentConeSpec.badgeEmoji}
        coneLevel={equippedCone.currentLevel}
        coneName={currentConeSpec.name}
        dDayLabel={
          dDayToExam >= 0 ? `D-${dDayToExam} 제29회` : `D+${Math.abs(dDayToExam)}`
        }
        subjectElapsedBaseSeconds={
          activeFocusMeta ? subjectSecondsMap[activeFocusMeta.subject.id] || 0 : 0
        }
        todayTotalBaseSeconds={totalStudySeconds}
        myNickname={isLoggedIn ? profile.displayName : "posmul"}
        subjects={subjects}
        todaySlots={timetablesByDate[todayISO] || {}}
        onSwitchTopic={(nextTopicId) => setFocusTopicId(nextTopicId)}
        onConfirmValidTime={handleConfirmValidFocusTime}
        onCancel={() => setFocusTopicId(null)}
      />

      {/* 진화 스터디콘 상점 모달 */}
      <StudyConeStoreModal
        isOpen={isConeModalOpen}
        onClose={() => setIsConeModalOpen(false)}
        equippedCone={equippedCone}
        onEquipChange={setEquippedCone}
      />
    </MobileAppShell>
  );
}
