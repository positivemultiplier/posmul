"use client";

import React, { Suspense } from "react";
import { MessageSquare, Flame, TrendingUp, Sparkles, Trophy, Award } from "lucide-react";
import { GalleryPostList } from "./components/GalleryPostList";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 상단 도메인 헤더 & 안내 */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  COMMUNITY ARENA
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  글·댓글 작성 시 +10 PMP 지급
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-blue-400" />
                <span>PosMul 이슈 갤러리</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                실시간 예측 이슈, 주식·코인 분석, 사회적 아젠다를 자유롭게 토론하고 집단지성을 형성하는 시민 공론장입니다.
              </p>
            </div>

            {/* 핫 뱃지 */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0">
                <div className="text-[10px] text-slate-500 font-bold">오늘의 개념글</div>
                <div className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>3개 이상 추천</span>
                </div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0">
                <div className="text-[10px] text-slate-500 font-bold">활동 보너스</div>
                <div className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>MoneyWave 풀 연동</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 갤러리 테이블 */}
        <Suspense
          fallback={
            <div className="p-12 text-center text-slate-500 text-xs">
              갤러리를 불러오는 중입니다...
            </div>
          }
        >
          <GalleryPostList />
        </Suspense>
      </div>
    </div>
  );
}
