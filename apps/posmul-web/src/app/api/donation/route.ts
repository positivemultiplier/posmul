import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

/**
 * POST /api/donation
 * PMC를 사용하여 기부 생성
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { instituteId, amount, isAnonymous = false, message = "" } = body;

    // 유효성 검사
    if (!instituteId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "기관 ID와 금액은 필수입니다.",
          },
        },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MINIMUM_AMOUNT",
            message: "최소 기부 금액은 100 PMC입니다.",
          },
        },
        { status: 400 }
      );
    }

    // 기관 정보 조회
    const { data: institute, error: instError } = await supabase
      .schema("donation")
      .from("donation_institutes")
      .select("id, name, category")
      .eq("id", instituteId)
      .eq("is_active", true)
      .single();

    const instData = Array.isArray(institute) ? institute[0] : institute;

    if (instError || !instData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSTITUTE_NOT_FOUND",
            message: "유효하지 않은 기부 기관입니다.",
          },
        },
        { status: 404 }
      );
    }

    // PMC 잔액 확인
    const { data: account, error: accError } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmc_balance")
      .eq("user_id", user.id)
      .single();

    const accData = Array.isArray(account) ? account[0] : account;

    if (accError || !accData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: "경제 계정을 찾을 수 없습니다.",
          },
        },
        { status: 404 }
      );
    }

    const pmcBalance = Number(accData.pmc_balance) || 0;

    if (pmcBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_BALANCE",
            message: `PMC 잔액이 부족합니다. (보유: ${pmcBalance.toLocaleString()}, 필요: ${amount.toLocaleString()})`,
          },
        },
        { status: 400 }
      );
    }

    // 트랜잭션 시작: PMC 차감 + 기부 생성
    // 1. PMC 차감
    const newBalance = pmcBalance - amount;
    const { error: updateError } = await supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({ pmc_balance: newBalance })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PMC_DEDUCTION_FAILED",
            message: "PMC 차감에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // 2. 기부 레코드 생성
    const { data: donation, error: donationError } = await supabase
      .schema("donation")
      .from("donations")
      .insert({
        donor_id: user.id,
        donation_type: "institute",
        amount: amount, // 표시 금액 (원화 환산 기준)
        pmc_amount: amount, // PMC 실제 사용량
        title: `${instData.name} 기부`,
        description: message || `${instData.name}에 대한 기부`,
        category: instData.category,
        status: "completed",
        institute_id: instituteId,
        is_anonymous: isAnonymous,
        support_message: message,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const donationData = Array.isArray(donation) ? donation[0] : donation;

    if (donationError || !donationData) {
      // 기부 생성 실패 시 PMC 롤백
      await supabase
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({ pmc_balance: pmcBalance })
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DONATION_CREATE_FAILED",
            message: "기부 생성에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // 3. 거래 내역 기록
    await supabase
      .schema("economy")
      .from("pmp_pmc_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "DONATION",
        pmc_amount: -amount,
        description: `${instData.name}에 기부`,
        timestamp: new Date().toISOString(),
        metadata: {
          donation_id: donationData.id,
          institute_id: instituteId,
          institute_name: instData.name,
        },
      });

    return NextResponse.json({
      success: true,
      data: {
        donationId: donationData.id,
        instituteName: instData.name,
        amount,
        newBalance,
      },
    });
  } catch (error) {
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

/**
 * GET /api/donation
 * 내 기부 내역 조회
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

    // 기부 내역 조회
    const { data: donations, error: donationError } = await supabase
      .schema("donation")
      .from("donations")
      .select(`
        id,
        donation_type,
        amount,
        pmc_amount,
        title,
        category,
        status,
        is_anonymous,
        created_at,
        completed_at
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (donationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: "기부 내역 조회에 실패했습니다.",
          },
        },
        { status: 500 }
      );
    }

    const donationList = Array.isArray(donations) ? donations : [];

    return NextResponse.json({
      success: true,
      data: {
        donations: donationList.map((d: {
          id: string;
          donation_type: string;
          amount: number;
          pmc_amount: number;
          title: string;
          category: string;
          status: string;
          is_anonymous: boolean;
          created_at: string;
          completed_at: string | null;
        }) => ({
          id: d.id,
          type: d.donation_type,
          amount: d.amount,
          pmcAmount: d.pmc_amount,
          title: d.title,
          category: d.category,
          status: d.status,
          isAnonymous: d.is_anonymous,
          createdAt: d.created_at,
          completedAt: d.completed_at,
        })),
        totalCount: donationList.length,
      },
    });
  } catch (error) {
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
