/**
 * MoneyWave2 Aggregate - 미사용 PMC 재분배 시스템
 *
 * Pigou의 외부성 이론과 Rawls의 분배정의론을 적용하여
 * 미사용 PMC를 사회적 후생 극대화를 위해 재분배하는 메커니즘을 구현합니다.
 *
 * 핵심 불변성:
 * - 재분배는 6개월 이상 미사용 PMC에 대해서만 실행
 * - 재분배율은 전체 PMC 유동성과 지니계수에 따라 결정
 * - 최소 생계 보장을 위한 PMC는 재분배 대상에서 제외
 * - Pigou Tax 원리에 따른 외부효과 교정
 */

import { UserId } from "@/shared/types/branded-types";
import { DomainError, Result } from "@/shared/types/common";
import { MoneyWaveId, PMC, createPMC, unwrapPMC } from "../value-objects";

export interface UnusedPMCData {
  readonly userId: UserId;
  readonly pmcAmount: PMC;
  readonly lastActivityDate: Date;
  readonly accountType: "BASIC" | "PREMIUM" | "INSTITUTION";
  readonly minimumReserve: PMC; // 최소 생계 보장 PMC
}

export interface RedistributionPolicy {
  readonly dormancyPeriodMonths: number; // 휴면 기간 (개월)
  readonly redistributionRate: number; // 재분배율 (0-1)
  readonly giniThreshold: number; // 지니계수 임계값
  readonly minimumPoolSize: PMC; // 최소 재분배 풀 크기
  readonly maxRedistributionPerCycle: PMC; // 사이클당 최대 재분배량
}

export interface RedistributionEvent {
  readonly eventId: string;
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  readonly redistributedAmount: PMC;
  readonly redistributedAt: Date;
  readonly reason: string;
  readonly giniCoefficientBefore: number;
  readonly giniCoefficientAfter: number;
}

export interface RecipientCriteria {
  readonly minActivityScore: number; // 최소 활동 점수
  readonly maxCurrentPMC: PMC; // 최대 보유 PMC
  readonly preferredAccountTypes: string[]; // 우선 계정 유형
  readonly geographicWeight: number; // 지역별 가중치
  readonly socialNeedScore: number; // 사회적 필요도 점수
}

export enum MoneyWave2Status {
  SCANNING = "SCANNING", // 휴면 계정 스캔 중
  ANALYZING = "ANALYZING", // 재분배 분석 중
  CALCULATING = "CALCULATING", // 재분배량 계산 중
  REDISTRIBUTING = "REDISTRIBUTING", // 재분배 실행 중
  COMPLETED = "COMPLETED", // 재분배 완료
  SUSPENDED = "SUSPENDED", // 재분배 중단
}

