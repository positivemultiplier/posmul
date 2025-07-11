/**
 * @fileoverview 회귀분석 서비스 - 경제학적 실증분석을 위한 회귀모델 구현
 * @description OLS, 2SLS, Logit/Probit, VAR 모델 등 계량경제학적 분석 도구 제공
 * @author Economy Domain - Econometric Analysis Team
 * @version 1.0.0
 */

import { Result } from "@posmul/auth-economy-sdk";


/**
 * 회귀모델 타입 정의
 */
export enum RegressionModelType {
  OLS = "ols", // Ordinary Least Squares
  GLS = "gls", // Generalized Least Squares
  TWOSLS = "2sls", // Two-Stage Least Squares
  LOGIT = "logit", // Logistic Regression
  PROBIT = "probit", // Probit Regression
  POISSON = "poisson", // Poisson Regression
  VAR = "var", // Vector Autoregression
  VECM = "vecm", // Vector Error Correction Model
  GARCH = "garch", // GARCH Model
  ARIMA = "arima", // ARIMA Model
}

/**
 * 회귀분석 설정 인터페이스
 */
export interface RegressionConfig {
  modelType: RegressionModelType;
  dependentVariable: string;
  independentVariables: string[];
  interceptIncluded: boolean;
  instrumentalVariables?: string[]; // 2SLS용
  lagOrder?: number; // VAR/ARIMA용
  confidenceLevel: number; // 신뢰수준 (0.95, 0.99 등)
  robustStandardErrors: boolean; // 이분산성 강건 표준오차
  clusterVariable?: string; // 클러스터 표준오차
}

/**
 * 회귀분석 결과 인터페이스
 */
export interface RegressionResult {
  modelType: RegressionModelType;
  coefficients: RegressionCoefficient[];
  modelFit: ModelFitStatistics;
  diagnostics: RegressionDiagnostics;
  predictions?: number[];
  residuals: number[];
  timestamp: Date;
}

/**
 * 회귀계수 정보
 */
export interface RegressionCoefficient {
  variable: string;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  confidenceInterval: [number, number];
  significance: SignificanceLevel;
}

/**
 * 모델 적합도 통계
 */
export interface ModelFitStatistics {
  rSquared: number; // 결정계수
  adjustedRSquared: number; // 수정 결정계수
  fStatistic: number; // F-통계량
  fPValue: number; // F-통계량 p-값
  logLikelihood: number; // 로그 우도
  aic: number; // Akaike Information Criterion
  bic: number; // Bayesian Information Criterion
  residualStandardError: number; // 잔차 표준오차
  observationsCount: number; // 관찰값 수
  degreesOfFreedom: number; // 자유도
}

/**
 * 회귀진단 결과
 */
export interface RegressionDiagnostics {
  // 가정 검정
  normalityTest: NormalityTestResult;
  heteroskedasticityTest: HeteroskedasticityTestResult;
  autocorrelationTest: AutocorrelationTestResult;
  multicollinearityTest: MulticollinearityTestResult;

  // 이상치 검정
  outlierDetection: OutlierDetectionResult;
  influentialObservations: InfluentialObservationResult[];

  // 모델 검정
  specificationTest: SpecificationTestResult;
  stabilityTest: StabilityTestResult;
}

/**
 * 정규성 검정 결과
 */
export interface NormalityTestResult {
  jarqueBeraStatistic: number;
  jarqueBeraPValue: number;
  shapiroWilkStatistic: number;
  shapiroWilkPValue: number;
  kolmogorovSmirnovStatistic: number;
  kolmogorovSmirnovPValue: number;
}

/**
 * 이분산성 검정 결과
 */
export interface HeteroskedasticityTestResult {
  breuschPaganStatistic: number;
  breuschPaganPValue: number;
  whiteStatistic: number;
  whitePValue: number;
  goldFieldQuandtStatistic: number;
  goldFieldQuandtPValue: number;
}

/**
 * 자기상관 검정 결과
 */
export interface AutocorrelationTestResult {
  durbinWatsonStatistic: number;
  ljungBoxStatistic: number;
  ljungBoxPValue: number;
  breuschGodfreyStatistic: number;
  breuschGodfreyPValue: number;
}

