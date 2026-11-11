/**
 * Prediction Settlement Service
 *
 * PosMul 표준 하이브리드 패리뮤추얼(Time-Weighted Seeded Parimutuel) 정산 및
 * PMP ➔ PMC 전환 수식을 담당하는 핵심 도메인/애플리케이션 서비스
 *
 * 핵심 수학 모델:
 * 1. 스무딩 확률 (LMSR 스타일 유동성 시드 b 반영):
 *    P_i = (S_i + b) / Σ_j (S_j + b)
 * 2. 얼리버드(Early-Bird) 시간 가중치:
 *    w(t) = 1.0 + 0.5 * clamp((T_close - t) / (T_close - T_open), 0, 1)  ∈ [1.0, 1.5]
 * 3. 승자 배당 (패자 PMP 풀 + MoneyWave 시드 풀 비례 배분):
 *    EffectiveStake_i = s_i * w(t_i)
 *    GrossReward_i = s_i + (Pool_losers + Pool_moneyWave) * (EffectiveStake_i / Σ_winners EffectiveStake)
 */

import {
  computeBrierLearningUpdate,
  summarizeUserLearningProfile,
  type BrierLearningResult,
  type UserLearningProfileSummary,
} from "../../domain/services/collective-intelligence-engine";
import {
  calculateAgencyTheoryMetrics,
  calculateProspectConfidenceAdjustment,
  calculateSeededMultiplier,
} from "../../domain/services/prediction-economic-model";

type PmpAmount = number;
type PmcAmount = number;

export interface PredictionResultData {
  gameId: string;
  winningOptionId: string;
  settledAt: Date;
  settlementType: "automatic" | "manual" | "disputed";
  /** 게임 오픈 시각 (얼리버드 시간 가중치 산출용) */
  gameOpenTime?: Date;
  /** 베팅 마감 시각 (얼리버드 시간 가중치 산출용) */
  gameCloseTime?: Date;
  /** 게임에 배정된 MoneyWave 시드 상금 풀 (기본값: DEFAULT_MONEY_WAVE_SEED) */
  allocatedMoneyWavePool?: PmcAmount;
}

export interface ParticipantPredictionData {
  userId: string;
  optionId: string;
  stakedAmount: PmpAmount;
  stakeTime: Date;
  confidenceLevel?: number;
}

export interface SettlementCalculationData {
  userId: string;
  isWinner: boolean;
  stakedAmount: PmpAmount;
  /** 얼리버드 시간 가중치 (1.0 ~ 1.5) */
  earlyBirdWeight: number;
  /** 시간 가중치가 반영된 유효 지분 */
  effectiveStake: number;
  winningAmount: PmcAmount;
  platformFee: PmcAmount;
  netProfit: PmcAmount;
  agencyBonus?: PmcAmount;
  settlementReason: string;
}

export interface MoneyWaveDistributionData {
  currentWave: number;
  totalPool: PmcAmount;
  seedLiquidityPerOption: PmpAmount;
  distributionRatio: number;
  participantCount: number;
  averageWinning: PmcAmount;
}

export class PredictionSettlementService {
  private readonly PLATFORM_FEE_RATE = 0.02; // 2% 플랫폼 수수료
  private readonly MIN_WINNING_THRESHOLD = 100; // 최소 보장 당첨 PMC
  private readonly AGENCY_BONUS_RATE = 0.05; // 고신뢰도(80%+) 예측 적중 보너스 5%
  private readonly MAX_EARLY_BIRD_BONUS = 0.5; // 조기 참여 가중치 최대 +50% (w_t ∈ [1.0, 1.5])
  public static readonly DEFAULT_LIQUIDITY_SEED = 5000; // 옵션당 기본 가상 유동성 시드 b (5,000 PMP)

  /**
   * LMSR 스타일 유동성 시드(b)가 반영된 옵션별 스무딩 확률 계산
   * - 참여자가 0명이거나 1명일 때도 100% : 0%로 튀지 않고 부드러운 확률 분포 제공
   */
  public static calculateSmoothedProbabilities(
    optionStakes: Record<string, number>,
    optionIds: string[],
    liquiditySeed: number = PredictionSettlementService.DEFAULT_LIQUIDITY_SEED
  ): Record<string, number> {
    const count = optionIds.length;
    if (count === 0) return {};

    const b = Math.max(100, liquiditySeed);
    let denominator = 0;
    for (const id of optionIds) {
      denominator += (optionStakes[id] || 0) + b;
    }

    const probabilities: Record<string, number> = {};
    for (const id of optionIds) {
      const numerator = (optionStakes[id] || 0) + b;
      probabilities[id] =
        denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 1 / count;
    }
    return probabilities;
  }

  /**
   * 특정 옵션에 베팅했을 때 예상 배당 배율(Multiplier) 계산
   * - 반대편 베팅이 0원이어도 MoneyWave 시드 풀 덕분에 최소 > 1.0x 배당 성립
   */
  public static calculateExpectedMultiplier(
    targetOptionStake: number,
    totalAllOptionsStake: number,
    moneyWaveSeedPool: number = PredictionSettlementService.DEFAULT_LIQUIDITY_SEED,
    feeRate: number = 0.02
  ): number {
    return calculateSeededMultiplier(
      targetOptionStake,
      totalAllOptionsStake,
      moneyWaveSeedPool,
      feeRate
    );
  }