export class MoneyWave2Aggregate {
  private constructor(
    private readonly id: MoneyWaveId,
    private status: MoneyWave2Status,
    private dormantAccounts: UnusedPMCData[],
    private redistributionPolicy: RedistributionPolicy,
    private totalRedistributed: PMC,
    private currentGiniCoefficient: number,
    private redistributionHistory: RedistributionEvent[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: MoneyWaveId,
    initialPolicy: RedistributionPolicy
  ): Result<MoneyWave2Aggregate> {
    try {
      // 정책 검증
      if (
        initialPolicy.dormancyPeriodMonths < 1 ||
        initialPolicy.dormancyPeriodMonths > 24
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_DORMANCY_PERIOD",
            "Dormancy period must be between 1 and 24 months"
          ),
        };
      }

      if (
        initialPolicy.redistributionRate <= 0 ||
        initialPolicy.redistributionRate > 0.8
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_REDISTRIBUTION_RATE",
            "Redistribution rate must be between 0 and 0.8"
          ),
        };
      }

      if (initialPolicy.giniThreshold < 0 || initialPolicy.giniThreshold > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_GINI_THRESHOLD",
            "Gini threshold must be between 0 and 1"
          ),
        };
      }

      const aggregate = new MoneyWave2Aggregate(
        id,
        MoneyWave2Status.SCANNING,
        [],
        initialPolicy,
        createPMC(0),
        0,
        [],
        new Date(),
        new Date()
      );

      return { success: true, data: aggregate };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "MONEY_WAVE2_CREATION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 휴면 계정 스캔 및 등록
   * Pigou의 외부성 이론에 따라 경제적 비효율성을 식별
   */
  scanDormantAccounts(accounts: UnusedPMCData[]): Result<void> {
    try {
      if (this.status !== MoneyWave2Status.SCANNING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATUS_FOR_SCANNING",
            `Cannot scan accounts in ${this.status} status`
          ),
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setMonth(
        cutoffDate.getMonth() - this.redistributionPolicy.dormancyPeriodMonths
      );

      // 휴면 기간 검증 및 필터링
      const validDormantAccounts = accounts.filter((account) => {
        const isDormant = account.lastActivityDate <= cutoffDate;
        const hasRedistributableAmount =
          unwrapPMC(account.pmcAmount) > unwrapPMC(account.minimumReserve);
        return isDormant && hasRedistributableAmount;
      });

      if (validDormantAccounts.length === 0) {
        return {
          success: false,
          error: new DomainError(
            "NO_DORMANT_ACCOUNTS",
            "No valid dormant accounts found for redistribution"
          ),
        };
      }

      this.dormantAccounts = validDormantAccounts;
      this.status = MoneyWave2Status.ANALYZING;
      this.updatedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "DORMANT_SCAN_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 지니계수 기반 재분배 필요성 분석
   * Rawls의 분배정의론 - 최소수혜자에게 최대 이익
   */
  analyzeRedistributionNeed(currentGiniCoefficient: number): Result<{
    needsRedistribution: boolean;
    recommendedRate: number;
    expectedGiniReduction: number;
  }> {
    try {
      if (this.status !== MoneyWave2Status.ANALYZING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATUS_FOR_ANALYSIS",
            `Cannot analyze in ${this.status} status`
          ),
        };
      }

      if (currentGiniCoefficient < 0 || currentGiniCoefficient > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_GINI_COEFFICIENT",
            "Gini coefficient must be between 0 and 1"
          ),
        };
      }

      this.currentGiniCoefficient = currentGiniCoefficient;

      const needsRedistribution =
        currentGiniCoefficient > this.redistributionPolicy.giniThreshold;

      // 동적 재분배율 계산 (지니계수가 높을수록 더 많이 재분배)
      const giniExcess = Math.max(
        0,
        currentGiniCoefficient - this.redistributionPolicy.giniThreshold
      );
      const recommendedRate = Math.min(
        this.redistributionPolicy.redistributionRate,
        this.redistributionPolicy.redistributionRate * (1 + giniExcess * 2)
      );

      // 예상 지니계수 감소 (단순화된 모델)
      const totalRedistributablePMC = this.dormantAccounts.reduce(
        (sum, account) =>
          sum +
          Math.max(
            0,
            unwrapPMC(account.pmcAmount) - unwrapPMC(account.minimumReserve)
          ),
        0
      );
      const redistributionImpact =
        (totalRedistributablePMC * recommendedRate) / 1000000; // 정규화
      const expectedGiniReduction = Math.min(0.1, redistributionImpact * 0.05);

      if (needsRedistribution) {
        this.status = MoneyWave2Status.CALCULATING;
      } else {
        this.status = MoneyWave2Status.COMPLETED;
      }

      this.updatedAt = new Date();

      return {
        success: true,
        data: {
          needsRedistribution,
          recommendedRate,
          expectedGiniReduction,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "REDISTRIBUTION_ANALYSIS_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 재분배량 계산 및 수혜자 선정
   * Utilitarian Calculus + Rawlsian Justice 결합
   */
  calculateRedistribution(
    recipients: RecipientCriteria[],
    redistributionRate?: number
  ): Result<{
    redistributionPlan: Array<{
      fromUserId: UserId;
      toUserId: UserId;
      amount: PMC;
      socialWelfareGain: number;
    }>;
    totalAmount: PMC;
    expectedSocialWelfareIncrease: number;
  }> {
    try {
      if (this.status !== MoneyWave2Status.CALCULATING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATUS_FOR_CALCULATION",
            `Cannot calculate in ${this.status} status`
          ),
        };
      }

      const effectiveRate =
        redistributionRate || this.redistributionPolicy.redistributionRate;

      if (effectiveRate <= 0 || effectiveRate > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_REDISTRIBUTION_RATE",
            "Redistribution rate must be between 0 and 1"
          ),
        };
      }

      const redistributionPlan = [];
      let totalAmount = 0;
      let expectedSocialWelfareIncrease = 0;

      // 휴면 계정별 재분배량 계산
      for (const dormantAccount of this.dormantAccounts) {
        const availableAmount =
          unwrapPMC(dormantAccount.pmcAmount) -
          unwrapPMC(dormantAccount.minimumReserve);

        if (availableAmount <= 0) continue;

        const redistributionAmount = Math.floor(
          availableAmount * effectiveRate
        );

        if (redistributionAmount <= 0) continue;

        // 최적 수혜자 선정 (사회적 한계효용이 가장 높은 순서)
        const sortedRecipients =
          this.sortRecipientsByMarginalUtility(recipients);

        for (const recipient of sortedRecipients) {
          if (
            redistributionAmount > 0 &&
            totalAmount <
              unwrapPMC(this.redistributionPolicy.maxRedistributionPerCycle)
          ) {
            const allocationAmount = Math.min(
              redistributionAmount,
              unwrapPMC(this.redistributionPolicy.maxRedistributionPerCycle) -
                totalAmount
            );

            // 사회후생 증가 계산 (로그 효용함수 가정)
            const currentUtility = Math.log(
              Math.max(1, unwrapPMC(recipient.maxCurrentPMC))
            );
            const newUtility = Math.log(
              Math.max(1, unwrapPMC(recipient.maxCurrentPMC) + allocationAmount)
            );
            const socialWelfareGain = newUtility - currentUtility;

            redistributionPlan.push({
              fromUserId: dormantAccount.userId,
              toUserId: this.generateRecipientUserId(recipient), // 임시 구현
              amount: createPMC(allocationAmount),
              socialWelfareGain,
            });

            totalAmount += allocationAmount;
            expectedSocialWelfareIncrease += socialWelfareGain;
            break;
          }
        }
      }

      this.status = MoneyWave2Status.REDISTRIBUTING;
      this.updatedAt = new Date();

      return {
        success: true,
        data: {
          redistributionPlan,
          totalAmount: createPMC(totalAmount),
          expectedSocialWelfareIncrease,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "REDISTRIBUTION_CALCULATION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 재분배 실행
   */
  executeRedistribution(
    redistributionPlan: Array<{
      fromUserId: UserId;
      toUserId: UserId;
      amount: PMC;
      socialWelfareGain: number;
    }>
  ): Result<RedistributionEvent[]> {
    try {
      if (this.status !== MoneyWave2Status.REDISTRIBUTING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATUS_FOR_EXECUTION",
            `Cannot execute redistribution in ${this.status} status`
          ),
        };
      }

      const events: RedistributionEvent[] = [];
      let totalRedistributed = 0;

      for (const plan of redistributionPlan) {
        const event: RedistributionEvent = {
          eventId: `redistrib_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          fromUserId: plan.fromUserId,
          toUserId: plan.toUserId,
          redistributedAmount: plan.amount,
          redistributedAt: new Date(),
          reason: "DORMANT_ACCOUNT_REDISTRIBUTION",
          giniCoefficientBefore: this.currentGiniCoefficient,
          giniCoefficientAfter: Math.max(0, this.currentGiniCoefficient - 0.01), // 단순화된 계산
        };

        events.push(event);
        totalRedistributed += unwrapPMC(plan.amount);
      }

      this.redistributionHistory.push(...events);
      this.totalRedistributed = createPMC(
        unwrapPMC(this.totalRedistributed) + totalRedistributed
      );
      this.status = MoneyWave2Status.COMPLETED;
      this.updatedAt = new Date();

      return { success: true, data: events };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "REDISTRIBUTION_EXECUTION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 재분배 정책 업데이트
   */
  updatePolicy(newPolicy: Partial<RedistributionPolicy>): Result<void> {
    try {
      const updatedPolicy = { ...this.redistributionPolicy, ...newPolicy };

      // 정책 검증
      if (
        updatedPolicy.redistributionRate <= 0 ||
        updatedPolicy.redistributionRate > 0.8
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_POLICY_RATE",
            "Redistribution rate must be between 0 and 0.8"
          ),
        };
      }

      this.redistributionPolicy = updatedPolicy;
      this.updatedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "POLICY_UPDATE_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  // Getters
  getId(): MoneyWaveId {
    return this.id;
  }

  getStatus(): MoneyWave2Status {
    return this.status;
  }

  getDormantAccountCount(): number {
    return this.dormantAccounts.length;
  }

  getTotalRedistributed(): PMC {
    return this.totalRedistributed;
  }

  getCurrentGiniCoefficient(): number {
    return this.currentGiniCoefficient;
  }

  getRedistributionHistory(): RedistributionEvent[] {
    return [...this.redistributionHistory];
  }

  getPolicy(): RedistributionPolicy {
    return { ...this.redistributionPolicy };
  }

  // 비즈니스 불변성 검증
  validateInvariants(): Result<void> {
    try {
      // 상태 검증
      if (!Object.values(MoneyWave2Status).includes(this.status)) {
        return {
          success: false,
          error: new DomainError("INVALID_STATUS", "Invalid aggregate status"),
        };
      }

      // 재분배율 검증
      if (
        this.redistributionPolicy.redistributionRate <= 0 ||
        this.redistributionPolicy.redistributionRate > 0.8
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_REDISTRIBUTION_RATE",
            "Redistribution rate out of valid range"
          ),
        };
      }

      // 지니계수 검증
      if (this.currentGiniCoefficient < 0 || this.currentGiniCoefficient > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_GINI_COEFFICIENT",
            "Gini coefficient out of valid range"
          ),
        };
      }

      // 총 재분배량 검증
      if (unwrapPMC(this.totalRedistributed) < 0) {
        return {
          success: false,
          error: new DomainError(
            "NEGATIVE_REDISTRIBUTION",
            "Total redistributed amount cannot be negative"
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "INVARIANT_VALIDATION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  // Private helper methods

  private sortRecipientsByMarginalUtility(
    recipients: RecipientCriteria[]
  ): RecipientCriteria[] {
    return recipients.sort((a, b) => {
      // 사회적 필요도가 높고, 현재 PMC가 적을수록 높은 우선순위
      const priorityA =
        a.socialNeedScore / Math.max(1, unwrapPMC(a.maxCurrentPMC));
      const priorityB =
        b.socialNeedScore / Math.max(1, unwrapPMC(b.maxCurrentPMC));
      return priorityB - priorityA;
    });
  }

  private generateRecipientUserId(recipient: RecipientCriteria): UserId {
    // 실제 구현에서는 적절한 수혜자 선정 로직이 필요
    return `recipient_${Date.now()}` as UserId;
  }
}
