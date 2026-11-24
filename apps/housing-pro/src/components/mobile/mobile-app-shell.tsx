"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  Building2,
  CalendarCheck2,
  Clock,
  FileCheck2,
  FileText,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCw,
  Search,
  ShieldAlert,
  Smartphone,
  Square,
  Sun,
  TrendingUp,
} from "lucide-react";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { diffDaysISO } from "@/data/study-textbooks";
import { formatClockHHMMSS } from "@/lib/study-theme";
import { StudyMenuDrawer } from "@/components/mobile/study-menu-drawer";
import { StudyFabSheet } from "@/components/mobile/study-fab-sheet";

interface MobileAppShellProps {
  children: ReactNode;
  isProMode?: boolean;
  onSelectProMode?: (pro: boolean) => void;
  activeStudyCount?: number;
}

export function MobileAppShell({
  children,
  isProMode = false,
  onSelectProMode,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isWideView, setIsWideView] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [shellToast, setShellToast] = useState<string | null>(null);

  const { todayISO, examDate } = useStudyCurriculum();
  const {
    theme,
    toggleTheme,
    openSpotlight,
    quickTimer,
    openTimerOverlay,
    toggleQuickTimerPause,
    stopAndSaveQuickTimer,
  } = useGlobalUx();

  // 현직 소장 Pro View 영역은 기존 동작·색상 100% 보존
  const isProShell = pathname.startsWith("/pro") || isProMode;

  // Study v2.0 하단 5탭: 타이머 · 플래너 · 통계 · 문제 · 복습 (AI 스캔 제외)
  const isTimerTab = pathname === "/" && !isProShell;
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isStatsTab = pathname.startsWith("/study/stats");
  const isSolveTab =
    pathname.startsWith("/study/solve") || pathname.startsWith("/study/graph");
  const isReviewTab = pathname.startsWith("/study/ox");

  // 소장 Pro 5탭
  const isProHomeTab = pathname === "/pro";
  const isProLegalTab = pathname.startsWith("/pro/legal");
  const isProDocsTab = pathname.startsWith("/pro/docs");
  const isProPredictTab = pathname.startsWith("/pro/predict");
  const isProCommunityTab = pathname.startsWith("/pro/community");

  const dDayLabel = useMemo(() => {
    if (!examDate) return "D-Day";
    const diff = diffDaysISO(todayISO, examDate);
    if (diff === 0) return "D-DAY";
    return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  }, [todayISO, examDate]);

  const currentScreenTitle = useMemo(() => {
    if (isProShell) {
      if (isProLegalTab) return "소장Pro · 법정일정";
      if (isProDocsTab) return "소장Pro · 입대의실무";
      if (isProPredictTab) return "소장Pro · 예측·브리핑";
      if (isProCommunityTab) return "소장Pro · 커뮤니티";
      return "소장Pro · 단지홈";
    }
    if (isPlannerTab) return "플래너";
    if (isStatsTab) return "통계";
    if (isSolveTab) return "문제";
    if (isReviewTab) return "복습";
    if (pathname.startsWith("/study/books")) return "개념서";
    if (pathname.startsWith("/study/more")) return "설정 · 그룹";
    return "타이머";
  }, [
    isProShell,
    isProLegalTab,
    isProDocsTab,
    isProPredictTab,
    isProCommunityTab,
    isPlannerTab,
    isStatsTab,
    isSolveTab,
    isReviewTab,
    pathname,
  ]);

  const showToast = (msg: string) => {
    setShellToast(msg);
    window.setTimeout(() => setShellToast(null), 2400);
  };

  const handleSwitchMode = (targetPro: boolean) => {
    setSavedPersonaMode(targetPro ? "pro" : "student");
    setIsMenuOpen(false);
    if (onSelectProMode) {
      onSelectProMode(targetPro);
    }
    router.push(targetPro ? "/pro" : "/");
  };

  const handleStopMinimizedTimer = () => {
    const res = stopAndSaveQuickTimer();
    if (res.savedSeconds >= 5) {
      const mins = Math.max(1, Math.round(res.savedSeconds / 60));
      showToast(`${res.topicTitle} (${mins}분) 타임라인에 기록했습니다.`);
    } else {
      showToast("타이머를 종료했습니다.");
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center ${
        isProShell
          ? "bg-[#070709] text-white"
          : "bg-[var(--hp-outer)] text-[var(--hp-text)]"
      }`}
    >
      <div
        className={`w-full min-h-screen flex flex-col relative transition-colors duration-200 ${
          isProShell
            ? "bg-[#0B111E] border-x border-white/[0.08]"
            : "bg-[var(--hp-bg)] border-x border-[var(--hp-border)]"
        } ${isWideView ? "max-w-5xl" : "max-w-[460px]"}`}
      >
        {/* 상단 미니멀 AppBar (52px) */}
        <header
          className={`sticky top-0 z-30 pt-safe border-b backdrop-blur-md ${
            isProShell
              ? "bg-[#0B111E]/95 border-white/[0.08]"
              : "bg-[var(--hp-bg)]/92 border-[var(--hp-border)]"
          }`}
        >
          <div className="h-[52px] px-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition shrink-0 ${
                  isProShell
                    ? "bg-white/[0.06] hover:bg-white/[0.12] text-slate-200"
                    : "hover:bg-[var(--hp-surface)] text-[var(--hp-text)]"
                }`}
                aria-label="전체 메뉴 열기"
              >
                <Menu className="w-5 h-5 stroke-[1.5]" />
              </button>

              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-tight truncate">
                  {currentScreenTitle}
                </span>
                {isProShell ? (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[11px] font-medium shrink-0">
                    Pro
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--hp-surface)] border border-[var(--hp-border)] text-[var(--hp-text-2)] text-[11px] hp-tabular shrink-0">
                    {dDayLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openSpotlight()}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  isProShell
                    ? "hover:bg-white/[0.08] text-slate-300"
                    : "hover:bg-[var(--hp-surface)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
                aria-label="1초 검색"
                title="1초 개념 · 기출 검색"
              >
                <Search className="w-4 h-4 stroke-[1.5]" />
              </button>

              {!isProShell && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg hover:bg-[var(--hp-surface)] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center transition"
                  aria-label="다크 라이트 테마 전환"
                  title={theme === "dark" ? "페이퍼 라이트로 전환" : "오브시디언 다크로 전환"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 stroke-[1.5]" />
                  ) : (
                    <Moon className="w-4 h-4 stroke-[1.5]" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsWideView((prev) => !prev)}
                className={`hidden md:flex w-9 h-9 rounded-lg items-center justify-center transition ${
                  isProShell
                    ? "hover:bg-white/[0.08] text-slate-400"
                    : "hover:bg-[var(--hp-surface)] text-[var(--hp-text-2)]"
                }`}
                title="화면 너비 전환"
                aria-label="화면 너비 전환"
              >
                {isWideView ? (
                  <Smartphone className="w-4 h-4 stroke-[1.5]" />
                ) : (
                  <Monitor className="w-4 h-4 stroke-[1.5]" />
                )}
              </button>
            </div>
          </div>

          {/* 최소화된 실행 중 타이머 바 (클릭 시 다시 그룹 타이머 오버레이 열림) */}
          {quickTimer.active && !quickTimer.overlayOpen && (
            <div className="px-4 py-2 bg-[var(--hp-surface)] border-t border-[var(--hp-border)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={openTimerOverlay}
                className="flex items-center gap-2 min-w-0 text-left flex-1"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    quickTimer.paused ? "opacity-40" : "animate-pulse"
                  }`}
                  style={{ backgroundColor: quickTimer.subjectColor }}
                />
                <span className="text-xs font-medium hp-tabular shrink-0">
                  {formatClockHHMMSS(quickTimer.elapsedSeconds)}
                </span>
                <span className="text-xs text-[var(--hp-text-2)] truncate">
                  {quickTimer.subjectTitle} · 그룹방 보기
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleQuickTimerPause}
                  className="w-7 h-7 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text)]"
                  aria-label={quickTimer.paused ? "재개" : "일시정지"}
                >
                  {quickTimer.paused ? (
                    <Play className="w-3 h-3 stroke-[1.75]" />
                  ) : (
                    <Pause className="w-3 h-3 stroke-[1.75]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleStopMinimizedTimer}
                  className="h-7 px-2.5 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium flex items-center gap-1"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>종료</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* 전역 토스트 */}
        {shellToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[75] max-w-[420px] w-[92%] px-4 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-xs font-medium text-[var(--hp-text)] shadow-xl text-center">
            {shellToast}
          </div>
        )}

        {/* 본문 영역 */}
        <main className="flex-1 flex flex-col pb-24">{children}</main>

        {/* 우하단 스마트 플로팅 + 버튼 (Study 전용) */}
        {!isProShell && (
          <div
            className={`fixed bottom-[76px] left-1/2 -translate-x-1/2 w-full pointer-events-none z-40 px-4 flex justify-end ${
              isWideView ? "max-w-5xl" : "max-w-[460px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsFabOpen(true)}
              className="pointer-events-auto w-12 h-12 rounded-full bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] shadow-lg border border-[var(--hp-border-strong)] flex items-center justify-center hover:scale-[1.03] active:scale-95 transition"
              aria-label="빠른 기록 및 실행"
            >
              <Plus className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        )}

        {/* 하단 고정 5탭 네비게이션 */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t backdrop-blur-md pb-safe ${
            isProShell
              ? "bg-[#0D1426]/95 border-white/[0.08]"
              : "bg-[var(--hp-bg)]/94 border-[var(--hp-border)]"
          } ${isWideView ? "max-w-5xl" : "max-w-[460px]"}`}
        >
          {isProShell ? (
            /* 현직 소장 Pro 5탭 (기존 유지) */
            <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
              {[
                { href: "/pro", label: "단지홈", icon: Building2, active: isProHomeTab },
                { href: "/pro/legal", label: "법정일정", icon: ShieldAlert, active: isProLegalTab },
                { href: "/pro/docs", label: "입대의", icon: FileText, active: isProDocsTab },
                { href: "/pro/predict", label: "브리핑", icon: TrendingUp, active: isProPredictTab },
                {
                  href: "/pro/community",
                  label: "커뮤니티",
                  icon: MessageSquare,
                  active: isProCommunityTab,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 min-h-[46px] transition ${
                      item.active ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.6]" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Study v2.0 5탭: 타이머 · 플래너 · 통계 · 문제 · 복습 */
            <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
              {[
                { href: "/", label: "타이머", icon: Clock, active: isTimerTab },
                {
                  href: "/study/planner",
                  label: "플래너",
                  icon: CalendarCheck2,
                  active: isPlannerTab,
                },
                { href: "/study/stats", label: "통계", icon: BarChart2, active: isStatsTab },
                { href: "/study/solve", label: "문제", icon: FileCheck2, active: isSolveTab },
                { href: "/study/ox", label: "복습", icon: RotateCw, active: isReviewTab },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 min-h-[46px] transition ${
                      item.active
                        ? "text-[var(--hp-text)]"
                        : "text-[var(--hp-text-3)] hover:text-[var(--hp-text-2)]"
                    }`}
                  >
                    <Icon className={`w-[19px] h-[19px] ${item.active ? "stroke-[2]" : "stroke-[1.5]"}`} />
                    <span className={`text-[10.5px] ${item.active ? "font-semibold" : "font-normal"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* 좌측 햄버거 드로어 */}
        <StudyMenuDrawer
          open={isMenuOpen}
          isProShell={isProShell}
          pathname={pathname || "/"}
          dDayLabel={dDayLabel}
          onClose={() => setIsMenuOpen(false)}
          onSwitchMode={handleSwitchMode}
        />

        {/* 우하단 스마트 플로팅 + 바텀시트 */}
        <StudyFabSheet
          open={isFabOpen}
          pathname={pathname || "/"}
          onClose={() => setIsFabOpen(false)}
          onToast={showToast}
        />
      </div>
    </div>
  );
}
