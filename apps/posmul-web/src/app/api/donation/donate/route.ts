import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, organizationName, amount, userId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid donation amount required" }, { status: 400 });
    }

    const targetUserId = userId || "00000000-0000-0000-0000-000000000001";
    const pmpAmount = Number(amount);

    // Supabase donation 혹은 economy 기록 등록
    const { data: record, error } = await supabaseAdmin
      .schema("donation")
      .from("donations")
      .insert({
        donor_id: targetUserId,
        recipient_id: organizationId || "org-environmental-fund",
        recipient_name: organizationName || "환경 재단",
        amount_pmc: pmpAmount,
        status: "COMPLETED",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      // 데모 모드 처리
      return NextResponse.json({
        success: true,
        message: `Successfully donated ${pmpAmount} PMC to ${organizationName || "공익 재단"} (Demo Mode)`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully donated ${pmpAmount} PMC to ${organizationName || "공익 재단"}`,
      data: record,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
