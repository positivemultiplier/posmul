import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  computeBrierLearningUpdate,
  SettledPredictionRecord,
  summarizeUserLearningProfile,
  UserLearningProfileSummary,
} from "@/bounded-contexts/prediction/domain/services/collective-intelligence-engine";

export interface BrierHistoryEntry {
  gameId: string;
  brierScore: number;
  isCorrect: boolean;
  confidence: number;
  settledAt: string;
}

export interface ComputedUserLearningSnapshot {
  userId: string;
  profile: UserLearningProfileSummary;
  winCount: number;
  totalStaked: number;
  totalRewardPmc: number;
  roiPercentage: number;
  userBeta: number;
  experienceScore: number;
  brierHistory: BrierHistoryEntry[];
  lastSettledAt: string | null;
}

export interface RawSettledGameRow {
  game_id: string;
  status: string;
  game_options: unknown;
  winning_option_id: string | null;
  actual_result: Record<string, unknown> | null;
  settled_at: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface RawPredictionRow {
  prediction_id: string;
  game_id: string;
  user_id: string;
  bet_amount: number | null;
  confidence_level: number | null;
  prediction_data: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string;
}

export interface SyncUserStatsResult {
  updatedUsers: number;
  snapshots: ComputedUserLearningSnapshot[];
  errors: string[];
}

interface NormalizedRecordWithMeta {
  record: SettledPredictionRecord;
  gameId: string;
  stake: number;
  settledAtIso: string;
}

interface ExistingRankingScoreRow {
  user_id: string;
  expect_participations: number | null;
  expect_wins: number | null;
  expect_pmc_earned: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function extractOptionItems(gameOptions: unknown): unknown[] {
  if (Array.isArray(gameOptions)) {
    return gameOptions;
  }
  if (
    gameOptions &&
    typeof gameOptions === "object" &&
    Array.isArray((gameOptions as { options?: unknown[] }).options)
  ) {
    return (gameOptions as { options: unknown[] }).options;
  }
  return [];
}

function getOptionCandidateAliases(item: unknown, idx: number): {
  canonical: string;
  aliases: string[];
} {
  const indexAlias = `option-${idx}`;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return { canonical: trimmed, aliases: [indexAlias, trimmed] };
  }

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const candidates = [obj.id, obj.optionId, obj.label, obj.text, obj.title, obj.name]
      .filter((v): v is string | number => typeof v === "string" || typeof v === "number")
      .map((v) => String(v).trim())
      .filter(Boolean);

    if (candidates.length > 0) {
      return { canonical: candidates[0], aliases: [indexAlias, ...candidates] };
    }
  }

  return { canonical: indexAlias, aliases: [indexAlias] };
}

/**
 * 게임의 옵션 정의를 바탕으로 `Yes`/`No` 또는 `option-0`/`option-1` 등
 * 다양한 표기 ID를 단일 정규 키로 변환해 정산 정답 비교 불일치를 방지합니다.
 */
export function resolveCanonicalOptionId(
  rawOptionId: string | null | undefined,
  gameOptions: unknown
): { canonicalId: string; optionCount: number } {
  const items = extractOptionItems(gameOptions);
  const optionCount = Math.max(2, items.length);
  const rawTrimmed = (rawOptionId ?? "").trim();
  if (!rawTrimmed) {
    return { canonicalId: "", optionCount };
  }

  const rawLower = rawTrimmed.toLowerCase();
  for (let idx = 0; idx < items.length; idx++) {
    const { canonical, aliases } = getOptionCandidateAliases(items[idx], idx);
    if (aliases.some((alias) => alias.toLowerCase() === rawLower)) {
      return { canonicalId: canonical, optionCount };
    }
  }

  return { canonicalId: rawTrimmed, optionCount };
}

/**
 * 게임 행에서 최종 확정 승리 옵션 문자열 추출
 */
