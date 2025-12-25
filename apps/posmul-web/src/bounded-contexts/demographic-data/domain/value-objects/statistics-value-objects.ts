/**
 * Demographic Statistics Value Objects (인구통계)
 * demographic-data bounded context의 값 객체들
 */

// 통계 카테고리 Enum
export enum StatCategory {
  BIRTH = "BIRTH", // 출생
  DEATH = "DEATH", // 사망
  MARRIAGE = "MARRIAGE", // 혼인
  DIVORCE = "DIVORCE", // 이혼
  MIGRATION_IN = "MIGRATION_IN", // 전입
  MIGRATION_OUT = "MIGRATION_OUT", // 전출
  EMPLOYMENT = "EMPLOYMENT", // 취업자
  UNEMPLOYMENT = "UNEMPLOYMENT", // 실업률
  LABOR_FORCE = "LABOR_FORCE", // 경제활동인구
  CPI = "CPI", // 소비자물가지수
  POPULATION = "POPULATION", // 총인구
}

// 기간 타입 Enum
export enum PeriodType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

/**
 * 통계 기간 Value Object
 */
export interface StatisticPeriod {
  readonly type: PeriodType;
  readonly year: number;
  readonly month?: number; // 1-12 (월간)
  readonly quarter?: number; // 1-4 (분기)
}

/**
 * 통계 기간 생성
 */
export const createStatisticPeriod = (
  type: PeriodType,
  year: number,
  month?: number,
  quarter?: number
): StatisticPeriod => {
  if (year < 1900 || year > 2100) {
    throw new Error("Invalid year");
  }

  if (type === PeriodType.MONTHLY) {
    if (!month || month < 1 || month > 12) {
      throw new Error("Monthly period requires valid month (1-12)");
    }
    return { type, year, month };
  }

  if (type === PeriodType.QUARTERLY) {
    if (!quarter || quarter < 1 || quarter > 4) {
      throw new Error("Quarterly period requires valid quarter (1-4)");
    }
    return { type, year, quarter };
  }

  // YEARLY
  return { type, year };
};
