"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, GitCompareArrows, Zap } from "lucide-react";

/**
 * 하단 '문제' 탭 통합 1줄 3세그먼트 내비게이션
 * - 연도별 기출 (/study/solve): 연도·회차 중심 실전 기출 풀이
 * - 단원별 지식맵 (/study/graph): 단원 기준 기출 꼬리물기 · 대조표 · 개념 백과
 * - 스피드 O/X (/study/ox): 3초 컷 지문 훈련
 */
export function PracticeHubTabs() {
  const pathname = usePathname();
  const isSolve = pathname.startsWith("/study/solve");
  const isGraph = pathname.startsWith("/study/graph");
  const isOx = pathname.startsWith("/study/ox");

  return (
    <div className="px-3.5 pt-3 pb-1">
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#181922] border border-white/[0.08]">
        <Link
          href="/study/solve"
          className={`min-h-[42px] px-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition ${
            isSolve
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">연도별 기출</span>
        </Link>

        <Link
          href="/study/graph"
          className={`min-h-[42px] px-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition ${
            isGraph
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">단원별 지식맵</span>
        </Link>

        <Link
          href="/study/ox"
          className={`min-h-[42px] px-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition ${
            isOx
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">스피드 O/X</span>
        </Link>
      </div>
    </div>
  );
}
