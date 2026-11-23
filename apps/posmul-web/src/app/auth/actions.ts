"use server";

/**
 * Auth Server Actions
 *
 * 인증 관련 서버 액션 (SDK를 통한 개발용 보너스 지급 포함)
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import { createClient } from "../../lib/supabase/server";
import { createAuthEconomyClient } from "@posmul/auth-economy-sdk";

export interface DevBonusResult {
  success: boolean;
  message: string;
  pmpBalance?: number;
  pmcBalance?: number;
  bonusGranted: boolean;
}

/**
 * 로그인 시 개발용 보너스 지급 (SDK 사용)
 * 개발 환경에서만 작동하며, 매 로그인마다 10,000 PMP/PMC 지급
 */
export async function grantDevLoginBonus(): Promise<DevBonusResult> {
  try {
    const supabase = await createClient();

    // 1. 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "인증된 사용자를 찾을 수 없습니다.",
        bonusGranted: false,
      };
    }

    // 2. SDK를 통해 개발 보너스 지급
    const sdkClient = createAuthEconomyClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      enableEconomy: true,
    });

    if (!sdkClient.economy.grantDevLoginBonus) {
      return {
        success: true,
        message: "개발 보너스 기능이 비활성화되어 있습니다.",
        bonusGranted: false,
      };
    }

    const result = await sdkClient.economy.grantDevLoginBonus(user.id as any);

    if (!result.success) {
      const errorResult = result as { success: false; error: { message?: string } };
      return {
        success: false,
        message: errorResult.error?.message || "보너스 지급 실패",
        bonusGranted: false,
      };
    }

    if (!result.data.bonusGranted) {
      return {
        success: true,
        message: "프로덕션 환경에서는 개발 보너스가 지급되지 않습니다.",
        bonusGranted: false,
      };
    }

    return {
      success: true,
      message: `개발 보너스 지급 완료! PMP: ${result.data.pmpBalance.toLocaleString()}, PMC: ${result.data.pmcBalance.toLocaleString()}`,
      pmpBalance: result.data.pmpBalance,
      pmcBalance: result.data.pmcBalance,
      bonusGranted: true,
    };
  } catch (error) {
    return {
      success: false,
      message: "보너스 지급 중 오류가 발생했습니다.",
      bonusGranted: false,
    };
  }
}

/**
 * 현재 사용자의 잔액 조회 (SDK 사용)
 */
export async function getUserBalance(): Promise<{
  pmp: number;
  pmc: number;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const sdkClient = createAuthEconomyClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      enableEconomy: true,
    });

    const result = await sdkClient.economy.getCombinedBalance(user.id as any);

    if (!result.success) return null;

    return {
      pmp: Number(result.data.pmp) || 0,
      pmc: Number(result.data.pmc) || 0,
    };
  } catch {
    return null;
  }
}
