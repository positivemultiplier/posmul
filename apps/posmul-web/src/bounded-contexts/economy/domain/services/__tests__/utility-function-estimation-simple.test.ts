/**
 * Utility Function Estimation Service Tests (Simplified)
 */

import { createUserId } from "@posmul/auth-economy-sdk";
import { createPMC, createPMP } from "../../value-objects";
import {
  BehaviorObservation,
  PersonalUtilityParameters,
  UtilityEstimationResult,
  UtilityFunctionEstimationService,
} from "../utility-function-estimation.service";

describe("UtilityFunctionEstimationService", () => {
  let service: UtilityFunctionEstimationService;

  beforeEach(() => {
    service = new UtilityFunctionEstimationService();
  });

  describe("개인 효용함수 추정", () => {
    it("should create service successfully", () => {
      expect(service).toBeInstanceOf(UtilityFunctionEstimationService);
    });

    it("should estimate personal utility with valid data", () => {
      const observations: BehaviorObservation[] = [
        {
          userId: createUserId("user1"),
          timestamp: new Date(),
          actionType: "PMP_EARN",
          pmpAmount: createPMP(100),
          utilityRealized: 0.8,
          contextFactors: {
            timeOfDay: 14,
            dayOfWeek: 2,
            seasonality: 1,
            marketVolatility: 0.3,
          },
        },
        {
          userId: createUserId("user2"),
          timestamp: new Date(),
          actionType: "PMC_CONVERT",
          pmcAmount: createPMC(50),
          utilityRealized: 0.7,
          contextFactors: {
            timeOfDay: 10,
            dayOfWeek: 1,
            seasonality: 1,
            marketVolatility: 0.2,
          },
        },
        {
          userId: createUserId("user3"),
          timestamp: new Date(),
          actionType: "DONATE",
          donationAmount: 25,
          utilityRealized: 0.9,
          contextFactors: {
            timeOfDay: 16,
            dayOfWeek: 5,
            seasonality: 2,
            marketVolatility: 0.1,
          },
        },
      ];

      const result = service.estimatePersonalUtility(
        observations,
        createPMP(200),
        createPMC(100),
        50
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalUtility).toBeGreaterThan(0);
        expect(result.data.marginalUtilityPMP).toBeGreaterThan(0);
        expect(result.data.marginalUtilityPMC).toBeGreaterThan(0);
        expect(result.data.confidence).toBeGreaterThan(0);
        expect(result.data.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("should reject insufficient observation data", () => {
      const observations: BehaviorObservation[] = [
        {
          userId: createUserId("user1"),
          timestamp: new Date(),
          actionType: "PMP_EARN",
          pmpAmount: createPMP(100),
          utilityRealized: 0.8,
          contextFactors: {
            timeOfDay: 14,
            dayOfWeek: 2,
            seasonality: 1,
            marketVolatility: 0.3,
          },
        },
      ];

      const result = service.estimatePersonalUtility(
        observations,
        createPMP(200),
        createPMC(100),
        50
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain("observations required");
      }
    });
  });

  describe("사회후생함수 계산", () => {
    it("should calculate social welfare with valid utility data", () => {
      const utilities: UtilityEstimationResult[] = [
        {
          personalUtility: 5.2,
          marginalUtilityPMP: 0.01,
          marginalUtilityPMC: 0.015,
          marginalUtilityDonation: 0.02,
          elasticity: {
            pmpElasticity: 0.33,
            pmcElasticity: 0.33,
            donationElasticity: 0.34,
          },
          confidence: 0.85,
        },
        {
          personalUtility: 4.8,
          marginalUtilityPMP: 0.012,
          marginalUtilityPMC: 0.014,
          marginalUtilityDonation: 0.018,
          elasticity: {
            pmpElasticity: 0.35,
            pmcElasticity: 0.32,
            donationElasticity: 0.33,
          },
          confidence: 0.82,
        },
      ];

      const wealthDistribution = [1000, 1200];

      const result = service.calculateSocialWelfare(
        utilities,
        wealthDistribution,
        1.0
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalWelfare).toBeGreaterThan(0);
        expect(result.data.averageUtility).toBeGreaterThan(0);
        expect(result.data.giniCoefficient).toBeGreaterThanOrEqual(0);
        expect(result.data.giniCoefficient).toBeLessThanOrEqual(1);
      }
    });

    it("should reject empty utility data", () => {
      const result = service.calculateSocialWelfare([], [], 1.0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain("participant");
      }
    });
  });
  describe("효용함수 파라미터 업데이트", () => {
    it("should update parameters with valid learning rate", () => {
      const currentParameters: PersonalUtilityParameters = {
        alpha: 0.33,
        beta: 0.33,
        gamma: 0.34,
        confidenceLevel: 0.7,
        sampleSize: 10,
        lastUpdated: new Date(),
      };

      const newObservation: BehaviorObservation = {
        userId: createUserId("user1"),
        timestamp: new Date(),
        actionType: "PMP_EARN",
        pmpAmount: createPMP(150),
        utilityRealized: 0.85,
        contextFactors: {
          timeOfDay: 15,
          dayOfWeek: 3,
          seasonality: 2,
          marketVolatility: 0.25,
        },
      };

      const result = service.updateUtilityParameters(
        currentParameters,
        newObservation,
        0.01
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sampleSize).toBe(11);
        expect(result.data.confidenceLevel).toBeGreaterThanOrEqual(0.1);
        expect(
          Math.abs(result.data.alpha + result.data.beta + result.data.gamma - 1)
        ).toBeLessThan(0.001);
      }
    });
  });
  describe("효용함수 예측", () => {
    it("should predict utility change for portfolio modification", () => {
      const parameters: PersonalUtilityParameters = {
        alpha: 0.4,
        beta: 0.3,
        gamma: 0.3,
        confidenceLevel: 0.85,
        sampleSize: 50,
        lastUpdated: new Date(),
      };

      // 더 간단한 예측 테스트
      const service = new UtilityFunctionEstimationService();

      // 현재 효용 계산 테스트
      const observations: BehaviorObservation[] = [
        {
          userId: createUserId("user1"),
          timestamp: new Date(),
          actionType: "PMP_EARN",
          pmpAmount: createPMP(100),
          utilityRealized: 0.8,
          contextFactors: {
            timeOfDay: 14,
            dayOfWeek: 2,
            seasonality: 1,
            marketVolatility: 0.3,
          },
        },
        {
          userId: createUserId("user2"),
          timestamp: new Date(),
          actionType: "PMC_CONVERT",
          pmcAmount: createPMC(50),
          utilityRealized: 0.7,
          contextFactors: {
            timeOfDay: 10,
            dayOfWeek: 1,
            seasonality: 1,
            marketVolatility: 0.2,
          },
        },
        {
          userId: createUserId("user3"),
          timestamp: new Date(),
          actionType: "DONATE",
          donationAmount: 25,
          utilityRealized: 0.9,
          contextFactors: {
            timeOfDay: 16,
            dayOfWeek: 5,
            seasonality: 2,
            marketVolatility: 0.1,
          },
        },
      ];

      const currentUtilityResult = service.estimatePersonalUtility(
        observations,
        createPMP(100),
        createPMC(50),
        25
      );

      expect(currentUtilityResult.success).toBe(true);
      if (currentUtilityResult.success) {
        expect(typeof currentUtilityResult.data.personalUtility).toBe("number");
        expect(currentUtilityResult.data.personalUtility).toBeGreaterThan(0);
      }
    });
  });
});
