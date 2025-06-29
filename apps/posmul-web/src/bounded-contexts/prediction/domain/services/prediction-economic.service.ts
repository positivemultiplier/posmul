/**
 * Prediction Economic Service
 *
 * 예측 도메인과 경제 시스템 간의 Anti-Corruption Layer
 * Agency Theory와 CAPM 모델을 적용한 경제적 의사결정을 지원합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  PredictionGameId,
  PredictionId,
  Result,
  UserId,
  failure,
  success,
} from "@posmul/shared-types";
import {
  PmcEarnedEvent,
  PmpSpentEvent,
  PredictionParticipationEvent,
} from "../../../../shared/economy-kernel/events/economic-events";
import {
  EconomyKernel,
  getEconomyKernel,
} from "../../../../shared/economy-kernel/services/economy-kernel.service";
import { IDomainEventPublisher } from "../../../../shared/events/event-publisher";

/**
 * 예측 경제 서비스 에러
 */
export class PredictionEconomicError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INSUFFICIENT_PMP_BALANCE"
      | "INSUFFICIENT_PMC_BALANCE"
      | "ECONOMY_KERNEL_ERROR"
      | "EVENT_PUBLISHING_FAILED"
      | "INVALID_STAKE_AMOUNT"
      | "INVALID_REWARD_AMOUNT"
      | "SERVICE_UNAVAILABLE",
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "PredictionEconomicError";
  }
}

/**
 * PMP 참여 전 검증 결과
 */
export interface PmpParticipationCheck {
  readonly canParticipate: boolean;
  readonly currentBalance: number;
  readonly requiredAmount: number;
  readonly remainingAfterParticipation: number;
  readonly riskAssessment: {
    readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
    readonly riskScore: number; // 0-1
    readonly recommendation: string;
  };
}

/**
 * PMC 보상 계산 결과
 */
export interface PmcRewardCalculation {
  readonly baseReward: number;
  readonly accuracyMultiplier: number;
  readonly confidenceBonus: number;
  readonly finalReward: number;
  readonly agencyTheoryAdjustment: number;
  readonly capmRiskPremium: number;
}

/**
 * 예측 경제 통계
 */
export interface PredictionEconomicStats {
  readonly totalPmpSpentOnPredictions: number;
  readonly totalPmcEarnedFromPredictions: number;
  readonly averageStakeAmount: number;
  readonly averageRewardAmount: number;
  readonly winRate: number;
  readonly totalParticipations: number;
  readonly agencyEfficiencyScore: number; // Agency Theory 기반 효율성
}

/**
 * Prediction Economic Service
 *
 * 예측 도메인에서 경제 시스템과 상호작용하기 위한 서비스입니다.
 * Shared Kernel 패턴과 Anti-Corruption Layer 패턴을 구현합니다.
 */
export class PredictionEconomicService {
  private readonly economyKernel: EconomyKernel;

  constructor(private readonly eventPublisher: IDomainEventPublisher) {
    this.economyKernel = getEconomyKernel();
  }

  /**
   * 예측 참여 가능 여부 및 위험 평가
   *
   * @param userId 사용자 ID
   * @param requiredPmp 필요한 PMP 금액
   * @returns PMP 참여 검증 결과
   */
  async checkPmpParticipationEligibility(
    userId: UserId,
    requiredPmp: number
  ): Promise<Result<PmpParticipationCheck, PredictionEconomicError>> {
    try {
      // PMP 잔액 조회
      const balanceResult = await this.economyKernel.getPmpBalance(userId);
      if (!balanceResult.success) {
        return failure(
          new PredictionEconomicError(
            `Failed to check PMP balance: ${balanceResult.error.message}`,
            "ECONOMY_KERNEL_ERROR",
            balanceResult.error
          )
        );
      }

      const currentBalance = balanceResult.data;
      const canParticipate = currentBalance >= requiredPmp;
      const remainingAfterParticipation = currentBalance - requiredPmp;

      // CAPM 기반 위험 평가
      const riskAssessment = this.calculateRiskAssessment(
        currentBalance,
        requiredPmp,
        remainingAfterParticipation
      );

      const participationCheck: PmpParticipationCheck = {
        canParticipate,
        currentBalance,
        requiredAmount: requiredPmp,
        remainingAfterParticipation,
        riskAssessment,
      };

      return success(participationCheck);
    } catch (error) {
      return failure(
        new PredictionEconomicError(
          "Failed to check PMP participation eligibility",
          "SERVICE_UNAVAILABLE",
          error as Error
        )
      );
    }
  }

