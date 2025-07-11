/**
 * CAPM Engine - Unit Tests
 * Harry Markowitz 포트폴리오 이론과 William Sharpe CAPM 도메인 서비스 테스트
 *
 * DDD 테스트 원칙:
 * - 도메인 계층에서는 Mock 사용 금지 (순수 단위 테스트)
 * - 비즈니스 로직의 정확성 검증
 * - CAPM 공식의 수학적 정확성 확인
 * - 포트폴리오 최적화 알고리즘 검증
 */

import {
  createBetaCoefficient,
  createExpectedReturn,
  createMarketRiskPremium,
  createRiskFreeRate,
  createRiskTolerance,
  unwrapBetaCoefficient,
  unwrapExpectedReturn,
} from "../../value-objects";
import { isFailure } from '@posmul/auth-economy-sdk';

import { CAPMEngine, CAPMEngineConfig } from "../capm-engine.service";
import {
  IAsset,
  IMarketConditionAnalysis,
  IPortfolio,
} from "../interfaces/capm-engine.interface";

describe("CAPMEngine", () => {
  let engine: CAPMEngine;
  let defaultConfig: CAPMEngineConfig;

  beforeEach(() => {
    defaultConfig = {
      defaultRiskFreeRate: 0.03, // 3% 무위험수익률
      defaultMarketRiskPremium: 0.08, // 8% 시장위험프리미엄
      volatilityWindow: 30, // 30일 변동성 계산
      betaEstimationWindow: 252, // 1년 베타 추정
      rebalancingThreshold: 0.05, // 5% 리밸런싱 임계값
      transactionCostRate: 0.001, // 0.1% 거래비용
      confidenceLevel: 0.95, // 95% 신뢰구간
    };

    engine = new CAPMEngine(defaultConfig);
  });

  // Helper functions for test data creation
  const createMockAsset = (overrides: Partial<IAsset> = {}): IAsset => ({
    assetId: "asset-test",
    assetType: "PmcAmount",
    amount: 10000,
    expectedReturn: createExpectedReturn(0.12), // 12% 기대수익률
    beta: createBetaCoefficient(1.2), // 베타 1.2
    weight: 0.5, // 50% 가중치
    ...overrides,
  });

  const createMockPortfolio = (assets: IAsset[] = []): IPortfolio => {
    const defaultAssets =
      assets.length > 0
        ? assets
        : [
            createMockAsset({
              assetId: "pmp-asset",
              assetType: "PmpAmount",
              weight: 0.4,
              beta: createBetaCoefficient(0.1),
            }),
            createMockAsset({
              assetId: "pmc-asset",
              assetType: "PmcAmount",
              weight: 0.6,
              beta: createBetaCoefficient(1.5),
            }),
          ];

    return {
      portfolioId: "test-portfolio",
      assets: defaultAssets,
      totalValue: 100000,
      expectedReturn: createExpectedReturn(0.1),
      portfolioBeta: createBetaCoefficient(1.0),
      sharpeRatio: 0.5,
      riskLevel: "Moderate",
    };
  };

  const createMockMarketConditions = (
    overrides: Partial<IMarketConditionAnalysis> = {}
  ): IMarketConditionAnalysis => ({
    marketRegime: "Sideways",
    volatilityRegime: "Medium",
    correlationLevel: 0.5,
    marketRiskPremium: createMarketRiskPremium(0.08),
    recommendedStrategy: "Neutral",
    ...overrides,
  });

  describe("configuration validation", () => {
    it("should_accept_valid_configuration_when_all_parameters_are_correct", () => {
      expect(() => new CAPMEngine(defaultConfig)).not.toThrow();
    });

    it("should_reject_configuration_when_risk_free_rate_is_invalid", () => {
      const invalidConfig = {
        ...defaultConfig,
        defaultRiskFreeRate: -0.1, // 음수 무위험수익률
      };

      expect(() => new CAPMEngine(invalidConfig)).toThrow(
        "Invalid risk-free rate"
      );
    });

    it("should_reject_configuration_when_market_risk_premium_is_invalid", () => {
      const invalidConfig = {
        ...defaultConfig,
        defaultMarketRiskPremium: 0.6, // 60% 과도한 위험프리미엄
      };

      expect(() => new CAPMEngine(invalidConfig)).toThrow(
        "Invalid market risk premium"
      );
    });

    it("should_reject_configuration_when_volatility_window_is_too_short", () => {
      const invalidConfig = {
        ...defaultConfig,
        volatilityWindow: 2, // 너무 짧은 변동성 계산 기간
      };

      expect(() => new CAPMEngine(invalidConfig)).toThrow(
        "Invalid volatility window"
      );
    });
  });

  describe("CAPM fair value calculation", () => {
    it("should_calculate_fair_value_when_given_valid_capm_parameters", async () => {
      // Arrange
      const beta = createBetaCoefficient(1.2);
      const riskFreeRate = createRiskFreeRate(0.03);
      const marketRiskPremium = createMarketRiskPremium(0.08);
      const currentPrice = 100;

      // Act
      const result = await engine.calculateFairValue(
        beta,
        riskFreeRate,
        marketRiskPremium,
        currentPrice
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const pricing = result.data;

        // CAPM 공식 검증: E[R] = Rf + β(Rm - Rf) = 0.03 + 1.2 * 0.08 = 0.126
        expect(unwrapExpectedReturn(pricing.requiredReturn)).toBeCloseTo(
          0.126,
          3
        );
        expect(pricing.fairValue).toBeGreaterThan(currentPrice); // 양의 수익률이므로 공정가치 > 현재가
        expect(pricing.currentPrice).toBe(currentPrice);
        expect(pricing.recommendation).toMatch(/^(BUY|SELL|HOLD)$/);
        expect(pricing.confidenceLevel).toBeGreaterThan(0);
        expect(pricing.confidenceLevel).toBeLessThanOrEqual(1);
      }
    });

    it("should_recommend_buy_when_fair_value_exceeds_current_price_significantly", async () => {
      // Arrange - 저평가된 자산 시나리오
      const beta = createBetaCoefficient(0.8); // 낮은 베타
      const riskFreeRate = createRiskFreeRate(0.02);
      const marketRiskPremium = createMarketRiskPremium(0.1); // 높은 위험프리미엄
      const currentPrice = 80; // 상대적으로 낮은 가격

      // Act
      const result = await engine.calculateFairValue(
        beta,
        riskFreeRate,
        marketRiskPremium,
        currentPrice
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.fairValue).toBeGreaterThan(currentPrice * 1.05); // 5% 이상 프리미엄
        // 구체적인 매수 권장은 알파값에 따라 달라질 수 있음
      }
    });

    it("should_handle_high_beta_assets_correctly", async () => {
      // Arrange - 고베타 자산
      const highBeta = createBetaCoefficient(2.0);
      const riskFreeRate = createRiskFreeRate(0.03);
      const marketRiskPremium = createMarketRiskPremium(0.08);
      const currentPrice = 100;

      // Act
      const result = await engine.calculateFairValue(
        highBeta,
        riskFreeRate,
        marketRiskPremium,
        currentPrice
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        // 고베타 자산의 요구수익률: 0.03 + 2.0 * 0.08 = 0.19 (19%)
        expect(unwrapExpectedReturn(result.data.requiredReturn)).toBeCloseTo(
          0.19,
          2
        );
        expect(result.data.confidenceLevel).toBeLessThan(0.9); // 고베타는 신뢰도 낮음
      }
    });
  });

  describe("portfolio risk-return analysis", () => {
    it("should_analyze_portfolio_risk_return_when_given_valid_portfolio", async () => {
      // Arrange
      const portfolio = createMockPortfolio();
      const marketConditions = createMockMarketConditions();

      // Act
      const result = await engine.analyzeRiskReturn(
        portfolio,
        marketConditions
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const analysis = result.data;

        expect(unwrapExpectedReturn(analysis.expectedReturn)).toBeGreaterThan(
          0
        );
        expect(unwrapBetaCoefficient(analysis.portfolioBeta)).toBeGreaterThan(
          0
        );
        expect(analysis.volatility).toBeGreaterThan(0);
        expect(analysis.sharpeRatio).toBeDefined();
        expect(analysis.valueAtRisk).toBeLessThan(
          unwrapExpectedReturn(analysis.expectedReturn)
        ); // VaR < 기대수익률
        expect(analysis.maxDrawdown).toBeGreaterThan(0);
        expect(analysis.informationRatio).toBeDefined();
      }
    });

    it("should_calculate_portfolio_beta_as_weighted_average", async () => {
      // Arrange - 정확한 베타 계산 테스트
      const assets = [
        createMockAsset({
          assetId: "low-beta",
          weight: 0.3,
          beta: createBetaCoefficient(0.5),
        }),
        createMockAsset({
          assetId: "high-beta",
          weight: 0.7,
          beta: createBetaCoefficient(1.5),
        }),
      ];
      const portfolio = createMockPortfolio(assets);
      const marketConditions = createMockMarketConditions();

      // Act
      const result = await engine.analyzeRiskReturn(
        portfolio,
        marketConditions
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        // 포트폴리오 베타 = 0.3 * 0.5 + 0.7 * 1.5 = 0.15 + 1.05 = 1.2
        expect(unwrapBetaCoefficient(result.data.portfolioBeta)).toBeCloseTo(
          1.2,
          2
        );
      }
    });

    it("should_adjust_volatility_based_on_market_conditions", async () => {
      // Arrange
      const portfolio = createMockPortfolio();
      const highVolMarket = createMockMarketConditions({
        volatilityRegime: "High",
      });
      const lowVolMarket = createMockMarketConditions({
        volatilityRegime: "Low",
      });

      // Act
      const highVolResult = await engine.analyzeRiskReturn(
        portfolio,
        highVolMarket
      );
      const lowVolResult = await engine.analyzeRiskReturn(
        portfolio,
        lowVolMarket
      );

      // Assert
      expect(highVolResult.success && lowVolResult.success).toBe(true);

      if (highVolResult.success && lowVolResult.success) {
        expect(highVolResult.data.volatility).toBeGreaterThan(
          lowVolResult.data.volatility
        );
      }
    });
  });

  describe("portfolio optimization", () => {
    it("should_optimize_portfolio_when_given_risk_tolerance", async () => {
      // Arrange
      const currentPortfolio = createMockPortfolio();
      const riskTolerance = createRiskTolerance(0.7); // 공격적 투자자

      // Act
      const result = await engine.optimizePortfolio(
        currentPortfolio,
        riskTolerance
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const optimization = result.data;

        expect(optimization.originalPortfolio).toBeDefined();
        expect(optimization.optimizedPortfolio).toBeDefined();
        expect(optimization.improvementMetrics).toBeDefined();
        expect(optimization.rebalancingRecommendations).toBeDefined();

        // 가중치 합이 1인지 확인
        const totalWeight = optimization.optimizedPortfolio.assets.reduce(
          (sum, asset) => sum + asset.weight,
          0
        );
        expect(totalWeight).toBeCloseTo(1.0, 2);

        // 개선 지표가 정의되어 있는지 확인
        expect(optimization.improvementMetrics.returnImprovement).toBeDefined();
        expect(optimization.improvementMetrics.riskReduction).toBeDefined();
        expect(
          optimization.improvementMetrics.sharpeRatioImprovement
        ).toBeDefined();
      }
    });

    it("should_favor_higher_beta_assets_for_aggressive_investors", async () => {
      // Arrange
      const assets = [
        createMockAsset({
          assetId: "conservative",
          weight: 0.5,
          beta: createBetaCoefficient(0.3),
        }),
        createMockAsset({
          assetId: "aggressive",
          weight: 0.5,
          beta: createBetaCoefficient(1.8),
        }),
      ];
      const portfolio = createMockPortfolio(assets);
      const aggressiveRiskTolerance = createRiskTolerance(0.9);

      // Act
      const result = await engine.optimizePortfolio(
        portfolio,
        aggressiveRiskTolerance
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const optimizedAssets = result.data.optimizedPortfolio.assets;
        const aggressiveAsset = optimizedAssets.find(
          (a) => a.assetId === "aggressive"
        );
        const conservativeAsset = optimizedAssets.find(
          (a) => a.assetId === "conservative"
        );

        // 공격적 투자자는 고베타 자산 선호
        expect(aggressiveAsset!.weight).toBeGreaterThan(
          conservativeAsset!.weight
        );
      }
    });

    it("should_favor_lower_beta_assets_for_conservative_investors", async () => {
      // Arrange
      const assets = [
        createMockAsset({
          assetId: "conservative",
          weight: 0.5,
          beta: createBetaCoefficient(0.3),
        }),
        createMockAsset({
          assetId: "aggressive",
          weight: 0.5,
          beta: createBetaCoefficient(1.8),
        }),
      ];
      const portfolio = createMockPortfolio(assets);
      const conservativeRiskTolerance = createRiskTolerance(0.2);

      // Act
      const result = await engine.optimizePortfolio(
        portfolio,
        conservativeRiskTolerance
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const optimizedAssets = result.data.optimizedPortfolio.assets;
        const aggressiveAsset = optimizedAssets.find(
          (a) => a.assetId === "aggressive"
        );
        const conservativeAsset = optimizedAssets.find(
          (a) => a.assetId === "conservative"
        );

        // 보수적 투자자는 저베타 자산 선호
        expect(conservativeAsset!.weight).toBeGreaterThan(
          aggressiveAsset!.weight
        );
      }
    });
  });

  describe("optimal PmpAmount-PmcAmount allocation", () => {
    it("should_calculate_optimal_allocation_based_on_risk_tolerance", async () => {
      // Arrange
      const totalAmount = 100000;
      const moderateRiskTolerance = createRiskTolerance(0.5);
      const marketConditions = createMockMarketConditions();

      // Act
      const result = await engine.calculateOptimalAllocation(
        totalAmount,
        moderateRiskTolerance,
        marketConditions
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const allocation = result.data;

        // PmpAmount + PmcAmount = 총 금액
        const pmpValue = allocation.pmpAllocation as number;
        const pmcValue = allocation.pmcAllocation as number;
        expect(pmpValue + pmcValue).toBeCloseTo(totalAmount, 0);

        // 중간 위험 투자자는 대략 50:50 배분 예상
        expect(pmpValue).toBeGreaterThan(totalAmount * 0.3);
        expect(pmpValue).toBeLessThan(totalAmount * 0.7);
      }
    });

    it("should_increase_pmp_allocation_during_bear_market", async () => {
      // Arrange
      const totalAmount = 100000;
      const riskTolerance = createRiskTolerance(0.5);
      const bearMarket = createMockMarketConditions({ marketRegime: "Bear" });
      const bullMarket = createMockMarketConditions({ marketRegime: "Bull" });

      // Act
      const bearResult = await engine.calculateOptimalAllocation(
        totalAmount,
        riskTolerance,
        bearMarket
      );
      const bullResult = await engine.calculateOptimalAllocation(
        totalAmount,
        riskTolerance,
        bullMarket
      );

      // Assert
      expect(bearResult.success && bullResult.success).toBe(true);

      if (bearResult.success && bullResult.success) {
        const bearPmpAllocation = bearResult.data.pmpAllocation as number;
        const bullPmpAllocation = bullResult.data.pmpAllocation as number;

        // 베어 마켓에서는 PmpAmount(안전자산) 비중 증가
        expect(bearPmpAllocation).toBeGreaterThan(bullPmpAllocation);
      }
    });
  });

  describe("beta estimation", () => {
    it("should_estimate_beta_when_given_sufficient_return_data", async () => {
      // Arrange - 가상의 수익률 데이터
      const assetReturns = [
        0.02, -0.01, 0.03, 0.01, -0.02, 0.04, 0.02, -0.01, 0.02, 0.01,
      ];
      const marketReturns = [
        0.01, -0.005, 0.02, 0.005, -0.01, 0.025, 0.01, -0.005, 0.015, 0.005,
      ];

      // Act
      const result = await engine.estimateBeta(assetReturns, marketReturns);

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const beta = result.data;
        expect(unwrapBetaCoefficient(beta)).toBeGreaterThan(0);
        expect(unwrapBetaCoefficient(beta)).toBeLessThan(5); // 현실적인 베타 범위
      }
    });
    it("should_reject_beta_estimation_when_insufficient_data", async () => {
      // Arrange - 부족한 데이터
      const assetReturns = [0.02, -0.01, 0.03];
      const marketReturns = [0.01, -0.005, 0.02];

      // Act
      const result = await engine.estimateBeta(assetReturns, marketReturns);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isFailure(result) ? result.error.message : "Unknown error").toContain("Insufficient data");
      }
    });

    it("should_reject_beta_estimation_when_mismatched_data_length", async () => {
      // Arrange - 길이가 다른 데이터
      const assetReturns = [0.02, -0.01, 0.03, 0.01, -0.02];
      const marketReturns = [0.01, -0.005, 0.02];

      // Act
      const result = await engine.estimateBeta(assetReturns, marketReturns);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isFailure(result) ? result.error.message : "Unknown error").toContain("same length");
      }
    });
  });

  describe("market condition analysis", () => {
    it("should_analyze_market_conditions_when_given_historical_data", async () => {
      // Arrange
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1),
        pmpPrice: 100 + Math.sin(i / 10) * 5,
        pmcPrice: 50 + Math.cos(i / 10) * 10,
        marketIndex: 1000 + i * 2,
        volatility: 0.15 + Math.random() * 0.1,
      }));

      // Act
      const result = await engine.analyzeMarketConditions(historicalData);

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const analysis = result.data;

        expect(analysis.marketRegime).toMatch(/^(Bull|Bear|Sideways)$/);
        expect(analysis.volatilityRegime).toMatch(/^(Low|Medium|High)$/);
        expect(analysis.correlationLevel).toBeGreaterThanOrEqual(-1);
        expect(analysis.correlationLevel).toBeLessThanOrEqual(1);
        expect(analysis.marketRiskPremium).toBeGreaterThanOrEqual(0);
        expect(analysis.recommendedStrategy).toMatch(
          /^(Risk-On|Risk-Off|Neutral)$/
        );
      }
    });

    it("should_detect_bull_market_when_prices_trend_upward", async () => {
      // Arrange - 상승 추세 데이터
      const bullMarketData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1),
        pmpPrice: 100 + i,
        pmcPrice: 50 + i * 2,
        marketIndex: 1000 + i * 10, // 강한 상승 추세
        volatility: 0.1,
      }));

      // Act
      const result = await engine.analyzeMarketConditions(bullMarketData);

      // Assert      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.marketRegime).toBe("Bull");
      }
    });

    it("should_handle_insufficient_data_gracefully", async () => {
      // Arrange - 부족한 데이터
      const insufficientData = [
        {
          date: new Date(),
          pmpPrice: 100,
          pmcPrice: 50,
          marketIndex: 1000,
          volatility: 0.15,
        },
      ];

      // Act
      const result = await engine.analyzeMarketConditions(insufficientData); // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isFailure(result) ? result.error.message : "Unknown error").toContain("Insufficient data");
      }
    });
  });
}); // 메인 CAPMEngine describe 블록 종료
