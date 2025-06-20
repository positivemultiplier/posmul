/**
 * PMC 전환 Use Case
 *
 * PMP를 PMC로 전환하는 핵심 비즈니스 로직
 * Agency Theory 기반 Principal-Agent 문제 해결과 CAPM 모델 적용
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
  IndividualUtilityParameters,
} from "../../domain/repositories/utility-function.repository";
import {
  AgencyTheoryEngine,
  BehavioralEconomicsEngine,
  CAPMEngine,
} from "../../domain/services";
import { PMC, PMP, createPMC, createPMP } from "../../domain/value-objects";

export interface PMCConversionRequest {
  readonly userId: UserId;
  readonly pmpAmount: PMP;
  readonly conversionReason: ConversionReason;
  readonly riskTolerance: number; // 0-1 범위
  readonly timestamp: Date;
}

export interface PMCConversionResult {
  readonly success: boolean;
  readonly convertedPMC: PMC;
  readonly conversionRate: number;
  readonly riskPremium: number;
  readonly agencyCostReduction: number;
  readonly updatedBalance: AccountBalance;
  readonly expectedReturn: number;
  readonly message: string;
}

export type ConversionReason =
  | "investment"
  | "risk_diversification"
  | "participation_incentive"
  | "liquidity_provision"
  | "governance_participation";

/**
 * PMC 전환 Use Case
 *
 * Jensen & Meckling Agency Theory와 CAPM 모델을 적용하여
 * PMP(Risk-Free Asset)를 PMC(Risky Asset)로 전환하는 최적화된 메커니즘
 */
export class ConvertToPMCUseCase {
  constructor(
    private readonly accountRepository: IPMPPMCAccountRepository,
    private readonly utilityRepository: IUtilityFunctionRepository,
    private readonly agencyEngine: AgencyTheoryEngine,
    private readonly capmEngine: CAPMEngine,
    private readonly behavioralEngine: BehavioralEconomicsEngine
  ) {}

