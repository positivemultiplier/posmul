"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type {
  OptionScenarioBriefing,
  ScenarioTone,
} from "../../../domain/value-objects/briefing.types";
import {
  TONE_PALETTE,
  resolveOptionProbPct,
  type BriefingOptionMeta,
} from "./briefing-ui-helpers";

interface WdlMasterDetailViewProps {
  scenarios: OptionScenarioBriefing[];
  options?: ReadonlyArray<BriefingOptionMeta>;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
}

/** 2. 승무패 · 3지선다(WIN_DRAW_LOSE): 상단 3요약 카드 + 하단 넓은 1단 상세 펼침 */
export function WdlMasterDetailView({
  scenarios,
  options,
  selectedOptionId,
  onSelectOption,
}: WdlMasterDetailViewProps) {
  const [focusedId, setFocusedId] = useState<string>(
    scenarios[0]?.optionId ?? ""
  );

  useEffect(() => {
    if (scenarios[0]?.optionId) {
      setFocusedId(scenarios[0].optionId);
    }
  }, [scenarios]);

  const focusedScenario =
    scenarios.find((s) => s.optionId === focusedId) ?? scenarios[0];
  const focusedIdx = Math.max(
    0,
    scenarios.findIndex((s) => s.optionId === focusedScenario?.optionId)
  );
  const focusedTone: ScenarioTone =
    focusedIdx === 0 ? "bull" : focusedIdx === 1 ? "neutral" : "bear";
  const focusedPalette = TONE_PALETTE[focusedTone];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scenarios.slice(0, 3).map((scenario, idx) => {
          const tone: ScenarioTone =
            idx === 0 ? "bull" : idx === 1 ? "neutral" : "bear";
          const palette = TONE_PALETTE[tone];
          const isFocused = focusedScenario?.optionId === scenario.optionId;
          const pct = resolveOptionProbPct(scenario, options);

          return (
            <button
              key={scenario.optionId}
              type="button"
              onClick={() => setFocusedId(scenario.optionId)}
              className={`text-left p-4 rounded-2xl border transition-all space-y-2 ${
                palette.surface
              } ${
                isFocused
                  ? `${palette.activeBorder} shadow-lg`
                  : `${palette.border} opacity-80 hover:opacity-100`
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {palette.icon}
                  <span
                    className={`text-sm sm:text-base font-black truncate ${palette.title}`}
                  >
                    {scenario.optionLabel}
                  </span>
                </div>
                {pct !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black border shrink-0 ${palette.badge}`}
                  >
                    {pct}%
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">
                {scenario.coreThesis}
              </p>
              <div className="text-xs font-bold text-slate-400">
                {isFocused ? "▼ 아래에서 근거 보기 중" : "눌러서 근거 보기"}
              </div>
            </button>
          );
        })}
      </div>

      {focusedScenario && (
        <div
          className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${focusedPalette.surface} ${focusedPalette.border}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {focusedPalette.icon}
                <h4 className={`text-lg font-black ${focusedPalette.title}`}>
                  {focusedScenario.optionLabel} 핵심 근거
                </h4>
              </div>
              <p className="text-[15px] font-bold text-white leading-relaxed">
                {focusedScenario.coreThesis}
              </p>
            </div>

            {onSelectOption && (
              <button
                type="button"
                onClick={() => onSelectOption(focusedScenario.optionId)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  selectedOptionId === focusedScenario.optionId
                    ? focusedPalette.buttonSelected
                    : focusedPalette.button
                }`}
              >
                {selectedOptionId === focusedScenario.optionId ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>선택됨</span>
                  </>
                ) : (
                  <span>이 시나리오 선택</span>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {focusedScenario.arguments.slice(0, 2).map((arg, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-1.5"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border shrink-0 mt-0.5 ${focusedPalette.bullet}`}
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
        </div>
      )}
    </div>
  );
}
