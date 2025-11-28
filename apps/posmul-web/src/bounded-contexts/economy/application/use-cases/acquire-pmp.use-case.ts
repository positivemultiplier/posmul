/**
 * PmpAmount 획득 Use Case
 *
 * 사용자가 다양한 활동(기부, 예측 게임 참여, 사회 기여 등)을 통해 PmpAmount를 획득하는 핵심 비즈니스 로직
 * Agency Theory와 Behavioral Economics를 적용하여 인센티브 구조 최적화
 */
import { UserId } from "@posmul/auth-economy-sdk";

import {
  AccountBalance,
  IPmpAmountPmcAmountAccountRepository,
  Transaction,
} from "../../domain/repositories/pmp-pmc-account.repository";
import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  UtilityEstimationInput,
} from "../../domain/repositories/utility-function.repository";
import {
  BehavioralEconomicsEngine,
  UtilityFunctionEstimationService,
} from "../../domain/services";
import {
  PmpAmount,
  createPmcAmount,
  createPmpAmount,
  unwrapPmpAmount,
} from "../../domain/value-objects";

export interface PmpAmountAcquisitionRequest {
  readonly userId: UserId;
  readonly activityType: PmpAmountActivityType;
  readonly activityData: ActivityData;
  readonly timestamp: Date;
}

export interface PmpAmountAcquisitionResult {
  readonly success: boolean;
  readonly pmpAmount: PmpAmount;
  readonly behavioralBonus: PmpAmount;
  readonly updatedBalance: AccountBalance;
  readonly utilityIncrease: number;
  readonly message: string;
}

export type PmpAmountActivityType =
  | "donation"
  | "prediction_game"
  | "community_service"
  | "environmental_action"
  | "educational_content"
  | "civic_participation";

export interface ActivityData {
  readonly amount?: number;
  readonly description: string;
  readonly verificationData?: unknown;
  readonly socialImpact?: number;
}

/**
 * PmpAmount 획득 Use Case
 *
 * Behavioral Economics 원리를 활용하여 사용자의 PmpAmount 획득 과정을 최적화
 * - Loss Aversion: 기존 활동 패턴 보호
 * - Endowment Effect: 획득한 PmpAmount에 대한 애착 증대
 * - Mental Accounting: 활동별 별도 보상 체계
 */
export class AcquirePmpAmountUseCase {
  constructor(
    private readonly accountRepository: IPmpAmountPmcAmountAccountRepository,
    private readonly utilityRepository: IUtilityFunctionRepository,
    private readonly behavioralEngine: BehavioralEconomicsEngine,
    private readonly utilityService: UtilityFunctionEstimationService
  ) {}

