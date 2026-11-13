"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Flame,
  KeyRound,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Target,
  CheckCircle2,
  Camera,
  Zap,
  ChevronRight,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptFocusOverlay } from "@/components/mobile/ypt-focus-overlay";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { ComplexProfileBar, ComplexProfile } from "@/components/pro-view/complex-profile-bar";
import { LegalDdayScheduler } from "@/components/pro-view/legal-dday-scheduler";
import { AiBriefingViewer } from "@/components/pro-view/ai-briefing-viewer";
import { LifecycleLockinBridge } from "@/components/pro-view/lifecycle-lockin-bridge";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import { StudyConeStoreModal } from "@/components/study/study-cone-store-modal";
import { UserStudyConeItem, STUDY_CONE_CATALOG } from "@/data/mock-study-cones";
import { getUserStudyConesAction } from "@/app/actions/study-cone.actions";
import { ContextualPredictionWidget } from "@/components/prediction/contextual-prediction-widget";
import { REAL_2026_CHAPTERS } from "@/data/mock-exam-chapters";

interface ChapterTimerMeta {
  color: string;
  reviewWaiting: number;
  initialSeconds: number;
}

const CHAPTER_TIMER_META: Record<string, ChapterTimerMeta> = {
  "chap-1-housing-law": { color: "#FF5A36", reviewWaiting: 3, initialSeconds: 4360 }, // 01:12:40
  "chap-2-apt-mgmt-law": { color: "#38BDF8", reviewWaiting: 5, initialSeconds: 3738 }, // 01:02:18
  "chap-3-building-law": { color: "#A855F7", reviewWaiting: 2, initialSeconds: 1820 }, // 00:30:20
  "chap-4-safety-fire-law": { color: "#10B981", reviewWaiting: 4, initialSeconds: 2100 }, // 00:35:00
  "chap-5-rental-redevelopment": { color: "#F59E0B", reviewWaiting: 1, initialSeconds: 780 }, // 00:13:00
  "chap-6-labor-equipment": { color: "#EC4899", reviewWaiting: 6, initialSeconds: 540 }, // 00:09:00
};

function formatHHMMSS(totalSec: number, spaced = false): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [h, m, s].map((v) => String(v).padStart(2, "0"));
  return spaced ? parts.join(" : ") : parts.join(":");
}

