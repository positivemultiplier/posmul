/**
 * Economy Kernel Service
 *
 * PosMul 플랫폼의 공유 경제 커널로, 모든 도메인에서 읽기 전용으로 PMP/PMC 잔액을 조회할 수 있습니다.
 * Shared Kernel 패턴을 구현하여 경제 시스템의 무결성을 보장하고,
 * Domain Events를 통해서만 경제 데이터의 변경을 허용합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { Result, UserId } from "@posmul/shared-types";
/**
 * Economy Kernel 오류 타입
 */
export declare class EconomyKernelError extends Error {
    readonly code: "USER_NOT_FOUND" | "INSUFFICIENT_BALANCE" | "INVALID_CURRENCY_TYPE" | "SERVICE_UNAVAILABLE" | "REPOSITORY_ERROR";
    readonly cause?: Error | undefined;
    constructor(message: string, code: "USER_NOT_FOUND" | "INSUFFICIENT_BALANCE" | "INVALID_CURRENCY_TYPE" | "SERVICE_UNAVAILABLE" | "REPOSITORY_ERROR", cause?: Error | undefined);
}
/**
 * PMP 계정 인터페이스
 */
export interface PmpAccount {
    readonly userId: UserId;
    readonly balance: number;
    readonly totalEarned: number;
    readonly totalSpent: number;
    readonly lastActivityAt: Date;
    readonly createdAt: Date;
}
/**
 * PMC 계정 인터페이스
 */
export interface PmcAccount {
    readonly userId: UserId;
    readonly balance: number;
    readonly totalEarned: number;
    readonly totalSpent: number;
    readonly lastActivityAt: Date;
    readonly createdAt: Date;
}
/**
 * 경제 시스템 전체 통계
 */
export interface EconomySystemStats {
    readonly totalPmpSupply: number;
    readonly totalPmcSupply: number;
    readonly activeAccountCount: number;
    readonly totalTransactionCount: number;
    readonly lastUpdated: Date;
}
/**
 * 경제 커널 리포지토리 인터페이스
 * Infrastructure 계층에서 구현됩니다.
 */
export interface IEconomyKernelRepository {
    /**
     * PMP 잔액 조회
     */
    getPmpBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;
    /**
     * PMC 잔액 조회
     */
    getPmcBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;
    /**
     * PMP 계정 정보 조회
     */
    getPmpAccount(userId: UserId): Promise<Result<PmpAccount, EconomyKernelError>>;
    /**
     * PMC 계정 정보 조회
     */
    getPmcAccount(userId: UserId): Promise<Result<PmcAccount, EconomyKernelError>>;
    /**
     * 경제 시스템 통계 조회
     */
    getSystemStats(): Promise<Result<EconomySystemStats, EconomyKernelError>>;
    /**
     * 사용자 PMP 잔액이 특정 금액 이상인지 확인
     */
    hasSufficientPmp(userId: UserId, amount: number): Promise<Result<boolean, EconomyKernelError>>;
    /**
     * 사용자 PMC 잔액이 특정 금액 이상인지 확인
     */
    hasSufficientPmc(userId: UserId, amount: number): Promise<Result<boolean, EconomyKernelError>>;
}
/**
 * Economy Kernel Singleton Service
 *
 * 이 서비스는 시스템 전체에서 단일 인스턴스로 관리되며,
 * 모든 도메인에서 경제 데이터를 읽기 전용으로 접근할 수 있게 합니다.
 *
 * 중요: 이 서비스는 오직 읽기 작업만 수행하며,
 * 모든 쓰기 작업은 도메인 이벤트를 통해서만 수행됩니다.
 */
export declare class EconomyKernel {
    private static instance;
    private repository;
    /**
     * 외부에서 직접 인스턴스화 방지
     */
    private constructor();
    /**
     * 싱글톤 인스턴스 획득
     */
    static getInstance(): EconomyKernel;
    /**
     * 리포지토리 주입 (Infrastructure 계층에서 호출)
     */
    injectRepository(repository: IEconomyKernelRepository): void;
    /**
     * 리포지토리 존재 여부 확인
     */
    private ensureRepository;
    /**
     * 사용자 PMP 잔액 조회
     *
     * @param userId 사용자 ID
     * @returns PMP 잔액 (숫자)
     */
    getPmpBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;
    /**
     * 사용자 PMC 잔액 조회
     *
     * @param userId 사용자 ID
     * @returns PMC 잔액 (숫자)
     */
    getPmcBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;
    /**
     * PMP 계정 정보 상세 조회
     *
     * @param userId 사용자 ID
     * @returns PMP 계정 정보
     */
    getPmpAccount(userId: UserId): Promise<Result<PmpAccount, EconomyKernelError>>;
    /**
     * PMC 계정 정보 상세 조회
     *
     * @param userId 사용자 ID
     * @returns PMC 계정 정보
     */
    getPmcAccount(userId: UserId): Promise<Result<PmcAccount, EconomyKernelError>>;
    /**
     * PMP 잔액 충분성 확인
     *
     * @param userId 사용자 ID
     * @param requiredAmount 필요한 PMP 금액
     * @returns 잔액 충분성 여부
     */
    canSpendPmp(userId: UserId, requiredAmount: number): Promise<Result<boolean, EconomyKernelError>>;
    /**
     * PMC 잔액 충분성 확인
     *
     * @param userId 사용자 ID
     * @param requiredAmount 필요한 PMC 금액
     * @returns 잔액 충분성 여부
     */
    canSpendPmc(userId: UserId, requiredAmount: number): Promise<Result<boolean, EconomyKernelError>>;
    /**
     * 경제 시스템 전체 통계 조회
     *
     * @returns 시스템 통계
     */
    getSystemStats(): Promise<Result<EconomySystemStats, EconomyKernelError>>;
    /**
     * 여러 사용자의 PMP 잔액을 일괄 조회
     *
     * @param userIds 사용자 ID 배열
     * @returns 사용자별 PMP 잔액 맵
     */
    getBulkPmpBalances(userIds: UserId[]): Promise<Result<Map<UserId, number>, EconomyKernelError>>;
    /**
     * 여러 사용자의 PMC 잔액을 일괄 조회
     *
     * @param userIds 사용자 ID 배열
     * @returns 사용자별 PMC 잔액 맵
     */
    getBulkPmcBalances(userIds: UserId[]): Promise<Result<Map<UserId, number>, EconomyKernelError>>;
    /**
     * 인스턴스 초기화 (테스트용)
     */
    static resetInstance(): void;
}
/**
 * Economy Kernel 전역 인스턴스 획득 헬퍼 함수
 */
export declare const getEconomyKernel: () => EconomyKernel;
