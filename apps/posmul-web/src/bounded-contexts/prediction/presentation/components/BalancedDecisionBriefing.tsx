"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Cpu,
  Info,
  Layers,
  Scale,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { getBalancedBriefingAction } from "../../../../app/prediction/components/prediction-briefing.actions";
import type {
  BalancedBriefingDTO,
  OptionScenarioBriefing,
  ScenarioTone,
} from "../../domain/value-objects/briefing.types";

interface BalancedDecisionBriefingProps {
  gameId: string;
  gameTitle?: string;
}

const TONE_STYLE: Record<
  ScenarioTone,
  {
    tabActive: string;
    panelBg: string;
    badgeBg: string;
    headingText: string;
    dotBg: string;
    icon: React.ReactNode;
  }
> = {
  bull: {
    tabActive: "bg-blue-950 text-blue-200 shadow-md border border-blue-700/80",
    panelBg: "bg-blue-950/25 border-blue-800/50",
    badgeBg: "bg-blue-900/80 text-blue-200 border-blue-700",
    headingText: "text-blue-200",
    dotBg: "bg-blue-400",
    icon: <TrendingUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
  },
  bear: {
    tabActive: "bg-rose-950 text-rose-200 shadow-md border border-rose-700/80",
    panelBg: "bg-rose-950/25 border-rose-800/50",
    badgeBg: "bg-rose-900/80 text-rose-200 border-rose-700",
    headingText: "text-rose-200",
    dotBg: "bg-rose-400",
    icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
  },
  neutral: {
    tabActive: "bg-amber-950/80 text-amber-200 shadow-md border border-amber-700/80",
    panelBg: "bg-amber-950/20 border-amber-800/50",
    badgeBg: "bg-amber-900/70 text-amber-200 border-amber-700",
    headingText: "text-amber-200",
    dotBg: "bg-amber-400",
    icon: <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  },
  darkhorse: {
    tabActive: "bg-purple-950/80 text-purple-200 shadow-md border border-purple-700/80",
    panelBg: "bg-purple-950/25 border-purple-800/50",
    badgeBg: "bg-purple-900/80 text-purple-200 border-purple-700",
    headingText: "text-purple-200",
    dotBg: "bg-purple-400",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
  },
};

function getModeHeadline(mode: BalancedBriefingDTO["mode"]): {
  subtitle: string;
  description: string;
} {
  switch (mode) {
    case "WIN_DRAW_LOSE":
      return {
        subtitle: "3방향 균형 분석 · 중립 팩트 및 결과별 시나리오",
        description:
          "양 팀의 승패 변수뿐 아니라 무승부·동결이 나타나는 제3의 전개 조건까지 입체적으로 비교합니다.",
      };
    case "RANKING":
      return {
        subtitle: "다구간·랭킹 분포 매트릭스 · 선택지별 성립 조건",
        description:
          "현재 기준선 대비 각 구간·후보가 적중할 조건과 시장이 간과하기 쉬운 변동성 변수를 비교합니다.",
      };
    default:
      return {
        subtitle: "양자택일 대조 분석 · 중립 팩트 및 양측 핵심 논거",
        description:
          "한쪽 확증편향을 줄이기 위해 중립 기준선과 양측 시나리오의 핵심 촉매·리스크를 대조합니다.",
      };
  }
}

