import {
  formatPmpAmount,
  formatPmcAmount,
  calculateConversionRate,
  calculatePmpFromPmc,
  validateTransaction,
  PmpEarnedEvent,
  type PmpAmount,
  type PmcAmount,
} from "@posmul/auth-economy-sdk";

describe("@posmul/auth-economy-sdk 경제 유틸 & 도메인 이벤트 계약 검증", () => {
  it("PMP/PMC 금액을 정상 단위('PMP', 'PMC')로 포맷팅한다", () => {
    expect(formatPmpAmount(1000)).toBe("1,000 PMP");
    expect(formatPmcAmount(250)).toBe("250 PMC");
  });

  it("PMP↔PMC 환산 유틸이 10 PMP = 1 PMC 왕복 일관성을 유지한다", () => {
    const pmc = calculateConversionRate(1000 as PmpAmount);
    expect(Number(pmc)).toBeCloseTo(100);
    const backToPmp = calculatePmpFromPmc(pmc as PmcAmount);
    expect(Number(backToPmp)).toBeCloseTo(1000);
  });

  it("거래 금액 유효성 검증이 0 이하 및 잔액 부족을 차단한다", () => {
    expect(validateTransaction(500 as PmpAmount, 0 as PmpAmount).isValid).toBe(false);
    expect(validateTransaction(500 as PmpAmount, 600 as PmpAmount).isValid).toBe(false);
    expect(validateTransaction(500 as PmpAmount, 500 as PmpAmount).isValid).toBe(true);
  });

  it("BaseDomainEvent가 크로스 런타임 환경에서 고유 ID를 생성한다", () => {
    const e1 = new PmpEarnedEvent("user-1", 100, "forum_post");
    const e2 = new PmpEarnedEvent("user-1", 100, "forum_post");
    expect(e1.id).toBeTruthy();
    expect(e2.id).toBeTruthy();
    expect(e1.id).not.toBe(e2.id);
  });
});
