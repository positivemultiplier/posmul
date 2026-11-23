/**
 * Prediction AI 모델 독립 예측 도메인 타입 & 순수 헬퍼 (외부 의존 0)
 */

export type AiProviderKey =
  | "gemini"
  | "exaone"
  | "openrouter"
  | "openai"
  | "anthropic";

export interface AiRecentFormItem {
  gameId: string;
  isHit: boolean;
  settledAt: string;
}

export interface AiProviderStats {
  scope: "category" | "overall" | "none";
  categoryLabel: string;
  settledCount: number;
  hitCount: number;
  hitRatePct: number | null;
  recentForm: AiRecentFormItem[];
}

export interface AiForecastDTO {
  providerKey: AiProviderKey;
  providerLabel: string;
  modelName: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  confidencePct: number;
  reasoning: string;
  isHit: boolean | null;
  brierScore: number | null;
  createdAt: string;
  stats: AiProviderStats;
}

export function clampConfidencePct(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num)) return 55;
  const pct = num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
  return Math.max(1, Math.min(99, pct));
}

export function normalizeForecastReasoning(raw: unknown): string {
  const cleaned = String(raw ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
}
