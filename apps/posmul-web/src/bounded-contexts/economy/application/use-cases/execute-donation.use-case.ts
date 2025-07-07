/**
 * 기부 실행 Use Case
 *
 * 사용자가 PMP/PMC를 활용한 기부를 통해 사회적 가치를 창출하는 핵심 비즈니스 로직
 * Behavioral Economics(Kahneman-Tversky Prospect Theory)와
 * Public Choice Theory(Buchanan) 적용
 */

import { UserId } from "@posmul/auth-economy-sdk";

import {
  AccountBalance,
  IPMPPMCAccountRepository,
  Transaction,
} from "../../domain/repositories/pmp-pmc-account.repository";
import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  IndividualUtilityParameters,
} from "../../domain/repositories/utility-function.repository";
import {
  BehavioralEconomicsEngine,
  PublicChoiceEngine,
  UtilityFunctionEstimationService,
} from "../../domain/services";
import { PMC, PMP, createPMC, createPMP } from "../../domain/value-objects";

export interface DonationRequest {
  readonly userId: UserId;
  readonly donationType: DonationType;
  readonly amount: PMP | PMC;
  readonly currencyType: "PMP" | "PMC";
  readonly recipient: DonationRecipient;
  readonly publicGoodCategory: PublicGoodCategory;
  readonly isAnonymous: boolean;
  readonly message?: string;
  readonly timestamp: Date;
}

export interface DonationResult {
  readonly success: boolean;
  readonly donationId: string;
  readonly actualAmount: PMP | PMC;
  readonly socialImpactScore: number;
  readonly utilityGain: number;
  readonly prospectValue: number; // Kahneman-Tversky 기반
  readonly publicChoiceEffect: number; // Buchanan 이론 기반
  readonly updatedBalance: AccountBalance;
  readonly taxIncentive?: number;
  readonly matchingBonus?: PMP;
  readonly message: string;
}

export type DonationType =
  | "direct_transfer"
  | "public_good_funding"
  | "community_project"
  | "emergency_relief"
  | "educational_support"
  | "environmental_protection";

export interface DonationRecipient {
  readonly id: string;
  readonly name: string;
  readonly type: "individual" | "organization" | "public_project";
  readonly verificationStatus: "verified" | "pending" | "unverified";
  readonly impactRating: number; // 0-10
  readonly transparencyScore: number; // 0-1
}

export type PublicGoodCategory =
  | "healthcare"
  | "education"
  | "infrastructure"
  | "environment"
  | "social_welfare"
  | "culture_arts"
  | "research_development"
  | "disaster_relief";

/**
 * 기부 실행 Use Case
 *
 * Behavioral Economics와 Public Choice Theory를 적용하여
 * 기부 행위의 효용을 극대화하고 사회적 후생을 증진하는 메커니즘
 */
export class ExecuteDonationUseCase {
  constructor(
    private readonly accountRepository: IPMPPMCAccountRepository,
    private readonly utilityRepository: IUtilityFunctionRepository,
    private readonly behavioralEngine: BehavioralEconomicsEngine,
    private readonly publicChoiceEngine: PublicChoiceEngine,
    private readonly utilityService: UtilityFunctionEstimationService
  ) {}

