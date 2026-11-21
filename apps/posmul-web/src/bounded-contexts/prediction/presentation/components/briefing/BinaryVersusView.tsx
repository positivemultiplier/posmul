"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import type { OptionScenarioBriefing } from "../../../domain/value-objects/briefing.types";
import {
  TONE_PALETTE,
  resolveOptionProbPct,
  type BriefingOptionMeta,
} from "./briefing-ui-helpers";

interface BinaryVersusViewProps {
  scenarios: OptionScenarioBriefing[];
  options?: ReadonlyArray<BriefingOptionMeta>;
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
}

/** ① 양자택일(BINARY): 좌우 50:50 VS 맞대결 뷰 (모바일 2버튼 토글) */
export function BinaryVersusView({
  scenarios,
  options,
  selectedOptionId,
  onSelectOption,
}: BinaryVersusViewProps) {
  const pair = scenarios.slice(0, 2);
  const [mobileIdx, setMobileIdx] = useState<number>(0);

  return (
    <div className="space-y-4">
      {/* 모바일 전용 2버튼 스위처 */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 md:hidden">
        {pair.map((scenario, idx) => {
          const palette = TONE_PALETTE[idx === 0 ? "bull" : "bear"];
          const isActive = mobileIdx === idx;
          const pct = resolveOptionProbPct(scenario, options);
          return (
            <button
              key={scenario.optionId}
              type="button"
              onClick={() => setMobileIdx(idx)}
              className={`py-2.5 px-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? `${palette.badge} border shadow`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="truncate">{scenario.optionLabel}</span>
              {pct !== null && (
                <span className="text-xs opacity-90 shrink-0">{pct}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 데스크톱 50:50 좌우 대결 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pair.map((scenario, idx) => {
          const palette = TONE_PALETTE[idx === 0 ? "bull" : "bear"];
          const pct = resolveOptionProbPct(scenario, options);
          const isChosen = selectedOptionId === scenario.optionId;
          const visibleArgs = scenario.arguments.slice(0, 2);

          return (
            <div
              key={scenario.optionId}
              className={`${
                mobileIdx === idx ? "flex" : "hidden md:flex"
              } flex-col justify-between p-5 sm:p-6 rounded-2xl border transition-all ${
                palette.surface
              } ${isChosen ? palette.activeBorder : palette.border}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {palette.icon}
                    <h4
                      className={`text-base sm:text-lg font-black leading-snug ${palette.title}`}
                    >
                      {scenario.optionLabel}
                    </h4>
                  </div>
                  {pct !== null && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-sm font-black border shrink-0 ${palette.badge}`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>

                <p className="text-[15px] sm:text-base font-bold text-white leading-relaxed">
                  {scenario.coreThesis}
                </p>

                <div className="space-y-3 pt-1">
                  {visibleArgs.map((arg, argIdx) => (
                    <div
                      key={argIdx}
                      className="p-4 rounded-xl bg-slate-950/75 border border-white/[0.07] space-y-1.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border shrink-0 mt-0.5 ${palette.bullet}`}
                        >
                          {argIdx + 1}
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

              {onSelectOption && (
                <button
                  type="button"
                  onClick={() => onSelectOption(scenario.optionId)}
                  className={`mt-5 w-full py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isChosen ? palette.buttonSelected : palette.button
                  }`}
                >
                  {isChosen ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>현재 선택한 논거</span>
                    </>
                  ) : (
                    <span>이 논거에 공감 · 선택하기</span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
