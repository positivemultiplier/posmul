/**
 * @fileoverview 경제지표 예측 서비스 - 시계열 분석 및 거시경제 예측
 * @description ARIMA, VAR, 칼만필터 등을 활용한 경제지표 예측 시스템
 * @author Economy Domain - Economic Forecasting Team
 * @version 1.0.0
 */
import { Result } from "@posmul/auth-economy-sdk";

/**
 * 경제지표 타입 정의
 */
export enum EconomicIndicatorType {
  GDP = "gdp", // 국내총생산
  INFLATION = "inflation", // 물가상승률
  UNEMPLOYMENT = "unemployment", // 실업률
  INTEREST_RATE = "interest_rate", // 기준금리
  EXCHANGE_RATE = "exchange_rate", // 환율
  STOCK_INDEX = "stock_index", // 주가지수
  HOUSING_PRICE = "housing_price", // 주택가격
  COMMODITY_PRICE = "commodity_price", // 원자재가격
  CONSUMER_CONFIDENCE = "consumer_confidence", // 소비자신뢰지수
  BUSINESS_CONFIDENCE = "business_confidence", // 기업신뢰지수
  TRADE_BALANCE = "trade_balance", // 무역수지
  FISCAL_BALANCE = "fiscal_balance", // 재정수지
}

/**
 * 예측 모델 타입
 */
export enum ForecastingModelType {
  ARIMA = "arima", // ARIMA(p,d,q)
  SARIMA = "sarima", // Seasonal ARIMA
  VAR = "var", // Vector Autoregression
  VECM = "vecm", // Vector Error Correction Model
  KALMAN_FILTER = "kalman_filter", // 칼만 필터
  STATE_SPACE = "state_space", // 상태공간모델
  NEURAL_NETWORK = "neural_network", // 신경망
  ENSEMBLE = "ensemble", // 앙상블 모델
  STRUCTURAL = "structural", // 구조모델
  REDUCED_FORM = "reduced_form", // 축약형 모델
}

/**
 * 예측 설정 인터페이스
 */
export interface ForecastingConfig {
  indicatorType: EconomicIndicatorType;
  modelType: ForecastingModelType;
  horizonPeriods: number; // 예측 기간
  confidenceLevel: number; // 신뢰수준
  seasonalityAdjustment: boolean; // 계절조정 여부
  structuralBreakDetection: boolean; // 구조적 변화 탐지
  externalVariables?: string[]; // 외생변수
  modelParameters?: ModelParameters; // 모델 파라미터
}

/**
 * 모델 파라미터
 */
export interface ModelParameters {
  // ARIMA 파라미터
  arimaOrder?: [number, number, number]; // [p, d, q]
  seasonalOrder?: [number, number, number, number]; // [P, D, Q, s]

  // VAR 파라미터
  lagOrder?: number;
  cointegrationRank?: number;

  // 칼만 필터 파라미터
  stateTransitionMatrix?: number[][];
  observationMatrix?: number[][];
  processNoiseCovariance?: number[][];
  observationNoiseCovariance?: number[][];

  // 신경망 파라미터
  hiddenLayers?: number[];
  activationFunction?: string;
  learningRate?: number;
  epochs?: number;
}

/**
 * 시계열 데이터 포인트
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * 예측 결과
 */
export interface ForecastingResult {
  indicatorType: EconomicIndicatorType;
  modelType: ForecastingModelType;
  forecasts: ForecastPoint[];
  modelDiagnostics: ForecastingDiagnostics;
  accuracy: ForecastingAccuracy;
  confidence: ConfidenceInterval[];
  timestamp: Date;
}

/**
 * 예측 포인트
 */
export interface ForecastPoint {
  period: Date;
  forecastValue: number;
  lowerBound: number;
  upperBound: number;
  probabilityDistribution?: ProbabilityDistribution;
}

/**
 * 확률분포 정보
 */
export interface ProbabilityDistribution {
  mean: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  quantiles: Record<string, number>; // 5%, 25%, 50%, 75%, 95%
}

/**
 * 예측 진단
 */
