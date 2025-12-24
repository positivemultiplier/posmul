import { GameStatus, PredictionType } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";

export type PredictionGameCardModel = {
  id: string;
  slug: string;
  href?: string;
  title: string;
  description: string;
  predictionType: PredictionType;
  options: Array<{
    id: string;
    text: string;
    currentOdds: number;
  }>;
  startTime: string | Date;
  endTime: string | Date;
  settlementTime: string | Date;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
  currentParticipants: number;
  status: GameStatus;
  totalStake: number;
  gameImportanceScore: number;
  allocatedPrizePool: number;
  createdAt: string | Date;
};

export type PredictionGameRow = {
  game_id: string;
  slug: string | null;
  category?: unknown;
  subcategory?: unknown;
  league?: unknown;
  title: string;
  description: string;
  prediction_type: unknown;
  game_options: unknown;
  registration_start: string;
  registration_end: string;
  settlement_date: string;
  min_bet_amount: unknown;
  max_bet_amount: unknown;
  max_participants: number | null;
  status: unknown;
  difficulty: unknown;
  created_at: string;
  allocated_prize_pool?: unknown;
  total_participants_count?: unknown;
  total_stake_amount?: unknown;
  game_importance_score?: unknown;
};

const normalizeSegment = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const mapDbCategoryToRoute = (value: unknown): string => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";

  switch (normalized) {
    case "SPORTS":
      return "sports";
    case "INVEST":
      return "consume";
    case "ENTERTAINMENT":
      return "entertainment";
    case "POLITICS":
      return "politics";
    case "USER_PROPOSED":
    case "USER_SUGGESTIONS":
    case "USER_SUGGESTION":
      return "user-suggestions";
    default:
      return "prediction";
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const mapDbPredictionType = (value: unknown): PredictionType => {
  switch (value) {
    case "BINARY":
      return PredictionType.BINARY;
    case "WIN_DRAW_LOSE":
      return PredictionType.WIN_DRAW_LOSE;
    case "RANKING":
      return PredictionType.RANKING;
    default:
      return PredictionType.BINARY;
  }
};

export const mapDbGameStatus = (value: unknown): GameStatus => {
  switch (value) {
    case "ACTIVE":
      return GameStatus.ACTIVE;
    case "DRAFT":
      return GameStatus.CREATED;
    case "CLOSED":
      return GameStatus.ENDED;
    case "SETTLED":
      return GameStatus.COMPLETED;
    case "CANCELLED":
      return GameStatus.CANCELLED;
    default:
      return GameStatus.ACTIVE;
  }
};

const mapGameOptions = (value: unknown): PredictionGameCardModel["options"] => {
  if (!Array.isArray(value)) {
    return [
      { id: "1", text: "예", currentOdds: 0.5 },
      { id: "2", text: "아니오", currentOdds: 0.5 },
    ];
  }

  const mapped = value
    .map((raw, idx) => {
      if (!isRecord(raw)) return null;

      const id = typeof raw.id === "string" ? raw.id : `opt-${idx + 1}`;
      const text =
        typeof raw.text === "string"
          ? raw.text
          : typeof raw.label === "string"
            ? raw.label
            : `옵션 ${idx + 1}`;

      const currentOddsRaw = isRecord(raw) ? raw.currentOdds : undefined;
      const ratioRaw = isRecord(raw) ? raw.ratio : undefined;

      const currentOdds = (() => {
        if (typeof currentOddsRaw === "number" && Number.isFinite(currentOddsRaw)) {
          return clamp(currentOddsRaw, 0.01, 0.99);
        }

        const ratio = toNumber(ratioRaw, NaN);
        if (Number.isFinite(ratio) && ratio > 0) {
          return clamp(1 / ratio, 0.01, 0.99);
        }

        return 0.5;
      })();

      return { id, text, currentOdds };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return mapped.length
    ? mapped
    : [
        { id: "1", text: "예", currentOdds: 0.5 },
        { id: "2", text: "아니오", currentOdds: 0.5 },
      ];
};

export const mapPredictionGameRowToCardModel = (
  row: PredictionGameRow
): PredictionGameCardModel => {
  const now = Date.now();
  const defaultStart = new Date(now - 60 * 60 * 1000).toISOString();
  const defaultEnd = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  const defaultSettlement = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString();

  const slug = row.slug ?? row.game_id;
  const subcategory = normalizeSegment(row.subcategory, "all").toLowerCase();
  const league = normalizeSegment(row.league, "all").toLowerCase();

  const href = (() => {
    const categoryRoute = mapDbCategoryToRoute(row.category);
    return categoryRoute === "prediction"
      ? `/prediction/${slug}`
      : `/prediction/${categoryRoute}/${subcategory}/${league}/${slug}`;
  })();

  return {
    id: row.game_id,
    slug,
    href,
    title: row.title,
    description: row.description,
    predictionType: mapDbPredictionType(row.prediction_type),
    options: mapGameOptions(row.game_options),
    startTime: row.registration_start ?? defaultStart,
    endTime: row.registration_end ?? defaultEnd,
    settlementTime: row.settlement_date ?? defaultSettlement,
    minimumStake: toNumber(row.min_bet_amount, 100),
    maximumStake: toNumber(row.max_bet_amount, 10000),
    maxParticipants: row.max_participants ?? undefined,
    currentParticipants: toNumber(row.total_participants_count, 0),
    status: mapDbGameStatus(row.status),
    totalStake: toNumber(row.total_stake_amount, 0),
    gameImportanceScore: toNumber(row.game_importance_score, toNumber(row.difficulty, 1.0)),
    allocatedPrizePool: toNumber(row.allocated_prize_pool, 0),
    createdAt: row.created_at,
  };
};
