"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  TableProperties,
  BarChart3,
  BookOpen,
  LayoutGrid,
  Smartphone,
  Monitor,
  Flame,
  Wifi,
  BatteryCharging,
  ShieldCheck,
  Building2,
  ShieldAlert,
  FileText,
  TrendingUp,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { setSavedPersonaMode } from "@/lib/pro-workspace-store";

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

  // 경로 기반 + prop 기반 소장Pro 모드 판별
  const isProShell = pathname.startsWith("/pro") || isProMode;

  // 수험생 바텀 5탭 활성화
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isTimerTab = pathname === "/" && !isProShell;
  const isStatsTab = pathname.startsWith("/study/stats");
  const isBooksTab = pathname.startsWith("/study/books");
  const isMoreTab =
    pathname.startsWith("/study/more") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/study/ox");

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
        } ${isWideView ? "max-w-6xl" : "max-w-[440px]"}`}
      >
        {/* 상단 상태바 (Status Bar) */}
        <div
          className={`sticky top-0 z-30 px-4 py-2 flex items-center justify-between text-[11px] font-bold border-b border-white/[0.06] backdrop-blur-xl ${
            isProShell ? "bg-[#0B111E]/95" : "bg-[#121216]/95"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono tracking-tight text-slate-200 shrink-0">09:41</span>
            {isProShell ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-indigo-950/90 text-sky-300 border border-sky-500/30 truncate">
                <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">소장Pro 실무 · PosMul 연동</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30 truncate">
                <Flame className="w-2.5 h-2.5 fill-current animate-pulse shrink-0" />
                <span className="truncate">
                  {activeStudyCount.toLocaleString()}명 열공중
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 수험 <-> 소장Pro 모드 전환 */}
            <button
              type="button"
              onClick={() => handleSwitchMode(!isProShell)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition border ${
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

            {/* 모바일뷰 / 와이드뷰 토글 */}
            <button
              type="button"
              onClick={() => setIsWideView((prev) => !prev)}
              className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
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

            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <Wifi className="w-3 h-3" />
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 flex flex-col pb-24">{children}</div>

        {/* ============================================================ */}
        {/* 듀얼 바텀 5탭 네비게이션 (소장Pro vs 수험생 완전 분리) */}
        {/* ============================================================ */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t border-white/[0.08] backdrop-blur-2xl transition-all duration-300 ${
            isProShell ? "bg-[#0D1426]/95" : "bg-[#18181D]/95"
          } ${isWideView ? "max-w-6xl" : "max-w-[440px]"}`}
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
            /* 수험생 전용 5탭: 플래너 · 타이머 · 통계 · 교재 · 더보기 */
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
                href="/study/stats"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isStatsTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">통계</span>
              </Link>

              <Link
                href="/study/books"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isBooksTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">교재</span>
              </Link>

              <Link
                href="/study/more"
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isMoreTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">더보기</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
