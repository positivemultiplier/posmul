/**
 * Supabase Economy Kernel Repository
 *
 * IEconomyKernelRepository 인터페이스의 Supabase 구현체
 * economy.pmp_pmc_accounts 테이블에서 PMP/PMC 잔액을 조회합니다. (Single Source of Truth)
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { Result, UserId } from "@posmul/auth-economy-sdk";
import { createClient } from "@supabase/supabase-js";
import {
  IEconomyKernelRepository,
  EconomyKernelError,
  PmpAccount,
  PmcAccount,
  EconomySystemStats,
} from "../services/economy-kernel.service";

/**
 * Supabase Economy Kernel Repository 구현체
 * DDD 원칙: economy.pmp_pmc_accounts가 잔고의 Single Source of Truth
 */
export class SupabaseEconomyKernelRepository implements IEconomyKernelRepository {
  private supabase;

  constructor() {
    // Service Role 클라이언트 생성 (RLS 우회 - 서버에서만 사용)
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }

  async getPmpBalance(userId: UserId): Promise<Result<number, EconomyKernelError>> {
    try {
      const { data, error } = await this.supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance")
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          success: false,
          error: new EconomyKernelError(
            `Failed to get PMP balance: ${error.message}`,
            "REPOSITORY_ERROR",
            new Error(error.message)
          ),
        };
      }

      if (!data) {
        return {
          success: false,
          error: new EconomyKernelError(
            `User not found: ${userId}`,
            "USER_NOT_FOUND"
          ),
        };
      }

      const balance = data.pmp_balance ? Number(data.pmp_balance) : 0;
      return { success: true, data: balance };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          `Exception in getPmpBalance: ${error instanceof Error ? error.message : String(error)}`,
          "REPOSITORY_ERROR",
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  async getPmcBalance(userId: UserId): Promise<Result<number, EconomyKernelError>> {
    try {
      const { data, error } = await this.supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmc_balance")
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          success: false,
          error: new EconomyKernelError(
            `Failed to get PMC balance: ${error.message}`,
            "REPOSITORY_ERROR",
            new Error(error.message)
          ),
        };
      }

      if (!data) {
        return {
          success: false,
          error: new EconomyKernelError(
            `User not found: ${userId}`,
            "USER_NOT_FOUND"
          ),
        };
      }

      const balance = data.pmc_balance ? Number(data.pmc_balance) : 0;
      return { success: true, data: balance };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          `Exception in getPmcBalance: ${error instanceof Error ? error.message : String(error)}`,
          "REPOSITORY_ERROR",
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  async getPmpAccount(userId: UserId): Promise<Result<PmpAccount, EconomyKernelError>> {
    try {
      const { data, error } = await this.supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("user_id, pmp_balance, created_at, updated_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          success: false,
          error: new EconomyKernelError(
            `Failed to get PMP account: ${error.message}`,
            "REPOSITORY_ERROR",
            new Error(error.message)
          ),
        };
      }

      if (!data) {
        return {
          success: false,
          error: new EconomyKernelError(
            `User not found: ${userId}`,
            "USER_NOT_FOUND"
          ),
        };
      }

      const account: PmpAccount = {
        userId: data.user_id as UserId,
        balance: data.pmp_balance ? Number(data.pmp_balance) : 0,
        totalEarned: 0, // MVP: 간단히 0으로 설정
        totalSpent: 0,
        lastActivityAt: new Date(data.updated_at),
        createdAt: new Date(data.created_at),
      };

      return { success: true, data: account };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          `Exception in getPmpAccount: ${error instanceof Error ? error.message : String(error)}`,
          "REPOSITORY_ERROR",
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  async getPmcAccount(userId: UserId): Promise<Result<PmcAccount, EconomyKernelError>> {
    try {
      const { data, error } = await this.supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("user_id, pmc_balance, created_at, updated_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          success: false,
          error: new EconomyKernelError(
            `Failed to get PMC account: ${error.message}`,
            "REPOSITORY_ERROR",
            new Error(error.message)
          ),
        };
      }

      if (!data) {
        return {
          success: false,
          error: new EconomyKernelError(
            `User not found: ${userId}`,
            "USER_NOT_FOUND"
          ),
        };
      }

      const account: PmcAccount = {
        userId: data.user_id as UserId,
        balance: data.pmc_balance ? Number(data.pmc_balance) : 0,
        totalEarned: 0,
        totalSpent: 0,
        lastActivityAt: new Date(data.updated_at),
        createdAt: new Date(data.created_at),
      };

      return { success: true, data: account };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          `Exception in getPmcAccount: ${error instanceof Error ? error.message : String(error)}`,
          "REPOSITORY_ERROR",
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  async getSystemStats(): Promise<Result<EconomySystemStats, EconomyKernelError>> {
    try {
      const { data, error } = await this.supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmp_balance, pmc_balance");

      if (error) {
        return {
          success: false,
          error: new EconomyKernelError(
            `Failed to get system stats: ${error.message}`,
            "REPOSITORY_ERROR",
            new Error(error.message)
          ),
        };
      }

      const stats: EconomySystemStats = {
        totalPmpSupply: (data || []).reduce((sum, row) => sum + (Number(row.pmp_balance) || 0), 0),
        totalPmcSupply: (data || []).reduce((sum, row) => sum + (Number(row.pmc_balance) || 0), 0),
        activeAccountCount: (data || []).length,
        totalTransactionCount: 0, // MVP: 트랜잭션 로그 없음
        lastUpdated: new Date(),
      };

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: new EconomyKernelError(
          `Exception in getSystemStats: ${error instanceof Error ? error.message : String(error)}`,
          "REPOSITORY_ERROR",
          error instanceof Error ? error : new Error(String(error))
        ),
      };
    }
  }

  async hasSufficientPmp(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>> {
    const balanceResult = await this.getPmpBalance(userId);
    if (!balanceResult.success) {
      return balanceResult as Result<boolean, EconomyKernelError>;
    }
    return { success: true, data: balanceResult.data >= amount };
  }

  async hasSufficientPmc(
    userId: UserId,
    amount: number
  ): Promise<Result<boolean, EconomyKernelError>> {
    const balanceResult = await this.getPmcBalance(userId);
    if (!balanceResult.success) {
      return balanceResult as Result<boolean, EconomyKernelError>;
    }
    return { success: true, data: balanceResult.data >= amount };
  }
}

/**
 * 싱글톤 인스턴스
 */
let repositoryInstance: SupabaseEconomyKernelRepository | null = null;

/**
 * Repository 인스턴스 획득 헬퍼 함수
 */
export function getSupabaseEconomyKernelRepository(): SupabaseEconomyKernelRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SupabaseEconomyKernelRepository();
  }
  return repositoryInstance;
}
