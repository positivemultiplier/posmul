import {
  computeHourglassMetrics,
  getKstHourSecondsLeft,
} from "../hourglass-metrics";

describe("MoneyWave 황금 모래시계 수치/기하학 계산 (computeHourglassMetrics)", () => {
  it("회차 시작 시점(elapsed=0)에 하단 황금은 35%부터 시작하고 바닥 위로 뚜렷한 봉우리를 형성한다", () => {
    const start = computeHourglassMetrics(0);
    expect(start.goldFillRatio).toBeCloseTo(0.35, 5);
    expect(start.displayPercent).toBe(35);
    // 바닥(y=116) 기준 17px 이상 솟아올라 있어야 함
    expect(116 - start.pilePeakY).toBeGreaterThanOrEqual(17);
    expect(start.pilePeakY).toBeLessThan(start.pileShoulderY);
    expect(start.topWaterRatio).toBeCloseTo(0.65, 5);
  });

  it("시간이 경과할수록 상단 물은 줄어들고(topSurfaceY 증가) 하단 황금은 쌓여 올라간다(pilePeakY 감소)", () => {
    const t0 = computeHourglassMetrics(0);
    const t50 = computeHourglassMetrics(0.5);
    const t100 = computeHourglassMetrics(1);

    expect(t50.displayPercent).toBeGreaterThan(t0.displayPercent);
    expect(t100.displayPercent).toBe(100);

    // 상단 수면은 위(작은 y)에서 목(63) 쪽으로 내려옴
    expect(t50.topSurfaceY).toBeGreaterThan(t0.topSurfaceY);
    expect(t100.topSurfaceY).toBeGreaterThan(t50.topSurfaceY);

    // 하단 황금 봉우리는 바닥(116)에서 목(67) 쪽으로 올라감
    expect(t50.pilePeakY).toBeLessThan(t0.pilePeakY);
    expect(t100.pilePeakY).toBeLessThan(t50.pilePeakY);
  });

  it("100% 충전 시점에도 황금 봉우리가 목을 침범하지 않고 낙하 스트림 거리가 양수로 유지된다", () => {
    const full = computeHourglassMetrics(1);
    expect(full.pilePeakY).toBeGreaterThan(67);
    expect(full.dropDistance).toBeGreaterThanOrEqual(6);
  });

  it("getKstHourSecondsLeft는 정각 기준 1~3600초 범위를 정확히 계산한다", () => {
    expect(getKstHourSecondsLeft(new Date("2026-11-11T12:00:00Z"))).toBe(3600);
    expect(getKstHourSecondsLeft(new Date("2026-11-11T12:21:04Z"))).toBe(2336);
    expect(getKstHourSecondsLeft(new Date("2026-11-11T12:59:59Z"))).toBe(1);
  });
});
