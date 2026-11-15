"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

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
  const [isWideView, setIsWideView] = useState(false);

  // 하단 5탭 활성화 판별: 플래너 · 타이머 · 통계 · 교재 · 더보기
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isTimerTab = pathname === "/" && !isProMode;
  const isStatsTab = pathname.startsWith("/study/stats");
  const isBooksTab = pathname.startsWith("/study/books");
  const isMoreTab =
    pathname.startsWith("/study/more") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/study/ox");
  const isProTab = pathname === "/" && isProMode;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center">
      {/* 앱 프레임 컨테이너 (기본 440px 모바일 앱 뷰 / 토글 시 와이드 뷰) */}
      <div
        className={`w-full min-h-screen flex flex-col relative transition-all duration-300 border-x border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
          isProTab ? "bg-[#0B111E]" : "bg-[#121216]"
        } ${isWideView ? "max-w-6xl" : "max-w-[440px]"}`}
      >
        {/* 모바일 상단 상태바 (Status Bar) */}
        <div
          className={`sticky top-0 z-30 px-4 py-2 flex items-center justify-between text-[11px] font-bold border-b border-white/[0.06] backdrop-blur-xl ${
            isProTab ? "bg-[#0B111E]/95" : "bg-[#121216]/95"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono tracking-tight text-slate-200 shrink-0">09:41</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 truncate ${
                isProTab
                  ? "bg-indigo-950/90 text-indigo-300 border border-indigo-500/30"
                  : "bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30"
              }`}
            >
              <Flame className="w-2.5 h-2.5 fill-current animate-pulse shrink-0" />
              <span className="truncate">
                {isProTab
                  ? "소장 실무 코파일럿"
                  : `${activeStudyCount.toLocaleString()}명 열공중`}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 소장Pro 빠른 전환 (어느 화면에서도 진입/복귀 가능) */}
            {onSelectProMode && pathname === "/" ? (
              <button
                type="button"
                onClick={() => onSelectProMode(!isProMode)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 transition border ${
                  isProMode
                    ? "bg-indigo-600 text-white border-indigo-400/50"
                    : "bg-white/[0.06] hover:bg-white/[0.12] text-indigo-300 border-indigo-500/30"
                }`}
                title="수험 / 현직 소장Pro 모드 전환"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{isProMode ? "수험복귀" : "소장Pro"}</span>
              </button>
            ) : (
              <Link
                href="/?mode=pro"
                className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-indigo-300 border border-indigo-500/30 text-[10px] font-black flex items-center gap-1 transition"
                title="현직 소장Pro 모드"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>소장Pro</span>
              </Link>
            )}

            {/* 모바일뷰 / 와이드뷰 토글 */}
            <button
              type="button"
              onClick={() => setIsWideView((prev) => !prev)}
              className="px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
              title="화면 너비 전환 (매트릭스 넓게 보기)"
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

        {/* 하단 고정 5탭 네비게이션 바: 플래너 -> 타이머 -> 통계 -> 교재 -> 더보기 */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t border-white/[0.08] backdrop-blur-2xl transition-all duration-300 ${
            isProTab ? "bg-[#0D1322]/95" : "bg-[#18181D]/95"
          } ${isWideView ? "max-w-6xl" : "max-w-[440px]"}`}
        >
          <div className="grid grid-cols-5 items-center px-1.5 py-2">
            {/* 1. 플래너 */}
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

            {/* 2. 타이머 */}
            {onSelectProMode && pathname === "/" ? (
              <button
                type="button"
                onClick={() => onSelectProMode(false)}
                className={`flex flex-col items-center gap-1 py-1 rounded-xl transition ${
                  isTimerTab
                    ? "text-[#FF5A36]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">타이머</span>
              </button>
            ) : (
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
            )}

            {/* 3. 통계 */}
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

            {/* 4. 교재 */}
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

            {/* 5. 더보기 (할일 · 달력 · 그룹 · AI스캔 · O/X) */}
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
        </nav>
      </div>
    </div>
  );
}
