import { Result } from "../../types/common";
import { EconomyKernelError } from "./economy-kernel.service";
export interface DailyPrizePoolResult {
    totalDailyPool: number;
    ebitBased: number;
    redistributedPmc: number;
    enterprisePmc: number;
    calculatedAt: Date;
}
export declare class MoneyWaveCalculatorService {
    private readonly expectedAnnualEbit;
    private static readonly EBIT_DAILY_RATIO;
    private static readonly TAX_RATE;
    private static readonly INTEREST_RATE;
    constructor(expectedAnnualEbit?: number);
    /**
     * MoneyWave1: 일일 상금 풀 계산
     * 매일 자정(00:00)에 호출됨
     */
    calculateDailyPrizePool(): Promise<Result<DailyPrizePoolResult, EconomyKernelError>>;
    /**
     * 게임별 상금 배정
     * 중요도와 난이도에 따른 차등 배분
     */
    allocatePrizePoolToGame(totalDailyPool: number, gameImportanceScore: number, gameEndTime: Date): Promise<number>;
    /**
     * 게임 중요도 점수에 따른 기본 배정 비율 계산
     */
    private calculateBaseAllocationRatio;
    /**
     * MoneyWave2: 미소비 PMC 재분배 금액 계산
     * 실제 구현에서는 DB에서 일정 기간 미사용 PMC 조회
     */
    private calculateRedistributedPmc;
    /**
     * MoneyWave3: 기업가 제공 PMC 계산
     * 실제 구현에서는 DB에서 기업가가 제공한 PMC 조회
     */
    private calculateEnterprisePmc;
    /**
     * 예상 EBIT 업데이트
     */
    updateExpectedEbit(newEbit: number): void;
}