export interface ForecastingDiagnostics {
  modelSpecification: ModelSpecificationTest;
  residualAnalysis: ResidualAnalysisResult;
  stabilityTest: ModelStabilityTest;
  structuralBreaks: StructuralBreakTest[];
  seasonalityTest: SeasonalityTestResult;
  stationarityTest: StationarityTestResult;
}

/**
 * 모델 명세 검정
 */
export interface ModelSpecificationTest {
  aicScore: number;
  bicScore: number;
  hqicScore: number;
  logLikelihood: number;
  parameterSignificance: ParameterSignificanceTest[];
}

export interface ParameterSignificanceTest {
  parameter: string;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
}

/**
 * 잔차 분석 결과
 */
export interface ResidualAnalysisResult {
  ljungBoxTest: LjungBoxTestResult;
  heteroskedasticityTest: HeteroskedasticityTestResult;
  normalityTest: NormalityTestResult;
  autocorrelationFunction: number[];
  partialAutocorrelationFunction: number[];
}

export interface LjungBoxTestResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  isWhiteNoise: boolean;
}

export interface HeteroskedasticityTestResult {
  archTestStatistic: number;
  archTestPValue: number;
  isHomoscedastic: boolean;
}

export interface NormalityTestResult {
  jarqueBeraStatistic: number;
  jarqueBeraPValue: number;
  shapiroWilkStatistic: number;
  shapiroWilkPValue: number;
  isNormal: boolean;
}

/**
 * 모델 안정성 검정
 */
export interface ModelStabilityTest {
  recursiveResiduals: number[];
  cusumTest: CUSUMTestResult;
  cumsumSquaredTest: CUSUMSquaredTestResult;
  breakpointTest: BreakpointTestResult;
}

export interface CUSUMTestResult {
  cusumStatistics: number[];
  criticalBounds: [number, number];
  isStable: boolean;
}

export interface CUSUMSquaredTestResult {
  cusumSquaredStatistics: number[];
  criticalValue: number;
  isStable: boolean;
}

export interface BreakpointTestResult {
  breakpoints: Date[];
  fStatistics: number[];
  pValues: number[];
}

/**
 * 구조적 변화 검정
 */
export interface StructuralBreakTest {
  breakDate: Date;
  testStatistic: number;
  pValue: number;
  breakType: StructuralBreakType;
  confidence: number;
}

export enum StructuralBreakType {
  LEVEL_SHIFT = "level_shift",
  TREND_BREAK = "trend_break",
  VARIANCE_BREAK = "variance_break",
  REGIME_CHANGE = "regime_change",
}

/**
 * 계절성 검정 결과
 */
export interface SeasonalityTestResult {
  x11SeasonalTest: X11SeasonalTestResult;
  friedmanTest: FriedmanTestResult;
  kruskalWallisTest: KruskalWallisTestResult;
  isSeasonalityPresent: boolean;
}

export interface X11SeasonalTestResult {
  fStatistic: number;
  pValue: number;
  seasonalFactors: number[];
}

export interface FriedmanTestResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
}

export interface KruskalWallisTestResult {
  hStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
}

/**
 * 정상성 검정 결과
 */
export interface StationarityTestResult {
  adfTest: AugmentedDickeyFullerTest;
  kpssTest: KPSSTest;
  phillipsPerronTest: PhillipsPerronTest;
  isStationary: boolean;
  requiredDifferencing: number;
}

export interface AugmentedDickeyFullerTest {
  statistic: number;
  pValue: number;
  criticalValues: Record<string, number>; // 1%, 5%, 10%
  lagOrder: number;
}

export interface KPSSTest {
  statistic: number;
  pValue: number;
  criticalValues: Record<string, number>;
  testType: "level" | "trend";
}

export interface PhillipsPerronTest {
  statistic: number;
  pValue: number;
  criticalValues: Record<string, number>;
  bandwidth: number;
}

/**
 * 예측 정확도
 */
export interface ForecastingAccuracy {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  theilsU: number; // Theil's U Statistic
  directionAccuracy: number; // 방향 예측 정확도
  backtestResults: BacktestResult[];
}

/**
 * 백테스트 결과
 */
export interface BacktestResult {
  startDate: Date;
  endDate: Date;
  actualValues: number[];
  forecastValues: number[];
  accuracy: ForecastingAccuracy;
}

