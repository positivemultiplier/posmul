import {
  MentalAccountType,
  PmcAmount,
  PmpAmount,
} from "../value-objects/economic-types";
import {
  createPmcAmount,
  createPmpAmount,
} from "../value-objects/economic-value-objects";
import {
  BehavioralRecommendation,
  DecisionContext,
  EndowmentAnalysis,
  IBehavioralEconomicsEngine,
  MentalAccount,
  ProspectValueFunction,
} from "./interfaces/behavioral-economics.interface";

/**
 * Behavioral Economics Engine Implementation
 *
 * Kahneman-Tversky Prospect Theory, Loss Aversion, Endowment Effect,
 * Mental Accounting을 활용한 사용자 행동 최적화 엔진
 *
 * 기반 이론:
 * - Kahneman & Tversky (1979) "Prospect Theory: An Analysis of Decision under Risk"
 * - Thaler (1985) "Mental Accounting and Consumer Choice"
 * - Kahneman, Knetsch & Thaler (1991) "Anomalies: The Endowment Effect"
 */
export class BehavioralEconomicsEngine implements IBehavioralEconomicsEngine {
  private readonly DEFAULT_VALUE_FUNCTION: ProspectValueFunction = {
    alpha: 0.88, // 이득 영역 곡률
    beta: 0.88, // 손실 영역 곡률
    lambda: 2.25, // 손실 회피 계수
    referencePoint: 0,
  };

  /**
   * Prospect Theory 기반 값 함수 계산
   * v(x) = x^α (x ≥ 0), -λ(-x)^β (x < 0)
   */
  calculateProspectValue(
    amount: PmpAmount | PmcAmount,
    referencePoint: PmpAmount | PmcAmount,
    valueFunction: ProspectValueFunction = this.DEFAULT_VALUE_FUNCTION
  ): number {
    const x = Number(amount) - Number(referencePoint);

    if (x >= 0) {
      // 이득 영역: v(x) = x^α
      return Math.pow(x, valueFunction.alpha);
    } else {
      // 손실 영역: v(x) = -λ(-x)^β
      return -valueFunction.lambda * Math.pow(-x, valueFunction.beta);
    }
  }

  /**
   * Loss Aversion 계수 계산
   * 최근 거래 패턴을 기반으로 개인별 손실 회피 성향 측정
   */
  calculateLossAversionRatio(user: {
    recentTransactions: Array<{
      amount: PmpAmount | PmcAmount;
      type: "gain" | "loss";
      timestamp: Date;
    }>;
  }): number {
    const recentTransactions = user.recentTransactions.filter(
      (tx) => Date.now() - tx.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // 최근 30일
    );

    if (recentTransactions.length < 2) {
      return this.DEFAULT_VALUE_FUNCTION.lambda; // 기본값 반환
    }

    const gains = recentTransactions
      .filter((tx) => tx.type === "gain")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const losses = recentTransactions
      .filter((tx) => tx.type === "loss")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (gains === 0 || losses === 0) {
      return this.DEFAULT_VALUE_FUNCTION.lambda;
    }

    // 손실에 대한 심리적 가중치 / 이득에 대한 심리적 가중치
    const observedRatio = losses / gains;
    return Math.max(1.0, Math.min(5.0, observedRatio)); // 1.0 ~ 5.0 범위로 제한
  }

  /**
   * Endowment Effect 분석
   * WTA (Willingness to Accept) vs WTP (Willingness to Pay) 격차 분석
   */
  analyzeEndowmentEffect(
    currentHoldings: { pmp: PmpAmount; pmc: PmcAmount },
    marketValue: { pmp: PmpAmount; pmc: PmcAmount }
  ): EndowmentAnalysis {
    const pmpHolding = Number(currentHoldings.pmp);
    const pmcHolding = Number(currentHoldings.pmc);
    const pmpMarket = Number(marketValue.pmp);
    const pmcMarket = Number(marketValue.pmc);

    // Endowment Effect로 인한 과대평가 (일반적으로 1.5-3배)
    const endowmentMultiplier = 2.0;

    const willingnessToAccept = createPmpAmount(
      pmpHolding * endowmentMultiplier
    );
    const willingnessToPay = createPmpAmount(pmpMarket * 0.8); // 구매 시 할인 요구

    const endowmentRatio =
      (pmpHolding * endowmentMultiplier) / (pmpMarket * 0.8);
    const overvaluationBias = Math.max(0, (endowmentRatio - 1) * 100); // 백분율

    return {
      overvaluationBias,
      willingnessToAccept,
      willingnessToPay,
      endowmentRatio,
    };
  }

