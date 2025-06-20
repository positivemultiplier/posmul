/**
 * 예측 게임 참여 Use Case
 *
 * 사용자가 PMP/PMC를 활용하여 예측 게임에 참여하고 정확도에 따라 보상을 받는 핵심 비즈니스 로직
 * Network Economics(Metcalfe's Law)와 Learning Curve Theory 적용
 */

import { UserId } from "@/shared/types/branded-types";
import {
  AccountBalance,
  IPMPPMCAccountRepository,
  Transaction,
} from "../../domain/repositories/pmp-pmc-account.repository";
import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
} from "../../domain/repositories/utility-function.repository";
import {
  BehavioralEconomicsEngine,
  NetworkEconomicsEngine,
  UtilityFunctionEstimationService,
} from "../../domain/services";
import { PMC, PMP, createPMC, createPMP } from "../../domain/value-objects";

export interface PredictionGameRequest {
  readonly userId: UserId;
  readonly gameId: string;
  readonly predictionType: PredictionType;
  readonly stake: PMP | PMC;
  readonly stakeType: "PMP" | "PMC";
  readonly prediction: PredictionData;
  readonly confidence: number; // 0-1 범위
  readonly timestamp: Date;
}

export interface PredictionGameResult {
  readonly success: boolean;
  readonly predictionId: string;
  readonly stakeAmount: PMP | PMC;
  readonly potentialReward: PMP | PMC;
  readonly networkValue: number; // Metcalfe's Law 기반
  readonly learningBonus: number;
  readonly accuracyExpectation: number;
  readonly updatedBalance: AccountBalance;
  readonly gameMetrics: GameMetrics;
  readonly message: string;
}

export type PredictionType =
  | "market_price"
  | "economic_indicator"
  | "policy_outcome"
  | "social_trend"
  | "environmental_metric"
  | "technology_adoption";

export interface PredictionData {
  readonly question: string;
  readonly options: PredictionOption[];
  readonly selectedOption: string;
  readonly reasoning?: string;
  readonly timeHorizon: "1d" | "1w" | "1m" | "3m" | "1y";
  readonly difficulty: "easy" | "medium" | "hard" | "expert";
}

export interface PredictionOption {
  readonly id: string;
  readonly label: string;
  readonly probability?: number; // 사용자가 부여한 확률
}

export interface GameMetrics {
  readonly participantCount: number;
  readonly totalStake: number;
  readonly averageConfidence: number;
  readonly consensusLevel: number; // 의견 일치도
  readonly networkEffect: number;
  readonly informationValue: number;
}

/**
 * 예측 게임 참여 Use Case
 *
 * Metcalfe's Law를 적용한 네트워크 가치 증대와
 * Learning Curve Theory 기반 예측 정확도 향상 메커니즘
 */
export class ParticipateInPredictionGameUseCase {
  constructor(
    private readonly accountRepository: IPMPPMCAccountRepository,
    private readonly utilityRepository: IUtilityFunctionRepository,
    private readonly networkEngine: NetworkEconomicsEngine,
    private readonly behavioralEngine: BehavioralEconomicsEngine,
    private readonly utilityService: UtilityFunctionEstimationService
  ) {}