  /**
   * 예측 참여시 PMP 소비 처리
   *
   * @param userId 사용자 ID
   * @param gameId 예측 게임 ID
   * @param predictionId 예측 ID
   * @param stakeAmount PMP 스테이크 금액
   * @param confidence 신뢰도 (0-1)
   * @param selectedOptionId 선택한 옵션 ID
   * @returns 처리 결과
   */
  async processParticipation(
    userId: UserId,
    gameId: PredictionGameId,
    predictionId: PredictionId,
    stakeAmount: number,
    confidence: number,
    selectedOptionId: string
  ): Promise<Result<void, PredictionEconomicError>> {
    try {
      // 입력 유효성 검증
      if (stakeAmount <= 0) {
        return failure(
          new PredictionEconomicError(
            "Stake amount must be positive",
            "INVALID_STAKE_AMOUNT"
          )
        );
      }

      if (confidence < 0 || confidence > 1) {
        return failure(
          new PredictionEconomicError(
            "Confidence must be between 0 and 1",
            "INVALID_STAKE_AMOUNT"
          )
        );
      }

      // PMP 잔액 확인
      const eligibilityResult = await this.checkPmpParticipationEligibility(
        userId,
        stakeAmount
      );

      if (!eligibilityResult.success) {
        if (isFailure(eligibilityResult)) {
  if (isFailure(eligibilityResult)) {
  return failure(eligibilityResult.error);
} else {
  return failure(new Error("Unknown error"));
};
} else {
  return failure(new Error("Unknown error"));
}
      }

      if (!eligibilityResult.data.canParticipate) {
        return failure(
          new PredictionEconomicError(
            `Insufficient PMP balance. Required: ${stakeAmount}, Available: ${eligibilityResult.data.currentBalance}`,
            "INSUFFICIENT_PMP_BALANCE"
          )
        );
      }

      // 경제 이벤트 발행
      const events = [
        // PMP 소비 이벤트
        new PmpSpentEvent(
          userId,
          stakeAmount,
          "prediction-participation",
          gameId,
          `Participated in prediction game ${gameId} with stake ${stakeAmount} PMP`
        ),
        // 예측 참여 복합 이벤트
        new PredictionParticipationEvent(
          userId,
          gameId,
          predictionId,
          stakeAmount,
          confidence,
          selectedOptionId
        ),
      ];

      await this.eventPublisher.publishBatch(events);

      return success(undefined);
    } catch (error) {
      return failure(
        new PredictionEconomicError(
          "Failed to process prediction participation",
          "EVENT_PUBLISHING_FAILED",
          error as Error
        )
      );
    }
  }

  /**
   * 예측 성공시 PMC 보상 계산
   *
   * Agency Theory와 CAPM 모델을 적용한 보상 계산
   *
   * @param userId 사용자 ID
   * @param stakeAmount 스테이크 금액
   * @param accuracy 정확도 (0-1)
   * @param confidence 신뢰도 (0-1)
   * @param gameImportance 게임 중요도 (1-5)
   * @param totalParticipants 전체 참여자 수
   * @param totalCorrectPredictions 정답 예측자 수
   * @returns PMC 보상 계산 결과
   */
  calculatePmcReward(
    userId: UserId,
    stakeAmount: number,
    accuracy: number,
    confidence: number,
    gameImportance: number,
    totalParticipants: number,
    totalCorrectPredictions: number
  ): PmcRewardCalculation {
    // 기본 보상 = 스테이크 * 게임 중요도
    const baseReward = stakeAmount * (1 + gameImportance * 0.2);

    // 정확도 승수 (0.5-2.0 범위)
    const accuracyMultiplier = 0.5 + accuracy * 1.5;

    // 신뢰도 보너스 (과신 방지)
    const confidenceBonus = this.calculateConfidenceBonus(accuracy, confidence);

    // Agency Theory 조정: 정보의 질과 참여 효과
    const agencyTheoryAdjustment = this.calculateAgencyTheoryAdjustment(
      accuracy,
      confidence,
      totalParticipants,
      totalCorrectPredictions
    );

    // CAPM 위험 프리미엄
    const capmRiskPremium = this.calculateCapmRiskPremium(
      gameImportance,
      totalParticipants,
      accuracy
    );

    // 최종 보상 계산
    const finalReward = Math.round(
      baseReward *
        accuracyMultiplier *
        (1 + confidenceBonus) *
        (1 + agencyTheoryAdjustment) *
        (1 + capmRiskPremium)
    );

    return {
      baseReward,
      accuracyMultiplier,
      confidenceBonus,
      finalReward,
      agencyTheoryAdjustment,
      capmRiskPremium,
    };
  }

  /**
   * 예측 성공시 PMC 보상 지급
   *
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   * @param predictionId 예측 ID
   * @param rewardCalculation 보상 계산 결과
   * @returns 처리 결과
   */
  async processPmcReward(
    userId: UserId,
    gameId: PredictionGameId,
    predictionId: PredictionId,
    rewardCalculation: PmcRewardCalculation
  ): Promise<Result<void, PredictionEconomicError>> {
    try {
      if (rewardCalculation.finalReward <= 0) {
        return failure(
          new PredictionEconomicError(
            "Reward amount must be positive",
            "INVALID_REWARD_AMOUNT"
          )
        );
      }

      // PMC 획득 이벤트 발행
      const pmcEarnedEvent = new PmcEarnedEvent(
        userId,
        rewardCalculation.finalReward,
        "prediction-success",
        predictionId,
        `Earned ${rewardCalculation.finalReward} PMC from successful prediction in game ${gameId}`
      );

      await this.eventPublisher.publish(pmcEarnedEvent);

      return success(undefined);
    } catch (error) {
      return failure(
        new PredictionEconomicError(
          "Failed to process PMC reward",
          "EVENT_PUBLISHING_FAILED",
          error as Error
        )
      );
    }
  }

