"use client";

import React from "react";
import { Scale, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type {
  OptionScenarioBriefing,
  ScenarioTone,
} from "../../../domain/value-objects/briefing.types";

export interface BriefingOptionMeta {
  id: string;
  label: string;
  /** 0~100 또는 0~1 확률 값 */
  probability?: number;
}

export interface TonePalette {
  border: string;
  activeBorder: string;
  surface: string;
  badge: string;
  title: string;
  bullet: string;
  button: string;
  buttonSelected: string;
  icon: React.ReactNode;
}

export const TONE_PALETTE: Record<ScenarioTone, TonePalette> = {
  bull: {
    border: "border-emerald-500/30",
    activeBorder: "border-emerald-400 ring-1 ring-emerald-400/40",
    surface: "bg-gradient-to-b from-emerald-950/35 via-[#0e1525] to-[#0b101c]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    title: "text-emerald-300",
    bullet: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    button:
      "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-500/35",
    buttonSelected:
      "bg-emerald-500 text-slate-950 border-emerald-400 font-black",
    icon: <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  bear: {
    border: "border-rose-500/30",
    activeBorder: "border-rose-400 ring-1 ring-rose-400/40",
    surface: "bg-gradient-to-b from-rose-950/35 via-[#0e1525] to-[#0b101c]",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    title: "text-rose-300",
    bullet: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    button:
      "bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border-rose-500/35",
    buttonSelected: "bg-rose-500 text-white border-rose-400 font-black",
    icon: <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />,
  },
  neutral: {
    border: "border-amber-500/30",
    activeBorder: "border-amber-400 ring-1 ring-amber-400/40",
    surface: "bg-gradient-to-b from-amber-950/30 via-[#0e1525] to-[#0b101c]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    title: "text-amber-300",
    bullet: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    button:
      "bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/35",
    buttonSelected: "bg-amber-400 text-slate-950 border-amber-300 font-black",
    icon: <Scale className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  darkhorse: {
    border: "border-sky-500/30",
    activeBorder: "border-sky-400 ring-1 ring-sky-400/40",
    surface: "bg-gradient-to-b from-sky-950/30 via-[#0e1525] to-[#0b101c]",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/35",
    title: "text-sky-300",
    bullet: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    button: "bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border-sky-500/35",
    buttonSelected: "bg-sky-400 text-slate-950 border-sky-300 font-black",
    icon: <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />,
  },
};

function normalizeProbabilityPct(prob?: number): number | null {
  if (typeof prob !== "number" || !Number.isFinite(prob)) return null;
  const pct = prob <= 1 && prob >= 0 ? prob * 100 : prob;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function resolveOptionProbPct(
  scenario: OptionScenarioBriefing,
  options?: ReadonlyArray<BriefingOptionMeta>
): number | null {
  if (!options || options.length === 0) return null;
  const found =
    options.find((o) => o.id === scenario.optionId) ??
    options.find((o) => o.label === scenario.optionLabel);
  return normalizeProbabilityPct(found?.probability);
}

export function getRankBadge(rankIndex: number): string {
  if (rankIndex === 0) return "🥇 1위";
  if (rankIndex === 1) return "🥈 2위";
  if (rankIndex === 2) return "🥉 3위";
  return `${rankIndex + 1}위`;
}
