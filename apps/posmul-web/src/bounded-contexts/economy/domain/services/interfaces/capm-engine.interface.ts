/**
 * CAPM (Capital Asset Pricing Model) Engine - Domain Service Interface
 * Harry Markowitz (1952) 포트폴리오 이론과 William Sharpe (1964) CAPM 구현
 *
 * 핵심 개념:
 * - PMP: 무위험자산 (Risk-Free Asset)
 * - PMC: 위험자산 (Risky Asset)
 * - CAPM 공식: E[R] = Rf + β(Rm - Rf)
 * - 포트폴리오 최적화: 리스크-수익 트레이드오프
 */

import { Result } from "@posmul/shared-types";
import {
  BetaCoefficient,
  ExpectedReturn,
  MarketRiskPremium,
  PMC,
  PMP,
  RiskFreeRate,
  RiskTolerance,
} from "../../value-objects";

/**
 * 자산 클래스 정의
 */
export interface IAsset {
  readonly assetId: string;
  readonly assetType: "PMP" | "PMC";
  readonly amount: number;
  readonly expectedReturn: ExpectedReturn;
  readonly beta: BetaCoefficient;
  readonly weight: number; // 포트폴리오 내 가중치 (0~1)
}

/**
 * 포트폴리오 구성
 */
export interface IPortfolio {
  readonly portfolioId: string;
  readonly assets: IAsset[];
  readonly totalValue: number;
  readonly expectedReturn: ExpectedReturn;
  readonly portfolioBeta: BetaCoefficient;
  readonly sharpeRatio: number;
  readonly riskLevel: "Conservative" | "Moderate" | "Aggressive";
}

/**
 * 리스크-수익 분석 결과
 */
export interface IRiskReturnAnalysis {
  readonly expectedReturn: ExpectedReturn;
  readonly portfolioBeta: BetaCoefficient;
  readonly sharpeRatio: number;
  readonly volatility: number;
  readonly valueAtRisk: number; // VaR (95% 신뢰구간)
  readonly maxDrawdown: number;
  readonly informationRatio: number;
}

/**
 * 포트폴리오 최적화 결과
 */
export interface IOptimizationResult {
  readonly originalPortfolio: IPortfolio;
  readonly optimizedPortfolio: IPortfolio;
  readonly improvementMetrics: {
    readonly returnImprovement: number;
    readonly riskReduction: number;
    readonly sharpeRatioImprovement: number;
  };
  readonly rebalancingRecommendations: IRebalancingRecommendation[];
}

/**
 * 리밸런싱 권장사항
 */
export interface IRebalancingRecommendation {
  readonly assetId: string;
  readonly currentWeight: number;
  readonly targetWeight: number;
  readonly action: "BUY" | "SELL" | "HOLD";
  readonly amount: number;
  readonly rationale: string;
}

/**
 * CAPM 기반 가격 책정 결과
 */
export interface ICAPMPricingResult {
  readonly assetId: string;
  readonly fairValue: number;
  readonly currentPrice: number;
  readonly expectedReturn: ExpectedReturn;
  readonly requiredReturn: ExpectedReturn;
  readonly alpha: number; // Jensen's Alpha
  readonly recommendation: "BUY" | "SELL" | "HOLD";
  readonly confidenceLevel: number;
}

/**
 * 시장 상황 분석
 */
export interface IMarketConditionAnalysis {
  readonly marketRegime: "Bull" | "Bear" | "Sideways";
  readonly volatilityRegime: "Low" | "Medium" | "High";
  readonly correlationLevel: number;
  readonly marketRiskPremium: MarketRiskPremium;
  readonly recommendedStrategy: "Risk-On" | "Risk-Off" | "Neutral";
}

/**
 * CAPM Engine 도메인 서비스 인터페이스
 *
 * 책임:
 * - CAPM 기반 자산 가격 책정
 * - 포트폴리오 위험-수익 분석
 * - 최적 포트폴리오 구성 추천
 * - 시장 상황에 따른 자산 배분 전략
 */
export interface ICAPMEngine {
  /**
   * CAPM을 사용한 자산 공정가치 계산
   * @param assetBeta 자산의 베타 계수
   * @param riskFreeRate 무위험수익률
   * @param marketRiskPremium 시장위험프리미엄
   * @param currentPrice 현재 가격
   */
  calculateFairValue(
    assetBeta: BetaCoefficient,
    riskFreeRate: RiskFreeRate,
    marketRiskPremium: MarketRiskPremium,
    currentPrice: number
  ): Promise<Result<ICAPMPricingResult>>;

  /**
   * 포트폴리오 리스크-수익 분석
   * @param portfolio 분석할 포트폴리오
   * @param marketConditions 시장 상황
   */
  analyzeRiskReturn(
    portfolio: IPortfolio,
    marketConditions: IMarketConditionAnalysis
  ): Promise<Result<IRiskReturnAnalysis>>;

  /**
   * 포트폴리오 최적화 (평균-분산 최적화)
   * @param currentPortfolio 현재 포트폴리오
   * @param riskTolerance 위험 허용도
   * @param targetReturn 목표 수익률 (선택사항)
   */
  optimizePortfolio(
    currentPortfolio: IPortfolio,
    riskTolerance: RiskTolerance,
    targetReturn?: ExpectedReturn
  ): Promise<Result<IOptimizationResult>>;

  /**
   * PMP-PMC 최적 배분 계산
   * @param totalAmount 총 투자 금액
   * @param riskTolerance 위험 허용도
   * @param marketConditions 시장 상황
   */
  calculateOptimalAllocation(
    totalAmount: number,
    riskTolerance: RiskTolerance,
    marketConditions: IMarketConditionAnalysis
  ): Promise<Result<{ pmpAllocation: PMP; pmcAllocation: PMC }>>;

  /**
   * 시장 상황 분석
   * @param historicalData 과거 시장 데이터
   * @param timeWindow 분석 기간 (일 단위)
   */
  analyzeMarketConditions(
    historicalData: Array<{
      date: Date;
      pmpPrice: number;
      pmcPrice: number;
      marketIndex: number;
      volatility: number;
    }>,
    timeWindow?: number
  ): Promise<Result<IMarketConditionAnalysis>>;

  /**
   * 베타 계수 추정
   * @param assetReturns 자산 수익률 시계열
   * @param marketReturns 시장 수익률 시계열
   * @param timeWindow 추정 기간
   */
  estimateBeta(
    assetReturns: number[],
    marketReturns: number[],
    timeWindow?: number
  ): Promise<Result<BetaCoefficient>>;

  /**
   * 리밸런싱 권장사항 생성
   * @param currentPortfolio 현재 포트폴리오
   * @param targetPortfolio 목표 포트폴리오
   * @param transactionCosts 거래비용 고려
   */
  generateRebalancingRecommendations(
    currentPortfolio: IPortfolio,
    targetPortfolio: IPortfolio,
    transactionCosts?: number
  ): Promise<Result<IRebalancingRecommendation[]>>;
}
