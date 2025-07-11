/**
 * Auth-Economy SDK 통합 클라이언트
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { SupabaseAuthService } from "../auth/services/supabase-auth.service";
import { SupabaseEconomyService } from "../economy/services/supabase-economy.service";
import type { AuthService, User, UserId } from "../auth/types";
import type {
  EconomyService,
  EconomicBalance,
  PmpAmount,
  PmcAmount,
  TransactionResult,
} from "../economy/types";
import type { Result, SdkConfig } from "../types";
import { EconomyError } from "../errors";

export interface AuthEconomyClientConfig extends SdkConfig {}

export interface AuthEconomyClient {
  auth: AuthService;
  economy: EconomyService;
  supabase: SupabaseClient;

  // === 통합 편의 메서드 ===
  getCurrentUserWithBalance(): Promise<
    Result<{ user: User; balance: EconomicBalance } | null, Error>
  >;
  syncAllData(): Promise<Result<void, Error>>;
}

/**
 * Auth-Economy SDK 통합 클라이언트 구현
 */
class AuthEconomyClientImpl implements AuthEconomyClient {
  public readonly auth: AuthService;
  public readonly economy: EconomyService;
  public readonly supabase: SupabaseClient;

  constructor(private readonly config: AuthEconomyClientConfig) {
    // Supabase 클라이언트 생성
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage:
          typeof globalThis !== "undefined" &&
          typeof globalThis.localStorage !== "undefined"
            ? globalThis.localStorage
            : undefined,
      },
    });

    // 인증 서비스 초기화
    this.auth = new SupabaseAuthService(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    // 경제 서비스 초기화 (옵션)
    if (config.enableEconomy !== false) {
      this.economy = new SupabaseEconomyService(this.supabase);
    } else {
      // 경제 기능 비활성화시 더미 서비스
      this.economy = new DisabledEconomyService();
    }
  }

  // === 통합 편의 메서드 구현 ===

  /**
   * 현재 사용자 정보와 경제 잔액을 함께 조회
   */
  async getCurrentUserWithBalance(): Promise<
    Result<{ user: User; balance: EconomicBalance } | null, Error>
  > {
    try {
      const userResult = await this.auth.getCurrentUser();
      if (!userResult.success) {
        return userResult;
      }

      if (!userResult.data) {
        return { success: true, data: null };
      }

      const balanceResult = await this.economy.getCombinedBalance(
        userResult.data.id
      );
      if (!balanceResult.success) {
        return {
          success: false,
          error: balanceResult.error || new Error("Failed to get balance"),
        };
      }

      return {
        success: true,
        data: {
          user: userResult.data,
          balance: balanceResult.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("사용자 및 잔액 조회 중 오류가 발생했습니다."),
      };
    }
  }

  /**
   * 모든 데이터 동기화 (크로스 앱 지원)
   */
  async syncAllData(): Promise<Result<void, Error>> {
    try {
      // 현재 구현에서는 단순히 성공 반환
      // 향후 크로스 앱 동기화 로직 추가 예정
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("데이터 동기화 중 오류가 발생했습니다."),
      };
    }
  }
}

/**
 * 경제 기능이 비활성화된 경우 사용하는 더미 서비스
 */
class DisabledEconomyService implements EconomyService {
  async getPmpAmountBalance(
    _userId: UserId
  ): Promise<Result<PmpAmount, EconomyError>> {
    return {
      success: false,
      error: new EconomyError("Economy service is disabled"),
    };
  }

  async getPmcAmountBalance(
    _userId: UserId
  ): Promise<Result<PmcAmount, EconomyError>> {
    return {
      success: false,
      error: new EconomyError("Economy service is disabled"),
    };
  }

  async getCombinedBalance(
    _userId: UserId
  ): Promise<Result<EconomicBalance, EconomyError>> {
    return {
      success: false,
      error: new EconomyError("Economy service is disabled"),
    };
  }

  async transferPmpAmount(
    _fromUserId: UserId,
    _toUserId: UserId,
    _amount: PmpAmount
  ): Promise<Result<TransactionResult, EconomyError>> {
    return {
      success: false,
      error: new EconomyError("Economy service is disabled"),
    };
  }

  async transferPmcAmount(
    _fromUserId: UserId,
    _toUserId: UserId,
    _amount: PmcAmount
  ): Promise<Result<TransactionResult, EconomyError>> {
    return {
      success: false,
      error: new EconomyError("Economy service is disabled"),
    };
  }
}

/**
 * Auth-Economy SDK 클라이언트 팩토리 함수
 */
export function createAuthEconomyClient(
  config: AuthEconomyClientConfig
): AuthEconomyClient {
  return new AuthEconomyClientImpl(config);
}

// === Export 타입들 ===
export type { AuthService } from "../auth/types";
export type { EconomyService } from "../economy/types";
