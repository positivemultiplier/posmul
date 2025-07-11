import {
  MentalAccountType,
  PmcAmount,
  PmpAmount,
} from "../../value-objects/economic-types";

/**
 * Prospect Theory 값 함수 파라미터
 * Kahneman & Tversky (1979) "Prospect Theory: An Analysis of Decision under Risk"
 */
export interface ProspectValueFunction {
  /** 손실 영역에서의 곡률 파라미터 (일반적으로 0.88) */
  alpha: number;
  /** 이득 영역에서의 곡률 파라미터 (일반적으로 0.88) */
  beta: number;
  /** 손실 회피 계수 (일반적으로 2.25) */
  lambda: number;
  /** 참조점 (Reference Point) */ referencePoint: number;
}

/**
 * Mental Account 상태
 */
export interface MentalAccount {
  type: MentalAccountType;
  pmpBalance: PmpAmount;
  pmcBalance: PmcAmount;
  /** 계정별 예산 한도 */
  budgetLimit: PmpAmount;
  /** 이번 달 지출 */
  monthlySpent: PmpAmount;
  /** 평균 지출 패턴 */
  averageMonthlySpending: PmpAmount;
}

/**
 * 행동경제학적 의사결정 컨텍스트
 */
export interface DecisionContext {
  /** 현재 사용자 상태 */
  currentWealth: {
    totalPmpAmount: PmpAmount;
    totalPmcAmount: PmcAmount;
  };
  /** 의사결정 프레이밍 */
  framing: "gain" | "loss";
  /** 시간 압박 정도 (0-1) */
  timePressure: number;
  /** 사회적 영향 정도 (0-1) */
  socialInfluence: number;
  /** 최근 손실 경험 */
  recentLossExperience?: {
    amount: PmpAmount | PmcAmount;
    daysAgo: number;
  };
}

/**
 * 행동경제학적 추천 결과
 */
export interface BehavioralRecommendation {
  /** 추천 행동 */
  recommendedAction: string;
  /** 추천 강도 (0-1) */
  confidence: number;
  /** 행동경제학적 근거 */
  reasoning: string[];
  /** 예상 효용 증가 */
  expectedUtilityGain: number;
  /** 리스크 경고 */
  riskWarnings?: string[];
}

/**
 * Endowment Effect 분석 결과
 */
export interface EndowmentAnalysis {
  /** 현재 보유 자산에 대한 과대평가 정도 */
  overvaluationBias: number;
  /** 매도 의향 가격 */
  willingnessToAccept: PmpAmount | PmcAmount;
  /** 구매 의향 가격 */
  willingnessToPay: PmpAmount | PmcAmount;
  /** WTA/WTP 비율 */
  endowmentRatio: number;
}

/**
 * Behavioral Economics Engine 인터페이스
 *
 * Kahneman-Tversky Prospect Theory, Loss Aversion,
 * Endowment Effect, Mental Accounting을 활용한 사용자 행동 최적화
 */
export interface IBehavioralEconomicsEngine {
  /**
   * Prospect Theory 기반 값 함수 계산
   * v(x) = x^α (x ≥ 0), -λ(-x)^β (x < 0)
   */
  calculateProspectValue(
    amount: PmpAmount | PmcAmount,
    referencePoint: PmpAmount | PmcAmount,
    valueFunction: ProspectValueFunction
  ): number;

  /**
   * Loss Aversion 계수 계산
   * 손실의 주관적 가치가 동일한 크기 이득의 몇 배인지
   */
  calculateLossAversionRatio(user: {
    recentTransactions: Array<{
      amount: PmpAmount | PmcAmount;
      type: "gain" | "loss";
      timestamp: Date;
    }>;
  }): number;

  /**
   * Endowment Effect 분석
   * 보유 효과로 인한 비합리적 의사결정 탐지
   */
  analyzeEndowmentEffect(
    currentHoldings: { pmp: PmpAmount; pmc: PmcAmount },
    marketValue: { pmp: PmpAmount; pmc: PmcAmount }
  ): EndowmentAnalysis;

  /**
   * Mental Accounting 기반 예산 배분
   * 계정별 최적 자금 배분 추천
   */
  optimizeMentalAccounting(
    totalWealth: { pmp: PmpAmount; pmc: PmcAmount },
    accounts: MentalAccount[],
    userPreferences: {
      riskTolerance: number; // 0-1
      savingsGoal: PmpAmount;
      donationTarget: PmpAmount;
    }
  ): {
    recommendedAllocation: Map<
      MentalAccountType,
      { pmp: PmpAmount; pmc: PmcAmount }
    >;
    rebalancingNeeded: boolean;
    warnings: string[];
  };

  /**
   * 행동경제학적 넛지 생성
   * 사용자의 의사결정을 개선하는 넛지 메시지 생성
   */
  generateNudge(
    context: DecisionContext,
    targetBehavior:
      | "save_more"
      | "donate_more"
      | "reduce_risk"
      | "increase_engagement"
  ): {
    message: string;
    type:
      | "loss_framing"
      | "social_proof"
      | "default_option"
      | "commitment_device";
    expectedEffectiveness: number;
  };

  /**
   * 사용자별 행동 패턴 분석
   * 과거 행동 데이터를 바탕으로 개인화된 추천 생성
   */
  analyzeBehaviorPattern(
    userHistory: Array<{
      action: string;
      amount: PmpAmount | PmcAmount;
      context: DecisionContext;
      outcome: "positive" | "negative" | "neutral";
      timestamp: Date;
    }>
  ): BehavioralRecommendation;

  /**
   * Hyperbolic Discounting 보정
   * 시간 선호의 비일관성을 고려한 장기 계획 최적화
   */
  correctHyperbolicDiscounting(
    immediateReward: PmpAmount | PmcAmount,
    delayedReward: PmpAmount | PmcAmount,
    delayDays: number,
    userDiscountRate: number
  ): {
    correctedValue: number;
    recommendDelayed: boolean;
    commitmentMechanism?: string;
  };

  /**
   * Social Proof 메커니즘
   * 동료 집단의 행동을 활용한 사회적 영향 최적화
   */
  calculateSocialProof(
    userAction: { type: string; amount: PmpAmount | PmcAmount },
    peerGroup: Array<{
      type: string;
      amount: PmpAmount | PmcAmount;
      success: boolean;
    }>
  ): {
    peerComparison: "above_average" | "average" | "below_average";
    socialPressure: number; // 0-1
    recommendedAdjustment: number; // -1 to 1
  };

  /**
   * Choice Architecture 최적화
   * 의사결정 환경 설계를 통한 행동 개선
   */
  optimizeChoiceArchitecture(
    availableOptions: Array<{
      id: string;
      description: string;
      pmpCost: PmpAmount;
      pmcCost: PmcAmount;
      expectedUtility: number;
    }>,
    userBehaviorProfile: {
      riskAversion: number;
      lossAversion: number;
      presentBias: number;
    }
  ): {
    optimalOrder: string[];
    defaultOption: string;
    framingStrategy: string;
  };
}
