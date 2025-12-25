/**
 * Prediction Settlement Service
 *
 * 예측 게임 결과 정산 로직을 처리하는 서비스
 * PMP/PMC 분배 및 MoneyWave 통합 처리
 */

// 타입 정의
type PmpAmount = number;
type PmcAmount = number;

interface PredictionResultData {
  gameId: string;
  winningOptionId: string;
  settledAt: Date;
  settlementType: "automatic" | "manual" | "disputed";
}

interface ParticipantPredictionData {
  userId: string;
  optionId: string;
  stakedAmount: PmpAmount;
  stakeTime: Date;
  confidenceLevel?: number;
}

interface SettlementCalculationData {
  userId: string;
  isWinner: boolean;
  stakedAmount: PmpAmount;
  winningAmount: PmpAmount;
  platformFee: PmpAmount;
  netProfit: PmpAmount;
  agencyBonus?: PmcAmount;
  settlementReason: string;
}

interface MoneyWaveDistributionData {
  currentWave: number;
  totalPool: PmpAmount;
  distributionRatio: number;
  participantCount: number;
  averageWinning: PmpAmount;
}

export class PredictionSettlementService {
  private readonly PLATFORM_FEE_RATE = 0.02; // 2% 플랫폼 수수료
  private readonly MIN_WINNING_THRESHOLD = 1000; // 최소 당첨 금액 (PMP)
  private readonly AGENCY_BONUS_RATE = 0.05; // 에이전시 보너스 5%

  /**
   * 예측 게임 결과를 정산합니다
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
      totalPayout: PmpAmount;
      platformRevenue: PmpAmount;
      participantCount: number;
      winnerCount: number;
    };
  }> {
    void gameId;

    // 1. 승자와 패자 분류
    const winners = participants.filter(
      (p) => p.optionId === result.winningOptionId
    );
    const losers = participants.filter(
      (p) => p.optionId !== result.winningOptionId
    );

    // 2. 총 스테이킹 금액 계산
    const totalStaked = participants.reduce(
      (sum, p) => sum + p.stakedAmount,
      0
    );
    const winnersStaked = winners.reduce((sum, p) => sum + p.stakedAmount, 0);
    const losersStaked = losers.reduce((sum, p) => sum + p.stakedAmount, 0);

    void winnersStaked;
    void losersStaked;

    // 3. 승자별 정산 계산
    const winnerSettlements = this.calculateWinnerPayouts(
      winners,
      losersStaked,
      winnersStaked
    );

    // 4. 패자 정산 (손실만 기록)
    const loserSettlements: SettlementCalculationData[] = losers.map(
      (loser) => ({
        userId: loser.userId,
        isWinner: false,
        stakedAmount: loser.stakedAmount,
        winningAmount: 0,
        platformFee: 0,
        netProfit: -loser.stakedAmount,
        settlementReason: "예측 실패",
      })
    );

    // 5. MoneyWave 분배 계산
    const moneyWaveDistribution = this.calculateMoneyWaveDistribution(
      totalStaked,
      participants.length
    );

    // 6. 플랫폼 수수료 계산
    const totalPlatformFee = winnerSettlements.reduce(
      (sum, s) => sum + s.platformFee,
      0
    );

    const totalPayout = winnerSettlements.reduce(
      (sum, s) => sum + s.winningAmount,
      0
    );

    const settlements = [...winnerSettlements, ...loserSettlements];

    void settlements;

    return {
      settlements,
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
   * 승자들의 배당금 계산
   */
  private calculateWinnerPayouts(
    winners: ParticipantPredictionData[],
    losersStaked: PmpAmount,
    winnersStaked: PmpAmount
  ): SettlementCalculationData[] {
    if (winners.length === 0) {
      return [];
    }

    // 사용 가능한 상금 풀 (패자들의 스테이킹 금액)
    const prizePool = losersStaked;

    return winners.map((winner) => {
      // 개별 승자의 스테이킹 비율에 따른 상금 계산
      const stakingRatio = winner.stakedAmount / winnersStaked;
      const grossWinning = winner.stakedAmount + prizePool * stakingRatio;

      // 플랫폼 수수료 차감
      const platformFee = grossWinning * this.PLATFORM_FEE_RATE;
      const netWinning = grossWinning - platformFee;

      // 최소 당첨 금액 보장
      const finalWinning = Math.max(netWinning, this.MIN_WINNING_THRESHOLD);

      // 에이전시 보너스 (고신뢰도 예측자에게 PMC 지급)
      const agencyBonus =
        winner.confidenceLevel && winner.confidenceLevel > 0.8
          ? Math.floor(finalWinning * this.AGENCY_BONUS_RATE)
          : 0;

      return {
        userId: winner.userId,
        isWinner: true,
        stakedAmount: winner.stakedAmount,
        winningAmount: finalWinning,
        platformFee: platformFee,
        netProfit: finalWinning - winner.stakedAmount,
        agencyBonus: agencyBonus,
        settlementReason: `예측 성공 (${(stakingRatio * 100).toFixed(1)}% 비율)`,
      };
    });
  }

