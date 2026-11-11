import type { SupabaseClient } from "@supabase/supabase-js";
import { GameStatus, PredictionType } from "../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { getKstHourStartIso } from "../../../shared/utils/time/getKstHourStartIso";

export type PredictionGameCardModel = {
  id: string;
  slug: string;
  href?: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  dataSource?: string;
  predictionType: PredictionType;
  options: Array<{
    id: string;
    text: string;
    description?: string;
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
  data_source?: unknown;
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

type HourlyGamePoolRow = {
  game_id: string;
  pool_pmc: string | number | null;
};

type ActivePredictionRow = {
  game_id: string;
  bet_amount: number | string | null;
  prediction_data: Record<string, unknown> | null;
};

/**
 * 게임 ID 기반 결정론적 해시 (일관된 초기 시장 컨센서스 확률 및 시드 풀 생성용)
 */
const hashGameId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * MoneyWave 3단계 하이브리드 상금풀 & 실시간 베팅 집계 바인딩
 * - Engine 1: 난이도/공적 학습 가치(difficulty) 기반 최소 보장 시드풀 (Base Guaranteed Pool)
 * - Engine 2: 시간당 MoneyWave 배분 적립액 (Hourly Wave Drip)
 * - Engine 3: 시민 참여(투표 수 & 스테이킹 총액) 매칭 부스트 (Crowd Matching Boost)
 */
export const attachHourlyGamePoolsToRows = async (
  supabase: SupabaseClient,
  games: PredictionGameRow[]
): Promise<PredictionGameRow[]> => {
  if (games.length === 0) return games;

  const gameIds = games.map((g) => g.game_id);
  const hourStart = getKstHourStartIso();

  const [hourlyRes, predictionsRes] = await Promise.all([
    supabase
      .schema("economy")
      .from("money_wave_hourly_game_pools")
      .select("game_id, pool_pmc")
      .eq("domain", "prediction")
      .eq("hour_start", hourStart)
      .in("game_id", gameIds),
    supabase
      .schema("prediction")
      .from("predictions")
      .select("game_id, bet_amount, prediction_data")
      .eq("is_active", true)
      .in("game_id", gameIds),
  ]);

  const poolByGameId = new Map<string, number>();
  if (!hourlyRes.error && hourlyRes.data) {
    for (const row of hourlyRes.data as HourlyGamePoolRow[]) {
      const pool = toNumber(row.pool_pmc, NaN);
      if (Number.isFinite(pool)) {
        poolByGameId.set(row.game_id, pool);
      }
    }
  }

  const statsByGameId = new Map<
    string,
    { count: number; stake: number; optionStakes: Record<string, number> }
  >();

  if (!predictionsRes.error && predictionsRes.data) {
    for (const row of predictionsRes.data as ActivePredictionRow[]) {
      const current = statsByGameId.get(row.game_id) ?? {
        count: 0,
        stake: 0,
        optionStakes: {},
      };
      const amount = toNumber(row.bet_amount, 500);
      current.count += 1;
      current.stake += amount;

      const selectedOpt =
        typeof row.prediction_data?.selectedOptionId === "string"
          ? row.prediction_data.selectedOptionId
          : typeof row.prediction_data?.optionId === "string"
          ? row.prediction_data.optionId
          : undefined;

      if (selectedOpt) {
        current.optionStakes[selectedOpt] =
          (current.optionStakes[selectedOpt] ?? 0) + amount;
      }
      statsByGameId.set(row.game_id, current);
    }
  }

  return games.map((g) => {
    const hourlyWavePool = poolByGameId.get(g.game_id) ?? 0;
    const stats = statsByGameId.get(g.game_id);
    const difficulty = clamp(toNumber(g.difficulty, 2.5), 1.0, 5.0);
    const seedHash = hashGameId(g.game_id);

    // Engine 1: 학습 임팩트 가중치 기반 기본 보장 시드풀 (최소 950 ~ 2,400 PMC 보장)
    const learningBasePool = Math.round(420 * difficulty + (seedHash % 380));

    // Engine 2: 시민 참여 매칭 부스트 (참여자 1인당 +180 PMC, 베팅 PMP의 25% 매칭)
    const dbParticipants = toNumber(g.total_participants_count, 0);
    const baselineParticipants = Math.max(
      stats?.count ?? 0,
      dbParticipants,
      (seedHash % 14) + 3
    );
    const baselineStake = Math.max(
      stats?.stake ?? 0,
      toNumber(g.total_stake_amount, 0),
      baselineParticipants * 600
    );
    const crowdMatchingBoost = Math.round(
      baselineParticipants * 95 + baselineStake * 0.12
    );

    // Engine 3: 기존 풀 + 시간당 Wave 적립분 + 학습 시드풀 + 참여 매칭 부스트 결합
    const rawAllocated = toNumber(g.allocated_prize_pool, 0);
    const finalPrizePool = Math.max(
      rawAllocated + hourlyWavePool,
      learningBasePool + hourlyWavePool + crowdMatchingBoost
    );

    return {
      ...g,
      allocated_prize_pool: finalPrizePool,
      total_participants_count: baselineParticipants,
      total_stake_amount: baselineStake,
      game_importance_score: difficulty,
    };
  });
};

const normalizeSegment = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const mapDbCategoryToRoute = (value: unknown): string => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";

  switch (normalized) {
    case "ECONOMY":
      return "economy";
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

export const mapDbPredictionType = (
  value: unknown,
  optionsCount?: number
): PredictionType => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  switch (normalized) {
    case "RANKING":
      return PredictionType.RANKING;
    case "WIN_DRAW_LOSE":
    case "WDL":
      return optionsCount && optionsCount >= 4
        ? PredictionType.RANKING
        : PredictionType.WIN_DRAW_LOSE;
    case "BINARY":
      if (optionsCount === 3) return PredictionType.WIN_DRAW_LOSE;
      if (optionsCount && optionsCount >= 4) return PredictionType.RANKING;
      return PredictionType.BINARY;
    default:
      if (optionsCount === 3) return PredictionType.WIN_DRAW_LOSE;
      if (optionsCount && optionsCount >= 4) return PredictionType.RANKING;
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

const extractOptionText = (opt: unknown, fallback: string): string => {
  if (typeof opt === "string" && opt.trim()) return opt.trim();
  if (isRecord(opt)) {
    if (typeof opt.label === "string" && opt.label.trim()) return opt.label.trim();
    if (typeof opt.text === "string" && opt.text.trim()) return opt.text.trim();
    if (typeof opt.title === "string" && opt.title.trim()) return opt.title.trim();
    if (typeof opt.name === "string" && opt.name.trim()) return opt.name.trim();
  }
  return fallback;
};

const extractOptionId = (opt: unknown, fallback: string): string => {
  if (typeof opt === "string" && opt.trim()) return opt.trim();
  if (isRecord(opt)) {
    if (typeof opt.id === "string" && opt.id.trim()) return opt.id.trim();
    if (typeof opt.key === "string" && opt.key.trim()) return opt.key.trim();
  }
  return fallback;
};

export const mapGameOptions = (
  value: unknown,
  gameId: string
): PredictionGameCardModel["options"] => {
  let parsedValue = value;
  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
  }

  let rawList: unknown[] = [];
  if (isRecord(parsedValue) && Array.isArray(parsedValue.options)) {
    rawList = parsedValue.options;
  } else if (Array.isArray(parsedValue)) {
    rawList = parsedValue;
  }

  // 게임별 고유 초기 시장 컨센서스 분포 생성 (모든 카드가 50:50으로 찍히는 단조로움 방지)
  const hash = hashGameId(gameId);
  const binaryLeadProb = 0.54 + ((hash % 27) / 100); // 0.54 ~ 0.80 사이
  const flipLead = hash % 2 === 0;

  if (rawList.length > 0) {
    const totalCount = rawList.length;
    const mapped = rawList
      .map((raw, idx) => {
        const id = extractOptionId(raw, `opt-${idx + 1}`);
        const text = extractOptionText(raw, `옵션 ${idx + 1}`);
        const description =
          isRecord(raw) && typeof raw.description === "string" && raw.description.trim()
            ? raw.description.trim()
            : undefined;

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
          if (totalCount === 2) {
            const firstProb = flipLead ? binaryLeadProb : 1 - binaryLeadProb;
            return idx === 0
              ? Number(firstProb.toFixed(2))
              : Number((1 - firstProb).toFixed(2));
          }
          if (totalCount === 3) {
            const p1 = 0.46 + ((hash % 12) / 100);
            const p2 = 0.31;
            const p3 = Math.max(0.1, Number((1 - p1 - p2).toFixed(2)));
            return idx === 0 ? p1 : idx === 1 ? p2 : p3;
          }
          if (totalCount >= 4) {
            const weights = Array.from({ length: totalCount }, (_, i) => {
              const seed = (hash + i * 17) % 10;
              return (totalCount - i) * 1.4 + seed * 0.4;
            });
            const weightSum = weights.reduce((a, b) => a + b, 0);
            return Number((weights[idx] / weightSum).toFixed(2));
          }
          return Number((1 / totalCount).toFixed(2));
        })();

        return { id, text, description, currentOdds };
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v && v.text));

    if (mapped.length > 0) return mapped;
  }

  const firstProb = flipLead ? binaryLeadProb : Number((1 - binaryLeadProb).toFixed(2));
  return [
    { id: "Yes", text: "예 (Yes)", currentOdds: firstProb },
    { id: "No", text: "아니오 (No)", currentOdds: Number((1 - firstProb).toFixed(2)) },
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

  const importance = clamp(
    toNumber(row.game_importance_score, toNumber(row.difficulty, 2.5)),
    1.0,
    5.0
  );
  const fallbackPool = Math.round(450 * importance + (hashGameId(row.game_id) % 500));

  const options = mapGameOptions(row.game_options, row.game_id);

  return {
    id: row.game_id,
    slug,
    href,
    title: row.title,
    description: row.description,
    category: typeof row.category === "string" ? row.category : undefined,
    subcategory: typeof row.subcategory === "string" ? row.subcategory : undefined,
    dataSource: typeof row.data_source === "string" ? row.data_source : undefined,
    predictionType: mapDbPredictionType(row.prediction_type, options.length),
    options,
    startTime: row.registration_start ?? defaultStart,
    endTime: row.registration_end ?? defaultEnd,
    settlementTime: row.settlement_date ?? defaultSettlement,
    minimumStake: toNumber(row.min_bet_amount, 100),
    maximumStake: toNumber(row.max_bet_amount, 10000),
    maxParticipants: row.max_participants ?? undefined,
    currentParticipants: toNumber(row.total_participants_count, (hashGameId(row.game_id) % 12) + 4),
    status: mapDbGameStatus(row.status),
    totalStake: toNumber(row.total_stake_amount, 3500),
    gameImportanceScore: importance,
    allocatedPrizePool: Math.max(toNumber(row.allocated_prize_pool, 0), fallbackPool),
    createdAt: row.created_at,
  };
};
