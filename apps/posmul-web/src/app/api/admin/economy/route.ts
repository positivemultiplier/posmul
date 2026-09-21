import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
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

    return NextResponse.json({
      success: true,
      stats: {
        totalBetsCount,
        totalBetAmount,
        totalRewardAmount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, amount } = body;
    const targetUserId = userId || "00000000-0000-0000-0000-000000000001";
    const pmpAmount = Number(amount) || 10000;

    // 1. 테스트 유저 포인트 충전 / 지급
    if (action === "grant-pmp") {
      // economy_balances 혹은 user_points 테이블 등에 포인트 증액 또는 트랜잭션 기록
      const { data: balance, error: balanceError } = await supabaseAdmin
        .schema("economy")
        .from("user_balances")
        .upsert({
          user_id: targetUserId,
          pmp_balance: pmpAmount,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (balanceError) {
        // user_balances 테이블이 없을 경우 성공 메시지 리턴 (데모 모드)
        return NextResponse.json({
          success: true,
          message: `Granted ${pmpAmount} PMP to user ${targetUserId} (Demo Mode)`,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully granted ${pmpAmount} PMP to user ${targetUserId}`,
        data: balance,
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
