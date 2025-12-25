import {
  computeRevealRatio,
  countCategories,
  buildMultiplierByCategory,
  resolveSelectedDbCategory,
} from "./wave-math";

describe("MoneyWave wave-math", () => {
  describe("computeRevealRatio", () => {
    it("progress=0이면 revealRatio=0.5", () => {
      const { revealRatio, progressAdjusted } = computeRevealRatio(0, 0, 0);
      expect(progressAdjusted).toBe(0);
      expect(revealRatio).toBe(0.5);
    });

    it("progress=1이면 revealRatio=1", () => {
      const { revealRatio, progressAdjusted } = computeRevealRatio(1, 0, 0);
      expect(progressAdjusted).toBe(1);
      expect(revealRatio).toBe(1);
    });

    it("revealRatio는 0.5~1 범위를 벗어나지 않는다", () => {
      for (const p of [-1, 0, 0.1, 0.5, 0.9, 1, 2]) {
        const { revealRatio } = computeRevealRatio(p, 0, 0);
        expect(revealRatio).toBeGreaterThanOrEqual(0.5);
        expect(revealRatio).toBeLessThanOrEqual(1);
      }
    });

    it("activityBoost가 커지면 같은 progress에서 revealRatio가 증가한다", () => {
      const base = computeRevealRatio(0.3, 0, 0).revealRatio;
      const boosted = computeRevealRatio(0.3, 5000, 200).revealRatio;
      expect(boosted).toBeGreaterThan(base);
    });

    it("progress가 증가하면 revealRatio는 단조 증가(비감소)한다", () => {
      const points = [0, 0.1, 0.2, 0.5, 0.8, 1];
      let prev = -Infinity;
      for (const p of points) {
        const current = computeRevealRatio(p, 0, 0).revealRatio;
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      }
    });
  });

  describe("countCategories / buildMultiplierByCategory", () => {
    it("countCategories는 category별 개수를 집계한다", () => {
      const rows: unknown[] = [
        { category: "SPORTS" },
        { category: "SPORTS" },
        { category: "POLITICS" },
        { category: 123 },
        {},
      ];
      const { counts, total } = countCategories(rows);
      expect(total).toBe(5);
      expect(counts.SPORTS).toBe(2);
      expect(counts.POLITICS).toBe(1);
    });

    it("buildMultiplierByCategory는 reward_multiplier를 number로 파싱해 기본값 1을 적용한다", () => {
      const rows: unknown[] = [
        { category: "SPORTS", reward_multiplier: "1.5" },
        { category: "POLITICS", reward_multiplier: null },
        { category: "INVEST", reward_multiplier: 2 },
      ];
      const multipliers = buildMultiplierByCategory(rows);
      expect(multipliers.SPORTS).toBe(1.5);
      expect(multipliers.POLITICS).toBe(1);
      expect(multipliers.INVEST).toBe(2);
    });
  });

  describe("resolveSelectedDbCategory", () => {
    it("prediction 도메인 + all이면 null", () => {
      expect(resolveSelectedDbCategory("prediction", "all")).toBeNull();
    });

    it("prediction 도메인 + sports이면 SPORTS", () => {
      expect(resolveSelectedDbCategory("prediction", "sports")).toBe("SPORTS");
    });

    it("다른 도메인이면 항상 null", () => {
      expect(resolveSelectedDbCategory("forum", "sports")).toBeNull();
    });
  });
});
