import type { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type DeductPmcResult =
  | { ok: true; previousBalance: number; newBalance: number }
  | { ok: false; status: number; error: string };

/**
 * 기부 실행 전 사용자의 PMC 잔액을 원자적 원장 RPC(SELECT ... FOR UPDATE)로 검증하고 차감합니다.
 * Double-Spend Race Condition 및 비원자적 Read-Modify-Write를 차단합니다.
 */
export async function deductPmcForDonation(
  _supabase: ServerSupabaseClient,
  userId: string,
  pmcAmount: number
): Promise<DeductPmcResult> {
  if (!Number.isFinite(pmcAmount) || pmcAmount <= 0) {
    return { ok: false, status: 400, error: "유효한 기부 PMC 금액이 필요합니다." };
  }

  const { data: rpcResult, error: rpcError } = await supabaseAdmin
    .schema("economy")
    .rpc("execute_ledger_transaction", {
      p_user_id: userId,
      p_transaction_type: "DONATION",
      p_pmp_change: 0,
      p_pmc_change: -pmcAmount,
      p_description: `PMC 기부 차감 (${pmcAmount.toLocaleString()} PMC)`,
      p_metadata: { source: "donation_deduct" },
    });

  if (rpcError) {
    return { ok: false, status: 500, error: "PMC 차감 처리에 실패했습니다." };
  }

  const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
  if (!row?.success) {
    return {
      ok: false,
      status: 400,
      error: row?.message || "PMC 잔액이 부족합니다.",
    };
  }

  const newBalance = Number(row.new_pmc_balance ?? 0);
  return {
    ok: true,
    previousBalance: newBalance + pmcAmount,
    newBalance,
  };
}

/**
 * 후속 기부 기록 저장이 실패했을 때 차감한 금액만큼 상대 증감(+pmcAmount)으로 안전 보상 환불합니다.
 * (절대값 덮어쓰기 롤백 금지 — 동시 발생한 타 거래 잔액 유실 방지)
 */
export async function rollbackPmcForDonation(
  _supabase: ServerSupabaseClient,
  userId: string,
  previousBalance: number,
  refundAmount?: number
): Promise<void> {
  const delta = refundAmount && refundAmount > 0 ? refundAmount : 0;
  if (delta > 0) {
    await supabaseAdmin.schema("economy").rpc("execute_ledger_transaction", {
      p_user_id: userId,
      p_transaction_type: "DONATION_ROLLBACK",
      p_pmp_change: 0,
      p_pmc_change: delta,
      p_description: `기부 기록 실패 보상 환불 (+${delta.toLocaleString()} PMC)`,
      p_metadata: { source: "donation_rollback" },
    });
    return;
  }

  // 기존 시그니처 호환(3인자 호출처) — 차액 계산 대신 안전 조회 후 부족분만 보전
  const { data: acc } = await supabaseAdmin
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmc_balance")
    .eq("user_id", userId)
    .maybeSingle();

  const current = Number(acc?.pmc_balance ?? 0);
  const diff = previousBalance - current;
  if (diff > 0) {
    await supabaseAdmin.schema("economy").rpc("execute_ledger_transaction", {
      p_user_id: userId,
      p_transaction_type: "DONATION_ROLLBACK",
      p_pmp_change: 0,
      p_pmc_change: diff,
      p_description: `기부 기록 실패 보상 환불 (+${diff.toLocaleString()} PMC)`,
      p_metadata: { source: "donation_rollback_compat" },
    });
  }
}

/**
 * 기부 차감 시 execute_ledger_transaction RPC가 이미 원장을 기록하므로,
 * 추가 메타데이터 로깅이 필요할 때만 중복 금액 없이 감사 메모를 남깁니다.
 */
export async function recordDonationTransaction(_params: {
  supabase: ServerSupabaseClient;
  userId: string;
  pmcAmount: number;
  description: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  // deductPmcForDonation에서 execute_ledger_transaction이 이미 원장을 원자 기록함 (이중 원장 기록 방지)
}