  async execute(
    request: PmpAmountAcquisitionRequest
  ): Promise<PmpAmountAcquisitionResult> {
    try {
      // 1. 현재 계정 상태 조회
      const currentBalanceResult =
        await this.accountRepository.getAccountBalance(request.userId);
      if (!currentBalanceResult.success) {
        throw new Error("Account not found");
      }
      const currentBalance = currentBalanceResult.data;

      // 2. 사용자 행동 패턴 및 효용함수 조회
      const biasProfileResult =
        await this.utilityRepository.getBehavioralBiasProfile(request.userId);
      const utilityParamsResult =
        await this.utilityRepository.getUtilityParameters(request.userId);

      // 3. 기본 PmpAmount 계산 (활동 유형별 기준)
      const basePmpAmount = this.calculateBasePmpAmount(
        request.activityType,
        request.activityData
      );

      // 4. Behavioral Economics 기반 보너스 계산
      const behavioralBonus = await this.calculateBehavioralBonus(
        request,
        biasProfileResult.success ? biasProfileResult.data : null,
        currentBalance
      );

      // 5. 총 PmpAmount 계산
      const totalPmpAmount = createPmpAmount(
        (basePmpAmount as number) + (behavioralBonus as number)
      ); // 6. 거래 기록 생성
      const transactionData: Omit<Transaction, "transactionId"> = {
        userId: request.userId,
        type: "PmpAmount_EARN",
        amount: unwrapPmpAmount(totalPmpAmount),
        currencyType: "PmpAmount",
        description: `PmpAmount acquired via ${request.activityType}: ${request.activityData.description}`,
        timestamp: request.timestamp,
      };

      // 7. 계정 업데이트
      const transactionResult =
        await this.accountRepository.saveTransaction(transactionData);
      if (!transactionResult.success) {
        throw new Error("Failed to save transaction");
      }

      const updatedBalanceResult =
        await this.accountRepository.getAccountBalance(request.userId);
      if (!updatedBalanceResult.success) {
        throw new Error("Failed to get updated balance");
      }
      const updatedBalance = updatedBalanceResult.data;

      // 8. 효용함수 업데이트를 위한 관찰 데이터 기록
      const utilityInput: UtilityEstimationInput = {
        inputId: `utility_${Date.now()}_${request.userId}`,
        userId: request.userId,
        actionType: "PmpAmount_EARN",
        actionValue: totalPmpAmount as number,
        contextData: {
          pmpBalance: updatedBalance.pmpBalance,
          pmcBalance: updatedBalance.pmcBalance,
          marketCondition: "NEUTRAL",
          socialContext: "INDIVIDUAL",
          timeOfDay: this.getTimeOfDay(),
          weekday: this.isWeekday(request.timestamp),
        },
        satisfactionScore: this.estimateSatisfaction(
          totalPmpAmount,
          request.activityData
        ),
        regretLevel: 0,
        timestamp: request.timestamp,
      };

      // Repository에 데이터 저장이 필요한 경우에만 호출
      // const saveUtilityResult = await this.utilityRepository.saveUtilityPrediction(utilityInput);

      // 9. 효용 증가 계산
      const utilityIncrease = await this.calculateUtilityIncrease(
        utilityParamsResult.success ? utilityParamsResult.data.alpha : 0.5,
        basePmpAmount as number,
        totalPmpAmount as number
      );

      return {
        success: true,
        pmpAmount: totalPmpAmount,
        behavioralBonus: createPmpAmount(behavioralBonus as number),
        updatedBalance,
        utilityIncrease,
        message: `Successfully acquired ${totalPmpAmount} PmpAmount through ${request.activityType}`,
      };
    } catch (error) {
      return {
        success: false,
        pmpAmount: createPmpAmount(0),
        behavioralBonus: createPmpAmount(0),
        updatedBalance: {
          userId: request.userId,
          pmpBalance: createPmpAmount(0),
          pmcBalance: createPmcAmount(0),
          totalPmpAmountEarned: createPmpAmount(0),
          totalPmcAmountEarned: createPmcAmount(0),
          totalPmpAmountSpent: createPmpAmount(0),
          totalPmcAmountSpent: createPmcAmount(0),
          accountStatus: "active",
          lastActivityAt: new Date(),
          agencyScore: 0,
          informationAsymmetryReduction: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        utilityIncrease: 0,
        message: "Invalid state",
      };
    }
  }

  /**
   * 활동 유형별 기본 PmpAmount 계산
   *
   * 각 활동의 사회적 가치와 난이도를 반영한 기준 PmpAmount 산정
   */
  private calculateBasePmpAmount(
    activityType: PmpAmountActivityType,
    activityData: ActivityData
  ): PmpAmount {
    const baseRates: Record<PmpAmountActivityType, number> = {
      donation: 100, // 기부액의 10% (1000원 기부 시 100 PmpAmount)
      prediction_game: 50, // 게임 참여당 50 PmpAmount + 정확도 보너스
      community_service: 200, // 지역사회 봉사 시간당 200 PmpAmount
      environmental_action: 150, // 환경 보호 활동당 150 PmpAmount
      educational_content: 75, // 교육 콘텐츠 생성/공유당 75 PmpAmount
      civic_participation: 300, // 시민 참여 활동당 300 PmpAmount
    };

    const baseRate = baseRates[activityType];
    let multiplier = 1;

    // 활동별 특수 로직
    switch (activityType) {
      case "donation":
        multiplier = Math.min((activityData.amount || 0) / 1000, 10); // 최대 10배
        break;
      case "prediction_game":
        multiplier = 1 + (activityData.socialImpact || 0) / 100; // 정확도 보너스
        break;
      case "community_service":
        multiplier = activityData.amount || 1; // 시간당
        break;
      default:
        multiplier = 1 + (activityData.socialImpact || 0) / 100;
    }

    return createPmpAmount(Math.floor(baseRate * multiplier));
  }

  /**
   * Behavioral Economics 기반 보너스 계산
   *
   * - Endowment Effect: 보유 PmpAmount가 적을수록 획득 보너스 증가
   * - Loss Aversion: 연속 활동 시 보너스 제공
   * - Mental Accounting: 활동 유형별 별도 보너스 시스템
   */
  private async calculateBehavioralBonus(
    request: PmpAmountAcquisitionRequest,
    biasProfile: BehavioralBiasProfile | null,
    currentBalance: AccountBalance
  ): Promise<PmpAmount> {
    let bonus = 0;

    if (!biasProfile) {
      return createPmpAmount(bonus);
    }

    // 1. Endowment Effect 보너스 (보유량이 적을수록 더 많은 보너스)
    const endowmentBonus = this.calculateEndowmentBonus(
      currentBalance.pmpBalance
    );

    // 2. Loss Aversion 보너스 (연속 활동 패턴 보호)
    const lossAversionBonus = await this.calculateLossAversionBonus(
      request.userId,
      request.activityType
    );

    // 3. Mental Accounting 보너스 (활동별 별도 계정 인식)
    const mentalAccountingBonus = biasProfile.mentalAccounting * 10;

    bonus = endowmentBonus + lossAversionBonus + mentalAccountingBonus;

    return createPmpAmount(Math.floor(bonus));
  }

  private calculateEndowmentBonus(currentPmpAmount: PmpAmount): number {
    // PmpAmount가 적을수록 더 많은 보너스 (최대 50% 추가)
    const threshold = 1000;
    const pmpValue = currentPmpAmount as number;
    if (pmpValue < threshold) {
      return ((threshold - pmpValue) / threshold) * 50;
    }
    return 0;
  }

  private async calculateLossAversionBonus(
    userId: UserId,
    activityType: PmpAmountActivityType
  ): Promise<number> {
    // 최근 7일간 동일 활동 횟수 조회 (실제로는 repository를 통해 조회)
    // 연속 활동 시 손실 방지를 위한 보너스 제공
    const recentActivitiesResult =
      await this.accountRepository.getUserTransactions(
        userId,
        10, // limit
        0 // offset
      );

    if (
      recentActivitiesResult.success &&
      recentActivitiesResult.data.length >= 3
    ) {
      return 25; // 연속 활동 보너스
    }
    return 0;
  }

  private estimateSatisfaction(
    totalPmpAmount: PmpAmount,
    activityData: ActivityData
  ): number {
    // 획득한 PmpAmount와 활동의 사회적 영향을 기반으로 만족도 추정
    const pmpValue = totalPmpAmount as number;
    const baseScore = Math.min(pmpValue / 100, 10);
    const impactScore = (activityData.socialImpact || 0) / 10;
    return Math.min(baseScore + impactScore, 10);
  }

  private async calculateUtilityIncrease(
    alpha: number,
    basePmpAmount: number,
    totalPmpAmount: number
  ): Promise<number> {
    // 개인 효용함수 U(x) = α·ln(PmpAmount) + β·ln(PmcAmount) + γ·S(Donate)에서 PmpAmount 증가분 효용
    if (basePmpAmount <= 0) return 0;

    const beforeUtility = alpha * Math.log(basePmpAmount);
    const afterUtility = alpha * Math.log(totalPmpAmount);

    return afterUtility - beforeUtility;
  }

  private getTimeOfDay(): "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" {
    const hour = new Date().getHours();
    if (hour < 6) return "NIGHT";
    if (hour < 12) return "MORNING";
    if (hour < 18) return "AFTERNOON";
    if (hour < 22) return "EVENING";
    return "NIGHT";
  }

  private isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  }
}
