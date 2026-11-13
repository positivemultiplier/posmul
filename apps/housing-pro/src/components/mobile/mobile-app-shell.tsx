"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Calendar,
  Camera,
  Zap,
  ShieldCheck,
  Smartphone,
  Monitor,
  Flame,
  Wifi,
  BatteryCharging,
} from "lucide-react";

interface MobileAppShellProps {
  children: React.ReactNode;
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

  // 현재 탭 판별
  const isTimerTab = pathname === "/" && !isProMode;
  const isPlannerTab = pathname.startsWith("/study/planner");
  const isScanTab = pathname.startsWith("/scan");
  const isOxTab = pathname.startsWith("/study/ox");
  const isProTab = pathname === "/" && isProMode;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center">
      {/* 🧭 앱 프레임 컨테이너 (기본 440px 모바일 앱 뷰 / 토글 시 와이드 뷰) */}
      <div
        className={`w-full min-h-screen flex flex-col relative transition-all duration-300 border-x border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] ${
          isProTab ? "bg-[#0B111E]" : "bg-[#121216]"
        } ${isWideView ? "max-w-5xl" : "max-w-[440px]"}`}
      >
        {/* 📱 모바일 상단 상태바 (Status Bar) */}
        <div
          className={`sticky top-0 z-30 px-4 py-2 flex items-center justify-between text-[11px] font-bold border-b border-white/[0.06] backdrop-blur-xl ${
            isProTab ? "bg-[#0B111E]/95" : "bg-[#121216]/95"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono tracking-tight text-slate-200">09:41</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                isProTab
                  ? "bg-indigo-950/90 text-indigo-300 border border-indigo-500/30"
                  : "bg-[#FF5A36]/15 text-[#FF7A59] border border-[#FF5A36]/30"
              }`}
            >
              <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
              <span>
                {isProTab
                  ? "소장 실무 코파일럿"
                  : `${activeStudyCount.toLocaleString()}명 열공중`}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
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
                  <span>모바일뷰</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3 h-3 text-slate-400" />
                  <span>와이드</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-1 text-slate-400">
              <Wifi className="w-3 h-3" />
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* 📱 본문 스크롤 영역 (하단 5탭 바 높이 확보 pb-24) */}
        <div className="flex-1 flex flex-col pb-24">{children}</div>

        {/* 📲 하단 고정 5탭 네비게이션 바 (Bottom Tab Bar, z-40) */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-40 border-t border-white/[0.08] backdrop-blur-2xl transition-all duration-300 ${
            isProTab ? "bg-[#0D1322]/95" : "bg-[#18181D]/95"
          } ${isWideView ? "max-w-5xl" : "max-w-[440px]"}`}
        >
          <div className="grid grid-cols-5 items-end px-2 pt-1.5 pb-2.5 relative">
            {/* 탭 1: 타이머 */}
            {onSelectProMode && pathname === "/" ? (
              <button
                type="button"
                onClick={() => onSelectProMode(false)}
                className={`flex flex-col items-center gap-1 py-1 transition ${
                  isTimerTab ? "text-[#FF5A36]" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-bold">타이머</span>
              </button>
            ) : (
              <Link
                href="/"
                className={`flex flex-col items-center gap-1 py-1 transition ${
                  isTimerTab ? "text-[#FF5A36]" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-bold">타이머</span>
              </Link>
            )}

            {/* 탭 2: 플래너 */}
            <Link
              href="/study/planner"
              className={`flex flex-col items-center gap-1 py-1 transition ${
                isPlannerTab ? "text-[#FF5A36]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold">플래너</span>
            </Link>

            {/* 탭 3: AI스캔 (중앙 돌출형 오렌지 플로팅 원형 버튼) */}
            <Link
              href="/scan"
              className="flex flex-col items-center -mt-6 group"
            >
              <div
                className={`w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-[#FF5A36] to-[#FF8008] flex items-center justify-center shadow-[0_6px_20px_rgba(255,90,54,0.45)] border-4 border-[#121216] group-hover:scale-105 transition ${
                  isScanTab ? "ring-2 ring-amber-300" : ""
                }`}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-[10px] font-black mt-1 ${
                  isScanTab ? "text-[#FF5A36]" : "text-slate-300"
                }`}
              >
                AI스캔
              </span>
            </Link>

            {/* 탭 4: 3초 O/X */}
            <Link
              href="/study/ox"
              className={`flex flex-col items-center gap-1 py-1 transition ${
                isOxTab ? "text-[#FF5A36]" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="text-[10px] font-bold">3초 O/X</span>
            </Link>

            {/* 탭 5: 소장Pro */}
            {onSelectProMode && pathname === "/" ? (
              <button
                type="button"
                onClick={() => onSelectProMode(true)}
                className={`flex flex-col items-center gap-1 py-1 transition ${
                  isProTab ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-bold">소장Pro</span>
              </button>
            ) : (
              <Link
                href="/?mode=pro"
                className={`flex flex-col items-center gap-1 py-1 transition ${
                  isProTab ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-bold">소장Pro</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