export function extractWinningOptionId(game: RawSettledGameRow): string | null {
  if (game.winning_option_id && game.winning_option_id.trim()) {
    return game.winning_option_id.trim();
  }
  const actual = game.actual_result;
  if (!actual || typeof actual !== "object") {
    return null;
  }
  const candidate = actual.correctOptionId ?? actual.winningOption ?? actual.winning_option_id;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

/**
 * DB에 저장된 confidence_level (0~100 정수 또는 0~1 소수)을 0~1 범위로 정규화
 */
export function normalizeConfidence(rawConfidence: number | null | undefined): number {
  if (typeof rawConfidence !== "number" || !Number.isFinite(rawConfidence)) {
    return 0.5;
  }
  const normalized = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  return clamp(normalized, 0.01, 0.99);
}

/**
 * CAPM 기반 개인 위험 성향 계수(Beta) 추정
 * - 기준(확신도 50%, 평균 1,000 PMP) = 1.0000
 * - 고확신 + 집중 투입 = Beta > 1.0 (시장 대비 공격적 성향)
 * - 신중 + 소액 분산 = Beta < 1.0 (방어적 성향)
 */
export function calculateUserCapmBeta(
  settledCount: number,
  averageConfidence: number,
  stakes: readonly number[]
): number {
  if (settledCount <= 0 || stakes.length === 0) {
    return 1.0;
  }

  const confidenceTilt = 0.65 + clamp(averageConfidence, 0, 1) * 0.7;
  const totalStake = stakes.reduce((acc, s) => acc + Math.max(0, s), 0);
  const avgStake = totalStake / stakes.length;
  const stakeFactor = clamp(Math.log10(Math.max(10, avgStake)) / 3, 0.85, 1.25);

  return Number(clamp(confidenceTilt * stakeFactor, 0.5, 2.0).toFixed(4));
}

function toNormalizedSettledRecord(
  pred: RawPredictionRow,
  settledGameMap: ReadonlyMap<string, RawSettledGameRow>
): NormalizedRecordWithMeta | null {
  const predData = pred.prediction_data;
  if (predData?.withdrawn === true) {
    return null;
  }

  const game = settledGameMap.get(pred.game_id);
  if (!game) {
    return null;
  }

  const rawSelected =
    typeof predData?.selectedOptionId === "string" ? predData.selectedOptionId : "";
  const rawWinning = extractWinningOptionId(game);
  if (!rawSelected || !rawWinning) {
    return null;
  }

  const selectedResolved = resolveCanonicalOptionId(rawSelected, game.game_options);
  const winningResolved = resolveCanonicalOptionId(rawWinning, game.game_options);
  if (!selectedResolved.canonicalId || !winningResolved.canonicalId) {
    return null;
  }

  const settledAtIso =
    game.settled_at ?? game.updated_at ?? pred.created_at ?? new Date().toISOString();

  return {
    record: {
      selectedOptionId: selectedResolved.canonicalId,
      correctOptionId: winningResolved.canonicalId,
      confidence: normalizeConfidence(pred.confidence_level),
      optionCount: Math.max(selectedResolved.optionCount, winningResolved.optionCount),
      createdAt: pred.created_at,
    },
    gameId: pred.game_id,
    stake: Math.max(0, Number(pred.bet_amount ?? 0)),
    settledAtIso,
  };
}

/**
 * 단일 유저의 정산 이력을 바탕으로 Brier · Calibration · CAPM 학습 스냅샷 계산 (순수 함수)
 */
export function computeUserLearningSnapshot(input: {
  userId: string;
  predictions: readonly RawPredictionRow[];
  settledGameMap: ReadonlyMap<string, RawSettledGameRow>;
  totalRewardPmc: number;
}): ComputedUserLearningSnapshot {
  const recordsWithMeta = input.predictions
    .map((pred) => toNormalizedSettledRecord(pred, input.settledGameMap))
    .filter((item): item is NormalizedRecordWithMeta => item !== null)
    .sort(
      (a, b) =>
        new Date(a.record.createdAt ?? a.settledAtIso).getTime() -
        new Date(b.record.createdAt ?? b.settledAtIso).getTime()
    );

  const records = recordsWithMeta.map((item) => item.record);
  const profile = summarizeUserLearningProfile(records);
  const stakes = recordsWithMeta.map((item) => item.stake);
  const totalStaked = stakes.reduce((acc, s) => acc + s, 0);
  const totalRewardPmc = Math.max(0, Math.round(input.totalRewardPmc));

  let winCount = 0;
  const brierHistoryAll: BrierHistoryEntry[] = recordsWithMeta.map((item) => {
    const update = computeBrierLearningUpdate(item.record);
    if (update.isCorrect) {
      winCount++;
    }
    return {
      gameId: item.gameId,
      brierScore: update.brierScore,
      isCorrect: update.isCorrect,
      confidence: Number(item.record.confidence.toFixed(4)),
      settledAt: item.settledAtIso,
    };
  });

  const brierHistory = brierHistoryAll.slice(-20).reverse();
  const roiPercentage =
    totalStaked > 0
      ? Number((((totalRewardPmc - totalStaked) / totalStaked) * 100).toFixed(2))
      : 0;

  return {
    userId: input.userId,
    profile,
    winCount,
    totalStaked,
    totalRewardPmc,
    roiPercentage,
    userBeta: calculateUserCapmBeta(profile.settledCount, profile.averageConfidence, stakes),
    experienceScore: Number(Math.min(1, profile.settledCount / 20).toFixed(4)),
    brierHistory,
    lastSettledAt: brierHistory.length > 0 ? brierHistory[0].settledAt : null,
  };
}

function groupUserPredictions(
  allPreds: readonly RawPredictionRow[],
  settledGameMap: ReadonlyMap<string, RawSettledGameRow>
): {
  predsByUser: Map<string, RawPredictionRow[]>;
  validTotalCountByUser: Map<string, number>;
} {
  const predsByUser = new Map<string, RawPredictionRow[]>();
  const validTotalCountByUser = new Map<string, number>();

  for (const pred of allPreds) {
    if (pred.prediction_data?.withdrawn === true) continue;

    const isSettledGame = settledGameMap.has(pred.game_id);
    if (pred.is_active !== true && !isSettledGame) continue;

    validTotalCountByUser.set(
      pred.user_id,
      (validTotalCountByUser.get(pred.user_id) ?? 0) + 1
    );

    if (isSettledGame) {
      const list = predsByUser.get(pred.user_id) ?? [];
      list.push(pred);
      predsByUser.set(pred.user_id, list);
    }
  }

  return { predsByUser, validTotalCountByUser };
}

function toStatsUpsertRow(snap: ComputedUserLearningSnapshot) {
  return {
    user_id: snap.userId,
    settled_count: snap.profile.settledCount,
    win_count: snap.winCount,
    win_rate: snap.profile.winRate,
    total_staked: snap.totalStaked,
    total_reward_pmc: snap.totalRewardPmc,
    roi_percentage: snap.roiPercentage,
    average_confidence: snap.profile.averageConfidence,
    average_brier_score: snap.profile.averageBrierScore,
    average_log_loss: snap.profile.averageLogLoss,
    calibration_gap: snap.profile.calibrationGap,
    skill_weight: snap.profile.skillWeight,
    calibration_status: snap.profile.calibrationStatus,
    recent_trend: snap.profile.recentTrend,
    user_beta: snap.userBeta,
    experience_score: snap.experienceScore,
    brier_history: snap.brierHistory,
    last_settled_at: snap.lastSettledAt,
  };
}

/**
 * 예측 정산 후 참여자 Brier · Calibration · CAPM 학습 통계를
 * `prediction.user_prediction_stats` 및 `ranking.user_scores`에 영속 동기화하는 서비스
 */
export class PredictionLearningStatsService {
  constructor(private readonly db: typeof supabaseAdmin = supabaseAdmin) {}

  /**
   * 특정 게임 정산 직후 해당 게임 참여자 전체의 학습 프로필과 랭킹 지표 동기화
   */
  async syncLearningStatsForGame(gameId: string): Promise<SyncUserStatsResult> {
    if (!gameId) {
      return { updatedUsers: 0, snapshots: [], errors: [] };
    }

    const { data: gameParticipants, error: participantError } = await this.db
      .schema("prediction")
      .from("predictions")
      .select("user_id")
      .eq("game_id", gameId);

    if (participantError) {
      return { updatedUsers: 0, snapshots: [], errors: [participantError.message] };
    }

    const userIds = Array.from(
      new Set(
        (gameParticipants || [])
          .map((row: { user_id: string | null }) => row.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (userIds.length === 0) {
      return { updatedUsers: 0, snapshots: [], errors: [] };
    }

    return this.syncLearningStatsForUsers(userIds);
  }

  /**
   * 기존 정산 완료된 모든 게임의 참여자 통계 일괄 Backfill 동기화
   */
  async syncAllSettledUsers(): Promise<SyncUserStatsResult> {
    const { data: settledGames, error: gamesErr } = await this.db
      .schema("prediction")
      .from("prediction_games")
      .select("game_id")
      .eq("status", "SETTLED");

    if (gamesErr || !settledGames || settledGames.length === 0) {
      return {
        updatedUsers: 0,
        snapshots: [],
        errors: gamesErr ? [gamesErr.message] : [],
      };
    }

    const settledGameIds = settledGames.map((g: { game_id: string }) => g.game_id);
    const { data: preds, error: predsErr } = await this.db
      .schema("prediction")
      .from("predictions")
      .select("user_id")
      .in("game_id", settledGameIds);

    if (predsErr || !preds) {
      return {
        updatedUsers: 0,
        snapshots: [],
        errors: predsErr ? [predsErr.message] : [],
      };
    }

    const userIds = Array.from(
      new Set(
        preds
          .map((row: { user_id: string | null }) => row.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    return this.syncLearningStatsForUsers(userIds);
  }

  private async fetchSettledGameMap(): Promise<{
    map: Map<string, RawSettledGameRow>;
    error?: string;
  }> {
    const { data, error } = await this.db
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, status, game_options, winning_option_id, actual_result, settled_at, updated_at, created_at"
      )
      .eq("status", "SETTLED");

    const map = new Map<string, RawSettledGameRow>();
    if (error) {
      return { map, error: error.message };
    }

    for (const game of (data || []) as RawSettledGameRow[]) {
      map.set(game.game_id, game);
    }
    return { map };
  }

  private async fetchRewardMap(
    userIds: readonly string[],
    settledGameMap: ReadonlyMap<string, RawSettledGameRow>,
    errors: string[]
  ): Promise<Map<string, number>> {
    const rewardMap = new Map<string, number>();
    const { data, error } = await this.db
      .schema("economy")
      .from("pmp_pmc_transactions")
      .select("user_id, pmc_amount, metadata")
      .in("user_id", [...userIds])
      .eq("transaction_type", "PMC_EARN");

    if (error) {
      errors.push(`reward_lookup: ${error.message}`);
      return rewardMap;
    }

    for (const tx of (data || []) as Array<{
      user_id: string;
      pmc_amount: number | string | null;
      metadata: { source?: string; game_id?: string } | null;
    }>) {
      if (tx.metadata?.source !== "prediction_win") continue;
      if (tx.metadata?.game_id && !settledGameMap.has(tx.metadata.game_id)) {
        continue;
      }
      rewardMap.set(
        tx.user_id,
        (rewardMap.get(tx.user_id) ?? 0) + Number(tx.pmc_amount ?? 0)
      );
    }

    return rewardMap;
  }

  private async syncRankingUserScores(
    snapshots: readonly ComputedUserLearningSnapshot[],
    userIds: readonly string[],
    validTotalCountByUser: ReadonlyMap<string, number>,
    errors: string[]
  ): Promise<void> {
    const { data: existingScoresData, error: fetchRankErr } = await this.db
      .schema("ranking")
      .from("user_scores")
      .select("user_id, expect_participations, expect_wins, expect_pmc_earned")
      .in("user_id", [...userIds]);

    if (fetchRankErr) {
      errors.push(`ranking_fetch: ${fetchRankErr.message}`);
      return;
    }

    const existingScoreMap = new Map<string, ExistingRankingScoreRow>();
    for (const row of (existingScoresData || []) as ExistingRankingScoreRow[]) {
      existingScoreMap.set(row.user_id, row);
    }

    const nowIso = new Date().toISOString();
    for (const snap of snapshots) {
      const existing = existingScoreMap.get(snap.userId);
      const totalValidParticipations = validTotalCountByUser.get(snap.userId) ?? 0;

      if (existing) {
        const { error: updateErr } = await this.db
          .schema("ranking")
          .from("user_scores")
          .update({
            expect_participations: Math.max(
              existing.expect_participations ?? 0,
              totalValidParticipations
            ),
            expect_wins: Math.max(existing.expect_wins ?? 0, snap.winCount),
            expect_pmc_earned: Math.max(existing.expect_pmc_earned ?? 0, snap.totalRewardPmc),
            expect_brier_score: snap.profile.averageBrierScore,
            expect_skill_weight: snap.profile.skillWeight,
            expect_calibration_status: snap.profile.calibrationStatus,
            expect_win_rate: snap.profile.winRate,
            expect_user_beta: snap.userBeta,
            expect_settled_count: snap.profile.settledCount,
            updated_at: nowIso,
          })
          .eq("user_id", snap.userId);

        if (updateErr) {
          errors.push(`ranking_update(${snap.userId}): ${updateErr.message}`);
        }
      } else {
        const { error: insertErr } = await this.db
          .schema("ranking")
          .from("user_scores")
          .insert({
            user_id: snap.userId,
            expect_participations: totalValidParticipations,
            expect_wins: snap.winCount,
            expect_pmc_earned: snap.totalRewardPmc,
            expect_brier_score: snap.profile.averageBrierScore,
            expect_skill_weight: snap.profile.skillWeight,
            expect_calibration_status: snap.profile.calibrationStatus,
            expect_win_rate: snap.profile.winRate,
            expect_user_beta: snap.userBeta,
            expect_settled_count: snap.profile.settledCount,
          });

        if (insertErr) {
          errors.push(`ranking_insert(${snap.userId}): ${insertErr.message}`);
        }
      }
    }
  }

  /**
   * 지정된 유저 ID 목록에 대해 정산 이력 전체 기반 학습 프로필 재집계 및 DB 영속화
   */
  async syncLearningStatsForUsers(
    rawUserIds: readonly string[]
  ): Promise<SyncUserStatsResult> {
    const userIds = Array.from(new Set(rawUserIds.filter(Boolean)));
    if (userIds.length === 0) {
      return { updatedUsers: 0, snapshots: [], errors: [] };
    }

    const errors: string[] = [];
    const { map: settledGameMap, error: settledGamesErr } =
      await this.fetchSettledGameMap();
    if (settledGamesErr) {
      return { updatedUsers: 0, snapshots: [], errors: [settledGamesErr] };
    }

    const { data: allPredsData, error: predsErr } = await this.db
      .schema("prediction")
      .from("predictions")
      .select(
        "prediction_id, game_id, user_id, bet_amount, confidence_level, prediction_data, is_active, created_at"
      )
      .in("user_id", userIds);

    if (predsErr) {
      return { updatedUsers: 0, snapshots: [], errors: [predsErr.message] };
    }

    const rewardMap = await this.fetchRewardMap(userIds, settledGameMap, errors);
    const { predsByUser, validTotalCountByUser } = groupUserPredictions(
      (allPredsData || []) as RawPredictionRow[],
      settledGameMap
    );

    const snapshots = userIds.map((userId) =>
      computeUserLearningSnapshot({
        userId,
        predictions: predsByUser.get(userId) ?? [],
        settledGameMap,
        totalRewardPmc: rewardMap.get(userId) ?? 0,
      })
    );

    const { error: upsertStatsErr } = await this.db
      .schema("prediction")
      .from("user_prediction_stats")
      .upsert(snapshots.map(toStatsUpsertRow), { onConflict: "user_id" });

    if (upsertStatsErr) {
      errors.push(`stats_upsert: ${upsertStatsErr.message}`);
    }

    await this.syncRankingUserScores(
      snapshots,
      userIds,
      validTotalCountByUser,
      errors
    );

    return {
      updatedUsers: snapshots.length,
      snapshots,
      errors,
    };
  }
}

export const predictionLearningStatsService = new PredictionLearningStatsService();
