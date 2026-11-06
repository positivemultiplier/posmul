"use client";

import React from "react";
import { Heart, Sparkles, TrendingUp, ShieldCheck, Award, PackageCheck, Building2 } from "lucide-react";
import { DonationPillarsView } from "./components/DonationPillarsView";

export default function DonationPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 🌟 소셜 임팩트 기부센터 v2 상단 비전 배너 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* 장식 배경 */}
          <div className="absolute top-0 right-1/4 w-72 h-36 bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30">
                  DONATION DOMAIN v2 · SOCIAL FINANCE
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  예측 성공 보상(PMC)으로 사회적 예산을 직접 집행하세요
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
                <span>PosMul 4대 소셜 임팩트 펀드</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                단순한 일방적 자선을 넘어, <strong>한국 기업의 실물 매출과 수출을 촉진(Tied Aid)</strong>하고, <strong>청년 의인에게 비과세 포상금</strong>을 수여하며, <strong>자발적 상환(Pay-it-Forward)</strong>으로 다음 세대의 꿈을 잇는 지속 가능한 경제 승수 기부 모델입니다.
              </p>
            </div>

            {/* 핵심 지표 위젯 */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-bold">누적 집행 예산</div>
                <div className="text-lg font-black text-amber-400">1,024,500 PMC</div>
                <div className="text-[9px] text-slate-500">1 PMC = 1원 가치 환류</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-bold">예산 집행 시민</div>
                <div className="text-lg font-black text-emerald-400">15,420명</div>
                <div className="text-[9px] text-emerald-500/80">직접민주주의 실천</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🏛️ 4대 기부 필러 인터랙티브 뷰 */}
        <DonationPillarsView />
      </div>
    </div>
  );
}
