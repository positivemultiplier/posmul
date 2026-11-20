"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ListChecks, Zap } from "lucide-react";

/**
 * 하단 '문제' 탭 전용 1줄 3세그먼트 통합 내비게이션
 * - 기출 5지선다 (/study/solve) | 스피드 O/X (/study/ox) | 이론·키워드 (/study/books)
 */
export function PracticeHubTabs() {
  const pathname = usePathname();
  const isSolve = pathname.startsWith("/study/solve");
  const isOx = pathname.startsWith("/study/ox");
  const isBooks = pathname.startsWith("/study/books");

  return (
    <div className="px-3.5 pt-3 pb-1">
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#181922] border border-white/[0.08]">
        <Link
          href="/study/solve"
          className={`min-h-[38px] px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            isSolve
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5 shrink-0" />
          <span>기출 5지선다</span>
        </Link>

        <Link
          href="/study/ox"
          className={`min-h-[38px] px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            isOx
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>스피드 O/X</span>
        </Link>

        <Link
          href="/study/books"
          className={`min-h-[38px] px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
            isBooks
              ? "bg-[#FF5A36] text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>이론·키워드</span>
        </Link>
      </div>
    </div>
  );
}