  /**
   * MoneyWave 분배 계산
   */
  private calculateMoneyWaveDistribution(
    totalStaked: PmpAmount,
    participantCount: number
  ): MoneyWaveDistributionData {
    // MoneyWave 현재 상태 가져오기 (실제로는 서비스에서 가져와야 함)
    const currentWave = 3; // 예시
    const waveMultiplier = this.getWaveMultiplier(currentWave);

    const distributionRatio = 0.1 * waveMultiplier; // 10% 기본 + 웨이브 보너스
    const totalPool = totalStaked * distributionRatio;
    const averageWinning =
      participantCount > 0 ? totalPool / participantCount : 0;

    return {
      currentWave,
      totalPool,
      distributionRatio,
      participantCount,
      averageWinning,
    };
  }

  /**
   * MoneyWave별 배율 계산
   */
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
   * 정산 결과를 실제 계정에 반영
   */
  async executeSettlement(
    gameId: string,
    settlements: SettlementCalculationData[]
  ): Promise<{
    success: boolean;
    processedCount: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    void gameId;

    let processedCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const settlement of settlements) {
      try {
        if (settlement.isWinner) {
          // 승자에게 PMP 지급
          await this.transferPmp(settlement.userId, settlement.winningAmount);

          // 에이전시 보너스 PMC 지급
          if (settlement.agencyBonus && settlement.agencyBonus > 0) {
            await this.transferPmc(settlement.userId, settlement.agencyBonus);
          }
        }

        // 정산 기록 저장
        await this.recordSettlement(gameId, settlement);
        processedCount++;
      } catch (error) {
        void error;
        errors.push({
          userId: settlement.userId,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    void processedCount;

    return {
      success: errors.length === 0,
      processedCount,
      errors,
    };
  }

  /**
   * PMP 전송 (실제로는 경제 시스템 연동)
   */
  private async transferPmp(userId: string, amount: PmpAmount): Promise<void> {
    // TODO: 실제 경제 시스템과 연동
    void userId;
    void amount;
  }

  /**
   * PMC 전송 (에이전시 보너스)
   */
  private async transferPmc(userId: string, amount: PmcAmount): Promise<void> {
    // TODO: 실제 경제 시스템과 연동
    void userId;
    void amount;
  }

  /**
   * 정산 기록 저장
   */
  private async recordSettlement(
    gameId: string,
    settlement: SettlementCalculationData
  ): Promise<void> {
    // TODO: 데이터베이스에 정산 기록 저장
    void gameId;
    void settlement;
  }

  /**
   * 정산 상태 조회
   */
  async getSettlementStatus(gameId: string): Promise<{
    isSettled: boolean;
    settledAt?: Date;
    settlementSummary?: any;
  }> {
    // TODO: 실제 정산 상태 조회 로직
    void gameId;
    return {
      isSettled: false,
    };
  }
}
