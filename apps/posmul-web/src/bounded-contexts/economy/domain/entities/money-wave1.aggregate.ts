/**
 * MoneyWave1 Aggregate - EBIT 기반 PMC 발행 시스템
 *
 * Jensen & Meckling Agency Theory를 적용하여
 * 기업의 EBIT(Earnings Before Interest and Taxes) 데이터를 기반으로
 * PMC를 자동 발행하는 메커니즘을 구현합니다.
 *
 * 핵심 불변성:
 * - EBIT가 양수인 경우에만 PMC 발행 가능
 * - 일일 발행량은 연간 순이익 기대치의 1/365를 초과할 수 없음
 * - Agency Cost 최소화 원칙 준수
 */

import { DomainError, Result } from "@/shared/types/common";
import { MoneyWaveId, PMC, createPMC, unwrapPMC } from "../value-objects";

export interface EBITCalculation {
  readonly revenue: number;
  readonly costOfGoodsSold: number;
  readonly sellingGeneralAdmin: number;
  readonly calculatedAt: Date;
  readonly validUntil: Date;
}

export interface PMCEmissionPolicy {
  readonly maxDailyEmission: PMC;
  readonly emissionRate: number; // 0-1 사이 값
  readonly agencyScoreThreshold: number;
  readonly riskAdjustmentFactor: number;
}

export interface EmissionEvent {
  readonly eventId: string;
  readonly emissionAmount: PMC;
  readonly emittedAt: Date;
  readonly ebitSnapshot: EBITCalculation;
  readonly agencyScore: number;
  readonly reason: string;
}

export enum MoneyWave1Status {
  PENDING_EBIT = "PENDING_EBIT",
  CALCULATING = "CALCULATING",
  EMISSION_READY = "EMISSION_READY",
  EMITTING = "EMITTING",
  SUSPENDED = "SUSPENDED",
  COMPLETED = "COMPLETED",
}

export class MoneyWave1Aggregate {
  private constructor(
    private readonly id: MoneyWaveId,
    private status: MoneyWave1Status,
    private ebitCalculation: EBITCalculation | null,
    private emissionPolicy: PMCEmissionPolicy,
    private totalEmitted: PMC,
    private agencyScore: number,
    private emissionHistory: EmissionEvent[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: MoneyWaveId,
    initialPolicy: Omit<PMCEmissionPolicy, "maxDailyEmission">
  ): Result<MoneyWave1Aggregate> {
    try {
      // 기본 정책 검증
      if (initialPolicy.emissionRate <= 0 || initialPolicy.emissionRate > 1) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_EMISSION_RATE",
            "Emission rate must be between 0 and 1"
          ),
        };
      }

