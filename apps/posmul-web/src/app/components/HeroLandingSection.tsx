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
        <div className="space-y-4 sm:space-y-5">
          {/* 1. 오늘의 당신은 과거 수많은 \n 선택의 합입니다. (글자 짤림 방지 및 반응형 튜닝) */}
          <h1 className="text-2xl sm:text-3xl md:text-[38px] lg:text-[44px] font-black text-white tracking-tight leading-snug sm:leading-tight break-keep">
            <span className="block mb-1 sm:mb-2">오늘의 당신은 과거 수많은</span>
            <span className="inline-flex items-center gap-1.5 flex-wrap justify-center">
              <span className="relative inline-block px-2.5 py-0.5 rounded-xl bg-blue-500/15 border border-blue-400/50 text-blue-400 font-black shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                선택
              </span>
              <span className="whitespace-nowrap">의 합입니다.</span>
            </span>
          </h1>

          {/* 2. 지난 선택들에 후회는 없으신가요? (회색, 아주 작게, 선택 강조) */}
          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
            지난{" "}
            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-400/40 text-blue-400 font-bold shadow-[0_0_10px_rgba(59,130,246,0.25)]">
              선택
            </span>
            들에{" "}
            <span className="text-slate-300 border-b border-rose-500/70 pb-0.5 whitespace-nowrap">
              후회는 없으신가요?
            </span>
          </p>

          {/* 3. 합리적 선택은 타고나는 것이 아니라, \n 훈련 되는 것입니다. (선택, 훈련 강조, 줄바꿈 최적화) */}
          <div className="pt-2 sm:pt-3">
            <p className="text-lg sm:text-2xl md:text-[28px] font-black text-slate-100 leading-snug break-keep">
              <span className="inline-flex items-center gap-1.5 flex-wrap justify-center mb-1">
                <span>합리적</span>
                <span className="relative inline-block px-2 py-0.5 rounded-xl bg-blue-500/15 border border-blue-400/50 text-blue-400 font-black shadow-[0_0_16px_rgba(59,130,246,0.3)]">
                  선택
                </span>
                <span className="whitespace-nowrap">은 타고나는 것이 아니라,</span>
              </span>
              <br className="hidden sm:inline" />
              <span className="inline-flex items-center gap-1.5 flex-wrap justify-center mt-1 sm:mt-0">
                <span className="relative inline-block px-3 py-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border-2 border-emerald-400/60 text-emerald-300 font-black shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-pulse">
                  훈련
                </span>
                <span className="whitespace-nowrap">되는 것입니다.</span>
              </span>
            </p>
          </div>
        </div>

        {/* 4 & 5. 바디 설명 및 브랜드 슬로건 */}
        <div className="max-w-2xl mx-auto pt-2 space-y-2">
          {/* 4. 세상의 흐름을 예측하고 올바른곳에 가치를 흘려보내는 훈련 (회색, 아주 작게, 훈련 강조) */}
          <p className="text-xs sm:text-sm text-slate-400 font-normal tracking-wide break-keep">
            세상의 흐름을 예측하고 올바른 곳에 가치를 흘려보내는{" "}
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]">
              훈련
            </span>
            ,
          </p>

          {/* 5. PosMul(긍정승수)에서 지금 시작하세요. */}
          <p className="text-base sm:text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 tracking-wide">
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

        {/* 3단계 핵심 루프 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          {/* 1. PMP 적립 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-400 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/50">
                PMP 적립
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-white">무료 활동 포인트 (PMP)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              돈을 쓰지 않고 뉴스를 읽고, 퀴즈를 풀고, 커뮤니티에서 소통하며 포인트를 모읍니다.
            </p>
          </div>

          {/* 2. 실시간 예측 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/50">
                실시간 예측
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-white">사회·경제 트렌드 예측</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              금리, 주가, 스포츠, 문화 이슈 등 세상의 흐름을 예측하며 내 안목을 시험합니다.
            </p>
          </div>

          {/* 3. PMC 리워드 & 기부 */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-purple-400 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/50">
                PMC 리워드
              </span>
              <HeartHandshake className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-black text-white">상금풀 보상 & 가치 후원</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              예측 적중 시 상금풀에서 PMC를 획득하여, 원하는 공익 프로젝트와 지역사회에 후원합니다.
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
            <span>참여 시민:</span>
            <strong className="text-white font-bold">{totalUsers.toLocaleString()}명</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

