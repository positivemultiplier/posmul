"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Award,
  ChevronRight,
  BookOpen,
  Newspaper,
} from "lucide-react";
import {
  BalancedBriefingDTO,
  getBalancedBriefingAction,
  claimBriefingRewardAction,
} from "../../../../app/prediction/components/prediction-briefing.actions";

interface BalancedDecisionBriefingProps {
  gameId: string;
  gameTitle: string;
  onRewardClaimed?: (pmp: number) => void;
}

export function BalancedDecisionBriefing({
  gameId,
  gameTitle,
  onRewardClaimed,
}: BalancedDecisionBriefingProps) {
  const [briefing, setBriefing] = useState<BalancedBriefingDTO | null>(null);
  const [isRewarded, setIsRewarded] = useState(false);
  const [activeTab, setActiveTab] = useState<"neutral" | "yes" | "no">("neutral");
  const [readTabs, setReadTabs] = useState<Set<string>>(new Set(["neutral"]));
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  useEffect(() => {
    getBalancedBriefingAction(gameId).then((res) => {
      if (res.success && res.briefing) {
        setBriefing(res.briefing);
        if (res.isRewarded) setIsRewarded(true);
      }
    });
  }, [gameId]);

  const handleTabChange = (tab: "neutral" | "yes" | "no") => {
    setActiveTab(tab);
    setReadTabs((prev) => new Set([...prev, tab]));
  };

  const allRead = readTabs.has("neutral") && readTabs.has("yes") && readTabs.has("no");

  const handleClaimReward = async () => {
    if (!allRead || isRewarded || isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await claimBriefingRewardAction(gameId);
      if (res.success) {
        setIsRewarded(true);
        setRewardMsg(res.message);
        onRewardClaimed?.(res.earnedPmp ?? 20);
        setTimeout(() => setRewardMsg(null), 5000);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || "보상 수령 오류");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!briefing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
        AI 균형 브리핑 데이터를 분석 중입니다...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
              <Scale className="w-3 h-3 text-indigo-400" />
              <span>AI 균형 의사결정 브리핑</span>
            </span>
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              양쪽 시각 완독 시 +20 PMP
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>편향 없는 3단 분석: 중립 팩트 · YES 논거 · NO 논거</span>
          </h3>
          <p className="text-xs text-slate-400">
            결정하기 전, 양쪽 진영의 핵심 팩트와 언론사 보도를 대조하며 합리적인 선택을 훈련하세요.
          </p>
        </div>

        {/* 완독 진행도 인디케이터 */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 text-xs shrink-0">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">학습 진행도:</span>
          <span className="font-extrabold text-blue-400">{readTabs.size} / 3</span>
          {allRead && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        </div>
      </div>

      {/* 3단 탭 셀렉터 */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
        <button
          onClick={() => handleTabChange("neutral")}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "neutral"
              ? "bg-slate-800 text-white shadow-md border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>⚖️ 중립 팩트</span>
          {readTabs.has("neutral") && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
        </button>

        <button
          onClick={() => handleTabChange("yes")}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "yes"
              ? "bg-blue-950 text-blue-300 shadow-md border border-blue-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span className="line-clamp-1">🔵 YES 논거</span>
          {readTabs.has("yes") && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
        </button>

        <button
          onClick={() => handleTabChange("no")}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "no"
              ? "bg-rose-950 text-rose-300 shadow-md border border-rose-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span className="line-clamp-1">🔴 NO 논거</span>
          {readTabs.has("no") && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
        </button>
      </div>

      {/* 탭 1: ⚖️ 중립 팩트체크 (Fact Sheet) */}
      {activeTab === "neutral" && (
        <div className="space-y-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs animate-in fade-in duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-blue-400 tracking-wider">OFFICIAL FACT CHECK</span>
              <h4 className="text-sm font-extrabold text-white">{briefing.neutralFacts.title}</h4>
              <p className="text-slate-400 leading-relaxed">{briefing.neutralFacts.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-700 shrink-0">
              출처: {briefing.neutralFacts.source}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold">현재 공식 수치</span>
              <div className="text-sm font-black text-amber-300">{briefing.neutralFacts.currentValue}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold">역사적 평균치</span>
              <div className="text-sm font-bold text-slate-200">{briefing.neutralFacts.historicalContext}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold">공식 발표 일정</span>
              <div className="text-sm font-bold text-slate-200">{briefing.neutralFacts.officialSchedule}</div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 🔵 YES 지지 논거 (Bull Case) */}
      {activeTab === "yes" && (
        <div className="space-y-3 p-5 rounded-2xl bg-blue-950/30 border border-blue-800/50 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-900/80 text-blue-300 border border-blue-700">
              YES 진영 시각
            </span>
            <h4 className="text-sm font-extrabold text-blue-100">{briefing.yesCase.label}</h4>
          </div>
          <p className="text-blue-200/90 font-medium leading-relaxed pb-1">
            "{briefing.yesCase.coreThesis}"
          </p>

          <div className="space-y-2.5 pt-1">
            {briefing.yesCase.arguments.map((arg, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-blue-900/40 space-y-1.5">
                <div className="font-extrabold text-blue-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{arg.point}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{arg.detail}</p>
                {arg.sourceTitle && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-3 h-3 text-slate-400" />
                      <span>{arg.sourceMedia}: {arg.sourceTitle}</span>
                    </span>
                    {arg.sourceUrl && (
                      <a
                        href={arg.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>원문 확인</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 3: 🔴 NO 지지 논거 (Bear Case) */}
      {activeTab === "no" && (
        <div className="space-y-3 p-5 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-900/80 text-rose-300 border border-rose-700">
              NO 진영 시각
            </span>
            <h4 className="text-sm font-extrabold text-rose-100">{briefing.noCase.label}</h4>
          </div>
          <p className="text-rose-200/90 font-medium leading-relaxed pb-1">
            "{briefing.noCase.coreThesis}"
          </p>

          <div className="space-y-2.5 pt-1">
            {briefing.noCase.arguments.map((arg, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 space-y-1.5">
                <div className="font-extrabold text-rose-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{arg.point}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{arg.detail}</p>
                {arg.sourceTitle && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-3 h-3 text-slate-400" />
                      <span>{arg.sourceMedia}: {arg.sourceTitle}</span>
                    </span>
                    {arg.sourceUrl && (
                      <a
                        href={arg.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>원문 확인</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 총평 및 완독 보상 획득 버튼 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <p className="text-[11px] text-slate-400 italic">
          💡 <strong className="text-slate-300 not-italic">AI 오라클 코멘트:</strong> {briefing.aiInsight}
        </p>

        {isRewarded ? (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs font-bold text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>균형 시각 인증 완료 (+20 PMP 획득)</span>
          </div>
        ) : (
          <button
            onClick={handleClaimReward}
            disabled={!allRead || isClaiming}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all shrink-0 ${
              allRead
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 animate-pulse"
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              {allRead
                ? "3단 시각 완독 완료! +20 PMP 받기"
                : `남은 탭 ${3 - readTabs.size}개를 마저 읽으세요 (+20 PMP)`}
            </span>
          </button>
        )}
      </div>

      {/* 리워드 토스트 안내 */}
      {rewardMsg && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-xs font-extrabold text-emerald-200 animate-in slide-in-from-bottom duration-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{rewardMsg}</span>
        </div>
      )}
    </div>
  );
}
