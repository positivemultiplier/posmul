import { MentalAccountType } from "../../value-objects/economic-types";
import {
  createPmcAmount,
  createPmpAmount,
} from "../../value-objects/economic-value-objects";
import { BehavioralEconomicsEngine } from "../behavioral-economics.service";
import {
  DecisionContext,
  MentalAccount,
  ProspectValueFunction,
} from "../interfaces/behavioral-economics.interface";

describe("BehavioralEconomicsEngine", () => {
  let engine: BehavioralEconomicsEngine;

  beforeEach(() => {
    engine = new BehavioralEconomicsEngine();
  });

  describe("Prospect Theory Value Function", () => {
    const customValueFunction: ProspectValueFunction = {
      alpha: 0.88,
      beta: 0.88,
      lambda: 2.25,
      referencePoint: 100,
    };

    it("should calculate positive prospect value for gains", () => {
      const amount = createPmpAmount(150);
      const referencePoint = createPmpAmount(100);

      const value = engine.calculateProspectValue(
        amount,
        referencePoint,
        customValueFunction
      ); // v(50) = 50^0.88 ≈ 31.27
      expect(value).toBeCloseTo(31.27, 1);
    });

    it("should calculate negative prospect value for losses with loss aversion", () => {
      const amount = createPmpAmount(50);
      const referencePoint = createPmpAmount(100);

      const value = engine.calculateProspectValue(
        amount,
        referencePoint,
        customValueFunction
      ); // v(-50) = -2.25 * 50^0.88 ≈ -70.35
      expect(value).toBeCloseTo(-70.35, 1);
      expect(value).toBeLessThan(0);
    });

    it("should demonstrate loss aversion (losses feel worse than equivalent gains)", () => {
      const referencePoint = createPmpAmount(100);
      const gain = createPmpAmount(150);
      const loss = createPmpAmount(50);

      const gainValue = engine.calculateProspectValue(
        gain,
        referencePoint,
        customValueFunction
      );
      const lossValue = engine.calculateProspectValue(
        loss,
        referencePoint,
        customValueFunction
      );

      // |lossValue| should be > gainValue due to lambda = 2.25
      expect(Math.abs(lossValue)).toBeGreaterThan(gainValue);
    });

    it("should handle zero difference", () => {
      const amount = createPmpAmount(100);
      const referencePoint = createPmpAmount(100);

      const value = engine.calculateProspectValue(
        amount,
        referencePoint,
        customValueFunction
      );

      expect(value).toBe(0);
    });
  });

  describe("Loss Aversion Ratio Calculation", () => {
    it("should calculate loss aversion ratio from transaction history", () => {
      const recentDate = new Date();
      const user = {
        recentTransactions: [
          {
            amount: createPmpAmount(100),
            type: "gain" as const,
            timestamp: recentDate,
          },
          {
            amount: createPmpAmount(50),
            type: "loss" as const,
            timestamp: recentDate,
          },
          {
            amount: createPmpAmount(200),
            type: "gain" as const,
            timestamp: recentDate,
          },
          {
            amount: createPmpAmount(75),
            type: "loss" as const,
            timestamp: recentDate,
          },
        ],
      };

      const ratio = engine.calculateLossAversionRatio(user);

      // Total gains: 300, Total losses: 125, Ratio: 125/300 ≈ 0.42
      // But minimum is 1.0, so should return the clamped value
      expect(ratio).toBeGreaterThanOrEqual(1.0);
      expect(ratio).toBeLessThanOrEqual(5.0);
    });

    it("should return default lambda for insufficient data", () => {
      const user = {
        recentTransactions: [
          {
            amount: createPmpAmount(100),
            type: "gain" as const,
            timestamp: new Date(),
          },
        ],
      };

      const ratio = engine.calculateLossAversionRatio(user);

      expect(ratio).toBe(2.25); // Default lambda
    });

    it("should ignore old transactions (older than 30 days)", () => {
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const recentDate = new Date();

      const user = {
        recentTransactions: [
          {
            amount: createPmpAmount(1000),
            type: "loss" as const,
            timestamp: oldDate,
          }, // Should be ignored
          {
            amount: createPmpAmount(100),
            type: "gain" as const,
            timestamp: recentDate,
          },
        ],
      };

      const ratio = engine.calculateLossAversionRatio(user);

      expect(ratio).toBe(2.25); // Should return default due to insufficient recent data
    });
  });

  describe("Endowment Effect Analysis", () => {
    it("should calculate willingness to accept vs willingness to pay gap", () => {
      const currentHoldings = { pmp: createPmpAmount(1000), pmc: createPmcAmount(500) };
      const marketValue = { pmp: createPmpAmount(1000), pmc: createPmcAmount(500) };

      const analysis = engine.analyzeEndowmentEffect(
        currentHoldings,
        marketValue
      );

      expect(analysis.overvaluationBias).toBeGreaterThan(0);
      expect(Number(analysis.willingnessToAccept)).toBeGreaterThan(
        Number(analysis.willingnessToPay)
      );
      expect(analysis.endowmentRatio).toBeGreaterThan(1);
    });

    it("should show endowment ratio greater than 1 indicating bias", () => {
      const currentHoldings = { pmp: createPmpAmount(500), pmc: createPmcAmount(250) };
      const marketValue = { pmp: createPmpAmount(500), pmc: createPmcAmount(250) };

      const analysis = engine.analyzeEndowmentEffect(
        currentHoldings,
        marketValue
      );

      // With 2x endowment multiplier and 0.8 WTP factor: 2/0.8 = 2.5
      expect(analysis.endowmentRatio).toBeCloseTo(2.5, 1);
    });
  });
  describe("Mental Accounting Optimization", () => {
    const sampleAccounts: MentalAccount[] = [
      {
        type: MentalAccountType.INVESTMENT_PmpAmount,
        pmpBalance: createPmpAmount(500),
        pmcBalance: createPmcAmount(50),
        budgetLimit: createPmpAmount(1000),
        monthlySpent: createPmpAmount(300),
        averageMonthlySpending: createPmpAmount(350),
      },
      {
        type: MentalAccountType.PREDICTION_PmpAmount,
        pmpBalance: createPmpAmount(200),
        pmcBalance: createPmcAmount(300),
        budgetLimit: createPmpAmount(800),
        monthlySpent: createPmpAmount(100),
        averageMonthlySpending: createPmpAmount(150),
      },
    ];

    it("should provide mental accounting allocation recommendations", () => {
      const totalWealth = { pmp: createPmpAmount(2000), pmc: createPmcAmount(1000) };
      const userPreferences = {
        riskTolerance: 0.6,
        savingsGoal: createPmpAmount(500),
        donationTarget: createPmpAmount(100),
      };

      const result = engine.optimizeMentalAccounting(
        totalWealth,
        sampleAccounts,
        userPreferences
      );

      expect(result.recommendedAllocation.size).toBeGreaterThan(0);
      expect(typeof result.rebalancingNeeded).toBe("boolean");
      expect(Array.isArray(result.warnings)).toBe(true); // Check that all account types have allocations
      expect(
        result.recommendedAllocation.has(MentalAccountType.INVESTMENT_PmpAmount)
      ).toBe(true);
      expect(
        result.recommendedAllocation.has(MentalAccountType.PREDICTION_PmpAmount)
      ).toBe(true);
    });

    it("should adjust allocation based on risk tolerance", () => {
      const totalWealth = { pmp: createPmpAmount(1000), pmc: createPmcAmount(1000) };
      const userPreferences = {
        riskTolerance: 0.8, // High risk tolerance
        savingsGoal: createPmpAmount(200),
        donationTarget: createPmpAmount(50),
      };

      const result = engine.optimizeMentalAccounting(
        totalWealth,
        [],
        userPreferences
      );
      const investmentAllocation = result.recommendedAllocation.get(
        MentalAccountType.INVESTMENT_PmpAmount
      );
      expect(investmentAllocation).toBeDefined();
      // High risk tolerance should allocate more PmcAmount to investment
      expect(Number(investmentAllocation!.pmc)).toBeGreaterThan(250);
    });

    it("should generate warnings for allocation issues", () => {
      const totalWealth = { pmp: createPmpAmount(100), pmc: createPmcAmount(100) }; // Small wealth
      const accounts: MentalAccount[] = [
        {
          type: MentalAccountType.DONATION_PmcAmount,
          pmpBalance: createPmpAmount(10),
          pmcBalance: createPmcAmount(5),
          budgetLimit: createPmpAmount(50),
          monthlySpent: createPmpAmount(5),
          averageMonthlySpending: createPmpAmount(10),
        },
      ];
      const userPreferences = {
        riskTolerance: 0.5,
        savingsGoal: createPmpAmount(50),
        donationTarget: createPmpAmount(100), // High donation target relative to wealth
      };

      const result = engine.optimizeMentalAccounting(
        totalWealth,
        accounts,
        userPreferences
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("기부"))).toBe(true);
    });
  });

  describe("Nudge Generation", () => {
    const sampleContext: DecisionContext = {
      currentWealth: { totalPmpAmount: createPmpAmount(1000), totalPmcAmount: createPmcAmount(500) },
      framing: "loss",
      timePressure: 0.7,
      socialInfluence: 0.5,
      recentLossExperience: {
        amount: createPmpAmount(100),
        daysAgo: 3,
      },
    };

    it("should generate appropriate nudge for saving behavior", () => {
      const nudge = engine.generateNudge(sampleContext, "save_more");

      expect(nudge.message).toBeTruthy();
      expect(nudge.type).toMatch(
        /loss_framing|social_proof|default_option|commitment_device/
      );
      expect(nudge.expectedEffectiveness).toBeGreaterThan(0);
      expect(nudge.expectedEffectiveness).toBeLessThanOrEqual(1);
    });

    it("should use loss framing for save_more when context is loss-framed", () => {
      const nudge = engine.generateNudge(sampleContext, "save_more");

      expect(nudge.type).toBe("loss_framing");
      expect(nudge.message).toContain("기회비용");
    });

    it("should generate social proof nudge for donation behavior", () => {
      const nudge = engine.generateNudge(sampleContext, "donate_more");

      expect(nudge.type).toBe("social_proof");
      expect(nudge.message).toContain("90%");
      expect(nudge.expectedEffectiveness).toBeGreaterThan(0.7);
    });

    it("should consider recent loss for risk reduction nudge", () => {
      const nudge = engine.generateNudge(sampleContext, "reduce_risk");

      expect(nudge.type).toBe("loss_framing");
      expect(nudge.message).toContain("최근 손실");
      expect(nudge.expectedEffectiveness).toBeGreaterThan(0.8);
    });

    it("should generate engagement nudge with loss framing", () => {
      const nudge = engine.generateNudge(sampleContext, "increase_engagement");

      expect(nudge.type).toBe("loss_framing");
      expect(nudge.message).toContain("연속 참여 보너스");
      expect(nudge.message).toContain("놓치게");
    });
  });

  describe("Behavior Pattern Analysis", () => {
    it("should analyze behavior patterns and provide recommendations", () => {
      const userHistory = [
        {
          action: "donate",
          amount: createPmpAmount(50),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1000),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.3,
            socialInfluence: 0.6,
          },
          outcome: "positive" as const,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          action: "invest",
          amount: createPmcAmount(100),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(950),
              totalPmcAmount: createPmcAmount(600),
            },
            framing: "loss" as const,
            timePressure: 0.8,
            socialInfluence: 0.2,
          },
          outcome: "negative" as const,
          timestamp: new Date("2024-01-16T15:30:00Z"),
        },
        {
          action: "save",
          amount: createPmpAmount(200),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1150),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.2,
            socialInfluence: 0.4,
          },
          outcome: "positive" as const,
          timestamp: new Date("2024-01-17T09:15:00Z"),
        },
        {
          action: "donate",
          amount: createPmpAmount(30),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1120),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.3,
            socialInfluence: 0.7,
          },
          outcome: "positive" as const,
          timestamp: new Date("2024-01-18T11:45:00Z"),
        },
        {
          action: "predict",
          amount: createPmpAmount(25),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1095),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.4,
            socialInfluence: 0.5,
          },
          outcome: "positive" as const,
          timestamp: new Date("2024-01-19T14:20:00Z"),
        },
      ];

      const analysis = engine.analyzeBehaviorPattern(userHistory);

      expect(analysis.recommendedAction).toBeTruthy();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(analysis.reasoning)).toBe(true);
      expect(analysis.reasoning.length).toBeGreaterThan(0);
      expect(typeof analysis.expectedUtilityGain).toBe("number");
    });

    it("should return low confidence for insufficient data", () => {
      const userHistory = [
        {
          action: "save",
          amount: createPmpAmount(100),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1000),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.5,
            socialInfluence: 0.5,
          },
          outcome: "positive" as const,
          timestamp: new Date(),
        },
      ];

      const analysis = engine.analyzeBehaviorPattern(userHistory);

      expect(analysis.confidence).toBeLessThan(0.5);
      expect(analysis.recommendedAction).toContain("데이터 수집");
    });

    it("should identify high success rate patterns", () => {
      const successfulHistory = Array(10)
        .fill(null)
        .map((_, i) => ({
          action: "donate",
          amount: createPmpAmount(50),
          context: {
            currentWealth: {
              totalPmpAmount: createPmpAmount(1000),
              totalPmcAmount: createPmcAmount(500),
            },
            framing: "gain" as const,
            timePressure: 0.3,
            socialInfluence: 0.6,
          },
          outcome: "positive" as const,
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }));

      const analysis = engine.analyzeBehaviorPattern(successfulHistory);

      expect(analysis.confidence).toBeGreaterThan(0.6);
      expect(analysis.reasoning.some((r) => r.includes("좋은 의사결정"))).toBe(
        true
      );
    });
  });

  describe("Hyperbolic Discounting Correction", () => {
    it("should correct for present bias in discounting", () => {
      const immediate = createPmpAmount(100);
      const delayed = createPmpAmount(120);
      const delayDays = 30;
      const userDiscountRate = 0.1;

      const result = engine.correctHyperbolicDiscounting(
        immediate,
        delayed,
        delayDays,
        userDiscountRate
      );

      expect(typeof result.correctedValue).toBe("number");
      expect(typeof result.recommendDelayed).toBe("boolean");
      expect(result.correctedValue).toBeLessThan(Number(delayed)); // Should be discounted
    });
    it("should recommend delayed reward when discounted value exceeds immediate", () => {
      const immediate = createPmpAmount(100);
      const delayed = createPmpAmount(300); // Much higher delayed reward
      const delayDays = 1; // Very short delay
      const userDiscountRate = 0.001; // Very low discount rate

      const result = engine.correctHyperbolicDiscounting(
        immediate,
        delayed,
        delayDays,
        userDiscountRate
      );

      expect(result.recommendDelayed).toBe(true);
    });

    it("should suggest commitment mechanism for long delays", () => {
      const immediate = createPmpAmount(100);
      const delayed = createPmpAmount(150);
      const delayDays = 45; // Long delay
      const userDiscountRate = 0.02;

      const result = engine.correctHyperbolicDiscounting(
        immediate,
        delayed,
        delayDays,
        userDiscountRate
      );

      if (result.recommendDelayed) {
        expect(result.commitmentMechanism).toBeTruthy();
        expect(result.commitmentMechanism).toContain("자동 저축");
      }
    });
  });

  describe("Social Proof Mechanism", () => {
    it("should compare user action against peer group", () => {
      const userAction = { type: "donate", amount: createPmpAmount(50) };
      const peerGroup = [
        { type: "donate", amount: createPmpAmount(30), success: true },
        { type: "donate", amount: createPmpAmount(40), success: true },
        { type: "donate", amount: createPmpAmount(60), success: false },
        { type: "donate", amount: createPmpAmount(45), success: true },
      ];

      const socialProof = engine.calculateSocialProof(userAction, peerGroup);

      expect(socialProof.peerComparison).toMatch(
        /above_average|average|below_average/
      );
      expect(socialProof.socialPressure).toBeGreaterThanOrEqual(0);
      expect(socialProof.socialPressure).toBeLessThanOrEqual(1);
      expect(socialProof.recommendedAdjustment).toBeGreaterThanOrEqual(-0.5);
      expect(socialProof.recommendedAdjustment).toBeLessThanOrEqual(0.5);
    });

    it("should identify above average when user exceeds peer average", () => {
      const userAction = { type: "invest", amount: createPmpAmount(1000) };
      const peerGroup = [
        { type: "invest", amount: createPmpAmount(300), success: true },
        { type: "invest", amount: createPmpAmount(400), success: true },
        { type: "invest", amount: createPmpAmount(500), success: false },
      ];

      const socialProof = engine.calculateSocialProof(userAction, peerGroup);

      expect(socialProof.peerComparison).toBe("above_average");
    });

    it("should handle empty peer group gracefully", () => {
      const userAction = { type: "save", amount: createPmpAmount(200) };
      const peerGroup: Array<{ type: string; amount: any; success: boolean }> =
        [];

      const socialProof = engine.calculateSocialProof(userAction, peerGroup);

      expect(socialProof.peerComparison).toBe("average");
      expect(socialProof.socialPressure).toBe(0);
      expect(socialProof.recommendedAdjustment).toBe(0);
    });
  });

  describe("Choice Architecture Optimization", () => {
    const sampleOptions = [
      {
        id: "option1",
        description: "즉시 PmpAmount 보상",
        pmpCost: createPmpAmount(50),
        pmcCost: createPmcAmount(10),
        expectedUtility: 0.8,
      },
      {
        id: "option2",
        description: "장기 투자 계획",
        pmpCost: createPmpAmount(100),
        pmcCost: createPmcAmount(50),
        expectedUtility: 1.2,
      },
      {
        id: "option3",
        description: "안전한 저축 상품",
        pmpCost: createPmpAmount(80),
        pmcCost: createPmcAmount(0),
        expectedUtility: 0.6,
      },
    ];

    it("should optimize choice ordering based on user behavior profile", () => {
      const userProfile = {
        riskAversion: 0.3,
        lossAversion: 2.0,
        presentBias: 0.4,
      };

      const result = engine.optimizeChoiceArchitecture(
        sampleOptions,
        userProfile
      );

      expect(result.optimalOrder).toHaveLength(3);
      expect(result.optimalOrder).toContain("option1");
      expect(result.optimalOrder).toContain("option2");
      expect(result.optimalOrder).toContain("option3");
      expect(result.defaultOption).toBeTruthy();
      expect(result.framingStrategy).toMatch(
        /loss_prevention|safety_emphasis|gain_emphasis/
      );
    });

    it("should prioritize immediate rewards for high present bias users", () => {
      const userProfile = {
        riskAversion: 0.5,
        lossAversion: 2.0,
        presentBias: 0.8, // High present bias
      };

      const result = engine.optimizeChoiceArchitecture(
        sampleOptions,
        userProfile
      );

      // Option with "즉시" should be prioritized
      expect(result.optimalOrder[0]).toBe("option1");
    });

    it("should use loss prevention framing for high loss aversion", () => {
      const userProfile = {
        riskAversion: 0.4,
        lossAversion: 3.0, // High loss aversion
        presentBias: 0.5,
      };

      const result = engine.optimizeChoiceArchitecture(
        sampleOptions,
        userProfile
      );

      expect(result.framingStrategy).toBe("loss_prevention");
    });

    it("should use safety emphasis for high risk aversion", () => {
      const userProfile = {
        riskAversion: 0.8, // High risk aversion
        lossAversion: 2.0,
        presentBias: 0.5,
      };

      const result = engine.optimizeChoiceArchitecture(
        sampleOptions,
        userProfile
      );

      expect(result.framingStrategy).toBe("safety_emphasis");
    });

    it("should use gain emphasis for low risk and loss aversion", () => {
      const userProfile = {
        riskAversion: 0.3, // Low risk aversion
        lossAversion: 1.5, // Low loss aversion
        presentBias: 0.4,
      };

      const result = engine.optimizeChoiceArchitecture(
        sampleOptions,
        userProfile
      );

      expect(result.framingStrategy).toBe("gain_emphasis");
    });
  });
});
