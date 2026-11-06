"use client";

import React from "react";
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, HeartHandshake, Compass, Users } from "lucide-react";
import Link from "next/link";

interface HeroLandingSectionProps {
  totalPool: number;
  totalUsers: number;
}

export function HeroLandingSection({ totalPool, totalUsers }: HeroLandingSectionProps) {
  const scrollToMarkets = () => {
    const el = document.getElementById("featured-prediction-markets");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-14 px-4 sm:px-6 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0b0f19] to-[#07090e] border border-slate-800/80 shadow-2xl">
      {/* 배경 장식 광원 효과 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-48 h-48 bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        {/* 상단 서브 배지 */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-extrabold tracking-wide shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>AI 시대 직접민주주의 · 의사결정 트레이닝 플랫폼</span>
        </div>

        {/* 🌟 핵심 브랜드 카피 (헤드라인: '선택'과 '훈련'에 확실한 시각적 포인트) */}
        <div className="space-y-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.3]">
            오늘의 당신은 과거 수많은{" "}
            <span className="relative inline-block px-2 py-0.5 rounded-xl bg-blue-500/10 border border-blue-400/40 text-blue-400 font-black shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              선택
            </span>
            의 합입니다.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-400">
            지난 선택들에 <span className="text-slate-200 border-b-2 border-rose-500/60 pb-0.5">후회는 없으신가요?</span>
          </p>

          <div className="pt-2">
            <p className="text-xl sm:text-2xl md:text-4xl font-black text-slate-100 leading-snug">
              합리적 <span className="text-blue-400 font-black">선택</span>은 타고나는 것이 아니라,{" "}
              <br className="hidden sm:inline" />
              <span className="relative inline-block mt-1 sm:mt-0 px-3 py-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border-2 border-emerald-400/60 text-emerald-300 font-black shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-pulse">
                훈련
              </span>
              되는 것입니다.
            </p>
          </div>
        </div>

        {/* 바디 설명 */}
        <div className="max-w-2xl mx-auto pt-3 space-y-2">
          <p className="text-base sm:text-lg font-bold text-slate-200">
            세상의 흐름을 예측하고 올바른 곳에 가치를 흘려보내는{" "}
            <span className="text-emerald-400 font-extrabold underline decoration-emerald-500/50 underline-offset-4">
              훈련
            </span>
            ,
          </p>
          <p className="text-lg sm:text-xl font-black text-amber-400 tracking-wide">
            PosMul(긍정승수)에서 지금 시작하세요.
          </p>
        </div>

        {/* CTA 버튼 그룹 */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={scrollToMarkets}
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-sm shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 hover:scale-105 active:scale-95 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>첫 의사결정 훈련 시작하기 (+500 PMP)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <Link
            href="/forum"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white font-extrabold text-sm transition-all shadow-lg hover:border-slate-600"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>시민 이슈 갤러리 둘러보기</span>
          </Link>
        </div>

        {/* 3단계 훈련 루프 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          {/* STEP 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-400 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/50">
                STEP 1. 학습
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-white">무위험 참여 자산 (PMP)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              돈을 쓰지 않고 뉴스를 읽고, 퀴즈를 풀고, 갤러리에서 토론하며 활동 자본(PMP)을 모읍니다.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/50">
                STEP 2. 예측
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-white">사회 지표 집단지성 예측</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              실업률, 금리, 경제 이슈, 문화 트렌드의 결과를 예측하며 소신 있는 의사결정을 훈련합니다.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-purple-400 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/50">
                STEP 3. 환류
              </span>
              <HeartHandshake className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-black text-white">MoneyWave 가치 전환 (PMC)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              예측 적중 시 위험 자산인 PMC를 획득하여, 공공 정책 제안과 사회적 기부에 직접 집행합니다.
            </p>
          </div>
        </div>

        {/* 실시간 플랫폼 현황 요약 */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-400 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>실시간 누적 상금풀:</span>
            <strong className="text-amber-400 font-bold">{Math.round(totalPool).toLocaleString()} PMC</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>훈련 참여 시민:</span>
            <strong className="text-white font-bold">{totalUsers.toLocaleString()}명</strong>
          </div>
          <div className="text-slate-500">
            정부와 관료의 독점을 넘어, 시민 스스로 예산을 연습하는 학습장
          </div>
        </div>
      </div>
    </section>
  );
}