  async execute(request: PredictionGameRequest): Promise<PredictionGameResult> {
    try {
      // 1. 현재 계정 상태 및 잔액 확인
      const balanceResult = await this.accountRepository.getAccountBalance(
        request.userId
      );
      if (!balanceResult.success) {
        throw new Error("Account not found");
      }

      const currentBalance = balanceResult.data;

      // 2. 스테이크 잔액 충분성 검증
      await this.validateSufficientStake(currentBalance, request);

      // 3. 사용자 예측 이력 및 학습 패턴 조회
      const utilityParamsResult =
        await this.utilityRepository.getUtilityParameters(request.userId);
      const biasProfileResult =
        await this.utilityRepository.getBehavioralBiasProfile(request.userId);

      // 4. 게임 참여자 수 및 네트워크 효과 계산 (Metcalfe's Law)
      const gameMetrics = await this.calculateGameMetrics(request.gameId);
      const networkValue = this.calculateNetworkValue(
        gameMetrics.participantCount,
        request.stake as number
      );

      // 5. Learning Curve 기반 예측 정확도 추정
      const accuracyExpectation = await this.estimateAccuracyExpectation(
        request.userId,
        request.predictionType,
        request.prediction.difficulty,
        biasProfileResult.success ? biasProfileResult.data : null
      );

      // 6. 학습 보너스 계산 (참여를 통한 역량 향상 보상)
      const learningBonus = this.calculateLearningBonus(
        request.prediction.difficulty,
        request.confidence,
        accuracyExpectation
      );

      // 7. 잠재적 보상 계산
      const potentialReward = this.calculatePotentialReward(
        request.stake as number,
        request.stakeType,
        accuracyExpectation,
        networkValue,
        learningBonus
      );

      // 8. 예측 참여 거래 실행
      const predictionId = `prediction_${Date.now()}_${request.userId}_${
        request.gameId
      }`;
      const transactionData: Omit<Transaction, "transactionId"> = {
        userId: request.userId,
        type: request.stakeType === "PMP" ? "PMP_SPEND" : "PMC_SPEND",
        amount: Math.abs(request.stake as number),
        currencyType: request.stakeType === "PMP" ? "PMP" : "PMC",
        description: `Prediction game stake: ${request.stake} ${request.stakeType} for ${request.predictionType} prediction`,
        timestamp: request.timestamp,
      };

      const transactionResult = await this.accountRepository.saveTransaction(
        transactionData
      );
      if (!transactionResult.success) {
        throw new Error("Failed to execute prediction stake transaction");
      }

      // 9. 참여 보너스 지급 (즉시 지급되는 학습 인센티브)
      if (learningBonus > 0) {
        const bonusTransaction: Omit<Transaction, "transactionId"> = {
          userId: request.userId,
          type: "PMP_EARN",
          amount: Math.floor(learningBonus),
          currencyType: "PMP",
          description: `Prediction game participation bonus for ${predictionId}`,
          timestamp: request.timestamp,
        };

        await this.accountRepository.saveTransaction(bonusTransaction);
      }

      // 10. 업데이트된 잔액 조회
      const updatedBalanceResult =
        await this.accountRepository.getAccountBalance(request.userId);
      if (!updatedBalanceResult.success) {
        throw new Error("Failed to get updated balance");
      }

      return {
        success: true,
        predictionId,
        stakeAmount: request.stake,
        potentialReward:
          request.stakeType === "PMP"
            ? createPMP(potentialReward)
            : createPMC(potentialReward),
        networkValue,
        learningBonus,
        accuracyExpectation,
        updatedBalance: updatedBalanceResult.data,
        gameMetrics,
        message: `Successfully staked ${request.stake} ${request.stakeType} on ${request.predictionType} prediction`,
      };
    } catch (error) {
      return {
        success: false,
        predictionId: "",
        stakeAmount: request.stakeType === "PMP" ? createPMP(0) : createPMC(0),
        potentialReward:
          request.stakeType === "PMP" ? createPMP(0) : createPMC(0),
        networkValue: 0,
        learningBonus: 0,
        accuracyExpectation: 0,
        updatedBalance: {
          userId: request.userId,
          pmpBalance: createPMP(0),
          pmcBalance: createPMC(0),
          totalPMPEarned: createPMP(0),
          totalPMCEarned: createPMC(0),
          totalPMPSpent: createPMP(0),
          totalPMCSpent: createPMC(0),
          accountStatus: "active",
          lastActivityAt: new Date(),
          agencyScore: 0,
          informationAsymmetryReduction: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        gameMetrics: {
          participantCount: 0,
          totalStake: 0,
          averageConfidence: 0,
          consensusLevel: 0,
          networkEffect: 0,
          informationValue: 0,
        },
        message: `Prediction game participation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * 스테이크 잔액 충분성 검증
   */
  private async validateSufficientStake(
    balance: AccountBalance,
    request: PredictionGameRequest
  ): Promise<void> {
    const stakeAmount = request.stake as number;

    if (request.stakeType === "PMP") {
      const currentPMP = balance.pmpBalance as number;
      if (currentPMP < stakeAmount) {
        throw new Error(
          `Insufficient PMP balance: ${currentPMP} < ${stakeAmount}`
        );
      }
    } else {
      const currentPMC = balance.pmcBalance as number;
      if (currentPMC < stakeAmount) {
        throw new Error(
          `Insufficient PMC balance: ${currentPMC} < ${stakeAmount}`
        );
      }
    }
  }

  /**
   * 게임 메트릭스 계산 (실제 구현에서는 게임 저장소에서 조회)
   */
  private async calculateGameMetrics(gameId: string): Promise<GameMetrics> {
    // Mock 데이터 - 실제로는 게임 리포지토리에서 조회
    return {
      participantCount: Math.floor(Math.random() * 1000) + 50, // 50-1050명
      totalStake: Math.floor(Math.random() * 100000) + 10000, // 10K-110K
      averageConfidence: 0.6 + Math.random() * 0.3, // 0.6-0.9
      consensusLevel: 0.4 + Math.random() * 0.4, // 0.4-0.8
      networkEffect: 0,
      informationValue: 0,
    };
  }

  /**
   * Metcalfe's Law 기반 네트워크 가치 계산
   *
   * V(n) = k × n² (n: 참여자 수, k: 네트워크 상수)
   * 참여자가 많을수록 예측의 집단 지성 효과 증대
   */
  private calculateNetworkValue(
    participantCount: number,
    stakeAmount: number
  ): number {
    const metcalfeConstant = 0.001; // 네트워크 상수
    const baseNetworkValue = metcalfeConstant * Math.pow(participantCount, 2);

    // 스테이크 크기에 따른 개인 기여도 조정
    const stakeMultiplier = Math.log10(Math.max(stakeAmount, 10)) / 3; // 1000 기준 정규화

    return baseNetworkValue * stakeMultiplier;
  }

  /**
   * Learning Curve Theory 기반 예측 정확도 추정
   *
   * Accuracy = Base_Accuracy × (1 + Learning_Rate × Experience)^(-Learning_Exponent)
   * 반복 참여를 통한 학습 효과 반영
   */
  private async estimateAccuracyExpectation(
    userId: UserId,
    predictionType: PredictionType,
    difficulty: string,
    biasProfile: BehavioralBiasProfile | null
  ): Promise<number> {
    // 예측 유형별 기본 정확도
    const baseAccuracies: Record<PredictionType, number> = {
      market_price: 0.55,
      economic_indicator: 0.6,
      policy_outcome: 0.45,
      social_trend: 0.5,
      environmental_metric: 0.65,
      technology_adoption: 0.4,
    };

    const baseAccuracy = baseAccuracies[predictionType];

    // 난이도별 조정
    const difficultyAdjustments = {
      easy: 1.2,
      medium: 1.0,
      hard: 0.8,
      expert: 0.6,
    };

    const difficultyAdjusted =
      baseAccuracy *
      difficultyAdjustments[difficulty as keyof typeof difficultyAdjustments];

    // 사용자 과신 편향 조정 (Overconfidence Bias)
    const overconfidenceAdjustment = biasProfile
      ? 1 - biasProfile.overconfidence * 0.2
      : 1;

    // Learning Curve 효과 (경험에 따른 향상 - Mock 데이터)
    const experienceLevel = Math.random(); // 실제로는 사용자 예측 이력에서 계산
    const learningEffect = 1 + experienceLevel * 0.3; // 최대 30% 향상

    const finalAccuracy = Math.min(
      difficultyAdjusted * overconfidenceAdjustment * learningEffect,
      0.95 // 최대 95% 정확도
    );

    return Math.max(finalAccuracy, 0.1); // 최소 10% 정확도
  }

  /**
   * 학습 보너스 계산
   *
   * 예측 게임 참여 자체가 사회적 학습과 정보 집적에 기여하므로 즉시 보상 제공
   */
  private calculateLearningBonus(
    difficulty: string,
    confidence: number,
    accuracyExpectation: number
  ): number {
    // 난이도별 기본 보너스
    const difficultyBonuses = {
      easy: 10,
      medium: 25,
      hard: 50,
      expert: 100,
    };

    const baseBonus =
      difficultyBonuses[difficulty as keyof typeof difficultyBonuses];

    // 자신감과 예상 정확도의 균형에 따른 조정
    const confidenceAccuracyBalance =
      1 - Math.abs(confidence - accuracyExpectation);
    const balanceMultiplier = Math.max(confidenceAccuracyBalance, 0.5); // 최소 50%

    return Math.floor(baseBonus * balanceMultiplier);
  }

  /**
   * 잠재적 보상 계산
   *
   * 예측 정확도와 네트워크 효과에 기반한 기대 수익 계산
   */
  private calculatePotentialReward(
    stakeAmount: number,
    stakeType: "PMP" | "PMC",
    accuracyExpectation: number,
    networkValue: number,
    learningBonus: number
  ): number {
    // 기본 보상 배율 (정확도 기반)
    const accuracyMultiplier = 1 + (accuracyExpectation - 0.5) * 2; // 50% 정확도에서 1배, 100%에서 2배

    // 네트워크 효과 보너스
    const networkBonus = networkValue * 0.1; // 네트워크 가치의 10%

    // PMC 스테이크 시 추가 위험 프리미엄
    const riskPremium = stakeType === "PMC" ? 1.2 : 1.0;

    // 잠재적 보상 = 스테이크 × 정확도 배율 × 위험 프리미엄 + 네트워크 보너스 + 학습 보너스
    const potentialReward =
      stakeAmount * accuracyMultiplier * riskPremium +
      networkBonus +
      learningBonus;

    return Math.floor(potentialReward);
  }
}