  /**
   * 얼리버드(Early-Bird) 시간 가중치 계산: w(t) ∈ [1.0, 1.5]
   * - 오픈 직후 참여 시 1.5배, 마감 직전 참여 시 1.0배
   */
  public calculateEarlyBirdWeight(
    stakeTime: Date,
    gameOpenTime?: Date,
    gameCloseTime?: Date
  ): number {
    if (!gameOpenTime || !gameCloseTime) {
      return 1.15; // 타임라인 정보 미제공 시 기본 중간 가중치
    }

    const totalWindowMs = gameCloseTime.getTime() - gameOpenTime.getTime();
    if (totalWindowMs <= 0) return 1.0;

    const remainingMs = gameCloseTime.getTime() - stakeTime.getTime();
    const ratio = Math.min(1, Math.max(0, remainingMs / totalWindowMs));
    return Number((1.0 + this.MAX_EARLY_BIRD_BONUS * ratio).toFixed(3));
  }

  /**
   * 예측 게임 결과를 정산합니다 (Seeded Parimutuel + Early-Bird 가중치)
   */
  async settlePrediction(
    gameId: string,
    result: PredictionResultData,
    participants: ParticipantPredictionData[]
  ): Promise<{
    settlements: SettlementCalculationData[];
    moneyWaveDistribution: MoneyWaveDistributionData;
    summary: {
      totalStaked: PmpAmount;
      totalPayout: PmcAmount;
      platformRevenue: PmcAmount;
      participantCount: number;
      winnerCount: number;
    };
  }> {
    void gameId;

    const winners = participants.filter(
      (p) => p.optionId === result.winningOptionId
    );
    const losers = participants.filter(
      (p) => p.optionId !== result.winningOptionId
    );

    const totalStaked = participants.reduce(
      (sum, p) => sum + p.stakedAmount,
      0
    );
    const losersStaked = losers.reduce((sum, p) => sum + p.stakedAmount, 0);

    // MoneyWave 분배 풀 계산 (최소 시드 풀 보장)
    const moneyWaveDistribution = this.calculateMoneyWaveDistribution(
      totalStaked,
      participants.length,
      result.allocatedMoneyWavePool
    );

    // 승자별 정산 계산 (패자 풀 + MoneyWave 시드 풀 결합, 얼리버드 + Agency/Prospect 보너스)
    const winnerSettlements = this.calculateWinnerPayouts(
      winners,
      losersStaked,
      moneyWaveDistribution.totalPool,
      participants.length,
      result.gameOpenTime,
      result.gameCloseTime
    );

    // 패자 정산 (PMP 소각 기록)
    const loserSettlements: SettlementCalculationData[] = losers.map(
      (loser) => ({
        userId: loser.userId,
        isWinner: false,
        stakedAmount: loser.stakedAmount,
        earlyBirdWeight: this.calculateEarlyBirdWeight(
          loser.stakeTime,
          result.gameOpenTime,
          result.gameCloseTime
        ),
        effectiveStake: loser.stakedAmount,
        winningAmount: 0,
        platformFee: 0,
        netProfit: -loser.stakedAmount,
        settlementReason: "예측 미적중 (PMP 소각 · 사회적 예측 비용 전환)",
      })
    );

    const totalPlatformFee = winnerSettlements.reduce(
      (sum, s) => sum + s.platformFee,
      0
    );
    const totalPayout = winnerSettlements.reduce(
      (sum, s) => sum + s.winningAmount,
      0
    );

    return {
      settlements: [...winnerSettlements, ...loserSettlements],
      moneyWaveDistribution,
      summary: {
        totalStaked,
        totalPayout,
        platformRevenue: totalPlatformFee,
        participantCount: participants.length,
        winnerCount: winners.length,
      },
    };
  }

