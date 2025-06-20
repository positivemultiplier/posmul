import { describe, expect, it } from "@jest/globals";
import {
  createActiveUserCount,
  createPMP,
} from "../../value-objects/economic-value-objects";
import { NetworkEconomicsEngine } from "../network-economics.service";

describe("NetworkEconomicsEngine", () => {
  let service: NetworkEconomicsEngine;

  beforeEach(() => {
    service = new NetworkEconomicsEngine();
  });

  describe("Metcalfe's Law", () => {
    it("should calculate network value using Metcalfe's Law", () => {
      const userCount = createActiveUserCount(1000);
      const valuePerConnection = createPMP(2); // Use integer value

      const result = service.calculateMetcalfeValue(
        userCount,
        valuePerConnection
      );

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should handle zero network size", () => {
      const userCount = createActiveUserCount(0);
      const valuePerConnection = createPMP(1);

      const result = service.calculateMetcalfeValue(
        userCount,
        valuePerConnection
      );

      expect(Math.abs(result)).toBe(0);
    });

    it("should handle large network sizes", () => {
      const userCount = createActiveUserCount(10000);
      const valuePerConnection = createPMP(1); // Use integer value

      const result = service.calculateMetcalfeValue(
        userCount,
        valuePerConnection
      );

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("Reed's Law", () => {
    it("should calculate exponential network value using Reed's Law", () => {
      const userCount = createActiveUserCount(10);
      const groupFormationRate = 0.1;

      const result = service.calculateReedValue(userCount, groupFormationRate);

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should handle small network sizes in Reed's Law", () => {
      const userCount = createActiveUserCount(3);
      const groupFormationRate = 0.2;

      const result = service.calculateReedValue(userCount, groupFormationRate);

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should limit Reed's Law calculation for very large networks", () => {
      const userCount = createActiveUserCount(100);
      const groupFormationRate = 0.1;

      const result = service.calculateReedValue(userCount, groupFormationRate);

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it("should use default group formation rate", () => {
      const userCount = createActiveUserCount(5);

      const result = service.calculateReedValue(userCount);

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("Performance Tests", () => {
    it("should handle large networks efficiently", () => {
      const startTime = Date.now();

      const largeUserCount = createActiveUserCount(100000);
      const valuePerConnection = createPMP(1); // Use integer value

      const metcalfeResult = service.calculateMetcalfeValue(
        largeUserCount,
        valuePerConnection
      );
      const reedResult = service.calculateReedValue(largeUserCount, 0.001);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(metcalfeResult).toBeGreaterThan(0);
      expect(reedResult).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should prevent numerical overflow in calculations", () => {
      const extremeUserCount = createActiveUserCount(1000000);

      const metcalfeResult = service.calculateMetcalfeValue(
        extremeUserCount,
        createPMP(1.0)
      );
      const reedResult = service.calculateReedValue(extremeUserCount, 0.001);

      expect(metcalfeResult).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(reedResult).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      expect(Number.isFinite(metcalfeResult)).toBe(true);
      expect(Number.isFinite(reedResult)).toBe(true);
    });
  });
});