/**
 * 신뢰구간
 */
export interface ConfidenceInterval {
  period: Date;
  level: number; // 신뢰수준 (0.95, 0.99 등)
  lowerBound: number;
  upperBound: number;
  width: number;
}

/**
 * 시나리오 분석 설정
 */
export interface ScenarioAnalysisConfig {
  baselineScenario: Record<string, number[]>;
  alternativeScenarios: AlternativeScenario[];
  stressTestScenarios: StressTestScenario[];
  monteCarloSimulations: number;
}

export interface AlternativeScenario {
  name: string;
  description: string;
  exogenousShocks: Record<string, number[]>;
  probability: number;
}

export interface StressTestScenario {
  name: string;
  description: string;
  shockMagnitude: number;
  shockDuration: number;
  shockType: "level" | "growth" | "volatility";
}

/**
 * 시나리오 분석 결과
 */
export interface ScenarioAnalysisResult {
  baselineForecasts: ForecastPoint[];
  alternativeForecasts: Record<string, ForecastPoint[]>;
  stressTestResults: Record<string, ForecastPoint[]>;
  monteCarloResults: MonteCarloResult;
  riskMetrics: RiskMetrics;
}

export interface MonteCarloResult {
  meanForecasts: ForecastPoint[];
  medianForecasts: ForecastPoint[];
  confidenceIntervals: Record<string, ConfidenceInterval[]>; // 95%, 99%
  probabilityDensityFunction: Record<string, ProbabilityDistribution>;
}

export interface RiskMetrics {
  valueAtRisk: Record<string, number>; // 95%, 99% VaR
  expectedShortfall: Record<string, number>; // 95%, 99% ES
  maximumDrawdown: number;
  volatility: number;
  skewness: number;
  kurtosis: number;
}

/**
 * 경제지표 예측 서비스 클래스
 *
 * 시계열 분석과 계량경제학 모델을 활용하여 경제지표를 예측합니다.
 * ARIMA, VAR, 칼만필터 등 다양한 예측 모델을 지원합니다.
 */
