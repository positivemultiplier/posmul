"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Coins,
  ExternalLink,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { YptGroupGrid } from "@/components/mobile/ypt-group-grid";
import { MyLibraryPanel } from "@/components/study/my-library-panel";
import { ContextualPredictionWidget } from "@/components/prediction/contextual-prediction-widget";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";
import { getStudySecondsForDate } from "@/lib/study-metrics";

type MyTab = "group" | "library" | "wallet";

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
  const { todayISO, subjects, studySessions } = useStudyCurriculum();

  const [activeTab, setActiveTab] = useState<MyTab>("group");
  const [guestPmpBalance, setGuestPmpBalance] = useState<number>(0);

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      const params = new globalThis.URLSearchParams(globalThis.location.search);
      const view = params.get("view");
      const tab = params.get("tab");
      if (view === "todo" || view === "calendar") {
        router.replace("/study/planner");
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
  }, [router]);

  const actualTodayStudySeconds = useMemo(
    () => getStudySecondsForDate(studySessions, todayISO),
    [studySessions, todayISO]
  );

  const effectivePmpBalance = isLoggedIn ? pmpBalance : guestPmpBalance;

  return (
    <MobileAppShell>
      <header className="px-4 py-3 bg-[var(--hp-bg)] border-b border-[var(--hp-border)]">
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs font-medium">
          {(
            [
              { id: "group", label: "스터디 그룹", icon: Users },
              { id: "library", label: "내 교재", icon: BookOpen },
              { id: "wallet", label: "지갑 · Pro", icon: Coins },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
                  activeTab === item.id
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                    : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {activeTab === "library" && <MyLibraryPanel />}

        {activeTab === "group" && (
          <YptGroupGrid
            myStudySeconds={actualTodayStudySeconds}
            myConeEmoji=""
            myNickname={isLoggedIn ? profile.displayName : "게스트 수험생"}
            currentSubjectLabel={subjects[0]?.shortTitle || "주택관리 관계법규"}
            isMeStudying={false}
          />
        )}

        {activeTab === "wallet" && (
          <div className="space-y-4">
            {/* 계정 연동 & 통합 지갑 */}
            <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 stroke-[1.5] text-[var(--hp-success)] shrink-0" />
                        <span className="truncate">{profile.displayName}</span>
                      </div>
                      <div className="text-xs hp-tabular text-[var(--hp-text-2)] mt-1">
                        {pmpBalance.toLocaleString()} PMP · {pmcBalance.toLocaleString()} PMC
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] flex items-center gap-1 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>로그아웃</span>
                    </button>
                  </div>

                  <a
                    href="https://posmul.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center gap-1.5 transition"
                  >
                    <span>posmul.com 본진에서 PMP 사용하기</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                  </a>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">게스트 모드</div>
                    <div className="text-xs text-[var(--hp-text-2)] mt-0.5">
                      로그인 시 PosMul 지갑(일일 최대 300 PMP)과 기록이 동기화됩니다.
                    </div>
                  </div>
                  <Link
                    href="/auth/login?next=/study/more?tab=wallet"
                    className="px-3 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium flex items-center gap-1 shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>로그인</span>
                  </Link>
                </div>
              )}
            </section>

            {/* 현직 관리소장 Pro View 전환 */}
            <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
                  <span>현직 관리소장 Pro 워크스페이스</span>
                </div>
                <p className="text-xs text-[var(--hp-text-2)] mt-1">
                  합격 후 단지 법정일정·입대의 실무 모드로 전환합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSavedPersonaMode("pro");
                  router.push("/pro");
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium shrink-0"
              >
                전환
              </button>
            </section>

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
    </MobileAppShell>
  );
}
