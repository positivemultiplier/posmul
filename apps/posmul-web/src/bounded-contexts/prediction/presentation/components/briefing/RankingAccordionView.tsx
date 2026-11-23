"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { OptionScenarioBriefing } from "../../../domain/value-objects/briefing.types";
import {
  TONE_PALETTE,
  getRankBadge,
  resolveOptionProbPct,
  type BriefingOptionMeta,
} from "./briefing-ui-helpers";

interface RankingAccordionViewProps {
  scenarios: OptionScenarioBriefing[];
  options?: ReadonlyArray<BriefingOptionMeta>;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
}

/** 3. 랭킹 · 다자 경쟁(RANKING): 확률 순위형 아코디언 비교 보드 */
export function RankingAccordionView({
  scenarios,
  options,
  selectedOptionId,
  onSelectOption,
}: RankingAccordionViewProps) {
  const rankedScenarios = useMemo(() => {
    return [...scenarios]
      .map((scenario, originalIdx) => ({
        scenario,
        originalIdx,
        pct: resolveOptionProbPct(scenario, options),
      }))
      .sort((a, b) => {
        if (a.pct !== null && b.pct !== null && b.pct !== a.pct) {
          return b.pct - a.pct;
        }
        return a.originalIdx - b.originalIdx;
      });
  }, [scenarios, options]);

  const [expandedId, setExpandedId] = useState<string>(
    rankedScenarios[0]?.scenario.optionId ?? ""
  );

  useEffect(() => {
    if (rankedScenarios[0]?.scenario.optionId) {
      setExpandedId(rankedScenarios[0].scenario.optionId);
    }
  }, [rankedScenarios]);

  return (
    <div className="space-y-2.5">
      {rankedScenarios.map(({ scenario, pct }, rankIdx) => {
        const isExpanded = expandedId === scenario.optionId;
        const isChosen = selectedOptionId === scenario.optionId;
        const palette =
          rankIdx === 0
            ? TONE_PALETTE.neutral
            : rankIdx === 1
            ? TONE_PALETTE.darkhorse
            : TONE_PALETTE.bull;

        return (
          <div
            key={scenario.optionId}
            className={`rounded-2xl border transition-all overflow-hidden ${
              isExpanded
                ? `${palette.surface} ${palette.activeBorder}`
                : "bg-slate-950/70 border-white/[0.08] hover:border-slate-600"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setExpandedId((prev) =>
                  prev === scenario.optionId ? "" : scenario.optionId
                )
              }
              className="w-full p-4 sm:px-5 text-left flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black border shrink-0 ${palette.badge}`}
                  >
                    {getRankBadge(rankIdx)}
                  </span>
                  <span className="text-base font-black text-white">
                    {scenario.optionLabel}
                  </span>
                  {pct !== null && (
                    <span className="text-sm font-extrabold text-sky-300">
                      {pct}%
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm text-slate-300 leading-relaxed ${
                    isExpanded ? "" : "line-clamp-1"
                  }`}
                >
                  {scenario.coreThesis}
                </p>
              </div>
              <div className="text-slate-400 shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3.5 border-t border-white/[0.07]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                  {scenario.arguments.slice(0, 2).map((arg, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-1.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border shrink-0 mt-0.5 ${palette.bullet}`}
                        >
                          {idx + 1}
                        </span>
                        <div className="space-y-1 min-w-0">
                          <div className="text-sm sm:text-[15px] font-extrabold text-slate-100 leading-snug">
                            {arg.point}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {arg.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {onSelectOption && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectOption(scenario.optionId)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all ${
                        isChosen ? palette.buttonSelected : palette.button
                      }`}
                    >
                      {isChosen ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>현재 선택한 후보</span>
                        </>
                      ) : (
                        <span>이 후보에 예측하기</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
