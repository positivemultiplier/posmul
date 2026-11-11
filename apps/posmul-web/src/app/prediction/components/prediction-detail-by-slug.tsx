import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import {
  getPredictionGameBySlug,
  getPredictionGameStats,
} from "../../../bounded-contexts/prediction/infrastructure/repositories/prediction-query.repository";
import { getUserBalance, getUserBets } from "../sports/soccer/[slug]/actions";
import { getGameHistory } from "../../../bounded-contexts/prediction/infrastructure/repositories/get-game-history";
import {
  attachHourlyGamePoolsToRows,
  mapDbPredictionType,
  mapGameOptions,
  type PredictionGameRow,
} from "./prediction-game-mapper";
import {
  findLiveRoomByGame,
  findLiveRoomByKeyword,
} from "../../live/live-rooms.data";
import {
  UniversalPredictionDetailClient,
  type PredictionGameDetail,
} from "../[slug]/client";

function mapStatus(value: unknown): "ACTIVE" | "ENDED" | "SETTLED" {
  if (value === "ACTIVE") return "ACTIVE";
  if (value === "SETTLED") return "SETTLED";
  return "ENDED";
}

function toIsoOrFallback(value: unknown, fallbackMsFromNow: number): string {
  if (typeof value === "string" || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date(Date.now() + fallbackMsFromNow).toISOString();
}

export async function fetchPredictionDetailDataBySlug(slug: string): Promise<{
  game: PredictionGameDetail;
  userBalance: { pmp: number; pmc: number };
  userBets: Array<{
    betId: string;
    selectedOption: string;
    betAmount: number;
    status: string;
    createdAt: string;
  }>;
  initialChartData: Array<{ time: string; [key: string]: string | number }>;
  slug: string;
} | null> {
  const decodedSlug = decodeURIComponent(slug);
  const dbGame = await getPredictionGameBySlug(decodedSlug);
  if (!dbGame) return null;

  const supabase = await createClient();

  // 통계, 잔액, 유저 참여내역, 3단계 MoneyWave 부스트 풀, 옵션별 실제 참여 볼륨 병렬 조회
  const [stats, balanceResult, userBets, boostedRows, betsRes] = await Promise.all([
    getPredictionGameStats(dbGame.game_id),
    getUserBalance(),
    getUserBets(dbGame.game_id),
    attachHourlyGamePoolsToRows(supabase, [dbGame as PredictionGameRow]),
    supabase
      .schema("prediction")
      .from("predictions")
      .select("bet_amount, prediction_data")
      .eq("game_id", dbGame.game_id)
      .eq("is_active", true),
  ]);

  const boostedGame = boostedRows[0] || dbGame;
  const parsedOptions = mapGameOptions(boostedGame.game_options, dbGame.game_id);

  const betsData = betsRes.data || [];
  const optionVolumes: Record<string, number> = {};
  let calculatedTotalVolume = 0;
  parsedOptions.forEach((opt) => {
    optionVolumes[opt.id] = 0;
  });

  betsData.forEach((bet) => {
    const optId = (bet.prediction_data as { selectedOptionId?: string } | null)?.selectedOptionId;
    const amt = Number(bet.bet_amount) || 0;
    if (optId) {
      optionVolumes[optId] = (optionVolumes[optId] || 0) + amt;
    }
    calculatedTotalVolume += amt;
  });

  const finalTotalVolume =
    calculatedTotalVolume > 0
      ? calculatedTotalVolume
      : Number(boostedGame.total_stake_amount) ||
        Number(stats?.total_bet_amount) ||
        35000;

  const participantCount =
    betsData.length > 0
      ? Math.max(betsData.length, Number(boostedGame.total_participants_count) || 0)
      : Number(boostedGame.total_participants_count) ||
        Number(stats?.total_participants) ||
        18;

  const effectiveType = mapDbPredictionType(dbGame.prediction_type, parsedOptions.length) as
    | "binary"
    | "wdl"
    | "ranking";

  // 차트 초기 데이터 조회 (SSR)
  const initialChartData = await getGameHistory(
    dbGame.game_id,
    parsedOptions.map((opt) => ({ id: opt.id }))
  );

  // 라이브 응원톡 룸 유연 매칭
  const matchedLiveRoom =
    findLiveRoomByGame(dbGame.game_id) ||
    findLiveRoomByGame(dbGame.slug) ||
    findLiveRoomByKeyword(dbGame.title) ||
    findLiveRoomByKeyword(dbGame.slug) ||
    findLiveRoomByKeyword(dbGame.category);

  const gameForView: PredictionGameDetail = {
    id: dbGame.game_id,
    title: dbGame.title || "제목 없음",
    description: dbGame.description || "",
    predictionType: effectiveType,
    options: parsedOptions.map((opt, idx) => {
      const optVol = optionVolumes[opt.id] || 0;
      const prob =
        calculatedTotalVolume > 0
          ? optVol / calculatedTotalVolume
          : opt.currentOdds || 1 / parsedOptions.length;
      const clampedProb = Math.max(0.02, Math.min(0.98, prob));
      const odds = clampedProb > 0 ? Number((1 / clampedProb).toFixed(2)) : 2.0;

      return {
        id: opt.id || `option-${idx}`,
        label: opt.text || `옵션 ${idx + 1}`,
        description: opt.description,
        probability: Number(clampedProb.toFixed(4)),
        odds: Math.min(Math.max(odds, 1.01), 99),
        volume: optVol > 0 ? optVol : Math.round(finalTotalVolume * clampedProb),
        change24h: idx === 0 ? 2.4 : -1.2,
      };
    }),
    totalVolume: finalTotalVolume,
    participantCount,
    endTime: toIsoOrFallback(dbGame.registration_end, 7 * 24 * 60 * 60 * 1000),
    settlementTime: toIsoOrFallback(dbGame.settlement_date, 14 * 24 * 60 * 60 * 1000),
    status: mapStatus(dbGame.status),
    category: dbGame.category || "예측",
    subcategory: dbGame.subcategory || undefined,
    dataSource: dbGame.data_source || "kosis",
    externalId: dbGame.external_id || undefined,
    settlementType: dbGame.settlement_type || "auto",
    liveRoom: matchedLiveRoom
      ? {
          id: matchedLiveRoom.id,
          title: matchedLiveRoom.title,
          viewerCount: matchedLiveRoom.viewerCount,
          statusText: matchedLiveRoom.matchScore?.statusText || "LIVE 진행 중",
        }
      : undefined,
    creator: {
      name: "PosMul 공인 오라클",
      reputation: 4.9,
      avatar: "🏛️",
    },
    prizePool: Math.round(Number(boostedGame.allocated_prize_pool) || 25000),
    minimumStake: Number(dbGame.min_bet_amount) || 100,
    maximumStake: Number(dbGame.max_bet_amount) || 50000,
  };

  return {
    game: gameForView,
    userBalance: balanceResult ?? { pmp: 1000, pmc: 500 },
    userBets,
    initialChartData,
    slug: decodedSlug,
  };
}

export async function renderPredictionDetailBySlug(slug: string) {
  const data = await fetchPredictionDetailDataBySlug(slug);
  if (!data) notFound();

  return (
    <UniversalPredictionDetailClient
      game={data.game}
      userBalance={data.userBalance}
      userBets={data.userBets}
      initialChartData={data.initialChartData}
      slug={data.slug}
    />
  );
}
