import {
  calculateStakeConvictionRatio,
  clampDeliberationSec,
  computeRevealedConfidence,
} from "../decision-telemetry.types";

describe("decision-telemetry pure helpers", () => {
  it("clampDeliberationSec은 0~86400초 범위로 안전하게 변환한다", () => {
    expect(clampDeliberationSec(-500)).toBe(0);
    expect(clampDeliberationSec(45400)).toBe(45);
    expect(clampDeliberationSec(200_000_000)).toBe(86400);
  });

  it("calculateStakeConvictionRatio는 보유 PMP 대비 참여 비율을 0~1 사이로 계산한다", () => {
    expect(calculateStakeConvictionRatio(1000, 10000)).toBe(0.1);
    expect(calculateStakeConvictionRatio(5000, 2000)).toBe(1);
    expect(calculateStakeConvictionRatio(0, 1000)).toBe(0);
  });

  it("computeRevealedConfidence는 참여 비율·숙고시간·열람여부에 따라 0.50~0.95 확신도를 산출한다", () => {
    const low = computeRevealedConfidence({
      stakeConvictionRatio: 0.01,
      deliberationSec: 2,
      viewedBriefing: false,
      viewedAiForecasts: false,
    });
    const high = computeRevealedConfidence({
      stakeConvictionRatio: 0.5,
      deliberationSec: 90,
      viewedBriefing: true,
      viewedAiForecasts: true,
    });

    expect(low).toBeGreaterThanOrEqual(0.5);
    expect(low).toBeLessThan(0.6);
    expect(high).toBe(0.95);
  });
});
