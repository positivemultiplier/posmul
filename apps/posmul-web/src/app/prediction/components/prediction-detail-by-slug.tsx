import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import {
  mapDbPredictionType,
  mapGameOptions,
} from "./prediction-game-mapper";
import {
  UniversalPredictionDetailClient,
  type PredictionGameDetail,
} from "../[slug]/client";
import {
  computeBayesianMarketPosterior,
  type CollectiveParticipationSignal,
  type UserLearningProfileSummary,
} from "../../../bounded-contexts/prediction/domain/services/collective-intelligence-engine";
import { analyzePredictionCapmAndEconomy } from "../../../bounded-contexts/prediction/domain/services/prediction-economic-model";
import { getCachedPredictionDetailPublicData } from "./prediction-public-cache";
import { getCachedEffectiveFeatureFlags } from "../../../shared/lib/feature-flags/feature-flags.server";
import type { BalancedBriefingDTO } from "../../../bounded-contexts/prediction/domain/value-objects/briefing.types";
import type { AiForecastDTO } from "../../../bounded-contexts/prediction/domain/value-objects/ai-forecast.types";
import type { RelatedNewsItem } from "../../../bounded-contexts/prediction/infrastructure/adapters/naver-news.adapter";
import type { UserChallengeDTO } from "../../challenge/types";

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

