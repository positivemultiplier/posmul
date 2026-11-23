"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  Camera,
  Clock,
  Coins,
  FileText,
  GitCompareArrows,
  GraduationCap,
  Library,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Pause,
  Play,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Square,
  TableProperties,
  TrendingUp,
  Type,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { diffDaysISO } from "@/data/study-textbooks";

interface MobileAppShellProps {
  children: ReactNode;
  isProMode?: boolean;
  onSelectProMode?: (pro: boolean) => void;
  activeStudyCount?: number;
}

function formatTimerClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
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

  const { isLoggedIn, profile, pmpBalance, signOut } = useStudyAuth();
  const { todayISO, examDate } = useStudyCurriculum();
  const {
    largeFont,
    toggleLargeFont,
    openSpotlight,
    quickTimer,
    startQuickTimer,
    toggleQuickTimerPause,
    stopAndSaveQuickTimer,
  } = useGlobalUx();

  // 경로 기반 + prop 기반 소장Pro 모드 판별
  const isProShell = pathname.startsWith("/pro") || isProMode;

  // 제로베이스 Power J 5탭 활성화: 타이머 · 플래너 · 통계(3번) · 문제(기출+지식맵+OX) · 그룹
  const isTimerTab = pathname === "/" && !isProShell;
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isStatsTab = pathname.startsWith("/study/stats");
  const isGraphRoute = pathname.startsWith("/study/graph");
  const isPracticeTab =
    pathname.startsWith("/study/solve") ||
    pathname.startsWith("/study/graph") ||
    pathname.startsWith("/study/ox") ||
    pathname.startsWith("/study/books") ||
    pathname.startsWith("/scan");
  const isGroupTab = pathname.startsWith("/study/more");

  // 소장Pro 바텀 5탭 활성화
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
    if (pathname.startsWith("/study/solve")) return "문제 · 연도별 기출";
    if (isGraphRoute) return "문제 · 단원별 지식맵";
    if (pathname.startsWith("/study/ox")) return "문제 · 스피드 O/X";
    if (pathname.startsWith("/study/books")) return "이론 · 키워드";
    if (pathname.startsWith("/scan")) return "실물 책 스캔";
    if (isGroupTab) return "그룹스터디 · 마이";
    return "타이머";
  }, [
    isProShell,
    isProLegalTab,
    isProDocsTab,
    isProPredictTab,
    isProCommunityTab,
    isPlannerTab,
    isStatsTab,
    pathname,
    isGraphRoute,
    isGroupTab,
  ]);

  const showToast = (msg: string) => {
    setShellToast(msg);
    window.setTimeout(() => setShellToast(null), 2600);
  };

  const handleSwitchMode = (targetPro: boolean) => {
    setSavedPersonaMode(targetPro ? "pro" : "student");
    setIsMenuOpen(false);
    if (onSelectProMode) {
      onSelectProMode(targetPro);
    }
    router.push(targetPro ? "/pro" : "/");
  };

  const handleStopTimer = () => {
    const res = stopAndSaveQuickTimer();
    if (res.savedSeconds >= 5) {
      const mins = Math.max(1, Math.round(res.savedSeconds / 60));
      showToast(`${res.topicTitle} (${mins}분) 학습 기록을 저장했습니다!`);
    } else {
      showToast("타이머를 종료했습니다 (5초 미만 미기록).");
    }
  };

  // 현재 탭별 FAB 최우선 추천 액션
  const contextFabAction = useMemo(() => {
    if (isPlannerTab) {
      return {
        label: "실물 책 스캔 · 목차 등록",
        sub: "바코드/목차 사진으로 플래너에 즉시 책 추가",
        icon: Camera,
        onClick: () => {
          setIsFabOpen(false);
          router.push("/scan");
        },
      };
    }
    if (isGraphRoute) {
      return {
        label: "1초 키워드 꼬리물기 검색",
        sub: "90개 기출 개념 · 17종 대조표 · 베스트 암기법",
        icon: Search,
        onClick: () => {
          setIsFabOpen(false);
          openSpotlight();
        },
      };
    }
    if (isPracticeTab) {
      return {
        label: "단원별 지식맵 꼬리물기",
        sub: "단원별 기출 · A vs B 대조표 · 인기 암기법 바로가기",
        icon: GitCompareArrows,
        onClick: () => {
          setIsFabOpen(false);
          router.push("/study/graph");
        },
      };
    }
    return {
      label: quickTimer.active ? "실행 중인 타이머 보기" : "실물 책 집중 타이머 바로 시작",
      sub: quickTimer.active
        ? `현재 ${formatTimerClock(quickTimer.elapsedSeconds)} 측정 중`
        : "종이책 펴고 1초 만에 순공시간 기록 시작",
      icon: Clock,
      onClick: () => {
        setIsFabOpen(false);
        if (!quickTimer.active) {
          startQuickTimer();
          showToast("집중 타이머가 시작되었습니다! 어느 탭에서도 상단에 유지됩니다.");
        }
      },
    };
  }, [
    isPlannerTab,
    isGraphRoute,
    isPracticeTab,
    quickTimer.active,
    quickTimer.elapsedSeconds,
    router,
    openSpotlight,
    startQuickTimer,
  ]);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center">
      {/* 네이티브 모바일 앱 프레임 컨테이너 */}
      <div
        className={`w-full min-h-screen flex flex-col relative transition-all duration-300 border-x border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
          isProShell ? "bg-[#0B111E]" : "bg-[#111218]"
        } ${isWideView ? "max-w-6xl" : "max-w-[460px]"}`}
      >
        {/* ① 초슬림 상단 네이티브 AppBar (52px + Safe Area) */}
        <header
          className={`sticky top-0 z-30 pt-safe border-b border-white/[0.08] backdrop-blur-xl ${
            isProShell ? "bg-[#0B111E]/95" : "bg-[#13141B]/95"
          }`}
        >
          <div className="h-[52px] px-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-slate-200 transition shrink-0"
                aria-label="전체 메뉴 열기"
                title="메뉴 · 서재 · 소장Pro 전환"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[15px] font-black tracking-tight text-white truncate">
                  {currentScreenTitle}
                </span>
                {!isProShell ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[#FF8A70] text-[11px] font-mono font-black shrink-0">
                    {dDayLabel}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[11px] font-black shrink-0">
                    Pro
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* 전역 1초 개념·암기법 검색 버튼 */}
              <button
                type="button"
                onClick={() => openSpotlight()}
                className="h-10 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-xs font-black flex items-center gap-1.5 transition"
                aria-label="1초 개념 검색"
                title="실물 책 키워드 1초 꼬리물기 검색"
              >
                <Search className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="hidden xs:inline">검색</span>
              </button>

              {/* 데스크톱 전용 와이드/모바일 뷰 토글 */}
              <button
                type="button"
                onClick={() => setIsWideView((prev) => !prev)}
                className="hidden md:flex h-10 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-bold items-center gap-1 transition"
                title="화면 너비 전환"
              >
                {isWideView ? (
                  <Smartphone className="w-4 h-4 text-[#FF5A36]" />
                ) : (
                  <Monitor className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* ② 전역 미니 타이머 바 (실행 중일 때만 어느 화면에서나 상단 고정!) */}
          {quickTimer.active && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-[#2B1713] via-[#1E1418] to-[#161722] border-t border-[#FF5A36]/35 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    quickTimer.paused ? "bg-amber-400" : "bg-[#FF5A36] animate-pulse"
                  }`}
                />
                <span className="font-mono text-sm font-black text-white shrink-0">
                  {formatTimerClock(quickTimer.elapsedSeconds)}
                </span>
                <span className="text-xs font-bold text-slate-300 truncate">
                  {quickTimer.topicTitle}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleQuickTimerPause}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.1] hover:bg-white/[0.18] text-xs font-black text-white flex items-center gap-1 transition"
                >
                  {quickTimer.paused ? (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>재개</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>일시정지</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="px-2.5 py-1 rounded-lg bg-[#FF5A36] hover:bg-[#FF6E4E] text-xs font-black text-white flex items-center gap-1 transition"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>저장</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* 전역 토스트 알림 */}
        {shellToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[75] max-w-[420px] w-[92%] px-4 py-2.5 rounded-2xl bg-[#1D2030] border border-[#FF5A36]/45 text-xs font-bold text-white shadow-2xl text-center">
            {shellToast}
          </div>
        )}

        {/* ③ 본문 스크롤 영역 (FAB + 바텀 탭 여백 넉넉히 확보) */}
        <main className="flex-1 flex flex-col pb-28">{children}</main>

        {/* ④ 우하단 컨텍스트 플로팅 버튼 (FAB +) — 수험생 모드 전용 */}
        {!isProShell && (
          <div
            className={`fixed bottom-[78px] left-1/2 -translate-x-1/2 w-full pointer-events-none z-40 px-4 flex justify-end ${
              isWideView ? "max-w-6xl" : "max-w-[460px]"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsFabOpen(true)}
              className="pointer-events-auto w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl bg-gradient-to-br from-[#FF5A36] to-[#FF3D68] hover:brightness-110 active:scale-95 text-white shadow-[0_8px_24px_rgba(255,90,54,0.45)] border border-white/20 flex items-center justify-center transition"
              aria-label="빠른 실행 메뉴 열기"
              title="타이머 · 1초 꼬리물기 · 실물 책 스캔"
            >
              <Plus className="w-6 h-6 stroke-[2.75]" />
            </button>
          </div>
        )}

        {/* ⑤ 하단 네이티브 5탭 네비게이션 (64px + Safe Area) */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t border-white/[0.08] backdrop-blur-2xl pb-safe transition-all duration-300 ${
            isProShell ? "bg-[#0D1426]/95" : "bg-[#15161E]/95"
          } ${isWideView ? "max-w-6xl" : "max-w-[460px]"}`}
        >
          {isProShell ? (
            /* 현직 소장Pro 5탭 */
            <div className="grid grid-cols-5 items-center px-1 pt-2 pb-1">
              {[
                { href: "/pro", label: "단지홈", icon: Building2, active: isProHomeTab },
                { href: "/pro/legal", label: "법정일정", icon: ShieldAlert, active: isProLegalTab },
                { href: "/pro/docs", label: "입대의", icon: FileText, active: isProDocsTab },
                {
                  href: "/pro/predict",
                  label: "브리핑",
                  icon: TrendingUp,
                  active: isProPredictTab,
                },
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
                    className={`flex flex-col items-center justify-center gap-1 min-h-[46px] rounded-xl transition ${
                      item.active ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-extrabold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* 제로베이스 Power J × Second Brain 5탭: 타이머 · 플래너 · 통계(3번) · 문제 · 그룹 */
            <div className="grid grid-cols-5 items-center px-1 pt-2 pb-1">
              {[
                { href: "/", label: "타이머", icon: Clock, active: isTimerTab },
                {
                  href: "/study/planner",
                  label: "플래너",
                  icon: TableProperties,
                  active: isPlannerTab,
                },
                {
                  href: "/study/stats",
                  label: "통계",
                  icon: BarChart3,
                  active: isStatsTab,
                },
                {
                  href: "/study/solve",
                  label: "문제",
                  icon: ListChecks,
                  active: isPracticeTab,
                },
                {
                  href: "/study/more?tab=group",
                  label: "그룹",
                  icon: Users,
                  active: isGroupTab,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 min-h-[46px] rounded-xl transition ${
                      item.active ? "text-[#FF5A36]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${item.active ? "stroke-[2.5]" : ""}`} />
                    <span className="text-[11px] font-extrabold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* ============================================================ */}
        {/* ⑥ 좌측 ☰ 햄버거 슬라이드 드로어 (서재·소장Pro·지갑·가독성)   */}
        {/* ============================================================ */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex justify-start"
            onClick={() => setIsMenuOpen(false)}
          >
            <aside
              className="w-[84%] max-w-[340px] h-full bg-[#13141D] border-r border-white/[0.1] flex flex-col shadow-2xl pt-safe pb-safe overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 드로어 헤더 */}
              <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-white">
                    <span className="text-[#FF5A36]">HP</span> Housing-Pro
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-[11px] font-bold text-slate-300">
                    {dDayLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-5 flex-1">
                {/* 1. 수험생 ↔ 현직 소장Pro 모드 스위처 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black text-slate-400 px-0.5">
                    워크스페이스 모드 전환
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0C0D13] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode(false)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                        !isProShell
                          ? "bg-[#FF5A36] text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>수험생 모드</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode(true)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                        isProShell
                          ? "bg-sky-600 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>현직 소장Pro</span>
                    </button>
                  </div>
                </div>

                {/* 2. 계정 · PosMul 지갑 요약 */}
                {isLoggedIn ? (
                  <div className="p-3.5 rounded-2xl bg-[#1A1C28] border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-black text-white truncate">
                          {profile.displayName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-mono font-black shrink-0">
                        {pmpBalance.toLocaleString()} PMP
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void signOut();
                      }}
                      className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-rose-950/60 text-xs font-bold text-slate-300 hover:text-rose-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(pathname || "/")}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full p-3.5 rounded-2xl bg-[#FF5A36]/15 hover:bg-[#FF5A36]/25 border border-[#FF5A36]/40 flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="text-sm font-black text-white">PosMul 계정 로그인</div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        회독·암기법 투표·순공 기록 영구 동기화
                      </div>
                    </div>
                    <LogIn className="w-5 h-5 text-[#FF8A70] shrink-0" />
                  </Link>
                )}

                {/* 3. 내 서재 & 실물 책 연동 */}
                <div className="space-y-1">
                  <div className="text-[11px] font-black text-slate-400 px-1 mb-1">
                    내 서재 · 학습 도구
                  </div>
                  {[
                    {
                      href: "/study/more?tab=library",
                      label: "내 서재 · 교재 책장 관리",
                      icon: Library,
                    },
                    {
                      href: "/study/books",
                      label: "69단원 개념 · 이론서",
                      icon: BookOpen,
                    },
                    {
                      href: "/scan",
                      label: "실물 책 바코드 · 목차 스캔",
                      icon: Camera,
                    },
                    {
                      href: "/study/ox",
                      label: "스피드 O/X · 개정법령 집중",
                      icon: Zap,
                    },
                  ].map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <Link
                        key={nav.href}
                        href={nav.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.06] text-sm font-bold text-slate-100 transition"
                      >
                        <Icon className="w-4 h-4 text-[#FF8A70] shrink-0" />
                        <span>{nav.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* 4. 커뮤니티 & PosMul 지갑 */}
                <div className="space-y-1">
                  <div className="text-[11px] font-black text-slate-400 px-1 mb-1">
                    스터디 · PosMul 리워드
                  </div>
                  {[
                    {
                      href: "/study/more?tab=group",
                      label: "스터디 그룹 · 랭킹",
                      icon: Users,
                    },
                    {
                      href: "/study/more?tab=wallet",
                      label: "PosMul 지갑 · 포인트",
                      icon: Coins,
                    },
                  ].map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <Link
                        key={nav.href}
                        href={nav.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.06] text-sm font-bold text-slate-100 transition"
                      >
                        <Icon className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{nav.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* 5. 화면 가독성 설정 */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={toggleLargeFont}
                    className="w-full p-3.5 rounded-2xl bg-[#1A1B26] border border-white/[0.08] flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <Type className="w-4 h-4 text-sky-300 shrink-0" />
                      <div>
                        <div className="text-sm font-black text-white">글자 크게 보기</div>
                        <div className="text-xs text-slate-400">
                          장시간 공부 시 눈 편한 112% 확대
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        largeFont
                          ? "bg-[#FF5A36] text-white"
                          : "bg-white/[0.08] text-slate-400"
                      }`}
                    >
                      {largeFont ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ============================================================ */}
        {/* ➕ 우하단 스마트 FAB 바텀시트 (실물 책 연동 4대 퀵 액션)     */}
        {/* ============================================================ */}
        {isFabOpen && (
          <div
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setIsFabOpen(false)}
          >
            <div
              className="w-full max-w-[460px] rounded-t-3xl bg-[#161722] border-t border-x border-white/[0.12] p-4 pb-safe space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-black text-white">빠른 실행 · 실물 책 연동</h2>
                  <p className="text-xs text-slate-400">
                    종이책 보다가 1초 만에 타이머·꼬리물기·스캔 실행
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFabOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300"
                  aria-label="빠른 실행 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 현재 탭 최우선 추천 액션 */}
              {(() => {
                const PrimaryIcon = contextFabAction.icon;
                return (
                  <button
                    type="button"
                    onClick={contextFabAction.onClick}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#FF5A36]/25 to-[#FF3D68]/20 border border-[#FF5A36]/50 text-left flex items-center gap-3.5 transition hover:brightness-110"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0">
                      <PrimaryIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {contextFabAction.label}
                      </div>
                      <div className="text-xs text-orange-100/80 mt-0.5">
                        {contextFabAction.sub}
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* 공통 4대 실물 책 퀵 액션 그리드 */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    if (!quickTimer.active) {
                      startQuickTimer();
                      showToast("집중 타이머가 시작되었습니다!");
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-[#1E202E] hover:bg-[#262839] border border-white/[0.08] text-left space-y-1.5 transition"
                >
                  <Clock className="w-5 h-5 text-[#FF8A70]" />
                  <div className="text-sm font-black text-white">
                    {quickTimer.active ? "타이머 실행 중" : "타이머 시작"}
                  </div>
                  <div className="text-xs text-slate-400">어느 탭에서도 측정 유지</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    openSpotlight();
                  }}
                  className="p-3.5 rounded-2xl bg-[#1E202E] hover:bg-[#262839] border border-white/[0.08] text-left space-y-1.5 transition"
                >
                  <Search className="w-5 h-5 text-sky-300" />
                  <div className="text-sm font-black text-white">1초 꼬리물기</div>
                  <div className="text-xs text-slate-400">개념·대조표·암기법 검색</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    router.push("/scan");
                  }}
                  className="p-3.5 rounded-2xl bg-[#1E202E] hover:bg-[#262839] border border-white/[0.08] text-left space-y-1.5 transition"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  <div className="text-sm font-black text-white">실물 책 스캔</div>
                  <div className="text-xs text-slate-400">바코드 · 목차 · 문제 촬영</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    router.push("/study/planner");
                  }}
                  className="p-3.5 rounded-2xl bg-[#1E202E] hover:bg-[#262839] border border-white/[0.08] text-left space-y-1.5 transition"
                >
                  <TableProperties className="w-5 h-5 text-violet-300" />
                  <div className="text-sm font-black text-white">회독 체크</div>
                  <div className="text-xs text-slate-400">플래너 매트릭스 바로가기</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