function NeutralFactSheet({
  briefing,
}: {
  briefing: BalancedBriefingDTO;
}) {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-slate-950/75 border border-slate-800/80 text-xs">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-sky-400 tracking-wider uppercase">
            Official Fact Check
          </span>
          <h4 className="text-sm font-extrabold text-white">
            {briefing.neutralFacts.title}
          </h4>
          <p className="text-slate-300/90 leading-relaxed whitespace-pre-line">
            {briefing.neutralFacts.description}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-700 shrink-0 self-start">
          출처: {briefing.neutralFacts.source}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold">현재 기준선</span>
          <div className="text-xs sm:text-sm font-black text-amber-300 leading-snug">
            {briefing.neutralFacts.currentValue}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold">시장 맥락·추이</span>
          <div className="text-xs font-bold text-slate-200 leading-snug">
            {briefing.neutralFacts.historicalContext}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/85 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold">마감·정산 일정</span>
          <div className="text-xs font-bold text-slate-200 leading-snug">
            {briefing.neutralFacts.officialSchedule}
          </div>
        </div>
      </div>

      {briefing.tailRiskNote && (
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-start gap-2 text-[11px] text-purple-200">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-purple-300 mr-1.5">
              주의 변수 · 꼬리위험:
            </span>
            <span>{briefing.tailRiskNote}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioDetailPanel({
  scenario,
}: {
  scenario: OptionScenarioBriefing;
}) {
  const style = TONE_STYLE[scenario.tone] ?? TONE_STYLE.neutral;

  return (
    <div className={`space-y-3 p-5 rounded-2xl border text-xs ${style.panelBg}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-black border ${style.badgeBg}`}
        >
          {scenario.stanceTag}
        </span>
        <h4 className={`text-sm font-extrabold ${style.headingText}`}>
          {scenario.optionLabel}
        </h4>
      </div>

      <p className="text-slate-100/90 font-medium leading-relaxed">
        {scenario.coreThesis}
      </p>

      {scenario.probabilityCue && (
        <div className="text-[11px] text-slate-300 bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800/80">
          <span className="font-bold text-amber-300 mr-1">트리거 조건:</span>
          {scenario.probabilityCue}
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        {scenario.arguments.map((arg, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1.5"
          >
            <div className={`font-extrabold flex items-center gap-1.5 ${style.headingText}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dotBg}`} />
              <span>{arg.point}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {arg.detail}
            </p>
            {arg.triggerCondition && (
              <div className="pt-1 border-t border-slate-800/70 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">확인 지표: </span>
                {arg.triggerCondition}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingMatrixPanel({
  briefing,
}: {
  briefing: BalancedBriefingDTO;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {briefing.scenarios.map((scenario) => {
          const style = TONE_STYLE[scenario.tone] ?? TONE_STYLE.neutral;
          return (
            <div
              key={scenario.optionId}
              className={`p-4 rounded-2xl border space-y-2.5 text-xs ${style.panelBg}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {style.icon}
                  <h4 className={`font-black text-sm truncate ${style.headingText}`}>
                    {scenario.optionLabel}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${style.badgeBg}`}
                >
                  {scenario.stanceTag}
                </span>
              </div>

              <p className="text-slate-200 leading-relaxed">
                {scenario.coreThesis}
              </p>

              {scenario.probabilityCue && (
                <div className="text-[11px] text-amber-200/90 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                  조건: {scenario.probabilityCue}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                {scenario.arguments.slice(0, 2).map((arg, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1"
                  >
                    <div className="font-bold text-slate-200 text-[11px]">
                      • {arg.point}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {arg.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {briefing.tailRiskNote && (
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-start gap-2 text-xs text-purple-200">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-purple-300 mr-1.5">
              꼬리위험 · 다크호스 체크:
            </span>
            <span>{briefing.tailRiskNote}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function BalancedDecisionBriefing({
  gameId,
}: BalancedDecisionBriefingProps) {
  const [briefing, setBriefing] = useState<BalancedBriefingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("neutral");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setActiveTab("neutral");

    getBalancedBriefingAction(gameId)
      .then((res) => {
        if (mounted && res.success && res.briefing) {
          setBriefing(res.briefing);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [gameId]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
        LG EXAONE · Gemini가 게임 유형에 맞춘 균형 의사결정 브리핑을 생성 중입니다...
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  const headline = getModeHeadline(briefing.mode);
  const selectedScenario = briefing.scenarios.find((s) => s.optionId === activeTab);

  return (
    <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* 상단 헤더 (완독 PMP 보상 요소 완전 제거) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
              <Scale className="w-3 h-3 text-indigo-400" />
              <span>AI 균형 의사결정 브리핑</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-700/70 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>{briefing.providerBadge}</span>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {headline.subtitle}
          </h3>
          <p className="text-xs text-slate-400">{headline.description}</p>
        </div>
      </div>

      {/* 유형별 탭/뷰 네비게이션 */}
      {briefing.mode === "RANKING" ? (
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("neutral")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "neutral"
                ? "bg-slate-800 text-white shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>⚖️ 기준선 & 분포 팩트</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "matrix"
                ? "bg-indigo-950 text-indigo-200 shadow-md border border-indigo-700/80"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>📊 선택지 {briefing.scenarios.length}개 비교</span>
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold ${
            briefing.mode === "WIN_DRAW_LOSE"
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-3"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("neutral")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "neutral"
                ? "bg-slate-800 text-white shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">⚖️ 중립 팩트</span>
          </button>

          {briefing.scenarios.map((scenario) => {
            const style = TONE_STYLE[scenario.tone] ?? TONE_STYLE.neutral;
            const isSelected = activeTab === scenario.optionId;
            return (
              <button
                type="button"
                key={scenario.optionId}
                onClick={() => setActiveTab(scenario.optionId)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? style.tabActive
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {style.icon}
                <span className="truncate">{scenario.optionLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 본문 콘텐츠 */}
      {activeTab === "neutral" && <NeutralFactSheet briefing={briefing} />}
      {briefing.mode === "RANKING" && activeTab === "matrix" && (
        <RankingMatrixPanel briefing={briefing} />
      )}
      {briefing.mode !== "RANKING" && selectedScenario && (
        <ScenarioDetailPanel scenario={selectedScenario} />
      )}

      {/* 하단 AI 오라클 인사이트 */}
      <div className="pt-3 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
        <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="italic leading-relaxed">
          <strong className="text-slate-200 not-italic mr-1">
            AI 오라클 인사이트:
          </strong>
          {briefing.aiInsight}
        </p>
      </div>
    </div>
  );
}
