"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  KeyRound,
  GraduationCap,
  Briefcase,
  Target,
  CheckCircle2,
  Camera,
  Zap,
  ChevronRight,
  ChevronDown,
  BookOpen,
  TableProperties,
  ListChecks,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptFocusOverlay } from "@/components/mobile/ypt-focus-overlay";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import { StudyConeStoreModal } from "@/components/study/study-cone-store-modal";
import { UserStudyConeItem, STUDY_CONE_CATALOG } from "@/data/mock-study-cones";
import { getUserStudyConesAction } from "@/app/actions/study-cone.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { ContextualPredictionWidget } from "@/components/prediction/contextual-prediction-widget";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import { diffDaysISO, findTopicMetaInSubjects } from "@/data/study-textbooks";
import { getSavedPersonaMode, setSavedPersonaMode } from "@/lib/pro-workspace-store";

function formatHHMMSS(totalSec: number, spaced = false): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [h, m, s].map((v) => String(v).padStart(2, "0"));
  return spaced ? parts.join(" : ") : parts.join(":");
}

export default function HousingProStudentTimerPage() {
  const router = useRouter();
  const {
    isLoggedIn,
    profile,
    pmpBalance,
    setLocalPmpBalance,
    adjustLocalPmpBalance,
  } = useStudyAuth();
  const {
    todayISO,
    examDate,
    activeBook,
    subjects,
    matrixLogs,
    recordStudySession,
  } = useStudyCurriculum();

  // 타이머 화면 내부 서브탭
  const [activeSubTab, setActiveSubTab] = useState<"timer" | "group" | "predict">("timer");
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);

  // 보유 PMP (로그인 시 PosMul 원장 연동, 게스트 시 체험 잔액)
  const [guestPmpBalance, setGuestPmpBalance] = useState<number>(1000);
  const effectivePmpBalance = isLoggedIn ? pmpBalance : guestPmpBalance;
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [verifiedBookTitle, setVerifiedBookTitle] = useState<string | null>(null);

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

  // 목차별 오늘 추가 집중 시간 (초)
  const [sessionExtraSeconds, setSessionExtraSeconds] = useState<Record<string, number>>({});
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 기본으로 과목 1개 펼치기
  useEffect(() => {
    if (subjects.length > 0 && expandedSubjectIds.length === 0) {
      const target = subjects.find((s) => s.examStage === "2차") || subjects[0];
      setExpandedSubjectIds([target.id]);
    }
  }, [subjects, expandedSubjectIds.length]);

  // 초기 마운트: ?mode=pro 또는 저장된 소장 페르소나 감지 시 /pro 전용 앱으로 라우팅
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

      if ("localStorage" in globalThis) {
        const cached = globalThis.localStorage.getItem("housing_pro_serial_auth");
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as {
              serialCode?: string;
              bookTitle?: string;
            };
            if (parsed.serialCode) {
              setIsSerialVerified(true);
              setVerifiedBookTitle(parsed.bookTitle || null);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    void getUserSerialStatusAction().then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
        if (res.bookTitle) setVerifiedBookTitle(res.bookTitle);
      }
    });

    void getUserStudyConesAction().then((res) => {
      if (res.equippedCone) {
        setEquippedCone(res.equippedCone);
      }
    });
  }, [router, subjects, profile.userId]);

  const subjectSecondsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const subj of subjects) {
      let totalSec = 0;
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          const todayLog = matrixLogs[makeMatrixKey(topic.id, todayISO)];
          if (todayLog?.status === "done" && todayLog.minutes) {
            totalSec += todayLog.minutes * 60;
          }
          totalSec += sessionExtraSeconds[topic.id] || 0;
        }
      }
      map[subj.id] = totalSec;
    }
    return map;
  }, [subjects, matrixLogs, todayISO, sessionExtraSeconds]);

  const totalStudySeconds = useMemo(() => {
    const sum = Object.values(subjectSecondsMap).reduce((acc, s) => acc + s, 0);
    return sum > 0 ? sum : 7200;
  }, [subjectSecondsMap]);

  const targetSeconds = 21600;
  const goalPct = Math.min(100, Math.round((totalStudySeconds / targetSeconds) * 100));
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

  const handleConfirmValidFocusTime = (elapsedSeconds: number) => {
    if (!focusTopicId) return;
    setSessionExtraSeconds((prev) => ({
      ...prev,
      [focusTopicId]: (prev[focusTopicId] || 0) + elapsedSeconds,
    }));
    recordStudySession(focusTopicId, elapsedSeconds);

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
      setToastMsg("집중 완료! 플래너·PosMul 계정에 저장되었습니다 (+10 PMP)");
    } else {
      setGuestPmpBalance((prev) => prev + 10);
      setToastMsg("집중 완료! 로그인하시면 PosMul 지갑과 모든 기기에 영구 저장됩니다.");
    }
    setFocusTopicId(null);
    globalThis.setTimeout(() => setToastMsg(null), 4000);
  };

  const handleEnterProMode = () => {
    setSavedPersonaMode("pro");
    router.push("/pro");
  };

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#16161C]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 bg-[#FF5A36]/20 text-[#FF7A59] border border-[#FF5A36]/40">
            {dDayToExam >= 0 ? `D-${dDayToExam} 제29회` : `D+${Math.abs(dDayToExam)}`}
          </span>

          {isLoggedIn ? (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 bg-emerald-950/70 text-emerald-300 border border-emerald-500/35 truncate"
              title="PosMul 계정에 학습 기록·PMP가 실시간 연동 중"
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">PosMul 연동됨</span>
            </span>
          ) : (
            <Link
              href="/auth/login?next=/"
              className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition truncate"
              title="PosMul 계정 로그인 (개인 기록 영구 저장)"
            >
              <LogIn className="w-3 h-3 shrink-0" />
              <span>기록 저장 로그인</span>
            </Link>
          )}
        </div>

        {/* 우측 PMP 배지 & 페르소나 스위치 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("predict")}
            className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-300 font-mono"
          >
            {effectivePmpBalance.toLocaleString()} PMP
          </button>

          <div className="flex items-center bg-[#0B0B0E] p-0.5 rounded-lg border border-white/[0.08] text-[10px] font-black">
            <span className="px-2 py-1 rounded-md bg-[#FF5A36] text-white flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              <span>수험</span>
            </span>
            <button
              type="button"
              onClick={handleEnterProMode}
              className="px-2 py-1 rounded-md text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3" />
              <span>소장Pro</span>
            </button>
          </div>
        </div>
      </header>

      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 수험생 집중 타이머 홈 */}
      <div className="px-4 py-4 space-y-4">
        <section className="rounded-3xl bg-gradient-to-b from-[#1D1D24] to-[#141419] border border-white/[0.08] p-5 text-center space-y-3 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-32 bg-[#FF5A36]/15 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsConeModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121216] border border-[#FF5A36]/40 hover:border-[#FF5A36] transition shadow-md"
            >
              <span className="text-base">{currentConeSpec.badgeEmoji}</span>
              <span className="text-[10.5px] font-black text-white">
                Lv.{equippedCone.currentLevel}{" "}
                <span className="text-[#FF7A59]">{currentConeSpec.name}</span>
              </span>
            </button>

            <Link
              href="/study/books"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-bold text-slate-300 max-w-[200px]"
            >
              <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{activeBook.badge}</span>
            </Link>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 tracking-wide">
              오늘 총 순공시간 (매트릭스 자동 반영)
            </div>
            <div className="font-mono text-4xl sm:text-5xl font-black tracking-wider text-white tabular-nums">
              {formatHHMMSS(totalStudySeconds, true)}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-[#FF5A36]" />
                <span>오늘 목표 06:00:00</span>
              </span>
              <span className="text-[#FF7A59] font-black font-mono">
                {goalPct}% 달성
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0B0B0E] border border-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5A36] to-[#FF8008] transition-all duration-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* 서브탭 */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#1A1A21] border border-white/[0.06] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveSubTab("timer")}
            className={`py-2 rounded-xl transition ${
              activeSubTab === "timer"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⏱️ 목차 타이머
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("group")}
            className={`py-2 rounded-xl transition ${
              activeSubTab === "group"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔥 그룹 불빛
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("predict")}
            className={`py-2 rounded-xl transition ${
              activeSubTab === "predict"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🎯 예측·PMP
          </button>
        </div>

        {activeSubTab === "timer" && (
          <div className="space-y-2.5">
            {subjects.map((subject) => {
              const isExpanded = expandedSubjectIds.includes(subject.id);
              const subjSeconds = subjectSecondsMap[subject.id] || 0;
              const topicList = subject.units.flatMap((u) =>
                u.topics.map((t) => ({ unitTitle: u.title, topic: t }))
              );

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
                    <div className="flex items-center gap-2.5 min-w-0">
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
                      {topicList.map(({ unitTitle, topic }) => {
                        const todayCell = matrixLogs[makeMatrixKey(topic.id, todayISO)];
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
                              <div className="flex items-center gap-1.5">
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

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Link
                href="/study/books"
                className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] hover:border-[#FF5A36] flex flex-col items-center gap-1 text-center transition"
              >
                <BookOpen className="w-4 h-4 text-[#FF5A36]" />
                <span className="text-[10.5px] font-black text-white">단원개념</span>
              </Link>
              <Link
                href="/study/solve"
                className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] hover:border-[#FF5A36] flex flex-col items-center gap-1 text-center transition"
              >
                <ListChecks className="w-4 h-4 text-amber-400" />
                <span className="text-[10.5px] font-black text-white">기출 20제</span>
              </Link>
              <Link
                href="/study/ox"
                className="p-2.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] hover:border-sky-400 flex flex-col items-center gap-1 text-center transition"
              >
                <Zap className="w-4 h-4 text-sky-400" />
                <span className="text-[10.5px] font-black text-white">3초 O/X</span>
              </Link>
            </div>
          </div>
        )}

        {activeSubTab === "group" && (
          <YptGroupGrid
            myStudySeconds={totalStudySeconds}
            myConeEmoji={currentConeSpec.badgeEmoji}
          />
        )}

        {activeSubTab === "predict" && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#1A1A21] border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isLoggedIn
                      ? `${profile.displayName} · PosMul 지갑 연동됨`
                      : "PosMul 계정 로그인하고 PMP 적립하기"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isLoggedIn
                    ? "교재 없이 O/X·기출·타이머 학습만으로도 PosMul 계정에 PMP가 실시간 적립됩니다."
                    : "로그인 시 가입 +10,000 PMP와 함께 모든 학습 기록이 계정에 영구 저장됩니다."}
                </p>
              </div>
              {!isLoggedIn && (
                <Link
                  href="/auth/login?next=/"
                  className="px-3 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-[11px] shrink-0"
                >
                  로그인
                </Link>
              )}
            </div>

            <ContextualPredictionWidget
              userPmpBalance={effectivePmpBalance}
              onBalanceChange={(nextBal) => {
                if (isLoggedIn) setLocalPmpBalance(nextBal);
                else setGuestPmpBalance(nextBal);
              }}
            />
          </div>
        )}
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
        onConfirmValidTime={handleConfirmValidFocusTime}
        onCancel={() => setFocusTopicId(null)}
      />

      {/* 정품 시리얼 등록 모달 */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={(data) => {
          setIsSerialVerified(true);
          setVerifiedBookTitle(data.bookTitle);
        }}
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
