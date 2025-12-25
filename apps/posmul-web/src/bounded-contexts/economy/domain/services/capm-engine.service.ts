/**
 * CAPM (Capital Asset Pricing Model) Engine - Domain Service
 * Harry Markowitz (1952) 포트폴리오 이론과 William Sharpe (1964) CAPM 실제 구현
 *
 * 핵심 공식:
 * - CAPM: E[R] = Rf + β(Rm - Rf)
 * - Sharpe Ratio: (Rp - Rf) / σp
 * - Portfolio Beta: Σ(wi × βi)
 * - Portfolio Return: Σ(wi × Ri)
 * - Portfolio Variance: Σ(wi² × σi²) + ΣΣ(wi × wj × σij)
 */
import { Result } from "@posmul/auth-economy-sdk";

import {
  BetaCoefficient,
  ExpectedReturn,
  MarketRiskPremium,
  PmcAmount,
  PmpAmount,
  RiskFreeRate,
  RiskTolerance,
  calculateCAPMReturn,
  createBetaCoefficient,
  createExpectedReturn,
  createPmcAmount,
  createPmpAmount,
  unwrapBetaCoefficient,
  unwrapExpectedReturn,
} from "../value-objects";
import {
  IAsset,
  ICAPMEngine,
  ICAPmpAmountricingResult,
  IMarketConditionAnalysis,
  IOptimizationResult,
  IPortfolio,
  IRebalancingRecommendation,
  IRiskReturnAnalysis,
} from "./interfaces/capm-engine.interface";

/**
 * CAPM Engine 설정
 */
export interface CAPMEngineConfig {
  readonly defaultRiskFreeRate: number;
  readonly defaultMarketRiskPremium: number;
  readonly volatilityWindow: number; // 변동성 계산 기간 (일)
  readonly betaEstimationWindow: number; // 베타 추정 기간 (일)
  readonly rebalancingThreshold: number; // 리밸런싱 임계값 (%)
  readonly transactionCostRate: number; // 거래비용 (%)
  readonly confidenceLevel: number; // VaR 신뢰구간 (0.95)
}

/**
 * CAPM Engine - Domain Service
 * Nobel Prize Winner들의 현대 포트폴리오 이론을 실제 코드로 구현
 */
export class CAPMEngine implements ICAPMEngine {
  private readonly config: CAPMEngineConfig;

