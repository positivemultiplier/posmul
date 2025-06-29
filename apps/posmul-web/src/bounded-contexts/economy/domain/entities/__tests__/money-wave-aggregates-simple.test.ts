/**
 * MoneyWave Aggregates 기본 테스트
 */

import { DomainError } from "@posmul/shared-types";
import {
  createMoneyWaveId,
  createPMC,
  MoneyWaveType,
} from "../../value-objects";
import {
  MoneyWave1Aggregate,
  MoneyWave1Status,
} from "../money-wave1.aggregate";
import {
  MoneyWave2Aggregate,
  MoneyWave2Status,
} from "../money-wave2.aggregate";
import {
  MoneyWave3Aggregate,
  MoneyWave3Status,
} from "../money-wave3.aggregate";

describe("MoneyWave Aggregates", () => {
  describe("MoneyWave1Aggregate", () => {
    it("should create successfully with valid policy", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE1, new Date());
      const policy = {
        emissionRate: 0.5,
        agencyScoreThreshold: 0.3,
        riskAdjustmentFactor: 1.0,
      };

      const result = MoneyWave1Aggregate.create(id, policy);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getStatus()).toBe(MoneyWave1Status.PENDING_EBIT);
        expect(result.data.getId()).toBe(id);
      }
    });

    it("should reject invalid emission rate", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE1, new Date());
      const invalidPolicy = {
        emissionRate: 1.5, // Invalid: > 1.0
        agencyScoreThreshold: 0.3,
        riskAdjustmentFactor: 1.0,
      };

      const result = MoneyWave1Aggregate.create(id, invalidPolicy);

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as DomainError;
        expect(error.code).toBe("INVALID_EMISSION_RATE");
      }
    });

    it("should validate business invariants", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE1, new Date());
      const policy = {
        emissionRate: 0.5,
        agencyScoreThreshold: 0.3,
        riskAdjustmentFactor: 1.0,
      };

      const result = MoneyWave1Aggregate.create(id, policy);
      expect(result.success).toBe(true);

      if (result.success) {
        const invariantResult = result.data.validateInvariants();
        expect(invariantResult.success).toBe(true);
      }
    });
  });

  describe("MoneyWave2Aggregate", () => {
    it("should create successfully with valid redistribution policy", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE2, new Date());
      const policy = {
        dormancyPeriodMonths: 6,
        redistributionRate: 0.3,
        giniThreshold: 0.4,
        minimumPoolSize: createPMC(10000),
        maxRedistributionPerCycle: createPMC(1000000),
      };

      const result = MoneyWave2Aggregate.create(id, policy);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getStatus()).toBe(MoneyWave2Status.SCANNING);
        expect(result.data.getId()).toBe(id);
      }
    });

    it("should reject invalid redistribution rate", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE2, new Date());
      const invalidPolicy = {
        dormancyPeriodMonths: 6,
        redistributionRate: 1.5, // Invalid: > 0.8
        giniThreshold: 0.4,
        minimumPoolSize: createPMC(10000),
        maxRedistributionPerCycle: createPMC(1000000),
      };

      const result = MoneyWave2Aggregate.create(id, invalidPolicy);

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as DomainError;
        expect(error.code).toBe("INVALID_REDISTRIBUTION_RATE");
      }
    });

    it("should validate business invariants", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE2, new Date());
      const policy = {
        dormancyPeriodMonths: 6,
        redistributionRate: 0.3,
        giniThreshold: 0.4,
        minimumPoolSize: createPMC(10000),
        maxRedistributionPerCycle: createPMC(1000000),
      };

      const result = MoneyWave2Aggregate.create(id, policy);
      expect(result.success).toBe(true);

      if (result.success) {
        const invariantResult = result.data.validateInvariants();
        expect(invariantResult.success).toBe(true);
      }
    });
  });

  describe("MoneyWave3Aggregate", () => {
    it("should create successfully with valid investment pool", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE3, new Date());
      const investmentPool = createPMC(1000000);

      const result = MoneyWave3Aggregate.create(id, investmentPool);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getStatus()).toBe(
          MoneyWave3Status.ECOSYSTEM_BUILDING
        );
        expect(result.data.getId()).toBe(id);
      }
    });

    it("should reject zero investment pool", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE3, new Date());
      const invalidPool = createPMC(0);

      const result = MoneyWave3Aggregate.create(id, invalidPool);

      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error as DomainError;
        expect(error.code).toBe("INVALID_INVESTMENT_POOL");
      }
    });

    it("should validate business invariants", () => {
      const id = createMoneyWaveId(MoneyWaveType.WAVE3, new Date());
      const investmentPool = createPMC(1000000);

      const result = MoneyWave3Aggregate.create(id, investmentPool);
      expect(result.success).toBe(true);

      if (result.success) {
        const invariantResult = result.data.validateInvariants();
        expect(invariantResult.success).toBe(true);
      }
    });
  });
});
