/**
 * Money Wave Aggregate Root
 * Jensen & Meckling Agency Theory 기반 PmpAmount-PmcAmount 경제 시스템의 핵심 애그리거트
 *
 * MoneyWave1: EBIT 기반 PmcAmount 발행
 * MoneyWave2: 미사용 PmcAmount 재분배
 * MoneyWave3: 기업가 생태계 구축
 */

import { Result, DomainError } from "@posmul/auth-economy-sdk";
import {
  MoneyWaveId,
  PmcAmount,
  createPmcAmount,
  unwrapPmcAmount,
} from "../value-objects";

export interface EBITData {
  expectedRevenue: number;
  expectedCOGS: number;
  expectedSGA: number;
  expectedTax: number;
  expectedInterest: number;
  calculatedAt: Date;
}

export interface MoneyWaveMetrics {
  totalPmcAmountIssued: number;
  totalPmpAmountCirculating: number;
  conversionRate: number;
  networkValue: number;
  agencyCostReduction: number;
}

export enum MoneyWaveType {
  EBIT_BASED = "EBIT_BASED",
  REDISTRIBUTION = "REDISTRIBUTION",
  ENTREPRENEUR_ECOSYSTEM = "ENTREPRENEUR_ECOSYSTEM",
}

export enum MoneyWaveStatus {
  CALCULATING = "CALCULATING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  SUSPENDED = "SUSPENDED",
}

