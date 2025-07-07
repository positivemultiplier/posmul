/**
 * Utility Function Estimation Service
 *
 * 경제학 효용함수 이론을 기반으로 개인 효용함수와 사회후생함수를 실시간 추정하는 시스템
 *
 * 개인 효용함수: U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
 * 사회후생함수: W = Σᵢ Uᵢ(x) + λ·Gini(distribution)
 *
 * 이론적 기반:
 * - Cobb-Douglas 형태의 효용함수 (노벨경제학상 수상자들의 연구)
 * - Arrow's Impossibility Theorem 고려한 사회후생함수
 * - Rawls의 Veil of Ignorance와 Difference Principle
 * - Sen's Capability Approach
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Result, DomainError } from "@posmul/auth-economy-sdk";
import { PMC, PMP, unwrapPMC, unwrapPMP } from "../value-objects";

/**
 * 개인 효용함수 파라미터
 * α, β, γ는 각각 PMP, PMC, 기부에 대한 선호도를 나타냄
 */
export interface PersonalUtilityParameters {
  readonly alpha: number; // PMP에 대한 선호도 (0 ≤ α ≤ 1)
  readonly beta: number; // PMC에 대한 선호도 (0 ≤ β ≤ 1)
  readonly gamma: number; // 기부에 대한 선호도 (0 ≤ γ ≤ 1)
  readonly confidenceLevel: number; // 추정 신뢰도 (0-1)
  readonly sampleSize: number; // 학습 데이터 수
  readonly lastUpdated: Date;
}

/**
 * 사회후생함수 파라미터
 * λ는 불평등 회피 정도를 나타냄 (Atkinson's inequality aversion parameter)
 */
export interface SocialWelfareParameters {
  readonly lambda: number; // 불평등 회피 파라미터 (0 ≤ λ ≤ 5)
  readonly giniCoefficient: number; // 현재 지니 계수
  readonly totalUtility: number; // 총 효용
  readonly participantCount: number; // 참여자 수
  readonly lastCalculated: Date;
}

/**
 * 행동 관측 데이터
 * 사용자의 실제 선택을 통해 선호도를 추정
 */
export interface BehaviorObservation {
  readonly userId: UserId;
  readonly timestamp: Date;
  readonly actionType:
    | "PMP_EARN"
    | "PMC_CONVERT"
    | "DONATE"
    | "PREDICT"
    | "INVEST";
  readonly pmpAmount?: PMP;
  readonly pmcAmount?: PMC;
  readonly donationAmount?: number;
  readonly utilityRealized: number; // 실현된 효용 (만족도 점수)
  readonly contextFactors: {
    timeOfDay: number; // 0-23
    dayOfWeek: number; // 0-6
    seasonality: number; // 0-3 (계절)
    marketVolatility: number; // 시장 변동성
  };
}

/**
 * 효용함수 추정 결과
 */
export interface UtilityEstimationResult {
  readonly personalUtility: number;
  readonly marginalUtilityPMP: number; // ∂U/∂PMP
  readonly marginalUtilityPMC: number; // ∂U/∂PMC
  readonly marginalUtilityDonation: number; // ∂U/∂Donation
  readonly elasticity: {
    pmpElasticity: number; // PMP 탄력성
    pmcElasticity: number; // PMC 탄력성
    donationElasticity: number; // 기부 탄력성
  };
  readonly confidence: number; // 추정 신뢰도
}

/**
 * 사회후생 측정 결과
 */
export interface SocialWelfareResult {
  readonly totalWelfare: number;
  readonly averageUtility: number;
  readonly giniCoefficient: number;
  readonly inequalityAdjustedWelfare: number;
  readonly parettoEfficiency: number; // 파레토 효율성 점수
  readonly rawlsianWelfare: number; // 최소수혜자 기준 후생
  readonly utilizationIndex: number; // Sen's Capability 활용도
}

