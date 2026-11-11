/**
 * AI 균형 의사결정 브리핑 도메인/UI 공용 타입
 * - 게임 유형(BINARY / WIN_DRAW_LOSE / RANKING)별로 시나리오 구조를 다형적으로 지원
 */

export type BriefingMode = "BINARY" | "WIN_DRAW_LOSE" | "RANKING";

export type ScenarioTone = "bull" | "bear" | "neutral" | "darkhorse";

export interface ScenarioArgument {
  point: string;
  detail: string;
  triggerCondition?: string;
}

export interface OptionScenarioBriefing {
  optionId: string;
  optionLabel: string;
  stanceTag: string;
  tone: ScenarioTone;
  coreThesis: string;
  probabilityCue?: string;
  arguments: ScenarioArgument[];
}

export interface BalancedBriefingDTO {
  version: 2;
  gameId: string;
  mode: BriefingMode;
  topic: string;
  providerBadge: string;
  generatedAt: string;
  neutralFacts: {
    title: string;
    description: string;
    currentValue: string;
    historicalContext: string;
    officialSchedule: string;
    source: string;
  };
  scenarios: OptionScenarioBriefing[];
  aiInsight: string;
  tailRiskNote?: string;
}