  constructor(config: CAPMEngineConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * CAPM을 사용한 자산 공정가치 계산
   * E[R] = Rf + β(Rm - Rf)
   */
  public async calculateFairValue(
    assetBeta: BetaCoefficient,
    riskFreeRate: RiskFreeRate,
    marketRiskPremium: MarketRiskPremium,
    currentPrice: number
  ): Promise<Result<ICAPmpAmountricingResult>> {
    try {
      // CAPM 공식으로 요구수익률 계산
      const requiredReturn = calculateCAPMReturn(
        riskFreeRate,
        assetBeta,
        marketRiskPremium
      );

      // 공정가치 계산 (DCF 단순화 버전)
      const fairValue =
        currentPrice * (1 + unwrapExpectedReturn(requiredReturn));

      // Jensen's Alpha 계산 (초과 수익률)
      const actualReturn = 0; // 실제 구현에서는 과거 수익률 데이터 사용
      const alpha = actualReturn - unwrapExpectedReturn(requiredReturn);

      // 투자 권장사항 결정
      const recommendation = this.determineInvestmentRecommendation(
        currentPrice,
        fairValue,
        alpha
      );

      // 신뢰도 계산 (베타의 안정성과 시장 효율성 기반)
      const confidenceLevel = this.calculateConfidenceLevel(assetBeta);

      const result: ICAPmpAmountricingResult = {
        assetId: `asset-${Date.now()}`,
        fairValue,
        currentPrice,
        expectedReturn: requiredReturn,
        requiredReturn,
        alpha,
        recommendation,
        confidenceLevel,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 포트폴리오 리스크-수익 분석
   * Markowitz 평균-분산 포트폴리오 이론 적용
   */
  public async analyzeRiskReturn(
    portfolio: IPortfolio,
    marketConditions: IMarketConditionAnalysis
  ): Promise<Result<IRiskReturnAnalysis>> {
    try {
      // 포트폴리오 기대수익률 계산
      const expectedReturn = this.calculatePortfolioReturn(portfolio);

      // 포트폴리오 베타 계산
      const portfolioBeta = this.calculatePortfolioBeta(portfolio);

      // 포트폴리오 변동성 계산
      const volatility = this.calculatePortfolioVolatility(
        portfolio,
        marketConditions
      );

      // Sharpe Ratio 계산
      const riskFreeRate = this.config.defaultRiskFreeRate;
      const sharpeRatio =
        (unwrapExpectedReturn(expectedReturn) - riskFreeRate) / volatility;

      // VaR 계산 (95% 신뢰구간)
      const valueAtRisk = this.calculateVaR(
        expectedReturn,
        volatility,
        this.config.confidenceLevel
      );

      // 최대 손실폭 추정
      const maxDrawdown = this.estimateMaxDrawdown(portfolio, marketConditions);

      // Information Ratio 계산
      const informationRatio = this.calculateInformationRatio(
        expectedReturn,
        marketConditions.marketRiskPremium,
        volatility
      );

      const analysis: IRiskReturnAnalysis = {
        expectedReturn,
        portfolioBeta,
        sharpeRatio,
        volatility,
        valueAtRisk,
        maxDrawdown,
        informationRatio,
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 포트폴리오 최적화 (평균-분산 최적화)
   * Markowitz Efficient Frontier 기반
   */
  public async optimizePortfolio(
    currentPortfolio: IPortfolio,
    riskTolerance: RiskTolerance,
    targetReturn?: ExpectedReturn
  ): Promise<Result<IOptimizationResult>> {
    try {
      // 현재 포트폴리오 분석
      const currentAnalysis = await this.analyzeRiskReturn(
        currentPortfolio,
        await this.getDefaultMarketConditions()
      );
      if (!currentAnalysis.success) {
        return {
          success: false,
          error: new Error("Current portfolio analysis failed"),
        };
      }

      // 최적화된 가중치 계산
      const optimizedWeights = this.calculateOptimalWeights(
        currentPortfolio,
        riskTolerance as number,
        targetReturn
      );

      // 최적화된 포트폴리오 구성
      const optimizedPortfolio = this.constructOptimizedPortfolio(
        currentPortfolio,
        optimizedWeights
      );

      // 최적화된 포트폴리오 분석
      const optimizedAnalysis = await this.analyzeRiskReturn(
        optimizedPortfolio,
        await this.getDefaultMarketConditions()
      );
      if (!optimizedAnalysis.success) {
        return {
          success: false,
          error: new Error("Optimized portfolio analysis failed"),
        };
      }

      // 개선 지표 계산
      const improvementMetrics = {
        returnImprovement:
          unwrapExpectedReturn(optimizedAnalysis.data.expectedReturn) -
          unwrapExpectedReturn(currentAnalysis.data.expectedReturn),
        riskReduction:
          currentAnalysis.data.volatility - optimizedAnalysis.data.volatility,
        sharpeRatioImprovement:
          optimizedAnalysis.data.sharpeRatio - currentAnalysis.data.sharpeRatio,
      };

      // 리밸런싱 권장사항 생성
      const rebalancingRecommendations =
        await this.generateRebalancingRecommendations(
          currentPortfolio,
          optimizedPortfolio
        );
      if (!rebalancingRecommendations.success) {
        return {
          success: false,
          error: new Error("Rebalancing recommendations generation failed"),
        };
      }

      const result: IOptimizationResult = {
        originalPortfolio: currentPortfolio,
        optimizedPortfolio,
        improvementMetrics,
        rebalancingRecommendations: rebalancingRecommendations.data,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * PmpAmount-PmcAmount 최적 배분 계산
   * 위험 허용도와 시장 상황을 고려한 자산 배분
   */
  public async calculateOptimalAllocation(
    totalAmount: number,
    riskTolerance: RiskTolerance,
    marketConditions: IMarketConditionAnalysis
  ): Promise<Result<{ pmpAllocation: PmpAmount; pmcAllocation: PmcAmount }>> {
    try {
      // 위험 허용도에 따른 기본 배분 비율
      const riskLevel = riskTolerance as number;

      // 보수적: PmpAmount 70%, PmcAmount 30%
      // 중간: PmpAmount 50%, PmcAmount 50%
      // 공격적: PmpAmount 30%, PmcAmount 70%
      let pmpWeight: number;
      let pmcWeight: number;

      if (riskLevel < 0.4) {
        // 보수적 투자자
        pmpWeight = 0.7;
        pmcWeight = 0.3;
      } else if (riskLevel < 0.7) {
        // 중간 위험 투자자
        pmpWeight = 0.5;
        pmcWeight = 0.5;
      } else {
        // 공격적 투자자
        pmpWeight = 0.3;
        pmcWeight = 0.7;
      }

      // 시장 상황에 따른 조정
      const marketAdjustment = this.adjustForMarketConditions(
        pmpWeight,
        pmcWeight,
        marketConditions
      );

      pmpWeight = marketAdjustment.pmpWeight;
      pmcWeight = marketAdjustment.pmcWeight;

      // 실제 배분 금액 계산
      const pmpAmount = totalAmount * pmpWeight;
      const pmcAmount = totalAmount * pmcWeight;

      const result = {
        pmpAllocation: createPmpAmount(Math.floor(pmpAmount)),
        pmcAllocation: createPmcAmount(pmcAmount),
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 시장 상황 분석
   */
  public async analyzeMarketConditions(
    historicalData: Array<{
      date: Date;
      pmpPrice: number;
      pmcPrice: number;
      marketIndex: number;
      volatility: number;
    }>,
    timeWindow: number = 30
  ): Promise<Result<IMarketConditionAnalysis>> {
    try {
      const recentData = historicalData.slice(-timeWindow);

      if (recentData.length < 5) {
        return {
          success: false,
          error: new Error("Insufficient data for market analysis"),
        };
      }

      // 시장 체제 분석 (Bull/Bear/Sideways)
      const marketRegime = this.determineMarketRegime(recentData);

      // 변동성 체제 분석
      const volatilityRegime = this.determineVolatilityRegime(recentData);

      // 상관관계 분석
      const correlationLevel = this.calculateCorrelation(
        recentData.map((d) => d.pmpPrice),
        recentData.map((d) => d.pmcPrice)
      );

      // 시장 위험 프리미엄 추정
      const marketRiskPremium = this.estimateMarketRiskPremium(recentData);

      // 추천 전략 결정
      const recommendedStrategy = this.determineStrategy(
        marketRegime,
        volatilityRegime,
        correlationLevel
      );

      const analysis: IMarketConditionAnalysis = {
        marketRegime,
        volatilityRegime,
        correlationLevel,
        marketRiskPremium,
        recommendedStrategy,
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 베타 계수 추정
   * 회귀분석을 통한 시장 베타 계산
   */
  public async estimateBeta(
    assetReturns: number[],
    marketReturns: number[],
    timeWindow: number = this.config.betaEstimationWindow
  ): Promise<Result<BetaCoefficient>> {
    try {
      if (assetReturns.length !== marketReturns.length) {
        return {
          success: false,
          error: new Error(
            "Asset returns and market returns must have same length"
          ),
        };
      }

      if (assetReturns.length < 10) {
        return {
          success: false,
          error: new Error(
            "Insufficient data for beta estimation (minimum 10 observations)"
          ),
        };
      }

      // 최근 데이터만 사용
      const recentAssetReturns = assetReturns.slice(-timeWindow);
      const recentMarketReturns = marketReturns.slice(-timeWindow);

      // 선형 회귀를 통한 베타 계산
      const beta = this.calculateLinearRegressionBeta(
        recentAssetReturns,
        recentMarketReturns
      );

      return { success: true, data: createBetaCoefficient(beta) };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 리밸런싱 권장사항 생성
   */
  public async generateRebalancingRecommendations(
    currentPortfolio: IPortfolio,
    targetPortfolio: IPortfolio,
    transactionCosts: number = this.config.transactionCostRate
  ): Promise<Result<IRebalancingRecommendation[]>> {
    try {
      const recommendations: IRebalancingRecommendation[] = [];

      for (const currentAsset of currentPortfolio.assets) {
        const targetAsset = targetPortfolio.assets.find(
          (a) => a.assetId === currentAsset.assetId
        );

        if (!targetAsset) continue;

        const weightDifference = targetAsset.weight - currentAsset.weight;
        const absoluteDifference = Math.abs(weightDifference);

        // 리밸런싱 임계값 체크
        if (absoluteDifference < this.config.rebalancingThreshold) {
          recommendations.push({
            assetId: currentAsset.assetId,
            currentWeight: currentAsset.weight,
            targetWeight: targetAsset.weight,
            action: "HOLD",
            amount: 0,
            rationale: `Weight difference (${(absoluteDifference * 100).toFixed(
              1
            )}%) below threshold`,
          });
          continue;
        }

        // 거래비용 고려
        const tradingCost =
          absoluteDifference * currentPortfolio.totalValue * transactionCosts;
        const expectedBenefit = this.calculateRebalancingBenefit(
          currentAsset,
          targetAsset,
          currentPortfolio.totalValue
        );

        if (expectedBenefit <= tradingCost) {
          recommendations.push({
            assetId: currentAsset.assetId,
            currentWeight: currentAsset.weight,
            targetWeight: targetAsset.weight,
            action: "HOLD",
            amount: 0,
            rationale: `Trading cost exceeds expected benefit`,
          });
          continue;
        }

        // 매수/매도 결정
        const action = weightDifference > 0 ? "BUY" : "SELL";
        const amount = absoluteDifference * currentPortfolio.totalValue;

        recommendations.push({
          assetId: currentAsset.assetId,
          currentWeight: currentAsset.weight,
          targetWeight: targetAsset.weight,
          action,
          amount,
          rationale: `Optimize portfolio allocation (expected benefit: ${expectedBenefit.toFixed(
            2
          )})`,
        });
      }

      return { success: true, data: recommendations };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  // ===== Private Helper Methods =====

  /**
   * 설정 유효성 검증
   */
  private validateConfig(): void {
    const {
      defaultRiskFreeRate,
      defaultMarketRiskPremium,
      volatilityWindow,
      betaEstimationWindow,
      rebalancingThreshold,
      transactionCostRate,
      confidenceLevel,
    } = this.config;

    if (defaultRiskFreeRate < 0 || defaultRiskFreeRate > 0.2) {
      throw new Error("Invalid risk-free rate");
    }

    if (defaultMarketRiskPremium < 0 || defaultMarketRiskPremium > 0.5) {
      throw new Error("Invalid market risk premium");
    }

    if (volatilityWindow < 5 || volatilityWindow > 252) {
      throw new Error("Invalid volatility window");
    }

    if (betaEstimationWindow < 10 || betaEstimationWindow > 1000) {
      throw new Error("Invalid beta estimation window");
    }

    if (rebalancingThreshold < 0.001 || rebalancingThreshold > 0.5) {
      throw new Error("Invalid rebalancing threshold");
    }

    if (transactionCostRate < 0 || transactionCostRate > 0.1) {
      throw new Error("Invalid transaction cost rate");
    }

    if (confidenceLevel < 0.5 || confidenceLevel > 0.99) {
      throw new Error("Invalid confidence level");
    }
  }

  /**
   * 투자 권장사항 결정
   */
  private determineInvestmentRecommendation(
    currentPrice: number,
    fairValue: number,
    alpha: number
  ): "BUY" | "SELL" | "HOLD" {
    const priceRatio = fairValue / currentPrice;

    if (priceRatio > 1.1 && alpha > 0.02) {
      return "BUY";
    } else if (priceRatio < 0.9 && alpha < -0.02) {
      return "SELL";
    } else {
      return "HOLD";
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidenceLevel(beta: BetaCoefficient): number {
    // 베타가 시장 평균(1.0)에 가까울수록 높은 신뢰도
    const betaValue = unwrapBetaCoefficient(beta);
    const deviation = Math.abs(betaValue - 1.0);
    return Math.max(0.5, 1 - deviation);
  }

  /**
   * 포트폴리오 기대수익률 계산
   */
  private calculatePortfolioReturn(portfolio: IPortfolio): ExpectedReturn {
    const weightedReturn = portfolio.assets.reduce((sum, asset) => {
      return sum + asset.weight * unwrapExpectedReturn(asset.expectedReturn);
    }, 0);

    return createExpectedReturn(weightedReturn);
  }

  /**
   * 포트폴리오 베타 계산
   */
  private calculatePortfolioBeta(portfolio: IPortfolio): BetaCoefficient {
    const weightedBeta = portfolio.assets.reduce((sum, asset) => {
      return sum + asset.weight * unwrapBetaCoefficient(asset.beta);
    }, 0);

    return createBetaCoefficient(weightedBeta);
  }

  /**
   * 포트폴리오 변동성 계산
   */
  private calculatePortfolioVolatility(
    portfolio: IPortfolio,
    marketConditions: IMarketConditionAnalysis
  ): number {
    // 단순화된 변동성 계산 (실제로는 공분산 행렬 필요)
    const averageVolatility = portfolio.assets.reduce((sum, asset) => {
      const assetVolatility = unwrapBetaCoefficient(asset.beta) * 0.15; // 가정된 시장 변동성
      return sum + asset.weight * assetVolatility;
    }, 0);

    // 시장 상황에 따른 조정
    const volatilityMultiplier =
      marketConditions.volatilityRegime === "High"
        ? 1.5
        : marketConditions.volatilityRegime === "Medium"
          ? 1.0
          : 0.7;

    return averageVolatility * volatilityMultiplier;
  }

  /**
   * VaR 계산 (정규분포 가정)
   */
  private calculateVaR(
    expectedReturn: ExpectedReturn,
    volatility: number,
    confidenceLevel: number
  ): number {
    // Z-score for given confidence level
    const zScore =
      confidenceLevel === 0.95
        ? 1.645
        : confidenceLevel === 0.99
          ? 2.326
          : 1.645;

    return unwrapExpectedReturn(expectedReturn) - zScore * volatility;
  }

  /**
   * 최대 손실폭 추정
   */
  private estimateMaxDrawdown(
    portfolio: IPortfolio,
    marketConditions: IMarketConditionAnalysis
  ): number {
    const portfolioBeta = this.calculatePortfolioBeta(portfolio);
    const baseMDD = 0.2; // 기본 20% 가정

    return (
      baseMDD *
      unwrapBetaCoefficient(portfolioBeta) *
      (marketConditions.volatilityRegime === "High" ? 1.5 : 1.0)
    );
  }

  /**
   * Information Ratio 계산
   */
  private calculateInformationRatio(
    portfolioReturn: ExpectedReturn,
    benchmarkReturn: MarketRiskPremium,
    trackingError: number
  ): number {
    const activeReturn =
      unwrapExpectedReturn(portfolioReturn) - (benchmarkReturn as number);
    return trackingError > 0 ? activeReturn / trackingError : 0;
  }

  /**
   * 기본 시장 상황 생성
   */
  private async getDefaultMarketConditions(): Promise<IMarketConditionAnalysis> {
    return {
      marketRegime: "Sideways",
      volatilityRegime: "Medium",
      correlationLevel: 0.5,
      marketRiskPremium: this.config
        .defaultMarketRiskPremium as MarketRiskPremium,
      recommendedStrategy: "Neutral",
    };
  }

  /**
   * 최적 가중치 계산 (단순화된 평균-분산 최적화)
   */
  private calculateOptimalWeights(
    portfolio: IPortfolio,
    riskTolerance: number,
    targetReturn?: ExpectedReturn
  ): number[] {
    void targetReturn;
    // 실제로는 복잡한 2차 계획법이 필요하지만, 여기서는 단순화
    const numAssets = portfolio.assets.length;
    const equalWeight = 1 / numAssets;

    // 위험 허용도에 따른 조정
    return portfolio.assets.map((asset) => {
      const beta = unwrapBetaCoefficient(asset.beta);
      if (riskTolerance > 0.7) {
        // 공격적 투자자: 높은 베타 선호
        return equalWeight * (1 + (beta - 1) * 0.5);
      } else if (riskTolerance < 0.3) {
        // 보수적 투자자: 낮은 베타 선호
        return equalWeight * (1 - (beta - 1) * 0.5);
      } else {
        // 중간 투자자: 균등 배분
        return equalWeight;
      }
    });
  }

  /**
   * 최적화된 포트폴리오 구성
   */
  private constructOptimizedPortfolio(
    originalPortfolio: IPortfolio,
    optimizedWeights: number[]
  ): IPortfolio {
    const optimizedAssets = originalPortfolio.assets.map((asset, index) => ({
      ...asset,
      weight: optimizedWeights[index],
      amount: originalPortfolio.totalValue * optimizedWeights[index],
    }));

    const portfolioReturn = this.calculatePortfolioReturn({
      ...originalPortfolio,
      assets: optimizedAssets,
    });
    const portfolioBeta = this.calculatePortfolioBeta({
      ...originalPortfolio,
      assets: optimizedAssets,
    });

    return {
      ...originalPortfolio,
      portfolioId: `optimized-${Date.now()}`,
      assets: optimizedAssets,
      expectedReturn: portfolioReturn,
      portfolioBeta,
      sharpeRatio:
        (unwrapExpectedReturn(portfolioReturn) -
          this.config.defaultRiskFreeRate) /
        0.15,
    };
  }

  /**
   * 시장 상황에 따른 자산 배분 조정
   */
  private adjustForMarketConditions(
    pmpWeight: number,
    pmcWeight: number,
    marketConditions: IMarketConditionAnalysis
  ): { pmpWeight: number; pmcWeight: number } {
    let adjustment = 0;

    // 시장 체제에 따른 조정
    if (marketConditions.marketRegime === "Bear") {
      adjustment += 0.1; // PmpAmount 비중 증가
    } else if (marketConditions.marketRegime === "Bull") {
      adjustment -= 0.1; // PmcAmount 비중 증가
    }

    // 변동성에 따른 조정
    if (marketConditions.volatilityRegime === "High") {
      adjustment += 0.05; // 안전자산 선호
    } else if (marketConditions.volatilityRegime === "Low") {
      adjustment -= 0.05; // 위험자산 선호
    }

    const adjustedPmpWeight = Math.max(
      0.1,
      Math.min(0.9, pmpWeight + adjustment)
    );
    const adjustedPmcWeight = 1 - adjustedPmpWeight;

    return {
      pmpWeight: adjustedPmpWeight,
      pmcWeight: adjustedPmcWeight,
    };
  }

  /**
   * 시장 체제 결정
   */
  private determineMarketRegime(
    data: Array<{ marketIndex: number; date: Date }>
  ): "Bull" | "Bear" | "Sideways" {
    if (data.length < 2) return "Sideways";

    const startPrice = data[0].marketIndex;
    const endPrice = data[data.length - 1].marketIndex;
    const change = (endPrice - startPrice) / startPrice;

    if (change > 0.1) return "Bull";
    if (change < -0.1) return "Bear";
    return "Sideways";
  }

  /**
   * 변동성 체제 결정
   */
  private determineVolatilityRegime(
    data: Array<{ volatility: number }>
  ): "Low" | "Medium" | "High" {
    const avgVolatility =
      data.reduce((sum, d) => sum + d.volatility, 0) / data.length;

    if (avgVolatility > 0.25) return "High";
    if (avgVolatility > 0.15) return "Medium";
    return "Low";
  }

  /**
   * 상관계수 계산
   */
  private calculateCorrelation(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length < 2) return 0;

    const n = series1.length;
    const sum1 = series1.reduce((a, b) => a + b, 0);
    const sum2 = series2.reduce((a, b) => a + b, 0);
    const sum1Sq = series1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = series2.reduce((a, b) => a + b * b, 0);
    const sumProducts = series1.reduce((sum, x, i) => sum + x * series2[i], 0);

    const numerator = n * sumProducts - sum1 * sum2;
    const denominator = Math.sqrt(
      (n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 시장 위험 프리미엄 추정
   */
  private estimateMarketRiskPremium(
    data: Array<{ marketIndex: number; date: Date }>
  ): MarketRiskPremium {
    // 단순화된 추정 (실제로는 복잡한 시계열 분석 필요)
    if (data.length < 2) {
      return this.config.defaultMarketRiskPremium as MarketRiskPremium;
    }

    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const ret =
        (data[i].marketIndex - data[i - 1].marketIndex) /
        data[i - 1].marketIndex;
      returns.push(ret);
    }

    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const annualizedReturn = avgReturn * 252; // 일일 수익률을 연간으로 변환

    // 위험 프리미엄 = 시장 수익률 - 무위험 수익률
    const marketRiskPremium = Math.max(
      0,
      annualizedReturn - this.config.defaultRiskFreeRate
    );

    return Math.min(0.2, marketRiskPremium) as MarketRiskPremium;
  }

  /**
   * 전략 결정
   */
  private determineStrategy(
    marketRegime: "Bull" | "Bear" | "Sideways",
    volatilityRegime: "Low" | "Medium" | "High",
    correlationLevel: number
  ): "Risk-On" | "Risk-Off" | "Neutral" {
    void correlationLevel;
    if (marketRegime === "Bull" && volatilityRegime === "Low") {
      return "Risk-On";
    } else if (marketRegime === "Bear" || volatilityRegime === "High") {
      return "Risk-Off";
    } else {
      return "Neutral";
    }
  }

  /**
   * 선형 회귀를 통한 베타 계산
   */
  private calculateLinearRegressionBeta(
    assetReturns: number[],
    marketReturns: number[]
  ): number {
    const n = assetReturns.length;
    const sumX = marketReturns.reduce((a, b) => a + b, 0);
    const sumY = assetReturns.reduce((a, b) => a + b, 0);
    const sumXY = assetReturns.reduce(
      (sum, y, i) => sum + y * marketReturns[i],
      0
    );
    const sumXX = marketReturns.reduce((sum, x) => sum + x * x, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumXX - sumX * sumX;

    return denominator === 0 ? 1.0 : numerator / denominator;
  }

  /**
   * 리밸런싱 편익 계산
   */
  private calculateRebalancingBenefit(
    currentAsset: IAsset,
    targetAsset: IAsset,
    portfolioValue: number
  ): number {
    const weightChange = targetAsset.weight - currentAsset.weight;
    const expectedReturnDiff =
      unwrapExpectedReturn(targetAsset.expectedReturn) -
      unwrapExpectedReturn(currentAsset.expectedReturn);

    return Math.abs(weightChange) * portfolioValue * expectedReturnDiff;
  }
}
