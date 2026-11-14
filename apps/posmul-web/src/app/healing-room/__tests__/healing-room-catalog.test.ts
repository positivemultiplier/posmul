import {
  ALL_HEALING_ITEMS,
  computeHonorTrophies,
  findHealingItemById,
} from "../healing-room-catalog";

describe("healing-room-catalog", () => {
  it("카탈로그의 모든 아이템 ID가 고유하며 PMP 가격이 0 이상이다", () => {
    const ids = ALL_HEALING_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of ALL_HEALING_ITEMS) {
      expect(item.pricePmp).toBeGreaterThanOrEqual(0);
    }
    expect(findHealingItemById("sleeping-cat")?.name).toBe("낮잠 치즈냥");
  });

  it("활동 실적이 없는 초기 유저는 모든 명예 트로피가 미해금 상태다", () => {
    const trophies = computeHonorTrophies({
      donationCount: 0,
      totalDonatedPmc: 0,
      createdGamesCount: 0,
      predictionCount: 0,
      totalVisits: 5,
      guestbookCount: 1,
    });

    expect(trophies).toHaveLength(6);
    expect(trophies.every((t) => !t.unlocked)).toBe(true);
  });

  it("기부·게임개설·예측참여·방문 조건을 충족하면 해당 명예 트로피가 해금된다", () => {
    const trophies = computeHonorTrophies({
      donationCount: 2,
      totalDonatedPmc: 1500,
      createdGamesCount: 1,
      predictionCount: 12,
      totalVisits: 60,
      guestbookCount: 3,
    });

    expect(trophies.every((t) => t.unlocked)).toBe(true);
  });
});
