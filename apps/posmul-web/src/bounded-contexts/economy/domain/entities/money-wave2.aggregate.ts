/**
 * MoneyWave2 Aggregate
 */

import { Result } from "../../../../shared/legacy-compatibility";

class DomainError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export enum MoneyWave2Status {
  IDLE = "IDLE",
  SCANNING = "SCANNING",
  ANALYZING = "ANALYZING",
  CALCULATING = "CALCULATING",
  REDISTRIBUTING = "REDISTRIBUTING",
  COMPLETED = "COMPLETED",
}

export class MoneyWave2Aggregate {
  private status: MoneyWave2Status = MoneyWave2Status.IDLE;

  constructor(
    private readonly id: string,
    private readonly targetGiniCoefficient: number = 0.3
  ) {}

  /**
   * MoneyWave2Aggregate 생성 팩토리 메서드
   */
  public static create(
    id: string,
    policy: {
      dormancyPeriodMonths: number;
      redistributionRate: number;
      giniThreshold: number;
      minimumPoolSize: any;
      maxRedistributionPerCycle: any;
    }
  ): Result<MoneyWave2Aggregate, DomainError> {
    try {
      // 정책 유효성 검증
      if (policy.redistributionRate <= 0 || policy.redistributionRate > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_REDISTRIBUTION_RATE",
            "Redistribution rate must be between 0 and 1"
          ),
        };
      }

      if (policy.giniThreshold <= 0 || policy.giniThreshold > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_GINI_THRESHOLD",
            "Gini threshold must be between 0 and 1"
          ),
        };
      }

      const aggregate = new MoneyWave2Aggregate(id, policy.giniThreshold);
      aggregate.status = MoneyWave2Status.SCANNING;

      return {
        success: true,
        data: aggregate,
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "CREATION_ERROR",
          "Failed to create MoneyWave2Aggregate"
        ),
      };
    }
  }

  startScanning(): Result<void, DomainError> {
    try {
      if (this.status !== MoneyWave2Status.IDLE) {
        return {
          success: false,
          error: new DomainError("INVALID_STATE", "Invalid state transition"),
        };
      }

      this.status = MoneyWave2Status.SCANNING;

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("SCANNING_ERROR", "Failed to start scanning"),
      };
    }
  }

  analyzeRedistributionNeed(currentGiniCoefficient: number): Result<
    {
      needsRedistribution: boolean;
      recommendedRate: number;
      expectedGiniReduction: number;
    },
    DomainError
  > {
    try {
      if (this.status !== MoneyWave2Status.ANALYZING) {
        return {
          success: false,
          error: new DomainError("INVALID_STATE", "Invalid state for analysis"),
        };
      }

      const needsRedistribution =
        currentGiniCoefficient > this.targetGiniCoefficient;
      const recommendedRate = Math.min(
        0.1,
        (currentGiniCoefficient - this.targetGiniCoefficient) * 2
      );
      const expectedGiniReduction = recommendedRate * 0.3;

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
          "ANALYSIS_ERROR",
          "Failed to analyze redistribution need"
        ),
      };
    }
  }

  calculateDistribution(
    recipients: any[],
    redistributionRate?: number
  ): Result<
    {
      distributions: Array<{
        recipientId: string;
        amount: number;
        priority: number;
      }>;
      totalAmount: number;
      expectedSocialWelfareIncrease: number;
    },
    DomainError
  > {
    try {
      if (this.status !== MoneyWave2Status.CALCULATING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATE",
            "Invalid state for calculation"
          ),
        };
      }

      const distributions = recipients.map((recipient, index) => ({
        recipientId: `recipient_${Date.now()}_${index}`,
        amount: 100 * (redistributionRate || 0.05),
        priority: index + 1,
      }));

      const totalAmount = distributions.reduce(
        (sum, dist) => sum + dist.amount,
        0
      );

      return {
        success: true,
        data: {
          distributions,
          totalAmount,
          expectedSocialWelfareIncrease: 0.15,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "CALCULATION_ERROR",
          "Failed to calculate distribution"
        ),
      };
    }
  }

  executeRedistribution(
    redistributionPlan: Array<{
      recipientId: string;
      amount: number;
      priority: number;
    }>
  ): Result<any[], DomainError> {
    try {
      if (this.status !== MoneyWave2Status.REDISTRIBUTING) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_STATE",
            "Invalid state for redistribution"
          ),
        };
      }

      const events = redistributionPlan.map((plan) => ({
        id: `event_${Date.now()}`,
        recipientId: plan.recipientId,
        amount: plan.amount,
        executedAt: new Date(),
      }));

      this.status = MoneyWave2Status.COMPLETED;

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "REDISTRIBUTION_ERROR",
          "Failed to execute redistribution"
        ),
      };
    }
  }

  /**
   * Aggregate 상태 조회 메서드들
   */
  public getStatus(): MoneyWave2Status {
    return this.status;
  }

  public getId(): string {
    return this.id;
  }

  public getTargetGiniCoefficient(): number {
    return this.targetGiniCoefficient;
  }
}
