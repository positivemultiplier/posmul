/**
 * MoneyWave History Repository Interface
 *
 * MoneyWave1, MoneyWave2, MoneyWave3의 실행 이력과 효과 분석을 위한 리포지토리 인터페이스
 * 경제학적 실증 분석과 정책 효과성 측정을 위한 히스토리 데이터 관리
 */

import { Result } from "@posmul/shared-types";
import { EBIT, PMC } from "../value-objects";

/**
 * MoneyWave 실행 타입
 */
export type MoneyWaveType = "MONEY_WAVE_1" | "MONEY_WAVE_2" | "MONEY_WAVE_3";

/**
 * MoneyWave1 실행 기록 (EBIT 기반 PMC 발행)
 */
export interface MoneyWave1Record {
  readonly recordId: string;
  readonly companyId: string;
  readonly executionDate: Date;
  readonly ebitAmount: EBIT;
  readonly pmcIssued: PMC;
  readonly conversionRate: number;
  readonly stakeholderCount: number;
  readonly economicImpact: {
    readonly gdpContribution: number;
    readonly employmentEffect: number;
    readonly multiplierEffect: number;
  };
  readonly socialWelfare: {
    readonly utilityIncrease: number;
    readonly inequalityReduction: number;
    readonly publicGoodContribution: number;
  };
}

/**
 * MoneyWave2 실행 기록 (미사용 PMC 재분배)
 */
export interface MoneyWave2Record {
  readonly recordId: string;
  readonly executionDate: Date;
  readonly eligibilitySnapshot: {
    readonly totalEligibleAccounts: number;
    readonly averageDormancyPeriod: number;
    readonly totalRedistributablePMC: PMC;
  };
  readonly redistributionResults: {
    readonly redistributedAmount: PMC;
    readonly beneficiaryCount: number;
    readonly averageAllocation: PMC;
    readonly giniCoefficientBefore: number;
    readonly giniCoefficientAfter: number;
  };
  readonly pigouEfficiency: {
    readonly welfareGain: number;
    readonly deadweightLossReduction: number;
    readonly pareto: boolean;
  };
  readonly rawlsianJustice: {
    readonly maximin: number;
    readonly distributionalJustice: number;
    readonly originalPositionScore: number;
  };
}

/**
 * MoneyWave3 실행 기록 (기업가 생태계)
 */
export interface MoneyWave3Record {
  readonly recordId: string;
  readonly executionDate: Date;
  readonly entrepreneurialActivity: {
    readonly newVenturesCount: number;
    readonly innovationIndex: number;
    readonly marketOpportunities: number;
    readonly competitiveDestruction: number;
  };
  readonly resourceAllocation: {
    readonly totalPMCAllocated: PMC;
    readonly ventureFundingAmount: PMC;
    readonly successfulVentures: number;
    readonly failedVentures: number;
  };
  readonly schumpeterianImpact: {
    readonly creativeDuction: number;
    readonly innovationSpillover: number;
    readonly productivityGrowth: number;
  };
  readonly kirznerianDiscovery: {
    readonly opportunityRecognition: number;
    readonly arbitrageProfit: PMC;
    readonly marketEfficiency: number;
  };
}

/**
 * MoneyWave 실행 통계
 */
export interface MoneyWaveStatistics {
  readonly moneyWaveType: MoneyWaveType;
  readonly totalExecutions: number;
  readonly totalPMCImpact: PMC;
  readonly averageSuccessRate: number;
  readonly economicEfficiency: number;
  readonly socialWelfareChange: number;
  readonly lastExecutionDate: Date;
  readonly nextScheduledExecution?: Date;
}

/**
 * MoneyWave 효과성 분석
 */
export interface MoneyWaveEffectiveness {
  readonly recordId: string;
  readonly moneyWaveType: MoneyWaveType;
  readonly effectivenessPeriod: {
    readonly startDate: Date;
    readonly endDate: Date;
  };
  readonly macroeconomicImpact: {
    readonly gdpGrowthContribution: number;
    readonly inflationImpact: number;
    readonly unemploymentEffect: number;
  };
  readonly microeconomicImpact: {
    readonly consumerSurplus: number;
    readonly producerSurplus: number;
    readonly allocativeEfficiency: number;
  };
  readonly institutionalImpact: {
    readonly governanceImprovement: number;
    readonly transparencyIndex: number;
    readonly corruptionReduction: number;
  };
}

/**
 * MoneyWave History Repository 인터페이스
 */
export interface IMoneyWaveHistoryRepository {
  /**
   * MoneyWave1 실행 기록 저장
   */
  saveMoneyWave1Record(
    record: Omit<MoneyWave1Record, "recordId">
  ): Promise<Result<MoneyWave1Record>>;

  /**
   * MoneyWave2 실행 기록 저장
   */
  saveMoneyWave2Record(
    record: Omit<MoneyWave2Record, "recordId">
  ): Promise<Result<MoneyWave2Record>>;

  /**
   * MoneyWave3 실행 기록 저장
   */
  saveMoneyWave3Record(
    record: Omit<MoneyWave3Record, "recordId">
  ): Promise<Result<MoneyWave3Record>>;

  /**
   * MoneyWave 실행 기록 조회 (타입별)
   */
  getMoneyWaveRecords(
    moneyWaveType: MoneyWaveType,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  ): Promise<
    Result<(MoneyWave1Record | MoneyWave2Record | MoneyWave3Record)[]>
  >;

  /**
   * 특정 MoneyWave 기록 조회
   */
  getMoneyWaveRecordById(
    recordId: string
  ): Promise<Result<MoneyWave1Record | MoneyWave2Record | MoneyWave3Record>>;

  /**
   * MoneyWave 통계 조회
   */
  getMoneyWaveStatistics(
    moneyWaveType: MoneyWaveType
  ): Promise<Result<MoneyWaveStatistics>>;

  /**
   * 전체 MoneyWave 통계 조회
   */
  getAllMoneyWaveStatistics(): Promise<Result<MoneyWaveStatistics[]>>;

  /**
   * MoneyWave 효과성 분석 저장
   */
  saveEffectivenessAnalysis(
    analysis: Omit<MoneyWaveEffectiveness, "recordId">
  ): Promise<Result<MoneyWaveEffectiveness>>;

  /**
   * MoneyWave 효과성 분석 조회
   */
  getEffectivenessAnalysis(
    moneyWaveType: MoneyWaveType,
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<MoneyWaveEffectiveness[]>>;

  /**
   * 기간별 MoneyWave 실행 횟수 조회
   */
  getExecutionFrequency(
    moneyWaveType: MoneyWaveType,
    periodType: "daily" | "weekly" | "monthly" | "quarterly",
    startDate: Date,
    endDate: Date
  ): Promise<
    Result<
      {
        period: string;
        executionCount: number;
        totalPMCImpact: PMC;
      }[]
    >
  >;

  /**
   * MoneyWave 간 상관관계 분석 데이터 조회
   */
  getMoneyWaveCorrelations(): Promise<
    Result<{
      wave1_wave2_correlation: number;
      wave1_wave3_correlation: number;
      wave2_wave3_correlation: number;
      combinedEffectiveness: number;
    }>
  >;

  /**
   * 장기 트렌드 분석을 위한 시계열 데이터 조회
   */
  getTimeSeriesData(
    moneyWaveType: MoneyWaveType,
    metrics: string[],
    startDate: Date,
    endDate: Date,
    granularity: "hour" | "day" | "week" | "month"
  ): Promise<
    Result<
      {
        timestamp: Date;
        values: Record<string, number>;
      }[]
    >
  >;
}
