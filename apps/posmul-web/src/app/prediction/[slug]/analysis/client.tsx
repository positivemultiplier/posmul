/**
 * Prediction Deep Analysis Page Client Component (/prediction/[slug]/analysis)
 * 방법 A(2계층 라우트 분리): 1차 참여 화면에서 분리된 심층 경제학 · Brier Score · 오라클 분석실
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Database,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/shared/ui/components/base";
import {
  type UserLearningProfileSummary,
} from "@/bounded-contexts/prediction/domain/services/collective-intelligence-engine";
import {
  analyzePredictionCapmAndEconomy,
} from "@/bounded-contexts/prediction/domain/services/prediction-economic-model";
import {
  getOracleSpecInfo,
  RANKING_THEMES,
  type PredictionGameDetail,
} from "../client";

interface PredictionAnalysisDetailClientProps {
  game: PredictionGameDetail;
  userBalance: { pmp: number; pmc: number };
  userLearningProfile?: UserLearningProfileSummary;
  slug: string;
}

export function PredictionAnalysisDetailClient({
  game,
  userLearningProfile,
  slug,
}: PredictionAnalysisDetailClientProps) {
  const backHref = `/prediction/${encodeURIComponent(slug || game.id)}`;
  const oracleSpec = getOracleSpecInfo(game.dataSource, game.title);

  const marketEconomy = useMemo(() => {
    return analyzePredictionCapmAndEconomy({
      options: game.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        probability: opt.probability,
        volume: opt.volume,
      })),
      totalVolume: game.totalVolume,
      participantCount: game.participantCount,
      prizePool: game.prizePool,
      gameImportance: game.collectiveIntelligence?.gameImportance,
      normalizedEntropy: game.collectiveIntelligence?.normalizedEntropy,
    });
  }, [
    game.options,
    game.totalVolume,
    game.participantCount,
    game.prizePool,
    game.collectiveIntelligence?.gameImportance,
    game.collectiveIntelligence?.normalizedEntropy,
  ]);

  const entropyPct = Math.round(
    (game.collectiveIntelligence?.normalizedEntropy ?? 0.6) * 100
  );

  return (
    <div className="min-h-screen bg-[#080d17] text-slate-100 pb-16">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-30 bg-[#080d17]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>예측 참여 화면으로 돌아가기</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/35 text-[11px] font-bold text-indigo-300">
            <Brain className="w-3.5 h-3.5" />
            <span>심층 경제학 · 오라클 분석실</span>
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 의제 요약 헤더 */}
        <div className="rounded-2xl bg-[#111622] border border-white/[0.08] p-5 space-y-2 shadow-xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-500/30">
              {game.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              {oracleSpec.badge}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">
              엔트로피 불확실성 {entropyPct}% ·{" "}
              {game.collectiveIntelligence?.isLowSampleStabilized
                ? "Prior 안정화 활성"
                : "증거 기반 수렴"}
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {game.title}
          </h1>
          <p className="text-xs text-slate-400">
            이 페이지는 CAPM 위험-수익, Agency 비대칭 해소, 베이지안 사후확률, Brier Score 학습 프로필 및 공식 오라클 판정 기준을 심층적으로 확인할 수 있는 전용 분석실입니다.
          </p>
        </div>

        {/* 1. 4대 PosMul 핵심 경제학 요약 KPI */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>시장 경제학 핵심 지표 (CAPM · Agency · Prospect)</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 bg-[#111622] border-white/[0.08]">
              <div className="text-[11px] text-slate-400 font-bold">시장 CAPM 베타 (β)</div>
              <div className="text-xl font-black text-sky-300 mt-1">
                {marketEconomy.marketBeta.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                요구수익률 E[R] +{(marketEconomy.averageRequiredReturn * 100).toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4 bg-[#111622] border-white/[0.08]">
              <div className="text-[11px] text-slate-400 font-bold">Agency 비대칭 해소</div>
              <div className="text-xl font-black text-emerald-300 mt-1">
                {marketEconomy.agencyCostReductionPct}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Jensen-Meckling 정렬 지수
              </div>
            </Card>
            <Card className="p-4 bg-[#111622] border-white/[0.08]">
              <div className="text-[11px] text-slate-400 font-bold">Prospect 손실회피</div>
              <div className="text-xl font-black text-amber-300 mt-1">
                λ 2.25 → 1.0
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                무위험 PMP 자본 보호 구조
              </div>
            </Card>
            <Card className="p-4 bg-[#111622] border-white/[0.08]">
              <div className="text-[11px] text-slate-400 font-bold">총 참여 규모</div>
              <div className="text-xl font-black text-white mt-1">
                {game.totalVolume.toLocaleString()} PMP
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                참여자 {game.participantCount.toLocaleString()}명
              </div>
            </Card>
          </div>
        </section>

        {/* 2. 옵션별 CAPM · Jensen's Alpha · 베이지안 사후확률 비교 */}
        <Card className="p-5 bg-[#111622] border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>옵션별 CAPM · Jensen&apos;s Alpha · 베이지안 사후확률</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              E[R] = Rf + β(Rm - Rf)
            </span>
          </div>

          <div className="space-y-3">
            {game.options.map((opt, idx) => {
              const theme = RANKING_THEMES[idx % RANKING_THEMES.length];
              const bayesPct = Math.round(opt.probability * 100);
              const rawPct = Math.round(
                (opt.rawVolumeProbability ?? opt.probability) * 100
              );
              const ci = opt.credibleInterval;
              const econOpt = marketEconomy.options.find(
                (o) => o.optionId === opt.id
              );
              const beta = econOpt?.capmBeta ?? opt.capmBeta ?? 1.0;
              const alphaPct = Math.round(
                (econOpt?.jensenAlpha ?? opt.jensenAlpha ?? 0) * 100
              );
              const reqReturnPct = (
                (econOpt?.capmRequiredReturn ?? opt.capmRequiredReturn ?? 0.09) *
                100
              ).toFixed(1);
              const agencyBonusPct = (
                (econOpt?.agencyExclusivityBonus ??
                  opt.agencyExclusivityBonus ??
                  0) * 100
              ).toFixed(1);

              return (
                <div
                  key={`analysis-opt-${opt.id}`}
                  className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.07] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: theme.hex }}
                      />
                      <span className="font-extrabold text-white truncate">
                        {opt.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-300 border border-white/[0.08] shrink-0">
                        β {beta.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-slate-400">단순볼륨 {rawPct}%</span>
                      <span className="font-black text-sky-300">
                        베이지안 {bayesPct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      95% 신뢰구간:{" "}
                      {ci
                        ? `${Math.round(ci[0] * 100)}% ~ ${Math.round(ci[1] * 100)}%`
                        : `${Math.max(1, bayesPct - 8)}% ~ ${Math.min(99, bayesPct + 8)}%`}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        CAPM E[R]{" "}
                        <strong className="text-slate-200">+{reqReturnPct}%</strong>
                      </span>
                      <span>
                        Alpha{" "}
                        <strong
                          className={
                            alphaPct >= 0 ? "text-emerald-300" : "text-rose-300"
                          }
                        >
                          {alphaPct >= 0 ? `+${alphaPct}%` : `${alphaPct}%`}
                        </strong>
                      </span>
                      <span>
                        Agency 독점가치{" "}
                        <strong className="text-amber-300">
                          +{agencyBonusPct}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 3. 나의 지속적 확률 학습 & Brier Score 교정 프로필 */}
        <Card className="p-5 bg-gradient-to-r from-indigo-950/35 via-[#111622] to-[#111622] border-indigo-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>나의 지속적 확률 학습 & Brier 교정 프로필</span>
            </h2>
            <span className="text-xs font-bold text-emerald-300">
              베이지안 스킬 가중치{" "}
              {(userLearningProfile?.skillWeight ?? 1.0).toFixed(2)}x
            </span>
          </div>
          {userLearningProfile && userLearningProfile.settledCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                <div className="text-[11px] text-slate-400">정산 완료</div>
                <div className="text-base font-black text-white mt-1">
                  {userLearningProfile.settledCount}건
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                <div className="text-[11px] text-slate-400">Brier 오차</div>
                <div className="text-base font-black text-sky-300 mt-1">
                  {userLearningProfile.averageBrierScore.toFixed(3)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                <div className="text-[11px] text-slate-400">실제 적중률</div>
                <div className="text-base font-black text-emerald-300 mt-1">
                  {Math.round(userLearningProfile.winRate * 100)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.06]">
                <div className="text-[11px] text-slate-400">편향 진단</div>
                <div className="text-base font-black text-amber-300 mt-1">
                  {userLearningProfile.calibrationStatus === "OVERCONFIDENT"
                    ? "과신 주의"
                    : userLearningProfile.calibrationStatus === "UNDERCONFIDENT"
                    ? "과소 신뢰"
                    : userLearningProfile.calibrationStatus === "WELL_CALIBRATED"
                    ? "균형 교정"
                    : "표본 축적"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              첫 정산 결과가 쌓이면 Brier Score(확률 예측 정밀도)와 확신도 편향(과신·과소신뢰)을 자동 측정해, 다음 마켓의 집단지성 베이지안 반영 가중치가 성장합니다.
            </p>
          )}
        </Card>

        {/* 4. 공식 오라클 판정 기준 & 정산 스펙 상세 */}
        <Card className="p-5 bg-[#111622] border-white/[0.08] space-y-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>공식 오라클 판정 기준 & 정산 스펙</span>
          </h2>
          {game.description && (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/[0.05] whitespace-pre-line">
              {game.description}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>공인 오라클 출처</span>
              </div>
              <div className="font-bold text-white">{oracleSpec.provider}</div>
              <div className="text-[11px] text-slate-400">{oracleSpec.scheduleDesc}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-1">
              <div className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>참여 마감 및 정산 예정</span>
              </div>
              <div className="font-bold text-white">
                마감: {new Date(game.endTime).toLocaleString("ko-KR")}
              </div>
              <div className="text-[11px] text-sky-400 font-semibold">
                취소·무효(VOIDED) 시 참여 PMP 100% 자동 환불
              </div>
            </div>
          </div>
        </Card>

        {/* 하단 CTA */}
        <div className="flex justify-center pt-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-sm shadow-lg shadow-sky-500/20 transition"
          >
            <span>이 분석을 바탕으로 예측 참여하러 가기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

