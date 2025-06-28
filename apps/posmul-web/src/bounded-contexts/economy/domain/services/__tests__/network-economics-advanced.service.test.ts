import { describe, expect, it } from "@jest/globals";
import {
  createActiveUserCount,
  createNetworkDensity,
  createPMC,
  createPMP,
} from "../../value-objects/economic-value-objects";
import {
  NetworkState,
  NetworkType,
} from "../interfaces/network-economics.interface";
import { NetworkEconomicsEngine } from "../network-economics.service";

describe("NetworkEconomicsEngine - Advanced Features", () => {
  let service: NetworkEconomicsEngine;

  beforeEach(() => {
    service = new NetworkEconomicsEngine();
  });

  describe("Cross-Network Effects Analysis", () => {
    it("should analyze cross-network effects between different network types", () => {
      const networks = [
        {
          type: NetworkType.ONE_TO_MANY,
          state: {
            activeUsers: createActiveUserCount(1000),
            totalConnections: 50000,
            density: createNetworkDensity(0.05),
            averageDegree: 100,
            clusteringCoefficient: 0.2,
            diameter: 6,
          } as NetworkState,
          value: createPMP(50000),
        },
        {
          type: NetworkType.MANY_TO_MANY,
          state: {
            activeUsers: createActiveUserCount(500),
            totalConnections: 25000,
            density: createNetworkDensity(0.1),
            averageDegree: 100,
            clusteringCoefficient: 0.4,
            diameter: 4,
          } as NetworkState,
          value: createPMP(75000),
        },
      ];

      const result = service.analyzeCrossNetworkEffects(networks);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((effect) => {
        expect(effect.sourceNetwork).toBeTruthy();
        expect(effect.targetNetwork).toBeTruthy();
        expect(typeof effect.interactionStrength).toBe("number");
        expect(typeof effect.synergyCoefficient).toBe("number");
        expect(typeof effect.expectedValueIncrease).toBe("number");
      });
    });

    it("should handle empty networks array", () => {
      const result = service.analyzeCrossNetworkEffects([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle single network (no cross-effects)", () => {
      const networks = [
        {
          type: NetworkType.GROUP_FORMING,
          state: {
            activeUsers: createActiveUserCount(100),
            totalConnections: 1000,
            density: createNetworkDensity(0.2),
            averageDegree: 20,
            clusteringCoefficient: 0.3,
            diameter: 5,
          } as NetworkState,
          value: createPMP(10000),
        },
      ];

      const result = service.analyzeCrossNetworkEffects(networks);
      expect(result.length).toBe(0);
    });
  });

  describe("Network Density Optimization", () => {
    it("should optimize network density within constraints", () => {
      const currentState: NetworkState = {
        activeUsers: createActiveUserCount(1000),
        totalConnections: 50000,
        density: createNetworkDensity(0.1),
        averageDegree: 100,
        clusteringCoefficient: 0.3,
        diameter: 5,
      };

      const targetUserCount = createActiveUserCount(2000);
      const constraints = {
        maxConnections: 200000,
        qualityThreshold: 0.7,
        maintenanceCost: createPMC(1000),
      };

      const result = service.optimizeNetworkDensity(
        currentState,
        targetUserCount,
        constraints
      );

      expect(typeof result.optimalDensity).toBe("number");
      expect(result.optimalDensity).toBeGreaterThan(0);
      expect(result.optimalDensity).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.recommendedActions)).toBe(true);
      expect(typeof result.expectedValueIncrease).toBe("number");
      expect(typeof result.implementationCost).toBe("number");
    });

    it("should suggest improvements for low-density networks", () => {
      const lowDensityState: NetworkState = {
        activeUsers: createActiveUserCount(2000),
        totalConnections: 10000, // Very low density
        density: createNetworkDensity(0.005),
        averageDegree: 10,
        clusteringCoefficient: 0.1,
        diameter: 10,
      };

      const result = service.optimizeNetworkDensity(
        lowDensityState,
        createActiveUserCount(3000),
        {
          maxConnections: 500000,
          qualityThreshold: 0.5,
          maintenanceCost: createPMC(2000),
        }
      );

      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(
        result.recommendedActions.some(
          (action) =>
            action.toLowerCase().includes("improve") ||
            action.toLowerCase().includes("increase") ||
            action.toLowerCase().includes("connect")
        )
      ).toBe(true);
    });
  });

  describe("Network Effects Measurement", () => {
    it("should measure network effects accurately", () => {
      const networkState: NetworkState = {
        activeUsers: createActiveUserCount(1000),
        totalConnections: 50000,
        density: createNetworkDensity(0.1),
        averageDegree: 100,
        clusteringCoefficient: 0.3,
        diameter: 5,
      };

      const actualValue = createPMP(100000);
      const userEngagement = {
        averageSessionTime: 1800, // 30 minutes
        monthlyActiveUsers: 800,
        userRetentionRate: 0.75,
      };

      const result = service.measureNetworkEffects(
        networkState,
        actualValue,
        userEngagement
      );

      expect(typeof result.metcalfeValue).toBe("number");
      expect(typeof result.reedValue).toBe("number");
      expect(typeof result.actualValue).toBe("number");
      expect(typeof result.growthRate).toBe("number");
      expect(typeof result.networkEffectIndex).toBe("number");
      expect(typeof result.criticalMassAchieved).toBe("boolean");

      expect(result.metcalfeValue).toBeGreaterThan(0);
      expect(result.reedValue).toBeGreaterThan(0);
      expect(result.actualValue).toBe(actualValue);
    });

    it("should detect when network effects are strong", () => {
      const strongNetworkState: NetworkState = {
        activeUsers: createActiveUserCount(5000),
        totalConnections: 500000,
        density: createNetworkDensity(0.04),
        averageDegree: 200,
        clusteringCoefficient: 0.6,
        diameter: 4,
      };

      const highActualValue = createPMP(2000000);
      const highEngagement = {
        averageSessionTime: 3600, // 1 hour
        monthlyActiveUsers: 4800,
        userRetentionRate: 0.9,
      };

      const result = service.measureNetworkEffects(
        strongNetworkState,
        highActualValue,
        highEngagement
      );

      expect(result.networkEffectIndex).toBeGreaterThan(1); // Strong network effects
      expect(result.criticalMassAchieved).toBe(true);
    });
  });

  describe("Critical Mass Analysis", () => {
    it("should analyze critical mass progression correctly", () => {
      const networkType = NetworkType.MANY_TO_MANY;
      const currentUsers = createActiveUserCount(1000);
      const historicalGrowth = [
        {
          timestamp: new Date("2024-01-01"),
          userCount: 100,
          value: createPMP(1000),
          engagementMetrics: { retention: 0.5 },
        },
        {
          timestamp: new Date("2024-02-01"),
          userCount: 300,
          value: createPMP(5000),
          engagementMetrics: { retention: 0.6 },
        },
        {
          timestamp: new Date("2024-03-01"),
          userCount: 1000,
          value: createPMP(25000),
          engagementMetrics: { retention: 0.7 },
        },
      ];

      const result = service.analyzeCriticalMass(
        networkType,
        currentUsers,
        historicalGrowth
      );

      expect(typeof result.estimatedCriticalMass).toBe("number");
      expect(result.estimatedCriticalMass).toBeGreaterThan(0);
      expect(typeof result.timeToReach).toBe("number");
      expect(result.currentProgress).toBeGreaterThanOrEqual(0);
      expect(result.currentProgress).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.accelerationStrategies)).toBe(true);
      expect(result.accelerationStrategies.length).toBeGreaterThan(0);
    });

    it("should provide meaningful acceleration strategies", () => {
      const networkType = NetworkType.GROUP_FORMING;
      const currentUsers = createActiveUserCount(500);
      const historicalGrowth = [
        {
          timestamp: new Date("2024-01-01"),
          userCount: 50,
          value: createPMP(500),
          engagementMetrics: { retention: 0.3 },
        },
        {
          timestamp: new Date("2024-02-01"),
          userCount: 200,
          value: createPMP(2000),
          engagementMetrics: { retention: 0.4 },
        },
        {
          timestamp: new Date("2024-03-01"),
          userCount: 500,
          value: createPMP(8000),
          engagementMetrics: { retention: 0.5 },
        },
      ];

      const result = service.analyzeCriticalMass(
        networkType,
        currentUsers,
        historicalGrowth
      );

      result.accelerationStrategies.forEach((strategy) => {
        expect(strategy.recommendedAction).toBeTruthy();
        expect(strategy.priority).toBeGreaterThan(0);
        expect(strategy.priority).toBeLessThanOrEqual(10);
        expect(typeof strategy.expectedImpact.userGrowth).toBe("number");
        expect(typeof strategy.expectedImpact.valueIncrease).toBe("number");
        expect(typeof strategy.expectedImpact.engagementBoost).toBe("number");
        expect(typeof strategy.implementationComplexity).toBe("number");
        expect(typeof strategy.estimatedROI).toBe("number");
      });
    });
  });

  describe("Network Lifecycle Management", () => {
    it("should identify lifecycle stages accurately", () => {
      const networkState: NetworkState = {
        activeUsers: createActiveUserCount(2000),
        totalConnections: 100000,
        density: createNetworkDensity(0.05),
        averageDegree: 100,
        clusteringCoefficient: 0.4,
        diameter: 4,
      };
      const growthMetrics = {
        userGrowthRate: 0.2, // 20% monthly growth
        valueGrowthRate: 0.35,
        churnRate: 0.05,
        acquisitionCost: createPMC(100),
      };

      const result = service.identifyLifecycleStage(
        networkState,
        growthMetrics
      );

      expect([
        "early_stage",
        "growth_stage",
        "mature_stage",
        "saturation_stage",
        "decline_stage",
      ]).toContain(result.currentStage);
      expect(Array.isArray(result.stageCharacteristics)).toBe(true);
      expect(Array.isArray(result.recommendedStrategies)).toBe(true);
      expect(Array.isArray(result.nextStageRequirements)).toBe(true);
    });

    it("should detect growth stage characteristics", () => {
      const growthStageState: NetworkState = {
        activeUsers: createActiveUserCount(5000),
        totalConnections: 500000,
        density: createNetworkDensity(0.04),
        averageDegree: 200,
        clusteringCoefficient: 0.5,
        diameter: 4,
      };
      const rapidGrowthMetrics = {
        userGrowthRate: 0.5, // 50% monthly growth (viral growth)
        valueGrowthRate: 0.8,
        churnRate: 0.03,
        acquisitionCost: createPMC(50),
      };

      const result = service.identifyLifecycleStage(
        growthStageState,
        rapidGrowthMetrics
      );

      expect(result.currentStage).toBe("growth_stage");
      expect(
        result.stageCharacteristics.some(
          (char) =>
            char.toLowerCase().includes("viral") ||
            char.toLowerCase().includes("exponential") ||
            char.toLowerCase().includes("rapid")
        )
      ).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle minimal networks gracefully", () => {
      const minimalState: NetworkState = {
        activeUsers: createActiveUserCount(1),
        totalConnections: 0,
        density: createNetworkDensity(0),
        averageDegree: 0,
        clusteringCoefficient: 0,
        diameter: 0,
      };

      const metcalfeValue = service.calculateMetcalfeValue(
        minimalState.activeUsers,
        createPMP(1)
      );

      expect(Math.abs(metcalfeValue)).toBe(0);

      const reedValue = service.calculateReedValue(
        minimalState.activeUsers,
        0.1
      );

      expect(reedValue).toBeGreaterThanOrEqual(0);
    });

    it("should handle networks with constraints gracefully", () => {
      const constrainedState: NetworkState = {
        activeUsers: createActiveUserCount(1000),
        totalConnections: 1000,
        density: createNetworkDensity(0.002),
        averageDegree: 2,
        clusteringCoefficient: 0.01,
        diameter: 20,
      };

      const strictConstraints = {
        maxConnections: 5000, // Very strict
        qualityThreshold: 0.95, // Very high
        maintenanceCost: createPMC(10000), // Very expensive
      };

      const optimization = service.optimizeNetworkDensity(
        constrainedState,
        createActiveUserCount(2000),
        strictConstraints
      );

      expect(Array.isArray(optimization.recommendedActions)).toBe(true);
      expect(optimization.recommendedActions.length).toBeGreaterThan(0);
    });
  });

  describe("Integration with Economic Value Objects", () => {
    it("should properly integrate with PMP/PMC economic system", () => {
      const userCount = createActiveUserCount(1000);
      const valuePerConnection = createPMP(5);

      const metcalfeValue = service.calculateMetcalfeValue(
        userCount,
        valuePerConnection
      );

      // Metcalfe value should be used in economic calculations
      expect(typeof metcalfeValue).toBe("number");
      expect(metcalfeValue).toBeGreaterThan(0);

      // Should be compatible with PMC values
      const maintenanceCost = createPMC(Math.floor(metcalfeValue * 0.1));
      expect(typeof maintenanceCost).toBe("number");
    });

    it("should handle large-scale economic calculations", () => {
      const largeNetwork = createActiveUserCount(100000);
      const economicValue = createPMP(10);

      const startTime = Date.now();
      const result = service.calculateMetcalfeValue(
        largeNetwork,
        economicValue
      );
      const endTime = Date.now();

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});
