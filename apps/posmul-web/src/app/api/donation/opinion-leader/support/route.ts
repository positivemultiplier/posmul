/**
 * 오피니언 리더 직접 후원 API
 *
 * POST /api/donation/opinion-leader/support
 * Body: { leaderId: string, amount: number, message?: string }
 *
 * @author PosMul Development Team
 * @since 2025-11
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// 최소/최대 후원 금액
const MIN_SUPPORT_AMOUNT = 100;
const MAX_SUPPORT_AMOUNT = 10000000;

interface LeaderInfo {
  id: string;
  user_id: string;
  display_name: string;
  total_donations_influenced: string | number;
}

// PMC 전송 처리 헬퍼
async function processPmcTransfer(
  supabase: SupabaseClient,
  userId: string,
  leaderId: string,
  leaderUserId: string,
  amount: number,
  currentBalance: number
): Promise<{ success: boolean; error?: string }> {
  // 1. 후원자 PMC 차감
  const { error: deductError } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmc_balance: currentBalance - amount })
    .eq("user_id", userId);

  if (deductError) {
    // eslint-disable-next-line no-console
    console.error("PMC deduct error:", deductError);
    return { success: false, error: "후원 처리 중 오류가 발생했습니다." };
  }

  // 2. 리더 계좌에 PMC 추가
  const { data: leaderAccount } = await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmc_balance")
    .eq("user_id", leaderUserId)
    .single();

  const leaderBalance = Number(leaderAccount?.pmc_balance) || 0;

  await supabase
    .schema("economy")
    .from("pmp_pmc_accounts")
    .update({ pmc_balance: leaderBalance + amount })
    .eq("user_id", leaderUserId);

  return { success: true };
}

// 후원 기록 생성 헬퍼
async function createDonationRecord(
  supabase: SupabaseClient,
  userId: string,
  leader: LeaderInfo,
  amount: number,
  message?: string
): Promise<void> {
  const { error } = await supabase
    .schema("donation")
    .from("donations")
    .insert({
      donor_user_id: userId,
      amount: amount,
      donation_type: "opinion_leader",
      status: "completed",
      notes: message
        ? `${leader.display_name} 리더 후원: ${message}`
        : `${leader.display_name} 리더 직접 후원`,
      metadata: {
        opinion_leader_id: leader.id,
        opinion_leader_name: leader.display_name,
        support_message: message || null,
      },
    });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Donation record error:", error);
  }

  // 리더의 total_donations_influenced 증가
  const newInfluenced = Number(leader.total_donations_influenced) + amount;
  await supabase
    .schema("donation")
    .from("opinion_leaders")
    .update({ total_donations_influenced: newInfluenced })
    .eq("id", leader.id);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 요청 바디 파싱
    const body = await request.json();
    const { leaderId, amount, message } = body;

    // 유효성 검사
    if (!leaderId || typeof amount !== "number") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    if (amount < MIN_SUPPORT_AMOUNT || amount > MAX_SUPPORT_AMOUNT) {
      return NextResponse.json(
        { error: `후원 금액은 ${MIN_SUPPORT_AMOUNT}~${MAX_SUPPORT_AMOUNT.toLocaleString()} PMC 범위여야 합니다.` },
        { status: 400 }
      );
    }

    // 리더 존재 확인
    const { data: leader, error: leaderError } = await supabase
      .schema("donation")
      .from("opinion_leaders")
      .select("id, user_id, display_name, total_donations_influenced")
      .eq("id", leaderId)
      .eq("is_active", true)
      .single();

    if (leaderError || !leader) {
      return NextResponse.json({ error: "해당 리더를 찾을 수 없습니다." }, { status: 404 });
    }

    if (leader.user_id === user.id) {
      return NextResponse.json({ error: "자기 자신에게 후원할 수 없습니다." }, { status: 400 });
    }

    // 사용자 PMC 잔액 확인
    const { data: account, error: accountError } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmc_balance")
      .eq("user_id", user.id)
      .single();

    if (accountError) {
      return NextResponse.json({ error: "계좌 정보를 불러올 수 없습니다." }, { status: 500 });
    }

    const currentBalance = Number(account?.pmc_balance) || 0;
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: `PMC 잔액이 부족합니다. (현재: ${currentBalance.toLocaleString()} PMC)` },
        { status: 400 }
      );
    }

    // PMC 전송 처리
    const transferResult = await processPmcTransfer(
      supabase, user.id, leaderId, leader.user_id, amount, currentBalance
    );

    if (!transferResult.success) {
      return NextResponse.json({ error: transferResult.error }, { status: 500 });
    }

    // 기록 생성
    await createDonationRecord(supabase, user.id, leader, amount, message);

    return NextResponse.json({
      success: true,
      message: `${leader.display_name}님에게 ${amount.toLocaleString()} PMC 후원 완료!`,
      data: { leaderName: leader.display_name, amount, newBalance: currentBalance - amount },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Support API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// GET: 후원 내역 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get("leaderId");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    let query = supabase
      .schema("donation")
      .from("donations")
      .select("*")
      .eq("donor_user_id", user.id)
      .eq("donation_type", "opinion_leader")
      .order("created_at", { ascending: false })
      .limit(20);

    if (leaderId) {
      query = query.contains("metadata", { opinion_leader_id: leaderId });
    }

    const { data: donations, error } = await query;

    if (error) {
      return NextResponse.json({ error: "후원 내역을 불러올 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: donations || [] });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Support history API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