/**
 * 다중공선성 검정 결과
 */
export interface MulticollinearityTestResult {
  varianceInflationFactors: VIFResult[];
  conditionNumber: number;
  eigenvalues: number[];
}

export interface VIFResult {
  variable: string;
  vif: number;
  tolerance: number;
}

/**
 * 이상치 검정 결과
 */
export interface OutlierDetectionResult {
  cookDistance: number[];
  leverage: number[];
  studentizedResiduals: number[];
  dffits: number[];
  dfbetas: number[][];
}

/**
 * 영향관찰값 결과
 */
export interface InfluentialObservationResult {
  observationIndex: number;
  cookDistance: number;
  leverage: number;
  studentizedResidual: number;
  isInfluential: boolean;
}

/**
 * 모델 설정 검정 결과
 */
export interface SpecificationTestResult {
  ramseyResetStatistic: number;
  ramseyResetPValue: number;
  linkTestStatistic: number;
  linkTestPValue: number;
  ovTestStatistic: number;
  ovTestPValue: number;
}

/**
 * 구조 안정성 검정 결과
 */
export interface StabilityTestResult {
  chowTestStatistic: number;
  chowTestPValue: number;
  cusumStatistic: number[];
  cusumSquaredStatistic: number[];
  brownDurbinEvansStatistic: number;
}

/**
 * 유의수준 열거형
 */
export enum SignificanceLevel {
  NOT_SIGNIFICANT = "not_significant",
  MARGINALLY_SIGNIFICANT = "marginally_significant", // p < 0.1
  SIGNIFICANT = "significant", // p < 0.05
  HIGHLY_SIGNIFICANT = "highly_significant", // p < 0.01
}

/**
 * 예측 설정
 */
export interface PredictionConfig {
  newDataPoints: Record<string, number>[];
  includeConfidenceInterval: boolean;
  includePredictionInterval: boolean;
  confidenceLevel: number;
}

/**
 * 예측 결과
 */
export interface PredictionResult {
  predictions: number[];
  confidenceIntervals?: [number, number][];
  predictionIntervals?: [number, number][];
  standardErrors: number[];
}

/**
 * 모델 비교 결과
 */
export interface ModelComparisonResult {
  models: RegressionResult[];
  bestModel: RegressionResult;
  comparisonCriteria: {
    aic: number[];
    bic: number[];
    rSquared: number[];
    adjustedRSquared: number[];
  };
  likelihoodRatioTests?: LikelihoodRatioTest[];
}

export interface LikelihoodRatioTest {
  restrictedModel: string;
  unrestrictedModel: string;
  lrStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
}

/**
 * 회귀분석 서비스 클래스
 *
 * 경제학적 실증분석을 위한 다양한 회귀모델을 제공합니다.
 * OLS부터 고급 시계열 모델까지 포괄적인 계량경제학 도구를 구현합니다.
 */