  async execute(request: DonationRequest): Promise<DonationResult> {
    try {
      // 1. 현재 계정 상태 및 잔액 확인
      const balanceResult = await this.accountRepository.getAccountBalance(
        request.userId
      );
      if (!balanceResult.success) {
        throw new Error("Account not found");
      }

      const currentBalance = balanceResult.data;

      // 2. 잔액 충분성 검증
      await this.validateSufficientBalance(currentBalance, request);

      // 3. 사용자 심리 프로필 및 효용함수 조회
      const utilityParamsResult =
        await this.utilityRepository.getUtilityParameters(request.userId);
      const biasProfileResult =
        await this.utilityRepository.getBehavioralBiasProfile(request.userId);

      // 4. Prospect Theory 기반 기부 가치 평가
      const prospectValue = await this.calculateProspectValue(
        request,
        biasProfileResult.success ? biasProfileResult.data : null
      );

      // 5. Public Choice Theory 기반 공공재 효과 분석
      const publicChoiceEffect = await this.calculatePublicChoiceEffect(
        request.publicGoodCategory,
        request.amount as number,
        request.recipient
      );

      // 6. 사회적 임팩트 점수 계산
      const socialImpactScore = this.calculateSocialImpact(
        request.donationType,
        request.publicGoodCategory,
        request.recipient,
        request.amount as number
      );

      // 7. 매칭 보너스 및 세제 혜택 계산
      const incentives = await this.calculateIncentives(
        request,
        socialImpactScore,
        currentBalance
      );

      // 8. 기부 거래 실행
      const donationId = `donation_${Date.now()}_${request.userId}`;
      const transactionData: Omit<Transaction, "transactionId"> = {
        userId: request.userId,
        type: "DONATION",
        amount: request.amount as number,
        currencyType: request.currencyType,
        description: `Donation to ${request.recipient.name}: ${request.amount} ${request.currencyType} for ${request.publicGoodCategory}`,
        timestamp: request.timestamp,
      };

      const transactionResult = await this.accountRepository.saveTransaction(
        transactionData
      );
      if (!transactionResult.success) {
        throw new Error("Failed to execute donation transaction");
      }

      // 9. 매칭 보너스 지급 (있는 경우)
      if (
        incentives.matchingBonus &&
        (incentives.matchingBonus as number) > 0
      ) {
        const bonusTransaction: Omit<Transaction, "transactionId"> = {
          userId: request.userId,
          type: "PMP_EARN",
          amount: incentives.matchingBonus as number,
          currencyType: "PMP",
          description: `Donation matching bonus for ${donationId}`,
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

      // 11. 개인 효용 증가 계산
      const utilityGain = await this.calculateUtilityGain(
        utilityParamsResult.success ? utilityParamsResult.data : null,
        request.amount as number,
        socialImpactScore,
        prospectValue
      );

      return {
        success: true,
        donationId,
        actualAmount: request.amount,
        socialImpactScore,
        utilityGain,
        prospectValue,
        publicChoiceEffect,
        updatedBalance: updatedBalanceResult.data,
        taxIncentive: incentives.taxIncentive,
        matchingBonus: incentives.matchingBonus,
        message: `Successfully donated ${request.amount} ${request.currencyType} to ${request.recipient.name}`,
      };
    } catch (error) {
      return {
        success: false,
        donationId: "",
        actualAmount:
          request.currencyType === "PMP" ? createPMP(0) : createPMC(0),
        socialImpactScore: 0,
        utilityGain: 0,
        prospectValue: 0,
        publicChoiceEffect: 0,
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
        message: `Donation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * 잔액 충분성 검증
   */
  private async validateSufficientBalance(
    balance: AccountBalance,
    request: DonationRequest
  ): Promise<void> {
    const requestedAmount = request.amount as number;

    if (request.currencyType === "PMP") {
      const currentPMP = balance.pmpBalance as number;
      if (currentPMP < requestedAmount) {
        throw new Error(
          `Insufficient PMP balance: ${currentPMP} < ${requestedAmount}`
        );
      }
    } else {
      const currentPMC = balance.pmcBalance as number;
      if (currentPMC < requestedAmount) {
        throw new Error(
          `Insufficient PMC balance: ${currentPMC} < ${requestedAmount}`
        );
      }
    }
  }

  /**
   * Kahneman-Tversky Prospect Theory 기반 기부 가치 평가
   *
   * V(x) = x^α if x ≥ 0 (gains)
   * V(x) = -λ(-x)^β if x < 0 (losses)
   *
   * 기부는 손실이지만 사회적 기여로 인한 심리적 이득으로 전환
   */
  private async calculateProspectValue(
    request: DonationRequest,
    biasProfile: BehavioralBiasProfile | null
  ): Promise<number> {
    const amount = request.amount as number;

    // 기본 Prospect Theory 파라미터
    const alpha = 0.88; // 이득에 대한 가치함수 지수
    const beta = 0.88; // 손실에 대한 가치함수 지수
    const lambda = biasProfile?.lossAversion || 2.25; // 손실회피 계수

    // 기부는 금전적 손실이지만 사회적 이득으로 변환
    const monetaryLoss = -lambda * Math.pow(amount, beta);

    // 사회적 기여에 대한 심리적 이득 계산
    const socialGainMultiplier = this.getSocialGainMultiplier(
      request.donationType,
      request.publicGoodCategory,
      request.isAnonymous
    );

    const socialGain = Math.pow(amount * socialGainMultiplier, alpha);

    // 최종 Prospect Value (사회적 이득이 금전적 손실을 상회하도록)
    return socialGain + monetaryLoss;
  }

  /**
   * Buchanan Public Choice Theory 기반 공공재 효과 분석
   *
   * Iron Triangle 극복과 Median Voter Theorem 적용을 통한
   * 공공재 공급의 효율성 증대 효과 측정
   */
  private async calculatePublicChoiceEffect(
    category: PublicGoodCategory,
    amount: number,
    recipient: DonationRecipient
  ): Promise<number> {
    // 공공재 카테고리별 효과 계수
    const categoryEffects: Record<PublicGoodCategory, number> = {
      healthcare: 0.85, // 의료는 높은 공공재 효과
      education: 0.9, // 교육은 최고 수준의 공공재 효과
      infrastructure: 0.7, // 인프라는 장기적 효과
      environment: 0.8, // 환경은 세대간 효과
      social_welfare: 0.75, // 사회복지는 재분배 효과
      culture_arts: 0.6, // 문화예술은 정성적 효과
      research_development: 0.95, // 연구개발은 혁신 효과
      disaster_relief: 0.88, // 재해구호는 즉시적 효과
    };

    const baseEffect = categoryEffects[category];

    // 수혜자의 투명성과 영향력에 따른 조정
    const transparencyAdjustment = recipient.transparencyScore;
    const impactAdjustment = recipient.impactRating / 10;

    // Iron Triangle 극복 효과 (직접 기부를 통한 중간 단계 제거)
    const ironTriangleReduction = 0.15; // 15% 효율성 증가

    // 최종 Public Choice 효과
    const finalEffect =
      baseEffect *
      transparencyAdjustment *
      impactAdjustment *
      (1 + ironTriangleReduction);

    return Math.min(finalEffect, 1.0); // 최대 100% 효과
  }

  /**
   * 사회적 임팩트 점수 계산
   */
  private calculateSocialImpact(
    donationType: DonationType,
    category: PublicGoodCategory,
    recipient: DonationRecipient,
    amount: number
  ): number {
    // 기부 유형별 기본 점수
    const typeScores: Record<DonationType, number> = {
      direct_transfer: 6,
      public_good_funding: 9,
      community_project: 8,
      emergency_relief: 10,
      educational_support: 9,
      environmental_protection: 8,
    };

    const baseScore = typeScores[donationType];

    // 금액에 따른 로그 스케일 조정
    const amountMultiplier = Math.log10(Math.max(amount, 10)) / 3; // 1000 기준 정규화

    // 수혜자 신뢰도 조정
    const trustMultiplier =
      recipient.verificationStatus === "verified"
        ? 1.0
        : recipient.verificationStatus === "pending"
        ? 0.8
        : 0.6;

    // 최종 점수 (0-10 스케일)
    return Math.min(baseScore * amountMultiplier * trustMultiplier, 10);
  }

  /**
   * 인센티브 계산 (매칭 보너스, 세제 혜택)
   */
  private async calculateIncentives(
    request: DonationRequest,
    socialImpactScore: number,
    currentBalance: AccountBalance
  ): Promise<{ matchingBonus?: PMP; taxIncentive?: number }> {
    const amount = request.amount as number;

    // 매칭 보너스 계산 (사회적 임팩트에 비례)
    const matchingRate = Math.min(socialImpactScore / 100, 0.1); // 최대 10% 매칭
    const matchingBonus = createPMP(Math.floor(amount * matchingRate));

    // 세제 혜택 (기부 금액의 일정 비율)
    const taxIncentiveRate = this.getTaxIncentiveRate(
      request.publicGoodCategory
    );
    const taxIncentive = amount * taxIncentiveRate;

    return {
      matchingBonus: (matchingBonus as number) > 0 ? matchingBonus : undefined,
      taxIncentive: taxIncentive > 0 ? taxIncentive : undefined,
    };
  }

  /**
   * 개인 효용 증가 계산
   * U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
   */
  private async calculateUtilityGain(
    utilityParams: IndividualUtilityParameters | null,
    donationAmount: number,
    socialImpactScore: number,
    prospectValue: number
  ): Promise<number> {
    if (!utilityParams) return prospectValue;

    // 기부에 대한 효용 계수 (γ)
    const donationUtilityCoeff = utilityParams.gamma;

    // 사회적 기여에 대한 효용
    const socialUtility =
      donationUtilityCoeff *
      Math.log(donationAmount + 1) *
      (socialImpactScore / 10);

    // Prospect Theory 가치와 개인 효용의 조합
    return socialUtility + prospectValue * 0.5;
  }

  /**
   * 사회적 기여 승수 계산
   */
  private getSocialGainMultiplier(
    donationType: DonationType,
    category: PublicGoodCategory,
    isAnonymous: boolean
  ): number {
    let multiplier = 1.5; // 기본 사회적 기여 승수

    // 익명 기부 시 추가 심리적 만족 (순수 이타주의)
    if (isAnonymous) {
      multiplier += 0.3;
    }
    // 카테고리별 추가 승수
    if (category === "disaster_relief" || category === "healthcare") {
      multiplier += 0.4; // 긴급/의료 지원은 높은 심리적 보상
    }

    return multiplier;
  }

  /**
   * 공공재 카테고리별 세제 혜택 비율
   */
  private getTaxIncentiveRate(category: PublicGoodCategory): number {
    const rates: Record<PublicGoodCategory, number> = {
      healthcare: 0.15,
      education: 0.15,
      infrastructure: 0.1,
      environment: 0.12,
      social_welfare: 0.15,
      culture_arts: 0.1,
      research_development: 0.2, // R&D는 최고 세제 혜택
      disaster_relief: 0.18,
    };

    return rates[category];
  }
}
