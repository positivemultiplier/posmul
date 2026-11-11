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
import {
  computeBayesianMarketPosterior,
  summarizeUserLearningProfile,
  type CollectiveParticipationSignal,
  type SettledPredictionRecord,
  type UserLearningProfileSummary,
} from "../../../bounded-contexts/prediction/domain/services/collective-intelligence-engine";
import { analyzePredictionCapmAndEconomy } from "../../../bounded-contexts/prediction/domain/services/prediction-economic-model";

function mapDifficultyToImportance(raw: unknown, optionCount: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(5, Math.max(1, raw));
  }
  const normalized = String(raw || "").toLowerCase();
  if (normalized === "easy" || normalized === "low") return 2;
  if (normalized === "hard" || normalized === "high") return 4;
  if (normalized === "expert" || normalized === "extreme") return 5;
  if (normalized === "medium" || normalized === "normal") return 3;
  return optionCount >= 4 ? 4 : 3;
}

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
  userLearningProfile?: UserLearningProfileSummary;
  slug: string;
} | null> {
  const decodedSlug = decodeURIComponent(slug);
  const dbGame = await getPredictionGameBySlug(decodedSlug);
  if (!dbGame) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 통계, 잔액, 유저 참여내역, 3단계 MoneyWave 부스트 풀, 옵션별 실제 참여 볼륨, 과거 정산 이력 병렬 조회
  const [stats, balanceResult, userBets, boostedRows, betsRes, userHistoryRes] = await Promise.all([
    getPredictionGameStats(dbGame.game_id),
    getUserBalance(),
    getUserBets(dbGame.game_id),
    attachHourlyGamePoolsToRows(supabase, [dbGame as PredictionGameRow]),
    supabase
      .schema("prediction")
      .from("predictions")
      .select("user_id, bet_amount, confidence_level, prediction_data, created_at")
      .eq("game_id", dbGame.game_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .schema("prediction")
          .from("predictions")
          .select("game_id, confidence_level, prediction_data, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: null, error: null }),
  ]);

  // 로그인 유저의 과거 정산 이력 기반 Brier · Calibration 지속 학습 프로필 계산
  let userLearningProfile: UserLearningProfileSummary | undefined;
  const rawUserHistory = userHistoryRes.data || [];
  if (rawUserHistory.length > 0) {
    const historyGameIds = Array.from(
      new Set(rawUserHistory.map((r) => r.game_id).filter(Boolean))
    );
    const { data: settledGames } = await supabase
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, status, winning_option_id, game_options")
      .in("game_id", historyGameIds)
      .eq("status", "SETTLED");

    if (settledGames && settledGames.length > 0) {
      const settledMap = new Map(settledGames.map((sg) => [sg.game_id, sg]));
      const settledRecords: SettledPredictionRecord[] = [];
      for (const pred of rawUserHistory) {
        const sg = settledMap.get(pred.game_id);
        const winningOptionId = sg?.winning_option_id;
        if (!sg || typeof winningOptionId !== "string" || !winningOptionId) continue;
        const predData = pred.prediction_data as { selectedOptionId?: string } | null;
        const selectedOptionId = predData?.selectedOptionId;
        if (!selectedOptionId) continue;

        const rawConf = Number(pred.confidence_level);
        const confidence = Number.isFinite(rawConf)
          ? rawConf > 1
            ? rawConf / 100
            : rawConf
          : 0.5;
        const optCount = mapGameOptions(sg.game_options, sg.game_id).length;

        settledRecords.push({
          selectedOptionId,
          correctOptionId: winningOptionId,
          confidence,
          optionCount: Math.max(2, optCount),
          createdAt: pred.created_at,
        });
      }
      userLearningProfile = summarizeUserLearningProfile(settledRecords);
    } else {
      userLearningProfile = summarizeUserLearningProfile([]);
    }
  }

  const boostedGame = boostedRows[0] || dbGame;
  const parsedOptions = mapGameOptions(boostedGame.game_options, dbGame.game_id);

  const betsData = betsRes.data || [];
  const optionVolumes: Record<string, number> = {};
  let calculatedTotalVolume = 0;
  parsedOptions.forEach((opt) => {
    optionVolumes[opt.id] = 0;
  });

  const signals: CollectiveParticipationSignal[] = [];
  betsData.forEach((bet) => {
    const pData = bet.prediction_data as {
      selectedOptionId?: string;
    } | null;
    const optId = pData?.selectedOptionId;
    const amt = Number(bet.bet_amount) || 0;
    if (optId) {
      optionVolumes[optId] = (optionVolumes[optId] || 0) + amt;
      const rawConf = Number(bet.confidence_level);
      const confidence = Number.isFinite(rawConf)
        ? rawConf > 1
          ? rawConf / 100
          : rawConf
        : 0.5;
      const isCurrentUser = Boolean(user && bet.user_id === user.id);
      signals.push({
        userId: bet.user_id,
        selectedOptionId: optId,
        stakeAmount: amt > 0 ? amt : 100,
        confidence,
        createdAt: bet.created_at,
        skillWeight: isCurrentUser ? userLearningProfile?.skillWeight : 1.0,
      });
    }
    calculatedTotalVolume += amt;
  });

  // 최근 10건 참여 비중 (군중 쏠림 / 최근 편향 진단용)
  const recentSignals = signals.slice(-10);
  const recentOptionShares: Record<string, number> = {};
  if (recentSignals.length > 0) {
    for (const sig of recentSignals) {
      recentOptionShares[sig.selectedOptionId] =
        (recentOptionShares[sig.selectedOptionId] || 0) + 1 / recentSignals.length;
    }
  }

  // 1) 순차 베이지안 사후확률 계산
  const collectiveOptions = parsedOptions.map((opt) => ({
    id: opt.id,
    label: opt.text,
    priorProbability: opt.currentOdds,
  }));
  const bayesianResult = computeBayesianMarketPosterior(collectiveOptions, signals);

  const bayesianById = new Map(bayesianResult.options.map((o) => [o.optionId, o]));

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

  const prizePool = Math.round(Number(boostedGame.allocated_prize_pool) || 25000);
  const gameImportance = mapDifficultyToImportance(
    (dbGame as { difficulty?: unknown }).difficulty,
    parsedOptions.length
  );

  // 2) CAPM · Agency Theory · Behavioral Economics 시장 분석 실행
  const capmInputs = parsedOptions.map((opt, idx) => {
    const optVol = optionVolumes[opt.id] || 0;
    const bayes = bayesianById.get(opt.id);
    const prob = bayes
      ? bayes.bayesianProbability
      : opt.currentOdds || 1 / parsedOptions.length;
    const clampedProb = Math.max(0.02, Math.min(0.98, prob));
    return {
      id: opt.id || `option-${idx}`,
      label: opt.text || `옵션 ${idx + 1}`,
      probability: clampedProb,
      volume: optVol > 0 ? optVol : Math.round(finalTotalVolume * clampedProb),
    };
  });

  const marketEconomy = analyzePredictionCapmAndEconomy({
    options: capmInputs,
    totalVolume: finalTotalVolume,
    participantCount,
    prizePool,
    gameImportance,
    normalizedEntropy: bayesianResult.normalizedEntropy,
  });
  const optionEconomyById = new Map(
    marketEconomy.options.map((m) => [m.optionId, m])
  );

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
      const optionId = opt.id || `option-${idx}`;
      const optVol = optionVolumes[opt.id] || 0;
      const bayes = bayesianById.get(opt.id);
      const econ = optionEconomyById.get(optionId);
      const prob = bayes
        ? bayes.bayesianProbability
        : opt.currentOdds || 1 / parsedOptions.length;
      const clampedProb = Math.max(0.02, Math.min(0.98, prob));
      const odds = clampedProb > 0 ? Number((1 / clampedProb).toFixed(2)) : 2.0;

      return {
        id: optionId,
        label: opt.text || `옵션 ${idx + 1}`,
        description: opt.description,
        probability: Number(clampedProb.toFixed(4)),
        rawVolumeProbability: bayes?.rawVolumeProbability,
        priorProbability: bayes?.priorProbability ?? opt.currentOdds,
        credibleInterval: bayes?.credibleInterval,
        capmBeta: econ?.capmBeta,
        capmRequiredReturn: econ?.capmRequiredReturn,
        jensenAlpha: econ?.jensenAlpha,
        agencyExclusivityBonus: econ?.agencyExclusivityBonus,
        odds: Math.min(Math.max(odds, 1.01), 99),
        volume: optVol > 0 ? optVol : Math.round(finalTotalVolume * clampedProb),
        change24h: idx === 0 ? 2.4 : -1.2,
      };
    }),
    collectiveIntelligence: {
      effectiveEvidenceStrength: bayesianResult.effectiveEvidenceStrength,
      totalPriorStrength: bayesianResult.totalPriorStrength,
      normalizedEntropy: bayesianResult.normalizedEntropy,
      isLowSampleStabilized: bayesianResult.isLowSampleStabilized,
      recentOptionShares,
      gameImportance,
      marketEconomy,
    },
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
    prizePool,
    minimumStake: Number(dbGame.min_bet_amount) || 100,
    maximumStake: Number(dbGame.max_bet_amount) || 50000,
  };

  return {
    game: gameForView,
    userBalance: balanceResult ?? { pmp: 1000, pmc: 500 },
    userBets,
    initialChartData,
    userLearningProfile,
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
      userLearningProfile={data.userLearningProfile}
      slug={data.slug}
    />
  );
}