export class RegressionAnalysisService {
  /**
   * 회귀분석 실행
   *
   * @param data 분석 데이터
   * @param config 회귀분석 설정
   * @returns 회귀분석 결과
   */
  async runRegression(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    try {
      // 데이터 검증
      const validationResult = this.validateData(data, config);
      if (!validationResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // 모델 타입에 따른 분석 실행
      switch (config.modelType) {
        case RegressionModelType.OLS:
          return await this.runOLS(data, config);
        case RegressionModelType.GLS:
          return await this.runGLS(data, config);
        case RegressionModelType.TWOSLS:
          return await this.run2SLS(data, config);
        case RegressionModelType.LOGIT:
          return await this.runLogit(data, config);
        case RegressionModelType.PROBIT:
          return await this.runProbit(data, config);
        case RegressionModelType.VAR:
          return await this.runVAR(data, config);
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
          error instanceof Error
            ? error
            : new Error("회귀분석 실행 중 오류 발생"),
      };
    }
  }

  /**
   * OLS 회귀분석 실행
   */
  private async runOLS(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    try {
      // 설계행렬(X)와 종속변수벡터(y) 구성
      const { X, y } = this.prepareMatrices(data, config);

      // OLS 추정: β = (X'X)^(-1)X'y
      const XtX = this.matrixMultiply(this.transpose(X), X);
      const XtXInv = this.matrixInverse(XtX);
      const Xty = this.matrixMultiply(
        this.transpose(X),
        y.map((val) => [val])
      );
      const coefficients = this.matrixMultiply(XtXInv, Xty).map(
        (row) => row[0]
      );

      // 잔차 계산
      const predictions = this.matrixMultiply(
        X,
        coefficients.map((c) => [c])
      ).map((row) => row[0]);
      const residuals = y.map((actual, i) => actual - predictions[i]);

      // 표준오차 계산
      const mse =
        residuals.reduce((sum, r) => sum + r * r, 0) /
        (y.length - coefficients.length);
      const varianceMatrix = this.scalarMultiply(XtXInv, mse);
      const standardErrors = this.getDiagonalElements(varianceMatrix).map((v) =>
        Math.sqrt(v)
      );

      // 계수 정보 구성
      const regressionCoefficients = this.buildCoefficientResults(
        config,
        coefficients,
        standardErrors,
        config.confidenceLevel
      );

      // 모델 적합도 통계
      const modelFit = this.calculateModelFit(
        y,
        predictions,
        residuals,
        coefficients.length
      );

      // 회귀진단
      const diagnostics = await this.runDiagnostics(
        X,
        y,
        residuals,
        predictions
      );

      return {
        success: true,
        data: {
          modelType: config.modelType,
          coefficients: regressionCoefficients,
          modelFit,
          diagnostics,
          predictions,
          residuals,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * 2단계 최소제곱법(2SLS) 실행
   */
  private async run2SLS(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    try {
      if (
        !config.instrumentalVariables ||
        config.instrumentalVariables.length === 0
      ) {
        return {
          success: false,
          error: new Error("2SLS를 위한 도구변수가 지정되지 않았습니다."),
        };
      }

      // 1단계: 내생변수를 도구변수로 회귀
      const firstStageResults = await this.runFirstStageRegressions(
        data,
        config
      );
      if (!firstStageResults.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다.")
        };
      }

      // 2단계: 예측된 값을 사용한 OLS
      const secondStageConfig = {
        ...config,
        modelType: RegressionModelType.OLS,
      };

      return await this.runOLS(data, secondStageConfig);
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * 로지스틱 회귀분석 실행
   */
  private async runLogit(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    try {
      const { X, y } = this.prepareMatrices(data, config);

      // 뉴턴-랩슨 알고리즘으로 최대우도추정
      const coefficients = await this.maximumLikelihoodEstimation(
        X,
        y,
        "logit"
      );

      // 로지스틱 함수로 예측
      const predictions = X.map((row) => {
        const linear = row.reduce((sum, x, i) => sum + x * coefficients[i], 0);
        return 1 / (1 + Math.exp(-linear));
      });

      const residuals = y.map((actual, i) => actual - predictions[i]);

      // 정보행렬 기반 표준오차
      const informationMatrix = this.calculateInformationMatrix(X, predictions);
      const varianceMatrix = this.matrixInverse(informationMatrix);
      const standardErrors = this.getDiagonalElements(varianceMatrix).map((v) =>
        Math.sqrt(v)
      );

      const regressionCoefficients = this.buildCoefficientResults(
        config,
        coefficients,
        standardErrors,
        config.confidenceLevel
      );

      const modelFit = this.calculateLogitModelFit(
        y,
        predictions,
        coefficients.length
      );
      const diagnostics = await this.runLogitDiagnostics(X, y, predictions);

      return {
        success: true,
        data: {
          modelType: config.modelType,
          coefficients: regressionCoefficients,
          modelFit,
          diagnostics,
          predictions,
          residuals,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * VAR 모델 실행
   */
  private async runVAR(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    try {
      const lagOrder = config.lagOrder || 1;

      // VAR 데이터 구성 (시차 포함)
      const varData = this.prepareVARData(
        data,
        config.independentVariables,
        lagOrder
      );

      // 각 방정식에 대해 OLS 실행
      const equations: RegressionResult[] = [];

      for (const variable of config.independentVariables) {
        const equationConfig = {
          ...config,
          dependentVariable: variable,
          modelType: RegressionModelType.OLS,
        };

        const result = await this.runOLS(varData, equationConfig);
        if (result.success) {
          equations.push(result.data);
        }
      }

      // VAR 시스템 결과 통합
      const varResult = this.combineVARResults(equations, config);

      return {
        success: true,
        data: varResult,
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * 예측 실행
   */
  async predict(
    model: RegressionResult,
    config: PredictionConfig
  ): Promise<Result<PredictionResult>> {
    try {
      const predictions: number[] = [];
      const standardErrors: number[] = [];
      const confidenceIntervals: [number, number][] = [];
      const predictionIntervals: [number, number][] = [];

      for (const dataPoint of config.newDataPoints) {
        const prediction = this.calculatePrediction(model, dataPoint);
        const standardError = this.calculatePredictionStandardError(
          model,
          dataPoint
        );

        predictions.push(prediction);
        standardErrors.push(standardError);

        if (config.includeConfidenceInterval) {
          const ci = this.calculateConfidenceInterval(
            prediction,
            standardError,
            config.confidenceLevel
          );
          confidenceIntervals.push(ci);
        }

        if (config.includePredictionInterval) {
          const pi = this.calculatePredictionInterval(
            prediction,
            standardError,
            model.modelFit.residualStandardError,
            config.confidenceLevel
          );
          predictionIntervals.push(pi);
        }
      }

      return {
        success: true,
        data: {
          predictions,
          standardErrors,
          confidenceIntervals: config.includeConfidenceInterval
            ? confidenceIntervals
            : undefined,
          predictionIntervals: config.includePredictionInterval
            ? predictionIntervals
            : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  /**
   * 모델 비교
   */
  async compareModels(
    data: Record<string, number>[],
    configs: RegressionConfig[]
  ): Promise<Result<ModelComparisonResult>> {
    try {
      const models: RegressionResult[] = [];

      for (const config of configs) {
        const result = await this.runRegression(data, config);
        if (result.success) {
          models.push(result.data);
        }
      }

      if (models.length === 0) {
        return {
          success: false,
          error: new Error("비교할 수 있는 모델이 없습니다."),
        };
      }

      // 정보 기준으로 최적 모델 선택
      const bestModel = models.reduce((best, current) =>
        current.modelFit.aic < best.modelFit.aic ? current : best
      );

      const comparisonCriteria = {
        aic: models.map((m) => m.modelFit.aic),
        bic: models.map((m) => m.modelFit.bic),
        rSquared: models.map((m) => m.modelFit.rSquared),
        adjustedRSquared: models.map((m) => m.modelFit.adjustedRSquared),
      };

      // 중첩모델에 대한 우도비 검정
      const likelihoodRatioTests = this.performLikelihoodRatioTests(models);

      return {
        success: true,
        data: {
          models,
          bestModel,
          comparisonCriteria,
          likelihoodRatioTests,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Invalid state"
        ),
      };
    }
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private validateData(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Result<void> {
    if (!data || data.length === 0) {
      return {
        success: false,
        error: new Error("분석할 데이터가 없습니다."),
      };
    }

    if (!config.dependentVariable) {
      return {
        success: false,
        error: new Error("종속변수가 지정되지 않았습니다."),
      };
    }

    if (
      !config.independentVariables ||
      config.independentVariables.length === 0
    ) {
      return {
        success: false,
        error: new Error("독립변수가 지정되지 않았습니다."),
      };
    }

    // 변수 존재 확인
    const allVariables = [
      config.dependentVariable,
      ...config.independentVariables,
    ];
    const firstRow = data[0];

    for (const variable of allVariables) {
      if (!(variable in firstRow)) {
        return {
          success: false,
          error: new Error(`변수 '${variable}'이 데이터에 존재하지 않습니다.`),
        };
      }
    }

    return { success: true, data: undefined };
  }

  private prepareMatrices(
    data: Record<string, number>[],
    config: RegressionConfig
  ): { X: number[][]; y: number[] } {
    const y = data.map((row) => row[config.dependentVariable]);

    const X = data.map((row) => {
      const xRow: number[] = [];

      if (config.interceptIncluded) {
        xRow.push(1); // 절편
      }

      for (const variable of config.independentVariables) {
        xRow.push(row[variable]);
      }

      return xRow;
    });

    return { X, y };
  }

  // 행렬 연산 메서드들
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < B.length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
  }

  private matrixInverse(matrix: number[][]): number[][] {
    // 가우스-조던 소거법을 사용한 역행렬 계산
    const n = matrix.length;
    const augmented: number[][] = [];

    // 확장행렬 생성 [A|I]
    for (let i = 0; i < n; i++) {
      augmented[i] = [...matrix[i], ...Array(n).fill(0)];
      augmented[i][n + i] = 1;
    }

    // 전진 소거
    for (let i = 0; i < n; i++) {
      // 피벗팅
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // 정규화
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error("행렬이 특이행렬입니다.");
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      // 소거
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // 역행렬 추출
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }

    return inverse;
  }

  private scalarMultiply(matrix: number[][], scalar: number): number[][] {
    return matrix.map((row) => row.map((val) => val * scalar));
  }

  private getDiagonalElements(matrix: number[][]): number[] {
    return matrix.map((row, i) => row[i]);
  }

  private buildCoefficientResults(
    config: RegressionConfig,
    coefficients: number[],
    standardErrors: number[],
    confidenceLevel: number
  ): RegressionCoefficient[] {
    const results: RegressionCoefficient[] = [];
    const tCritical = this.getTCriticalValue(confidenceLevel);

    let index = 0;

    if (config.interceptIncluded) {
      const se = standardErrors[index];
      const t = coefficients[index] / se;
      const p = this.calculatePValue(t);

      results.push({
        variable: "(Intercept)",
        coefficient: coefficients[index],
        standardError: se,
        tStatistic: t,
        pValue: p,
        confidenceInterval: [
          coefficients[index] - tCritical * se,
          coefficients[index] + tCritical * se,
        ],
        significance: this.getSignificanceLevel(p),
      });
      index++;
    }

    for (const variable of config.independentVariables) {
      const se = standardErrors[index];
      const t = coefficients[index] / se;
      const p = this.calculatePValue(t);

      results.push({
        variable,
        coefficient: coefficients[index],
        standardError: se,
        tStatistic: t,
        pValue: p,
        confidenceInterval: [
          coefficients[index] - tCritical * se,
          coefficients[index] + tCritical * se,
        ],
        significance: this.getSignificanceLevel(p),
      });
      index++;
    }

    return results;
  }

  private calculateModelFit(
    actual: number[],
    predicted: number[],
    residuals: number[],
    parameterCount: number
  ): ModelFitStatistics {
    const n = actual.length;
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / n;

    const tss = actual.reduce(
      (sum, val) => sum + Math.pow(val - actualMean, 2),
      0
    );
    const rss = residuals.reduce((sum, res) => sum + res * res, 0);
    const ess = tss - rss;

    const rSquared = ess / tss;
    const adjustedRSquared = 1 - rss / (n - parameterCount) / (tss / (n - 1));

    const mse = rss / (n - parameterCount);
    const residualStandardError = Math.sqrt(mse);

    const fStatistic =
      ess / (parameterCount - 1) / (rss / (n - parameterCount));
    const fPValue = this.calculateFPValue(
      fStatistic,
      parameterCount - 1,
      n - parameterCount
    );

    const logLikelihood = this.calculateLogLikelihood(residuals, mse);
    const aic = 2 * parameterCount - 2 * logLikelihood;
    const bic = Math.log(n) * parameterCount - 2 * logLikelihood;

    return {
      rSquared,
      adjustedRSquared,
      fStatistic,
      fPValue,
      logLikelihood,
      aic,
      bic,
      residualStandardError,
      observationsCount: n,
      degreesOfFreedom: n - parameterCount,
    };
  }

  private async runDiagnostics(
    X: number[][],
    y: number[],
    residuals: number[],
    predictions: number[]
  ): Promise<RegressionDiagnostics> {
    return {
      normalityTest: this.performNormalityTests(residuals),
      heteroskedasticityTest: this.performHeteroskedasticityTests(X, residuals),
      autocorrelationTest: this.performAutocorrelationTests(residuals),
      multicollinearityTest: this.performMulticollinearityTests(X),
      outlierDetection: this.detectOutliers(X, y, residuals, predictions),
      influentialObservations: this.detectInfluentialObservations(
        X,
        y,
        residuals
      ),
      specificationTest: this.performSpecificationTests(X, y, residuals),
      stabilityTest: this.performStabilityTests(X, y, residuals),
    };
  }

  // 추가 helper 메서드들은 실제 구현에서 필요에 따라 구현
  private getTCriticalValue(confidenceLevel: number): number {
    // t-분포 임계값 계산 (간단한 근사)
    if (confidenceLevel === 0.95) return 1.96;
    if (confidenceLevel === 0.99) return 2.58;
    return 1.96; // 기본값
  }

  private calculatePValue(tStatistic: number): number {
    // t-통계량에서 p-값 계산 (간단한 근사)
    return 2 * (1 - this.cumulativeDistributionFunction(Math.abs(tStatistic)));
  }

  private cumulativeDistributionFunction(x: number): number {
    // 표준정규분포 CDF 근사
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
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

  private getSignificanceLevel(pValue: number): SignificanceLevel {
    if (pValue < 0.01) return SignificanceLevel.HIGHLY_SIGNIFICANT;
    if (pValue < 0.05) return SignificanceLevel.SIGNIFICANT;
    if (pValue < 0.1) return SignificanceLevel.MARGINALLY_SIGNIFICANT;
    return SignificanceLevel.NOT_SIGNIFICANT;
  }

  private calculateLogLikelihood(residuals: number[], mse: number): number {
    const n = residuals.length;
    return (
      (-n / 2) * Math.log(2 * Math.PI) -
      (n / 2) * Math.log(mse) -
      residuals.reduce((sum, r) => sum + r * r, 0) / (2 * mse)
    );
  }

  private calculateFPValue(fStat: number, df1: number, df2: number): number {
    // F-분포 p-값 계산 (간단한 근사)
    return 0.05; // 실제 구현에서는 정확한 계산 필요
  }

  // 추가 진단 메서드들 (실제 구현에서 완성)
  private performNormalityTests(residuals: number[]): NormalityTestResult {
    return {
      jarqueBeraStatistic: 0,
      jarqueBeraPValue: 0,
      shapiroWilkStatistic: 0,
      shapiroWilkPValue: 0,
      kolmogorovSmirnovStatistic: 0,
      kolmogorovSmirnovPValue: 0,
    };
  }

  private performHeteroskedasticityTests(
    X: number[][],
    residuals: number[]
  ): HeteroskedasticityTestResult {
    return {
      breuschPaganStatistic: 0,
      breuschPaganPValue: 0,
      whiteStatistic: 0,
      whitePValue: 0,
      goldFieldQuandtStatistic: 0,
      goldFieldQuandtPValue: 0,
    };
  }

  private performAutocorrelationTests(
    residuals: number[]
  ): AutocorrelationTestResult {
    return {
      durbinWatsonStatistic: 0,
      ljungBoxStatistic: 0,
      ljungBoxPValue: 0,
      breuschGodfreyStatistic: 0,
      breuschGodfreyPValue: 0,
    };
  }

  private performMulticollinearityTests(
    X: number[][]
  ): MulticollinearityTestResult {
    return {
      varianceInflationFactors: [],
      conditionNumber: 0,
      eigenvalues: [],
    };
  }

  private detectOutliers(
    X: number[][],
    y: number[],
    residuals: number[],
    predictions: number[]
  ): OutlierDetectionResult {
    return {
      cookDistance: [],
      leverage: [],
      studentizedResiduals: [],
      dffits: [],
      dfbetas: [],
    };
  }

  private detectInfluentialObservations(
    X: number[][],
    y: number[],
    residuals: number[]
  ): InfluentialObservationResult[] {
    return [];
  }

  private performSpecificationTests(
    X: number[][],
    y: number[],
    residuals: number[]
  ): SpecificationTestResult {
    return {
      ramseyResetStatistic: 0,
      ramseyResetPValue: 0,
      linkTestStatistic: 0,
      linkTestPValue: 0,
      ovTestStatistic: 0,
      ovTestPValue: 0,
    };
  }

  private performStabilityTests(
    X: number[][],
    y: number[],
    residuals: number[]
  ): StabilityTestResult {
    return {
      chowTestStatistic: 0,
      chowTestPValue: 0,
      cusumStatistic: [],
      cusumSquaredStatistic: [],
      brownDurbinEvansStatistic: 0,
    };
  }

  // 추가 메서드들 (간단한 스텁 구현)
  private async runGLS(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    // GLS 구현 스텁
    return this.runOLS(data, config);
  }

  private async runProbit(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<RegressionResult>> {
    // Probit 구현 스텁
    return this.runLogit(data, config);
  }

  private async runFirstStageRegressions(
    data: Record<string, number>[],
    config: RegressionConfig
  ): Promise<Result<any>> {
    return { success: true, data: {} };
  }

  private async maximumLikelihoodEstimation(
    X: number[][],
    y: number[],
    method: string
  ): Promise<number[]> {
    // MLE 구현 스텁
    return new Array(X[0].length).fill(0);
  }

  private calculateInformationMatrix(
    X: number[][],
    predictions: number[]
  ): number[][] {
    // 정보행렬 계산 스텁
    return X[0].map(() => X[0].map(() => 0));
  }

  private calculateLogitModelFit(
    y: number[],
    predictions: number[],
    parameterCount: number
  ): ModelFitStatistics {
    // Logit 모델 적합도 계산 스텁
    return {
      rSquared: 0,
      adjustedRSquared: 0,
      fStatistic: 0,
      fPValue: 0,
      logLikelihood: 0,
      aic: 0,
      bic: 0,
      residualStandardError: 0,
      observationsCount: y.length,
      degreesOfFreedom: y.length - parameterCount,
    };
  }

  private async runLogitDiagnostics(
    X: number[][],
    y: number[],
    predictions: number[]
  ): Promise<RegressionDiagnostics> {
    // Logit 진단 스텁
    const residuals = y.map((actual, i) => actual - predictions[i]);
    return this.runDiagnostics(X, y, residuals, predictions);
  }

  private prepareVARData(
    data: Record<string, number>[],
    variables: string[],
    lagOrder: number
  ): Record<string, number>[] {
    // VAR 데이터 준비 스텁
    return data;
  }

  private combineVARResults(
    equations: RegressionResult[],
    config: RegressionConfig
  ): RegressionResult {
    // VAR 결과 통합 스텁
    return equations[0];
  }

  private calculatePrediction(
    model: RegressionResult,
    dataPoint: Record<string, number>
  ): number {
    // 예측값 계산 스텁
    return 0;
  }

  private calculatePredictionStandardError(
    model: RegressionResult,
    dataPoint: Record<string, number>
  ): number {
    // 예측 표준오차 계산 스텁
    return 0;
  }

  private calculateConfidenceInterval(
    prediction: number,
    standardError: number,
    confidenceLevel: number
  ): [number, number] {
    const margin = this.getTCriticalValue(confidenceLevel) * standardError;
    return [prediction - margin, prediction + margin];
  }

  private calculatePredictionInterval(
    prediction: number,
    standardError: number,
    residualSE: number,
    confidenceLevel: number
  ): [number, number] {
    const margin =
      this.getTCriticalValue(confidenceLevel) *
      Math.sqrt(standardError * standardError + residualSE * residualSE);
    return [prediction - margin, prediction + margin];
  }

  private performLikelihoodRatioTests(
    models: RegressionResult[]
  ): LikelihoodRatioTest[] {
    // 우도비 검정 스텁
    return [];
  }
}