  /**
   * 승자들의 배당금 계산 (Time-Weighted Seeded Parimutuel)
   */
  private calculateWinnerPayouts(
    winners: ParticipantPredictionData[],
    losersStaked: PmpAmount,
    moneyWavePool: PmcAmount,
    totalParticipants: number,
    gameOpenTime?: Date,
    gameCloseTime?: Date
  ): SettlementCalculationData[] {
    if (winners.length === 0) {
      return [];
    }

    // 1. 각 승자의 얼리버드 가중치 및 유효 지분(effectiveStake) 산출
    const weightedWinners = winners.map((winner) => {
      const earlyBirdWeight = this.calculateEarlyBirdWeight(
        winner.stakeTime,
        gameOpenTime,
        gameCloseTime
      );
      const effectiveStake = winner.stakedAmount * earlyBirdWeight;
      return { winner, earlyBirdWeight, effectiveStake };
    });

    const totalEffectiveStake = weightedWinners.reduce(
      (sum, item) => sum + item.effectiveStake,
      0
    );

    // 2. 분배 가능한 총 보너스 상금 풀 = 패자 PMP 총합 + MoneyWave 배정 풀
    // (반대편 베팅이 0원이어도 moneyWavePool이 존재하므로 항상 > 1.0x 배당 성립!)
    const totalPrizePool = losersStaked + moneyWavePool;

    return weightedWinners.map(({ winner, earlyBirdWeight, effectiveStake }) => {
      const shareRatio =
        totalEffectiveStake > 0
          ? effectiveStake / totalEffectiveStake
          : 1 / winners.length;

      const grossWinning = winner.stakedAmount + totalPrizePool * shareRatio;
      const platformFee = Math.floor(grossWinning * this.PLATFORM_FEE_RATE);
      const netWinning = Math.floor(grossWinning - platformFee);
      const finalWinning = Math.max(netWinning, this.MIN_WINNING_THRESHOLD);

      // confidenceLevel 0~100 또는 0~1 스케일 모두 안전 정규화 후 Agency · Prospect 적정확신 보너스 계산
      const normalizedConf =
        winner.confidenceLevel === undefined
          ? 0.5
          : winner.confidenceLevel > 1
          ? winner.confidenceLevel / 100
          : winner.confidenceLevel;

      const prospectAdj = calculateProspectConfidenceAdjustment(1.0, normalizedConf);
      const agencyAdj = calculateAgencyTheoryMetrics({
        accuracy: 1.0,
        confidence: normalizedConf,
        totalParticipants: Math.max(totalParticipants, winners.length),
        totalCorrectPredictions: winners.length,
      });

      const effectiveAgencyBonusRate =
        normalizedConf >= 0.8
          ? Math.max(
              this.AGENCY_BONUS_RATE,
              Math.min(0.25, prospectAdj.confidenceBonus + agencyAdj.exclusivityBonus * 0.5)
            )
          : Math.min(0.15, prospectAdj.confidenceBonus * 0.5);

      const agencyBonus = Math.floor(finalWinning * effectiveAgencyBonusRate);

      return {
        userId: winner.userId,
        isWinner: true,
        stakedAmount: winner.stakedAmount,
        earlyBirdWeight,
        effectiveStake: Math.round(effectiveStake),
        winningAmount: finalWinning,
        platformFee,
        netProfit: finalWinning - winner.stakedAmount,
        agencyBonus,
        settlementReason: `예측 성공 (지분 ${(shareRatio * 100).toFixed(1)}%, 얼리버드 ${earlyBirdWeight}x, 신뢰도 ${Math.round(normalizedConf * 100)}%)`,
      };
    });
  }

  /**
   * MoneyWave 분배 계산 (최소 유동성 시드 보장)
   */
  private calculateMoneyWaveDistribution(
    totalStaked: PmpAmount,
    participantCount: number,
    allocatedPool?: PmcAmount
  ): MoneyWaveDistributionData {
    const currentWave = 3;
    const waveMultiplier = this.getWaveMultiplier(currentWave);
    const distributionRatio = 0.1 * waveMultiplier;

    const calculatedPool = Math.floor(totalStaked * distributionRatio);
    const totalPool = Math.max(
      allocatedPool ?? 0,
      calculatedPool,
      PredictionSettlementService.DEFAULT_LIQUIDITY_SEED
    );

    const averageWinning =
      participantCount > 0 ? Math.floor(totalPool / participantCount) : 0;

    return {
      currentWave,
      totalPool,
      seedLiquidityPerOption: PredictionSettlementService.DEFAULT_LIQUIDITY_SEED,
      distributionRatio,
      participantCount,
      averageWinning,
    };
  }

  private getWaveMultiplier(wave: number): number {
    switch (wave) {
      case 1:
        return 1.0;
      case 2:
        return 1.2;
      case 3:
        return 1.5;
      default:
        return 1.0;
    }
  }

  /**
   * 정산 시 Brier Score · Calibration 기반 지속 학습 지표 산출
   * - 경험 편향(과신/과소신뢰)을 진단하고 다음 예측의 베이지안 스킬 가중치로 환류합니다.
   */
  public evaluateSettlementLearningMetrics(
    winningOptionId: string,
    optionCount: number,
    participants: readonly ParticipantPredictionData[]
  ): Array<{
    userId: string;
    learning: BrierLearningResult;
    updatedProfile: UserLearningProfileSummary;
  }> {
    return participants.map((participant) => {
      const conf =
        participant.confidenceLevel && participant.confidenceLevel > 1
          ? participant.confidenceLevel / 100
          : participant.confidenceLevel ?? 0.5;

      const record = {
        selectedOptionId: participant.optionId,
        correctOptionId: winningOptionId,
        confidence: conf,
        optionCount: Math.max(2, optionCount),
        createdAt: participant.stakeTime,
      };

      const learning = computeBrierLearningUpdate(record);
      const updatedProfile = summarizeUserLearningProfile([record]);
      return {
        userId: participant.userId,
        learning,
        updatedProfile,
      };
    });
  }
}
