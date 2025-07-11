/**
 * Economy Kernel Service
 *
 * PosMul 플랫폼의 공유 경제 커널로, 모든 도메인에서 읽기 전용으로 PmpAmount/PmcAmount 잔액을 조회할 수 있습니다.
 * Shared Kernel 패턴을 구현하여 경제 시스템의 무결성을 보장하고,
 * Domain Events를 통해서만 경제 데이터의 변경을 허용합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { Result, UserId, isFailure } from "@posmul/auth-economy-sdk";
import { failure, success } from "@posmul/auth-economy-sdk";


/**
 * Economy Kernel 오류 타입
 */
export class EconomyKernelError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "USER_NOT_FOUND"
      | "INSUFFICIENT_BALANCE"
      | "INVALID_CURRENCY_TYPE"
      | "SERVICE_UNAVAILABLE"
      | "REPOSITORY_ERROR",
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "EconomyKernelError";
  }
}

/**
 * PmpAmount 계정 인터페이스
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
 * PmcAmount 계정 인터페이스
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
   * PmpAmount 잔액 조회
   */
  getPmpBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;

  /**
   * PmcAmount 잔액 조회
   */
  getPmcBalance(userId: UserId): Promise<Result<number, EconomyKernelError>>;

  /**
   * PmpAmount 계정 정보 조회
   */
  getPmpAccount(
    userId: UserId
  ): Promise<Result<PmpAccount, EconomyKernelError>>;

  /**
   * PmcAmount 계정 정보 조회
   */
  getPmcAccount(
    userId: UserId
  ): Promise<Result<PmcAccount, EconomyKernelError>>;

  /**
   * 경제 시스템 통계 조회
   */
  getSystemStats(): Promise<Result<EconomySystemStats, EconomyKernelError>>;

  /**
   * 사용자 PmpAmount 잔액이 특정 금액 이상인지 확인
   */
  hasSufficientPmp(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>>;

  /**
   * 사용자 PmcAmount 잔액이 특정 금액 이상인지 확인
   */
  hasSufficientPmc(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>>;
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
export class EconomyKernel {
  private static instance: EconomyKernel | null = null;
  private repository: IEconomyKernelRepository | null = null;

  /**
   * 외부에서 직접 인스턴스화 방지
   */
  private constructor() {}

  /**
   * 싱글톤 인스턴스 획득
   */
  public static getInstance(): EconomyKernel {
    if (!EconomyKernel.instance) {
      EconomyKernel.instance = new EconomyKernel();
    }
    return EconomyKernel.instance;
  }

  /**
   * 리포지토리 주입 (Infrastructure 계층에서 호출)
   */
  public injectRepository(repository: IEconomyKernelRepository): void {
    this.repository = repository;
  }

  /**
   * 리포지토리 존재 여부 확인
   */
  private ensureRepository(): Result<
    IEconomyKernelRepository,
    EconomyKernelError
  > {
    if (!this.repository) {
      return {
        success: false,
        error: new EconomyKernelError(
          "Economy Kernel repository not initialized",
          "SERVICE_UNAVAILABLE"
        ),
      };
    }
    return { success: true, data: this.repository };
  }

  /**
   * 사용자 PmpAmount 잔액 조회
   *
   * @param userId 사용자 ID
   * @returns PmpAmount 잔액 (숫자)
   */
  public async getPmpBalance(
    userId: UserId
  ): Promise<Result<number, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.getPmpBalance(userId);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to retrieve PmpAmount balance for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * 사용자 PmcAmount 잔액 조회
   *
   * @param userId 사용자 ID
   * @returns PmcAmount 잔액 (숫자)
   */
  public async getPmcBalance(
    userId: UserId
  ): Promise<Result<number, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.getPmcBalance(userId);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to retrieve PmcAmount balance for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * PmpAmount 계정 정보 상세 조회
   *
   * @param userId 사용자 ID
   * @returns PmpAmount 계정 정보
   */
  public async getPmpAccount(
    userId: UserId
  ): Promise<Result<PmpAccount, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.getPmpAccount(userId);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to retrieve PmpAmount account for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * PmcAmount 계정 정보 상세 조회
   *
   * @param userId 사용자 ID
   * @returns PmcAmount 계정 정보
   */
  public async getPmcAccount(
    userId: UserId
  ): Promise<Result<PmcAccount, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.getPmcAccount(userId);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to retrieve PmcAmount account for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * PmpAmount 잔액 충분성 확인
   *
   * @param userId 사용자 ID
   * @param requiredAmount 필요한 PmpAmount 금액
   * @returns 잔액 충분성 여부
   */
  public async canSpendPmp(
    userId: UserId,
    requiredAmount: number
  ): Promise<Result<boolean, EconomyKernelError>> {
    if (requiredAmount <= 0) {
      return failure(
        new EconomyKernelError(
          "Required amount must be positive",
          "INVALID_CURRENCY_TYPE"
        )
      );
    }

    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.hasSufficientPmp(userId, requiredAmount);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to check PmpAmount sufficiency for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * PmcAmount 잔액 충분성 확인
   *
   * @param userId 사용자 ID
   * @param requiredAmount 필요한 PmcAmount 금액
   * @returns 잔액 충분성 여부
   */
  public async canSpendPmc(
    userId: UserId,
    requiredAmount: number
  ): Promise<Result<boolean, EconomyKernelError>> {
    if (requiredAmount <= 0) {
      return failure(
        new EconomyKernelError(
          "Required amount must be positive",
          "INVALID_CURRENCY_TYPE"
        )
      );
    }

    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.hasSufficientPmc(userId, requiredAmount);
    } catch (error) {
      return failure(
        new EconomyKernelError(
          `Failed to check PmcAmount sufficiency for user ${userId}`,
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * 경제 시스템 전체 통계 조회
   *
   * @returns 시스템 통계
   */
  public async getSystemStats(): Promise<
    Result<EconomySystemStats, EconomyKernelError>
  > {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    try {
      return await repo.getSystemStats();
    } catch (error) {
      return failure(
        new EconomyKernelError(
          "Failed to retrieve system statistics",
          "REPOSITORY_ERROR",
          new Error(error instanceof Error ? error.message : String(error) )
        )
      );
    }
  }

  /**
   * 여러 사용자의 PmpAmount 잔액을 일괄 조회
   *
   * @param userIds 사용자 ID 배열
   * @returns 사용자별 PmpAmount 잔액 맵
   */
  public async getBulkPmpBalances(
    userIds: UserId[]
  ): Promise<Result<Map<UserId, number>, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    if (userIds.length === 0) {
      return success(new Map());
    }

    try {
      const balancePromises = userIds.map(async (userId) => {
        const balanceResult = await repo.getPmpBalance(userId);
        if (isFailure(balanceResult)) {
          throw new EconomyKernelError(
            `Failed to get PmpAmount balance for user ${userId}: ${balanceResult.error.message}`,
            "REPOSITORY_ERROR",
            balanceResult.error
          );
        }
        return [userId, balanceResult.data] as [UserId, number];
      });

      const balances = await Promise.all(balancePromises);
      return success(new Map(balances));
    } catch (error) {
      return failure(
        error instanceof EconomyKernelError
          ? error
          : new EconomyKernelError(
              "Failed to retrieve bulk PmpAmount balances",
              "REPOSITORY_ERROR",
              new Error(error instanceof Error ? error.message : String(error) )
            )
      );
    }
  }

  /**
   * 여러 사용자의 PmcAmount 잔액을 일괄 조회
   *
   * @param userIds 사용자 ID 배열
   * @returns 사용자별 PmcAmount 잔액 맵
   */
  public async getBulkPmcBalances(
    userIds: UserId[]
  ): Promise<Result<Map<UserId, number>, EconomyKernelError>> {
    const repositoryResult = this.ensureRepository();
    if (isFailure(repositoryResult)) {
      return failure(new EconomyKernelError(repositoryResult.error?.message || "Unknown error", "REPOSITORY_ERROR"));
    }
    const repo = repositoryResult.data;

    if (userIds.length === 0) {
      return success(new Map());
    }

    try {
      const balancePromises = userIds.map(async (userId) => {
        const balanceResult = await repo.getPmcBalance(userId);
        if (isFailure(balanceResult)) {
          throw new EconomyKernelError(
            `Failed to get PmcAmount balance for user ${userId}: ${balanceResult.error.message}`,
            "REPOSITORY_ERROR",
            balanceResult.error
          );
        }
        return [userId, balanceResult.data] as [UserId, number];
      });

      const balances = await Promise.all(balancePromises);
      return success(new Map(balances));
    } catch (error) {
      return failure(
        error instanceof EconomyKernelError
          ? error
          : new EconomyKernelError(
              "Failed to retrieve bulk PmcAmount balances",
              "REPOSITORY_ERROR",
              new Error(error instanceof Error ? error.message : String(error) )
            )
      );
    }
  }

  /**
   * 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    EconomyKernel.instance = null;
  }
}

/**
 * Economy Kernel 전역 인스턴스 획득 헬퍼 함수
 */
export const getEconomyKernel = (): EconomyKernel => {
  return EconomyKernel.getInstance();
};