function hashGameId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
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
  tailChallenges: UserChallengeDTO[];
  initialBriefing: BalancedBriefingDTO | null;
  initialForecasts: AiForecastDTO[] | null;
  relatedNews: RelatedNewsItem[];
  featureFlags: {
    naverNews: boolean;
    sportsBadge: boolean;
    aiBriefing: boolean;
    aiForecasts: boolean;
    hourglass: boolean;
    liveBanner: boolean;
    allowBetting: boolean;
  };
  slug: string;
} | null> {
  const decodedSlug = decodeURIComponent(slug);
  const supabase = await createClient();

  // 1단계 병렬: 15초 서버 캐시된 공개 게임 데이터 + 60초 캐시 기능 플래그 + 현재 유저 인증 세션 확인
  const [publicData, featureFlagsRes, userAuthRes] = await Promise.all([
    getCachedPredictionDetailPublicData(decodedSlug),
    getCachedEffectiveFeatureFlags(),
    supabase.auth.getUser(),
  ]);

  if (!publicData) return null;
  const fMap = featureFlagsRes.effectiveMap;
  const detailFeatureFlags = {
    naverNews: fMap["prediction.addon.naver_news"] !== false,
    sportsBadge: fMap["prediction.addon.sports_badge"] !== false,
    aiBriefing: fMap["prediction.addon.ai_briefing"] !== false,
    aiForecasts: fMap["prediction.addon.ai_forecasts"] !== false,
    hourglass: fMap["prediction.addon.hourglass"] !== false,
    liveBanner: fMap["prediction.addon.live_banner"] !== false,
    allowBetting: fMap["prediction.action.allow_betting"] !== false,
  };

  const {
    dbGame,
    stats,
    hourlyWavePool,
    betsData,
    initialChartData,
    liveMsgCount,
    liveChallengeCount,
    initialBriefing,
    initialForecasts,
    relatedNews,
  } = publicData;

  const user = userAuthRes.data?.user ?? null;

  // 2단계: 로그인 유저일 때만 개인 잔액 · 영구 학습 프로필 2건만 초경량 병렬 조회
  // (비로그인 시 DB 쿼리 0회 추가, 캐시 히트 시 전체 0 RTT!)
  const [balanceRes, userStatsRes] = user
    ? await Promise.all([
        supabase
          .schema("economy")
          .from("pmp_pmc_accounts")
          .select("pmp_balance, pmc_balance")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .schema("prediction")
          .from("user_prediction_stats")
          .select(
            "settled_count, win_rate, average_confidence, average_brier_score, average_log_loss, calibration_gap, skill_weight, calibration_status, recent_trend"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ])
    : [
        { data: null, error: null },
        { data: null, error: null },
      ];

  const balanceAccount = Array.isArray(balanceRes.data)
    ? balanceRes.data[0]
    : balanceRes.data;
  const balanceResult =
    user && !balanceRes.error && balanceAccount
      ? {
          pmp: balanceAccount.pmp_balance != null ? Number(balanceAccount.pmp_balance) : 0,
          pmc: balanceAccount.pmc_balance != null ? Number(balanceAccount.pmc_balance) : 0,
        }
      : null;

  // 이미 캐시된 공개 베팅 목록에서 현재 유저의 베팅만 메모리 필터링 (추가 DB 왕복 0회)
  const userBets = user
    ? betsData
        .filter((pred) => pred.user_id === user.id)
        .reverse()
        .map((pred) => ({
          betId: pred.prediction_id,
          selectedOption:
            (pred.prediction_data as { selectedOptionId?: string } | null)?.selectedOptionId || "",
          betAmount: Number(pred.bet_amount) || 0,
          status: "PENDING",
          createdAt: pred.created_at,
        }))
    : [];

  let userLearningProfile: UserLearningProfileSummary | undefined;
  const persistedStats = userStatsRes.data;
  if (persistedStats && !userStatsRes.error) {
    userLearningProfile = {
      settledCount: Number(persistedStats.settled_count ?? 0),
      winRate: Number(persistedStats.win_rate ?? 0),
      averageConfidence: Number(persistedStats.average_confidence ?? 0.5),
      averageBrierScore: Number(persistedStats.average_brier_score ?? 0.25),
      averageLogLoss: Number(persistedStats.average_log_loss ?? 0.6931),
      calibrationGap: Number(persistedStats.calibration_gap ?? 0),
      skillWeight: Number(persistedStats.skill_weight ?? 1.0),
      calibrationStatus:
        (persistedStats.calibration_status as UserLearningProfileSummary["calibrationStatus"]) ||
        "INSUFFICIENT_DATA",
      recentTrend:
        (persistedStats.recent_trend as UserLearningProfileSummary["recentTrend"]) ||
        "STABLE",
    };
  }

  const parsedOptions = mapGameOptions(dbGame.game_options, dbGame.game_id);

  // 단일 패스로 옵션별 볼륨 및 베이지안 시그널 산출 (중복 DB 조회 없이 메모리 집계)
  const optionVolumes: Record<string, number> = {};
  let calculatedTotalVolume = 0;
  parsedOptions.forEach((opt) => {
    optionVolumes[opt.id] = 0;
  });

  const signals: CollectiveParticipationSignal[] = [];
  for (const bet of betsData) {
    const pData = bet.prediction_data as {
      selectedOptionId?: string;
      optionId?: string;
    } | null;
    const optId = pData?.selectedOptionId ?? pData?.optionId;
    const amt = toFiniteNumber(bet.bet_amount, 0);
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
  }

  // MoneyWave 3단계 하이브리드 상금풀 계산 (attachHourlyGamePoolsToRows와 동일 공식, DB 추가 조회 0회)
  const difficulty = Math.max(1.0, Math.min(5.0, toFiniteNumber(dbGame.difficulty, 2.5)));
  const seedHash = hashGameId(dbGame.game_id);
  const learningBasePool = Math.round(420 * difficulty + (seedHash % 380));
  const dbParticipants = toFiniteNumber(dbGame.total_participants_count, 0);
  const baselineParticipants = Math.max(
    betsData.length,
    dbParticipants,
    (seedHash % 14) + 3
  );
  const baselineStake = Math.max(
    calculatedTotalVolume,
    toFiniteNumber(dbGame.total_stake_amount, 0),
    baselineParticipants * 600
  );
  const crowdMatchingBoost = Math.round(
    baselineParticipants * 95 + baselineStake * 0.12
  );
  const rawAllocated = toFiniteNumber(dbGame.allocated_prize_pool, 0);
  const prizePool = Math.round(
    Math.max(
      rawAllocated + hourlyWavePool,
      learningBasePool + hourlyWavePool + crowdMatchingBoost
    ) || 25000
  );

  const recentSignals = signals.slice(-10);
  const recentOptionShares: Record<string, number> = {};
  if (recentSignals.length > 0) {
    for (const sig of recentSignals) {
      recentOptionShares[sig.selectedOptionId] =
        (recentOptionShares[sig.selectedOptionId] || 0) + 1 / recentSignals.length;
    }
  }

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
      : baselineStake ||
        toFiniteNumber(stats?.total_bet_amount, 35000);

  const participantCount =
    betsData.length > 0
      ? Math.max(betsData.length, baselineParticipants)
      : baselineParticipants ||
        toFiniteNumber(stats?.total_participants, 18);

  const gameImportance = mapDifficultyToImportance(
    dbGame.difficulty,
    parsedOptions.length
  );

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

  const effectiveType = mapDbPredictionType(
    dbGame.prediction_type,
    parsedOptions.length
  ) as "binary" | "wdl" | "ranking";

  const gameMetadata = (
    dbGame as { metadata?: Record<string, unknown> | null }
  ).metadata;
  const isBeforeRegistrationEnd =
    !dbGame.registration_end ||
    new Date(dbGame.registration_end).getTime() > Date.now();
  const isLiveRoomOpened =
    Boolean(gameMetadata && gameMetadata.live_room_open === true) ||
    liveMsgCount > 0 ||
    liveChallengeCount > 0;

  const matchedLiveRoom =
    dbGame.status === "ACTIVE" && isBeforeRegistrationEnd && isLiveRoomOpened
      ? {
          id: dbGame.slug || dbGame.game_id,
          title: dbGame.title || "LIVE 응원톡",
          viewerCount: Math.max(1, participantCount + liveMsgCount),
          statusText:
            liveMsgCount > 0
              ? `LIVE 응원톡 개설됨 · 대화 ${liveMsgCount}건`
              : "LIVE 응원톡 실시간 참여 가능",
        }
      : undefined;

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
    category: typeof dbGame.category === "string" ? dbGame.category : "예측",
    subcategory: typeof dbGame.subcategory === "string" ? dbGame.subcategory : undefined,
    dataSource: typeof dbGame.data_source === "string" ? dbGame.data_source : "kosis",
    externalId: typeof dbGame.external_id === "string" ? dbGame.external_id : undefined,
    settlementType:
      typeof dbGame.settlement_type === "string" ? dbGame.settlement_type : "auto",
    liveRoom: matchedLiveRoom,
    creator: {
      name: "PosMul 공인 오라클",
      reputation: 4.9,
      avatar: "",
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
    tailChallenges: [],
    initialBriefing,
    initialForecasts,
    relatedNews,
    featureFlags: detailFeatureFlags,
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
      tailChallenges={data.tailChallenges}
      initialBriefing={data.initialBriefing}
      initialForecasts={data.initialForecasts}
      relatedNews={data.relatedNews}
      featureFlags={data.featureFlags}
      slug={data.slug}
    />
  );
}