export class EconomicForecastingService {
  /**
   * 경제지표 예측 실행
   *
   * @param data 시계열 데이터
   * @param config 예측 설정
   * @returns 예측 결과
   */
  async forecastIndicator(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<ForecastingResult>> {
    try {
      // 데이터 전처리
      const preprocessedData = await this.preprocessData(data, config);
      if (!preprocessedData.success) {
        return {
          success: false,
          error: new Error("데이터 전처리에 실패했습니다."),
        };
      }

      const cleanedData = preprocessedData.data;

      // 모델 추정
      const modelResult = await this.estimateModel(
        preprocessedData.data,
        config
      );
      if (!modelResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }
      if (!modelResult.success) {
        return {
          success: false,
          error: new Error("모델 추정에 실패했습니다."),
        };
      }

      // 예측 생성
      const forecasts = await this.generateForecasts(modelResult.data, config);
      if (!forecasts.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      // 모델 진단
      const diagnostics = await this.runModelDiagnostics(
        preprocessedData.data,
        modelResult.data,
        config
      );

      // 정확도 평가
      const accuracy = await this.evaluateAccuracy(
        preprocessedData.data,
        modelResult.data,
        config
      );

      // 신뢰구간 계산
      const confidence = this.calculateConfidenceIntervals(
        forecasts.data,
        modelResult.data,
        config
      );

      return {
        success: true,
        data: {
          indicatorType: config.indicatorType,
          modelType: config.modelType,
          forecasts: forecasts.data,
          modelDiagnostics: diagnostics,
          accuracy,
          confidence,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error("예측 실행 중 오류 발생"),
      };
    }
  }

  /**
   * 다중 지표 예측 (VAR 모델)
   */
  async forecastMultipleIndicators(
    data: Record<EconomicIndicatorType, TimeSeriesDataPoint[]>,
    config: ForecastingConfig
  ): Promise<Result<Record<EconomicIndicatorType, ForecastingResult>>> {
    try {
      if (
        config.modelType !== ForecastingModelType.VAR &&
        config.modelType !== ForecastingModelType.VECM
      ) {
        return {
          success: false,
          error: new Error("다중 지표 예측은 VAR 또는 VECM 모델만 지원됩니다."),
        };
      }

      const results: Record<EconomicIndicatorType, ForecastingResult> =
        {} as any;

      // VAR 시스템 추정
      const varSystem = await this.estimateVARSystem(data, config);
      if (!varSystem.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      // 각 지표별 예측 생성
      for (const [indicator, timeSeries] of Object.entries(data)) {
        const indicatorConfig = {
          ...config,
          indicatorType: indicator as EconomicIndicatorType,
        };

        const result = await this.forecastIndicator(
          timeSeries,
          indicatorConfig
        );
        if (result.success) {
          results[indicator as EconomicIndicatorType] = result.data;
        }
      }

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("다중 지표 예측 중 오류 발생"),
      };
    }
  }

  /**
   * 시나리오 분석
   */
  async runScenarioAnalysis(
    data: TimeSeriesDataPoint[],
    forecastConfig: ForecastingConfig,
    scenarioConfig: ScenarioAnalysisConfig
  ): Promise<Result<ScenarioAnalysisResult>> {
    try {
      // 기준 시나리오 예측
      const baselineResult = await this.forecastIndicator(data, forecastConfig);
      if (!baselineResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      // 대안 시나리오 분석
      const alternativeForecasts: Record<string, ForecastPoint[]> = {};
      for (const scenario of scenarioConfig.alternativeScenarios) {
        const adjustedData = this.applyExogenousShocks(
          data,
          scenario.exogenousShocks
        );
        const result = await this.forecastIndicator(
          adjustedData,
          forecastConfig
        );
        if (result.success) {
          alternativeForecasts[scenario.name] = result.data.forecasts;
        }
      }

      // 스트레스 테스트
      const stressTestResults: Record<string, ForecastPoint[]> = {};
      for (const stressTest of scenarioConfig.stressTestScenarios) {
        const stressedData = this.applyStressTest(data, stressTest);
        const result = await this.forecastIndicator(
          stressedData,
          forecastConfig
        );
        if (result.success) {
          stressTestResults[stressTest.name] = result.data.forecasts;
        }
      }

      // 몬테카를로 시뮬레이션
      const monteCarloResults = await this.runMonteCarloSimulation(
        data,
        forecastConfig,
        scenarioConfig.monteCarloSimulations
      );

      // 위험 지표 계산
      const riskMetrics = this.calculateRiskMetrics(
        baselineResult.data.forecasts,
        alternativeForecasts,
        stressTestResults
      );

      return {
        success: true,
        data: {
          baselineForecasts: baselineResult.data.forecasts,
          alternativeForecasts,
          stressTestResults,
          monteCarloResults,
          riskMetrics,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("시나리오 분석 중 오류 발생"),
      };
    }
  }

  /**
   * 실시간 예측 업데이트
   */
  async updateForecast(
    existingForecast: ForecastingResult,
    newDataPoint: TimeSeriesDataPoint,
    config: ForecastingConfig
  ): Promise<Result<ForecastingResult>> {
    try {
      // 칼만 필터 기반 실시간 업데이트
      if (config.modelType === ForecastingModelType.KALMAN_FILTER) {
        return await this.kalmanFilterUpdate(
          existingForecast,
          newDataPoint,
          config
        );
      }

      // 일반적인 모델 재추정
      return await this.reestimateModel(existingForecast, newDataPoint, config);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("예측 업데이트 중 오류 발생"),
      };
    }
  }

  /**
   * 예측 성과 평가
   */
  async evaluateForecastPerformance(
    forecasts: ForecastPoint[],
    actualValues: TimeSeriesDataPoint[]
  ): Promise<Result<ForecastingAccuracy>> {
    try {
      const forecastValues = forecasts.map((f) => f.forecastValue);
      const actual = actualValues.map((a) => a.value);

      if (forecastValues.length !== actual.length) {
        return {
          success: false,
          error: new Error("예측값과 실제값의 길이가 일치하지 않습니다."),
        };
      }

      const mae = this.calculateMAE(actual, forecastValues);
      const mape = this.calculateMAPE(actual, forecastValues);
      const rmse = this.calculateRMSE(actual, forecastValues);
      const theilsU = this.calculateTheilsU(actual, forecastValues);
      const directionAccuracy = this.calculateDirectionAccuracy(
        actual,
        forecastValues
      );

      // 백테스트 결과 생성
      const backtestResults = await this.generateBacktestResults(
        actual,
        forecastValues
      );

      return {
        success: true,
        data: {
          mae,
          mape,
          rmse,
          theilsU,
          directionAccuracy,
          backtestResults,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("예측 성과 평가 중 오류 발생"),
      };
    }
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private async preprocessData(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<TimeSeriesDataPoint[]>> {
    try {
      let processedData = [...data];

      // 정렬
      processedData.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      // 결측치 처리
      processedData = this.handleMissingValues(processedData);

      // 이상치 처리
      if (config.structuralBreakDetection) {
        processedData = this.handleOutliers(processedData);
      }

      // 계절조정
      if (config.seasonalityAdjustment) {
        processedData = await this.applySeasonalAdjustment(processedData);
      }

      // 로그 변환 (필요시)
      if (this.requiresLogTransformation(config.indicatorType)) {
        processedData = this.applyLogTransformation(processedData);
      }

      return { success: true, data: processedData };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("데이터 전처리 중 오류 발생"),
      };
    }
  }

  private async estimateModel(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<any>> {
    try {
      switch (config.modelType) {
        case ForecastingModelType.ARIMA:
          return await this.estimateARIMA(data, config);
        case ForecastingModelType.VAR:
          return await this.estimateVAR(data, config);
        case ForecastingModelType.KALMAN_FILTER:
          return await this.estimateKalmanFilter(data, config);
        case ForecastingModelType.NEURAL_NETWORK:
          return await this.estimateNeuralNetwork(data, config);
        default:
          return {
            success: false,
            error: new Error(`지원되지 않는 모델 타입: ${config.modelType}`),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error("모델 추정 중 오류 발생"),
      };
    }
  }

  private async generateForecasts(
    model: any,
    config: ForecastingConfig
  ): Promise<Result<ForecastPoint[]>> {
    try {
      const forecasts: ForecastPoint[] = [];
      const currentDate = new Date();

      for (let i = 1; i <= config.horizonPeriods; i++) {
        const forecastDate = new Date(currentDate);
        forecastDate.setMonth(forecastDate.getMonth() + i);

        const forecast = await this.generateSingleForecast(model, i, config);
        const bounds = this.calculateForecastBounds(forecast, i, model, config);

        forecasts.push({
          period: forecastDate,
          forecastValue: forecast,
          lowerBound: bounds.lower,
          upperBound: bounds.upper,
          probabilityDistribution: this.calculateProbabilityDistribution(
            forecast,
            bounds,
            model
          ),
        });
      }

      return { success: true, data: forecasts };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error : new Error("예측 생성 중 오류 발생"),
      };
    }
  }

  private async runModelDiagnostics(
    data: TimeSeriesDataPoint[],
    model: any,
    config: ForecastingConfig
  ): Promise<ForecastingDiagnostics> {
    // 모델 진단 구현 (스텁)
    return {
      modelSpecification: {
        aicScore: 0,
        bicScore: 0,
        hqicScore: 0,
        logLikelihood: 0,
        parameterSignificance: [],
      },
      residualAnalysis: {
        ljungBoxTest: {
          statistic: 0,
          pValue: 0,
          degreesOfFreedom: 0,
          isWhiteNoise: true,
        },
        heteroskedasticityTest: {
          archTestStatistic: 0,
          archTestPValue: 0,
          isHomoscedastic: true,
        },
        normalityTest: {
          jarqueBeraStatistic: 0,
          jarqueBeraPValue: 0,
          shapiroWilkStatistic: 0,
          shapiroWilkPValue: 0,
          isNormal: true,
        },
        autocorrelationFunction: [],
        partialAutocorrelationFunction: [],
      },
      stabilityTest: {
        recursiveResiduals: [],
        cusumTest: {
          cusumStatistics: [],
          criticalBounds: [0, 0],
          isStable: true,
        },
        cumsumSquaredTest: {
          cusumSquaredStatistics: [],
          criticalValue: 0,
          isStable: true,
        },
        breakpointTest: { breakpoints: [], fStatistics: [], pValues: [] },
      },
      structuralBreaks: [],
      seasonalityTest: {
        x11SeasonalTest: { fStatistic: 0, pValue: 0, seasonalFactors: [] },
        friedmanTest: { statistic: 0, pValue: 0, degreesOfFreedom: 0 },
        kruskalWallisTest: { hStatistic: 0, pValue: 0, degreesOfFreedom: 0 },
        isSeasonalityPresent: false,
      },
      stationarityTest: {
        adfTest: { statistic: 0, pValue: 0, criticalValues: {}, lagOrder: 0 },
        kpssTest: {
          statistic: 0,
          pValue: 0,
          criticalValues: {},
          testType: "level",
        },
        phillipsPerronTest: {
          statistic: 0,
          pValue: 0,
          criticalValues: {},
          bandwidth: 0,
        },
        isStationary: true,
        requiredDifferencing: 0,
      },
    };
  }

  private async evaluateAccuracy(
    data: TimeSeriesDataPoint[],
    model: any,
    config: ForecastingConfig
  ): Promise<ForecastingAccuracy> {
    // 정확도 평가 구현 (스텁)
    return {
      mae: 0,
      mape: 0,
      rmse: 0,
      theilsU: 0,
      directionAccuracy: 0,
      backtestResults: [],
    };
  }

  private calculateConfidenceIntervals(
    forecasts: ForecastPoint[],
    model: any,
    config: ForecastingConfig
  ): ConfidenceInterval[] {
    return forecasts.map((forecast) => ({
      period: forecast.period,
      level: config.confidenceLevel,
      lowerBound: forecast.lowerBound,
      upperBound: forecast.upperBound,
      width: forecast.upperBound - forecast.lowerBound,
    }));
  }

  // 추가 helper 메서드들 (스텁 구현)
  private handleMissingValues(
    data: TimeSeriesDataPoint[]
  ): TimeSeriesDataPoint[] {
    return data.filter((point) => !isNaN(point.value) && isFinite(point.value));
  }

  private handleOutliers(data: TimeSeriesDataPoint[]): TimeSeriesDataPoint[] {
    // 간단한 IQR 방법으로 이상치 제거
    const values = data.map((d) => d.value);
    const q1 = this.calculateQuantile(values, 0.25);
    const q3 = this.calculateQuantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter((d) => d.value >= lowerBound && d.value <= upperBound);
  }

  private calculateQuantile(values: number[], quantile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = quantile * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private async applySeasonalAdjustment(
    data: TimeSeriesDataPoint[]
  ): Promise<TimeSeriesDataPoint[]> {
    // X-13ARIMA-SEATS 또는 STL 분해 구현 (스텁)
    return data;
  }

  private requiresLogTransformation(
    indicatorType: EconomicIndicatorType
  ): boolean {
    // GDP, 주가지수, 주택가격 등은 로그 변환 적용
    return [
      EconomicIndicatorType.GDP,
      EconomicIndicatorType.STOCK_INDEX,
      EconomicIndicatorType.HOUSING_PRICE,
      EconomicIndicatorType.COMMODITY_PRICE,
    ].includes(indicatorType);
  }

  private applyLogTransformation(
    data: TimeSeriesDataPoint[]
  ): TimeSeriesDataPoint[] {
    return data.map((point) => ({
      ...point,
      value: Math.log(Math.max(point.value, 0.001)), // 0 방지
    }));
  }

  // 모델 추정 메서드들 (스텁)
  private async estimateARIMA(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async estimateVAR(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async estimateVARSystem(
    data: Record<EconomicIndicatorType, TimeSeriesDataPoint[]>,
    config: ForecastingConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async estimateKalmanFilter(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async estimateNeuralNetwork(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async generateSingleForecast(
    model: any,
    horizon: number,
    config: ForecastingConfig
  ): Promise<number> {
    return 0; // 스텁
  }

  private calculateForecastBounds(
    forecast: number,
    horizon: number,
    model: any,
    config: ForecastingConfig
  ): { lower: number; upper: number } {
    const margin = 1.96 * Math.sqrt(horizon); // 간단한 계산
    return {
      lower: forecast - margin,
      upper: forecast + margin,
    };
  }

  private calculateProbabilityDistribution(
    forecast: number,
    bounds: { lower: number; upper: number },
    model: any
  ): ProbabilityDistribution {
    const variance = Math.pow((bounds.upper - bounds.lower) / 4, 2); // 근사
    return {
      mean: forecast,
      variance,
      skewness: 0,
      kurtosis: 3,
      quantiles: {
        "5%": bounds.lower,
        "25%": forecast - Math.sqrt(variance) * 0.67,
        "50%": forecast,
        "75%": forecast + Math.sqrt(variance) * 0.67,
        "95%": bounds.upper,
      },
    };
  }

  // 시나리오 분석 메서드들
  private applyExogenousShocks(
    data: TimeSeriesDataPoint[],
    shocks: Record<string, number[]>
  ): TimeSeriesDataPoint[] {
    return data; // 스텁
  }

  private applyStressTest(
    data: TimeSeriesDataPoint[],
    stressTest: StressTestScenario
  ): TimeSeriesDataPoint[] {
    return data; // 스텁
  }

  private async runMonteCarloSimulation(
    data: TimeSeriesDataPoint[],
    config: ForecastingConfig,
    simulations: number
  ): Promise<MonteCarloResult> {
    return {
      meanForecasts: [],
      medianForecasts: [],
      confidenceIntervals: {},
      probabilityDensityFunction: {},
    };
  }

  private calculateRiskMetrics(
    baseline: ForecastPoint[],
    alternatives: Record<string, ForecastPoint[]>,
    stressTests: Record<string, ForecastPoint[]>
  ): RiskMetrics {
    return {
      valueAtRisk: {},
      expectedShortfall: {},
      maximumDrawdown: 0,
      volatility: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }

  // 실시간 업데이트 메서드들
  private async kalmanFilterUpdate(
    existingForecast: ForecastingResult,
    newDataPoint: TimeSeriesDataPoint,
    config: ForecastingConfig
  ): Promise<Result<ForecastingResult>> {
    return { success: true, data: existingForecast };
  }

  private async reestimateModel(
    existingForecast: ForecastingResult,
    newDataPoint: TimeSeriesDataPoint,
    config: ForecastingConfig
  ): Promise<Result<ForecastingResult>> {
    return { success: true, data: existingForecast };
  }

  // 정확도 계산 메서드들
  private calculateMAE(actual: number[], forecast: number[]): number {
    return (
      actual.reduce((sum, val, i) => sum + Math.abs(val - forecast[i]), 0) /
      actual.length
    );
  }

  private calculateMAPE(actual: number[], forecast: number[]): number {
    return (
      (actual.reduce((sum, val, i) => {
        if (val !== 0) {
          return sum + Math.abs((val - forecast[i]) / val);
        }
        return sum;
      }, 0) /
        actual.length) *
      100
    );
  }

  private calculateRMSE(actual: number[], forecast: number[]): number {
    const mse =
      actual.reduce((sum, val, i) => sum + Math.pow(val - forecast[i], 2), 0) /
      actual.length;
    return Math.sqrt(mse);
  }

  private calculateTheilsU(actual: number[], forecast: number[]): number {
    const numerator = Math.sqrt(
      actual.reduce((sum, val, i) => sum + Math.pow(val - forecast[i], 2), 0) /
        actual.length
    );
    const denominator =
      Math.sqrt(
        actual.reduce((sum, val) => sum + val * val, 0) / actual.length
      ) +
      Math.sqrt(
        forecast.reduce((sum, val) => sum + val * val, 0) / forecast.length
      );
    return numerator / denominator;
  }

  private calculateDirectionAccuracy(
    actual: number[],
    forecast: number[]
  ): number {
    let correct = 0;
    for (let i = 1; i < actual.length; i++) {
      const actualDirection = actual[i] > actual[i - 1];
      const forecastDirection = forecast[i] > forecast[i - 1];
      if (actualDirection === forecastDirection) {
        correct++;
      }
    }
    return (correct / (actual.length - 1)) * 100;
  }

  private async generateBacktestResults(
    actual: number[],
    forecast: number[]
  ): Promise<BacktestResult[]> {
    return []; // 스텁
  }
}