  async execute(request: PMCConversionRequest): Promise<PMCConversionResult> {
    try {
      // 1. 현재 계정 상태 및 PMP 잔액 확인
      const balanceResult = await this.accountRepository.getAccountBalance(
        request.userId
      );
      if (!balanceResult.success) {
        throw new Error("Account not found");
      }

      const currentBalance = balanceResult.data;
      const requestedPMP = request.pmpAmount as number;
      const currentPMP = currentBalance.pmpBalance as number;

      if (currentPMP < requestedPMP) {
        throw new Error("Insufficient PMP balance");
      }

      // 2. 사용자 행동 패턴 및 위험 선호도 조회
      const utilityParamsResult =
        await this.utilityRepository.getUtilityParameters(request.userId);
      const biasProfileResult =
        await this.utilityRepository.getBehavioralBiasProfile(request.userId);

      // 3. Agency Theory 기반 정보 비대칭성 감소 효과 계산
      const agencyCostReduction = await this.calculateAgencyCostReduction(
        request.userId,
        request.conversionReason,
        requestedPMP
      );

      // 4. CAPM 기반 위험 프리미엄 및 기대 수익률 계산
      const riskMetrics = await this.calculateRiskMetrics(
        request.riskTolerance,
        utilityParamsResult.success ? utilityParamsResult.data : null,
        biasProfileResult.success ? biasProfileResult.data : null
      );

      // 5. 전환율 계산 (Agency Theory + CAPM + Behavioral Adjustments)
      const conversionRate = this.calculateConversionRate(
        agencyCostReduction,
        riskMetrics.riskPremium,
        request.conversionReason
      );

      // 6. PMC 수량 계산
      const convertedPMC = createPMC(requestedPMP * conversionRate); // 7. 거래 기록 생성
      const transactionData: Omit<Transaction, "transactionId"> = {
        userId: request.userId,
        type: "PMP_TO_PMC_CONVERT",
        amount: requestedPMP,
        currencyType: "PMP",
        description: `PMP to PMC conversion: ${requestedPMP} PMP → ${convertedPMC} PMC (${request.conversionReason})`,
        timestamp: request.timestamp,
      };

      // 8. 거래 실행
      const transactionResult = await this.accountRepository.saveTransaction(
        transactionData
      );
      if (!transactionResult.success) {
        throw new Error("Failed to execute conversion transaction");
      }

      // 9. 업데이트된 잔액 조회
      const updatedBalanceResult =
        await this.accountRepository.getAccountBalance(request.userId);
      if (!updatedBalanceResult.success) {
        throw new Error("Failed to get updated balance");
      }

      return {
        success: true,
        convertedPMC,
        conversionRate,
        riskPremium: riskMetrics.riskPremium,
        agencyCostReduction,
        updatedBalance: updatedBalanceResult.data,
        expectedReturn: riskMetrics.expectedReturn,
        message: `Successfully converted ${requestedPMP} PMP to ${convertedPMC} PMC at rate ${conversionRate.toFixed(
          4
        )}`,
      };
    } catch (error) {
      return {
        success: false,
        convertedPMC: createPMC(0),
        conversionRate: 0,
        riskPremium: 0,
        agencyCostReduction: 0,
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
        expectedReturn: 0,
        message: `Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Agency Theory 기반 정보 비대칭성 감소에 따른 Agency Cost 절감 효과 계산
   *
   * Jensen & Meckling (1976) 모델 적용:
   * - Monitoring Cost 절감
   * - Bonding Cost 최적화
   * - Residual Loss 최소화
   */
  private async calculateAgencyCostReduction(
    userId: UserId,
    reason: ConversionReason,
    pmpAmount: number
  ): Promise<number> {
    // 전환 이유별 Agency Cost 절감 효과
    const reasonMultipliers: Record<ConversionReason, number> = {
      investment: 0.15, // 15% Agency Cost 절감
      risk_diversification: 0.1,
      participation_incentive: 0.2, // 참여 인센티브로 최대 절감
      liquidity_provision: 0.12,
      governance_participation: 0.18, // 거버넌스 참여로 높은 절감
    };

    const baseReduction = reasonMultipliers[reason];

    // PMP 규모에 따른 조정 (규모가 클수록 더 큰 절감 효과)
    const scaleAdjustment = Math.min(pmpAmount / 10000, 1.5); // 최대 50% 추가 혜택

    return baseReduction * scaleAdjustment;
  }

  /**
   * CAPM 기반 위험 프리미엄 및 기대 수익률 계산
   *
   * E(R) = Rf + β(Rm - Rf)
   * - Rf: PMP 수익률 (Risk-Free Rate)
   * - β: PMC의 시장 베타
   * - (Rm - Rf): 시장 위험 프리미엄
   */
  private async calculateRiskMetrics(
    riskTolerance: number,
    utilityParams: IndividualUtilityParameters | null,
    biasProfile: BehavioralBiasProfile | null
  ): Promise<{ riskPremium: number; expectedReturn: number; beta: number }> {
    // 기본 시장 파라미터
    const riskFreeRate = 0.03; // 3% 기준금리
    const marketRiskPremium = 0.08; // 8% 시장 위험 프리미엄

    // 개인별 위험 선호도 기반 베타 조정
    const personalRiskAdjustment = utilityParams?.delta || 0.5;
    const behavioralAdjustment = biasProfile?.lossAversion || 0.5;

    // PMC의 베타 계수 (시장 대비 위험도)
    const baseBeta = 1.2; // PMC는 시장보다 20% 더 위험
    const adjustedBeta = baseBeta * riskTolerance * (1 - behavioralAdjustment);

    // 위험 프리미엄 계산
    const riskPremium = adjustedBeta * marketRiskPremium;

    // 기대 수익률 계산
    const expectedReturn = riskFreeRate + riskPremium;

    return {
      riskPremium,
      expectedReturn,
      beta: adjustedBeta,
    };
  }

  /**
   * PMP → PMC 전환율 계산
   *
   * 전환율 = 기준율 × (1 + AgencyCostReduction) × (1 + RiskPremiumAdjustment) × ReasonMultiplier
   */
  private calculateConversionRate(
    agencyCostReduction: number,
    riskPremium: number,
    reason: ConversionReason
  ): number {
    // 기준 전환율 (1 PMP = 0.9 PMC)
    const baseRate = 0.9;

    // Agency Cost 절감에 따른 전환율 혜택
    const agencyBonus = agencyCostReduction;

    // 위험 프리미엄에 따른 조정
    const riskAdjustment = Math.max(0, 0.1 - riskPremium); // 위험이 낮을수록 더 유리한 전환

    // 전환 이유별 추가 혜택
    const reasonBonuses: Record<ConversionReason, number> = {
      investment: 0.02,
      risk_diversification: 0.01,
      participation_incentive: 0.05, // 참여 인센티브로 최대 혜택
      liquidity_provision: 0.03,
      governance_participation: 0.04,
    };

    const reasonBonus = reasonBonuses[reason];

    // 최종 전환율 계산 (최대 1.2배까지 가능)
    const finalRate = Math.min(
      baseRate * (1 + agencyBonus + riskAdjustment + reasonBonus),
      1.2
    );

    return Math.max(finalRate, 0.5); // 최소 0.5배 보장
  }
}