export class MoneyWave {
  private constructor(
    private readonly id: MoneyWaveId,
    private readonly type: MoneyWaveType,
    private status: MoneyWaveStatus,
    private readonly ebitData: EBITData,
    private dailyPmcAmountEmission: PmcAmount,
    private networkParticipants: number,
    private agencyCostScore: number,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: MoneyWaveId,
    type: MoneyWaveType,
    ebitData: EBITData
  ): Result<MoneyWave> {
    try {
      // EBIT 데이터 검증
      const expectedEBIT =
        ebitData.expectedRevenue - ebitData.expectedCOGS - ebitData.expectedSGA;
      if (expectedEBIT <= 0) {
        return {
          success: false,
          error: new DomainError("Expected EBIT must be positive", {
            code: "INVALID_EBIT",
          }),
        };
      } // 일일 PmcAmount 발행량 계산 (Agency Theory 기반)
      const netReturn =
        expectedEBIT - ebitData.expectedTax - ebitData.expectedInterest;
      const dailyEmission = createPmcAmount(Math.max(0, netReturn / 365));

      const moneyWave = new MoneyWave(
        id,
        type,
        MoneyWaveStatus.CALCULATING,
        ebitData,
        dailyEmission,
        0,
        0,
        new Date(),
        new Date()
      );

      return { success: true, data: moneyWave };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("MONEY_WAVE_CREATION_FAILED", {
          originalError:
            error instanceof Error ? error : new Error("Unknown error"),
        }),
      };
    }
  }

  // Jensen & Meckling Agency Cost 최소화
  calculateAgencyCostReduction(
    predictionAccuracy: number,
    socialLearningIndex: number,
    informationTransparency: number
  ): Result<number> {
    try {
      // Agency Theory 기반 정보 비대칭 극복도 측정
      const agencyCostReduction =
        predictionAccuracy * 0.4 +
        socialLearningIndex * 0.3 +
        informationTransparency * 0.3;

      this.agencyCostScore = Math.min(1.0, agencyCostReduction ** 2);
      this.updatedAt = new Date();

      return { success: true, data: this.agencyCostScore };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("AGENCY_COST_CALCULATION_FAILED", {
          originalError:
            error instanceof Error ? error : new Error("Unknown error"),
        }),
      };
    }
  }

  // CAPM 기반 PmpAmount-PmcAmount 전환율 계산
  calculateConversionRate(
    userRiskTolerance: number,
    predictionConfidence: number,
    marketRiskPremium: number
  ): Result<number> {
    try {
      // CAPM: E[R] = Rf + β(E[Rm] - Rf)
      const riskFreeRate = 0.02; // PmpAmount 기본 수익률
      const beta = this.calculateNetworkBeta();

      const expectedPmcAmountReturn = riskFreeRate + beta * marketRiskPremium;

      // 사용자 위험 선호도와 예측 확신도 반영
      let conversionRate = expectedPmcAmountReturn * this.agencyCostScore;

      // 위험 회피도에 따른 조정
      if (userRiskTolerance < 0.3) {
        conversionRate *= 0.8; // 보수적
      } else if (userRiskTolerance > 0.7) {
        conversionRate *= 1.2; // 공격적
      }

      // 예측 확신도 반영
      conversionRate *= 1 + predictionConfidence * 0.2;

      return { success: true, data: Math.min(2.0, conversionRate) };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("CONVERSION_RATE_CALCULATION_FAILED", {
          originalError:
            error instanceof Error ? error : new Error("Unknown error"),
        }),
      };
    }
  }

  // Metcalfe's Law 기반 네트워크 가치 계산
  calculateNetworkValue(): Result<number> {
    try {
      // Metcalfe's Law: 네트워크 가치 = n²
      const baseValue = this.networkParticipants ** 2;

      // 연결 밀도 고려 (예: 80% 연결 밀도)
      const connectionDensity = 0.8;
      const densityAdjustment = connectionDensity ** 0.5;

      const networkValue = baseValue * densityAdjustment * this.agencyCostScore;

      return { success: true, data: networkValue };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("NETWORK_VALUE_CALCULATION_FAILED", {
          originalError:
            error instanceof Error ? error : new Error("Unknown error"),
        }),
      };
    }
  }

  // Buchanan Iron Triangle 파괴도 측정
  calculateIronTriangleDisruption(
    predictionGameParticipation: number,
    donationTransparencyScore: number,
    localLeagueActivity: number
  ): Result<number> {
    try {
      // 정보 비대칭 해소 (예측 게임)
      const informationSymmetry = Math.min(
        1.0,
        predictionGameParticipation / 1000
      );

      // 예산 투명화 (기부 투명성)
      const budgetTransparency = donationTransparencyScore;

      // 지역 순환경제 강화 (로컬 리그)
      const localEconomyStrength = Math.min(1.0, localLeagueActivity / 500);

      const disruptionScore =
        informationSymmetry * 0.4 +
        budgetTransparency * 0.3 +
        localEconomyStrength * 0.3;

      return { success: true, data: disruptionScore };
    } catch (error) {
      return {
        success: false,
        error: new DomainError("IRON_TRIANGLE_CALCULATION_FAILED", {
          originalError:
            error instanceof Error ? error : new Error("Unknown error"),
        }),
      };
    }
  }

  // MoneyWave 상태 전이
  activate(): Result<void> {
    if (this.status !== MoneyWaveStatus.CALCULATING) {
      return {
        success: false,
        error: new DomainError("Can only activate from CALCULATING status", {
          code: "INVALID_STATUS_TRANSITION",
        }),
      };
    }

    this.status = MoneyWaveStatus.ACTIVE;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  complete(): Result<void> {
    if (this.status !== MoneyWaveStatus.ACTIVE) {
      return {
        success: false,
        error: new DomainError("Can only complete from ACTIVE status", {
          code: "INVALID_STATUS_TRANSITION",
        }),
      };
    }

    this.status = MoneyWaveStatus.COMPLETED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  addNetworkParticipant(): void {
    this.networkParticipants++;
    this.updatedAt = new Date();
  }

  removeNetworkParticipant(): void {
    if (this.networkParticipants > 0) {
      this.networkParticipants--;
      this.updatedAt = new Date();
    }
  }

  // 네트워크 베타 계산 (CAPM)
  private calculateNetworkBeta(): number {
    // 네트워크 참여자 수와 활동도 기반 베타 계산
    const baseBeta = 1.0;
    const networkEffect = Math.log(this.networkParticipants + 1) / 10;
    const agencyAdjustment = this.agencyCostScore * 0.2;

    return Math.max(0.5, baseBeta + networkEffect - agencyAdjustment);
  }

  // Getters
  getId(): MoneyWaveId {
    return this.id;
  }

  getType(): MoneyWaveType {
    return this.type;
  }

  getStatus(): MoneyWaveStatus {
    return this.status;
  }

  getEBITData(): EBITData {
    return { ...this.ebitData };
  }

  getDailyPmcAmountEmission(): PmcAmount {
    return this.dailyPmcAmountEmission;
  }

  getNetworkParticipants(): number {
    return this.networkParticipants;
  }

  getAgencyCostScore(): number {
    return this.agencyCostScore;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // 메트릭스 조회
  getMetrics(): MoneyWaveMetrics {
    return {
      totalPmcAmountIssued:
        unwrapPmcAmount(this.dailyPmcAmountEmission) *
        this.getDaysSinceCreation(),
      totalPmpAmountCirculating: this.networkParticipants * 100, // 추정값
      conversionRate: this.agencyCostScore,
      networkValue: this.networkParticipants ** 2,
      agencyCostReduction: this.agencyCostScore,
    };
  }

  private getDaysSinceCreation(): number {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
