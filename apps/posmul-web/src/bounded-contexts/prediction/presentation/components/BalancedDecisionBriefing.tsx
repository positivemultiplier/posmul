"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, Scale, Zap } from "lucide-react";

import { getBalancedBriefingAction } from "../../../../app/prediction/components/prediction-briefing.actions";
import type { BalancedBriefingDTO } from "../../domain/value-objects/briefing.types";
import type { BriefingOptionMeta } from "./briefing/briefing-ui-helpers";
import { BinaryVersusView } from "./briefing/BinaryVersusView";
import { WdlMasterDetailView } from "./briefing/WdlMasterDetailView";
import { RankingAccordionView } from "./briefing/RankingAccordionView";

export type { BriefingOptionMeta };

interface BalancedDecisionBriefingProps {
  gameId: string;
  gameTitle?: string;
  options?: ReadonlyArray<BriefingOptionMeta>;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
  /** SSR에서 이미 캐시된 브리핑이 있으면 즉시 렌더 (클라이언트 Server Action 왕복 생략) */
  initialBriefing?: BalancedBriefingDTO | null;
}

export function BalancedDecisionBriefing({
  gameId,
  options,
  selectedOptionId,
  onSelectOption,
  initialBriefing,
}: BalancedDecisionBriefingProps) {
  const [briefing, setBriefing] = useState<BalancedBriefingDTO | null>(
    initialBriefing ?? null
  );
  const [loading, setLoading] = useState(!initialBriefing);

  useEffect(() => {
    // SSR로 유효한 브리핑을 이미 받았다면 추가 POST 왕복 생략
    if (initialBriefing && initialBriefing.scenarios.length > 0) {
      setBriefing(initialBriefing);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

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
  }, [gameId, initialBriefing]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-sm text-slate-400">
        핵심 논거 비교 브리핑을 불러오는 중입니다...
      </div>
    );
  }

  if (!briefing || briefing.scenarios.length === 0) {
    return null;
  }

  const sectionTitle =
    briefing.mode === "WIN_DRAW_LOSE"
      ? "3방향 시나리오 핵심 비교"
      : briefing.mode === "RANKING"
      ? `후보별 핵심 시나리오 (${briefing.scenarios.length}개)`
      : "양측 핵심 논거 비교";

  const guideCopy =
    briefing.mode === "BINARY"
      ? "양쪽 근거를 나란히 비교해 보세요"
      : briefing.mode === "WIN_DRAW_LOSE"
      ? "카드를 눌러 시나리오별 근거를 확인하세요"
      : "후보를 눌러 상세 근거를 펼쳐보세요";

  const bottomNote =
    briefing.mode === "RANKING" && briefing.tailRiskNote
      ? {
          label: "다크호스 · 이변 변수",
          text: briefing.tailRiskNote,
          icon: <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
        }
      : {
          label: "승부를 가를 핵심 변수",
          text: briefing.aiInsight,
          icon: <Lightbulb className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />,
        };

  return (
    <section className="space-y-5 p-5 sm:p-6 rounded-3xl bg-[#0d1321] border border-white/[0.09] shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-sky-400" />
          <span>{sectionTitle}</span>
        </h3>
        <span className="text-xs font-bold text-slate-400">{guideCopy}</span>
      </div>

      {briefing.mode === "BINARY" && (
        <BinaryVersusView
          scenarios={briefing.scenarios}
          options={options}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      )}

      {briefing.mode === "WIN_DRAW_LOSE" && (
        <WdlMasterDetailView
          scenarios={briefing.scenarios}
          options={options}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      )}

      {briefing.mode === "RANKING" && (
        <RankingAccordionView
          scenarios={briefing.scenarios}
          options={options}
          selectedOptionId={selectedOptionId}
          onSelectOption={onSelectOption}
        />
      )}

      {bottomNote.text && (
        <div className="p-4 rounded-2xl bg-slate-950/75 border border-white/[0.07] flex items-start gap-2.5">
          {bottomNote.icon}
          <p className="text-sm text-slate-200 leading-relaxed">
            <strong className="text-white font-extrabold mr-1.5">
              {bottomNote.label}:
            </strong>
            {bottomNote.text}
          </p>
        </div>
      )}
    </section>
  );
}
