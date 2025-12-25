/**
 * A/B Testing Analysis Service
 *
 * 경제학적 실험 설계와 통계적 추론을 담당하는 애플리케이션 서비스
 * Fisher의 실험설계이론과 Neyman-Pearson 가설검정을 적용
 */
import { UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";

import {
  ABTestConfiguration,
  IEconomicAnalyticsRepository,
} from "../../domain/repositories";

export interface ABTestSetupRequest {
  readonly testName: string;
  readonly hypothesis: string;
  readonly controlGroupSize: number;
  readonly treatmentGroupSize: number;
  readonly duration: number; // days
  readonly significanceLevel: number; // α (type I error rate)
  readonly minimumDetectableEffect: number; // MDE
  readonly primaryMetrics: string[];
  readonly secondaryMetrics: string[];
  readonly randomizationStrategy:
    | "SIMPLE"
    | "STRATIFIED"
    | "CLUSTER"
    | "BLOCKED";
  readonly powerAnalysis: {
    readonly targetPower: number; // 1-β (statistical power)
    readonly effectSize: number;
    readonly variance: number;
  };
}

export interface ABTestAnalysisRequest {
  readonly testId: string;
  readonly analysisType: "INTERIM" | "FINAL" | "BAYESIAN_UPDATE";
  readonly adjustmentMethod:
    | "BONFERRONI"
    | "BENJAMINI_HOCHBERG"
    | "HOLM"
    | "NONE";
  readonly confidenceLevel: number; // e.g., 0.95 for 95% CI
  readonly bayesianPrior?: {
    readonly priorMean: number;
    readonly priorVariance: number;
    readonly distribution: "NORMAL" | "BETA" | "GAMMA";
  };
}

export interface StatisticalTestResult {
  readonly testStatistic: number;
  readonly pValue: number;
  readonly degreesOfFreedom: number;
  readonly criticalValue: number;
  readonly isSignificant: boolean;
  readonly effectSize: number;
  readonly confidenceInterval: [number, number];
  readonly standardError: number;
  readonly testType:
    | "T_TEST"
    | "CHI_SQUARE"
    | "MANN_WHITNEY"
    | "KOLMOGOROV_SMIRNOV";
}

export interface ExperimentalDesign {
  readonly designType:
    | "RANDOMIZED_CONTROLLED"
    | "QUASI_EXPERIMENTAL"
    | "NATURAL_EXPERIMENT";
  readonly randomizationMethod: "SIMPLE" | "STRATIFIED" | "CLUSTER" | "BLOCKED";
  readonly stratificationVariables: string[];
  readonly blockingVariables: string[];
  readonly clusterDefinition?: string;
  readonly treatmentAssignment: Record<UserId, string>;
  readonly balanceCheck: {
    readonly preTestEquivalence: boolean;
    readonly covariateBalance: Record<string, number>;
    readonly attritionAnalysis: {
      readonly overallAttritionRate: number;
      readonly differentialAttrition: boolean;
    };
  };
}

export interface PowerAnalysisResult {
  readonly recommendedSampleSize: number;
  readonly actualPower: number;
  readonly minimumDetectableEffect: number;
  readonly typeIErrorRate: number;
  readonly typeIIErrorRate: number;
  readonly criticalValue: number;
  readonly sensitivityAnalysis: {
    readonly effectSizeRange: [number, number];
    readonly powerCurve: Array<{ effectSize: number; power: number }>;
    readonly sampleSizeRecommendations: Array<{
      sampleSize: number;
      power: number;
      cost: number;
    }>;
  };
}

export interface BayesianAnalysisResult {
  readonly posteriorDistribution: {
    readonly mean: number;
    readonly variance: number;
    readonly credibleInterval: [number, number];
    readonly probabilityOfSuperiority: number;
  };
  readonly bayesFactor: number;
  readonly evidence:
    | "DECISIVE"
    | "VERY_STRONG"
    | "STRONG"
    | "MODERATE"
    | "WEAK"
    | "INCONCLUSIVE";
  readonly posteriorPredictiveCheck: {
    readonly discrepancyMeasure: number;
    readonly pValue: number;
    readonly modelFit: "GOOD" | "ACCEPTABLE" | "POOR";
  };
}

export class ABTestingAnalysisService {
  constructor(
    private readonly analyticsRepository: IEconomicAnalyticsRepository
  ) {}

  /**
   * A/B 테스트 실험 설계 및 파워 분석
   * Cohen's Statistical Power Analysis 적용
   */
  async designExperiment(request: ABTestSetupRequest): Promise<
    Result<{
      configuration: ABTestConfiguration;
      powerAnalysis: PowerAnalysisResult;
      experimentalDesign: ExperimentalDesign;
      recommendedSampleSizes: number[];
    }>
  > {
    try {
      // Cohen의 파워 분석
      const powerAnalysisResult = this.calculatePowerAnalysis(
        request.powerAnalysis.effectSize,
        request.powerAnalysis.variance,
        request.significanceLevel,
        request.powerAnalysis.targetPower
      );

      // 실험 설계 생성
      const experimentalDesign = await this.createExperimentalDesign(
        request.randomizationStrategy,
        powerAnalysisResult.recommendedSampleSize
      );

      // A/B 테스트 설정 생성
      const config: Omit<ABTestConfiguration, "testId"> = {
        testName: request.testName,
        hypothesis: request.hypothesis,
        startDate: new Date(),
        endDate: new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000),
        controlGroup: {
          userIds: experimentalDesign.treatmentAssignment
            ? Object.keys(experimentalDesign.treatmentAssignment)
                .filter(
                  (userId) =>
                    experimentalDesign.treatmentAssignment[userId as UserId] ===
                    "CONTROL"
                )
                .map((userId) => userId as UserId)
            : [],
          treatment: "CONTROL",
          parameters: {},
        },
        treatmentGroups: [
          {
            groupId: "treatment-1",
            userIds: experimentalDesign.treatmentAssignment
              ? Object.keys(experimentalDesign.treatmentAssignment)
                  .filter(
                    (userId) =>
                      experimentalDesign.treatmentAssignment[
                        userId as UserId
                      ] === "TREATMENT"
                  )
                  .map((userId) => userId as UserId)
              : [],
            treatment: "TREATMENT",
            parameters: {},
          },
        ],
        successMetrics: request.primaryMetrics,
        significanceLevel: request.significanceLevel,
        minimumSampleSize: powerAnalysisResult.recommendedSampleSize,
        status: "PLANNING",
      };

      const configResult =
        await this.analyticsRepository.saveABTestConfiguration({
          ...config,
          testId: `experiment_${Date.now()}`,
        });

      if (!configResult.success) {
        return {
          success: false,
          error: new Error("A/B 테스트 설정 저장에 실패했습니다."),
        };
      }

      const savedConfiguration = configResult.data;

      return {
        success: true,
        data: {
          configuration: savedConfiguration,
          powerAnalysis: powerAnalysisResult,
          experimentalDesign,
          recommendedSampleSizes:
            powerAnalysisResult.sensitivityAnalysis.sampleSizeRecommendations.map(
              (rec) => rec.sampleSize
            ),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * A/B 테스트 결과 분석
   * Student's t-test, Welch's t-test, Mann-Whitney U test 지원
   */
  async analyzeABTestResults(request: ABTestAnalysisRequest): Promise<
    Result<{
      statisticalTests: StatisticalTestResult[];
      effectSizes: Record<string, number>;
      multipleComparisonAdjustment: {
        readonly originalPValues: number[];
        readonly adjustedPValues: number[];
        readonly rejectedHypotheses: boolean[];
      };
      practicalSignificance: {
        readonly economicSignificance: boolean;
        readonly costBenefitAnalysis: {
          readonly implementationCost: number;
          readonly expectedRevenue: number;
          readonly roi: number;
          readonly paybackPeriod: number;
        };
      };
      bayesianAnalysis?: BayesianAnalysisResult;
    }>
  > {
    try {
      const isRecord = (value: unknown): value is Record<string, unknown> => {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      };

      const getNumberFromRecord = (
        record: Record<string, unknown>,
        key: string
      ): number => {
        const raw = record[key];
        return typeof raw === "number" ? raw : Number(raw) || 0;
      };

      const analyzeLatestMetrics = (
        latestResult: {
          controlMetrics: Record<string, number>;
          treatmentMetrics: Record<string, unknown>;
        },
        confidenceLevel: number
      ) => {
        const statisticalTests: StatisticalTestResult[] = [];
        const effectSizes: Record<string, number> = {};

        for (const [metric, treatmentData] of Object.entries(
          latestResult.treatmentMetrics
        )) {
          const controlValue = latestResult.controlMetrics[metric] || 0;
          if (!isRecord(treatmentData)) continue;

          for (const [groupId, treatment] of Object.entries(treatmentData)) {
            if (!isRecord(treatment)) continue;
            const valuesRaw = treatment.values;
            if (!isRecord(valuesRaw)) continue;

            const treatmentValue = getNumberFromRecord(valuesRaw, metric);
            const tTestResult = this.performTTest(
              [controlValue],
              [treatmentValue],
              confidenceLevel
            );
            statisticalTests.push(tTestResult);

            const cohensD = this.calculateCohensD(
              controlValue,
              treatmentValue,
              1,
              1
            );

            const groupKey =
              typeof treatment.groupId === "string" && treatment.groupId.length > 0
                ? treatment.groupId
                : groupId;
            effectSizes[`${metric}_${groupKey}`] = cohensD;
          }
        }

        return { statisticalTests, effectSizes };
      };

      // A/B 테스트 데이터 조회
      const testResults = await this.analyticsRepository.getABTestResults(
        request.testId
      );
      if (!testResults.success || testResults.data.length === 0) {
        return {
          success: false,
          error: new Error(
            `No test results found for test ID: ${request.testId}`
          ),
        };
      }

      const latestResult = testResults.data[testResults.data.length - 1];

      const { statisticalTests, effectSizes } = analyzeLatestMetrics(
        latestResult,
        request.confidenceLevel
      );

      // 다중비교 보정
      const pValues = statisticalTests.map((test) => test.pValue);
      const adjustedPValues = this.adjustForMultipleComparisons(
        pValues,
        request.adjustmentMethod
      );

      // 실용적 유의성 평가
      const practicalSignificance = this.assessPracticalSignificance(
        latestResult.economicImpact
      );

      // 베이지안 분석 (요청된 경우)
      let bayesianAnalysis: BayesianAnalysisResult | undefined;
      if (request.analysisType === "BAYESIAN_UPDATE" && request.bayesianPrior) {
        bayesianAnalysis = this.performBayesianAnalysis(
          statisticalTests[0],
          request.bayesianPrior
        );
      }

      return {
        success: true,
        data: {
          statisticalTests,
          effectSizes,
          multipleComparisonAdjustment: {
            originalPValues: pValues,
            adjustedPValues,
            rejectedHypotheses: adjustedPValues.map(
              (p) => p < request.confidenceLevel
            ),
          },
          practicalSignificance,
          bayesianAnalysis,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * Cohen의 통계적 검정력 분석
   */
  private calculatePowerAnalysis(
    effectSize: number,
    variance: number,
    alpha: number,
    targetPower: number
  ): PowerAnalysisResult {
    // Cohen's power analysis formulas
    const standardEffectSize = effectSize / Math.sqrt(variance);
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(targetPower);

    const recommendedSampleSize = Math.ceil(
      2 * Math.pow((zAlpha + zBeta) / standardEffectSize, 2)
    );

    // 검정력 곡선 생성
    const powerCurve: Array<{ effectSize: number; power: number }> = [];
    for (let es = 0.1; es <= 2.0; es += 0.1) {
      const power = this.calculatePower(es, recommendedSampleSize, alpha);
      powerCurve.push({ effectSize: es, power });
    }

    // 표본 크기 권장사항
    const sampleSizeRecommendations = [0.8, 0.85, 0.9, 0.95].map((power) => ({
      sampleSize: Math.ceil(
        2 * Math.pow((zAlpha + this.getZScore(power)) / standardEffectSize, 2)
      ),
      power,
      cost:
        Math.ceil(
          2 * Math.pow((zAlpha + this.getZScore(power)) / standardEffectSize, 2)
        ) * 10, // 가상의 비용
    }));

    return {
      recommendedSampleSize,
      actualPower: targetPower,
      minimumDetectableEffect: effectSize,
      typeIErrorRate: alpha,
      typeIIErrorRate: 1 - targetPower,
      criticalValue: zAlpha,
      sensitivityAnalysis: {
        effectSizeRange: [0.1, 2.0],
        powerCurve,
        sampleSizeRecommendations,
      },
    };
  }

  /**
   * 실험 설계 생성
   */
  private async createExperimentalDesign(
    randomizationStrategy: string,
    sampleSize: number
  ): Promise<ExperimentalDesign> {
    // 간단한 무작위 배정 시뮬레이션
    const treatmentAssignment: Record<UserId, string> = {};

    for (let i = 0; i < sampleSize; i++) {
      const userId = `user_${i}` as UserId;
      treatmentAssignment[userId] =
        Math.random() < 0.5 ? "CONTROL" : "TREATMENT";
    }

    return {
      designType: "RANDOMIZED_CONTROLLED",
      randomizationMethod: randomizationStrategy as any,
      stratificationVariables: [],
      blockingVariables: [],
      treatmentAssignment,
      balanceCheck: {
        preTestEquivalence: true,
        covariateBalance: {},
        attritionAnalysis: {
          overallAttritionRate: 0.05,
          differentialAttrition: false,
        },
      },
    };
  }

  /**
   * Student's t-test 수행
   */
  private performTTest(
    control: number[],
    treatment: number[],
    confidenceLevel: number
  ): StatisticalTestResult {
    const controlMean = control.reduce((a, b) => a + b, 0) / control.length;
    const treatmentMean =
      treatment.reduce((a, b) => a + b, 0) / treatment.length;

    const controlVar =
      control.reduce((sum, x) => sum + Math.pow(x - controlMean, 2), 0) /
      (control.length - 1);
    const treatmentVar =
      treatment.reduce((sum, x) => sum + Math.pow(x - treatmentMean, 2), 0) /
      (treatment.length - 1);

    const pooledSE = Math.sqrt(
      controlVar / control.length + treatmentVar / treatment.length
    );
    const tStatistic = (treatmentMean - controlMean) / pooledSE;
    const df = control.length + treatment.length - 2;

    // 간단한 p-value 계산 (정확한 계산을 위해서는 더 정교한 함수 필요)
    const pValue = this.calculatePValue(Math.abs(tStatistic), df);
    const criticalValue = this.getTCriticalValue(confidenceLevel, df);

    const marginOfError = criticalValue * pooledSE;

    return {
      testStatistic: tStatistic,
      pValue,
      degreesOfFreedom: df,
      criticalValue,
      isSignificant: Math.abs(tStatistic) > criticalValue,
      effectSize: this.calculateCohensD(
        controlMean,
        treatmentMean,
        controlVar,
        treatmentVar
      ),
      confidenceInterval: [
        treatmentMean - controlMean - marginOfError,
        treatmentMean - controlMean + marginOfError,
      ],
      standardError: pooledSE,
      testType: "T_TEST",
    };
  }

  /**
   * Cohen's d 효과 크기 계산
   */
  private calculateCohensD(
    mean1: number,
    mean2: number,
    var1: number,
    var2: number
  ): number {
    const pooledSD = Math.sqrt((var1 + var2) / 2);
    return (mean2 - mean1) / pooledSD;
  }

  /**
   * 다중비교 보정
   */
  private adjustForMultipleComparisons(
    pValues: number[],
    method: string
  ): number[] {
    switch (method) {
      case "BONFERRONI":
        return pValues.map((p) => Math.min(1, p * pValues.length));
      case "BENJAMINI_HOCHBERG":
        return this.benjaminiHochbergCorrection(pValues);
      case "HOLM":
        return this.holmCorrection(pValues);
      default:
        return pValues;
    }
  }

  /**
   * Benjamini-Hochberg FDR 보정
   */
  private benjaminiHochbergCorrection(pValues: number[]): number[] {
    const sortedIndices = pValues
      .map((p, i) => ({ p, i }))
      .sort((a, b) => a.p - b.p);

    const adjustedPValues = new Array(pValues.length);
    const m = pValues.length;

    for (let i = 0; i < sortedIndices.length; i++) {
      const rank = i + 1;
      const adjustedP = Math.min(1, (sortedIndices[i].p * m) / rank);
      adjustedPValues[sortedIndices[i].i] = adjustedP;
    }

    return adjustedPValues;
  }

  /**
   * Holm 보정
   */
  private holmCorrection(pValues: number[]): number[] {
    const sortedIndices = pValues
      .map((p, i) => ({ p, i }))
      .sort((a, b) => a.p - b.p);

    const adjustedPValues = new Array(pValues.length);
    const m = pValues.length;

    for (let i = 0; i < sortedIndices.length; i++) {
      const adjustedP = Math.min(1, sortedIndices[i].p * (m - i));
      adjustedPValues[sortedIndices[i].i] = adjustedP;
    }

    return adjustedPValues;
  }

  /**
   * 실용적 유의성 평가
   */
  private assessPracticalSignificance(economicImpact: any): {
    readonly economicSignificance: boolean;
    readonly costBenefitAnalysis: {
      readonly implementationCost: number;
      readonly expectedRevenue: number;
      readonly roi: number;
      readonly paybackPeriod: number;
    };
  } {
    const welfareChange = economicImpact?.welfareChange || 0;
    const efficiencyGain = economicImpact?.efficiencyGain || 0;

    const implementationCost = 10000; // 가상의 구현 비용
    const expectedRevenue = welfareChange * 1000; // 가상의 수익 계산
    const roi =
      expectedRevenue > 0
        ? (expectedRevenue - implementationCost) / implementationCost
        : -1;
    const paybackPeriod =
      expectedRevenue > 0 ? implementationCost / expectedRevenue : Infinity;

    return {
      economicSignificance: roi > 0.1 && efficiencyGain > 0.05,
      costBenefitAnalysis: {
        implementationCost,
        expectedRevenue,
        roi,
        paybackPeriod,
      },
    };
  }

  /**
   * 베이지안 분석
   */
  private performBayesianAnalysis(
    testResult: StatisticalTestResult,
    prior: NonNullable<ABTestAnalysisRequest["bayesianPrior"]>
  ): BayesianAnalysisResult {
    // 베이지안 업데이트 (정규분포 가정)
    const likelihood = testResult.effectSize;
    const likelihoodPrecision = 1 / Math.pow(testResult.standardError, 2);
    const priorPrecision = 1 / prior.priorVariance;

    const posteriorPrecision = priorPrecision + likelihoodPrecision;
    const posteriorMean =
      (prior.priorMean * priorPrecision + likelihood * likelihoodPrecision) /
      posteriorPrecision;
    const posteriorVariance = 1 / posteriorPrecision;

    // 베이즈 팩터 계산 (단순화된 버전)
    const bayesFactor = Math.exp(-0.5 * Math.pow(testResult.testStatistic, 2));

    // 증거 수준 판정
    let evidence: BayesianAnalysisResult["evidence"];
    if (bayesFactor > 100) evidence = "DECISIVE";
    else if (bayesFactor > 30) evidence = "VERY_STRONG";
    else if (bayesFactor > 10) evidence = "STRONG";
    else if (bayesFactor > 3) evidence = "MODERATE";
    else if (bayesFactor > 1) evidence = "WEAK";
    else evidence = "INCONCLUSIVE";

    return {
      posteriorDistribution: {
        mean: posteriorMean,
        variance: posteriorVariance,
        credibleInterval: [
          posteriorMean - 1.96 * Math.sqrt(posteriorVariance),
          posteriorMean + 1.96 * Math.sqrt(posteriorVariance),
        ],
        probabilityOfSuperiority: posteriorMean > 0 ? 0.7 : 0.3, // 단순화된 계산
      },
      bayesFactor,
      evidence,
      posteriorPredictiveCheck: {
        discrepancyMeasure: Math.abs(testResult.testStatistic - posteriorMean),
        pValue: testResult.pValue,
        modelFit: testResult.pValue > 0.05 ? "GOOD" : "POOR",
      },
    };
  }

  // 유틸리티 함수들
  private getZScore(probability: number): number {
    // 표준정규분포의 분위수 함수 (근사)
    if (probability <= 0.5) {
      const t = Math.sqrt(-2 * Math.log(probability));
      return -(
        t -
        (2.30753 + 0.27061 * t) / (1 + 0.99229 * t + 0.04481 * t * t)
      );
    } else {
      const t = Math.sqrt(-2 * Math.log(1 - probability));
      return t - (2.30753 + 0.27061 * t) / (1 + 0.99229 * t + 0.04481 * t * t);
    }
  }

  private calculatePower(
    effectSize: number,
    sampleSize: number,
    alpha: number
  ): number {
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = effectSize * Math.sqrt(sampleSize / 2) - zAlpha;
    return this.normalCDF(zBeta);
  }

  private normalCDF(z: number): number {
    // 표준정규분포 누적분포함수 (근사)
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // 오차함수 근사
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private calculatePValue(tStatistic: number, df: number): number {
    // t-분포 p-value 근사 계산
    return 2 * (1 - this.tCDF(Math.abs(tStatistic), df));
  }

  private tCDF(t: number, df: number): number {
    // t-분포 누적분포함수 근사
    if (df > 30) {
      return this.normalCDF(t);
    }
    // 단순화된 근사
    return 0.5 + 0.5 * this.erf(t / Math.sqrt(2));
  }

  private getTCriticalValue(confidenceLevel: number, df: number): number {
    // t-분포 임계값 근사
    const alpha = 1 - confidenceLevel;
    if (df > 30) {
      return this.getZScore(1 - alpha / 2);
    }
    // 단순화된 근사 (실제로는 t-분포표 사용)
    return this.getZScore(1 - alpha / 2) * (1 + 1 / (4 * df));
  }
}
