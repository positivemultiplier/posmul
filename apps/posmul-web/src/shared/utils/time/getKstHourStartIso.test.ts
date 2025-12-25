import { getKstHourStartIso } from "./getKstHourStartIso";

describe("getKstHourStartIso", () => {
  it("KST 기준 정각으로 절삭한 값을 UTC ISO(Z)로 반환한다", () => {
    // 2025-12-25 20:37:00 KST == 2025-12-25 11:37:00Z
    const now = new Date("2025-12-25T11:37:00.000Z");
    const hourStart = getKstHourStartIso(now);

    // 2025-12-25 20:00:00 KST == 2025-12-25 11:00:00Z
    expect(hourStart).toBe("2025-12-25T11:00:00.000Z");
  });

  it("KST 날짜 경계를 넘는 경우도 올바르게 처리한다", () => {
    // 2025-12-25 00:10:00 KST == 2025-12-24 15:10:00Z
    const now = new Date("2025-12-24T15:10:00.000Z");
    const hourStart = getKstHourStartIso(now);

    // 2025-12-25 00:00:00 KST == 2025-12-24 15:00:00Z
    expect(hourStart).toBe("2025-12-24T15:00:00.000Z");
  });
});
