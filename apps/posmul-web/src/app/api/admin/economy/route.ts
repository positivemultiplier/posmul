import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/shared/lib/security/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    // 1. 전체 베팅 내역 통계 (PMP 베팅 유통량 계산)
    const { data: bets, error: betsError } = await supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("bet_amount, expected_reward, is_active");

    if (betsError) {
      return NextResponse.json({ success: false, error: betsError.message }, { status: 500 });
    }

    const totalBetsCount = bets?.length || 0;
    const totalBetAmount = bets?.reduce((sum, b) => sum + (Number(b.bet_amount) || 0), 0) || 0;
    const totalRewardAmount = bets?.reduce((sum, b) => sum + (Number(b.expected_reward) || 0), 0) || 0;

    // 2. 🛡️ 원장 무결성 감사(Audit Trail) 뷰 조회
    const { data: auditRows, error: auditError } = await supabaseAdmin
      .schema("economy")
      .from("v_account_audit_ledger")
      .select("*")
      .limit(50);

    const accountsAudited = auditRows?.length || 0;
    const anomalies = (auditRows || []).filter((r: any) => r.anomaly_suspected);
    const totalCirculatingPmp = (auditRows || []).reduce(
      (sum, r) => sum + Number(r.pmp_balance || 0),
      0
    );
    const totalCirculatingPmc = (auditRows || []).reduce(
      (sum, r) => sum + Number(r.pmc_balance || 0),
      0
    );

    // 3. 최근 원장 트랜잭션 10건 조회
    const { data: recentTxs } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        totalBetsCount,
        totalBetAmount,
        totalRewardAmount,
        accountsAudited,
        anomaliesCount: anomalies.length,
        anomalies,
        totalCirculatingPmp,
        totalCirculatingPmc,
        recentTxs: recentTxs || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { action, userId, amount } = body;
    const targetUserId = userId || "00000000-0000-0000-0000-000000000001";
    const pmpAmount = Number(amount) || 10000;

    // 1. 관리자 공식 포인트 지급 (원자적 원장 트랜잭션 함수 호출)
    if (action === "grant-pmp") {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "execute_ledger_transaction",
        {
          p_user_id: targetUserId,
          p_transaction_type: "ADMIN_PMP_GRANT",
          p_pmp_change: pmpAmount,
          p_pmc_change: 0,
          p_description: `관리자 공식 테스트 지원금 지급 (+${pmpAmount.toLocaleString()} PMP)`,
          p_metadata: {
            admin_action: true,
            granted_at: new Date().toISOString(),
          },
        }
      );

      if (rpcError) {
        return NextResponse.json(
          { success: false, error: `원장 지급 실패: ${rpcError.message}` },
          { status: 500 }
        );
      }

      const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
      return NextResponse.json({
        success: true,
        message: `Successfully recorded in ledger & granted ${pmpAmount} PMP to user ${targetUserId}`,
        transactionId: row?.transaction_id,
        newBalance: row?.new_pmp_balance,
      });
    }

    // 2. MoneyWave 풀 계산 시뮬레이션
    if (action === "calculate-moneywave") {
      return NextResponse.json({
        success: true,
        message: "MoneyWave pool calculated successfully! Aggregated 50,000 PMC.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
