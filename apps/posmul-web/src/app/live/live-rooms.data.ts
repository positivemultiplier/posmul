/**
 * PosMul LIVE 응원톡 & 실시간 예측방 타입 · DB 매핑 유틸
 * - 기존의 정적 가짜 LIVE_ROOMS 하드코딩을 제거하고,
 *   DB `prediction.prediction_games` 실데이터를 기반으로 라이브 룸을 동적 구성합니다.
 * - 클라이언트 컴포넌트에서도 안전하게 import할 수 있도록 순수 타입/함수만 유지합니다.
 */

export interface LiveEventRoom {
  id: string;
  category: "SPORTS" | "ECONOMY" | "ENTERTAINMENT" | "POLITICS";
  categoryLabel: string;
  title: string;
  subtitle: string;
  status: "LIVE" | "UPCOMING" | "CLOSED" | "ENDED";
  viewerCount: number;
  registrationEnd?: string | null;
  settlementDate?: string | null;
  settledAt?: string | null;
  winningOptionId?: string | null;
  winningOptionLabel?: string | null;
  matchScore?: {
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    statusText: string;
  };
  predictionGame?: {
    id: string;
    slug: string;
    question: string;
    oracleLabel: string;
    optionA: {
      id: string;
      label: string;
      ratio: number;
      count: number;
    };
    optionB: {
      id: string;
      label: string;
      ratio: number;
      count: number;
    };
    totalPoolPmc: number;
  };
  initialMessages?: Array<{
    id: string;
    sender: string;
    teamTag?: string;
    teamColor?: string;
    message: string;
    time: string;
    isReaction?: boolean;
  }>;
}

/**
 * 실시간 마감 시간(registrationEnd) 및 DB 정산 여부를 기준으로 방의 실효 상태를 판정합니다.
 */
export function getLiveRoomEffectiveStatus(
  room: Pick<LiveEventRoom, "status" | "registrationEnd" | "settledAt">
): LiveEventRoom["status"] {
  if (room.status === "ENDED" || room.settledAt) {
    return "ENDED";
  }
  if (room.status === "CLOSED") {
    return "CLOSED";
  }
  if (room.registrationEnd) {
    const endMs = new Date(room.registrationEnd).getTime();
    if (Number.isFinite(endMs) && Date.now() >= endMs) {
      return "CLOSED";
    }
  }
  return room.status;
}

export interface LiveDbGameInput {
  game_id: string;
  slug: string | null;
  title: string;
  description?: string | null;
  category?: unknown;
  subcategory?: unknown;
  data_source?: unknown;
  status?: unknown;
  game_options?: unknown;
  registration_end?: string | null;
  settlement_date?: string | null;
  settled_at?: string | null;
  winning_option_id?: string | null;
  allocated_prize_pool?: unknown;
  total_participants_count?: unknown;
}

interface ParsedLiveOption {
  id: string;
  label: string;
  probability: number;
}

function hashText(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function parseLiveOptions(raw: unknown, gameId: string): ParsedLiveOption[] {
  let list: unknown[] = [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { options?: unknown[] }).options)
    ) {
      list = (parsed as { options: unknown[] }).options;
    }
  } catch {
    list = [];
  }

  const normalized = list
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const id = String(rec.id || `opt-${idx + 1}`);
      const label = String(rec.label || rec.text || rec.name || `선택지 ${idx + 1}`);
      const rawOdds = Number(rec.currentOdds ?? rec.odds ?? rec.probability);
      return {
        id,
        label,
        rawOdds: Number.isFinite(rawOdds) && rawOdds > 0 ? rawOdds : NaN,
      };
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  if (normalized.length === 0) {
    return [
      { id: "yes", label: "찬성 / 상승", probability: 0.55 },
      { id: "no", label: "반대 / 하락", probability: 0.45 },
    ];
  }

  // probability가 0~1 사이 값이면 그대로 사용, 아니면 균등/결정론 시드 보정
  const hasAllProbs = normalized.every(
    (o) => Number.isFinite(o.rawOdds) && o.rawOdds > 0 && o.rawOdds <= 1
  );
  if (hasAllProbs) {
    return normalized.map((o) => ({
      id: o.id,
      label: o.label,
      probability: o.rawOdds,
    }));
  }

  const h = hashText(gameId);
  if (normalized.length === 2) {
    const first = 0.48 + ((h % 18) / 100);
    return [
      { id: normalized[0].id, label: normalized[0].label, probability: first },
      { id: normalized[1].id, label: normalized[1].label, probability: Number((1 - first).toFixed(2)) },
    ];
  }

  return normalized.map((o) => ({
    id: o.id,
    label: o.label,
    probability: Number((1 / normalized.length).toFixed(2)),
  }));
}