  /**
   * Mental Accounting 기반 예산 배분 최적화
   */
  optimizeMentalAccounting(
    totalWealth: { pmp: PmpAmount; pmc: PmcAmount },
    accounts: MentalAccount[],
    userPreferences: {
      riskTolerance: number;
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
  } {
    const totalPmpAmount = Number(totalWealth.pmp);
    const totalPmcAmount = Number(totalWealth.pmc);
    const warnings: string[] = []; // 기본 배분 비율 (Thaler의 Mental Accounting 연구 기반)
    const defaultAllocation = new Map<
      MentalAccountType,
      { pmpRatio: number; pmcRatio: number }
    >([
      [
        MentalAccountType.INVESTMENT_PmpAmount,
        { pmpRatio: 0.5, pmcRatio: 0.3 },
      ],
      [
        MentalAccountType.PREDICTION_PmpAmount,
        { pmpRatio: 0.3, pmcRatio: 0.2 },
      ],
      [MentalAccountType.SOCIAL_PmcAmount, { pmpRatio: 0.1, pmcRatio: 0.3 }],
      [MentalAccountType.DONATION_PmcAmount, { pmpRatio: 0.1, pmcRatio: 0.2 }],
    ]);

    // 위험 선호도에 따른 조정
    const riskAdjustment = userPreferences.riskTolerance - 0.5; // -0.5 ~ 0.5

    const recommendedAllocation = new Map<
      MentalAccountType,
      { pmp: PmpAmount; pmc: PmcAmount }
    >();
    let totalAllocatedPmpAmount = 0;
    let totalAllocatedPmcAmount = 0;

    defaultAllocation.forEach((baseRatio, accountType) => {
      let pmpRatio = baseRatio.pmpRatio;
      let pmcRatio = baseRatio.pmcRatio;

      // 리스크 조정
      if (accountType === MentalAccountType.INVESTMENT_PmpAmount) {
        pmcRatio += riskAdjustment * 0.3; // 위험 선호 시 투자 계정에 PmcAmount 더 배분
        pmpRatio -= riskAdjustment * 0.1;
      }

      // 음수 방지
      pmpRatio = Math.max(0, pmpRatio);
      pmcRatio = Math.max(0, pmcRatio);

      const allocatedPmpAmount = Math.max(0, totalPmpAmount * pmpRatio);
      const allocatedPmcAmount = Math.max(0, totalPmcAmount * pmcRatio);

      recommendedAllocation.set(accountType, {
        pmp: createPmpAmount(Math.round(allocatedPmpAmount)),
        pmc: createPmcAmount(Math.round(allocatedPmcAmount)),
      });

      totalAllocatedPmpAmount += allocatedPmpAmount;
      totalAllocatedPmcAmount += allocatedPmcAmount;
    });

    // 모든 계정 타입에 대해 할당이 생성되었는지 확인
    if (recommendedAllocation.size === 0) {
      // 기본 할당 생성
      recommendedAllocation.set(MentalAccountType.INVESTMENT_PmpAmount, {
        pmp: createPmpAmount(Math.round(totalPmpAmount * 0.5)),
        pmc: createPmcAmount(Math.round(totalPmcAmount * 0.3)),
      });
      recommendedAllocation.set(MentalAccountType.PREDICTION_PmpAmount, {
        pmp: createPmpAmount(Math.round(totalPmpAmount * 0.5)),
        pmc: createPmcAmount(Math.round(totalPmcAmount * 0.7)),
      });
    }

    // 현재 배분과 비교하여 리밸런싱 필요성 판단
    let rebalancingNeeded = false;
    for (const account of accounts) {
      const recommended = recommendedAllocation.get(account.type);
      if (recommended) {
        const pmpDiff = Math.abs(
          Number(account.pmpBalance) - Number(recommended.pmp)
        );
        const pmcDiff = Math.abs(
          Number(account.pmcBalance) - Number(recommended.pmc)
        );

        if (pmpDiff > totalPmpAmount * 0.1 || pmcDiff > totalPmcAmount * 0.1) {
          // 10% 이상 차이
          rebalancingNeeded = true;
          break;
        }
      }
    }

    // 경고 메시지 생성
    if (totalAllocatedPmpAmount > totalPmpAmount * 1.05) {
      warnings.push("권장 PmpAmount 배분이 보유량을 초과합니다.");
    }
    if (totalAllocatedPmcAmount > totalPmcAmount * 1.05) {
      warnings.push("권장 PmcAmount 배분이 보유량을 초과합니다.");
    }
    const donationAccount = accounts.find(
      (a) => a.type === MentalAccountType.DONATION_PmcAmount
    );
    if (
      donationAccount &&
      Number(donationAccount.pmpBalance) <
        Number(userPreferences.donationTarget) * 0.5
    ) {
      warnings.push(
        "기부 목표 달성을 위해 기부 계정 할당을 늘리는 것을 고려해보세요."
      );
    }

    return {
      recommendedAllocation,
      rebalancingNeeded,
      warnings,
    };
  }

  /**
   * 행동경제학적 넛지 생성
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
  } {
    const totalWealth =
      Number(context.currentWealth.totalPmpAmount) +
      Number(context.currentWealth.totalPmcAmount);

    switch (targetBehavior) {
      case "save_more":
        if (context.framing === "loss") {
          return {
            message: `현재 저축률을 유지하면 1년 후 ${Math.round(
              totalWealth * 0.1
            )}PmpAmount의 기회비용이 발생합니다.`,
            type: "loss_framing",
            expectedEffectiveness: 0.75,
          };
        } else {
          return {
            message: `매월 추가로 ${Math.round(
              totalWealth * 0.05
            )}PmpAmount만 저축하면 연말에 보너스 이자를 받을 수 있습니다.`,
            type: "default_option",
            expectedEffectiveness: 0.65,
          };
        }

      case "donate_more":
        return {
          message: `같은 소득 구간의 90%가 당신보다 더 많이 기부하고 있습니다. 평균 기부액은 ${Math.round(
            totalWealth * 0.03
          )}PmpAmount입니다.`,
          type: "social_proof",
          expectedEffectiveness: 0.8,
        };

      case "reduce_risk":
        if (
          context.recentLossExperience &&
          context.recentLossExperience.daysAgo < 7
        ) {
          return {
            message: `최근 손실을 경험하셨네요. 안전한 PmpAmount 자산 비중을 ${Math.round(
              60 + context.timePressure * 20
            )}%로 늘리는 것을 고려해보세요.`,
            type: "loss_framing",
            expectedEffectiveness: 0.85,
          };
        } else {
          return {
            message: `위험 분산을 위해 포트폴리오의 안전 자산 비중을 자동으로 조정할까요?`,
            type: "default_option",
            expectedEffectiveness: 0.7,
          };
        }

      case "increase_engagement":
        return {
          message: `오늘 예측 게임에 참여하지 않으면 연속 참여 보너스(${Math.round(
            totalWealth * 0.01
          )}PmpAmount)를 놓치게 됩니다.`,
          type: "loss_framing",
          expectedEffectiveness: 0.78,
        };

      default:
        return {
          message: "더 나은 의사결정을 위해 행동 패턴을 분석해보세요.",
          type: "default_option",
          expectedEffectiveness: 0.5,
        };
    }
  }

  /**
   * 사용자별 행동 패턴 분석
   */
  analyzeBehaviorPattern(
    userHistory: Array<{
      action: string;
      amount: PmpAmount | PmcAmount;
      context: DecisionContext;
      outcome: "positive" | "negative" | "neutral";
      timestamp: Date;
    }>
  ): BehavioralRecommendation {
    if (userHistory.length < 5) {
      return {
        recommendedAction: "더 많은 데이터 수집",
        confidence: 0.3,
        reasoning: ["분석을 위한 충분한 행동 데이터가 없습니다."],
        expectedUtilityGain: 0,
      };
    }

    // 성공적인 행동 패턴 분석
    const successfulActions = userHistory.filter(
      (h) => h.outcome === "positive"
    );
    const failedActions = userHistory.filter((h) => h.outcome === "negative");

    // 시간대별 성공률 분석
    const timeBasedSuccess = this.analyzeTimeBasedPerformance(userHistory);

    // 금액대별 성공률 분석
    const amountBasedSuccess = this.analyzeAmountBasedPerformance(userHistory);

    const reasoning: string[] = [];
    let confidence = 0.5;
    let recommendedAction = "현재 패턴 유지";

    if (successfulActions.length > failedActions.length * 2) {
      reasoning.push("전반적으로 좋은 의사결정 패턴을 보이고 있습니다.");
      confidence += 0.2;
    }

    if (timeBasedSuccess.bestTimeSlot) {
      reasoning.push(
        `${timeBasedSuccess.bestTimeSlot} 시간대에 더 좋은 성과를 보입니다.`
      );
      recommendedAction = `${timeBasedSuccess.bestTimeSlot} 시간대에 중요한 결정을 내리세요`;
      confidence += 0.15;
    }

    if (amountBasedSuccess.optimalRange) {
      reasoning.push(
        `${amountBasedSuccess.optimalRange} 범위에서 최적 성과를 보입니다.`
      );
      confidence += 0.1;
    }

    // 손실 회피 패턴 분석
    const lossAversionRatio = this.calculateLossAversionRatio({
      recentTransactions: userHistory.map((h) => ({
        amount: h.amount,
        type: h.outcome === "positive" ? "gain" : "loss",
        timestamp: h.timestamp,
      })),
    });

    if (lossAversionRatio > 3.0) {
      reasoning.push(
        "과도한 손실 회피 성향이 기회비용을 증가시킬 수 있습니다."
      );
      recommendedAction = "점진적으로 위험 감수 수준을 높여보세요";
    }

    const expectedUtilityGain = Math.min(0.3, confidence * 0.4);

    return {
      recommendedAction,
      confidence: Math.min(0.95, confidence),
      reasoning,
      expectedUtilityGain,
      riskWarnings:
        lossAversionRatio > 4.0 ? ["과도한 보수적 성향 주의"] : undefined,
    };
  }

  /**
   * Hyperbolic Discounting 보정
   * β-δ 모델: U = β * δ^t * u(x_t)
   */
  correctHyperbolicDiscounting(
    immediateReward: PmpAmount | PmcAmount,
    delayedReward: PmpAmount | PmcAmount,
    delayDays: number,
    userDiscountRate: number = 0.01
  ): {
    correctedValue: number;
    recommendDelayed: boolean;
    commitmentMechanism?: string;
  } {
    const immediate = Number(immediateReward);
    const delayed = Number(delayedReward);

    // Hyperbolic discounting: v = reward / (1 + k*delay)
    const hyperbolicK = userDiscountRate * 365; // 연간 할인율을 일간으로 변환
    const discountedValue = delayed / (1 + hyperbolicK * delayDays);

    // Present bias 보정 (β ≈ 0.7)
    const presentBias = 0.7;
    const correctedValue = discountedValue * presentBias;

    const recommendDelayed = correctedValue > immediate;

    let commitmentMechanism: string | undefined;
    if (recommendDelayed && delayDays > 30) {
      commitmentMechanism = "자동 저축 계획 설정으로 미래 유혹 차단";
    }

    return {
      correctedValue,
      recommendDelayed,
      commitmentMechanism,
    };
  }

  /**
   * Social Proof 메커니즘
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
    socialPressure: number;
    recommendedAdjustment: number;
  } {
    const userAmount = Number(userAction.amount);
    const peerAmounts = peerGroup
      .filter((p) => p.type === userAction.type)
      .map((p) => Number(p.amount));

    if (peerAmounts.length === 0) {
      return {
        peerComparison: "average",
        socialPressure: 0,
        recommendedAdjustment: 0,
      };
    }

    const peerAverage =
      peerAmounts.reduce((sum, amt) => sum + amt, 0) / peerAmounts.length;
    const peerMedian = [...peerAmounts].sort((a, b) => a - b)[
      Math.floor(peerAmounts.length / 2)
    ];

    let peerComparison: "above_average" | "average" | "below_average";
    if (userAmount > peerAverage * 1.2) {
      peerComparison = "above_average";
    } else if (userAmount < peerAverage * 0.8) {
      peerComparison = "below_average";
    } else {
      peerComparison = "average";
    }

    // 사회적 압박 계산 (편차가 클수록 높음)
    const deviation = Math.abs(userAmount - peerMedian) / peerMedian;
    const socialPressure = Math.min(1.0, deviation);

    // 권장 조정량 (중간값 쪽으로)
    const recommendedAdjustment = (peerMedian - userAmount) / userAmount;

    return {
      peerComparison,
      socialPressure,
      recommendedAdjustment: Math.max(
        -0.5,
        Math.min(0.5, recommendedAdjustment)
      ),
    };
  }

  /**
   * Choice Architecture 최적화
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
  } {
    // 사용자 프로필에 따른 가중치 계산
    const weightedOptions = availableOptions.map((option) => {
      const totalCost = Number(option.pmpCost) + Number(option.pmcCost);
      const riskAdjustedUtility =
        option.expectedUtility * (1 - userBehaviorProfile.riskAversion * 0.3);
      const lossAdjustedUtility =
        riskAdjustedUtility * (1 - userBehaviorProfile.lossAversion * 0.2);

      return {
        ...option,
        adjustedUtility: lossAdjustedUtility,
        costUtilityRatio: lossAdjustedUtility / Math.max(1, totalCost),
      };
    });

    // 효용 대비 비용으로 정렬
    const sortedByUtility = [...weightedOptions].sort(
      (a, b) => b.costUtilityRatio - a.costUtilityRatio
    );

    // Present bias가 높으면 즉시 혜택이 있는 옵션을 우선
    if (userBehaviorProfile.presentBias > 0.7) {
      sortedByUtility.sort((a, b) => {
        if (a.description.includes("즉시") || a.description.includes("지금"))
          return -1;
        if (b.description.includes("즉시") || b.description.includes("지금"))
          return 1;
        return 0;
      });
    }

    const optimalOrder = sortedByUtility.map((option) => option.id);
    const defaultOption = sortedByUtility[0].id;

    // 프레이밍 전략 결정
    let framingStrategy: string;
    if (userBehaviorProfile.lossAversion > 2.0) {
      framingStrategy = "loss_prevention"; // "X를 잃지 마세요" 형태
    } else if (userBehaviorProfile.riskAversion > 0.7) {
      framingStrategy = "safety_emphasis"; // 안전성 강조
    } else {
      framingStrategy = "gain_emphasis"; // 이득 강조
    }

    return {
      optimalOrder,
      defaultOption,
      framingStrategy,
    };
  }

  // Private helper methods

  private analyzeTimeBasedPerformance(
    userHistory: Array<{
      action: string;
      amount: PmpAmount | PmcAmount;
      context: DecisionContext;
      outcome: "positive" | "negative" | "neutral";
      timestamp: Date;
    }>
  ): { bestTimeSlot?: string; successRate: number } {
    const timeSlots = ["morning", "afternoon", "evening"];
    const timeAnalysis = new Map<string, { success: number; total: number }>();

    userHistory.forEach((entry) => {
      const hour = entry.timestamp.getHours();
      let timeSlot: string;
      if (hour < 12) timeSlot = "morning";
      else if (hour < 18) timeSlot = "afternoon";
      else timeSlot = "evening";

      const current = timeAnalysis.get(timeSlot) || { success: 0, total: 0 };
      current.total++;
      if (entry.outcome === "positive") current.success++;
      timeAnalysis.set(timeSlot, current);
    });

    let bestTimeSlot: string | undefined;
    let bestSuccessRate = 0;

    timeAnalysis.forEach((data, slot) => {
      const successRate = data.total > 0 ? data.success / data.total : 0;
      if (successRate > bestSuccessRate && data.total >= 3) {
        // 최소 3번 이상 데이터
        bestSuccessRate = successRate;
        bestTimeSlot = slot;
      }
    });

    return { bestTimeSlot, successRate: bestSuccessRate };
  }

  private analyzeAmountBasedPerformance(
    userHistory: Array<{
      action: string;
      amount: PmpAmount | PmcAmount;
      context: DecisionContext;
      outcome: "positive" | "negative" | "neutral";
      timestamp: Date;
    }>
  ): { optimalRange?: string; successRate: number } {
    const amounts = userHistory
      .map((h) => Number(h.amount))
      .sort((a, b) => a - b);
    const quartiles = {
      q1: amounts[Math.floor(amounts.length * 0.25)],
      q2: amounts[Math.floor(amounts.length * 0.5)],
      q3: amounts[Math.floor(amounts.length * 0.75)],
    };

    const ranges = ["low", "medium", "high"];
    const rangeAnalysis = new Map<string, { success: number; total: number }>();

    userHistory.forEach((entry) => {
      const amount = Number(entry.amount);
      let range: string;
      if (amount <= quartiles.q2) range = "low";
      else if (amount <= quartiles.q3) range = "medium";
      else range = "high";

      const current = rangeAnalysis.get(range) || { success: 0, total: 0 };
      current.total++;
      if (entry.outcome === "positive") current.success++;
      rangeAnalysis.set(range, current);
    });

    let optimalRange: string | undefined;
    let bestSuccessRate = 0;

    rangeAnalysis.forEach((data, range) => {
      const successRate = data.total > 0 ? data.success / data.total : 0;
      if (successRate > bestSuccessRate && data.total >= 3) {
        bestSuccessRate = successRate;
        optimalRange = range;
      }
    });

    return { optimalRange, successRate: bestSuccessRate };
  }
}
