export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export const CATEGORY_MAP: Readonly<Record<string, string>> = {
  invest: "INVEST",
  sports: "SPORTS",
  politics: "POLITICS",
  entertainment: "ENTERTAINMENT",
  user: "USER_PROPOSED",
};

export function resolveSelectedDbCategory(
  domain: string,
  category: string
): string | null {
  if (domain !== "prediction" || category === "all") return null;
  return CATEGORY_MAP[category] ?? null;
}

export function buildMultiplierByCategory(
  rows: unknown[] | null
): Record<string, number> {
  const multiplierByCategory: Record<string, number> = {};

  (rows ?? []).forEach((row) => {
    const categoryValue = (row as { category?: unknown }).category;
    const multiplierValue = parseNumeric(
      (row as { reward_multiplier?: unknown }).reward_multiplier
    );
    if (typeof categoryValue === "string") {
      multiplierByCategory[categoryValue] = multiplierValue ?? 1;
    }
  });

  return multiplierByCategory;
}

export function countCategories(rows: unknown[] | null): {
  counts: Record<string, number>;
  total: number;
} {
  const counts: Record<string, number> = {};
  const total = (rows ?? []).length;

  (rows ?? []).forEach((row) => {
    const categoryValue = (row as { category?: unknown }).category;
    if (typeof categoryValue !== "string") return;
    counts[categoryValue] = (counts[categoryValue] ?? 0) + 1;
  });

  return { counts, total };
}

export function computeRevealRatio(
  progress: number,
  participantTotal: number,
  totalActiveGames: number
): {
  progressAdjusted: number;
  revealRatio: number;
} {
  const participantTarget = 2000;
  const activeGamesTarget = 20;
  const activityBoost = clamp01(
    0.6 * Math.min(1, participantTotal / participantTarget) +
      0.4 * Math.min(1, totalActiveGames / activeGamesTarget)
  );

  const progressClamped = clamp01(progress);
  const progressAdjusted =
    1 - Math.pow(1 - progressClamped, 1 + activityBoost * 2);
  const revealRatio = 0.5 + 0.5 * progressAdjusted;

  return { progressAdjusted, revealRatio };
}
