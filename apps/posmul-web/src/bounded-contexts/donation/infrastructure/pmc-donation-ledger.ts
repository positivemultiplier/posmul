import type { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type DeductPmcResult =
  | { ok: true; previousBalance: number; newBalance: number }
  | { ok: false; status: number; error: string };

/**
 * 기부 실행 전 사용자의 PMC 잔액을 검증하고 차감합니다.
 */
export async function deductPmcForDonation(
  supabase: ServerSupabaseClient,
  userId: string,
  pmcAmount: number
): Promise<DeductPmcResult> {
  const { data: account, error: accError } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmc_balance")
    .eq("user_id", userId)
    .single();

  if (accError || !account) {
    return { ok: false, status: 404, error: "경제 계정을 찾을 수 없습니다." };
  }

  const previousBalance = Number(account.pmc_balance) || 0;
  if (previousBalance < pmcAmount) {
    return {
      ok: false,
      status: 400,
      error: `PMC 잔액이 부족합니다. (보유: ${previousBalance.toLocaleString()} PMC, 필요: ${pmcAmount.toLocaleString()} PMC)`,
    };
  }

  const newBalance = previousBalance - pmcAmount;
  const { error: deductError } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({
      pmc_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (deductError) {
    return { ok: false, status: 500, error: "PMC 차감 처리에 실패했습니다." };
  }

  return { ok: true, previousBalance, newBalance };
}

/**
 * 후속 기부 기록 저장이 실패했을 때 차감한 PMC를 원복합니다.
 */
export async function rollbackPmcForDonation(
  supabase: ServerSupabaseClient,
  userId: string,
  previousBalance: number
): Promise<void> {
  await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({
      pmc_balance: previousBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * 기부 차감 내역을 economy.pmp_pmc_transactions 원장에 기록합니다.
 */
export async function recordDonationTransaction(params: {
  supabase: ServerSupabaseClient;
  userId: string;
  pmcAmount: number;
  description: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { supabase, userId, pmcAmount, description, metadata } = params;

  await supabase
    .schema("economy")
    .from("pmp_pmc_transactions")
    .insert({
      user_id: userId,
      transaction_type: "DONATION",
      pmc_amount: -pmcAmount,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    });
}