      if (
        initialPolicy.agencyScoreThreshold < 0 ||
        initialPolicy.agencyScoreThreshold > 1
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_AGENCY_THRESHOLD",
            "Agency score threshold must be between 0 and 1"
          ),
        };
      }

      const defaultPolicy: PMCEmissionPolicy = {
        ...initialPolicy,
        maxDailyEmission: createPMC(0), // EBIT 계산 후 설정
      };

      const aggregate = new MoneyWave1Aggregate(
        id,
        MoneyWave1Status.PENDING_EBIT,
        null,
        defaultPolicy,
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
          "MONEY_WAVE1_CREATION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * EBIT 데이터를 기반으로 PMC 발행 정책을 설정합니다.
   * Jensen & Meckling Agency Theory 원칙에 따라 정보 투명성을 보장합니다.
   */
  setEBITCalculation(ebitData: EBITCalculation): Result<void> {
    try {
      // EBIT 계산 검증
      const ebit =
        ebitData.revenue -
        ebitData.costOfGoodsSold -
        ebitData.sellingGeneralAdmin;

      if (ebit <= 0) {
        return {
          success: false,
          error: new DomainError(
            "NEGATIVE_EBIT",
            "EBIT must be positive for PMC emission"
          ),
        };
      }

      // 데이터 유효성 검증
      if (ebitData.validUntil <= new Date()) {
        return {
          success: false,
          error: new DomainError("EXPIRED_EBIT_DATA", "EBIT data has expired"),
        };
      }

      // 최대 일일 발행량 계산 (연간 순이익 추정치의 1/365)
      const annualNetIncome = ebit * 0.75; // 세금 및 이자 고려 (25% 가정)
      const maxDailyEmission = createPMC(Math.max(0, annualNetIncome / 365));

      this.ebitCalculation = ebitData;
      this.emissionPolicy = {
        ...this.emissionPolicy,
        maxDailyEmission,
      };
      this.status = MoneyWave1Status.CALCULATING;
      this.updatedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "EBIT_SETTING_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * Agency Theory 기반 Agency Cost Score를 업데이트합니다.
   * 높은 점수일수록 정보 비대칭이 해소되어 더 많은 PMC 발행이 가능합니다.
   */
  updateAgencyScore(
    informationTransparency: number,
    predictionAccuracy: number,
    socialLearning: number
  ): Result<void> {
    try {
      // 입력값 검증
      const inputs = [
        informationTransparency,
        predictionAccuracy,
        socialLearning,
      ];
      if (inputs.some((val) => val < 0 || val > 1)) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_AGENCY_METRICS",
            "All agency metrics must be between 0 and 1"
          ),
        };
      }

      // Jensen & Meckling 공식 적용
      // Agency Score = 정보투명성 * 0.4 + 예측정확도 * 0.3 + 사회학습 * 0.3
      this.agencyScore =
        informationTransparency * 0.4 +
        predictionAccuracy * 0.3 +
        socialLearning * 0.3;

      // 상태 전이 확인
      if (
        this.status === MoneyWave1Status.CALCULATING &&
        this.agencyScore >= this.emissionPolicy.agencyScoreThreshold
      ) {
        this.status = MoneyWave1Status.EMISSION_READY;
      }

      this.updatedAt = new Date();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "AGENCY_SCORE_UPDATE_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 실제 PMC 발행을 실행합니다.
   * 비즈니스 불변성을 엄격히 검증합니다.
   */
  emitPMC(requestedAmount: PMC, reason: string): Result<EmissionEvent> {
    try {
      // 전제 조건 검증
      if (
        this.status !== MoneyWave1Status.EMISSION_READY &&
        this.status !== MoneyWave1Status.EMITTING
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_EMISSION_STATE",
            "PMC emission not available in current status"
          ),
        };
      }

      if (!this.ebitCalculation) {
        return {
          success: false,
          error: new DomainError(
            "MISSING_EBIT_DATA",
            "EBIT calculation required for emission"
          ),
        };
      }

      // EBIT 데이터 유효성 재검증
      if (this.ebitCalculation.validUntil <= new Date()) {
        return {
          success: false,
          error: new DomainError(
            "EXPIRED_EBIT_DATA",
            "EBIT data has expired, update required"
          ),
        };
      }

      // 발행량 제한 검증
      const dailyEmissionCap = unwrapPMC(this.emissionPolicy.maxDailyEmission);
      const requestedAmountRaw = unwrapPMC(requestedAmount);

      if (requestedAmountRaw > dailyEmissionCap) {
        return {
          success: false,
          error: new DomainError(
            "EMISSION_LIMIT_EXCEEDED",
            `Requested amount (${requestedAmountRaw}) exceeds daily cap (${dailyEmissionCap})`
          ),
        };
      }

      // Agency Score 기반 실제 발행량 계산
      const agencyAdjustment = Math.min(
        1,
        this.agencyScore * this.emissionPolicy.riskAdjustmentFactor
      );
      const actualEmissionAmount = createPMC(
        requestedAmountRaw * agencyAdjustment
      );

      // 발행 이벤트 생성
      const emissionEvent: EmissionEvent = {
        eventId: `emission_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        emissionAmount: actualEmissionAmount,
        emittedAt: new Date(),
        ebitSnapshot: { ...this.ebitCalculation },
        agencyScore: this.agencyScore,
        reason,
      };

      // 상태 업데이트
      this.totalEmitted = createPMC(
        unwrapPMC(this.totalEmitted) + unwrapPMC(actualEmissionAmount)
      );
      this.emissionHistory.push(emissionEvent);
      this.status = MoneyWave1Status.EMITTING;
      this.updatedAt = new Date();

      return { success: true, data: emissionEvent };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "PMC_EMISSION_FAILED",
          error instanceof Error ? error.message : "Unknown error"
        ),
      };
    }
  }

  /**
   * 발행 정책을 업데이트합니다.
   */
  updateEmissionPolicy(newPolicy: Partial<PMCEmissionPolicy>): Result<void> {
    try {
      if (
        newPolicy.emissionRate !== undefined &&
        (newPolicy.emissionRate <= 0 || newPolicy.emissionRate > 1)
      ) {
        return {
          success: false,
          error: new DomainError(
            "INVALID_EMISSION_RATE",
            "Emission rate must be between 0 and 1"
          ),
        };
      }

      this.emissionPolicy = {
        ...this.emissionPolicy,
        ...newPolicy,
      };
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

  /**
   * MoneyWave1을 완료합니다.
   */
  complete(): Result<void> {
    if (this.status === MoneyWave1Status.COMPLETED) {
      return {
        success: false,
        error: new DomainError(
          "ALREADY_COMPLETED",
          "MoneyWave1 is already completed"
        ),
      };
    }

    this.status = MoneyWave1Status.COMPLETED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  /**
   * 긴급 상황에서 발행을 일시 중단합니다.
   */
  suspend(reason: string): Result<void> {
    if (this.status === MoneyWave1Status.COMPLETED) {
      return {
        success: false,
        error: new DomainError(
          "CANNOT_SUSPEND_COMPLETED",
          "Cannot suspend completed MoneyWave1"
        ),
      };
    }

    this.status = MoneyWave1Status.SUSPENDED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // Getters
  getId(): MoneyWaveId {
    return this.id;
  }

  getStatus(): MoneyWave1Status {
    return this.status;
  }

  getEBITCalculation(): EBITCalculation | null {
    return this.ebitCalculation ? { ...this.ebitCalculation } : null;
  }

  getEmissionPolicy(): PMCEmissionPolicy {
    return { ...this.emissionPolicy };
  }

  getTotalEmitted(): PMC {
    return this.totalEmitted;
  }

  getAgencyScore(): number {
    return this.agencyScore;
  }

  getEmissionHistory(): EmissionEvent[] {
    return [...this.emissionHistory];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * 현재 EBIT 기반 발행 가능량을 계산합니다.
   */
  getAvailableEmissionAmount(): PMC {
    if (
      !this.ebitCalculation ||
      this.status !== MoneyWave1Status.EMISSION_READY
    ) {
      return createPMC(0);
    }

    const maxDaily = unwrapPMC(this.emissionPolicy.maxDailyEmission);
    const agencyAdjustment =
      this.agencyScore * this.emissionPolicy.riskAdjustmentFactor;

    return createPMC(maxDaily * agencyAdjustment);
  }

  /**
   * 비즈니스 불변성 검증
   */
  validateInvariants(): Result<void> {
    // 1. EBIT 양수 제약
    if (this.ebitCalculation) {
      const ebit =
        this.ebitCalculation.revenue -
        this.ebitCalculation.costOfGoodsSold -
        this.ebitCalculation.sellingGeneralAdmin;
      if (ebit <= 0) {
        return {
          success: false,
          error: new DomainError(
            "INVARIANT_VIOLATION",
            "EBIT must be positive"
          ),
        };
      }
    }

    // 2. 발행량 제한 준수
    const totalEmittedAmount = unwrapPMC(this.totalEmitted);
    if (totalEmittedAmount < 0) {
      return {
        success: false,
        error: new DomainError(
          "INVARIANT_VIOLATION",
          "Total emission cannot be negative"
        ),
      };
    }

    // 3. Agency Score 범위
    if (this.agencyScore < 0 || this.agencyScore > 1) {
      return {
        success: false,
        error: new DomainError(
          "INVARIANT_VIOLATION",
          "Agency score out of range"
        ),
      };
    }

    return { success: true, data: undefined };
  }
}
