import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

/**
 * GET /api/economy/transactions
 * 현재 사용자의 PMP/PMC 거래 내역 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "로그인이 필요합니다.",
          },
        },
        { status: 401 }
      );
    }

    // 거래 내역 조회 (최근 50건)
    const { data: transactions, error: txError } = await supabase
      .schema("economy")
      .from("pmp_pmc_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (txError) {
      console.error("Transaction fetch error:", txError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "거래 내역 조회 중 오류가 발생했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // Array 방어 (Supabase schema access 이슈 대응)
    const txList = Array.isArray(transactions) ? transactions : [];

    return NextResponse.json({
      success: true,
      data: {
        transactions: txList.map((tx: {
          transaction_id: string;
          transaction_type: string;
          pmp_amount: number | null;
          pmc_amount: number | null;
          description: string;
          timestamp: string;
          metadata: Record<string, unknown> | null;
        }) => ({
          id: tx.transaction_id,
          type: tx.transaction_type,
          pmpAmount: tx.pmp_amount,
          pmcAmount: tx.pmc_amount,
          description: tx.description,
          timestamp: tx.timestamp,
          metadata: tx.metadata,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/economy/transactions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
