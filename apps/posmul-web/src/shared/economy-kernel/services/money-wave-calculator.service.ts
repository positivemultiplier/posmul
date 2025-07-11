import { Result } from "../../types/common";
import { EconomyKernelError } from "./economy-kernel.service";

export interface DailyPrizePoolResult {
  totalDailyPool: number;
  ebitBased: number;
  redistributedPmc: number; // MoneyWave2
  enterprisePmc: number; // MoneyWave3
  calculatedAt: Date;
}

export class MoneyWaveCalculatorService {
  private static readonly EBIT_DAILY_RATIO = 1 / 365; // 연간 EBIT의 1/365
  private static readonly TAX_RATE = 0.25; // 법인세율 25%
  private static readonly INTEREST_RATE = 0.03; // 이자율 3%

  constructor(
    private readonly expectedAnnualEbit: number = 1000000 // 기본값: 100만원
  ) {}

  /**
   * MoneyWave1: 일일 상금 풀 계산
   * 매일 자정(00:00)에 호출됨
   */
  async calculateDailyPrizePool(): Promise<
    Result<DailyPrizePoolResult, EconomyKernelError>
  > {
    try {
      // EBIT 기반 계산: (예상 EBIT - Tax - Interest) / 365
      const netEbit =
        this.expectedAnnualEbit *
        (1 -
          MoneyWaveCalculatorService.TAX_RATE -
          MoneyWaveCalculatorService.INTEREST_RATE);
      const ebitBasedPool =
        netEbit * MoneyWaveCalculatorService.EBIT_DAILY_RATIO;

      // MoneyWave2: 미소비 PmcAmount 재분배 (실제로는 DB에서 조회)
      const redistributedPmc = await this.calculateRedistributedPmc();

      // MoneyWave3: 기업가 제공 PmcAmount (실제로는 DB에서 조회)
      const enterprisePmc = await this.calculateEnterprisePmc();

      const totalDailyPool = ebitBasedPool + redistributedPmc + enterprisePmc;

      return {
        success: true,
        data: {
          totalDailyPool,
          ebitBased: ebitBasedPool,
          redistributedPmc,
          enterprisePmc,
          calculatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          "Failed to calculate daily prize pool",
          "SERVICE_UNAVAILABLE",
          new Error(error instanceof Error ? error.message : String(error) )
        ),
      };
    }
  }

  /**
   * 게임별 상금 배정
   * 중요도와 난이도에 따른 차등 배분
   */
  async allocatePrizePoolToGame(
    totalDailyPool: number,
    gameImportanceScore: number,
    gameEndTime: Date
  ): Promise<number> {
    // 하루 중 남은 시간 비율 계산
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const timeRemainingRatio = Math.max(
      0,
      (todayEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    // 게임 중요도에 따른 기본 배정 비율
    const baseAllocationRatio =
      this.calculateBaseAllocationRatio(gameImportanceScore);

    // 시간 보정: 하루 중 늦게 생성된 게임은 상대적으로 적은 배정
    const timeAdjustedRatio =
      baseAllocationRatio * (0.3 + 0.7 * timeRemainingRatio);

    return Math.floor(totalDailyPool * timeAdjustedRatio);
  }

  /**
   * 게임 중요도 점수에 따른 기본 배정 비율 계산
   */
  private calculateBaseAllocationRatio(importanceScore: number): number {
    // 중요도 점수 1.0~5.0을 0.05~0.25 비율로 매핑
    // 하루에 약 4~20개 게임이 생성된다고 가정
    const minRatio = 0.05; // 5%
    const maxRatio = 0.25; // 25%
    const normalizedScore = (importanceScore - 1.0) / 4.0; // 0~1로 정규화

    return minRatio + (maxRatio - minRatio) * normalizedScore;
  }

  /**
   * MoneyWave2: 미소비 PmcAmount 재분배 금액 계산
   * 실제 구현에서는 DB에서 일정 기간 미사용 PmcAmount 조회
   */
  private async calculateRedistributedPmc(): Promise<number> {
    // TODO: 실제 DB에서 미소비 PmcAmount 조회
    // 현재는 임시값 반환
    return 50000; // 5만원 상당
  }

  /**
   * MoneyWave3: 기업가 제공 PmcAmount 계산
   * 실제 구현에서는 DB에서 기업가가 제공한 PmcAmount 조회
   */
  private async calculateEnterprisePmc(): Promise<number> {
    // TODO: 실제 DB에서 기업가 PmcAmount 조회
    // 현재는 임시값 반환
    return 30000; // 3만원 상당
  }

  /**
   * 예상 EBIT 업데이트
   */
  updateExpectedEbit(newEbit: number): void {
    // 실제 구현에서는 검증 로직 추가 필요
    if (newEbit > 0) {
      Object.defineProperty(this, "expectedAnnualEbit", {
        value: newEbit,
        writable: false,
      });
    }
  }
}