export default function HousingProDashboardPage() {
  // 모드 전환: 수험생 모드(열품타) vs 현직 관리소장 Pro View
  const [isProView, setIsProView] = useState(false);
  // 열품타 내부 3개 서브탭
  const [activeSubTab, setActiveSubTab] = useState<"timer" | "group" | "predict">("timer");

  // 보유 PMP 및 정품 시리얼 인증 상태
  const [userPmpBalance, setUserPmpBalance] = useState<number>(1000);
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

  // 단원별 누적 시간 상태 (기본 합계 = 13,338초 = 03:42:18)
  const [chapterSeconds, setChapterSeconds] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const ch of REAL_2026_CHAPTERS) {
      init[ch.id] = CHAPTER_TIMER_META[ch.id]?.initialSeconds ?? 0;
    }
    return init;
  });

  // 전체화면 몰입 집중 모드 대상 단원
  const [focusChapterId, setFocusChapterId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pro View 단지 프로필 상태
  const [complexProfile, setComplexProfile] = useState<ComplexProfile>({
    name: "래미안 파크팰리스",
    totalHouseholds: 1240,
    buildingCount: 14,
    elevatorCount: 28,
    heatingType: "지역난방",
    fireGrade: "1급",
    completionDate: "2018-05",
    accidentFreeDays: 342,
    savedFineAmountKrw: 48000000,
  });

  // 초기 마운트: ?mode=pro 감지 & 시리얼/스터디콘 상태 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "pro") {
        setIsProView(true);
      }

      const cached = localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.serialCode) {
            setIsSerialVerified(true);
            setVerifiedBookTitle(parsed.bookTitle || null);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
        if (res.bookTitle) setVerifiedBookTitle(res.bookTitle);
      }
    });

    getUserStudyConesAction("user-demo-housing-1").then((res) => {
      if (res.equippedCone) {
        setEquippedCone(res.equippedCone);
      }
    });
  }, []);

  // 총 공부 시간 & 목표(06:00:00 = 21,600초) 달성률
  const totalStudySeconds = useMemo(() => {
    return Object.values(chapterSeconds).reduce((acc, sec) => acc + sec, 0);
  }, [chapterSeconds]);

  const targetSeconds = 21600; // 06:00:00
  const goalPct = Math.min(100, Math.round((totalStudySeconds / targetSeconds) * 100));

  const currentConeSpec =
    STUDY_CONE_CATALOG.find((s) => s.coneType === equippedCone.coneType) ||
    STUDY_CONE_CATALOG[0];

  const activeFocusChapter = REAL_2026_CHAPTERS.find((c) => c.id === focusChapterId);

  const handleConfirmValidFocusTime = (elapsedSeconds: number) => {
    if (!focusChapterId) return;
    setChapterSeconds((prev) => ({
      ...prev,
      [focusChapterId]: (prev[focusChapterId] || 0) + elapsedSeconds,
    }));
    setUserPmpBalance((prev) => prev + 10);
    setToastMsg(
      `유효 집중 시간 +${Math.max(1, Math.round(elapsedSeconds / 60))}분 확정! (+10 PMP 적립)`
    );
    setFocusChapterId(null);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDefendSuccess = (amountKrw: number) => {
    setComplexProfile((prev) => ({
      ...prev,
      savedFineAmountKrw: prev.savedFineAmountKrw + amountKrw,
      accidentFreeDays: prev.accidentFreeDays + 1,
    }));
  };

  return (
    <MobileAppShell isProMode={isProView} onSelectProMode={setIsProView}>
      {/* 📱 상단 앱 헤더 */}
      <header
        className={`px-4 py-3 flex items-center justify-between gap-2 border-b border-white/[0.06] ${
          isProView ? "bg-[#0D1322]" : "bg-[#16161C]"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
              isProView
                ? "bg-indigo-600 text-white"
                : "bg-[#FF5A36]/20 text-[#FF7A59] border border-[#FF5A36]/40"
            }`}
          >
            {isProView ? "PRO 소장" : "D-142 제29회 2차"}
          </span>

          {!isProView && (
            <button
              type="button"
              onClick={() => setIsSerialModalOpen(true)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition truncate ${
                isSerialVerified
                  ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300"
              }`}
              title={verifiedBookTitle || "정품 교재 시리얼 등록"}
            >
              <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{isSerialVerified ? "정품인증" : "키등록"}</span>
            </button>
          )}
        </div>

        {/* 우측 PMP 배지 & 모드 스위치 */}
        <div className="flex items-center gap-2 shrink-0">
          {!isProView && (
            <button
              type="button"
              onClick={() => setActiveSubTab("predict")}
              className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-300 font-mono"
            >
              {userPmpBalance.toLocaleString()} PMP
            </button>
          )}

          <div className="flex items-center bg-[#0B0B0E] p-0.5 rounded-lg border border-white/[0.08] text-[10px] font-black">
            <button
              type="button"
              onClick={() => setIsProView(false)}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                !isProView ? "bg-[#FF5A36] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>수험</span>
            </button>
            <button
              type="button"
              onClick={() => setIsProView(true)}
              className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                isProView ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
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

      {!isProView ? (
        /* ========================================================== */
        /* 1. 열품타(YPT) 감성 모바일 수험생 홈 화면 */
        /* ========================================================== */
        <div className="px-4 py-4 space-y-4">
          {/* 🔥 열품타 히어로 스톱워치 존 */}
          <section className="rounded-3xl bg-gradient-to-b from-[#1D1D24] to-[#141419] border border-white/[0.08] p-5 text-center space-y-3 shadow-2xl relative overflow-hidden">
            {/* 은은한 오렌지 글로우 */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-32 bg-[#FF5A36]/15 blur-3xl pointer-events-none" />

            {/* 진화 스터디콘 캐릭터 아바타 (클릭 시 상점 모달) */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsConeModalOpen(true)}
                className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121216] border border-[#FF5A36]/40 hover:border-[#FF5A36] transition shadow-md"
              >
                <span className="text-xl animate-bounce">{currentConeSpec.badgeEmoji}</span>
                <div className="text-left">
                  <div className="text-[11px] font-black text-white flex items-center gap-1">
                    <span>Lv.{equippedCone.currentLevel}</span>
                    <span className="text-[#FF7A59]">{currentConeSpec.name}</span>
                  </div>
                </div>
                <Flame className="w-3.5 h-3.5 text-[#FF5A36] fill-[#FF5A36] animate-pulse" />
              </button>
            </div>

            {/* 초대형 디지털 스톱워치 */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 tracking-wide">
                오늘 총 순공시간
              </div>
              <div className="font-mono text-5xl font-black tracking-wider text-white tabular-nums">
                {formatHHMMSS(totalStudySeconds, true)}
              </div>
            </div>

            {/* 목표(06:00:00) 달성률 오렌지 게이지 바 */}
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

          {/* 🔀 3개 내부 서브탭 */}
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
              ⏱️ 과목 타이머
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
              🔥 그룹 불빛 (8/12)
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

          {/* 서브탭 컨텐츠 */}
          {activeSubTab === "timer" && (
            <div className="space-y-2.5">
              {/* 과목별 한 줄 재생 리스트 */}
              {REAL_2026_CHAPTERS.map((chapter) => {
                const meta = CHAPTER_TIMER_META[chapter.id] || {
                  color: "#FF5A36",
                  reviewWaiting: 2,
                  initialSeconds: 0,
                };
                const sec = chapterSeconds[chapter.id] || 0;

                return (
                  <div
                    key={chapter.id}
                    className="px-3.5 py-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] hover:border-[#FF5A36]/40 flex items-center justify-between gap-3 transition"
                  >
                    {/* 좌측 컬러 도트 + 단원명 + 복습 대기 */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: meta.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">
                          {chapter.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 pt-0.5">
                          <span>{chapter.questionCount}문항</span>
                          <span>·</span>
                          <Link
                            href="/study/ox"
                            className="text-amber-300 font-bold hover:underline"
                          >
                            ★/X 복습 대기 {meta.reviewWaiting}개
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 우측 누적시간 + 오렌지 원형 [▶] 재생 버튼 */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-200 tabular-nums">
                        {formatHHMMSS(sec)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFocusChapterId(chapter.id)}
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF5A36] to-[#FF8008] hover:scale-105 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(255,90,54,0.4)] transition"
                        aria-label={`${chapter.title} 집중 시작`}
                      >
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 퀵 액션 스트립: AI 스캔 & 3초 O/X */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/scan"
                  className="p-3 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 hover:border-[#FF5A36] flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#FF5A36]" />
                    <div className="text-left">
                      <div className="text-[11px] font-black text-white">종이책 AI 스캔</div>
                      <div className="text-[10px] text-amber-300 font-bold">+40 PMP 적립</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  href="/study/ox"
                  className="p-3 rounded-2xl bg-[#1A1A21] border border-sky-500/30 hover:border-sky-400 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <div className="text-left">
                      <div className="text-[11px] font-black text-white">3초 컷 O/X 덱</div>
                      <div className="text-[10px] text-sky-300 font-bold">240선지 복습</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
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
              {/* 정품 시리얼 등록 모바일 카드 */}
              <div className="p-4 rounded-2xl bg-[#1A1A21] border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {isSerialVerified
                        ? "POD 정품 교재 인증 완료"
                        : "POD 종이책 정품 시리얼 등록"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isSerialVerified
                      ? "1~5회독 240선지 해금 및 스캔 +40 PMP 활성"
                      : "등록 즉시 2~5회독 해금 + AI 스캔 PMP 적립"}
                  </p>
                </div>
                {!isSerialVerified && (
                  <button
                    type="button"
                    onClick={() => setIsSerialModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shrink-0"
                  >
                    등록하기
                  </button>
                )}
              </div>

              {/* 상시 예측 마켓 위젯 */}
              <ContextualPredictionWidget
                userPmpBalance={userPmpBalance}
                onBalanceChange={setUserPmpBalance}
              />
            </div>
          )}
        </div>
      ) : (
        /* ========================================================== */
        /* 2. Pro View 모드 (현직 소장 업무용: 게이미피케이션 일체 숨김) */
        /* ========================================================== */
        <div className="px-4 py-4 space-y-4">
          <ComplexProfileBar
            profile={complexProfile}
            onUpdateProfile={setComplexProfile}
          />
          <LifecycleLockinBridge />
          <LegalDdayScheduler onSuccessDefend={handleDefendSuccess} />
          <AiBriefingViewer />
        </div>
      )}

      {/* 열품타 전체화면 몰입 집중 모드 오버레이 */}
      <YptFocusOverlay
        isOpen={Boolean(focusChapterId)}
        subjectTitle={activeFocusChapter?.title || ""}
        subjectColor={
          (focusChapterId && CHAPTER_TIMER_META[focusChapterId]?.color) || "#FF5A36"
        }
        coneEmoji={currentConeSpec.badgeEmoji}
        coneLevel={equippedCone.currentLevel}
        onConfirmValidTime={handleConfirmValidFocusTime}
        onCancel={() => setFocusChapterId(null)}
      />

      {/* 정품 시리얼 등록 모달 (z-50) */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={(data) => {
          setIsSerialVerified(true);
          setVerifiedBookTitle(data.bookTitle);
        }}
      />

      {/* 진화 스터디콘 상점 & 도감 모달 (z-50) */}
      <StudyConeStoreModal
        isOpen={isConeModalOpen}
        onClose={() => setIsConeModalOpen(false)}
        equippedCone={equippedCone}
        onEquipChange={setEquippedCone}
      />
    </MobileAppShell>
  );
}
