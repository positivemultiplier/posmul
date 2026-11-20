"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { MyLibraryPanel } from "@/components/study/my-library-panel";
import { StudyConeStoreModal } from "@/components/study/study-cone-store-modal";
import { ContextualPredictionWidget } from "@/components/prediction/contextual-prediction-widget";
import { useStudyCurriculum, makeMatrixKey } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";
import { getTimetableSlotActual } from "@/data/study-textbooks";
import { STUDY_CONE_CATALOG, type UserStudyConeItem } from "@/data/mock-study-cones";
import { getUserStudyConesAction } from "@/app/actions/study-cone.actions";

type MyTab = "library" | "group" | "wallet";

export default function StudyMyHubPage() {
  const router = useRouter();
  const {
    isLoggedIn,
    profile,
    pmpBalance,
    pmcBalance,
    setLocalPmpBalance,
    signOut,
  } = useStudyAuth();
  const { todayISO, subjects, matrixLogs, timetablesByDate } =
    useStudyCurriculum();

  const [activeTab, setActiveTab] = useState<MyTab>("group");
  const [guestPmpBalance, setGuestPmpBalance] = useState<number>(0);
  const [isConeModalOpen, setIsConeModalOpen] = useState(false);
  const [equippedCone, setEquippedCone] = useState<UserStudyConeItem>({
    id: "cone-default-fire-owl",
    coneType: "FIRE_OWL",
    currentLevel: 2,
    totalFocusMinutes: 105,
    isEquipped: true,
    purchasedPriceKrw: 0,
    unlockedAt: "2026-11-01",
  });

  // 구버전 링크(/study/more?view=todo|calendar) 하위 호환 리다이렉트 & 탭 쿼리 파싱
  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      const view = params.get("view");
      const tab = params.get("tab");
      if (view === "todo" || view === "calendar") {
        router.replace("/study/planner?view=calendar");
        return;
      }
      if (view === "tools") {
        router.replace("/study/books");
        return;
      }
      if (tab === "group" || view === "group") setActiveTab("group");
      else if (tab === "wallet" || tab === "predict") setActiveTab("wallet");
      else if (tab === "library") setActiveTab("library");
    }

    void getUserStudyConesAction().then((res) => {
      if (res.equippedCone) setEquippedCone(res.equippedCone);
    });
  }, [router]);

  // 실제 오늘 순공시간 계산 (하드코딩 13338 완전 제거)
  const actualTodayStudySeconds = useMemo(() => {
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

    let totalSec = 0;
    for (const subj of subjects) {
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
          totalSec += Math.max(recordedMinutes, slotMinutes) * 60;
        }
      }
    }
    return totalSec;
  }, [subjects, matrixLogs, timetablesByDate, todayISO]);

  const currentConeSpec =
    STUDY_CONE_CATALOG.find((s) => s.coneType === equippedCone.coneType) ||
    STUDY_CONE_CATALOG[0];

  const effectivePmpBalance = isLoggedIn ? pmpBalance : guestPmpBalance;

  return (
    <MobileAppShell>
      {/* 슬림 3대 세그먼트 (AppBar 중복 타이틀 제거 -> 열공방 첫 화면 즉시 노출) */}
      <header className="px-3.5 py-2.5 bg-[#16161C] border-b border-white/[0.06]">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#0E0E12] border border-white/[0.06] text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab("group")}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "group"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>스터디 그룹</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "library"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>내 서재</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`min-h-[42px] rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "wallet"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>지갑·프로</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 1. 내 서재 (교재·시험일·커스텀 목차·시리얼·보관함 단일 관리) */}
        {activeTab === "library" && <MyLibraryPanel />}

        {/* 2. 스터디 그룹 (실제 오늘 순공시간 & 장착 콘 연동) */}
        {activeTab === "group" && (
          <YptGroupGrid
            myStudySeconds={actualTodayStudySeconds}
            myConeEmoji={currentConeSpec.badgeEmoji}
            myNickname={isLoggedIn ? profile.displayName : "게스트 수험생"}
            currentSubjectLabel={subjects[0]?.shortTitle || "주택관리 관계법규"}
            isMeStudying={false}
          />
        )}

        {/* 3. PosMul 지갑 · 스터디콘 · 예측 마켓 · 소장Pro 전환 */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            {/* 계정 연동 & 잔액 카드 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] flex items-center justify-between gap-3">
              {isLoggedIn ? (
                <>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{profile.displayName} · PosMul 연동됨</span>
                    </div>
                    <div className="text-xs font-mono font-black text-amber-300">
                      {pmpBalance.toLocaleString()} PMP · {pmcBalance.toLocaleString()} PMC
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-950/50 text-[10.5px] font-bold text-slate-300 hover:text-rose-300 flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-black text-white">
                      게스트 모드 (브라우저 임시 저장)
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      로그인 시 PosMul 지갑과 모든 회독·풀이 기록이 영구 동기화됩니다.
                    </div>
                  </div>
                  <Link
                    href="/auth/login?next=/study/more?tab=wallet"
                    className="px-3 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[11px] font-black flex items-center gap-1 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>로그인</span>
                  </Link>
                </>
              )}
            </section>

            {/* 장착 스터디콘 카드 */}
            <section className="p-4 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#121216] border border-[#FF5A36]/40 flex items-center justify-center text-2xl shrink-0">
                  {currentConeSpec.badgeEmoji}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{currentConeSpec.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-mono">
                      Lv.{equippedCone.currentLevel}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                    타이머 순공시간에 따라 진화하는 열공 파트너
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConeModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 text-[#FF7A59] text-[10.5px] font-black flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>콘 상점</span>
              </button>
            </section>

            {/* 현직 관리소장 Pro 전환 브릿지 */}
            <section className="p-4 rounded-2xl bg-gradient-to-r from-[#0F1B33] to-[#141A29] border border-sky-500/35 flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-black text-sky-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>합격 후 현직 관리소장 Pro 워크스페이스</span>
                </div>
                <p className="text-[10.5px] text-slate-300">
                  암기한 법정 점검 주기·신고 기한이 단지 과태료 방어 스케줄러로 직결됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSavedPersonaMode("pro");
                  router.push("/pro");
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10.5px] font-black shrink-0 transition"
              >
                소장Pro 전환
              </button>
            </section>

            {/* PosMul 맥락형 예측 마켓 위젯 */}
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

      <StudyConeStoreModal
        isOpen={isConeModalOpen}
        onClose={() => setIsConeModalOpen(false)}
        equippedCone={equippedCone}
        onEquipChange={setEquippedCone}
      />
    </MobileAppShell>
  );
}