export function resolveLiveCategoryMeta(rawCategory: unknown): {
  category: LiveEventRoom["category"];
  categoryLabel: string;
} {
  const norm = String(rawCategory || "").trim().toUpperCase();
  switch (norm) {
    case "SPORTS":
      return { category: "SPORTS", categoryLabel: "⚽ 스포츠" };
    case "ENTERTAINMENT":
    case "KCONTENT":
    case "CULTURE":
      return { category: "ENTERTAINMENT", categoryLabel: "🎬 엔터·K컬처" };
    case "POLITICS":
    case "SOCIETY":
    case "GOVERNANCE":
      return { category: "POLITICS", categoryLabel: "🏛️ 정치·사회" };
    case "ECONOMY":
    case "FINANCE":
    case "CONSUME":
    default:
      return { category: "ECONOMY", categoryLabel: "📈 경제·금융" };
  }
}

export function resolveOracleDisplayLabel(dataSource: unknown): string {
  const norm = String(dataSource || "").trim().toLowerCase();
  switch (norm) {
    case "kosis":
      return "KOSIS 통계청 오라클";
    case "football_data":
    case "football-data":
      return "Football-Data 공식 경기 결과";
    case "alpha-vantage":
    case "alphavantage":
      return "AlphaVantage 금융 종가";
    case "fmp":
      return "FMP 기업 실적 공시";
    case "kobis":
      return "KOBIS 영화진흥위 박스오피스";
    case "dart":
      return "DART 전자공시 오라클";
    case "fred":
      return "FRED 연준 경제지표";
    default:
      return "PosMul 공인 오라클";
  }
}

/**
 * DB 예측 게임 Row를 LiveEventRoom DTO로 변환합니다.
 */
export function mapPredictionGameToLiveRoom(
  row: LiveDbGameInput,
  extra?: { recentMessagesCount?: number }
): LiveEventRoom {
  const { category, categoryLabel } = resolveLiveCategoryMeta(row.category);
  const options = parseLiveOptions(row.game_options, row.game_id);
  const optA = options[0];
  const optB = options[1] ?? { id: "other", label: "기타 선택지", probability: 1 - optA.probability };

  const pairSum = Math.max(0.01, optA.probability + optB.probability);
  const ratioA = Math.round((optA.probability / pairSum) * 100);
  const ratioB = 100 - ratioA;

  const totalParticipants = Math.max(1, Number(row.total_participants_count) || 8);
  const countA = Math.max(1, Math.round(totalParticipants * optA.probability));
  const countB = Math.max(1, Math.round(totalParticipants * optB.probability));
  const totalPoolPmc = Math.max(1000, Math.round(Number(row.allocated_prize_pool) || 2500));

  const dbStatus = String(row.status || "ACTIVE").toUpperCase();
  let initialStatus: LiveEventRoom["status"] = "LIVE";
  if (dbStatus === "SETTLED" || row.settled_at) {
    initialStatus = "ENDED";
  } else if (dbStatus === "CLOSED") {
    initialStatus = "CLOSED";
  }

  const winningOpt = row.winning_option_id
    ? options.find((o) => o.id === row.winning_option_id)
    : undefined;

  const roomId = row.slug || row.game_id;
  const oracleLabel = resolveOracleDisplayLabel(row.data_source);
  const msgCount = extra?.recentMessagesCount ?? 0;
  const viewerCount = Math.max(12, totalParticipants * 3 + msgCount * 2);

  const cleanDesc = (row.description || "").replace(/\s+/g, " ").trim();
  const subtitle =
    cleanDesc.length > 110
      ? `${cleanDesc.slice(0, 107)}...`
      : cleanDesc || `${oracleLabel} 검증 기반 실시간 시민 응원 및 예측 토론방`;

  const room: LiveEventRoom = {
    id: roomId,
    category,
    categoryLabel,
    title: row.title,
    subtitle,
    status: initialStatus,
    viewerCount,
    registrationEnd: row.registration_end ?? null,
    settlementDate: row.settlement_date ?? null,
    settledAt: row.settled_at ?? null,
    winningOptionId: row.winning_option_id ?? null,
    winningOptionLabel: winningOpt?.label ?? row.winning_option_id ?? null,
    predictionGame: {
      id: row.game_id,
      slug: row.slug || row.game_id,
      question: row.title,
      oracleLabel,
      optionA: {
        id: optA.id,
        label: optA.label,
        ratio: ratioA,
        count: countA,
      },
      optionB: {
        id: optB.id,
        label: optB.label,
        ratio: ratioB,
        count: countB,
      },
      totalPoolPmc,
    },
    initialMessages: [
      {
        id: `welcome-${row.game_id}`,
        sender: "PosMul LIVE 진행자",
        teamTag: oracleLabel,
        teamColor: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
        message: `"${row.title}" 실시간 토론방이 열렸습니다! 의견을 나누고 상단 번개 예측도 개설해 보세요 ⚡`,
        time: "방금",
      },
    ],
  };

  room.status = getLiveRoomEffectiveStatus(room);
  return room;
}

/**
 * 레거시 호환용 빈 배열 (실데이터는 getLiveRoomsWithStatusAction을 통해 DB에서 직접 조회합니다).
 */
export const LIVE_ROOMS: LiveEventRoom[] = [];
