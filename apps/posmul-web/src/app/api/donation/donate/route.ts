import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deductPmcForDonation,
  recordDonationTransaction,
  rollbackPmcForDonation,
} from "@/bounded-contexts/donation/infrastructure/pmc-donation-ledger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { organizationId, organizationName, amount } = body;
    const pmcAmount = Number(amount);

    if (!Number.isFinite(pmcAmount) || pmcAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "유효한 기부 금액(PMC)이 필요합니다." },
        { status: 400 }
      );
    }

    const deductResult = await deductPmcForDonation(supabase, user.id, pmcAmount);
    if (deductResult.ok === false) {
      return NextResponse.json(
        { success: false, error: deductResult.error },
        { status: deductResult.status }
      );
    }

    const targetTitle = organizationName || "공익 재단";
    const { data: record, error: donationError } = await supabase
      .schema("donation")
      .from("donations")
      .insert({
        donor_id: user.id,
        donation_type: "direct",
        amount: pmcAmount,
        pmc_amount: pmcAmount,
        title: `${targetTitle} 기부`,
        description: `${targetTitle}에 즉시 기부`,
        category: "general",
        status: "completed",
        institute_id: organizationId || null,
        is_anonymous: false,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (donationError || !record) {
      await rollbackPmcForDonation(supabase, user.id, deductResult.previousBalance);
      return NextResponse.json(
        { success: false, error: donationError?.message || "기부 기록 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    await recordDonationTransaction({
      supabase,
      userId: user.id,
      pmcAmount,
      description: `${targetTitle}에 기부`,
      metadata: {
        source: "DIRECT_DONATION_MODAL",
        donation_id: record.id,
        organization_name: targetTitle,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${pmcAmount.toLocaleString()} PMC를 ${targetTitle}에 기부했습니다.`,
      data: {
        donationId: record.id,
        amount: pmcAmount,
        newBalance: deductResult.newBalance,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