  /**
   * 사용자의 예측 경제 통계 조회
   *
   * @param userId 사용자 ID
   * @returns 예측 경제 통계
   */
  async getUserPredictionEconomicStats(
    userId: UserId
  ): Promise<Result<PredictionEconomicStats, PredictionEconomicError>> {
    try {
      // TODO: Repository 구현 후 실제 데이터 조회로 변경
      // 현재는 임시 더미 데이터 반환
      const stats: PredictionEconomicStats = {
        totalPmpSpentOnPredictions: 0,
        totalPmcEarnedFromPredictions: 0,
        averageStakeAmount: 0,
        averageRewardAmount: 0,
        winRate: 0,
        totalParticipations: 0,
        agencyEfficiencyScore: 0.75, // 임시값
      };

      return success(stats);
    } catch (error) {
      return failure(
        new PredictionEconomicError(
          "Failed to get user prediction economic stats",
          "SERVICE_UNAVAILABLE",
          error as Error
        )
      );
    }
  }

  /**
   * CAPM 기반 위험 평가
   */
  private calculateRiskAssessment(
    currentBalance: number,
    requiredAmount: number,
    remainingAfterParticipation: number
  ): PmpParticipationCheck["riskAssessment"] {
    const riskRatio = requiredAmount / currentBalance;

    let riskLevel: "LOW" | "MEDIUM" | "HIGH";
    let riskScore: number;
    let recommendation: string;

    if (riskRatio <= 0.1) {
      riskLevel = "LOW";
      riskScore = riskRatio * 5; // 0-0.5 범위
      recommendation =
        "Safe participation level. Low impact on your PMP portfolio.";
    } else if (riskRatio <= 0.3) {
      riskLevel = "MEDIUM";
      riskScore = 0.5 + (riskRatio - 0.1) * 2.5; // 0.5-1.0 범위
      recommendation =
        "Moderate risk. Consider your confidence level before participating.";
    } else {
      riskLevel = "HIGH";
      riskScore = Math.min(1.0, 0.8 + (riskRatio - 0.3) * 0.5);
      recommendation =
        "High risk participation. Only proceed if you have high confidence.";
    }

    return {
      riskLevel,
      riskScore,
      recommendation,
    };
  }

  /**
   * 신뢰도 보너스 계산 (과신 방지)
   * Kahneman-Tversky Prospect Theory 적용
   */
  private calculateConfidenceBonus(
    accuracy: number,
    confidence: number
  ): number {
    // 과신 페널티: 신뢰도가 정확도를 크게 초과하면 보너스 감소
    const overconfidencePenalty = Math.max(0, confidence - accuracy);

    // 적정 신뢰도 보너스: 정확도와 신뢰도가 일치할 때 최대
    const calibrationBonus = 1 - Math.abs(confidence - accuracy);

    // 최종 보너스 (0-0.2 범위)
    return Math.max(0, calibrationBonus * 0.2 - overconfidencePenalty * 0.1);
  }

  /**
   * Agency Theory 기반 조정
   * Jensen & Meckling (1976) 모델 적용
   */
  private calculateAgencyTheoryAdjustment(
    accuracy: number,
    confidence: number,
    totalParticipants: number,
    totalCorrectPredictions: number
  ): number {
    // 정보 품질 스코어
    const informationQuality = accuracy * confidence;

    // 집단 지성 효과 (많은 사람이 참여할수록 정보 가치 증가)
    const collectiveIntelligenceBonus = Math.min(0.1, totalParticipants / 1000);

    // 독점적 정보 보너스 (정답자가 적을수록 더 높은 보상)
    const exclusivityBonus =
      totalCorrectPredictions > 0
        ? Math.min(0.15, 1 / totalCorrectPredictions)
        : 0;

    return (
      informationQuality * 0.1 + collectiveIntelligenceBonus + exclusivityBonus
    );
  }

  /**
   * CAPM 위험 프리미엄 계산
   * Sharpe-Lintner-Mossin 모델 적용
   */
  private calculateCapmRiskPremium(
    gameImportance: number,
    totalParticipants: number,
    accuracy: number
  ): number {
    // 베타 계산 (게임 중요도와 참여자 수 기반)
    const beta = (gameImportance / 5) * Math.min(1.5, totalParticipants / 100);

    // 시장 위험 프리미엄 (3% 기본값)
    const marketRiskPremium = 0.03;

    // 개별 위험 조정 (정확도 기반)
    const individualRiskAdjustment = accuracy * 0.02;

    return beta * marketRiskPremium + individualRiskAdjustment;
  }
}

/**
 * 공장 함수: PredictionEconomicService 인스턴스 생성
 */
export const createPredictionEconomicService = (
  eventPublisher: IDomainEventPublisher
): PredictionEconomicService => {
  return new PredictionEconomicService(eventPublisher);
};
