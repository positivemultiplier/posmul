"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  TableProperties,
  BarChart3,
  BookOpen,
  UserCircle2,
  Smartphone,
  Monitor,
  Flame,
  ShieldCheck,
  Building2,
  ShieldAlert,
  FileText,
  TrendingUp,
  MessageSquare,
  GraduationCap,
  LogIn,
  LogOut,
  UserCheck,
} from "lucide-react";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";

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
  activeStudyCount = 1284,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isWideView, setIsWideView] = useState(false);
  const { isLoggedIn, profile, pmpBalance, signOut } = useStudyAuth();

  // 경로 기반 + prop 기반 소장Pro 모드 판별
  const isProShell = pathname.startsWith("/pro") || isProMode;

  // 파워 J 수험생 바텀 5탭 활성화 (플래너 · 타이머 · 학습 · 분석 · 마이)
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isTimerTab = pathname === "/" && !isProShell;
  const isLearnTab =
    pathname.startsWith("/study/books") ||
    pathname.startsWith("/study/solve") ||
    pathname.startsWith("/study/ox") ||
    pathname.startsWith("/study/graph") ||
    pathname.startsWith("/scan");
  const isStatsTab = pathname.startsWith("/study/stats");
  const isMyTab = pathname.startsWith("/study/more");

  // 소장Pro 바텀 5탭 활성화
  const isProHomeTab = pathname === "/pro";
  const isProLegalTab = pathname.startsWith("/pro/legal");
  const isProDocsTab = pathname.startsWith("/pro/docs");
  const isProPredictTab = pathname.startsWith("/pro/predict");
  const isProCommunityTab = pathname.startsWith("/pro/community");

  const handleSwitchMode = (targetPro: boolean) => {
    setSavedPersonaMode(targetPro ? "pro" : "student");
    if (onSelectProMode) {
      onSelectProMode(targetPro);
    }
    router.push(targetPro ? "/pro" : "/");
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center">
      {/* 듀얼 셸 앱 프레임 컨테이너 */}
      <div
        className={`w-full min-h-screen flex flex-col relative transition-all duration-300 border-x border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
          isProShell ? "bg-[#0B111E]" : "bg-[#121216]"
        } ${isWideView ? "max-w-6xl" : "max-w-[460px]"}`}
      >
        {/* 상단 슬림 글로벌 AppBar (가짜 상태바 제거, 단일 브랜드 바 통합) */}
        <div
          className={`sticky top-0 z-30 h-11 px-3.5 flex items-center justify-between gap-2 text-[11px] font-bold border-b border-white/[0.07] backdrop-blur-xl ${
            isProShell ? "bg-[#0B111E]/95" : "bg-[#121216]/95"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={isProShell ? "/pro" : "/"}
              className="text-xs font-black tracking-tight text-white shrink-0 flex items-center gap-1"
            >
              <span className={isProShell ? "text-sky-400" : "text-[#FF5A36]"}>HP</span>
              <span className="hidden xs:inline">Housing-Pro</span>
            </Link>
            {isProShell ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-indigo-950/90 text-sky-300 border border-sky-500/30 truncate">
                <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">소장Pro 실무</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30 truncate">
                <Flame className="w-2.5 h-2.5 fill-current animate-pulse shrink-0" />
                <span className="truncate">{activeStudyCount.toLocaleString()}명 열공</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 수험 <-> 소장Pro 모드 전환 */}
            <button
              type="button"
              onClick={() => handleSwitchMode(!isProShell)}
              className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition border ${
                isProShell
                  ? "bg-white/[0.06] hover:bg-white/[0.12] text-[#FF7A59] border-[#FF5A36]/30"
                  : "bg-indigo-950/80 hover:bg-indigo-900 text-sky-300 border-sky-500/30"
              }`}
              title={isProShell ? "수험생 앱으로 전환" : "현직 관리소장 Pro 앱으로 전환"}
            >
              {isProShell ? (
                <>
                  <GraduationCap className="w-3 h-3" />
                  <span>수험앱</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>소장Pro</span>
                </>
              )}
            </button>

            {/* 데스크톱 전용 와이드/모바일 뷰 토글 */}
            <button
              type="button"
              onClick={() => setIsWideView((prev) => !prev)}
              className="hidden md:flex px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-bold items-center gap-1 transition"
              title="화면 너비 전환"
            >
              {isWideView ? (
                <>
                  <Smartphone className="w-3 h-3 text-[#FF5A36]" />
                  <span>모바일</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3 h-3 text-slate-400" />
                  <span>와이드</span>
                </>
              )}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-1">
                <Link
                  href={isProShell ? "/pro" : "/study/more?tab=wallet"}
                  className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/35 text-emerald-200 text-[10px] font-black flex items-center gap-1 max-w-[110px] truncate hover:border-emerald-400 transition"
                  title={`${profile.displayName} · PosMul ${pmpBalance.toLocaleString()} PMP`}
                >
                  <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{profile.displayName}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="p-1 rounded-lg bg-white/[0.06] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition"
                  title="로그아웃"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Link
                href={`/auth/login?next=${encodeURIComponent(pathname || "/")}`}
                className="px-2.5 py-1 rounded-lg bg-[#FF5A36]/20 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/40 text-[#FF7A59] text-[10px] font-black flex items-center gap-1 transition"
                title="PosMul 계정 로그인 (개인 기록 영구 연동)"
              >
                <LogIn className="w-3 h-3" />
                <span>로그인</span>
              </Link>
            )}
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 flex flex-col pb-24">{children}</div>

        {/* ============================================================ */}
        {/* 듀얼 바텀 5탭 네비게이션 (소장Pro vs 파워J 수험생 완전 분리) */}
        {/* ============================================================ */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t border-white/[0.08] backdrop-blur-2xl transition-all duration-300 ${
            isProShell ? "bg-[#0D1426]/95" : "bg-[#16161C]/95"
          } ${isWideView ? "max-w-6xl" : "max-w-[460px]"}`}
        >
          {isProShell ? (
            /* 현직 소장Pro 전용 5탭: 단지홈 · 법정일정 · 입대의·실무 · 예측·브리핑 · 커뮤니티 */
            <div className="grid grid-cols-5 items-center px-1 py-2">
              <Link
                href="/pro"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isProHomeTab
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">단지홈</span>
              </Link>

              <Link
                href="/pro/legal"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isProLegalTab
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">법정일정</span>
              </Link>

              <Link
                href="/pro/docs"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isProDocsTab
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">입대의실무</span>
              </Link>

              <Link
                href="/pro/predict"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isProPredictTab
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">예측·브리핑</span>
              </Link>

              <Link
                href="/pro/community"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isProCommunityTab
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">커뮤니티</span>
              </Link>
            </div>
          ) : (
            /* 파워 J 수험생 PDCA 5탭: 플래너(Plan) · 타이머(Do) · 학습(Train) · 분석(Check) · 마이(Shelf/Social) */
            <div className="grid grid-cols-5 items-center px-1.5 py-2">
              <Link
                href="/study/planner"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isPlannerTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <TableProperties className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">플래너</span>
              </Link>

              <Link
                href="/"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isTimerTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">타이머</span>
              </Link>

              <Link
                href="/study/books"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isLearnTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">학습</span>
              </Link>

              <Link
                href="/study/stats"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isStatsTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">분석</span>
              </Link>

              <Link
                href="/study/more"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isMyTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCircle2 className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">마이</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
