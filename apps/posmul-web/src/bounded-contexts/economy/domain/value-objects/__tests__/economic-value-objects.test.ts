/**
 * @fileoverview 경제 값 객체 테스트
 * @description Economic Value Objects에 대한 기본 테스트 케이스
 * @author Economy Domain - Test Team
 * @version 1.0.0
 */
import {
  createBetaCoefficient,
  createEBIT,
  createExpectedReturn,
  createGiniCoefficient,
  createMarketRiskPremium,
  createMoneyWaveAmount,
  createNetworkDensity,
  createPmcAmount,
  createPmpAmount,
  createPredictionAccuracy,
  createRiskFreeRate,
} from "../economic-value-objects";

describe("Economic Value Objects", () => {
  describe("CAPM Related Value Objects", () => {
    it("should create valid ExpectedReturn", () => {
      const validReturns = [0.05, 0.1, 0.15];

      validReturns.forEach((value) => {
        const result = createExpectedReturn(value);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should create valid RiskFreeRate", () => {
      const validRates = [0.01, 0.05, 0.1];

      validRates.forEach((rate) => {
        const result = createRiskFreeRate(rate);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should create BetaCoefficient", () => {
      const validBetas = [0.5, 1.0, 1.5, 2.0];

      validBetas.forEach((beta) => {
        const result = createBetaCoefficient(beta);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should create MarketRiskPremium", () => {
      const validPremiums = [0.02, 0.06, 0.08];

      validPremiums.forEach((premium) => {
        const result = createMarketRiskPremium(premium);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });
  });

  describe("Inequality and Distribution", () => {
    it("should create valid GiniCoefficient", () => {
      const validCoefficients = [0.0, 0.25, 0.5, 0.75, 1.0];

      validCoefficients.forEach((coef) => {
        const result = createGiniCoefficient(coef);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should reject invalid GiniCoefficient values", () => {
      const invalidCoefficients = [-0.1, 1.1];

      invalidCoefficients.forEach((coef) => {
        expect(() => createGiniCoefficient(coef)).toThrow();
      });
    });
  });

  describe("Network Economics", () => {
    it("should create valid NetworkDensity", () => {
      const validDensities = [0.1, 0.5, 0.8, 1.0];

      validDensities.forEach((density) => {
        const result = createNetworkDensity(density);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should reject invalid NetworkDensity values", () => {
      const invalidDensities = [-0.1, 1.1];

      invalidDensities.forEach((density) => {
        expect(() => createNetworkDensity(density)).toThrow();
      });
    });
  });

  describe("Money Wave System", () => {
    it("should create valid MoneyWaveAmount", () => {
      const validAmounts = [100, 1000, 10000];

      validAmounts.forEach((amount) => {
        const result = createMoneyWaveAmount(amount);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should reject invalid MoneyWaveAmount values", () => {
      const invalidAmounts = [-100, -1]; // 음수만 invalid

      invalidAmounts.forEach((amount) => {
        expect(() => createMoneyWaveAmount(amount)).toThrow();
      });
    });

    it("should create PmpAmount for safe assets", () => {
      const validAmounts = [1000, 5000, 10000];

      validAmounts.forEach((amount) => {
        const result = createPmpAmount(amount);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should create PmcAmount for risky assets", () => {
      const validAmounts = [500, 2000, 8000];

      validAmounts.forEach((amount) => {
        const result = createPmcAmount(amount);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });
  });

  describe("Financial Metrics", () => {
    it("should create EBIT values including negative", () => {
      const validEBITs = [-1000, 0, 5000, 15000];

      validEBITs.forEach((ebit) => {
        const result = createEBIT(ebit);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });

    it("should create valid PredictionAccuracy", () => {
      const validAccuracies = [0.7, 0.85, 0.95];

      validAccuracies.forEach((accuracy) => {
        const result = createPredictionAccuracy(accuracy);
        expect(result).toBeDefined();
        expect(typeof result).toBe("number");
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw errors for invalid inputs", () => {
      // Negative values where not allowed
      expect(() => createPmpAmount(-100)).toThrow();
      expect(() => createPmcAmount(-50)).toThrow();
      expect(() => createMoneyWaveAmount(-10)).toThrow();

      // Out of range values
      expect(() => createGiniCoefficient(-0.1)).toThrow();
      expect(() => createGiniCoefficient(1.1)).toThrow();
      expect(() => createNetworkDensity(-0.1)).toThrow();
      expect(() => createNetworkDensity(1.1)).toThrow();

      // Non-finite values
      expect(() => createEBIT(Infinity)).toThrow();
      expect(() => createEBIT(NaN)).toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety for all value objects", () => {
      const expectedReturn = createExpectedReturn(0.1);
      const riskFreeRate = createRiskFreeRate(0.03);
      const beta = createBetaCoefficient(1.2);
      const gini = createGiniCoefficient(0.4);

      expect(typeof expectedReturn).toBe("number");
      expect(typeof riskFreeRate).toBe("number");
      expect(typeof beta).toBe("number");
      expect(typeof gini).toBe("number");

      // Values should be preserved
      expect(expectedReturn).toBe(0.1);
      expect(riskFreeRate).toBe(0.03);
      expect(beta).toBe(1.2);
      expect(gini).toBe(0.4);
    });
  });

  describe("Business Logic Validation", () => {
    it("should enforce domain constraints", () => {
      // Gini coefficient must be between 0 and 1
      expect(() => createGiniCoefficient(-0.01)).toThrow();
      expect(() => createGiniCoefficient(1.01)).toThrow();
      expect(createGiniCoefficient(0.0)).toBe(0.0);
      expect(createGiniCoefficient(1.0)).toBe(1.0);

      // Network density must be between 0 and 1
      expect(() => createNetworkDensity(-0.01)).toThrow();
      expect(() => createNetworkDensity(1.01)).toThrow();
      expect(createNetworkDensity(0.0)).toBe(0.0);
      expect(createNetworkDensity(1.0)).toBe(1.0);

      // Money amounts must be non-negative (0 is allowed)
      expect(createMoneyWaveAmount(0)).toBe(0); // 0 is valid
      expect(() => createPmpAmount(-1)).toThrow();
      expect(() => createPmcAmount(-1)).toThrow();
    });
  });
});