export class UtilityFunctionEstimationService {
  /**
   * 개인 효용함수 추정
   * 베이지안 학습과 최대우도추정법(MLE) 결합
   */
  estimatePersonalUtility(
    observations: BehaviorObservation[],
    currentPMP: PMP,
    currentPMC: PMC,
    currentDonations: number,
    priorParameters?: PersonalUtilityParameters
  ): Result<UtilityEstimationResult> {
    try {
      if (observations.length < 3) {
        return {
          success: false,
          error: new DomainError(
            "INSUFFICIENT_DATA",
            { message: "3 observations required for utility estimation" }
          ),
        };
      }

      // 베이지안 업데이트로 파라미터 추정
      const parameters = this.estimateParameters(observations, priorParameters);

      if (!this.validateParameters(parameters)) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_PARAMETERS",
            { message: "Estimated parameters are outside valid range" }
          ),
        };
      }

      // Cobb-Douglas 효용함수 계산
      // U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
      const pmpValue = unwrapPMP(currentPMP);
      const pmcValue = unwrapPMC(currentPMC);

      if (pmpValue <= 0 || pmcValue <= 0) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_PORTFOLIO",
            { message: "PMP and PMC values must be positive for utility calculation" }
          ),
        };
      }

      const personalUtility =
        parameters.alpha * Math.log(pmpValue) +
        parameters.beta * Math.log(pmcValue) +
        parameters.gamma * this.calculateDonationUtility(currentDonations);

      // 한계효용 계산
      const marginalUtilityPMP = parameters.alpha / pmpValue;
      const marginalUtilityPMC = parameters.beta / pmcValue;
      const marginalUtilityDonation = this.calculateMarginalDonationUtility(
        currentDonations,
        parameters.gamma
      );

      // 탄력성 계산
      const elasticity = {
        pmpElasticity: parameters.alpha, // Cobb-Douglas의 특성
        pmcElasticity: parameters.beta,
        donationElasticity: parameters.gamma,
      };

      return {
        success: true,
        data: {
          personalUtility,
          marginalUtilityPMP,
          marginalUtilityPMC,
          marginalUtilityDonation,
          elasticity,
          confidence: parameters.confidenceLevel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "UTILITY_ESTIMATION_FAILED",
          { message: error instanceof Error ? error.message : "Unknown error" }
        ),
      };
    }
  }

  /**
   * 사회후생함수 계산
   * W = Σᵢ Uᵢ(x) + λ·Gini(distribution)
   */
  calculateSocialWelfare(
    individualUtilities: UtilityEstimationResult[],
    wealthDistribution: number[],
    lambda: number = 1.0
  ): Result<SocialWelfareResult> {
    try {
      if (individualUtilities.length === 0) {
        return {
          success: false,
          error: new DomainError(
            "NO_PARTICIPANTS",
            { message: "participant required for social welfare calculation" }
          ),
        };
      }

      if (lambda < 0 || lambda > 5) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_LAMBDA",
            { message: "Lambda (inequality aversion) must be between 0 and 5" }
          ),
        };
      }

      // 총 효용 계산
      const totalUtility = individualUtilities.reduce(
        (sum, util) => sum + util.personalUtility,
        0
      );

      const averageUtility = totalUtility / individualUtilities.length;

      // 지니 계수 계산
      const giniCoefficient = this.calculateGiniCoefficient(wealthDistribution);

      // 불평등 조정 후생 (Atkinson Index 활용)
      const inequalityAdjustedWelfare =
        totalUtility * (1 - lambda * giniCoefficient);

      // 파레토 효율성 점수 (0-1)
      const parettoEfficiency =
        this.calculateParetoEfficiency(individualUtilities);

      // Rawls의 Difference Principle - 최소수혜자 기준
      const rawlsianWelfare = Math.min(
        ...individualUtilities.map((util) => util.personalUtility)
      );

      // Sen's Capability Approach 기반 활용도 지수
      const utilizationIndex = this.calculateCapabilityUtilization(
        individualUtilities,
        wealthDistribution
      );

      return {
        success: true,
        data: {
          totalWelfare: inequalityAdjustedWelfare,
          averageUtility,
          giniCoefficient,
          inequalityAdjustedWelfare,
          parettoEfficiency,
          rawlsianWelfare,
          utilizationIndex,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "SOCIAL_WELFARE_CALCULATION_FAILED",
          { message: error instanceof Error ? error.message : "Unknown error" }
        ),
      };
    }
  }

  /**
   * 실시간 효용함수 업데이트
   * 온라인 학습 알고리즘 적용
   */
  updateUtilityParameters(
    currentParameters: PersonalUtilityParameters,
    newObservation: BehaviorObservation,
    learningRate: number = 0.01
  ): Result<PersonalUtilityParameters> {
    try {
      if (learningRate <= 0 || learningRate > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_LEARNING_RATE",
            { message: "Learning rate must be between 0 and 1" }
          ),
        };
      }

      // 확률적 경사하강법(Stochastic Gradient Descent) 적용
      const gradients = this.calculateParameterGradients(
        currentParameters,
        newObservation
      );

      const updatedAlpha = Math.max(
        0,
        Math.min(
          1,
          currentParameters.alpha + learningRate * gradients.alphaGradient
        )
      );

      const updatedBeta = Math.max(
        0,
        Math.min(
          1,
          currentParameters.beta + learningRate * gradients.betaGradient
        )
      );

      const updatedGamma = Math.max(
        0,
        Math.min(
          1,
          currentParameters.gamma + learningRate * gradients.gammaGradient
        )
      );

      // 정규화 (α + β + γ = 1 제약조건)
      const sum = updatedAlpha + updatedBeta + updatedGamma;
      const normalizedParameters = {
        alpha: updatedAlpha / sum,
        beta: updatedBeta / sum,
        gamma: updatedGamma / sum,
      };

      // 신뢰도 업데이트 (더 많은 데이터 = 더 높은 신뢰도)
      const newSampleSize = currentParameters.sampleSize + 1;
      const confidenceLevel = Math.min(
        0.95,
        1 - Math.exp(-newSampleSize / 50) // 50개 샘플에서 약 63% 신뢰도
      );

      return {
        success: true,
        data: {
          ...normalizedParameters,
          confidenceLevel,
          sampleSize: newSampleSize,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "PARAMETER_UPDATE_FAILED",
          { message: error instanceof Error ? error.message : "Unknown error" }
        ),
      };
    }
  }

  /**
   * 효용함수 예측
   * 주어진 포트폴리오 변화에 대한 효용 변화 예측
   */
  predictUtilityChange(
    currentParameters: PersonalUtilityParameters,
    currentPMP: PMP,
    currentPMC: PMC,
    currentDonations: number,
    proposedPMP: PMP,
    proposedPMC: PMC,
    proposedDonations: number
  ): Result<{
    expectedUtilityChange: number;
    riskAdjustedUtility: number;
    confidenceInterval: { lower: number; upper: number };
  }> {
    try {
      // 현재 효용 계산
      const currentUtilityResult = this.estimatePersonalUtility(
        [],
        currentPMP,
        currentPMC,
        currentDonations,
        currentParameters
      );

      if (!currentUtilityResult.success) {
        return { success: false, error: (currentUtilityResult as { success: false; error: any }).error };
      }

      // 제안된 포트폴리오의 효용 계산
      const proposedUtilityResult = this.estimatePersonalUtility(
        [],
        proposedPMP,
        proposedPMC,
        proposedDonations,
        currentParameters
      );

      if (!proposedUtilityResult.success) {
        return { success: false, error: (proposedUtilityResult as { success: false; error: any }).error };
      }

      const expectedUtilityChange =
        proposedUtilityResult.data.personalUtility -
        currentUtilityResult.data.personalUtility;

      // 리스크 조정 (파라미터 불확실성 고려)
      const parameterUncertainty = 1 - currentParameters.confidenceLevel;
      const riskAdjustedUtility =
        expectedUtilityChange * (1 - parameterUncertainty);

      // 신뢰구간 계산 (베이지안 추정 기반)
      const standardError =
        this.calculateParameterStandardError(currentParameters);
      const marginOfError = 1.96 * standardError; // 95% 신뢰구간

      return {
        success: true,
        data: {
          expectedUtilityChange,
          riskAdjustedUtility,
          confidenceInterval: {
            lower: expectedUtilityChange - marginOfError,
            upper: expectedUtilityChange + marginOfError,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "UTILITY_PREDICTION_FAILED",
          { message: error instanceof Error ? error.message : "Unknown error" }
        ),
      };
    }
  }

  // Private helper methods

  private estimateParameters(
    observations: BehaviorObservation[],
    priorParameters?: PersonalUtilityParameters
  ): PersonalUtilityParameters {
    // 베이지안 최대사후확률(MAP) 추정
    // Prior: 균등분포 또는 기존 파라미터
    const prior = priorParameters || {
      alpha: 1 / 3,
      beta: 1 / 3,
      gamma: 1 / 3,
      confidenceLevel: 0.1,
      sampleSize: 0,
      lastUpdated: new Date(),
    };

    // 최대우도추정을 통한 파라미터 업데이트
    // 실제 구현에서는 수치 최적화 알고리즘 사용
    let alpha = prior.alpha;
    let beta = prior.beta;
    let gamma = prior.gamma;

    for (const obs of observations) {
      const weight = 1 / observations.length;

      if (obs.actionType === "PMP_EARN" && obs.utilityRealized > 0) {
        alpha += weight * obs.utilityRealized * 0.1;
      } else if (obs.actionType === "PMC_CONVERT" && obs.utilityRealized > 0) {
        beta += weight * obs.utilityRealized * 0.1;
      } else if (obs.actionType === "DONATE" && obs.utilityRealized > 0) {
        gamma += weight * obs.utilityRealized * 0.1;
      }
    }

    // 정규화
    const sum = alpha + beta + gamma;
    return {
      alpha: alpha / sum,
      beta: beta / sum,
      gamma: gamma / sum,
      confidenceLevel: Math.min(
        0.95,
        prior.confidenceLevel + observations.length * 0.02
      ),
      sampleSize: prior.sampleSize + observations.length,
      lastUpdated: new Date(),
    };
  }

  private validateParameters(parameters: PersonalUtilityParameters): boolean {
    return (
      parameters.alpha >= 0 &&
      parameters.alpha <= 1 &&
      parameters.beta >= 0 &&
      parameters.beta <= 1 &&
      parameters.gamma >= 0 &&
      parameters.gamma <= 1 &&
      Math.abs(parameters.alpha + parameters.beta + parameters.gamma - 1) <
        0.001
    );
  }

  private calculateDonationUtility(donationAmount: number): number {
    // 기부의 한계효용 체감 특성 반영
    return donationAmount > 0 ? Math.log(1 + donationAmount) : 0;
  }

  private calculateMarginalDonationUtility(
    donationAmount: number,
    gamma: number
  ): number {
    return donationAmount > 0 ? gamma / (1 + donationAmount) : gamma;
  }

  private calculateGiniCoefficient(distribution: number[]): number {
    const sorted = [...distribution].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((sum, val) => sum + val, 0) / n;

    if (mean === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        gini += Math.abs(sorted[i] - sorted[j]);
      }
    }

    return gini / (2 * n * n * mean);
  }

  private calculateParetoEfficiency(
    utilities: UtilityEstimationResult[]
  ): number {
    // 파레토 효율성을 0-1 점수로 변환
    // 실제로는 더 복잡한 최적화 문제 해결이 필요
    const variance = this.calculateVariance(
      utilities.map((u) => u.personalUtility)
    );
    const mean =
      utilities.reduce((sum, u) => sum + u.personalUtility, 0) /
      utilities.length;

    // 변동계수가 낮을수록 더 효율적 (단순화된 지표)
    return Math.max(0, 1 - Math.sqrt(variance) / mean);
  }

  private calculateCapabilityUtilization(
    utilities: UtilityEstimationResult[],
    wealthDistribution: number[]
  ): number {
    // Sen's Capability Approach 기반 활용도
    // 잠재 능력 대비 실현 효용의 비율
    const maxPossibleUtility = Math.max(
      ...utilities.map((u) => u.personalUtility)
    );
    const actualUtilization = utilities.map(
      (u) => u.personalUtility / maxPossibleUtility
    );

    return (
      actualUtilization.reduce((sum, util) => sum + util, 0) /
      actualUtilization.length
    );
  }

  private calculateParameterGradients(
    parameters: PersonalUtilityParameters,
    observation: BehaviorObservation
  ): { alphaGradient: number; betaGradient: number; gammaGradient: number } {
    // 경사하강법을 위한 그래디언트 계산
    // 실제 효용과 예측 효용의 차이에 기반
    const error =
      observation.utilityRealized -
      this.predictObservationUtility(parameters, observation);

    return {
      alphaGradient:
        error *
        (observation.pmpAmount
          ? Math.log(unwrapPMP(observation.pmpAmount))
          : 0),
      betaGradient:
        error *
        (observation.pmcAmount
          ? Math.log(unwrapPMC(observation.pmcAmount))
          : 0),
      gammaGradient:
        error *
        (observation.donationAmount
          ? Math.log(1 + observation.donationAmount)
          : 0),
    };
  }

  private predictObservationUtility(
    parameters: PersonalUtilityParameters,
    observation: BehaviorObservation
  ): number {
    let utility = 0;

    if (observation.pmpAmount) {
      utility += parameters.alpha * Math.log(unwrapPMP(observation.pmpAmount));
    }
    if (observation.pmcAmount) {
      utility += parameters.beta * Math.log(unwrapPMC(observation.pmcAmount));
    }
    if (observation.donationAmount) {
      utility += parameters.gamma * Math.log(1 + observation.donationAmount);
    }

    return utility;
  }

  private calculateParameterStandardError(
    parameters: PersonalUtilityParameters
  ): number {
    // 베이지안 추정의 표준오차 계산
    const n = parameters.sampleSize;
    if (n < 2) return 1.0;

    // Fisher Information Matrix 기반 근사
    return Math.sqrt(1 / n) * (1 - parameters.confidenceLevel);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return (
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length
    );
  }
}
